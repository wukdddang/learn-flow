"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// SearchParams를 처리하는 별도의 컴포넌트
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("로그인 실패: 이메일 또는 비밀번호가 올바르지 않습니다.");
      } else {
        toast.success("로그인 성공!");
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (error) {
      console.error("로그인 오류:", error);
      toast.error("로그인 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email">이메일</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="이메일 주소를 입력하세요"
          value={formData.email}
          onChange={handleChange}
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">비밀번호</Label>
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
          >
            비밀번호 찾기
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="비밀번호를 입력하세요"
          value={formData.password}
          onChange={handleChange}
          disabled={isLoading}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "로그인 중..." : "로그인"}
      </Button>
    </form>
  );
}

// 로딩 상태 표시 컴포넌트
function LoginFormFallback() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-5 w-16 bg-gray-200 rounded animate-pulse mb-1"></div>
        <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <div className="h-5 w-16 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
      </div>
      <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-xl shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
            로그인
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            LearnFlow에 로그인하여 학습 계획을 관리하세요
          </p>
        </div>

        <Suspense fallback={<LoginFormFallback />}>
          <LoginForm />
        </Suspense>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            계정이 없으신가요?{" "}
            <Link
              href="/register"
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
