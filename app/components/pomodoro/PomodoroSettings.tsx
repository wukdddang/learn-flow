import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { useStore } from "@/app/lib/store";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PomodoroSettings as PomodoroSettingsType } from "@/app/lib/types";

const formSchema = z.object({
  workDuration: z.number().min(1).max(120),
  breakDuration: z.number().min(1).max(30),
  longBreakDuration: z.number().min(1).max(60),
  longBreakInterval: z.number().min(1).max(10),
});

type FormValues = z.infer<typeof formSchema>;

interface PomodoroSettingsProps {
  onClose: () => void;
}

export function PomodoroSettings({ onClose }: PomodoroSettingsProps) {
  const pomodoroSettings = useStore((state) => state.pomodoroSettings);
  const updatePomodoroSettings = useStore(
    (state) => state.updatePomodoroSettings
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      workDuration: pomodoroSettings.workDuration,
      breakDuration: pomodoroSettings.breakDuration,
      longBreakDuration: pomodoroSettings.longBreakDuration,
      longBreakInterval: pomodoroSettings.longBreakInterval,
    },
  });

  const onSubmit = (values: FormValues) => {
    updatePomodoroSettings(values);
    onClose();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="workDuration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>작업 시간 (분)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="breakDuration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>휴식 시간 (분)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="longBreakDuration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>긴 휴식 시간 (분)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="longBreakInterval"
          render={({ field }) => (
            <FormItem>
              <FormLabel>긴 휴식 간격 (세션 수)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose} type="button">
            취소
          </Button>
          <Button type="submit">저장</Button>
        </div>
      </form>
    </Form>
  );
}
