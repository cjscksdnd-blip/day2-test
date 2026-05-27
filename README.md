# Board App

React + TypeScript + Vite + Supabase 로 만든 게시판 웹 앱

## 기능
- 회원가입 / 로그인 (Supabase Auth)
- 게시글 목록 (페이지네이션, 카드형 UI)
- 게시글 상세보기, 작성, 수정, 삭제
- 댓글 작성, 삭제 (본인만)
- RLS로 본인 글/댓글만 수정·삭제
- 화이트 + 그린 디자인, 모바일 반응형

## 시작하기

### 1. Supabase 프로젝트 설정
1. [Supabase](https://supabase.com) 에서 새 프로젝트 생성
2. **SQL Editor**에서 `supabase_setup.sql` 전체 내용을 실행
3. Authentication > Providers > Email 활성화 확인

### 2. 환경변수 설정
```bash
cp .env.example .env
```
`.env` 파일에 Supabase 프로젝트 URL과 anon key 입력:
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```
> Settings > API 에서 확인 가능

### 3. 의존성 설치 및 실행
```bash
npm install
npm run dev
```

## 기술 스택
- React 19 + TypeScript
- Vite
- Supabase (Auth + PostgreSQL + RLS)
- React Router v6
- CSS Modules
