import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const jwtSecret = process.env.JWT_SECRET || "your_jwt_secret_key";

const generateToken = (payload: object) => {
  return jwt.sign(payload, jwtSecret, { expiresIn: "1h" });
};

const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, jwtSecret);
  } catch (error) {
    return null;
  }
};

export { generateToken, verifyToken };
