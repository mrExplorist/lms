import { NextFunction, Request, Response } from "express";

import { CatchAsyncError } from "../middleware/catchAsyncErrors";

import ErrorHandler from "../utils/errorHandler";

import cloudinary from "cloudinary";
import { createCourse } from "../services/course-service";
import CourseModal from "../models/course-model";
import { isAuthenticatedUser } from "../middleware/auth";
import { redis } from "../utils/redis";

// upload course
export const uploadCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const thumbnail = data.thumbnail;
      // when the thumbnail is not empty
      if (thumbnail) {
        const uploadResponse = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: "courses",
          width: 500,
          crop: "scale",
        });
        data.thumbnail = {
          public_id: uploadResponse.public_id,
          url: uploadResponse.secure_url,
        };
      }

      createCourse(data, res, next);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
);

// edit course

export const editCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const thumbnail = data.thumbnail;

      // update the course thumbnail if the thumbnail is not empty and delete the old thumbnail from the cloudinary

      if (thumbnail) {
        // delete the old thumbnail
        await cloudinary.v2.uploader.destroy(data.thumbnail.public_id);

        const uploadResponse = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: "courses",
        });
        data.thumbnail = {
          public_id: uploadResponse.public_id,
          url: uploadResponse.secure_url,
        };
      }

      // get the course id from the url params id and update the course with the new data and return the new course
      const courseId = req.params.id;
      const course = await CourseModal.findByIdAndUpdate(
        courseId,
        {
          $set: data,
        },
        { new: true },
      );

      res.status(201).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
);

// Get single course using course ID  --- without purchasing
export const getSingleCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id;

      // Search the course by id in the redis cache
      const isCacheExist = await redis.get(courseId);

      // console.log("Hitting the Redis Cache");

      // If the course is found in the redis cache then return the course from the redis cache
      if (isCacheExist) {
        const course = JSON.parse(isCacheExist);
        return res.status(200).json({
          success: true,
          course,
        });
      } else {
        // If the course is not found in the redis cache then search the course by id in the database and store the course in the redis cache
        const course = await CourseModal.findById(courseId).select(
          "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links",
        );

        // console.log("Hitting the MongoDB Db");

        await redis.set(courseId, JSON.stringify(course));
        res.status(200).json({
          success: true,
          course,
        });
      }

      //Get the course data without the videoUrl, suggestion and questions fields in the courseData field of the course document in the database
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
);

// Get all courses --- without purchasing

export const getAllCourses = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const isCacheExist = await redis.get("allCourses");
      if (isCacheExist) {
        const courses = JSON.parse(isCacheExist);
        // console.log("Hitting the Redis Cache");
        return res.status(200).json({
          success: true,
          courses,
        });
      }

      const courses = await CourseModal.find().select(
        "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links",
      );

      // console.log("Hitting the MongoDB Db");

      // Store the courses in the redis cache
      await redis.set("allCourses", JSON.stringify(courses));
      res.status(200).json({
        success: true,
        courses,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
);
