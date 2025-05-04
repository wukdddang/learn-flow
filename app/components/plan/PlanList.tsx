import { useState, useMemo, useRef } from "react";
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
import { TimelinePlanItem } from "./TimelinePlanItem";
import { format, differenceInDays } from "@/app/lib/date-utils";

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
    { id: 1, months: [1, 2, 3], label: "1분기", range: "1월~3월" },
    { id: 2, months: [4, 5, 6], label: "2분기", range: "4월~6월" },
    { id: 3, months: [7, 8, 9], label: "3분기", range: "7월~9월" },
    { id: 4, months: [10, 11, 12], label: "4분기", range: "10월~12월" },
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
        <div style={{ minWidth: `${timelineWidth}px` }} className="relative">
          {/* 현재 날짜 표시 (전체 타임라인에 적용) */}
          {(() => {
            const today = new Date();
            const currentYearQuarter = allYearQuarters.find(
              (q) =>
                q.year === today.getFullYear() &&
                q.months.includes(today.getMonth() + 1)
            );

            if (!currentYearQuarter) return null;

            const currentYearIndex = years.findIndex(
              (y) => y === today.getFullYear()
            );
            const currentQuarterIndex = quarters.findIndex(
              (q) => q.id === currentYearQuarter.id
            );
            const monthIndexInQuarter = currentYearQuarter.months.indexOf(
              today.getMonth() + 1
            );

            const leftPosition =
              (currentYearIndex * 4 + currentQuarterIndex) * 300 +
              (monthIndexInQuarter / 3) * 300 +
              50;

            return (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-blue-500"
                style={{
                  left: `${leftPosition}px`,
                  zIndex: 10,
                }}
              />
            );
          })()}

          {/* 타임라인 헤더 */}
          <div className="mb-6">
            <div className="relative border-b pb-2">
              <div className="flex flex-col">
                {/* 년도 표시 */}
                <div className="flex w-full border-b">
                  {years.map((year) => (
                    <div
                      key={`year-${year}`}
                      className={`text-center py-2 font-medium ${
                        year === currentYear ? "text-blue-600" : "text-gray-500"
                      }`}
                      style={{
                        minWidth: `${300 * 4}px`,
                        flex: "1",
                        borderRight:
                          year !== years[years.length - 1]
                            ? "1px solid #e5e7eb"
                            : "none",
                      }}
                    >
                      {year}
                    </div>
                  ))}
                </div>

                {/* 분기 및 월 표시 */}
                <div className="flex w-full">
                  {allYearQuarters.map((yearQuarter) => (
                    <div
                      key={`quarter-${yearQuarter.year}-q${yearQuarter.id}`}
                      className={`relative border-r last:border-r-0 border-gray-200 py-2 ${
                        yearQuarter.year === currentYear &&
                        yearQuarter.id ===
                          Math.floor(new Date().getMonth() / 3 + 1)
                          ? "bg-blue-50"
                          : ""
                      }`}
                      style={{ minWidth: "300px", flex: "1" }}
                    >
                      <div className="text-center text-sm">
                        <span className="font-medium">{yearQuarter.label}</span>
                        <span className="text-gray-500 ml-1">
                          {quarters[yearQuarter.id - 1].range}
                        </span>
                      </div>
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
