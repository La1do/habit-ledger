import e from "express";
import authService from "../services/auth.service";
import type { Request, Response } from "express";
export const register = async (req: Request, res: Response) => {
  const { email, password } = req.body;
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

export default {
  register,
};