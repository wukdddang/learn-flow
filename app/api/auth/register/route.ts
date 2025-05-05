import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { connectToDatabase } from "@/src/lib/db";
import mongoose from "mongoose";

// 사용자 스키마 정의 (auth API와 동일한 스키마 사용)
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  image: { type: String },
  createdAt: { type: Date, default: Date.now },
});

// 모델이 이미 컴파일되었는지 확인
const User = mongoose.models.User || mongoose.model("User", userSchema);

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    // 필수 필드 확인
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "모든 필드를 입력해주세요" },
        { status: 400 }
      );
    }

    // 이메일 형식 확인
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "유효한 이메일 주소를 입력해주세요" },
        { status: 400 }
      );
    }

    // 비밀번호 길이 확인
    if (password.length < 8) {
      return NextResponse.json(
        { error: "비밀번호는 최소 8자 이상이어야 합니다" },
        { status: 400 }
      );
    }

    // DB 연결
    await connectToDatabase();

    // 이메일 중복 확인
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "이미 등록된 이메일입니다" },
        { status: 409 }
      );
    }

    // 비밀번호 해싱
    const hashedPassword = await hash(password, 10);

    // 사용자 생성
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    return NextResponse.json(
      {
        success: true,
        message: "회원가입 성공",
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("회원가입 오류:", error);
    return NextResponse.json(
      { error: "회원가입 처리 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
