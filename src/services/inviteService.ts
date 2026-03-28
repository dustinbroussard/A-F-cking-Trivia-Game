import { supabase } from '../lib/supabase';
import { GameInvite } from '../types';
import { isMissingTableError, logSupabaseError, nowIsoString } from './supabaseUtils';

export function subscribeToIncomingInvites(
  userId: string,
  callback: (invites: GameInvite[]) => void,
  onError?: (err: any) => void
) {
  const channel = supabase
    .channel(`invites-${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'game_invites', filter: `to_uid=eq.${userId}` },
      () => {
        loadInvites(userId).then(callback).catch(onError);
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        loadInvites(userId).then(callback).catch(onError);
      }
    });

  return () => {
    void supabase.removeChannel(channel);
  };
}

async function loadInvites(userId: string): Promise<GameInvite[]> {
  const { data, error } = await supabase
    .from('game_invites')
    .select('*')
    .eq('to_uid', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    if (isMissingTableError(error)) {
      return [];
    }
    logSupabaseError('game_invites', 'select', error, { userId });
    throw error;
  }
  
  return (data || []).map(d => ({
    id: d.id,
    gameId: d.game_id,
    fromUid: d.from_uid,
    fromNickname: d.nickname,
    fromAvatarUrl: d.avatar_url,
    toUid: d.to_uid,
    status: d.status as any,
    createdAt: new Date(d.created_at).getTime(),
  }));
}

export async function sendInvite(
  from: { uid: string; nickname: string; avatarUrl?: string },
  to: { uid: string },
  gameId: string
) {
  const { error } = await supabase
    .from('game_invites')
    .insert({
      game_id: gameId,
      from_uid: from.uid,
      nickname: from.nickname,
      avatar_url: from.avatarUrl,
      to_uid: to.uid,
      status: 'pending',
      created_at: nowIsoString(),
      updated_at: nowIsoString(),
    });
  if (error) {
    logSupabaseError('game_invites', 'insert', error, { fromUid: from.uid, toUid: to.uid, gameId });
    throw error;
  }
}

export async function acceptInvite(inviteId: string, userId: string) {
  const { error } = await supabase
    .from('game_invites')
    .update({ status: 'accepted', updated_at: nowIsoString() })
    .eq('id', inviteId)
    .eq('to_uid', userId);
  if (error) {
    logSupabaseError('game_invites', 'update', error, { inviteId, userId, status: 'accepted' });
    throw error;
  }
}

export async function declineInvite(inviteId: string, userId: string) {
  const { error } = await supabase
    .from('game_invites')
    .update({ status: 'declined', updated_at: nowIsoString() })
    .eq('id', inviteId)
    .eq('to_uid', userId);
  if (error) {
    logSupabaseError('game_invites', 'update', error, { inviteId, userId, status: 'declined' });
    throw error;
  }
}

export async function expireInvite(inviteId: string, userId: string) {
  const { error } = await supabase
    .from('game_invites')
    .update({ status: 'expired', updated_at: nowIsoString() })
    .eq('id', inviteId)
    .eq('to_uid', userId);
  if (error) {
    logSupabaseError('game_invites', 'update', error, { inviteId, userId, status: 'expired' });
    throw error;
  }
}
