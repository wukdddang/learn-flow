import { useEffect, useMemo } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { CheckCircle, Clock, Calendar, TrendingUp } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useStore } from "@/app/lib/store";
import { PlanStatus, Stats } from "@/app/lib/types";
import {
  format,
  differenceInDays,
  startOfWeek,
  addDays,
} from "@/app/lib/date-utils";

export function StatsDashboard() {
  const { plans, studyLogs } = useStore();

  // 통계 계산
  const stats = useMemo<Stats>(() => {
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
      const dayStr = format(day, "E"); // 요일 (월, 화, 수, ...)

      // 해당 날짜의 총 공부 시간 계산
      const logsForDay = studyLogs.filter((log) => {
        const logDate = new Date(log.date);
        return format(logDate, "yyyy-MM-dd") === format(day, "yyyy-MM-dd");
      });

      const minutes = logsForDay.reduce((sum, log) => sum + log.duration, 0);

      return { day: dayStr, minutes };
    });

    return {
      totalStudyTime,
      completedPlans,
      inProgressPlans,
      dailyAverage,
      weeklyTrend: weeklyData,
    };
  }, [plans, studyLogs]);

  // 시간을 시간과 분으로 변환
  const formatHoursAndMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
      return `${hours}시간 ${mins > 0 ? `${mins}분` : ""}`;
    }
    return `${mins}분`;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">학습 통계</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Clock className="mr-2 h-4 w-4" />총 공부 시간
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatHoursAndMinutes(stats.totalStudyTime)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <CheckCircle className="mr-2 h-4 w-4" />
              완료한 계획
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedPlans}개</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Calendar className="mr-2 h-4 w-4" />
              진행 중인 계획
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgressPlans}개</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="mr-2 h-4 w-4" />
              일일 평균 공부
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatHoursAndMinutes(stats.dailyAverage)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>주간 공부 시간</CardTitle>
          <CardDescription>최근 7일 동안의 공부 시간 (분)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip
                  formatter={(value) => [`${value}분`, "공부 시간"]}
                  labelFormatter={(label) => `${label}요일`}
                />
                <Bar dataKey="minutes" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
