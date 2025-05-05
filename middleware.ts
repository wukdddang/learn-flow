import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// 인증이 필요한 경로들
const protectedRoutes = ["/dashboard", "/plans", "/profile"];
// 인증되지 않은 사용자만 접근 가능한 경로들
const authRoutes = ["/login", "/register"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // NextAuth.js 토큰 확인 (세션이 있는지 확인)
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isAuthenticated = !!token;

  // 인증이 필요한 경로에 인증되지 않은 사용자가 접근할 경우
  if (
    !isAuthenticated &&
    protectedRoutes.some((route) => pathname.startsWith(route))
  ) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", encodeURI(pathname));
    return NextResponse.redirect(url);
  }

  // 이미 인증된 사용자가 인증 페이지(로그인/회원가입)에 접근할 경우
  if (
    isAuthenticated &&
    authRoutes.some((route) => pathname.startsWith(route))
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

// 미들웨어가 실행될 경로 패턴을 지정 (모든 경로에 미들웨어가 실행되지 않도록)
export const config = {
  matcher: [
    /*
     * 다음 경로에 미들웨어 적용:
     * - /dashboard/* (대시보드 관련 모든 경로)
     * - /plans/* (학습 계획 관련 모든 경로)
     * - /profile/* (사용자 프로필 관련 모든 경로)
     * - /login (로그인 페이지)
     * - /register (회원가입 페이지)
     * 다음은 제외:
     * - 정적 파일 (_next, favicon.ico 등)
     * - API 경로
     */
    "/((?!_next|favicon.ico|api|images).*)",
  ],
};
