import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Calendar as CalendarIcon, Clock } from "lucide-react";

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

import { Plan } from "@/src/lib/types";
import { cn } from "@/lib/utils";
import { useStore } from "@/src/lib/store";
import { format } from "@/src/lib/date-utils";

const formSchema = z.object({
  title: z.string().min(2, { message: "최소 2글자 이상 입력해주세요" }),
  content: z.string().optional(),
  date: z.date(),
  duration: z.number().min(5, { message: "최소 5분 이상 입력해주세요" }),
  planId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface StudyLogFormProps {
  initialValues?: Partial<FormValues>;
  onSubmit: (values: FormValues) => void;
  onCancel: () => void;
}

export function StudyLogForm({
  initialValues,
  onSubmit,
  onCancel,
}: StudyLogFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialValues?.title || "",
      content: initialValues?.content || "",
      date: initialValues?.date || new Date(),
      duration: initialValues?.duration || 30,
      planId: initialValues?.planId || undefined,
    },
  });

  const plans = useStore((state) => state.plans);

  // 평탄화된 계획 목록 (중첩된 계획 포함)
  const flattenPlans = (plans: Plan[]): Plan[] => {
    return plans.reduce<Plan[]>((acc, plan) => {
      acc.push(plan);
      if (plan.subPlans && plan.subPlans.length > 0) {
        acc.push(...flattenPlans(plan.subPlans));
      }
      return acc;
    }, []);
  };

  const allPlans = flattenPlans(plans);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>제목</FormLabel>
              <FormControl>
                <Input placeholder="공부 내용의 제목을 입력하세요" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>상세 내용</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="공부한 내용을 자세히 입력하세요"
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
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>날짜</FormLabel>
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
                          format(field.value, "yyyy년 MM월 dd일")
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
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>공부 시간 (분)</FormLabel>
                <FormControl>
                  <div className="flex items-center">
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                    <Clock className="ml-2 h-4 w-4 opacity-50" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="planId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>연결할 계획</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="연결할 계획을 선택하세요 (선택사항)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="">선택 안함</SelectItem>
                  {allPlans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onCancel} type="button">
            취소
          </Button>
          <Button type="submit">{initialValues ? "수정" : "추가"}</Button>
        </div>
      </form>
    </Form>
  );
}
