import { useState } from "react";
import { Calendar, ClipboardList, Plus, Edit, Trash } from "lucide-react";

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
import { StudyLogForm } from "./StudyLogForm";
import { useStore } from "@/app/lib/store";
import { format } from "@/app/lib/date-utils";

export function StudyLogList() {
  // 각 상태를 개별적으로 선택하여 불필요한 리렌더링 방지
  const studyLogs = useStore((state) => state.studyLogs);
  const plans = useStore((state) => state.plans);
  const addStudyLog = useStore((state) => state.addStudyLog);
  const updateStudyLog = useStore((state) => state.updateStudyLog);
  const deleteStudyLog = useStore((state) => state.deleteStudyLog);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<string | null>(null);

  const handleEdit = (id: string) => {
    setSelectedLog(id);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("정말로 이 공부 기록을 삭제하시겠습니까?")) {
      deleteStudyLog(id);
    }
  };

  const getPlanNameById = (planId?: string) => {
    if (!planId) return "";

    const findPlanNameById = (plans: any[], id: string): string => {
      for (const plan of plans) {
        if (plan.id === id) return plan.name;
        if (plan.subPlans) {
          const name = findPlanNameById(plan.subPlans, id);
          if (name) return name;
        }
      }
      return "";
    };

    return findPlanNameById(plans, planId);
  };

  // 날짜별로 정렬된 로그
  const sortedLogs = [...studyLogs].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // 선택된 로그 찾기
  const selectedLogData = selectedLog
    ? studyLogs.find((log) => log.id === selectedLog)
    : null;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">공부 기록</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedLog(null)}>
              <Plus size={16} className="mr-1" />새 기록 추가
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedLog ? "공부 기록 수정" : "새 공부 기록 추가"}
              </DialogTitle>
            </DialogHeader>
            {selectedLogData ? (
              <StudyLogForm
                initialValues={{
                  title: selectedLogData.title,
                  content: selectedLogData.content,
                  date: new Date(selectedLogData.date),
                  duration: selectedLogData.duration,
                  planId: selectedLogData.planId,
                }}
                onSubmit={(values) => {
                  if (selectedLog) {
                    updateStudyLog(selectedLog, {
                      ...values,
                      date: values.date,
                    });
                  }
                  setIsDialogOpen(false);
                }}
                onCancel={() => setIsDialogOpen(false)}
              />
            ) : (
              <StudyLogForm
                onSubmit={(values) => {
                  addStudyLog({
                    ...values,
                    content: values.content || "",
                    date: values.date,
                  });
                  setIsDialogOpen(false);
                }}
                onCancel={() => setIsDialogOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>

      {sortedLogs.length === 0 ? (
        <div className="text-center p-8 border rounded-md bg-gray-50">
          <p>공부 기록이 없습니다. 새 기록을 추가해보세요!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedLogs.map((log) => (
            <Card key={log.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <CardTitle className="text-lg">{log.title}</CardTitle>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Calendar size={14} />
                    <span>
                      {format(new Date(log.date), "yyyy년 MM월 dd일")}
                    </span>
                    <span>·</span>
                    <span>{log.duration}분</span>
                  </div>
                </div>
                {log.planId && (
                  <CardDescription className="text-xs flex items-center">
                    <ClipboardList size={12} className="mr-1" />
                    {getPlanNameById(log.planId)}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm whitespace-pre-line">{log.content}</p>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(log.id)}
                >
                  <Edit size={14} className="mr-1" />
                  수정
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(log.id)}
                >
                  <Trash size={14} className="mr-1" />
                  삭제
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
