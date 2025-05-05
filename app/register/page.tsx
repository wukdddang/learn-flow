"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    name: "",
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
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "회원가입 중 오류가 발생했습니다");
      }

      toast.success("회원가입이 완료되었습니다! 로그인해주세요.");
      router.push("/login");
    } catch (error) {
      if (error instanceof Error) {
        console.error("회원가입 오류:", error.message);
        toast.error(error.message || "회원가입 중 오류가 발생했습니다");
      } else {
        console.error("회원가입 오류:", error);
        toast.error("회원가입 중 오류가 발생했습니다");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-xl shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
            회원가입
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            LearnFlow에 가입하여 학습 계획을 시작하세요
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">이름</Label>
            <Input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              placeholder="이름을 입력하세요"
              value={formData.name}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

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
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              placeholder="비밀번호를 입력하세요 (8자 이상)"
              minLength={8}
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              비밀번호는 최소 8자 이상이어야 합니다
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "회원가입 중..." : "회원가입"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            이미 계정이 있으신가요?{" "}
            <Link
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
