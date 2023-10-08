// Get user by id

import { Response } from "express";
import { redis } from "../utils/redis";

// GET /api/v1/users/:id
export const getUserById = async (id: string, res: Response) => {
  const userJson = await redis.get(`session:${id}`);
  if (userJson) {
    const user = JSON.parse(userJson);
    return res.status(200).json({
      success: true,
      user,
    });
  }
};
