-- Northline Motors role simplification.
-- Preserve accounts and data while collapsing the retired sales role into user.
update public.users set role = 'user', updated_at = now() where role = 'sales';

alter table public.users drop constraint if exists users_role_check;
alter table public.users add constraint users_role_check check (role in ('admin', 'user'));

create or replace function public.assign_user_role(p_actor_id uuid, p_target_id uuid, p_role text)
returns public.users language plpgsql security definer set search_path = public as $$
declare updated_user public.users; admin_count integer;
begin
  if p_role not in ('admin', 'user') then raise exception 'INVALID_ROLE' using errcode = '22023'; end if;
  if p_target_id = p_actor_id then raise exception 'SELF_ROLE_CHANGE' using errcode = 'P0005'; end if;
  perform id from public.users where role = 'admin' for update;
  if (select role from public.users where id = p_actor_id) <> 'admin' then raise exception 'FORBIDDEN' using errcode = 'P0008'; end if;
  if p_role = 'user' and (select role from public.users where id = p_target_id) = 'admin' then
    select count(*) into admin_count from public.users where role = 'admin';
    if admin_count <= 1 then raise exception 'LAST_ADMIN' using errcode = '23514'; end if;
  end if;
  select * into updated_user from public.users where id = p_target_id for update;
  if updated_user.id is null then raise exception 'USER_NOT_FOUND' using errcode = 'P0002'; end if;
  update public.users set role = p_role, updated_at = now() where id = p_target_id returning * into updated_user;
  if updated_user.id is null then raise exception 'USER_NOT_FOUND' using errcode = 'P0002'; end if;
  return updated_user;
end; $$;

revoke all on function public.assign_user_role(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.assign_user_role(uuid, uuid, text) to service_role;
