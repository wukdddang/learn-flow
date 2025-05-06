import { useState, useMemo, useRef, useEffect } from "react";
import { Plus, ChevronRight, ChevronDown, Edit2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import { CreatePlanDialog } from "../../dialog/create-plan-dialog";
import { CreateSubPlanDialog } from "../../dialog/create-subplan-dialog";
import { EditPlan } from "../../dialog/edit-plan-dialog";
import { Plan, PlanStatus } from "@/src/lib/types";

// MongoDB 문서 타입 정의
interface MongoDocument {
  _id: string;
  [key: string]: unknown;
}

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
      const plansWithId = data.map((plan: MongoDocument) => ({
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

  // 하위 계획 노드와 그 하위 계획들의 총 높이를 계산하는 함수
  const calculatePlanHeight = (planId: string): number => {
    const subRowHeight = 34; // 하위 계획 행 높이
    const subRowSpacing = 4; // 하위 계획 간 간격

    // 이 계획의 하위 계획이 확장되어 있지 않으면 기본 높이만 반환
    if (!expandedPlans[planId]) {
      return 0;
    }

    // 해당 계획의 직접적인 하위 계획들
    const subPlans = arrangedPlans.subPlans.filter(
      (subItem) => subItem.parentId === planId
    );

    if (subPlans.length === 0) {
      return 0;
    }

    // 각 하위 계획의 높이 (자신 + 하위 계획들)의 합
    let totalHeight = subPlans.length * (subRowHeight + subRowSpacing);

    // 각 하위 계획이 가진 하위 계획들의 높이도 누적
    for (const subPlan of subPlans) {
      totalHeight += calculatePlanHeight(subPlan.plan.id);
    }

    return totalHeight;
  };

  // 하위 계획 렌더링 함수 (재귀적으로 호출 가능)
  const renderSubPlans = (
    parentId: string,
    initialTopOffset: number,
    depth: number = 0
  ) => {
    // 해당 부모 ID를 가진 하위 계획 필터링
    const subPlansForParent = arrangedPlans.subPlans.filter(
      (subItem) => subItem.parentId === parentId
    );

    if (subPlansForParent.length === 0 || !expandedPlans[parentId]) {
      return null;
    }

    const subRowHeight = 34; // 하위 계획 행 높이
    const subRowSpacing = 4; // 하위 계획 간 간격

    // 각 하위 계획의 렌더링 결과와 현재 탑 오프셋을 추적
    let currentTopOffset = initialTopOffset;

    return (
      <>
        {subPlansForParent.map((subItem) => {
          // 이 하위 계획이 자신의 하위 계획을 가지고 있는지 확인
          const hasNestedSubPlans = arrangedPlans.subPlans.some(
            (plan) => plan.parentId === subItem.plan.id
          );

          // 이전 항목들이 차지한 공간을 고려하여 현재 항목의 위치 결정
          const subTopOffset = currentTopOffset;

          // 다음 항목을 위한 topOffset 계산 (현재 항목의 높이 + 자신의 하위 계획 높이)
          const subPlanExpanded =
            expandedPlans[subItem.plan.id] && hasNestedSubPlans;
          const nestedHeight = subPlanExpanded
            ? calculatePlanHeight(subItem.plan.id)
            : 0;
          currentTopOffset += subRowHeight + subRowSpacing + nestedHeight;

          return (
            <div key={`sub-${subItem.plan.id}-depth-${depth}`}>
              <div
                className="absolute rounded-lg border px-3 py-1 shadow-sm cursor-pointer hover:brightness-95 transition-all bg-opacity-80"
                style={{
                  left: `${subItem.left}px`,
                  width: `${subItem.width}px`,
                  top: `${subTopOffset}px`,
                  height: `${subRowHeight - 8}px`,
                  backgroundColor:
                    subItem.plan.status === PlanStatus.COMPLETED
                      ? "rgb(187, 247, 208)"
                      : subItem.plan.status === PlanStatus.IN_PROGRESS
                      ? "rgb(191, 219, 254)"
                      : subItem.plan.status === PlanStatus.CANCELED
                      ? "rgb(254, 202, 202)"
                      : "rgb(229, 231, 235)",
                  zIndex: 5,
                }}
                onClick={() => {
                  if (hasNestedSubPlans) {
                    togglePlanExpansion(subItem.plan.id);
                  } else {
                    setSelectedPlan(subItem.plan);
                    setIsEditDialogOpen(true);
                  }
                }}
              >
                <div className="flex items-center justify-between h-full">
                  <div className="flex items-center">
                    {hasNestedSubPlans && (
                      <div className="mr-1">
                        {expandedPlans[subItem.plan.id] ? (
                          <ChevronDown size={12} />
                        ) : (
                          <ChevronRight size={12} />
                        )}
                      </div>
                    )}
                    <div className="text-xs font-medium truncate">
                      {subItem.plan.name}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <button
                      className="ml-1 p-0.5 bg-white rounded-full hover:bg-gray-100 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddSubPlan(subItem.plan);
                      }}
                      title="하위 계획 추가"
                    >
                      <Plus size={12} className="text-blue-500" />
                    </button>
                    <button
                      className="ml-1 p-0.5 bg-white rounded-full hover:bg-gray-100 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPlan(subItem.plan);
                        setIsEditDialogOpen(true);
                      }}
                      title="계획 편집"
                    >
                      <Edit2 size={12} className="text-gray-500" />
                    </button>
                  </div>
                </div>
              </div>

              {/* 재귀적으로 하위 계획의 하위 계획 렌더링 */}
              {expandedPlans[subItem.plan.id] &&
                renderSubPlans(
                  subItem.plan.id,
                  subTopOffset + subRowHeight,
                  depth + 1
                )}
            </div>
          );
        })}
      </>
    );
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
                      (item) => {
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
                        {planPositions.map((item, topLevelIndex) => {
                          const isExpanded = expandedPlans[item.plan.id];

                          // 하위 계획 필터링
                          const subPlansForParent =
                            arrangedPlans.subPlans.filter(
                              (subItem) => subItem.parentId === item.plan.id
                            );

                          // 토글 아이콘 표시 여부
                          const hasSubPlans = subPlansForParent.length > 0;

                          // 이전 최상위 계획들의 하위 계획 높이 계산 (필요시)
                          const topOffset = item.topOffset;
                          if (topLevelIndex > 0) {
                            // 이전 항목들의 하위 계획 높이를 고려하여 위치 조정 가능
                            // 현재는 arrangedPlans에서 이미 계산됨
                          }

                          return (
                            <div
                              key={item.plan.id}
                              className="relative"
                              style={{
                                position: "absolute",
                                top: `${topOffset}px`,
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

                              {/* 최상위 계획의 하위 계획 렌더링, 재귀 함수 사용 */}
                              {renderSubPlans(item.plan.id, rowHeight + 4, 0)}
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
