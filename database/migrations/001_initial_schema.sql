create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists users_email_idx on public.users (lower(email));

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  make text not null,
  model text not null,
  category text not null,
  price numeric(12, 2) not null check (price >= 0),
  quantity_in_stock integer not null default 0 check (quantity_in_stock >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vehicles_make_idx on public.vehicles (lower(make));
create index if not exists vehicles_model_idx on public.vehicles (lower(model));
create index if not exists vehicles_category_idx on public.vehicles (lower(category));
