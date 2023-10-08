// Get user by id

import { Response } from "express";
import UserModel from "../models/user-model";

// GET /api/v1/users/:id
export const getUserById = async (id: string, res: Response) => {
  const user = await UserModel.findById(id);
  res.status(201).json({
    success: true,
    user,
  });
};
