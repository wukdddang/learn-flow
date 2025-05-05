import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/src/lib/db";
import { Plan } from "@/src/lib/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Admin-only endpoint to migrate existing plans to include userId
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // 인증 및 권한 체크 (간단한 구현: 첫 번째 사용자만 관리자로 간주)
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    await connectToDatabase();

    // userId가 없는 모든 계획 찾기
    const plansWithoutUserId = await Plan.find({ userId: { $exists: false } });

    if (plansWithoutUserId.length === 0) {
      return NextResponse.json({
        message: "모든 계획에 이미 userId 필드가 있습니다.",
        migratedCount: 0,
      });
    }

    // userId 필드 추가
    const updatePromises = plansWithoutUserId.map((plan) =>
      Plan.findByIdAndUpdate(plan._id, {
        $set: { userId: session.user.id },
      })
    );

    await Promise.all(updatePromises);

    return NextResponse.json({
      message: "마이그레이션이 완료되었습니다.",
      migratedCount: plansWithoutUserId.length,
      user: session.user.id,
    });
  } catch (error) {
    console.error("계획 마이그레이션 오류:", error);
    return NextResponse.json(
      { error: "계획 데이터 마이그레이션 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
