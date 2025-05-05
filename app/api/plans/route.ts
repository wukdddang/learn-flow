import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/src/lib/db";
import { Plan } from "@/src/lib/models";

// 모든 계획 가져오기
export async function GET() {
  try {
    await connectToDatabase();
    const plans = await Plan.find().sort({ createdAt: -1 });
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
    const body = await request.json();
    await connectToDatabase();

    const newPlan = new Plan(body);
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
