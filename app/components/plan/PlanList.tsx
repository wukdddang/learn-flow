import { useState, useMemo } from "react";
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
import { format, differenceInDays } from "@/app/lib/date-utils";

const getStatusColor = (status: PlanStatus) => {
  switch (status) {
    case PlanStatus.NOT_STARTED:
      return "bg-gray-100 text-gray-800";
    case PlanStatus.IN_PROGRESS:
      return "bg-blue-100 text-blue-800";
    case PlanStatus.COMPLETED:
      return "bg-green-100 text-green-800";
    case PlanStatus.CANCELED:
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

// 날짜 범위에 따른 시각적 너비 계산 함수
const getTimelineWidth = (startDate: Date, endDate: Date) => {
  const days = differenceInDays(new Date(endDate), new Date(startDate)) + 1;
  // 최소 너비 보장 (1일인 경우도 충분한 공간 확보)
  return Math.max(days * 5, 30);
};

// 계획 기간에 따른 색상 지정 함수
const getPlanTimelineColor = (startDate: Date, endDate: Date) => {
  const days = differenceInDays(new Date(endDate), new Date(startDate));

  // 기간별 색상 분류
  if (days <= 7) {
    return "bg-blue-400"; // 1주일 이내
  } else if (days <= 30) {
    return "bg-indigo-500"; // 1개월 이내
  } else if (days <= 90) {
    return "bg-purple-500"; // 3개월 이내
  } else {
    return "bg-violet-600"; // 장기 계획
  }
};

interface PlanItemProps {
  plan: Plan;
  level?: number;
}

function PlanItem({ plan, level = 0 }: PlanItemProps) {
  const updatePlan = useStore((state) => state.updatePlan);
  const deletePlan = useStore((state) => state.deletePlan);
  const addSubPlan = useStore((state) => state.addSubPlan);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubPlanDialogOpen, setIsSubPlanDialogOpen] = useState(false);

  const hasSubPlans = plan.subPlans && plan.subPlans.length > 0;
  const timelineWidth = getTimelineWidth(plan.startDate, plan.endDate);
  const timelineColor = getPlanTimelineColor(plan.startDate, plan.endDate);
  const durationDays =
    differenceInDays(new Date(plan.endDate), new Date(plan.startDate)) + 1;

  const handleStatusChange = (status: PlanStatus) => {
    updatePlan(plan.id, { status });
  };

  return (
    <div className="mb-3">
      <Card
        className={`border-l-4 ${
          level === 0 ? "border-l-primary" : "border-l-gray-300"
        }`}
      >
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              {hasSubPlans && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-0 mr-2 h-6 w-6"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </Button>
              )}
              <CardTitle className="text-md">{plan.name}</CardTitle>
            </div>
            <div className="flex space-x-1">
              <span
                className={`px-2 py-1 rounded-full text-xs ${getStatusColor(
                  plan.status
                )}`}
              >
                {plan.status}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-2">
          {plan.description && (
            <CardDescription className="mt-1 text-sm">
              {plan.description}
            </CardDescription>
          )}

          {/* 개선된 타임라인 바 UI */}
          <div className="mt-3 mb-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Calendar size={14} className="mr-1 text-gray-500" />
                <span className="text-xs text-gray-500">
                  {format(new Date(plan.startDate), "yyyy년 MM월 dd일")}
                </span>
              </div>
              <span className="text-xs text-gray-700 font-medium">
                {durationDays}일 간의 계획
              </span>
              <span className="text-xs text-gray-500">
                {format(new Date(plan.endDate), "yyyy년 MM월 dd일")}
              </span>
            </div>
            <div className="mt-2 h-3 bg-gray-100 rounded-full overflow-hidden relative">
              <div
                className={`h-full ${timelineColor} rounded-full transition-all duration-300`}
                style={{
                  width: `${plan.progress}%`,
                }}
              ></div>
              {/* 오늘 날짜 표시 마커 */}
              {(() => {
                const start = new Date(plan.startDate).getTime();
                const end = new Date(plan.endDate).getTime();
                const today = new Date().getTime();

                // 오늘이 계획 기간 내에 있는지 확인
                if (today >= start && today <= end) {
                  // 오늘 날짜의 상대적인 위치 계산 (0-100%)
                  const position = ((today - start) / (end - start)) * 100;
                  return (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                      style={{ left: `${position}%` }}
                      title="오늘"
                    ></div>
                  );
                }
                return null;
              })()}
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-500">진행률</span>
              <span className="text-xs font-medium">{plan.progress}% 완료</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between pt-2">
          <div>
            <select
              className="text-xs border rounded p-1"
              value={plan.status}
              onChange={(e) => handleStatusChange(e.target.value as PlanStatus)}
            >
              {Object.values(PlanStatus).map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <div className="flex space-x-2">
            <Dialog
              open={isSubPlanDialogOpen}
              onOpenChange={setIsSubPlanDialogOpen}
            >
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus size={16} className="mr-1" />
                  하위 계획
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
                <Button variant="outline" size="sm">
                  <Edit size={16} className="mr-1" />
                  수정
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
              variant="destructive"
              size="sm"
              onClick={() => deletePlan(plan.id)}
            >
              <Trash size={16} className="mr-1" />
              삭제
            </Button>
          </div>
        </CardFooter>
      </Card>

      {isExpanded && hasSubPlans && (
        <div className="ml-6 mt-2">
          {plan.subPlans?.map((subPlan) => (
            <PlanItem key={subPlan.id} plan={subPlan} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function PlanList() {
  const plans = useStore((state) => state.plans);
  const addPlan = useStore((state) => state.addPlan);

  const topLevelPlans = useMemo(() => {
    return plans.filter((p) => !p.parentPlanId);
  }, [plans]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">나의 계획 목록</h2>
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
              onSubmit={(values) => {
                addPlan(values);
                setIsDialogOpen(false);
              }}
              onCancel={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {topLevelPlans.length === 0 ? (
        <div className="text-center p-8 border rounded-md bg-gray-50">
          <p>계획이 없습니다. 새 계획을 생성해보세요!</p>
        </div>
      ) : (
        <div>
          {topLevelPlans.map((plan) => (
            <PlanItem key={plan.id} plan={plan} />
          ))}
        </div>
      )}
    </div>
  );
}
