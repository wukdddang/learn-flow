"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User, LogOut } from "lucide-react";

export function AuthStatus() {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";

  if (isLoading) {
    return <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />;
  }

  if (!session) {
    return (
      <div className="flex items-center gap-4">
        <Link href="/login" className="text-sm font-medium">
          <Button variant="ghost" size="sm">
            로그인
          </Button>
        </Link>
        <Link href="/register">
          <Button size="sm">회원가입</Button>
        </Link>
      </div>
    );
  }

  const userInitials = session.user?.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
    : "사용자";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            {session.user?.image ? (
              <AvatarImage
                src={session.user.image}
                alt={session.user.name || "사용자"}
              />
            ) : (
              <AvatarFallback>{userInitials}</AvatarFallback>
            )}
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {session.user?.name}
            </p>
            <p className="text-xs leading-none text-gray-500">
              {session.user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link
            href="/profile"
            className="cursor-pointer flex items-center w-full"
          >
            <User className="mr-2 h-4 w-4" />
            <span>프로필</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => signOut({ callbackUrl: "/" })}
          className="cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>로그아웃</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
