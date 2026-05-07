import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const accessSecret = process.env.JWT_SECRET || "your_access_token_secret";
const refreshSecret = process.env.JWT_REFRESH_SECRET || "your_refresh_token_secret";
const accessExpires = process.env.ACCESS_TOKEN_EXPIRES || "15m";
const refreshExpires = process.env.REFRESH_TOKEN_EXPIRES || "7d";

export interface JwtPayload {
  userId: string;
  email: string;
}

export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, accessSecret, { expiresIn: accessExpires } as jwt.SignOptions);
};

export const verifyToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, accessSecret) as JwtPayload;
  } catch {
    return null;
  }
};

export const generateRefreshToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, refreshSecret, { expiresIn: refreshExpires } as jwt.SignOptions);
};

export const verifyRefreshToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, refreshSecret) as JwtPayload;
  } catch {
    return null;
  }
};
