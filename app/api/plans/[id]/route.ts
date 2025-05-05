import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/src/lib/db";
import { Plan } from "@/src/lib/models";

interface Params {
  params: {
    id: string;
  };
}

// 특정 계획 가져오기
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    await connectToDatabase();

    const plan = await Plan.findById(id);
    if (!plan) {
      return NextResponse.json(
        { error: "계획을 찾을 수 없습니다." },
        { status: 404 }
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
    const body = await request.json();
    await connectToDatabase();

    // 수정할 필드 지정
    const updateData = {
      name: body.name,
      description: body.description,
      startDate: body.startDate,
      endDate: body.endDate,
      status: body.status,
      progress: body.progress,
      color: body.color,
    };

    // undefined 값 제거
    Object.keys(updateData).forEach(
      (key) =>
        updateData[key as keyof typeof updateData] === undefined &&
        delete updateData[key as keyof typeof updateData]
    );

    const updatedPlan = await Plan.findByIdAndUpdate(params.id, updateData, {
      new: true, // 업데이트된 문서 반환
      runValidators: true, // 모델의 유효성 검사 실행
    });

    if (!updatedPlan) {
      return NextResponse.json(
        { error: "계획을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

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
    const { id } = params;
    await connectToDatabase();

    const deletedPlan = await Plan.findByIdAndDelete(id);
    if (!deletedPlan) {
      return NextResponse.json(
        { error: "계획을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 하위 계획도 삭제
    await Plan.deleteMany({ parentPlanId: id });

    return NextResponse.json({ message: "계획이 성공적으로 삭제되었습니다." });
  } catch (error) {
    console.error("계획 삭제 오류:", error);
    return NextResponse.json(
      { error: "계획을 삭제하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
