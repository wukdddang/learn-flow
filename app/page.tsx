import Link from "next/link";
import { ArrowRight, BookOpen, Calendar, Clock, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen items-center">
      <header className="bg-white py-4 border-b w-full">
        <div className="container flex justify-between items-center max-w-7xl mx-auto px-4">
          <h1 className="text-2xl font-bold">LearnFlow</h1>
          <Link href="/dashboard">
            <Button>대시보드 바로가기</Button>
          </Link>
        </div>
      </header>

      <main className="flex-grow w-full">
        <section className="py-20 bg-gradient-to-b from-white to-gray-50 w-full">
          <div className="container text-center max-w-7xl mx-auto px-4">
            <h2 className="text-4xl font-bold mb-4">
              학습 계획 관리의 모든 것
            </h2>
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              LearnFlow를 통해 단기/중기/장기 계획을 체계적으로 관리하고 학습
              성과를 추적하세요.
            </p>
            <Link href="/dashboard">
              <Button size="lg" className="font-semibold">
                시작하기 <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>

        <section className="py-16 bg-white w-full">
          <div className="container max-w-7xl mx-auto px-4">
            <h3 className="text-2xl font-bold text-center mb-12">주요 기능</h3>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-gray-50 p-6 rounded-lg">
                <Calendar className="h-10 w-10 text-primary mb-4" />
                <h4 className="text-xl font-semibold mb-2">계획 관리</h4>
                <p className="text-gray-600">
                  단기, 중기, 장기 목표를 설정하고 체계적으로 관리하세요.
                </p>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <BookOpen className="h-10 w-10 text-primary mb-4" />
                <h4 className="text-xl font-semibold mb-2">학습 기록</h4>
                <p className="text-gray-600">
                  일일 학습 내용을 기록하고 목표와 연결하여 성장을 확인하세요.
                </p>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <Clock className="h-10 w-10 text-primary mb-4" />
                <h4 className="text-xl font-semibold mb-2">뽀모도로 타이머</h4>
                <p className="text-gray-600">
                  효율적인 학습을 위한 30분 집중, 5분 휴식의 타이머를
                  활용하세요.
                </p>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <BarChart2 className="h-10 w-10 text-primary mb-4" />
                <h4 className="text-xl font-semibold mb-2">통계 대시보드</h4>
                <p className="text-gray-600">
                  학습 시간과 목표 달성률을 시각화하여 동기 부여를 얻으세요.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-white py-6 w-full">
        <div className="container text-center max-w-7xl mx-auto px-4">
          <p>© {new Date().getFullYear()} LearnFlow. 모든 권리 보유.</p>
        </div>
      </footer>
    </div>
  );
}
