import { Client } from "@notionhq/client";
import prisma from "../config/prisma";
import { encrypt, decrypt } from "../utils/encrypt";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NotionTokenResponse {
  access_token: string;
  workspace_id: string;
  workspace_name: string;
  bot_id: string;
}

export interface NotionPage {
  page_id: string;
  title: string;
  url: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getNotionCredentials() {
  const clientId = process.env.NOTION_CLIENT_ID;
  const clientSecret = process.env.NOTION_CLIENT_SECRET;
  const redirectUri = process.env.NOTION_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      "[notion:oauth] Missing NOTION_CLIENT_ID, NOTION_CLIENT_SECRET, or NOTION_REDIRECT_URI"
    );
  }

  return { clientId, clientSecret, redirectUri };
}

// ─── Build OAuth URL ──────────────────────────────────────────────────────────

export function buildOAuthUrl(stateToken: string): string {
  const { clientId, redirectUri } = getNotionCredentials();

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    owner: "user",
    redirect_uri: redirectUri,
    state: stateToken,
  });

  return `https://api.notion.com/v1/oauth/authorize?${params.toString()}`;
}

// ─── Exchange code for token ──────────────────────────────────────────────────

export async function exchangeToken(code: string): Promise<NotionTokenResponse> {
  const { clientId, clientSecret, redirectUri } = getNotionCredentials();

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch("https://api.notion.com/v1/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`[notion:oauth] Token exchange failed: ${response.status} ${body}`);
  }

  const data = await response.json() as NotionTokenResponse;
  return data;
}

// ─── Upsert NotionConnection ──────────────────────────────────────────────────

export async function upsertConnection(
  userId: string,
  tokenResponse: NotionTokenResponse
) {
  // Encrypt token — never log raw access_token
  const encryptedToken = encrypt(tokenResponse.access_token);

  return prisma.notionConnection.upsert({
    where: { user_id: userId },
    create: {
      user_id: userId,
      access_token: encryptedToken,
      workspace_id: tokenResponse.workspace_id,
    },
    update: {
      access_token: encryptedToken,
      workspace_id: tokenResponse.workspace_id,
      page_id: null, // reset page selection on reconnect
    },
  });
}

// ─── List pages ───────────────────────────────────────────────────────────────

export async function listPages(userId: string): Promise<NotionPage[]> {
  const connection = await prisma.notionConnection.findUnique({
    where: { user_id: userId },
  });

  if (!connection) {
    throw new Error("[notion:oauth] No Notion connection found for user");
  }

  const accessToken = decrypt(connection.access_token);
  const notion = new Client({ auth: accessToken });

  const response = await notion.search({
    filter: { value: "page", property: "object" },
    sort: { direction: "descending", timestamp: "last_edited_time" },
    page_size: 50,
  });

  return response.results
    .filter((result) => result.object === "page")
    .map((page) => {
      // Extract title from page properties
      let title = "Untitled";

      if ("properties" in page) {
        const titleProp = Object.values(page.properties).find(
          (prop) => prop.type === "title"
        );
        if (titleProp && titleProp.type === "title" && titleProp.title.length > 0) {
          title = titleProp.title.map((t) => t.plain_text).join("").trim() || "Untitled";
        }
      }

      return {
        page_id: page.id,
        title,
        url: "url" in page ? page.url : "",
      };
    });
}

// ─── Select page ──────────────────────────────────────────────────────────────

export async function selectPage(userId: string, pageId: string): Promise<void> {
  const connection = await prisma.notionConnection.findUnique({
    where: { user_id: userId },
  });

  if (!connection) {
    throw new Error("[notion:oauth] No Notion connection found for user");
  }

  await prisma.notionConnection.update({
    where: { user_id: userId },
    data: { page_id: pageId },
  });
}

// ─── Get connection status ────────────────────────────────────────────────────

export async function getConnectionStatus(userId: string) {
  const connection = await prisma.notionConnection.findUnique({
    where: { user_id: userId },
    select: {
      workspace_id: true,
      page_id: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return connection
    ? { connected: true, workspace_id: connection.workspace_id, page_id: connection.page_id }
    : { connected: false };
}
