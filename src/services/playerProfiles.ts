import { supabase } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import {
  MatchupSummary,
  PersistedGameState,
  Player,
  PlayerProfile,
  RecentCompletedGame,
  RecentPlayer,
  TriviaQuestion,
} from '../types';
import {
  isMissingRowError,
  isMissingTableError,
  logSupabaseError,
  nowIsoString,
} from './supabaseUtils';

function mapPostgresProfileToPlayerProfile(profile: any): PlayerProfile {
  if (!profile) {
    return null as any;
  }

  return {
    userId: profile.id,
    nickname: profile.nickname ?? null,
    avatarUrl: profile.avatar_url || undefined,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
  };
}

function normalizeStoredGameState(value: any): PersistedGameState {
  const state = value && typeof value === 'object' ? value : {};
  const players = Array.isArray(state.players) ? state.players : [];
  const playerIds = Array.isArray(state.playerIds)
    ? state.playerIds.filter((entry: unknown): entry is string => typeof entry === 'string')
    : players
        .map((player: any) => player?.uid)
        .filter((entry: unknown): entry is string => typeof entry === 'string');

  return {
    hostId: typeof state.hostId === 'string' ? state.hostId : playerIds[0] || '',
    playerIds,
    players,
    questionIds: Array.isArray(state.questionIds) ? state.questionIds : [],
    answers: state.answers && typeof state.answers === 'object' ? state.answers : {},
    currentQuestionId: typeof state.currentQuestionId === 'string' ? state.currentQuestionId : null,
    currentQuestionCategory: typeof state.currentQuestionCategory === 'string' ? state.currentQuestionCategory : null,
    currentQuestionIndex: typeof state.currentQuestionIndex === 'number' ? state.currentQuestionIndex : undefined,
    currentQuestionStartedAt: typeof state.currentQuestionStartedAt === 'number' ? state.currentQuestionStartedAt : null,
  };
}

function mapGameRowToRecentCompletedGame(row: any, uid: string): RecentCompletedGame {
  const state = normalizeStoredGameState(row.game_state);
  const result = row.result && typeof row.result === 'object' ? row.result : {};
  const players = state.players.map((player) => ({
    uid: player.uid,
    nickname: player.name || 'Player',
  }));

  return {
    gameId: row.id,
    players,
    winnerId: row.winner_user_id,
    finalScores: result.finalScores && typeof result.finalScores === 'object' ? result.finalScores : {},
    categoriesUsed: Array.isArray(result.categoriesUsed) ? result.categoriesUsed : [],
    completedAt: new Date(row.updated_at || row.created_at).getTime(),
    status: 'completed',
    opponentIds: state.playerIds.filter((playerId) => playerId !== uid),
  };
}

async function loadCompletedGamesForUser(uid: string): Promise<RecentCompletedGame[]> {
  const { data, error } = await supabase
    .from('games')
    .select('id, status, winner_user_id, game_state, result, created_at, updated_at')
    .eq('status', 'completed')
    .order('updated_at', { ascending: false })
    .limit(50);

  if (error) {
    logSupabaseError('games', 'select', error, { uid, purpose: 'completed-games' });
    throw error;
  }

  return (data || [])
    .filter((row) => normalizeStoredGameState(row.game_state).playerIds.includes(uid))
    .map((row) => mapGameRowToRecentCompletedGame(row, uid))
    .slice(0, 5);
}

export async function ensurePlayerProfile(user: SupabaseUser, nickname?: string) {
  const { data: existingProfile, error: getError } = await supabase
    .from('profiles')
    .select('id, nickname, avatar_url, created_at')
    .eq('id', user.id)
    .maybeSingle();

  if (getError && !isMissingRowError(getError)) {
    logSupabaseError('profiles', 'select', getError, { userId: user.id });
    throw getError;
  }

  const identity = user.user_metadata ?? {};
  const now = nowIsoString();
  const desiredNickname =
    nickname?.trim() ||
    identity.nickname ||
    identity.full_name ||
    identity.name ||
    existingProfile?.nickname ||
    null;
  const desiredAvatarUrl =
    identity.avatar_url ||
    identity.picture ||
    existingProfile?.avatar_url ||
    null;

  const payload = {
    id: user.id,
    nickname: desiredNickname,
    avatar_url: desiredAvatarUrl,
    created_at: existingProfile?.created_at || now,
    updated_at: now,
  };

  const { error: upsertError } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'id' });

  if (upsertError) {
    logSupabaseError('profiles', 'upsert', upsertError, { userId: user.id });
    throw upsertError;
  }
}

export function subscribePlayerProfile(
  uid: string,
  callback: (profile: PlayerProfile | null) => void,
  onError?: (error: unknown) => void
) {
  const channel = supabase
    .channel(`profile-${uid}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${uid}` },
      (payload) => {
        callback(mapPostgresProfileToPlayerProfile(payload.new));
      }
    )
    .subscribe((status) => {
      if (status !== 'SUBSCRIBED') {
        return;
      }

      supabase
        .from('profiles')
        .select('id, nickname, avatar_url, created_at, updated_at')
        .eq('id', uid)
        .maybeSingle()
        .then(({ data, error }) => {
          if (error) {
            if (isMissingRowError(error)) {
              callback(null);
              return;
            }

            logSupabaseError('profiles', 'select', error, { userId: uid, purpose: 'subscribePlayerProfile' });
            onError?.(error);
            return;
          }

          callback(mapPostgresProfileToPlayerProfile(data));
        });
    });

  return () => {
    void supabase.removeChannel(channel);
  };
}

