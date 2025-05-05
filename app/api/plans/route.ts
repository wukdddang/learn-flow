import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/src/lib/db";
import { Plan } from "@/src/lib/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// 모든 계획 가져오기 (사용자별)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    await connectToDatabase();
    const plans = await Plan.find({ userId: session.user.id }).sort({
      createdAt: -1,
    });
    return NextResponse.json(plans);
  } catch (error) {
    console.error("계획 조회 오류:", error);
    return NextResponse.json(
      { error: "계획을 가져오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 새 계획 생성
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const body = await request.json();
    await connectToDatabase();

    // 사용자 ID 추가
    const planData = {
      ...body,
      userId: session.user.id,
    };

    const newPlan = new Plan(planData);
    await newPlan.save();

    return NextResponse.json(newPlan, { status: 201 });
  } catch (error) {
    console.error("계획 생성 오류:", error);
    return NextResponse.json(
      { error: "계획을 생성하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
