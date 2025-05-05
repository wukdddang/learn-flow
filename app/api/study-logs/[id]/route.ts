import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/src/lib/db";
import { StudyLog } from "@/src/lib/models";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

// 특정 공부 기록 가져오기
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await connectToDatabase();

    const studyLog = await StudyLog.findById(id);
    if (!studyLog) {
      return NextResponse.json(
        { error: "공부 기록을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json(studyLog);
  } catch (error) {
    console.error("공부 기록 조회 오류:", error);
    return NextResponse.json(
      { error: "공부 기록을 가져오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 공부 기록 업데이트
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();

    await connectToDatabase();

    const updatedStudyLog = await StudyLog.findByIdAndUpdate(id, body, {
      new: true,
    });
    if (!updatedStudyLog) {
      return NextResponse.json(
        { error: "공부 기록을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedStudyLog);
  } catch (error) {
    console.error("공부 기록 업데이트 오류:", error);
    return NextResponse.json(
      { error: "공부 기록을 업데이트하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 공부 기록 삭제
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await connectToDatabase();

    const deletedStudyLog = await StudyLog.findByIdAndDelete(id);
    if (!deletedStudyLog) {
      return NextResponse.json(
        { error: "공부 기록을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "공부 기록이 성공적으로 삭제되었습니다.",
    });
  } catch (error) {
    console.error("공부 기록 삭제 오류:", error);
    return NextResponse.json(
      { error: "공부 기록을 삭제하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
