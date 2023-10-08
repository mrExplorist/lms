import { Request, Response, NextFunction } from "express";
import { CatchAsyncError } from "./catchAsyncErrors";
import ErrorHandler from "../utils/errorHandler";
import jwt from "jsonwebtoken";
import { redis } from "../utils/redis";

// Authenticated user
export const isAuthenticatedUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { accessToken } = req.cookies;

    if (!accessToken) {
      return next(
        new ErrorHandler(401, "Please login to access this resource"),
      );
    }

    const decoded = jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET as string,
    );

    if (!decoded) {
      return next(
        new ErrorHandler(401, "Access token is invalid or has expired"),
      );
    }

    const user = await redis.get(`session:${(decoded as any).id}`);

    if (!user) {
      return next(
        new ErrorHandler(401, "User Not Found, Please login to access"),
      );
    }

    req.user = JSON.parse(user);

    next();
  },
);

//  validate user role
export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user?.role || "")) {
      return next(
        new ErrorHandler(
          403,
          `Role (${req.user?.role}) is not allowed to access this resource`,
        ),
      );
    }
    next();
  };
};
