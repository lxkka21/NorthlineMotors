-- Supports databases that were initialized from the first scaffold migration.
-- Fresh databases already have the canonical public.users table from migration 001.
do $$
begin
  if to_regclass('public.app_users') is not null then
    if to_regclass('public.users') is null then
      alter table public.app_users rename to users;
    else
      raise exception 'Both public.app_users and public.users exist; migration stopped for manual review';
    end if;
  end if;
end;
$$;

create unique index if not exists users_email_ci_idx on public.users (lower(email));
alter table if exists public.users enable row level security;
