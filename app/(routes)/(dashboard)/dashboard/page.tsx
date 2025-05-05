"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlanList } from "@/app/components/plan/PlanList";
import { StudyLogList } from "@/app/components/study/StudyLogList";
import { PomodoroTimer } from "@/app/components/pomodoro/PomodoroTimer";
import { StatsDashboard } from "@/app/components/stats/StatsDashboard";
import { TimelinePlanner } from "@/app/components/timeline/TimelinePlanner";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("plans");

  return (
    <div className="container py-6 max-w-7xl mx-auto px-4">
      <h1 className="text-3xl font-bold mb-6">학습 관리 대시보드</h1>

      <Tabs defaultValue="plans" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 mb-8">
          <TabsTrigger value="plans">계획 관리</TabsTrigger>
          <TabsTrigger value="studyLogs">공부 기록</TabsTrigger>
          <TabsTrigger value="pomodoro">뽀모도로</TabsTrigger>
          <TabsTrigger value="stats">통계</TabsTrigger>
          <TabsTrigger value="timeline">타임라인</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="mt-6">
          <PlanList />
        </TabsContent>

        <TabsContent value="studyLogs" className="mt-6">
          <StudyLogList />
        </TabsContent>

        <TabsContent value="pomodoro" className="mt-6">
          <div className="flex justify-center">
            <PomodoroTimer />
          </div>
        </TabsContent>

        <TabsContent value="stats" className="mt-6">
          <StatsDashboard />
        </TabsContent>

        <TabsContent value="timeline" className="mt-6">
          <TimelinePlanner />
        </TabsContent>
      </Tabs>
    </div>
  );
}
