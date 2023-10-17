import { Response } from "express";

import CourseModal from "../models/course-model";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";

// Create course

export const createCourse = CatchAsyncError(
  async (data: any, res: Response) => {
    const course = await CourseModal.create(data);

    return res.status(201).json({
      success: true,
      course,
    });
  },
);
