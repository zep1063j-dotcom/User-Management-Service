import { supabase } from './supabaseClient';
import type { Reservation, ReservationClassType, Trainer } from '../types/domain';

export async function fetchTrainers(branchName: string): Promise<Trainer[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, branch_name')
    .in('role', ['trainer', 'admin'])
    .eq('branch_name', branchName);

  if (error) throw error;
  return data ?? [];
}

export interface CreateReservationInput {
  member_id: string;
  trainer_id?: string;
  branch_name: string;
  class_type: ReservationClassType;
  reserved_at: string; // ISO datetime
}

export async function createReservation(
  input: CreateReservationInput
): Promise<Reservation> {
  const { data, error } = await supabase
    .from('reservations')
    .insert({
      member_id: input.member_id,
      trainer_id: input.trainer_id || null,
      branch_name: input.branch_name,
      class_type: input.class_type,
      reserved_at: input.reserved_at,
      status: 'BOOKED',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchReservationsForMember(memberId: string): Promise<Reservation[]> {
  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .eq('member_id', memberId)
    .order('reserved_at', { ascending: false })
    .limit(20);

  if (error) throw error;
  return data ?? [];
}

export async function updateReservationStatus(
  reservationId: string,
  status: Reservation['status']
): Promise<void> {
  const { error } = await supabase
    .from('reservations')
    .update({ status })
    .eq('id', reservationId);

  if (error) throw error;
}
