require("dotenv").config();

import { NextFunction, Request, Response } from "express";

import jwt, { Secret } from "jsonwebtoken";

import UserModel, { IUser } from "../models/user-model";
import ErrorHandler from "../utils/errorHandler";
import ejs from "ejs";
import path from "path";
import sendMail from "../utils/sendMail";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import { sendToken } from "../utils/jwt";

// Register a user => /api/v1/register
interface IRegisterationBody {
  name: string;
  email: string;
  password: string;
  avatar?: string;
}

// Register a user
export const registerationUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password } = req.body;

      // check if the email already exists
      const isEmailExists = await UserModel.findOne({ email });
      if (isEmailExists) {
        return next(new ErrorHandler(400, "Email already exists"));
      }

      const user: IRegisterationBody = {
        name,
        email,
        password,
      };

      const activationToken = createActivationToken(user);
      const activationCode = activationToken.activationCode;
      const data = {
        user: {
          name: user.name,
        },
        activationCode,
      };

      const html = await ejs.renderFile(
        path.join(__dirname, "../mails/activation-mail.ejs"),
        data,
      );

      try {
        await sendMail({
          email: user.email,
          subject: "Activate your account",
          template: "activation-mail.ejs",
          data,
        });
        res.status(201).json({
          success: true,
          message: `Please Check your email: ${user.email} to activate your account`,
          activationToken: activationToken.token,
        });
      } catch (error: any) {
        return next(new ErrorHandler(400, error.message));
      }

      // res.status(201).json({
      //   success: true,
      //   message: "Account Registered Successfully",
      // });
    } catch (error: any) {
      return next(new ErrorHandler(400, error.message));
    }
  },
);

// Create activation token
interface IActivationToken {
  token: string;
  activationCode: string;
}

export const createActivationToken = (user: any): IActivationToken => {
  const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
  const token = jwt.sign(
    { user, activationCode },
    process.env.ACTIVATION_SECRET! as Secret,
    {
      expiresIn: "5m",
    },
  );

  return { token, activationCode };
};

// Activate User

interface IActivationRequest {
  activation_token: string;
  activation_code: string;
}

export const activateUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { activation_token, activation_code } =
        req.body as IActivationRequest;

      const newUser: { user: IUser; activationCode: string } = jwt.verify(
        activation_token,
        process.env.ACTIVATION_SECRET! as string,
      ) as { user: IUser; activationCode: string };
      if (newUser.activationCode !== activation_code) {
        return next(new ErrorHandler(400, "Invalid Activation Code"));
      }
      const { name, email, password } = newUser.user;
      const existUser = await UserModel.findOne({ email });
      if (existUser) {
        return next(new ErrorHandler(400, "Email already exists"));
      }

      const user = await UserModel.create({
        name,
        email,
        password,
      });
      res.status(201).json({
        success: true,
      });
    } catch (error: any) {
      return next(new ErrorHandler(400, error.message));
    }
  },
);

// Login User

interface ILoginRequest {
  email: string;
  password: string;
}

export const loginUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body as ILoginRequest;
      if (!email || !password) {
        return next(new ErrorHandler(400, "Please enter email & password"));
      }

      const user = await UserModel.findOne({ email }).select("+password");
      if (!user) {
        return next(new ErrorHandler(400, "Invalid Email or Password"));
      }

      // check if password is correct or not matched with the database password field value using comparePassword method
      const isPasswordMatched = await user.comparePassword(password);
      if (!isPasswordMatched) {
        return next(new ErrorHandler(400, "Invalid Email or Password"));
      }

      sendToken(user, 200, res);
    } catch (error: any) {
      return next(new ErrorHandler(400, error.message));
    }
  },
);

// Logout user
export const logoutUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // clear cookies
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");

      res.status(200).json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(400, error.message));
    }
  },
);
