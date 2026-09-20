import { supabase } from './supabaseClient';
import type { Profile, StaffRole } from '../types/domain';

export async function fetchMyProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function fetchAllProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function updateStaffRoleAndBranch(
  id: string,
  role: StaffRole,
  branchName: string
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ role, branch_name: branchName })
    .eq('id', id);

  if (error) throw error;
}
