import express from "express";
import { authorizeRoles, isAuthenticatedUser } from "../middleware/auth";
import userRouter from "./user-route";
import {
  editCourse,
  getAllCourses,
  getCourseById,
  uploadCourse,
} from "../controllers/course-controller";

//  create route for creating course and upload course

const courseRouter = express.Router();
// Now create a route for the same

// route for uploading course
courseRouter.post(
  "/create-course",
  isAuthenticatedUser,
  authorizeRoles("admin"), // only admin can create course in the db
  uploadCourse,
);

// route for editing course
courseRouter.put(
  "/edit-course/:id",
  isAuthenticatedUser,
  authorizeRoles("admin"), // only admin can edit course in the db
  editCourse,
);

// route for getting a course by id
courseRouter.get("/get-course/:id", getCourseById);

// Route for getting all courses
courseRouter.get("/get-courses", getAllCourses);

export default courseRouter;
