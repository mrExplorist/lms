require("dotenv").config();

import mongoose, { Schema, Document, Model } from "mongoose";

interface IComment extends Document {
  user: object;
  comment: string;
  commentReplies: IComment[];
}
interface IReview extends Document {
  user: object;
  rating: number;
  comment: string;
  commentReplies: IComment[];
}

interface ILink {
  title: string;
  url: string;
}

interface ICourseData extends Document {
  title: string;
  description: string;

  videoUrl: string;
  videoThumbnail: object;

  videoSection: string;
  videoLength: number;
  videoPlayer: string;
  links: ILink[];
  suggestion: string;
  questions: IComment[];
}

interface ICourse extends Document {
  name: string;
  description: string;
  price: number;
  estimatedPrice?: number;
  thumbnail: object;
  tags: string;
  level: string;
  demoUrl?: string;
  benefits: { title: string }[];
  prerequisites: { title: string }[];
  reviews: IReview[];
  courseData: ICourseData[];
  ratings?: number;
  purchasedBy?: number;
}

const reviewSchema: Schema<IReview> = new mongoose.Schema({
  user: Object,
  rating: {
    type: Number,

    default: 0,
  },
  comment: String,
});

const linkSchema: Schema<ILink> = new mongoose.Schema({
  title: String,
  url: String,
});

const commentSchema: Schema<IComment> = new mongoose.Schema({
  user: Object,
  comment: String,
  commentReplies: [Object],
});

const courseDataSchema: Schema<ICourseData> = new mongoose.Schema({
  title: String,
  description: String,

  videoUrl: String,

  videoSection: String,
  videoLength: Number,
  videoPlayer: String,
  links: [linkSchema],
  suggestion: String,
  questions: [commentSchema],
});

const courseSchema: Schema<ICourse> = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter course name"],
    trim: true,
  },
  description: {
    type: String,
    required: [true, "Please enter course description"],
  },
  price: {
    type: Number,
    required: [true, "Please enter course price"],
    default: 0.0,
  },
  estimatedPrice: {
    type: Number,
    default: 0.0,
  },
  thumbnail: {
    public_id: {
      type: String,
    },
    url: {
      type: String,
    },
  },
  tags: {
    type: String,
    required: [true, "Please enter course tags"],
  },
  level: {
    type: String,
    required: [true, "Please enter course level"],
  },
  demoUrl: {
    type: String,
    required: false,
  },
  benefits: [
    {
      title: String,
    },
  ],
  prerequisites: [
    {
      title: String,
    },
  ],
  reviews: [reviewSchema],
  courseData: [courseDataSchema],
  ratings: {
    type: Number,
    default: 0,
  },
  purchasedBy: {
    type: Number,
    default: 0,
  },
});

const CourseModal: Model<ICourse> = mongoose.model("Course", courseSchema);

export default CourseModal;
