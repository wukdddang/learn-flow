import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/src/lib/db";
import { StudyLog } from "@/src/lib/models";

// 모든 공부 기록 가져오기
export async function GET() {
  try {
    await connectToDatabase();
    const studyLogs = await StudyLog.find().sort({ date: -1 });
    return NextResponse.json(studyLogs);
  } catch (error) {
    console.error("공부 기록 조회 오류:", error);
    return NextResponse.json(
      { error: "공부 기록을 가져오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 새 공부 기록 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    await connectToDatabase();

    const newStudyLog = new StudyLog(body);
    await newStudyLog.save();

    return NextResponse.json(newStudyLog, { status: 201 });
  } catch (error) {
    console.error("공부 기록 생성 오류:", error);
    return NextResponse.json(
      { error: "공부 기록을 생성하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
