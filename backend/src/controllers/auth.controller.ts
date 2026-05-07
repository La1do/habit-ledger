import authService from "../services/auth.service";
import type { Request, Response } from "express";

const REFRESH_COOKIE = "refreshToken";
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const register = async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };
  try {
    const user = await authService.register(email, password);
    res.status(201).json(user);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Something went wrong" });
    }
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };
  try {
    const { accessToken, refreshToken } = await authService.login(email, password);
    res.cookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTIONS);
    res.status(200).json({ accessToken });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Something went wrong" });
    }
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  const token = req.cookies[REFRESH_COOKIE] as string | undefined;
  if (!token) {
    res.status(401).json({ error: "No refresh token" });
    return;
  }
  try {
    const { accessToken } = authService.refreshAccessToken(token);
    res.status(200).json({ accessToken });
  } catch (error) {
    res.clearCookie(REFRESH_COOKIE);
    if (error instanceof Error) {
      res.status(401).json({ error: error.message });
    } else {
      res.status(401).json({ error: "Unauthorized" });
    }
  }
};

export const logout = (_req: Request, res: Response) => {
  res.clearCookie(REFRESH_COOKIE);
  res.status(200).json({ message: "Logged out" });
};

export default { register, login, refreshToken, logout };
