import { useState } from "react";
import { Edit2, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { PlanForm } from "./create-plan-dialog";
import { Plan } from "@/src/lib/types";

interface EditPlanProps {
  plan: Plan;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, updatedData: Partial<Plan>) => void;
  onDelete: (id: string) => void;
}

export function EditPlan({
  plan,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
}: EditPlanProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleSubmit = (values: any) => {
    onUpdate(plan.id, {
      ...values,
      status: plan.status,
      progress: plan.progress,
    });
    handleClose();
  };

  const handleDelete = () => {
    onDelete(plan.id);
    setIsDeleteDialogOpen(false);
    handleClose();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>계획 수정</DialogTitle>
          </DialogHeader>
          <div className="flex justify-between items-center mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              삭제
            </Button>
          </div>
          <PlanForm
            initialValues={{
              name: plan.name,
              description: plan.description,
              startDate: new Date(plan.startDate),
              endDate: new Date(plan.endDate),
              color: plan.color,
            }}
            onSubmit={handleSubmit}
            onCancel={handleClose}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>정말 삭제하시겠습니까?</DialogTitle>
            <DialogDescription>
              이 작업은 되돌릴 수 없습니다. 계획이 영구적으로 삭제됩니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 justify-end sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              취소
            </Button>
            <Button onClick={handleDelete} variant="destructive">
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
