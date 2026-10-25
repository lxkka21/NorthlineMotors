-- Add a stable vehicle year for inventory and historical order snapshots.
alter table public.vehicles add column if not exists year integer not null default 2025;
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'vehicles_year_check' and conrelid = 'public.vehicles'::regclass
  ) then
    alter table public.vehicles add constraint vehicles_year_check check (year between 1886 and 2100);
  end if;
end;
$$;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default ('NM-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
  user_id uuid not null references public.users(id) on delete restrict,
  customer_name text not null,
  contact text not null,
  fulfillment text not null check (fulfillment in ('pickup', 'delivery')),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  total numeric(14, 2) not null default 0 check (total >= 0),
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, idempotency_key)
);

create index if not exists orders_user_created_idx on public.orders (user_id, created_at desc);
create index if not exists orders_status_idx on public.orders (status);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  make text not null,
  model text not null,
  category text not null,
  year integer,
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now()
);

create index if not exists order_items_order_idx on public.order_items (order_id);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create or replace function public.create_order(
  p_user_id uuid,
  p_customer_name text,
  p_contact text,
  p_fulfillment text,
  p_idempotency_key text,
  p_items jsonb
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_order public.orders;
  created_order public.orders;
  item jsonb;
  selected_vehicle public.vehicles;
  item_quantity integer;
  calculated_total numeric(14, 2) := 0;
begin
  -- Serialize retries for the same customer/key before checking the unique key.
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':' || p_idempotency_key, 0));
  select * into existing_order from public.orders
  where user_id = p_user_id and idempotency_key = p_idempotency_key;
  if found then return existing_order; end if;

  if p_customer_name is null or length(trim(p_customer_name)) = 0 or p_fulfillment not in ('pickup', 'delivery') then
    raise exception 'INVALID_ORDER_DETAILS' using errcode = 'P0003';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'INVALID_ORDER_ITEMS' using errcode = 'P0003';
  end if;

  insert into public.orders (user_id, customer_name, contact, fulfillment, idempotency_key)
  values (p_user_id, trim(p_customer_name), trim(p_contact), p_fulfillment, p_idempotency_key)
  returning * into created_order;

  for item in select value from jsonb_array_elements(p_items)
  loop
    item_quantity := (item->>'quantity')::integer;
    select * into selected_vehicle from public.vehicles where id = (item->>'vehicleId')::uuid for update;
    if not found then raise exception 'VEHICLE_NOT_FOUND' using errcode = 'P0002'; end if;
    if item_quantity is null or item_quantity <= 0 or selected_vehicle.quantity_in_stock < item_quantity then
      raise exception 'INSUFFICIENT_STOCK' using errcode = 'P0001';
    end if;

    update public.vehicles
    set quantity_in_stock = quantity_in_stock - item_quantity, updated_at = now()
    where id = selected_vehicle.id;
    calculated_total := calculated_total + (selected_vehicle.price * item_quantity);
    insert into public.order_items (order_id, vehicle_id, make, model, category, year, unit_price, quantity)
    values (created_order.id, selected_vehicle.id, selected_vehicle.make, selected_vehicle.model, selected_vehicle.category, selected_vehicle.year, selected_vehicle.price, item_quantity);
  end loop;

  update public.orders set total = calculated_total, updated_at = now() where id = created_order.id returning * into created_order;
  return created_order;
end;
$$;

revoke all on function public.create_order(uuid, text, text, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.create_order(uuid, text, text, text, text, jsonb) to service_role;
