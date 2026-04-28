import prisma from "../config/prisma";
import bcrypt from "bcrypt";
import { generateToken } from "../utils/jwt";
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
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });
  if (existingUser) {
    throw new Error("User already exists");
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
    },
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
  const user = await prisma.user.findUnique({
    where: { email },
  });
  if (!user) {
    throw new Error("Invalid email or password");
  }
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  } else {
    const payload = { userId: user.id, email: user.email };
    const token = generateToken(payload);
    return token;
  }
};

export default {
  register,
  login,
};
