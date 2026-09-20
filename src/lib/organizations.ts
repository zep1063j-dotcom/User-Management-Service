import { supabase } from './supabaseClient';
import type { Organization } from '../types/domain';

export async function fetchMyOrganization(): Promise<Organization | null> {
  const { data, error } = await supabase.from('organizations').select('*').maybeSingle();
  if (error) throw error;
  return data;
}
