"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudyLogList } from "@/src/components/study/study-log-list";
import { PomodoroTimer } from "@/src/components/pomodoro/pomodoro-timer";
import { StatsDashboard } from "@/src/components/stats/stats-dashboard";
import { TimelinePlanner } from "@/src/components/timeline/timeline-planner";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "next-auth/react";
import { toast } from "sonner";
import { LogOut } from "lucide-react";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("timeline");
  const { data: session } = useSession();

  const handleLogout = async () => {
    try {
      await signOut({ callbackUrl: "/login" });
      toast.success("로그아웃 되었습니다.");
    } catch (error) {
      toast.error("로그아웃 중 오류가 발생했습니다.");
      console.error("로그아웃 오류:", error);
    }
  };

  return (
    <div className="container py-6 max-w-7xl mx-auto px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">학습 관리 대시보드</h1>
        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-600">
            {session?.user?.name || session?.user?.email}님 환영합니다
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="flex items-center gap-1"
          >
            <LogOut className="w-4 h-4 mr-1" />
            로그아웃
          </Button>
        </div>
      </div>

      <Tabs defaultValue="plans" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger value="timeline">타임라인</TabsTrigger>
          <TabsTrigger value="studyLogs">공부 기록</TabsTrigger>
          <TabsTrigger value="pomodoro">뽀모도로</TabsTrigger>
          <TabsTrigger value="stats">통계</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="mt-6">
          <TimelinePlanner />
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
      </Tabs>
    </div>
  );
}
