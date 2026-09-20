# Supabase 설정 방법

1. [supabase.com](https://supabase.com)에서 새 프로젝트를 생성합니다.
2. 프로젝트 대시보드의 **SQL Editor**에서 `01_auth_and_profiles.sql`을 실행합니다.
   (`02_membership_domain_draft.sql`은 회원/이용권/결제/출석/예약 화면을 실제로
   만들 때 함께 검토 후 실행하세요. 아직 프론트엔드에서 쓰지 않습니다.)
3. **Project Settings > API**에서 `Project URL`과 `anon public` 키를 복사합니다.
4. 프론트엔드 루트에 `.env` 파일을 만들고 아래처럼 채웁니다 (`.env.example` 참고):

   ```
   VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=xxxxxxxx
   ```

5. **Authentication > Providers > Email**에서 "Confirm email"을 끄면 가입 즉시
   로그인 세션이 발급됩니다. 켜두면 이메일 인증 링크를 클릭해야 로그인할 수
   있습니다 (운영 환경에서는 켜두는 것을 권장).
6. `npm run dev`로 재시작하면 회원가입/로그인이 실제 Supabase 계정으로 동작합니다.
