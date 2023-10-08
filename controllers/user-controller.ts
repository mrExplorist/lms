require("dotenv").config();

import { NextFunction, Request, Response } from "express";

import jwt, { JwtPayload, Secret } from "jsonwebtoken";

import ejs from "ejs";
import path from "path";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import UserModel, { IUser } from "../models/user-model";
import { getUserById } from "../services/user-service";
import ErrorHandler from "../utils/errorHandler";
import {
  accessTokenOptions,
  refreshTokenOptions,
  sendToken,
} from "../utils/jwt";
import { redis } from "../utils/redis";
import sendMail from "../utils/sendMail";

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
  // Create 4 digit activation code
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

      // remove session from redis database
      await redis.del(`session:${req.user?._id}`);

      res.status(200).json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(400, error.message));
    }
  },
);

// Update access token
export const updateAccessToken = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refresh_token = req.cookies.refreshToken;

      const decoded = jwt.verify(
        refresh_token,
        process.env.REFRESH_TOKEN_SECRET! as string,
      ) as JwtPayload;

      if (!decoded) {
        return next(
          new ErrorHandler(401, "Could not refresh token, Please login again"),
        );
      }

      const session = await redis.get(`session:${(decoded as any).id}`);

      if (!session) {
        return next(
          new ErrorHandler(401, "User Not Found, Please login to access"),
        );
      }

      const user = JSON.parse(session);

      const accessToken = jwt.sign(
        { id: user._id },
        process.env.ACCESS_TOKEN_SECRET! as string,
        {
          expiresIn: "5m",
        },
      );

      // update refresh token
      const refreshToken = jwt.sign(
        { id: user._id },
        process.env.REFRESH_TOKEN_SECRET! as string,
        {
          expiresIn: "3d",
        },
      );

      req.user = user;

      res.cookie("access_token", accessToken, accessTokenOptions);
      res.cookie("refresh_token", refreshToken, refreshTokenOptions);

      res.status(200).json({
        success: true,
        accessToken,
      });
    } catch (error: any) {
      return next(new ErrorHandler(400, error.message));
    }
  },
);

// Get user user info

export const getUserInfo = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      getUserById(userId!, res);
    } catch (error: any) {
      return next(new ErrorHandler(400, error.message));
    }
  },
);

// social auth
interface ISocialAuthBody {
  name: string;
  email: string;
  avatar: string;
}
export const socialAuth = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, avatar } = req.body as ISocialAuthBody;

      // check if the email already exists
      const user = await UserModel.findOne({ email });
      if (user) {
        sendToken(user, 200, res);
      } else {
        const newUser = await UserModel.create({
          name,
          email,
          avatar,
        });
        sendToken(newUser, 200, res);
      }
    } catch (error: any) {
      return next(new ErrorHandler(400, error.message));
    }
  },
);

// Update user info
interface IUpdateUserInfoBody {
  name?: string;
  email?: string;
}

export const updateUserInfo = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      const { name, email } = req.body as IUpdateUserInfoBody;

      const user = await UserModel.findById(userId);

      if (!user) {
        return next(new ErrorHandler(404, "User not found"));
      }
      if (email && user) {
        const isEmailExist = await UserModel.findOne({ email });
        if (isEmailExist) {
          return next(new ErrorHandler(400, "Email already exists"));
        }
        user.email = email;
      }

      if (name && user) {
        user.name = name;
      }

      await user.save();

      // update user info in redis database
      await redis.set(`session:${userId}`, JSON.stringify(user));

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error: any) {
      return next(new ErrorHandler(400, error.message));
    }
  },
);
