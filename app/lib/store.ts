import { create } from "zustand";
import { Plan, PlanStatus, StudyLog, PomodoroSettings } from "./types";
import { v4 as uuidv4 } from "uuid";

interface StoreState {
  plans: Plan[];
  studyLogs: StudyLog[];
  pomodoroSettings: PomodoroSettings;

  // 계획 관리
  addPlan: (plan: Omit<Plan, "id" | "progress" | "status">) => void;
  updatePlan: (id: string, plan: Partial<Plan>) => void;
  deletePlan: (id: string) => void;

  // 하위 계획 관리
  addSubPlan: (
    parentId: string,
    plan: Omit<Plan, "id" | "progress" | "status" | "parentPlanId">
  ) => void;

  // 공부 로그 관리
  addStudyLog: (log: Omit<StudyLog, "id">) => void;
  updateStudyLog: (id: string, log: Partial<StudyLog>) => void;
  deleteStudyLog: (id: string) => void;

  // 뽀모도로 설정
  updatePomodoroSettings: (settings: Partial<PomodoroSettings>) => void;
}

export const useStore = create<StoreState>((set) => ({
  plans: [],
  studyLogs: [],
  pomodoroSettings: {
    workDuration: 30,
    breakDuration: 5,
    longBreakDuration: 15,
    longBreakInterval: 4,
  },

  // 계획 관리
  addPlan: (planData) => {
    set((state) => {
      const newPlan: Plan = {
        id: uuidv4(),
        name: planData.name || "새 계획",
        description: planData.description,
        startDate: planData.startDate,
        endDate: planData.endDate,
        status: PlanStatus.NOT_STARTED,
        progress: 0,
        color: planData.color,
      };

      return {
        plans: [...state.plans, newPlan],
      };
    });
  },

  updatePlan: (id, planData) => {
    set((state) => {
      const updatedPlans = state.plans.map((plan) => {
        if (plan.id === id) {
          return {
            ...plan,
            name: planData.name || plan.name,
            description: planData.description ?? plan.description,
            startDate: planData.startDate || plan.startDate,
            endDate: planData.endDate || plan.endDate,
            color: planData.color ?? plan.color,
          };
        }

        return plan;
      });

      return {
        plans: updatedPlans,
      };
    });
  },

  deletePlan: (id) =>
    set((state) => {
      // 상위 계획과 모든 하위 계획 ID를 수집
      const planIdsToDelete = new Set<string>();

      const collectPlanIds = (planId: string) => {
        planIdsToDelete.add(planId);

        const plan = state.plans.find((p) => p.id === planId);
        if (plan?.subPlans) {
          plan.subPlans.forEach((subPlan) => collectPlanIds(subPlan.id));
        }
      };

      collectPlanIds(id);

      return {
        plans: state.plans.filter((plan) => !planIdsToDelete.has(plan.id)),
        // 관련 스터디 로그에서 planId 제거
        studyLogs: state.studyLogs.map((log) =>
          planIdsToDelete.has(log.planId || "")
            ? { ...log, planId: undefined }
            : log
        ),
      };
    }),

  // 하위 계획 관리
  addSubPlan: (parentId, planData) => {
    set((state) => {
      const newSubPlan: Plan = {
        id: uuidv4(),
        name: planData.name || "새 하위 계획",
        description: planData.description,
        startDate: planData.startDate,
        endDate: planData.endDate,
        status: PlanStatus.NOT_STARTED,
        progress: 0,
        parentPlanId: parentId,
        color: planData.color,
      };

      return {
        plans: state.plans.map((plan) => {
          if (plan.id === parentId) {
            return {
              ...plan,
              subPlans: [...(plan.subPlans || []), newSubPlan],
            };
          }
          return plan;
        }),
      };
    });
  },

  // 공부 로그 관리
  addStudyLog: (log) =>
    set((state) => ({
      studyLogs: [...state.studyLogs, { ...log, id: uuidv4() }],
    })),

  updateStudyLog: (id, updatedLog) =>
    set((state) => ({
      studyLogs: state.studyLogs.map((log) =>
        log.id === id ? { ...log, ...updatedLog } : log
      ),
    })),

  deleteStudyLog: (id) =>
    set((state) => ({
      studyLogs: state.studyLogs.filter((log) => log.id !== id),
    })),

  // 뽀모도로 설정
  updatePomodoroSettings: (settings) =>
    set((state) => ({
      pomodoroSettings: { ...state.pomodoroSettings, ...settings },
    })),
}));
