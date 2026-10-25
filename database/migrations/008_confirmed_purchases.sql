-- Purchases are completed immediately; there is no approval/pending workflow.
update public.orders set status = 'confirmed', updated_at = now() where status = 'pending';
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check check (status in ('confirmed', 'cancelled', 'completed'));
alter table public.orders alter column status set default 'confirmed';
