import { Redis } from "ioredis";

require("dotenv").config();

const redisClient = () => {
  if (process.env.REDIS_URL) {
    console.log("Redis url is connected and is", process.env.REDIS_URL);
    return process.env.REDIS_URL;
  }
  throw new Error("Redis url is not defined");
};

export const redis = new Redis(redisClient());
