import mongoose, { Schema } from "mongoose";
import { PlanStatus } from "../types";

// 스키마 정의
const studyLogSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    planId: {
      type: Schema.Types.ObjectId,
      ref: "Plan",
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const planSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(PlanStatus),
      default: PlanStatus.NOT_STARTED,
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    parentPlanId: {
      type: Schema.Types.ObjectId,
      ref: "Plan",
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// 이미 모델이 있으면 재사용, 없으면 생성
export const Plan = mongoose.models.Plan || mongoose.model("Plan", planSchema);
export const StudyLog =
  mongoose.models.StudyLog || mongoose.model("StudyLog", studyLogSchema);
