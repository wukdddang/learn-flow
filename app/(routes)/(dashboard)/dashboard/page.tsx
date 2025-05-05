"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudyLogList } from "@/src/components/study/study-log-list";
import { PomodoroTimer } from "@/src/components/pomodoro/pomodoro-timer";
import { StatsDashboard } from "@/src/components/stats/stats-dashboard";
import { TimelinePlanner } from "@/src/components/timeline/timeline-planner";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("timeline");

  return (
    <div className="container py-6 max-w-7xl mx-auto px-4">
      <h1 className="text-3xl font-bold mb-6">학습 관리 대시보드</h1>

      <Tabs defaultValue="plans" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger value="timeline">타임라인</TabsTrigger>
          <TabsTrigger value="studyLogs">공부 기록</TabsTrigger>
          <TabsTrigger value="pomodoro">뽀모도로</TabsTrigger>
          <TabsTrigger value="stats">통계</TabsTrigger>
        </TabsList>

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
