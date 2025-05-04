import { useState, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  SkipForward,
  Settings as SettingsIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useStore } from "@/app/lib/store";
import { PomodoroSettings } from "@/app/components/pomodoro/PomodoroSettings";

type TimerState = "idle" | "running" | "paused";
type TimerMode = "work" | "break" | "longBreak";

export function PomodoroTimer() {
  const pomodoroSettings = useStore((state) => state.pomodoroSettings);
  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [mode, setMode] = useState<TimerMode>("work");
  const [timeLeft, setTimeLeft] = useState(pomodoroSettings.workDuration * 60);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // 타이머 모드에 따른 총 시간 계산
  const getTotalTime = useCallback(() => {
    switch (mode) {
      case "work":
        return pomodoroSettings.workDuration * 60;
      case "break":
        return pomodoroSettings.breakDuration * 60;
      case "longBreak":
        return pomodoroSettings.longBreakDuration * 60;
    }
  }, [mode, pomodoroSettings]);

  // 모드 전환
  const switchMode = useCallback(() => {
    if (mode === "work") {
      // 작업 세션이 완료되면 세션 카운트 증가
      const newCompletedSessions = completedSessions + 1;
      setCompletedSessions(newCompletedSessions);

      // 긴 휴식 간격에 도달했는지 확인
      if (newCompletedSessions % pomodoroSettings.longBreakInterval === 0) {
        setMode("longBreak");
        setTimeLeft(pomodoroSettings.longBreakDuration * 60);
      } else {
        setMode("break");
        setTimeLeft(pomodoroSettings.breakDuration * 60);
      }
    } else {
      // 쉬는 시간이 끝나면 작업 모드로 돌아감
      setMode("work");
      setTimeLeft(pomodoroSettings.workDuration * 60);
    }

    // 모드 전환 시 타이머 상태 초기화
    setTimerState("idle");
  }, [mode, completedSessions, pomodoroSettings]);

  // 타이머 시작
  const startTimer = () => {
    if (timerState === "idle" && timeLeft === 0) {
      // 시간이 0이면 다음 모드로 전환하고 시작
      switchMode();
      setTimerState("running");
    } else {
      setTimerState("running");
    }
  };

  // 타이머 일시 정지
  const pauseTimer = () => {
    setTimerState("paused");
  };

  // 타이머 건너뛰기
  const skipTimer = () => {
    switchMode();
  };

  // 타이머 리셋
  const resetTimer = () => {
    setTimeLeft(getTotalTime());
    setTimerState("idle");
  };

  // 타이머 효과
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (timerState === "running") {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            // 시간이 다 되면 타이머 일시 정지하고 알림 표시
            clearInterval(interval!);

            // 브라우저 알림 요청 (사용자 허용 필요)
            if (Notification.permission === "granted") {
              new Notification(
                `${mode === "work" ? "작업 시간" : "휴식 시간"} 종료!`,
                {
                  body:
                    mode === "work"
                      ? "휴식 시간을 가지세요!"
                      : "다시 작업할 시간입니다!",
                }
              );
            }

            // 자동으로 다음 모드로 전환
            switchMode();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerState, mode, switchMode]);

  // 설정이 변경되면 현재 모드에 맞게 타이머 리셋
  useEffect(() => {
    resetTimer();
  }, [pomodoroSettings]);

  // 포맷팅된 타이머 시간 표시
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // 모드에 따른 타이틀과 색상
  const getModeInfo = () => {
    switch (mode) {
      case "work":
        return { title: "작업 시간", color: "bg-red-500" };
      case "break":
        return { title: "휴식 시간", color: "bg-green-500" };
      case "longBreak":
        return { title: "긴 휴식 시간", color: "bg-blue-500" };
    }
  };

  const modeInfo = getModeInfo();
  const progress = ((getTotalTime() - timeLeft) / getTotalTime()) * 100;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>뽀모도로 타이머</CardTitle>
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <SettingsIcon size={18} />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>타이머 설정</DialogTitle>
              </DialogHeader>
              <PomodoroSettings onClose={() => setIsSettingsOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
        <CardDescription>
          {completedSessions} 세션 완료 | 다음 긴 휴식까지{" "}
          {pomodoroSettings.longBreakInterval -
            (completedSessions % pomodoroSettings.longBreakInterval)}{" "}
          세션
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col items-center justify-center">
        <div className="relative w-60 h-60 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <div
            className={`absolute top-0 left-0 rounded-full ${modeInfo.color} opacity-20`}
            style={{
              width: "100%",
              height: "100%",
              clipPath: `circle(${progress}% at center)`,
            }}
          />
          <div className="text-center z-10">
            <div className="text-sm font-medium mb-2">{modeInfo.title}</div>
            <div className="text-4xl font-bold">{formatTime(timeLeft)}</div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-center space-x-2">
        {timerState === "running" ? (
          <Button onClick={pauseTimer}>
            <Pause size={16} className="mr-1" />
            일시정지
          </Button>
        ) : (
          <Button onClick={startTimer}>
            <Play size={16} className="mr-1" />
            {timerState === "paused" ? "계속하기" : "시작"}
          </Button>
        )}

        <Button variant="outline" onClick={skipTimer}>
          <SkipForward size={16} className="mr-1" />
          건너뛰기
        </Button>
      </CardFooter>
    </Card>
  );
}
