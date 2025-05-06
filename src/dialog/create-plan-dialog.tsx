import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Calendar as CalendarIcon, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ko } from "date-fns/locale";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { cn } from "@/lib/utils";
import { format } from "@/src/lib/date-utils";
import { Plan, PlanStatus } from "@/src/lib/types";

// 계획 색상 목록
export const planColors = [
  { value: "bg-indigo-400", label: "인디고" },
  { value: "bg-blue-500", label: "파랑" },
  { value: "bg-green-500", label: "녹색" },
  { value: "bg-yellow-500", label: "노랑" },
  { value: "bg-red-500", label: "빨강" },
  { value: "bg-purple-500", label: "보라" },
  { value: "bg-pink-500", label: "분홍" },
  { value: "bg-orange-500", label: "주황" },
  { value: "bg-teal-500", label: "청록" },
];

const formSchema = z.object({
  name: z.string().min(2, { message: "최소 2글자 이상 입력해주세요" }),
  description: z.string().optional(),
  startDate: z.date(),
  endDate: z.date(),
  color: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;
// FormValues 타입을 내보냅니다
export type { FormValues };

interface PlanFormProps {
  initialValues?: Partial<FormValues>;
  onSubmit: (values: FormValues) => void;
  onCancel: () => void;
  minDate?: Date;
  maxDate?: Date;
  isLoading?: boolean;
  isFormCreate?: boolean;
}

export function PlanForm({
  initialValues,
  onSubmit,
  onCancel,
  minDate,
  maxDate,
  isLoading,
  isFormCreate = false,
}: PlanFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialValues?.name || "",
      description: initialValues?.description || "",
      startDate: initialValues?.startDate || new Date(),
      endDate: initialValues?.endDate || new Date(),
      color: initialValues?.color || planColors[0].value,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>계획 이름</FormLabel>
              <FormControl>
                <Input placeholder="계획 이름을 입력하세요" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>설명</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="계획에 대한 설명을 입력하세요"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>시작일</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: ko })
                        ) : (
                          <span>날짜 선택</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                      fromDate={minDate}
                      toDate={maxDate}
                      locale={ko}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>종료일</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: ko })
                        ) : (
                          <span>날짜 선택</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                      fromDate={minDate}
                      toDate={maxDate}
                      locale={ko}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>색상</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="색상을 선택하세요">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-full ${field.value}`}
                        ></div>
                        <span>
                          {planColors.find(
                            (color) => color.value === field.value
                          )?.label || "색상 선택"}
                        </span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {planColors.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-full ${color.value}`}
                        ></div>
                        <span>{color.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            variant="outline"
            onClick={onCancel}
            type="button"
            disabled={isLoading}
          >
            취소
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="h-4 w-4 mr-2 border-2 border-t-transparent rounded-full animate-spin" />
                {isFormCreate ? "생성 중..." : "수정 중..."}
              </>
            ) : isFormCreate ? (
              "생성"
            ) : (
              "수정"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// API를 직접 호출하는 계획 생성 다이얼로그 컴포넌트
interface CreatePlanDialogProps {
  onSuccess?: (newPlan: Plan) => void;
  trigger?: React.ReactNode;
}

export function CreatePlanDialog({
  onSuccess,
  trigger,
}: CreatePlanDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Plan 인터페이스에 맞게 데이터 구성
      const planData = {
        ...values,
        status: PlanStatus.NOT_STARTED,
        progress: 0,
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
        throw new Error(errorData.error || "계획을 생성하는데 실패했습니다.");
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

      toast.success("새 계획이 성공적으로 생성되었습니다.");
      // 다이얼로그 닫기
      setIsOpen(false);
    } catch (err) {
      console.error("계획 생성 오류:", err);
      setError(
        err instanceof Error
          ? err.message
          : "계획을 생성하는 중 오류가 발생했습니다."
      );
      toast.error("계획 생성 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus size={16} className="mr-1" />새 계획 생성
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>새 계획 생성</DialogTitle>
        </DialogHeader>
        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-md mb-4">
            {error}
          </div>
        )}
        <PlanForm
          initialValues={{
            startDate: new Date(),
            endDate: new Date(),
          }}
          onSubmit={handleSubmit}
          onCancel={() => setIsOpen(false)}
          isLoading={isSubmitting}
          isFormCreate={true}
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
