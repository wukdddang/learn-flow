import { useState, useMemo, useRef } from "react";
import { Plus, ChevronRight, ChevronDown, Calendar } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { PlanForm } from "../plan/plan-form";
import { Plan, PlanStatus } from "@/app/lib/types";
import { useStore } from "@/app/lib/store";
import { format, differenceInDays } from "@/app/lib/date-utils";

// 계획 상태에 따른 색상 지정 함수
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

// 날짜 포맷 함수
const formatDate = (date: Date) => {
  return format(date, "yyyy년 MM월 dd일");
};

// 타임라인 계획 아이템 컴포넌트
const TimelineItem = ({
  plan,
  allYearQuarters,
}: {
  plan: Plan;
  allYearQuarters: any[];
}) => {
  const startDate = new Date(plan.startDate);
  const endDate = new Date(plan.endDate);

  // 시작 분기와 종료 분기 찾기
  const startQuarter = allYearQuarters.find((q) => {
    const quarterStartMonth = q.months[0];
    const quarterEndMonth = q.months[2];
    const year = q.year;

    return (
      startDate.getFullYear() === year &&
      startDate.getMonth() + 1 >= quarterStartMonth &&
      startDate.getMonth() + 1 <= quarterEndMonth
    );
  });

  const endQuarter = allYearQuarters.find((q) => {
    const quarterStartMonth = q.months[0];
    const quarterEndMonth = q.months[2];
    const year = q.year;

    return (
      endDate.getFullYear() === year &&
      endDate.getMonth() + 1 >= quarterStartMonth &&
      endDate.getMonth() + 1 <= quarterEndMonth
    );
  });

  if (!startQuarter || !endQuarter) return null;

  // 시작 분기와 종료 분기의 인덱스 찾기
  const startQuarterIndex = allYearQuarters.findIndex(
    (q) => q.year === startQuarter.year && q.id === startQuarter.id
  );

  const endQuarterIndex = allYearQuarters.findIndex(
    (q) => q.year === endQuarter.year && q.id === endQuarter.id
  );

  // 분기 내 위치 계산 (0-1 사이의 값)
  const startMonthIndex = startQuarter.months.indexOf(startDate.getMonth() + 1);

  // 월 내 일 수 계산
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  const startMonthDays = getDaysInMonth(
    startDate.getFullYear(),
    startDate.getMonth() + 1
  );
  const endMonthDays = getDaysInMonth(
    endDate.getFullYear(),
    endDate.getMonth() + 1
  );

  // 날짜 위치 계산 (0.33px * 일수)
  const dayWidth = 0.33; // 1일당 0.33px

  // 월 간격 크기 (각 월의 최대 일수 * dayWidth)
  const monthWidth = 30 * dayWidth; // 고정된 월 크기

  // 시작일 위치 (월 내 상대적 위치)
  const startDayPosition = (startDate.getDate() - 1) * dayWidth;
  const endDayPosition = endDate.getDate() * dayWidth;

  // 시작 위치 (분기 내 상대적 위치)
  const startPosition =
    (startMonthIndex * monthWidth + startDayPosition) / (3 * monthWidth);

  // 종료 위치 (분기 내 상대적 위치)
  const endMonthIndex = endQuarter.months.indexOf(endDate.getMonth() + 1);
  const endPosition =
    (endMonthIndex * monthWidth + endDayPosition) / (3 * monthWidth);

  let leftPos, width;

  if (startQuarterIndex === endQuarterIndex) {
    // 같은 분기 내에 있는 경우
    leftPos = startQuarterIndex * 300 + startPosition * 300;

    // 같은 날짜인 경우 최소 너비 적용
    if (startDate.getTime() === endDate.getTime()) {
      width = 10; // 최소 너비
    } else {
      width = (endPosition - startPosition) * 300;
    }
  } else {
    // 다른 분기에 걸쳐 있는 경우
    leftPos = startQuarterIndex * 300 + startPosition * 300;
    width =
      (endQuarterIndex - startQuarterIndex) * 300 +
      endPosition * 300 -
      startPosition * 300;
  }

  // 상태에 따른 색상 결정
  const bgColor =
    plan.status === PlanStatus.COMPLETED
      ? "bg-green-200"
      : plan.status === PlanStatus.IN_PROGRESS
      ? "bg-blue-200"
      : plan.status === PlanStatus.CANCELED
      ? "bg-red-200"
      : "bg-gray-200";

  // 날짜 간 차이 계산
  const daysDiff = differenceInDays(endDate, startDate) + 1;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div
          className={`absolute rounded-lg border px-3 py-1 shadow-sm ${bgColor} cursor-pointer hover:brightness-95 transition-all`}
          style={{
            left: `${leftPos}px`,
            width: `${Math.max(width, 10)}px`, // 최소 너비 10px
            top: "4px",
            height: "32px",
          }}
        >
          <div className="text-xs font-medium truncate">{plan.name}</div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4">
        <div className="space-y-2">
          <h3 className="font-bold text-lg">{plan.name}</h3>
          {plan.description && (
            <p className="text-sm text-gray-600">{plan.description}</p>
          )}
          <div className="text-xs space-y-1">
            <div className="flex items-center">
              <Calendar className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
              <span>시작: {formatDate(startDate)}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
              <span>종료: {formatDate(endDate)}</span>
            </div>
            <div className="flex items-center mt-1">
              <span className="text-gray-500 mr-1.5">기간:</span>
              <span>{daysDiff}일</span>
            </div>
            <div className="flex items-center mt-1">
              <span className="text-gray-500 mr-1.5">상태:</span>
              <span
                className={`px-1.5 py-0.5 rounded text-xs ${getStatusColor(
                  plan.status
                )}`}
              >
                {plan.status}
              </span>
            </div>
            {plan.progress > 0 && (
              <div className="mt-2">
                <div className="flex justify-between text-xs mb-1">
                  <span>진행률</span>
                  <span>{plan.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full"
                    style={{ width: `${plan.progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export function TimelinePlanner() {
  const plans = useStore((state) => state.plans);
  const addPlan = useStore((state) => state.addPlan);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // 타임라인 표시 범위 (2025년부터 5년간)
  const startYear = 2025;
  const years = Array.from({ length: 5 }, (_, i) => startYear + i);

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

  // 이벤트 행 배치 계산
  const arrangedPlans = useMemo(() => {
    const rows: { plan: Plan; row: number; left: number; width: number }[][] =
      [];

    // 계획을 시작 날짜 순으로 정렬
    const sortedPlans = [...plans].sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    // 각 계획의 위치 계산
    sortedPlans.forEach((plan) => {
      const startDate = new Date(plan.startDate);
      const endDate = new Date(plan.endDate);

      // 시작 분기와 종료 분기 찾기
      const startQuarter = allYearQuarters.find((q) => {
        const quarterStartMonth = q.months[0];
        const quarterEndMonth = q.months[2];
        const year = q.year;

        return (
          startDate.getFullYear() === year &&
          startDate.getMonth() + 1 >= quarterStartMonth &&
          startDate.getMonth() + 1 <= quarterEndMonth
        );
      });

      const endQuarter = allYearQuarters.find((q) => {
        const quarterStartMonth = q.months[0];
        const quarterEndMonth = q.months[2];
        const year = q.year;

        return (
          endDate.getFullYear() === year &&
          endDate.getMonth() + 1 >= quarterStartMonth &&
          endDate.getMonth() + 1 <= quarterEndMonth
        );
      });

      if (!startQuarter || !endQuarter) return;

      // 시작 분기와 종료 분기의 인덱스 찾기
      const startQuarterIndex = allYearQuarters.findIndex(
        (q) => q.year === startQuarter.year && q.id === startQuarter.id
      );

      const endQuarterIndex = allYearQuarters.findIndex(
        (q) => q.year === endQuarter.year && q.id === endQuarter.id
      );

      // 분기 내 위치 계산
      const startMonthIndex = startQuarter.months.indexOf(
        startDate.getMonth() + 1
      );
      const endMonthIndex = endQuarter.months.indexOf(endDate.getMonth() + 1);

      // 날짜 위치 계산 (0.33px * 일수)
      const dayWidth = 0.33;
      const monthWidth = 30 * dayWidth;

      const startDayPosition = (startDate.getDate() - 1) * dayWidth;
      const endDayPosition = endDate.getDate() * dayWidth;

      // 시작 위치와 종료 위치 계산
      const startPosition =
        (startMonthIndex * monthWidth + startDayPosition) / (3 * monthWidth);
      const endPosition =
        (endMonthIndex * monthWidth + endDayPosition) / (3 * monthWidth);

      let leftPos, width;

      if (startQuarterIndex === endQuarterIndex) {
        leftPos = startQuarterIndex * 300 + startPosition * 300;
        if (startDate.getTime() === endDate.getTime()) {
          width = 10;
        } else {
          width = (endPosition - startPosition) * 300;
        }
      } else {
        leftPos = startQuarterIndex * 300 + startPosition * 300;
        width =
          (endQuarterIndex - startQuarterIndex) * 300 +
          endPosition * 300 -
          startPosition * 300;
      }

      // 이벤트 겹침 확인 및 행 결정
      let rowIndex = 0;
      let foundRow = false;

      while (!foundRow) {
        if (!rows[rowIndex]) {
          rows[rowIndex] = [];
          foundRow = true;
        } else {
          // 현재 행에 있는 모든 이벤트와 겹치는지 확인
          const hasOverlap = rows[rowIndex].some((item) => {
            const itemLeft = item.left;
            const itemRight = item.left + item.width;
            const eventLeft = leftPos;
            const eventRight = leftPos + width;

            // 겹침 여부 확인
            return (
              (eventLeft >= itemLeft && eventLeft <= itemRight) ||
              (eventRight >= itemLeft && eventRight <= itemRight) ||
              (eventLeft <= itemLeft && eventRight >= itemRight)
            );
          });

          if (!hasOverlap) {
            foundRow = true;
          } else {
            rowIndex++;
          }
        }
      }

      // 결정된 행에 이벤트 추가
      rows[rowIndex].push({
        plan,
        row: rowIndex,
        left: leftPos,
        width: Math.max(width, 10),
      });
    });

    // 모든 행의 이벤트 병합
    return rows.flat();
  }, [plans, allYearQuarters]);

  // 스크롤 참조
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 전체 타임라인 너비 계산 (각 분기별 최소 너비 300px)
  const timelineWidth = allYearQuarters.length * 300;

  return (
    <div className="relative flex flex-col h-[calc(100vh-12rem)]">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">타임라인 계획</h2>
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

      {/* 스크롤 컨테이너 */}
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
          {/* 현재 날짜 표시 (수직선) */}
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

            if (currentYearIndex === -1) return null;

            const currentQuarterIndex = quarters.findIndex(
              (q) => q.id === currentYearQuarter.id
            );
            const monthIndexInQuarter = currentYearQuarter.months.indexOf(
              today.getMonth() + 1
            );

            // 월 내 상대적 위치 (0-1 사이의 값)
            const dayPosition =
              (today.getDate() - 1) /
              new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

            const leftPosition =
              (currentYearIndex * 4 + currentQuarterIndex) * 300 +
              (monthIndexInQuarter + dayPosition) * (300 / 3);

            return (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20"
                style={{
                  left: `${leftPosition}px`,
                }}
              >
                <div className="absolute -top-6 -left-[12px] bg-red-500 text-white text-xs px-1 py-0.5 rounded"></div>
              </div>
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
                      className="text-center py-2 font-medium text-gray-700"
                      style={{
                        minWidth: `${300 * 4}px`,
                        flex: "1",
                        borderRight:
                          year !== years[years.length - 1]
                            ? "1px solid #e5e7eb"
                            : "none",
                      }}
                    >
                      {year}년
                    </div>
                  ))}
                </div>

                {/* 분기 및 월 표시 */}
                <div className="flex w-full">
                  {allYearQuarters.map((yearQuarter) => (
                    <div
                      key={`quarter-${yearQuarter.year}-q${yearQuarter.id}`}
                      className="relative border-r last:border-r-0 border-gray-200 py-2"
                      style={{ minWidth: "300px", flex: "1" }}
                    >
                      <div className="text-center text-sm">
                        <span className="font-medium">{yearQuarter.label}</span>
                        <span className="text-gray-500 ml-1">
                          {yearQuarter.range}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 계획 타임라인 */}
          <div className="mt-4 relative">
            {plans.length === 0 ? (
              <div className="text-center p-8 border rounded-md bg-gray-50">
                <p>계획이 없습니다. 새 계획을 생성해보세요!</p>
              </div>
            ) : (
              <div className="relative min-h-[100px] border bg-gray-50 rounded-md p-2">
                {arrangedPlans.map((item) => {
                  // 계획 상태에 따른 색상 결정
                  const bgColor =
                    item.plan.status === PlanStatus.COMPLETED
                      ? "bg-green-200"
                      : item.plan.status === PlanStatus.IN_PROGRESS
                      ? "bg-blue-200"
                      : item.plan.status === PlanStatus.CANCELED
                      ? "bg-red-200"
                      : "bg-gray-200";

                  // 날짜 간 차이 계산
                  const startDate = new Date(item.plan.startDate);
                  const endDate = new Date(item.plan.endDate);
                  const daysDiff = differenceInDays(endDate, startDate) + 1;

                  const rowHeight = 40; // 각 행의 높이
                  const rowSpacing = 8; // 행 간 간격

                  return (
                    <Popover key={item.plan.id}>
                      <PopoverTrigger asChild>
                        <div
                          className={`absolute rounded-lg border px-3 py-1 shadow-sm ${bgColor} cursor-pointer hover:brightness-95 transition-all`}
                          style={{
                            left: `${item.left}px`,
                            width: `${item.width}px`,
                            top: `${item.row * (rowHeight + rowSpacing) + 4}px`,
                            height: `${rowHeight - 8}px`, // 행 높이에서 약간의 패딩
                          }}
                        >
                          <div className="text-xs font-medium truncate">
                            {item.plan.name}
                          </div>
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className="w-72 p-4">
                        <div className="space-y-2">
                          <h3 className="font-bold text-lg">
                            {item.plan.name}
                          </h3>
                          {item.plan.description && (
                            <p className="text-sm text-gray-600">
                              {item.plan.description}
                            </p>
                          )}
                          <div className="text-xs space-y-1">
                            <div className="flex items-center">
                              <Calendar className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                              <span>시작: {formatDate(startDate)}</span>
                            </div>
                            <div className="flex items-center">
                              <Calendar className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                              <span>종료: {formatDate(endDate)}</span>
                            </div>
                            <div className="flex items-center mt-1">
                              <span className="text-gray-500 mr-1.5">
                                기간:
                              </span>
                              <span>{daysDiff}일</span>
                            </div>
                            <div className="flex items-center mt-1">
                              <span className="text-gray-500 mr-1.5">
                                상태:
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded text-xs ${getStatusColor(
                                  item.plan.status
                                )}`}
                              >
                                {item.plan.status}
                              </span>
                            </div>
                            {item.plan.progress > 0 && (
                              <div className="mt-2">
                                <div className="flex justify-between text-xs mb-1">
                                  <span>진행률</span>
                                  <span>{item.plan.progress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                  <div
                                    className="bg-blue-600 h-1.5 rounded-full"
                                    style={{ width: `${item.plan.progress}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
