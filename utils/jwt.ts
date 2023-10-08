require("dotenv").config();

import { Response } from "express";
import { IUser } from "../models/user-model";
import { redis } from "./redis";

interface ITokenOptions {
  expiresIn: Date;
  maxAge: number;
  httpOnly: boolean;
  sameSite: "strict" | "lax" | "none" | undefined;
  secure?: boolean;
}

const accessTokenExpiresIn = parseInt(
  process.env.ACCESS_TOKEN_EXPIRES || "300",
  10,
);
const refreshTokenExpiresIn = parseInt(
  process.env.REFRESH_TOKEN_EXPIRES || "1200",
  10,
);

// set token options
export const accessTokenOptions: ITokenOptions = {
  expiresIn: new Date(Date.now() + accessTokenExpiresIn * 60 * 60 * 1000),
  maxAge: accessTokenExpiresIn * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production" ? true : false,
};

export const refreshTokenOptions: ITokenOptions = {
  expiresIn: new Date(Date.now() + refreshTokenExpiresIn * 24 * 60 * 60 * 1000),
  maxAge: refreshTokenExpiresIn * 24 * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production" ? true : false,
};

export const sendToken = (user: IUser, statusCode: number, res: Response) => {
  const accessToken = user.SignAccessToken();
  const refreshToken = user.SignRefreshToken();

  // uplaod session to redis database when user logs in successfully
  redis.set(
    `session:${user._id}`,
    JSON.stringify(user as any),
    "EX",
    60 * 60 * 24 * 30,
  );

  // parse envireonment variables to integer with fallback

  // set cookies
  res.cookie("accessToken", accessToken, accessTokenOptions);
  res.cookie("refreshToken", refreshToken, refreshTokenOptions);

  // send response
  res.status(statusCode).json({
    success: true,
    user,
    accessToken,
  });
};
