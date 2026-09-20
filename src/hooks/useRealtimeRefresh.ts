import { useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

// 특정 테이블에 변경(추가/수정/삭제)이 생기면 onChange를 호출해 화면을 다시
// 불러오게 합니다. RLS는 REST 조회 때와 동일하게 적용되므로(내 업체/지점
// 범위 밖 변경은 애초에 알림이 오지 않음), payload 내용은 쓰지 않고 그냥
// "다시 불러와라"는 신호로만 사용합니다.
export function useRealtimeRefresh(table: string, onChange: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const channel = supabase
      .channel(`realtime-${table}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        onChange();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, onChange, enabled]);
}
