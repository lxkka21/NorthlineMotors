-- Supports databases that were initialized from the first scaffold migration.
-- Fresh databases already have the canonical public.users table from migration 001.
alter table if exists public.app_users rename to users;

create unique index if not exists users_email_ci_idx on public.users (lower(email));

