-- Optional profile data for detailed public registration. Existing accounts remain valid.
alter table public.users add column if not exists full_name text;
alter table public.users add column if not exists phone text;
alter table public.users add column if not exists date_of_birth date;
alter table public.users add column if not exists address_line text;
alter table public.users add column if not exists city text;
alter table public.users add column if not exists state text;
alter table public.users add column if not exists postal_code text;
alter table public.users add column if not exists preferred_contact_method text;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'users_preferred_contact_method_check' and conrelid = 'public.users'::regclass) then
    alter table public.users add constraint users_preferred_contact_method_check check (preferred_contact_method is null or preferred_contact_method in ('email', 'phone'));
  end if;
end $$;

-- Optional vehicle merchandising fields used by the detail and admin forms.
alter table public.vehicles add column if not exists description text;
alter table public.vehicles add column if not exists image_url text;
alter table public.vehicles add column if not exists image_urls text[] not null default '{}';
alter table public.vehicles add column if not exists mileage integer;
alter table public.vehicles add column if not exists fuel_type text;
alter table public.vehicles add column if not exists transmission text;
alter table public.vehicles add column if not exists exterior_color text;
alter table public.vehicles add column if not exists engine_details text;
alter table public.vehicles add column if not exists seating_capacity integer;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'vehicles_mileage_check' and conrelid = 'public.vehicles'::regclass) then
    alter table public.vehicles add constraint vehicles_mileage_check check (mileage is null or mileage >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'vehicles_seating_check' and conrelid = 'public.vehicles'::regclass) then
    alter table public.vehicles add constraint vehicles_seating_check check (seating_capacity is null or seating_capacity between 1 and 20);
  end if;
end $$;
