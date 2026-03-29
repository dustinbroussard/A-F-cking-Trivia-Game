# Supabase Schema Alignment

This document now distinguishes between two different contracts:

1. Repo schema files: [`supabase/schema.sql`](/home/dustin/Projects/A-F-cking-Trivia-Game/supabase/schema.sql) and historical migrations in [`supabase/migrations`](/home/dustin/Projects/A-F-cking-Trivia-Game/supabase/migrations)
2. Live database schema: the schema currently running in the active Supabase project

Do not assume the repo schema is production truth.

## Current Source Of Truth

For the playable build, the live database schema is the primary target.

The matrix below is based on:
- observed runtime behavior from the live app logs
- the live `record_game_answer` PostgREST error hint
- the current frontend codepaths in [`src/services/gameService.ts`](/home/dustin/Projects/A-F-cking-Trivia-Game/src/services/gameService.ts) and [`src/App.tsx`](/home/dustin/Projects/A-F-cking-Trivia-Game/src/App.tsx)

Where the full live DDL is not quoted here, entries are marked as inferred from runtime evidence.

## Playable-Build Compatibility Matrix

| Area | Frontend currently expects | Live schema evidence | Status vs live | Priority | Notes |
| --- | --- | --- | --- | --- | --- |
| `games` row existence and resume lookup | `games` table readable by `id` and resumable `status` | Confirmed by live resume flow logs and repeated `games` snapshot fetches | Match | P0 | Core resume path already works against live |
| `games.status` values | `waiting`, `active`, `completed`, `abandoned` | Confirmed `active` and `waiting` behavior in logs and code paths | Match | P0 | No immediate change needed |
| current turn field | frontend reads and writes `current_turn_user_id`, mapped to `game.currentTurn` | Observed working in logs: `currentTurnField` and waiting-state logic behave correctly | Match | P0 | This is still the field the playable build should target |
| question-in-progress storage | frontend uses `game_state.currentQuestionId`, category, index, startedAt | Observed working: question set, resume restore, and fallback refresh all depend on `game_state` | Match | P0 | Current app contract is still denormalized here |
| player roster and scores | frontend expects `game_state.players` and `game_state.playerIds` | Observed working in join flow, resume flow, and scoreboard logs | Match | P0 | Current live DB is close to the frontend contract here |
| answer persistence | frontend expects either RPC side effects or refreshed `game.answers` | Partial evidence only; app currently depends on RPC plus denormalized state | Partial | P0 | Compatibility patch added in frontend |
| `record_game_answer` RPC name | frontend calls `record_game_answer` | Confirmed by live 404/PGRST202 response | Match | P0 | Function name is correct |
| `record_game_answer` RPC signature | frontend previously called `(p_game_id, p_question_id, p_user_id, p_answer)` | Live error hint points to `(p_game_id, p_is_correct, p_question_id, p_user_id)` | Mismatch | P0 | Frontend now prefers live signature and falls back to legacy |
| `record_game_answer` turn-advance behavior | frontend implicitly relied on RPC or subscription to move turn on wrong answers | Inferred from missing local turn switch in UI and game rules in README | Partial / risky | P0 | Frontend now adds guarded wrong-answer fallback turn switch |
| wrong-answer turn switch | game should pass turn to opponent in multiplayer | README says wrong answers end the turn; previous UI did not enforce that locally | Mismatch | P0 | Patched |
| correct-answer flow | same player can continue after correct answer | Current UI logic already preserves same-player flow | Match | P0 | No change needed |
| `game_messages` | frontend uses `game_messages(game_id, user_id, content, created_at?)` and treats chat as optional | Live chat table exists enough to subscribe/query, but exact column contract is not yet re-verified against live DDL | Partial | P2 | Non-blocking for gameplay loop |
| `user_seen_questions` | `user_id`, `question_id`, `created_at` | Confirmed by logs and current queries | Match | P1 | Already aligned enough for gameplay |
| repo canonical normalized schema | `games + game_players + game_questions + game_answers` | Present only in repo schema files, not safe to treat as live production contract | Different contract | Later | Defer until game is stable |

## Immediate Findings

### Already matching the live app contract

- `games` row fetch by `id`
- `status`-based resume and lobby/game routing
- `current_turn_user_id`
- denormalized `game_state.playerIds`
- denormalized `game_state.players`
- denormalized current-question metadata in `game_state`
- `user_seen_questions`

### Still mismatching the live app contract

- `record_game_answer` argument shape
- wrong-answer turn switching was not safely enforced in the frontend
- answer submission path depended too much on one specific RPC behavior

## Fix Order For A Playable Live-Schema Build

1. Keep the app on the live denormalized game contract for now.
2. Prefer the live `record_game_answer(p_game_id, p_is_correct, p_question_id, p_user_id)` signature.
3. Fall back to the legacy `p_answer` payload only if the live signature is unavailable.
4. On incorrect multiplayer answers, locally switch `current_turn` to the opponent if the refreshed game state does not show that the RPC already advanced the turn.
5. Leave repo-schema normalization work for a later coordinated app-plus-DB migration.

## Code Areas Touched For Live Compatibility

- [`src/services/gameService.ts`](/home/dustin/Projects/A-F-cking-Trivia-Game/src/services/gameService.ts)
  - `recordAnswer` now prefers the live RPC signature and retries with the legacy payload only when needed
- [`src/App.tsx`](/home/dustin/Projects/A-F-cking-Trivia-Game/src/App.tsx)
  - wrong-answer branch now applies a guarded turn-switch fallback
  - local player state is updated immediately after answer resolution to reduce stale UI behavior

## Deferred Work

Do not do these until the live-schema build is stable:

- migrate gameplay to repo `supabase/schema.sql`
- replace denormalized `game_state` with normalized `game_players`, `game_questions`, and `game_answers`
- move realtime aggregation to the repo canonical model
- unify repo schema and live schema through a deliberate migration plan
