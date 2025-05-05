import mongoose from "mongoose";

// 사용자 스키마 정의
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  image: { type: String },
  createdAt: { type: Date, default: Date.now },
});

// 모델이 이미 컴파일되었는지 확인
export const User = mongoose.models.User || mongoose.model("User", userSchema);
