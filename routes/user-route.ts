import express from "express";
import {
  activateUser,
  registerationUser,
} from "../controllers/user-controller";

const userRouter = express.Router();

userRouter.post("/registeration", registerationUser);
userRouter.post("/activate-user", activateUser);

export default userRouter;
