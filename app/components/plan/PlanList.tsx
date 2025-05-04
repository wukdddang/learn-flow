import { useState, useMemo } from "react";
import { Plus, Edit, Trash, ChevronRight, ChevronDown } from "lucide-react";
import { shallow } from "zustand/shallow";

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
import { Plan, PlanDuration, PlanStatus } from "@/app/lib/types";
import { useStore } from "@/app/lib/store";
import { format } from "@/app/lib/date-utils";

const getDurationColor = (duration: PlanDuration) => {
  switch (duration) {
    case PlanDuration.SHORT:
      return "bg-green-100 text-green-800";
    case PlanDuration.MEDIUM:
      return "bg-yellow-100 text-yellow-800";
    case PlanDuration.LONG:
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

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

interface PlanItemProps {
  plan: Plan;
  level?: number;
}

function PlanItem({ plan, level = 0 }: PlanItemProps) {
  const updatePlan = useStore((state) => state.updatePlan);
  const deletePlan = useStore((state) => state.deletePlan);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const hasSubPlans = plan.subPlans && plan.subPlans.length > 0;

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
                className={`px-2 py-1 rounded-full text-xs ${getDurationColor(
                  plan.duration
                )}`}
              >
                {plan.duration}
              </span>
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
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>
              {format(new Date(plan.startDate), "yyyy년 MM월 dd일")} ~{" "}
              {format(new Date(plan.endDate), "yyyy년 MM월 dd일")}
            </span>
            <span>{plan.progress}% 완료</span>
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
                    duration: plan.duration,
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
