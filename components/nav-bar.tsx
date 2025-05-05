"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "next-auth/react";
import { toast } from "sonner";

export function NavBar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const navItems = [
    {
      name: "홈",
      href: "/",
    },
    {
      name: "대시보드",
      href: "/dashboard",
    },
    {
      name: "학습 계획",
      href: "/plans",
    },
  ];

  const handleLogout = async () => {
    try {
      await signOut({ callbackUrl: "/" });
      toast.success("로그아웃 되었습니다.");
    } catch (error) {
      toast.error("로그아웃 중 오류가 발생했습니다.");
      console.error("로그아웃 오류:", error);
    }
  };

  return (
    <div className="border-b bg-white dark:bg-gray-950">
      <div className="flex h-16 items-center px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mr-4 md:flex flex-shrink-0 items-center">
          <Link href="/" className="flex items-center">
            <span className="text-xl font-bold text-primary">LearnFlow</span>
          </Link>
        </div>
        <nav className="hidden md:flex items-center space-x-4 lg:space-x-6 mx-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === item.href
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {item.name}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center space-x-4">
          {session ? (
            <div className="flex items-center gap-2">
              <span className="text-sm">
                {session.user?.name || session.user?.email}
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                로그아웃
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="outline" size="sm">
                  로그인
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">회원가입</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
