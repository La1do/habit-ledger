import prisma from "../config/prisma";
import bcrypt from "bcrypt";
import { generateToken, generateRefreshToken, verifyRefreshToken } from "../utils/jwt";
import { validateEmail, validatePassword } from "../utils/validation";

export const register = async (email: string, password: string) => {
  if (!validateEmail(email)) {
    throw new Error("Invalid email format");
  }
  if (!validatePassword(password)) {
    throw new Error(
      "Password must be at least 6 characters long and contain both letters and numbers",
    );
  }
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error("User already exists");
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, password: hashedPassword },
  });
  return user;
};

export const login = async (email: string, password: string) => {
  if (!validateEmail(email)) {
    throw new Error("Invalid email format");
  }
  if (!validatePassword(password)) {
    throw new Error(
      "Password must be at least 6 characters long and contain both letters and numbers",
    );
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error("Invalid email or password");
  }
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }
  const payload = { userId: user.id, email: user.email };
  const accessToken = generateToken(payload);
  const refreshToken = generateRefreshToken(payload);
  return { accessToken, refreshToken };
};

export const refreshAccessToken = (refreshToken: string) => {
  const payload = verifyRefreshToken(refreshToken);
  if (!payload) {
    throw new Error("Invalid or expired refresh token");
  }
  const accessToken = generateToken({ userId: payload.userId, email: payload.email });
  return { accessToken };
};

export default { register, login, refreshAccessToken };
