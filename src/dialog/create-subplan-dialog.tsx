import { useState } from "react";
import { Plus } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { PlanForm } from "./create-plan-dialog";
import { Plan, PlanStatus } from "@/src/lib/types";
import { FormValues } from "./create-plan-dialog";

interface CreateSubPlanDialogProps {
  parentPlan: Plan;
  onSuccess?: (newPlan: Plan) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateSubPlanDialog({
  parentPlan,
  onSuccess,
  open,
  onOpenChange,
}: CreateSubPlanDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Plan 인터페이스에 맞게 데이터 구성 및 parentPlanId 추가
      const planData = {
        ...values,
        status: PlanStatus.NOT_STARTED,
        progress: 0,
        parentPlanId: parentPlan.id,
      };

      const response = await fetch("/api/plans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(planData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "하위 계획을 생성하는데 실패했습니다."
        );
      }

      const newPlan = await response.json();

      // 성공 콜백 호출
      if (onSuccess) {
        const planWithId = {
          ...newPlan,
          id: newPlan._id || newPlan.id,
        };
        onSuccess(planWithId);
      }

      // 다이얼로그 닫기
      onOpenChange(false);
    } catch (err) {
      console.error("하위 계획 생성 오류:", err);
      setError(
        err instanceof Error
          ? err.message
          : "하위 계획을 생성하는 중 오류가 발생했습니다."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>하위 계획 추가</DialogTitle>
        </DialogHeader>
        <div className="mb-4 text-sm">
          <span className="font-medium">상위 계획: </span>
          <span className="text-blue-600">{parentPlan.name}</span>
        </div>
        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-md mb-4">
            {error}
          </div>
        )}
        <PlanForm
          initialValues={{
            startDate: new Date(parentPlan.startDate),
            endDate: new Date(parentPlan.endDate),
            color: parentPlan.color,
          }}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
        {isSubmitting && (
          <div className="absolute inset-0 bg-black/5 flex items-center justify-center rounded-lg">
            <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
