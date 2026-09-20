import { supabase } from './supabaseClient';

export interface UpdateMyProfileInput {
  userId: string;
  name: string;
  phone: string;
  email?: string; // 기존 로그인 이메일과 다를 때만 전달합니다.
}

// 이름/전화번호/이메일을 한 번에 저장합니다. 이름은 profiles.name과
// auth.users의 user_metadata.name을 함께 갱신해 화면 어디서나(상단바,
// 스태프 관리 목록 등) 일관되게 보이도록 하고, 이메일이 바뀐 경우 Supabase
// 인증 메일을 통한 확인 절차가 끝나야 실제로 적용됩니다.
export async function updateMyProfile({
  userId,
  name,
  phone,
  email,
}: UpdateMyProfileInput): Promise<void> {
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ name, phone: phone || null })
    .eq('id', userId);
  if (profileError) throw profileError;

  const { error: authError } = await supabase.auth.updateUser(
    email ? { data: { name }, email } : { data: { name } }
  );
  if (authError) throw authError;
}

export async function changePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

// 비밀번호를 바로 바꾸는 대신, 본인 이메일로 인증 링크를 보내 그 링크를 통해서만
// 새 비밀번호를 설정할 수 있게 합니다 (계정 탈취 시 비밀번호가 임의로 바뀌는 것을 방지).
export async function sendPasswordResetEmail(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  });
  if (error) throw error;
}

// 현재 세션을 제외한 다른 기기/브라우저의 로그인을 모두 종료합니다.
export async function signOutOtherSessions(): Promise<void> {
  const { error } = await supabase.auth.signOut({ scope: 'others' });
  if (error) throw error;
}

export async function countAdmins(): Promise<number> {
  const { count, error } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'admin');
  if (error) throw error;
  return count ?? 0;
}

// 회원(스태프 계정) 탈퇴: profiles 행을 삭제하고 로그아웃합니다.
// 로그인 자격증명(auth.users) 자체를 삭제하려면 서버 권한(service role)이
// 필요해 아직 지원하지 않습니다 — 탈퇴 즉시 이 CRM에 대한 모든 접근 권한이
// 사라지지만, 같은 이메일로 다시 로그인은 가능한 상태로 남습니다.
export async function withdrawMyAccount(userId: string): Promise<void> {
  const { error } = await supabase.from('profiles').delete().eq('id', userId);
  if (error) throw error;

  await supabase.auth.signOut();
}
