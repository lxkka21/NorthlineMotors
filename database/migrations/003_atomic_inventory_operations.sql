create or replace function public.purchase_vehicle(p_vehicle_id uuid)
returns public.vehicles
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_vehicle public.vehicles;
begin
  update public.vehicles
  set quantity_in_stock = quantity_in_stock - 1,
      updated_at = now()
  where id = p_vehicle_id
    and quantity_in_stock > 0
  returning * into updated_vehicle;

  if not found then
    if not exists (select 1 from public.vehicles where id = p_vehicle_id) then
      raise exception 'VEHICLE_NOT_FOUND' using errcode = 'P0002';
    end if;
    raise exception 'OUT_OF_STOCK' using errcode = 'P0001';
  end if;

  return updated_vehicle;
end;
$$;

create or replace function public.restock_vehicle(p_vehicle_id uuid, p_quantity integer)
returns public.vehicles
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_vehicle public.vehicles;
begin
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'INVALID_RESTOCK_QUANTITY' using errcode = 'P0001';
  end if;

  update public.vehicles
  set quantity_in_stock = quantity_in_stock + p_quantity,
      updated_at = now()
  where id = p_vehicle_id
  returning * into updated_vehicle;

  if not found then
    raise exception 'VEHICLE_NOT_FOUND' using errcode = 'P0002';
  end if;

  return updated_vehicle;
end;
$$;

revoke all on function public.purchase_vehicle(uuid) from public, anon, authenticated;
revoke all on function public.restock_vehicle(uuid, integer) from public, anon, authenticated;
grant execute on function public.purchase_vehicle(uuid) to service_role;
grant execute on function public.restock_vehicle(uuid, integer) to service_role;

