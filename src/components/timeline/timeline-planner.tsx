import { useState, useMemo, useRef, useEffect } from "react";
import {
  Plus,
  ChevronRight,
  ChevronDown,
  Calendar,
  Loader2,
  Edit2,
} from "lucide-react";

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
import { CreatePlanDialog } from "../../dialog/create-plan-dialog";
import { CreateSubPlanDialog } from "../../dialog/create-subplan-dialog";
import { EditPlan } from "../../dialog/edit-plan-dialog";
import { Plan, PlanStatus } from "@/src/lib/types";
import { format, differenceInDays } from "@/src/lib/date-utils";

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
  onAddSubPlan,
  isParent = false,
}: {
  plan: Plan;
  allYearQuarters: any[];
  onAddSubPlan?: (parentPlan: Plan) => void;
  isParent?: boolean;
}) => {
  const [isHovered, setIsHovered] = useState(false);
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

  // 상태에 따른 색상 결정 - 최상위 계획은 색상을 더 진하게
  const bgColor = isParent
    ? plan.status === PlanStatus.COMPLETED
      ? "bg-green-300 border-green-500"
      : plan.status === PlanStatus.IN_PROGRESS
      ? "bg-blue-300 border-blue-500"
      : plan.status === PlanStatus.CANCELED
      ? "bg-red-300 border-red-500"
      : "bg-gray-300 border-gray-500"
    : plan.status === PlanStatus.COMPLETED
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
          className={`absolute rounded-lg border px-3 py-1 shadow-sm ${bgColor} cursor-pointer hover:brightness-95 transition-all ${
            isParent ? "border-2" : ""
          }`}
          style={{
            left: `${leftPos}px`,
            width: `${Math.max(width, 10)}px`, // 최소 너비 10px
            top: "4px",
            height: "32px",
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="flex items-center justify-between h-full">
            <div className="text-xs font-medium truncate">{plan.name}</div>
            {isParent && isHovered && onAddSubPlan && (
              <button
                className="ml-1 p-0.5 bg-white rounded-full hover:bg-gray-100 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddSubPlan(plan);
                }}
                title="하위 계획 추가"
              >
                <Plus size={14} className="text-blue-500" />
              </button>
            )}
          </div>
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
            {isParent && (
              <div className="flex items-center mt-1">
                <span className="text-gray-500 mr-1.5">유형:</span>
                <span className="px-1.5 py-0.5 rounded text-xs bg-purple-100 text-purple-800">
                  최상위 계획
                </span>
              </div>
            )}
            {!isParent && (
              <div className="flex items-center mt-1">
                <span className="text-gray-500 mr-1.5">유형:</span>
                <span className="px-1.5 py-0.5 rounded text-xs bg-blue-50 text-blue-800">
                  하위 계획
                </span>
              </div>
            )}
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
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [parentPlanForSubPlan, setParentPlanForSubPlan] = useState<Plan | null>(
    null
  );
  const [isSubPlanDialogOpen, setIsSubPlanDialogOpen] = useState(false);
  const [expandedPlans, setExpandedPlans] = useState<Record<string, boolean>>(
    {}
  );

  // 데이터베이스에서 계획 데이터 가져오기
  const fetchPlans = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/plans");

      if (!response.ok) {
        throw new Error("계획을 가져오는데 실패했습니다.");
      }

      const data = await response.json();
      // MongoDB의 _id 값을 id로 매핑
      const plansWithId = data.map((plan: any) => ({
        ...plan,
        id: plan._id || plan.id, // _id가 있으면 사용하고, 없으면 기존 id 사용
      }));
      setPlans(plansWithId);
      setError(null);
    } catch (err) {
      console.error("계획 가져오기 오류:", err);
      setError("계획을 가져오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 계획 추가 성공 핸들러
  const handlePlanCreated = (newPlan: Plan) => {
    setPlans((prev) => [...prev, newPlan]);
  };

  // 계획 수정
  const updatePlan = async (id: string, updatedData: Partial<Plan>) => {
    try {
      const response = await fetch(`/api/plans/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        throw new Error("계획을 수정하는데 실패했습니다.");
      }

      const updatedPlan = await response.json();
      // MongoDB의 _id 값을 id로 매핑
      const planWithId = {
        ...updatedPlan,
        id: updatedPlan._id || updatedPlan.id,
      };

      setPlans((prev) =>
        prev.map((plan) => (plan.id === id ? planWithId : plan))
      );
    } catch (err) {
      console.error("계획 수정 오류:", err);
      setError("계획을 수정하는 중 오류가 발생했습니다.");
    }
  };

  // 계획 삭제
  const deletePlan = async (id: string) => {
    try {
      const response = await fetch(`/api/plans/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("계획을 삭제하는데 실패했습니다.");
      }

      setPlans((prev) => prev.filter((plan) => plan.id !== id));
    } catch (err) {
      console.error("계획 삭제 오류:", err);
      setError("계획을 삭제하는 중 오류가 발생했습니다.");
    }
  };

  // 최상위 계획 토글 핸들러
  const togglePlanExpansion = (planId: string) => {
    setExpandedPlans((prev) => ({
      ...prev,
      [planId]: !prev[planId],
    }));
  };

  // 컴포넌트 마운트 시 데이터 가져오기
  useEffect(() => {
    fetchPlans();
  }, []);

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

  // 이벤트 행 배치 계산 - 최상위 계획과 하위 계획 구분
  const arrangedPlans = useMemo(() => {
    const topLevelRows: {
      plan: Plan;
      row: number;
      left: number;
      width: number;
    }[][] = [];

    // 하위 계획을 부모 ID별로 그룹화하기 위한 객체
    const subPlanRowsByParent: Record<
      string,
      {
        plan: Plan;
        row: number;
        left: number;
        width: number;
        parentId: string;
      }[]
    > = {};

    // 최상위 계획과 하위 계획 분리
    const topLevelPlans = plans.filter((p) => !p.parentPlanId);
    const subPlans = plans.filter((p) => p.parentPlanId);

    // 계획을 시작 날짜 순으로 정렬
    const sortedTopLevelPlans = [...topLevelPlans].sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    const sortedSubPlans = [...subPlans].sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    // 최상위 계획 위치 계산
    sortedTopLevelPlans.forEach((plan) => {
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

      const startMonthIndex = startQuarter.months.indexOf(
        startDate.getMonth() + 1
      );
      const endMonthIndex = endQuarter.months.indexOf(endDate.getMonth() + 1);

      const dayWidth = 0.33;
      const monthWidth = 30 * dayWidth;

      const startDayPosition = (startDate.getDate() - 1) * dayWidth;
      const endDayPosition = endDate.getDate() * dayWidth;

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

      // 최상위 계획은 각자 고유 행에 배치 (다른 행과 겹치지 않음)
      const rowIndex = topLevelRows.length;
      if (!topLevelRows[rowIndex]) {
        topLevelRows[rowIndex] = [];
      }

      // 결정된 행에 이벤트 추가
      topLevelRows[rowIndex].push({
        plan,
        row: rowIndex,
        left: leftPos,
        width: Math.max(width, 10),
      });
    });

    // 하위 계획 위치 계산
    sortedSubPlans.forEach((plan) => {
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

      const startMonthIndex = startQuarter.months.indexOf(
        startDate.getMonth() + 1
      );
      const endMonthIndex = endQuarter.months.indexOf(endDate.getMonth() + 1);

      const dayWidth = 0.33;
      const monthWidth = 30 * dayWidth;

      const startDayPosition = (startDate.getDate() - 1) * dayWidth;
      const endDayPosition = endDate.getDate() * dayWidth;

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

      // 부모 계획 ID를 이용해 하위 계획 행을 그룹화
      const parentId = plan.parentPlanId || "";

      // 부모 ID별로 하위 계획의 위치를 추적하는 객체 초기화
      if (!subPlanRowsByParent[parentId]) {
        subPlanRowsByParent[parentId] = [];
      }

      // 각 부모별로 행 인덱스 계산 (각 부모마다 0부터 시작)
      const rowIndex = subPlanRowsByParent[parentId].length;

      // 결정된 행에 이벤트 추가
      subPlanRowsByParent[parentId].push({
        plan,
        row: rowIndex, // 부모 내 행 인덱스
        left: leftPos,
        width: Math.max(width, 10),
        parentId: parentId,
      });
    });

    // 모든 행의 이벤트 합치되, 최상위 계획과 하위 계획 정보 유지
    const allSubPlans = Object.values(subPlanRowsByParent).flat();

    return {
      topLevelPlans: topLevelRows.flat(),
      subPlans: allSubPlans,
    };
  }, [plans, allYearQuarters]);

  // 스크롤 참조
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 전체 타임라인 너비 계산 (각 분기별 최소 너비 300px)
  const timelineWidth = allYearQuarters.length * 300;

  // 하위 계획 추가 핸들러
  const handleAddSubPlan = (parentPlan: Plan) => {
    setParentPlanForSubPlan(parentPlan);
    setIsSubPlanDialogOpen(true);
  };

  // 하위 계획 생성 성공 핸들러
  const handleSubPlanCreated = (newPlan: Plan) => {
    setPlans((prev) => [...prev, newPlan]);
    setIsSubPlanDialogOpen(false);
    setParentPlanForSubPlan(null);
  };

  return (
    <div className="relative flex flex-col h-[calc(100vh-12rem)]">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">타임라인 계획</h2>
        <div className="flex space-x-2">
          <CreatePlanDialog onSuccess={handlePlanCreated} />
        </div>
      </div>

      {selectedPlan && (
        <EditPlan
          plan={selectedPlan}
          open={isEditDialogOpen}
          onOpenChange={(open) => {
            setIsEditDialogOpen(open);
          }}
          onUpdate={updatePlan}
          onDelete={deletePlan}
        />
      )}

      {/* 하위 계획 생성 다이얼로그 */}
      {parentPlanForSubPlan && (
        <CreateSubPlanDialog
          parentPlan={parentPlanForSubPlan}
          onSuccess={handleSubPlanCreated}
          open={isSubPlanDialogOpen}
          onOpenChange={(open) => {
            setIsSubPlanDialogOpen(open);
            if (!open) {
              // 다이얼로그가 닫힐 때 부모 계획 참조 초기화
              setTimeout(() => setParentPlanForSubPlan(null), 300);
            }
          }}
        />
      )}

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
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-2 text-blue-500">데이터를 불러오는 중...</span>
          </div>
        ) : error ? (
          <div className="text-center p-8 border rounded-md bg-red-50 text-red-500">
            <p>{error}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => fetchPlans()}
            >
              다시 시도
            </Button>
          </div>
        ) : (
          <div
            style={{ minWidth: `${timelineWidth}px` }}
            className="relative h-full"
          >
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
                new Date(
                  today.getFullYear(),
                  today.getMonth() + 1,
                  0
                ).getDate();

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
                          <span className="font-medium">
                            {yearQuarter.label}
                          </span>
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
            <div className="mt-4 relative h-[calc(100%-140px)]">
              {plans.length === 0 ? (
                <div className="text-center p-8 border rounded-md bg-gray-50 h-full">
                  <p>계획이 없습니다. 새 계획을 생성해보세요!</p>
                </div>
              ) : (
                <div className="relative h-full overflow-y-auto border bg-gray-50 rounded-md p-2">
                  {/* 최상위 계획 렌더링 */}
                  {(() => {
                    // 동적 위치 계산을 위한 변수들
                    const rowHeight = 40; // 각 행의 높이
                    const rowSpacing = 12; // 최상위 계획 간 기본 간격
                    const subRowHeight = 34; // 하위 계획 행 높이
                    const subRowSpacing = 4; // 하위 계획 간 간격

                    // 모든 최상위 계획의 위치 정보 계산
                    let currentOffset = 0;
                    const planPositions = arrangedPlans.topLevelPlans.map(
                      (item, index) => {
                        // 현재 최상위 계획의 상단 위치
                        const topOffset = currentOffset;

                        // 하위 계획 필터링
                        const subPlansForParent = arrangedPlans.subPlans.filter(
                          (subItem) => subItem.parentId === item.plan.id
                        );

                        // 하위 계획의 행 개수 (가장 많은 행을 차지하는 하위 계획)
                        const maxSubPlanRow =
                          subPlansForParent.length > 0
                            ? Math.max(
                                ...subPlansForParent.map(
                                  (subItem) => subItem.row
                                )
                              ) + 1
                            : 0;

                        // 하위 계획의 전체 높이 (확장되었을 때만 고려)
                        const subPlansHeight =
                          expandedPlans[item.plan.id] && maxSubPlanRow > 0
                            ? maxSubPlanRow * (subRowHeight + subRowSpacing) + 8 // 추가 여백
                            : 0;

                        // 다음 최상위 계획의 시작 위치 업데이트
                        currentOffset =
                          topOffset + rowHeight + rowSpacing + subPlansHeight;

                        return {
                          ...item,
                          topOffset,
                          subPlansHeight,
                          maxSubPlanRow,
                        };
                      }
                    );

                    // 타임라인의 최소 높이 계산 (마지막 계획 + 여백)
                    const timelineMinHeight =
                      planPositions.length > 0
                        ? planPositions[planPositions.length - 1].topOffset +
                          rowHeight +
                          40
                        : 100;

                    // 계산된 위치 정보로 최상위 계획 및 하위 계획 렌더링
                    return (
                      <div
                        style={{
                          minHeight: `${timelineMinHeight}px`,
                          position: "relative",
                        }}
                      >
                        {planPositions.map((item) => {
                          const isExpanded = expandedPlans[item.plan.id];

                          // 하위 계획 필터링
                          const subPlansForParent =
                            arrangedPlans.subPlans.filter(
                              (subItem) => subItem.parentId === item.plan.id
                            );

                          // 토글 아이콘 표시 여부
                          const hasSubPlans = subPlansForParent.length > 0;

                          return (
                            <div
                              key={item.plan.id}
                              className="relative"
                              style={{
                                position: "absolute",
                                top: `${item.topOffset}px`,
                                left: 0,
                                right: 0,
                                height: `${rowHeight}px`,
                              }}
                            >
                              {/* 최상위 계획 항목 */}
                              <div
                                className={`absolute rounded-lg border px-3 py-1 shadow-sm cursor-pointer hover:brightness-95 transition-all border-2 ${
                                  item.plan.status === PlanStatus.COMPLETED
                                    ? "bg-green-300 border-green-500"
                                    : item.plan.status ===
                                      PlanStatus.IN_PROGRESS
                                    ? "bg-blue-300 border-blue-500"
                                    : item.plan.status === PlanStatus.CANCELED
                                    ? "bg-red-300 border-red-500"
                                    : "bg-gray-300 border-gray-500"
                                }`}
                                style={{
                                  left: `${item.left}px`,
                                  width: `${Math.max(item.width, 10)}px`,
                                  top: "4px",
                                  height: "32px",
                                  zIndex: 10,
                                }}
                                onClick={() =>
                                  hasSubPlans &&
                                  togglePlanExpansion(item.plan.id)
                                }
                              >
                                <div className="flex items-center justify-between h-full">
                                  <div className="flex items-center">
                                    {hasSubPlans && (
                                      <div className="mr-1">
                                        {isExpanded ? (
                                          <ChevronDown size={14} />
                                        ) : (
                                          <ChevronRight size={14} />
                                        )}
                                      </div>
                                    )}
                                    <div className="text-xs font-medium truncate">
                                      {item.plan.name}
                                    </div>
                                  </div>
                                  <div className="flex items-center">
                                    <button
                                      className="ml-1 p-0.5 bg-white rounded-full hover:bg-gray-100 transition-colors"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAddSubPlan(item.plan);
                                      }}
                                      title="하위 계획 추가"
                                    >
                                      <Plus
                                        size={14}
                                        className="text-blue-500"
                                      />
                                    </button>
                                    <button
                                      className="ml-1 p-0.5 bg-white rounded-full hover:bg-gray-100 transition-colors"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedPlan(item.plan);
                                        setIsEditDialogOpen(true);
                                      }}
                                      title="계획 편집"
                                    >
                                      <Edit2
                                        size={14}
                                        className="text-gray-500"
                                      />
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* 하위 계획 렌더링 - 확장된 경우에만 */}
                              {isExpanded &&
                                subPlansForParent.map((subItem, subIndex) => {
                                  const subRowHeight = 34; // 하위 계획 행 높이
                                  const subRowSpacing = 4; // 하위 계획 간 간격

                                  // 하위 계획의 위치는 항상 부모 계획 바로 아래에서 시작
                                  // 각 하위 계획은 동일한 부모 아래에서 순차적으로 배치됨
                                  const subTopOffset =
                                    rowHeight +
                                    4 +
                                    subIndex * (subRowHeight + subRowSpacing);

                                  return (
                                    <div
                                      key={`sub-${subItem.plan.id}`}
                                      className="absolute rounded-lg border px-3 py-1 shadow-sm cursor-pointer hover:brightness-95 transition-all bg-opacity-80"
                                      style={{
                                        left: `${subItem.left}px`,
                                        width: `${subItem.width}px`,
                                        top: `${subTopOffset}px`,
                                        height: `${subRowHeight - 8}px`,
                                        backgroundColor:
                                          subItem.plan.status ===
                                          PlanStatus.COMPLETED
                                            ? "rgb(187, 247, 208)"
                                            : subItem.plan.status ===
                                              PlanStatus.IN_PROGRESS
                                            ? "rgb(191, 219, 254)"
                                            : subItem.plan.status ===
                                              PlanStatus.CANCELED
                                            ? "rgb(254, 202, 202)"
                                            : "rgb(229, 231, 235)",
                                        zIndex: 5,
                                      }}
                                      onClick={() => {
                                        setSelectedPlan(subItem.plan);
                                        setIsEditDialogOpen(true);
                                      }}
                                    >
                                      <div className="text-xs font-medium truncate">
                                        {subItem.plan.name}
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
