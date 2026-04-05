do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'game_invites'
      and column_name = 'from_profile_id'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'game_invites'
      and column_name = 'from_uid'
  ) then
    alter table public.game_invites rename column from_profile_id to from_uid;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'game_invites'
      and column_name = 'to_profile_id'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'game_invites'
      and column_name = 'to_uid'
  ) then
    alter table public.game_invites rename column to_profile_id to to_uid;
  end if;
end $$;

alter table public.game_invites
  add column if not exists nickname text,
  add column if not exists avatar_url text,
  add column if not exists updated_at timestamptz not null default now();

drop index if exists public.game_invites_to_status_idx;
create index if not exists game_invites_to_uid_status_created_idx
  on public.game_invites (to_uid, status, created_at desc);
create index if not exists idx_game_invites_from_uid
  on public.game_invites (from_uid);
create index if not exists idx_game_invites_to_uid
  on public.game_invites (to_uid);
create index if not exists idx_game_invites_game_id
  on public.game_invites (game_id);

drop trigger if exists trg_game_invites_updated_at on public.game_invites;
create trigger trg_game_invites_updated_at
before update on public.game_invites
for each row
execute function public.set_updated_at();

drop policy if exists "game_invites_inbox_read" on public.game_invites;
create policy "game_invites_inbox_read"
  on public.game_invites
  for select
  using (auth.uid() in (from_uid, to_uid));

drop policy if exists "game_invites_sender_insert" on public.game_invites;
create policy "game_invites_sender_insert"
  on public.game_invites
  for insert
  with check (auth.uid() = from_uid);

drop policy if exists "game_invites_recipient_update" on public.game_invites;
create policy "game_invites_recipient_update"
  on public.game_invites
  for update
  using (auth.uid() = to_uid or auth.uid() = from_uid)
  with check (auth.uid() = to_uid or auth.uid() = from_uid);
