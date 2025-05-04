# LearnFlow - 학습 계획 및 공부 기록 관리 애플리케이션

LearnFlow는 학습 과정을 보다 효율적으로 관리할 수 있게 도와주는 웹 애플리케이션입니다. 단기, 중기, 장기 계획을 생성하고, 공부 내역을 기록하며, 통계를 통해 학습 진행 상황을 확인할 수 있습니다.

## 주요 기능

1. **계획 관리**

   - 단기, 중기, 장기 계획 생성 및 관리
   - 계획 내 하위 계획 설정 기능
   - 진행 상태 및 완료율 추적

2. **공부 기록**

   - 일일 공부 내역 등록
   - 공부 내역을 계획과 연결
   - 공부 시간 및 내용 기록

3. **뽀모도로 타이머**

   - 30분 학습, 5분 휴식 기본 설정
   - 맞춤형 타이머 설정 가능
   - 작업 세션 카운팅

4. **통계 대시보드**
   - 총 공부 시간 및 일일 평균 조회
   - 계획 달성률 시각화
   - 주간 학습 추세 그래프

## 기술 스택

- **프론트엔드**: Next.js, React, TypeScript, Tailwind CSS
- **UI 컴포넌트**: shadcn/ui
- **상태 관리**: Zustand
- **데이터베이스**: MongoDB (MongoDB Atlas 지원)
- **차트 시각화**: Recharts

## 로컬 개발 환경 설정

1. 저장소 클론

```bash
git clone https://github.com/username/learn-flow.git
cd learn-flow
```

2. 의존성 설치

```bash
npm install
# 또는
pnpm install
```

3. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 내용 추가:

```
MONGODB_URI=mongodb://localhost:27017/learnflow
# 또는 MongoDB Atlas URI
```

4. 개발 서버 실행

```bash
npm run dev
# 또는
pnpm dev
```

5. 브라우저에서 확인

```
http://localhost:3000
```

## 데이터 영속화

기본적으로 브라우저 로컬 스토리지에 데이터가 저장됩니다. 데이터를 데이터베이스에 영구적으로 저장하려면:

1. MongoDB 설정 (로컬 또는 MongoDB Atlas)
2. `.env.local` 파일에 연결 문자열 설정
3. API를 통한 데이터 영속화 기능 활성화

## 프로젝트 구조

```
learn-flow/
├── app/
│   ├── (routes)/
│   │   ├── (auth)/
│   │   └── (dashboard)/
│   ├── api/
│   │   ├── plans/
│   │   ├── study-logs/
│   │   └── stats/
│   ├── components/
│   │   ├── plan/
│   │   ├── study/
│   │   ├── pomodoro/
│   │   └── stats/
│   ├── lib/
│   │   ├── models/
│   │   ├── db.ts
│   │   ├── store.ts
│   │   └── types/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── ui/
├── public/
└── README.md
```

## 라이선스

MIT
