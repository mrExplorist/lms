import { NextFunction, Request, Response } from "express";

import { CatchAsyncError } from "../middleware/catchAsyncErrors";

import ErrorHandler from "../utils/errorHandler";

import cloudinary from "cloudinary";
import { createCourse } from "../services/course-service";
import CourseModal from "../models/course-model";

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
export const getCourseById = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id;

      //Get the course data without the videoUrl, suggestion and questions fields in the courseData field of the course document in the database

      const course = await CourseModal.findById(courseId).select(
        "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links",
      );
      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
);

// Get all courses --- without purchasing

export const getAllCourses = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courses = await CourseModal.find().select(
        "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links",
      );
      res.status(200).json({
        success: true,
        courses,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
);
