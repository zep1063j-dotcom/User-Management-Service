import { supabase } from './supabaseClient';
import type { Branch } from '../types/domain';

export async function fetchBranches(): Promise<Branch[]> {
  const { data, error } = await supabase
    .from('branches')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function createBranch(name: string): Promise<Branch> {
  const { data, error } = await supabase
    .from('branches')
    .insert({ name })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// 회원이 남아있는 지점은 삭제할 수 없도록 막습니다 (데이터가 조회 목록에서
// 사라지는 것을 방지). branches는 별도 테이블이라 DB 제약으로는 막을 수
// 없어 애플리케이션 레벨에서 확인합니다.
export async function deleteBranch(branch: Branch): Promise<void> {
  const { count, error: countError } = await supabase
    .from('members')
    .select('id', { count: 'exact', head: true })
    .eq('branch_name', branch.name);

  if (countError) throw countError;
  if (count && count > 0) {
    throw new Error(
      `${branch.name}에 등록된 회원이 ${count}명 있어 삭제할 수 없습니다.`
    );
  }

  const { error } = await supabase.from('branches').delete().eq('id', branch.id);
  if (error) throw error;
}
