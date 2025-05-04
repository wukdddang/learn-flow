import { useState, useMemo, useEffect, useRef } from "react";
import {
  Plus,
  Edit,
  Trash,
  ChevronRight,
  ChevronDown,
  Calendar,
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
import { PlanForm } from "./PlanForm";
import { Plan, PlanStatus } from "@/app/lib/types";
import { useStore } from "@/app/lib/store";
import {
  format,
  differenceInDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isToday,
  isSameMonth,
  getMonth,
  getYear,
} from "@/app/lib/date-utils";

const getStatusColor = (status: PlanStatus) => {
  switch (status) {
    case PlanStatus.NOT_STARTED:
      return "bg-gray-200 text-gray-800";
    case PlanStatus.IN_PROGRESS:
      return "bg-blue-100 text-blue-800 border-blue-400";
    case PlanStatus.COMPLETED:
      return "bg-green-100 text-green-800 border-green-400";
    case PlanStatus.CANCELED:
      return "bg-red-100 text-red-800 border-red-400";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

// 계획 기간에 따른 색상 지정 함수
const getPlanTimelineColor = (
  startDate: Date,
  endDate: Date,
  status: PlanStatus
) => {
  if (status === PlanStatus.COMPLETED) {
    return "bg-green-500";
  } else if (status === PlanStatus.CANCELED) {
    return "bg-red-300";
  } else if (status === PlanStatus.IN_PROGRESS) {
    return "bg-blue-500";
  }

  const days = differenceInDays(new Date(endDate), new Date(startDate));

  // 기간별 색상 분류
  if (days <= 7) {
    return "bg-indigo-400"; // 1주일 이내
  } else if (days <= 30) {
    return "bg-purple-500"; // 1개월 이내
  } else if (days <= 90) {
    return "bg-violet-500"; // 3개월 이내
  } else {
    return "bg-pink-500"; // 장기 계획
  }
};

// 타임라인 계산 헬퍼 함수
const calculatePosition = (
  date: Date,
  startDate: Date,
  endDate: Date,
  width: number
) => {
  const start = startDate.getTime();
  const end = endDate.getTime();
  const target = date.getTime();

  // 범위를 벗어나는 경우 처리
  if (target < start) return 0;
  if (target > end) return width;

  return ((target - start) / (end - start)) * width;
};

interface TimelineProps {
  startDate: Date;
  endDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

// 타임라인 헤더 컴포넌트
function TimelineHeader({
  startDate,
  endDate,
  onPrevMonth,
  onNextMonth,
}: TimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [todayPosition, setTodayPosition] = useState<number | null>(null);

  // 월별 날짜 생성
  const days = useMemo(() => {
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [startDate, endDate]);

  // 월 그룹화
  const months = useMemo(() => {
    const result: { [key: string]: number } = {};
    days.forEach((day: Date) => {
      const monthKey = `${getYear(day)}-${getMonth(day)}`;
      if (!result[monthKey]) {
        result[monthKey] = 0;
      }
      result[monthKey]++;
    });
    return Object.entries(result).map(([key, count]) => {
      const [year, month] = key.split("-").map(Number);
      return {
        year,
        month,
        label: format(new Date(year, month), "yyyy년 M월"),
        days: count,
      };
    });
  }, [days]);

  // 오늘 날짜 위치 계산 (클라이언트 사이드에서만)
  useEffect(() => {
    if (timelineRef.current && days.some((day) => isToday(day))) {
      const timelineWidth = timelineRef.current.clientWidth;
      const today = new Date();
      const position = calculatePosition(
        today,
        startDate,
        endDate,
        timelineWidth
      );
      setTodayPosition(48 + position); // 48px는 왼쪽 여백 (계획 제목 영역)
    } else {
      setTodayPosition(null);
    }
  }, [startDate, endDate, days]);

  // 요일 한글 변환 함수
  const getDayOfWeekKorean = (date: Date) => {
    const dayOfWeek = format(date, "E");
    const dayOfWeekMap: { [key: string]: string } = {
      Mon: "월",
      Tue: "화",
      Wed: "수",
      Thu: "목",
      Fri: "금",
      Sat: "토",
      Sun: "일",
    };
    return dayOfWeekMap[dayOfWeek] || dayOfWeek;
  };

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-bold">나의 계획 로드맵</h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={onPrevMonth}>
            ← 이전 달
          </Button>
          <Button variant="outline" size="sm" onClick={onNextMonth}>
            다음 달 →
          </Button>
        </div>
      </div>

      <div className="relative border-b pb-2">
        <div className="flex">
          {/* 왼쪽 여백 (계획 제목 영역) */}
          <div className="w-48 flex-shrink-0"></div>

          {/* 월별 헤더 */}
          <div className="flex-grow overflow-hidden" ref={timelineRef}>
            <div className="flex">
              {months.map((month, idx) => (
                <div
                  key={`${month.year}-${month.month}`}
                  className="flex-grow text-center font-medium border-l first:border-l-0 text-sm py-1"
                  style={{ flexBasis: `${(month.days / days.length) * 100}%` }}
                >
                  {month.label}
                </div>
              ))}
            </div>

            {/* 개선된 일별 눈금 */}
            <div className="flex relative h-10 mt-1">
              {days.map((day, idx) => {
                const isCurrentDay = isToday(day);
                return (
                  <div
                    key={idx}
                    className={`border-l flex-1 relative ${
                      isCurrentDay
                        ? "border-red-500 border-l-2"
                        : idx % 5 === 0
                        ? "border-gray-300"
                        : "border-gray-100"
                    }`}
                  >
                    {/* 5일 간격 또는 오늘 날짜는 항상 날짜와 요일 표시 */}
                    {(idx % 5 === 0 || isCurrentDay) && (
                      <div
                        className={`absolute -top-1 -left-3 text-[10px] flex flex-col items-center ${
                          isCurrentDay
                            ? "text-red-500 font-bold"
                            : "text-gray-500"
                        }`}
                      >
                        <span>{format(day, "d")}</span>
                        <span className="font-medium">
                          {getDayOfWeekKorean(day)}
                        </span>
                      </div>
                    )}
                    {isCurrentDay && (
                      <div className="absolute -top-7 -left-7 bg-red-500 text-white rounded-sm px-1 py-0.5 text-[10px]">
                        오늘
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 오늘 날짜 세로선 */}
        {todayPosition !== null && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
            style={{ left: `${todayPosition}px` }}
          ></div>
        )}
      </div>
    </div>
  );
}

interface TimelinePlanItemProps {
  plan: Plan;
  level: number;
  startDate: Date;
  endDate: Date;
  totalDays: number;
}

// 타임라인 계획 아이템 컴포넌트
function TimelinePlanItem({
  plan,
  level,
  startDate,
  endDate,
  totalDays,
}: TimelinePlanItemProps) {
  const updatePlan = useStore((state) => state.updatePlan);
  const deletePlan = useStore((state) => state.deletePlan);
  const addSubPlan = useStore((state) => state.addSubPlan);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubPlanDialogOpen, setIsSubPlanDialogOpen] = useState(false);

  const hasSubPlans = plan.subPlans && plan.subPlans.length > 0;
  const planStartDate = new Date(plan.startDate);
  const planEndDate = new Date(plan.endDate);
  const timelineColor = getPlanTimelineColor(
    planStartDate,
    planEndDate,
    plan.status
  );

  // 막대의 위치와 너비 계산
  const startOffset = Math.max(0, differenceInDays(planStartDate, startDate));
  const planDuration = differenceInDays(planEndDate, planStartDate) + 1;
  const startPercentage = (startOffset / totalDays) * 100;
  const widthPercentage = (planDuration / totalDays) * 100;

  return (
    <div
      className={`mb-2 ${level > 0 ? "ml-6" : ""} ${
        level === 0 ? "border-t border-b border-gray-200 py-2" : ""
      }`}
    >
      <div className="flex items-center group hover:bg-gray-50 rounded-md py-1">
        {/* 계획 제목 영역 */}
        <div className="w-48 flex-shrink-0 flex items-center pr-2">
          <div className="flex items-center">
            {hasSubPlans && (
              <Button
                variant="ghost"
                size="sm"
                className="p-0 h-6 w-6"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <ChevronDown size={14} />
                ) : (
                  <ChevronRight size={14} />
                )}
              </Button>
            )}
            <span className="text-sm font-medium truncate" title={plan.name}>
              {plan.name}
            </span>
          </div>
        </div>

        {/* 타임라인 막대 영역 */}
        <div className="flex-grow relative h-8">
          <div
            className={`absolute top-1 h-6 rounded ${timelineColor} border border-white shadow-sm`}
            style={{
              left: `${startPercentage}%`,
              width: `${Math.max(widthPercentage, 1)}%`,
            }}
          >
            {/* 진행률 표시 */}
            <div
              className="h-full bg-white bg-opacity-30 flex items-center justify-center text-xs text-white"
              style={{ width: `${plan.progress}%` }}
            ></div>

            {/* 계획 정보 (넓이가 충분할 때만 표시) */}
            {widthPercentage > 15 && (
              <div className="absolute inset-0 flex items-center justify-between px-2 overflow-hidden">
                <span className="text-white text-xs truncate font-medium">
                  {plan.progress}%
                </span>
                <span
                  className={`px-1 py-0.5 rounded text-[10px] ${getStatusColor(
                    plan.status
                  )}`}
                >
                  {plan.status}
                </span>
              </div>
            )}
          </div>

          {/* 호버 시 표시되는 액션 버튼 */}
          <div className="absolute right-2 top-1 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
            <Dialog
              open={isSubPlanDialogOpen}
              onOpenChange={setIsSubPlanDialogOpen}
            >
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-6 w-6 rounded-full bg-white"
                >
                  <Plus size={12} />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>하위 계획 생성</DialogTitle>
                </DialogHeader>
                <PlanForm
                  initialValues={{
                    startDate: new Date(plan.startDate),
                    endDate: new Date(plan.endDate),
                  }}
                  onSubmit={(values) => {
                    addSubPlan(plan.id, values);
                    setIsSubPlanDialogOpen(false);
                    setIsExpanded(true);
                  }}
                  onCancel={() => setIsSubPlanDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-6 w-6 rounded-full bg-white"
                >
                  <Edit size={12} />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>계획 수정</DialogTitle>
                </DialogHeader>
                <PlanForm
                  initialValues={{
                    name: plan.name,
                    description: plan.description,
                    startDate: new Date(plan.startDate),
                    endDate: new Date(plan.endDate),
                  }}
                  onSubmit={(values) => {
                    updatePlan(plan.id, values);
                    setIsDialogOpen(false);
                  }}
                  onCancel={() => setIsDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              size="icon"
              className="h-6 w-6 rounded-full bg-white text-red-500"
              onClick={() => {
                if (confirm("정말로 이 계획을 삭제하시겠습니까?")) {
                  deletePlan(plan.id);
                }
              }}
            >
              <Trash size={12} />
            </Button>
          </div>
        </div>
      </div>

      {/* 계획 설명 툴팁 (호버 시 표시) */}
      <div className="group-hover:opacity-100 opacity-0 absolute bg-white p-2 rounded shadow-lg text-xs border z-10 max-w-xs">
        <p className="font-medium">{plan.name}</p>
        {plan.description && (
          <p className="text-gray-600 mt-1">{plan.description}</p>
        )}
        <div className="mt-1 text-gray-500">
          <p>
            {format(planStartDate, "yyyy년 MM월 dd일")} ~{" "}
            {format(planEndDate, "yyyy년 MM월 dd일")}
          </p>
          <p>진행률: {plan.progress}%</p>
        </div>
      </div>

      {/* 하위 계획 목록 */}
      {isExpanded && hasSubPlans && (
        <div className="mt-1">
          {plan.subPlans?.map((subPlan) => (
            <TimelinePlanItem
              key={subPlan.id}
              plan={subPlan}
              level={level + 1}
              startDate={startDate}
              endDate={endDate}
              totalDays={totalDays}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function PlanList() {
  const plans = useStore((state) => state.plans);
  const addPlan = useStore((state) => state.addPlan);

  // 타임라인 표시 범위 (3개월)
  const [timelineStartDate, setTimelineStartDate] = useState(() => {
    const now = new Date();
    return startOfMonth(subMonths(now, 1));
  });

  const [timelineEndDate, setTimelineEndDate] = useState(() => {
    const now = new Date();
    return endOfMonth(addMonths(now, 1));
  });

  // 타임라인 날짜 범위 계산
  const totalDays = useMemo(() => {
    return differenceInDays(timelineEndDate, timelineStartDate) + 1;
  }, [timelineStartDate, timelineEndDate]);

  // 월 이동 핸들러
  const handlePrevMonth = () => {
    setTimelineStartDate((prev) => startOfMonth(subMonths(prev, 1)));
    setTimelineEndDate((prev) => endOfMonth(subMonths(prev, 1)));
  };

  const handleNextMonth = () => {
    setTimelineStartDate((prev) => startOfMonth(addMonths(prev, 1)));
    setTimelineEndDate((prev) => endOfMonth(addMonths(prev, 1)));
  };

  const topLevelPlans = useMemo(() => {
    return plans.filter((p) => !p.parentPlanId);
  }, [plans]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="relative">
      {/* 타임라인 헤더 */}
      <TimelineHeader
        startDate={timelineStartDate}
        endDate={timelineEndDate}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
      />

      {/* 신규 계획 추가 버튼 */}
      <div className="absolute top-0 right-0">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus size={16} className="mr-1" />새 계획 생성
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 계획 생성</DialogTitle>
            </DialogHeader>
            <PlanForm
              initialValues={{
                startDate: new Date(),
                endDate: new Date(),
              }}
              onSubmit={(values) => {
                addPlan(values);
                setIsDialogOpen(false);
              }}
              onCancel={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* 계획 목록 */}
      <div className="mt-4">
        {topLevelPlans.length === 0 ? (
          <div className="text-center p-8 border rounded-md bg-gray-50">
            <p>계획이 없습니다. 새 계획을 생성해보세요!</p>
          </div>
        ) : (
          <div>
            {topLevelPlans.map((plan) => (
              <TimelinePlanItem
                key={plan.id}
                plan={plan}
                level={0}
                startDate={timelineStartDate}
                endDate={timelineEndDate}
                totalDays={totalDays}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
