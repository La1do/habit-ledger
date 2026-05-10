import { Client } from "@notionhq/client";
import type { BlockObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import prisma from "../config/prisma";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ExtractedTask {
  notion_block_id: string;
  raw_title: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ─── Get all blocks from a Notion page (with pagination) ─────────────────────

export async function getPageBlocks(
  accessToken: string,
  pageId: string
): Promise<BlockObjectResponse[]> {
  const notion = new Client({ auth: accessToken });
  const allBlocks: BlockObjectResponse[] = [];
  let cursor: string | undefined;

  do {
    const response = await notion.blocks.children.list({
      block_id: pageId,
      start_cursor: cursor,
      page_size: 100,
    });

    const blocks = response.results.filter(
      (b): b is BlockObjectResponse => "type" in b
    );
    allBlocks.push(...blocks);

    cursor = response.next_cursor ?? undefined;

    // Rate limit safe: ~2.8 req/s
    if (response.has_more) {
      await delay(350);
    }
  } while (cursor);

  return allBlocks;
}

// ─── Parse to_do blocks — TypeScript thuần, không AI ─────────────────────────

export function parseToDoBlocks(blocks: BlockObjectResponse[]): ExtractedTask[] {
  return blocks
    .filter((block) => block.type === "to_do")
    .map((block) => {
      if (block.type !== "to_do") return null;

      const richText = block.to_do.rich_text;
      const rawTitle = richText
        .map((t) => t.plain_text)
        .join("")
        .trim();

      return {
        notion_block_id: block.id,
        raw_title: rawTitle,
      };
    })
    .filter((task): task is ExtractedTask => task !== null && task.raw_title.length > 0);
}

// ─── Upsert NotionTask records ────────────────────────────────────────────────

export async function upsertNotionTasks(
  connectionId: string,
  tasks: ExtractedTask[]
) {
  const results = await Promise.all(
    tasks.map((task) =>
      prisma.notionTask.upsert({
        where: { notion_block_id: task.notion_block_id },
        create: {
          connection_id: connectionId,
          notion_block_id: task.notion_block_id,
          raw_title: task.raw_title,
        },
        update: {
          raw_title: task.raw_title, // update title nếu user đổi trong Notion
        },
      })
    )
  );

  return results;
}
