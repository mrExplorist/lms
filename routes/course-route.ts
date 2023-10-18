import express from "express";
import { authorizeRoles, isAuthenticatedUser } from "../middleware/auth";
import userRouter from "./user-route";
import {
  addAnswer,
  addQuestion,
  editCourse,
  getAllCourses,
  getCourseByUser,
  getSingleCourse,
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
courseRouter.get("/get-course/:id", getSingleCourse);

// Route for getting all courses
courseRouter.get("/get-courses", getAllCourses);

// Get course-content by user
courseRouter.get(
  "/get-course-content/:id",
  isAuthenticatedUser,
  getCourseByUser,
);

// Add question to course content
courseRouter.put("/add-question", isAuthenticatedUser, addQuestion);

// Add answer to question
courseRouter.put("/add-answer", isAuthenticatedUser, addAnswer);

export default courseRouter;
