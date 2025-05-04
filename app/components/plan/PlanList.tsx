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
  status: PlanStatus,
  customColor?: string
) => {
  // 사용자 지정 색상이 있으면 우선 사용
  if (customColor) {
    return customColor;
  }

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

// 날짜가 해당하는 분기와 월 위치를 계산하는 함수
const getQuarterAndMonthPosition = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0~11
  const quarter = Math.floor(month / 3) + 1; // 1~4분기
  const monthInQuarter = month % 3; // 분기 내 월 위치 (0, 1, 2)
  const day = date.getDate(); // 1~31

  return { year, quarter, month: month + 1, monthInQuarter, day };
};

interface TimelinePlanItemProps {
  plan: Plan;
  level: number;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  dayWidth: number;
}

// 타임라인 계획 아이템 컴포넌트
function TimelinePlanItem({
  plan,
  level,
  startDate,
  endDate,
  totalDays,
  dayWidth,
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
    plan.status,
    plan.color
  );

  // 계획의 시작 날짜의 분기 및 월 위치 계산
  const startPosition = getQuarterAndMonthPosition(planStartDate);

  // 계획의 종료 날짜의 분기 및 월 위치 계산
  const endPosition = getQuarterAndMonthPosition(planEndDate);

  // 현재 년도 계산 및 표시 범위 설정
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  // 분기 정보
  const quarters = [
    { id: 1, months: [1, 2, 3], label: "1분기" },
    { id: 2, months: [4, 5, 6], label: "2분기" },
    { id: 3, months: [7, 8, 9], label: "3분기" },
    { id: 4, months: [10, 11, 12], label: "4분기" },
  ];

  // 모든 년도-분기 조합 생성
  const allYearQuarters = [];
  for (const year of years) {
    for (let quarter = 1; quarter <= 4; quarter++) {
      allYearQuarters.push({
        year,
        quarter,
        startMonth: (quarter - 1) * 3 + 1, // 분기 시작 월 (1, 4, 7, 10)
        endMonth: quarter * 3, // 분기 끝 월 (3, 6, 9, 12)
      });
    }
  }

  // 각 분기별 계획 표시 여부 및 위치 계산
  const quarterRenderInfo = allYearQuarters.map((yq) => {
    // 이 분기가 계획 기간과 겹치는지 확인
    const isStartInQuarter =
      yq.year === startPosition.year && yq.quarter === startPosition.quarter;
    const isEndInQuarter =
      yq.year === endPosition.year && yq.quarter === endPosition.quarter;
    const isMiddleQuarter =
      (yq.year > startPosition.year ||
        (yq.year === startPosition.year &&
          yq.quarter > startPosition.quarter)) &&
      (yq.year < endPosition.year ||
        (yq.year === endPosition.year && yq.quarter < endPosition.quarter));

    const shouldRender = isStartInQuarter || isEndInQuarter || isMiddleQuarter;

    // 위치 및 너비 계산
    let startPercent = 0;
    let widthPercent = 100;

    if (isStartInQuarter) {
      // 시작 월이 분기의 시작인지, 중간인지, 끝인지에 따라 위치 조정
      const monthPos = startPosition.monthInQuarter;
      // 월 위치에 따른 시작점 계산 (각 월은 분기의 1/3씩 차지)
      startPercent = monthPos * 33.33;

      // 일(day) 기준으로 위치 조정 (월 내 비율 계산)
      const daysInMonth = new Date(
        startPosition.year,
        startPosition.month,
        0
      ).getDate();
      const dayPercent = ((startPosition.day - 1) / daysInMonth) * 33.33;
      startPercent += dayPercent;

      if (isEndInQuarter) {
        // 같은 분기 내에서 시작하고 끝나는 경우
        const endMonthPos = endPosition.monthInQuarter;
        const endDayPercent =
          (endPosition.day /
            new Date(endPosition.year, endPosition.month, 0).getDate()) *
          33.33;
        const endPosition2 = endMonthPos * 33.33 + endDayPercent;
        widthPercent = endPosition2 - startPercent;
      } else {
        widthPercent = 100 - startPercent;
      }
    } else if (isEndInQuarter) {
      // 이 분기에서 끝나는 경우
      const endMonthPos = endPosition.monthInQuarter;
      const endDayPercent =
        (endPosition.day /
          new Date(endPosition.year, endPosition.month, 0).getDate()) *
        33.33;
      widthPercent = endMonthPos * 33.33 + endDayPercent;
    }

    return {
      shouldRender,
      isStartInQuarter,
      isEndInQuarter,
      startPercent,
      widthPercent,
    };
  });

  // 표시 범위를 벗어나는 경우
  const isInRange = quarterRenderInfo.some((info) => info.shouldRender);
  if (!isInRange) return null;

  return (
    <div
      className={`mb-2 ${level > 0 ? "ml-6" : ""} ${
        level === 0 ? "border-t border-b border-gray-200 py-2" : ""
      }`}
    >
      <div className="flex items-center group hover:bg-gray-50 rounded-md py-1">
        {/* 계획 제목 영역 */}
        <div className="w-48 flex-shrink-0 flex items-center pr-2 sticky left-0 bg-white z-10">
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

        {/* 분기별 타임라인 - 직사각형 영역으로 표시 */}
        <div className="flex-grow">
          <div
            className="flex w-full relative"
            style={{ minWidth: `${allYearQuarters.length * 300}px` }}
          >
            {allYearQuarters.map((yearQuarter, index) => {
              const renderInfo = quarterRenderInfo[index];

              return (
                <div
                  key={`${plan.id}-${yearQuarter.year}-q${yearQuarter.quarter}`}
                  className="flex-1 relative flex justify-center items-center"
                  style={{ minWidth: "300px" }}
                >
                  {/* 계획이 해당 분기 내에 있는 경우 직사각형으로 표시 */}
                  {renderInfo.shouldRender && (
                    <div
                      className={`h-8 ${timelineColor} rounded-md z-10 hover:opacity-80 transition-opacity relative`}
                      style={{
                        position: "absolute",
                        left: `${renderInfo.startPercent}%`,
                        width: `${renderInfo.widthPercent}%`,
                      }}
                      title={`${plan.name} (${format(
                        planStartDate,
                        "yyyy년 MM월 dd일"
                      )} ~ ${format(planEndDate, "yyyy년 MM월 dd일")})`}
                    >
                      {renderInfo.isStartInQuarter && (
                        <span className="text-xs text-white font-medium truncate px-2 absolute inset-0 flex items-center overflow-hidden">
                          {plan.name}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* 계획 정보 툴팁 (호버 시 표시) */}
            <div className="group-hover:opacity-100 opacity-0 absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-white p-2 rounded shadow-lg text-xs border z-30 max-w-xs">
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
                <p>상태: {plan.status}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 호버 시 표시되는 액션 버튼 */}
        <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
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
                  color: plan.color,
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
              dayWidth={dayWidth}
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
  const [zoomLevel, setZoomLevel] = useState(20); // 기본 날짜 너비를 20px로 설정

  // 타임라인 표시 범위
  const [timelineStartDate, setTimelineStartDate] = useState(() => {
    const now = new Date();
    const startYear = now.getFullYear() - 2;
    return new Date(startYear, 0, 1); // 2년 전 1월 1일부터 시작
  });

  const [timelineEndDate, setTimelineEndDate] = useState(() => {
    const now = new Date();
    const endYear = now.getFullYear() + 2;
    return new Date(endYear, 11, 31); // 2년 후 12월 31일까지
  });

  // 타임라인 날짜 범위 계산
  const totalDays = useMemo(() => {
    return differenceInDays(timelineEndDate, timelineStartDate) + 1;
  }, [timelineStartDate, timelineEndDate]);

  // 확대/축소 핸들러
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 5, 40)); // 최대 40px
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 5, 10)); // 최소 10px
  };

  // 현재 년도 계산 및 표시 범위 설정
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  // 분기 정보
  const quarters = [
    { id: 1, months: [1, 2, 3], label: "1분기" },
    { id: 2, months: [4, 5, 6], label: "2분기" },
    { id: 3, months: [7, 8, 9], label: "3분기" },
    { id: 4, months: [10, 11, 12], label: "4분기" },
  ];

  // 모든 년도-분기 조합 생성
  const allYearQuarters = useMemo(() => {
    const result = [];
    for (const year of years) {
      for (const quarter of quarters) {
        result.push({
          year,
          ...quarter,
        });
      }
    }
    return result;
  }, [years]);

  // 스크롤 참조 - 하나의 스크롤 컨테이너만 사용
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const topLevelPlans = useMemo(() => {
    return plans.filter((p) => !p.parentPlanId);
  }, [plans]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // 전체 타임라인 너비 계산 (각 분기별 최소 너비 300px)
  const timelineWidth = allYearQuarters.length * 300;

  return (
    <div className="relative flex flex-col h-[calc(100vh-12rem)]">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">나의 계획 로드맵</h2>
        <div className="flex space-x-2">
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
      </div>

      {/* 통합된 스크롤 컨테이너 */}
      <div
        className="flex-grow overflow-auto"
        ref={scrollContainerRef}
        style={{
          msOverflowStyle: "none",
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <div style={{ minWidth: `${timelineWidth}px` }}>
          {/* 타임라인 헤더 */}
          <div className="mb-6">
            <div className="relative border-b pb-2">
              <div className="flex flex-col">
                {/* 단일 행으로 모든 년도와 분기 표시 */}
                <div className="flex w-full">
                  {allYearQuarters.map((yearQuarter, index) => (
                    <div
                      key={`${yearQuarter.year}-q${yearQuarter.id}`}
                      className={`text-center py-2 font-medium border-r last:border-r-0 ${
                        yearQuarter.year === currentYear
                          ? "text-blue-600"
                          : "text-gray-500"
                      }`}
                      style={{ minWidth: "300px", flex: "1" }}
                    >
                      {yearQuarter.year}
                    </div>
                  ))}
                </div>

                {/* 분기 표시 */}
                <div className="flex w-full">
                  {allYearQuarters.map((yearQuarter, index) => (
                    <div
                      key={`quarter-${yearQuarter.year}-q${yearQuarter.id}`}
                      className={`relative border-t border-gray-200 py-2 ${
                        yearQuarter.year === currentYear &&
                        yearQuarter.id ===
                          Math.floor(new Date().getMonth() / 3 + 1)
                          ? "bg-blue-50"
                          : ""
                      }`}
                      style={{ minWidth: "300px", flex: "1" }}
                    >
                      <div className="text-center text-sm text-gray-500">
                        {yearQuarter.label}
                      </div>

                      {/* 월 표시 */}
                      <div className="flex justify-between px-4 mt-1">
                        {yearQuarter.months.map((month) => (
                          <div
                            key={`${yearQuarter.year}-${month}`}
                            className={`text-xs ${
                              yearQuarter.year === currentYear &&
                              month === new Date().getMonth() + 1
                                ? "text-blue-600 font-bold"
                                : "text-gray-400"
                            }`}
                          >
                            {month}월
                          </div>
                        ))}
                      </div>

                      {/* 현재 날짜 표시 */}
                      {yearQuarter.year === currentYear &&
                        yearQuarter.months.includes(
                          new Date().getMonth() + 1
                        ) && (
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-blue-500"
                            style={{
                              left: `${
                                (yearQuarter.months.indexOf(
                                  new Date().getMonth() + 1
                                ) /
                                  3) *
                                  100 +
                                100 / 6
                              }%`,
                            }}
                          >
                            <div className="absolute -top-6 -translate-x-1/2 bg-blue-500 text-white rounded-sm px-1 py-0.5 text-[10px]">
                              오늘
                            </div>
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 계획 목록 섹션 */}
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
                    dayWidth={zoomLevel}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
