import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/db";
import { Plan } from "@/app/lib/models";

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

// 계획 업데이트
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    const body = await request.json();

    await connectToDatabase();

    const updatedPlan = await Plan.findByIdAndUpdate(id, body, { new: true });
    if (!updatedPlan) {
      return NextResponse.json(
        { error: "계획을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedPlan);
  } catch (error) {
    console.error("계획 업데이트 오류:", error);
    return NextResponse.json(
      { error: "계획을 업데이트하는 중 오류가 발생했습니다." },
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
