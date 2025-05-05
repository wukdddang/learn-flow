import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/src/lib/db";
import { Plan } from "@/src/lib/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import mongoose from "mongoose";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

// 특정 계획 가져오기
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "유효하지 않은 계획 ID입니다." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const plan = await Plan.findById(id);

    if (!plan) {
      return NextResponse.json(
        { error: "계획을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 사용자 소유권 검증
    if (plan.userId.toString() !== session.user.id) {
      return NextResponse.json(
        { error: "이 계획에 접근할 권한이 없습니다." },
        { status: 403 }
      );
    }

    return NextResponse.json(plan);
  } catch (error) {
    console.error("계획 조회 오류:", error);
    return NextResponse.json(
      { error: "계획을 가져오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 계획 수정
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "유효하지 않은 계획 ID입니다." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // 계획이 존재하고 사용자가 소유자인지 확인
    const existingPlan = await Plan.findById(id);

    if (!existingPlan) {
      return NextResponse.json(
        { error: "계획을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 사용자 소유권 검증
    if (
      existingPlan.userId &&
      existingPlan.userId.toString() !== session.user.id
    ) {
      return NextResponse.json(
        { error: "이 계획을 수정할 권한이 없습니다." },
        { status: 403 }
      );
    }

    // 수정할 필드 지정
    const updateData = {
      name: body.name,
      description: body.description,
      startDate: body.startDate,
      endDate: body.endDate,
      status: body.status,
      progress: body.progress,
      color: body.color,
      // 기존 계획에 userId가 없는 경우 추가
      ...(existingPlan.userId ? {} : { userId: session.user.id }),
    };

    // undefined 값 제거
    Object.keys(updateData).forEach(
      (key) =>
        updateData[key as keyof typeof updateData] === undefined &&
        delete updateData[key as keyof typeof updateData]
    );

    const updatedPlan = await Plan.findByIdAndUpdate(id, updateData, {
      new: true, // 업데이트된 문서 반환
      runValidators: true, // 모델의 유효성 검사 실행
    });

    return NextResponse.json(updatedPlan);
  } catch (error) {
    console.error("계획 수정 오류:", error);
    return NextResponse.json(
      { error: "계획을 수정하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 계획 삭제
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "유효하지 않은 계획 ID입니다." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // 계획이 존재하고 사용자가 소유자인지 확인
    const existingPlan = await Plan.findById(id);

    if (!existingPlan) {
      return NextResponse.json(
        { error: "계획을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 사용자 소유권 검증
    if (existingPlan.userId.toString() !== session.user.id) {
      return NextResponse.json(
        { error: "이 계획을 삭제할 권한이 없습니다." },
        { status: 403 }
      );
    }

    await Plan.findByIdAndDelete(id);

    return NextResponse.json(
      { message: "계획이 성공적으로 삭제되었습니다." },
      { status: 200 }
    );
  } catch (error) {
    console.error("계획 삭제 오류:", error);
    return NextResponse.json(
      { error: "계획을 삭제하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 계획 업데이트
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await request.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "유효하지 않은 계획 ID입니다." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // 계획이 존재하고 사용자가 소유자인지 확인
    const existingPlan = await Plan.findById(id);

    if (!existingPlan) {
      return NextResponse.json(
        { error: "계획을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 사용자 소유권 검증
    if (existingPlan.userId.toString() !== session.user.id) {
      return NextResponse.json(
        { error: "이 계획을 수정할 권한이 없습니다." },
        { status: 403 }
      );
    }

    // userId 필드는 수정 불가능하도록 제외
    const { userId, ...updateData } = body;

    const updatedPlan = await Plan.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    return NextResponse.json(updatedPlan);
  } catch (error) {
    console.error("계획 업데이트 오류:", error);
    return NextResponse.json(
      { error: "계획을 업데이트하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
