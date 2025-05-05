import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Calendar as CalendarIcon, Check } from "lucide-react";

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

import { cn } from "@/lib/utils";
import { format } from "@/app/lib/date-utils";

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

interface PlanFormProps {
  initialValues?: Partial<FormValues>;
  onSubmit: (values: FormValues) => void;
  onCancel: () => void;
}

export function PlanForm({ initialValues, onSubmit, onCancel }: PlanFormProps) {
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
                          format(field.value, "PPP")
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
                          format(field.value, "PPP")
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
          <Button variant="outline" onClick={onCancel} type="button">
            취소
          </Button>
          <Button type="submit">{initialValues ? "수정" : "생성"}</Button>
        </div>
      </form>
    </Form>
  );
}
