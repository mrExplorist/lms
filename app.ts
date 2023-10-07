import cookieParser from "cookie-parser";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import { ErrorMiddleWare } from "./middleware/error";
import userRouter from "./routes/user-route";

require("dotenv").config();
export const app = express();

// body parser
app.use(express.json({ limit: "50mb" }));

// cookie parser
app.use(cookieParser());

// cors middleware for cross origin requests from client side

app.use(
  cors({
    origin: process.env.ORIGIN,
  }),
);

// Routes

app.use("/api/v1", userRouter);

// Testing api
app.get("/test", (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({
    success: true,
    message: "Hello from server, API is working",
  });
});

// unknown route
app.all("*", (req: Request, res: Response, next: NextFunction) => {
  const err = new Error(`Can't find ${req.originalUrl} on this server`) as any;
  err.statusCode = 404;
  next(err);
});

// error middleware
app.use(ErrorMiddleWare);
