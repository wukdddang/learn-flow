import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/db";
import { Plan, StudyLog } from "@/app/lib/models";
import { PlanStatus } from "@/app/lib/types";
import {
  format,
  startOfWeek,
  addDays,
  differenceInDays,
} from "@/app/lib/date-utils";

// 통계 데이터 가져오기
export async function GET() {
  try {
    await connectToDatabase();

    // 모든 데이터 가져오기
    const [plans, studyLogs] = await Promise.all([
      Plan.find(),
      StudyLog.find().sort({ date: -1 }),
    ]);

    // 총 공부 시간
    const totalStudyTime = studyLogs.reduce(
      (total, log) => total + log.duration,
      0
    );

    // 완료된 계획 수
    const completedPlans = plans.filter(
      (plan) => plan.status === PlanStatus.COMPLETED
    ).length;

    // 진행 중인 계획 수
    const inProgressPlans = plans.filter(
      (plan) => plan.status === PlanStatus.IN_PROGRESS
    ).length;

    // 일일 평균 공부 시간
    let dailyAverage = 0;
    if (studyLogs.length > 0) {
      // 가장 오래된 로그와 최신 로그 사이의 일수 계산
      const sortedLogs = [...studyLogs].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      const oldestDate = new Date(sortedLogs[0].date);
      const newestDate = new Date(sortedLogs[sortedLogs.length - 1].date);
      const daysDiff = differenceInDays(newestDate, oldestDate) + 1; // 포함 일수

      dailyAverage = Math.round(totalStudyTime / (daysDiff || 1)); // 0으로 나누기 방지
    }

    // 주간 추세 계산
    const today = new Date();
    const weekStart = startOfWeek(today);
    const weeklyData = Array.from({ length: 7 }, (_, i) => {
      const day = addDays(weekStart, i);
      const dayStr = format(day, "E"); // 요일

      // 해당 날짜의 총 공부 시간 계산
      const logsForDay = studyLogs.filter((log) => {
        const logDate = new Date(log.date);
        return format(logDate, "yyyy-MM-dd") === format(day, "yyyy-MM-dd");
      });

      const minutes = logsForDay.reduce((sum, log) => sum + log.duration, 0);

      return { day: dayStr, minutes };
    });

    // 통계 데이터 반환
    const stats = {
      totalStudyTime,
      completedPlans,
      inProgressPlans,
      dailyAverage,
      weeklyTrend: weeklyData,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("통계 데이터 조회 오류:", error);
    return NextResponse.json(
      { error: "통계 데이터를 가져오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
