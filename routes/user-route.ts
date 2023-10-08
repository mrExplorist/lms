import express from "express";
import { authorizeRoles, isAuthenticatedUser } from "../middleware/auth";
import {
  activateUser,
  getUserInfo,
  loginUser,
  logoutUser,
  registerationUser,
  socialAuth,
  updateAccessToken,
} from "../controllers/user-controller";

const userRouter = express.Router();

userRouter.post("/registeration", registerationUser);
userRouter.post("/activate-user", activateUser);
userRouter.post("/login", loginUser);
userRouter.get("/logout", isAuthenticatedUser, logoutUser);
userRouter.get("/refresh", updateAccessToken);
userRouter.get("/me", isAuthenticatedUser, getUserInfo);
userRouter.post("/social-auth", socialAuth);

export default userRouter;
