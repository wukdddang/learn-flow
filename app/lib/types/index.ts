export enum PlanStatus {
  NOT_STARTED = "미시작",
  IN_PROGRESS = "진행중",
  COMPLETED = "완료",
  CANCELED = "취소",
}

export interface Plan {
  id: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  status: PlanStatus;
  progress: number; // 0-100 진행률
  parentPlanId?: string; // 상위 계획 ID (있는 경우)
  subPlans?: Plan[]; // 하위 계획
  studyLogs?: StudyLog[]; // 관련 공부 기록
  color?: string; // 계획 색상
}

export interface StudyLog {
  id: string;
  title: string;
  content: string;
  date: Date;
  duration: number; // 공부 시간 (분)
  planId?: string; // 연결된 계획 ID (있는 경우)
}

export interface PomodoroSettings {
  workDuration: number; // 작업 시간 (분)
  breakDuration: number; // 휴식 시간 (분)
  longBreakDuration: number; // 긴 휴식 시간 (분)
  longBreakInterval: number; // 긴 휴식 간격 (세션 수)
}

export interface Stats {
  totalStudyTime: number; // 총 공부 시간 (분)
  completedPlans: number; // 완료된 계획 수
  inProgressPlans: number; // 진행 중인 계획 수
  dailyAverage: number; // 일일 평균 공부 시간 (분)
  weeklyTrend: { day: string; minutes: number }[]; // 주간 추세
}