export function subscribeRecentPlayers(
  uid: string,
  callback: (players: RecentPlayer[]) => void,
  onError?: (error: unknown) => void
) {
  const channel = supabase
    .channel(`recent-players-${uid}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'recent_players', filter: `user_id=eq.${uid}` },
      () => {
        loadRecentPlayers(uid).then(callback).catch(onError);
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        loadRecentPlayers(uid).then(callback).catch(onError);
      }
    });

  return () => {
    void supabase.removeChannel(channel);
  };
}

async function loadRecentPlayers(uid: string): Promise<RecentPlayer[]> {
  const { data, error } = await supabase
    .from('recent_players')
    .select('*')
    .eq('user_id', uid)
    .eq('hidden', false)
    .order('last_played_at', { ascending: false })
    .limit(12);

  if (error) {
    if (isMissingTableError(error)) {
      return [];
    }

    logSupabaseError('recent_players', 'select', error, { uid });
    throw error;
  }

  return (data || []).map((row) => ({
    uid: row.opponent_id,
    nickname: row.nickname || 'Player',
    avatarUrl: row.avatar_url || undefined,
    lastPlayedAt: row.last_played_at ? new Date(row.last_played_at).getTime() : Date.now(),
    lastGameId: row.last_game_id || undefined,
    hidden: !!row.hidden,
    updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : Date.now(),
  }));
}

export function subscribeRecentCompletedGames(
  uid: string,
  callback: (games: RecentCompletedGame[]) => void,
  onError?: (error: unknown) => void
) {
  loadCompletedGamesForUser(uid).then(callback).catch(onError);

  const channel = supabase
    .channel(`completed-games-${uid}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'games' }, () => {
      loadCompletedGamesForUser(uid).then(callback).catch(onError);
    })
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export async function loadMatchupHistory(uid: string, opponentUid: string) {
  const allGames = await loadCompletedGamesForUser(uid);
  const games = allGames.filter((game) => game.opponentIds?.includes(opponentUid)).slice(0, 5);

  let summary: MatchupSummary | null = null;
  if (games.length > 0) {
    const wins = games.filter((game) => game.winnerId === uid).length;
    const losses = games.filter((game) => game.winnerId === opponentUid).length;
    const latestGame = games[0];
    const opponentEntry = latestGame.players.find((player) => player.uid === opponentUid);

    const { data: recentRow, error: recentError } = await supabase
      .from('recent_players')
      .select('nickname, avatar_url, last_played_at')
      .eq('user_id', uid)
      .eq('opponent_id', opponentUid)
      .maybeSingle();

    if (recentError && !isMissingRowError(recentError) && !isMissingTableError(recentError)) {
      logSupabaseError('recent_players', 'select', recentError, { uid, opponentUid, purpose: 'matchup-summary' });
    }

    summary = {
      opponentId: opponentUid,
      opponentNickname: recentRow?.nickname || opponentEntry?.nickname || 'Player',
      opponentAvatarUrl: recentRow?.avatar_url || undefined,
      wins,
      losses,
      totalGames: games.length,
      lastPlayedAt: recentRow?.last_played_at
        ? new Date(recentRow.last_played_at).getTime()
        : latestGame.completedAt,
    };
  }

  return { summary, games };
}

export async function removeRecentPlayer(uid: string, opponentUid: string) {
  const { error } = await supabase
    .from('recent_players')
    .update({ hidden: true, updated_at: nowIsoString() })
    .eq('user_id', uid)
    .eq('opponent_id', opponentUid);

  if (error) {
    if (isMissingTableError(error)) {
      return;
    }

    logSupabaseError('recent_players', 'update', error, { uid, opponentUid, operation: 'hide' });
    throw error;
  }
}

export async function updateRecentPlayer(
  uid: string,
  opponentUid: string,
  patch: Record<string, unknown>
) {
  const { error } = await supabase
    .from('recent_players')
    .upsert(
      {
        user_id: uid,
        opponent_id: opponentUid,
        ...patch,
        updated_at: nowIsoString(),
      },
      { onConflict: 'user_id,opponent_id' }
    );

  if (error) {
    if (isMissingTableError(error)) {
      return;
    }

    logSupabaseError('recent_players', 'upsert', error, { uid, opponentUid, patchKeys: Object.keys(patch) });
    throw error;
  }
}

export async function recordQuestionStats({
  uid,
  category,
  isCorrect,
}: {
  uid: string;
  category: string;
  isCorrect: boolean;
}) {
  const { error } = await supabase.rpc('record_question_stats', {
    p_uid: uid,
    p_category: category,
    p_is_correct: isCorrect,
  });

  if (error) {
    logSupabaseError('rpc:record_question_stats', 'rpc', error, { uid, category, isCorrect });
    throw error;
  }
}

export async function recordCompletedGame({
  gameId,
  players,
  winnerId,
  finalScores,
  questions,
  status,
  completedAt,
}: {
  gameId: string;
  players: Player[];
  winnerId: string | null;
  finalScores: Record<string, number>;
  questions: TriviaQuestion[];
  status: 'completed';
  completedAt: number;
}) {
  const categoriesUsed = Array.from(
    new Set(questions.filter((question) => question.used).map((question) => question.category))
  );

  const { error } = await supabase
    .from('games')
    .update({
      status,
      winner_user_id: winnerId,
      result: { finalScores, categoriesUsed },
      updated_at: new Date(completedAt).toISOString(),
      game_state: {
        players,
        playerIds: players.map((player) => player.uid),
      },
    })
    .eq('id', gameId);

  if (error) {
    logSupabaseError('games', 'update', error, { gameId, winnerId });
    throw error;
  }
}
