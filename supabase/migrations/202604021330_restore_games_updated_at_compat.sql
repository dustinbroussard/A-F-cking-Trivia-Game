alter table public.games
  add column if not exists updated_at timestamptz not null default now();

update public.games
set updated_at = coalesce(updated_at, last_updated_at, created_at, now())
where updated_at is distinct from coalesce(updated_at, last_updated_at, created_at, now());

create or replace function public.sync_games_timestamp_compat()
returns trigger
language plpgsql
as $$
begin
  if new.last_updated_at is null then
    new.last_updated_at := coalesce(old.last_updated_at, old.updated_at, now());
  end if;

  if new.updated_at is null then
    new.updated_at := coalesce(new.last_updated_at, old.updated_at, old.last_updated_at, now());
  end if;

  if new.last_updated_at is distinct from old.last_updated_at
     and new.updated_at is not distinct from old.updated_at then
    new.updated_at := new.last_updated_at;
  elsif new.updated_at is distinct from old.updated_at
     and new.last_updated_at is not distinct from old.last_updated_at then
    new.last_updated_at := new.updated_at;
  elsif new.updated_at is distinct from old.updated_at
     and new.last_updated_at is distinct from old.last_updated_at
     and new.updated_at is distinct from new.last_updated_at then
    new.updated_at := greatest(new.updated_at, new.last_updated_at);
    new.last_updated_at := new.updated_at;
  end if;

  return new;
end;
$$;

drop trigger if exists sync_games_timestamp_compat on public.games;

create trigger sync_games_timestamp_compat
before update on public.games
for each row
execute function public.sync_games_timestamp_compat();
