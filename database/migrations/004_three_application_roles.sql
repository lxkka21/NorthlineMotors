-- Expand the application role model without changing existing user identities.
-- Existing admin users remain admins; existing user rows remain users.
alter table public.users drop constraint if exists users_role_check;
alter table public.users add constraint users_role_check check (role in ('admin', 'sales', 'user'));

create or replace function public.assign_user_role(p_actor_id uuid, p_target_id uuid, p_role text)
returns public.users
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_user public.users;
  target_user public.users;
  admin_count integer;
begin
  if p_role not in ('admin', 'sales', 'user') then
    raise exception 'INVALID_ROLE' using errcode = 'P0004';
  end if;
  if p_actor_id = p_target_id then
    raise exception 'SELF_ROLE_CHANGE' using errcode = 'P0005';
  end if;

  -- Serialize role changes across all current administrators before counting.
  perform id from public.users where role = 'admin' for update;
  select * into actor_user from public.users where id = p_actor_id;
  if not found or actor_user.role <> 'admin' then
    raise exception 'FORBIDDEN' using errcode = 'P0008';
  end if;
  select count(*) into admin_count from public.users where role = 'admin';
  select * into target_user from public.users where id = p_target_id for update;
  if not found then
    raise exception 'USER_NOT_FOUND' using errcode = 'P0006';
  end if;
  if target_user.role = 'admin' and p_role <> 'admin' and admin_count <= 1 then
    raise exception 'LAST_ADMIN' using errcode = 'P0007';
  end if;

  update public.users
  set role = p_role, updated_at = now()
  where id = p_target_id
  returning * into target_user;
  return target_user;
end;
$$;

revoke all on function public.assign_user_role(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.assign_user_role(uuid, uuid, text) to service_role;
