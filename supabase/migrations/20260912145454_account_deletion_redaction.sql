create or replace function public.redact_account_payment_events(p_user_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.payment_events
  set payload = payload #- '{event,app_user_id}'
  where payload #>> '{event,app_user_id}' = p_user_id::text;
$$;

revoke all on function public.redact_account_payment_events(uuid) from public, anon, authenticated;
grant execute on function public.redact_account_payment_events(uuid) to service_role;
