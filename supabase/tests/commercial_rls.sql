begin;
select plan(16);

select ok((select relrowsecurity from pg_class where oid = 'public.host_profiles'::regclass), 'host_profiles has RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.entitlements'::regclass), 'entitlements has RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.payment_events'::regclass), 'payment_events has RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.purchase_intents'::regclass), 'purchase_intents has RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.safety_reports'::regclass), 'safety_reports has RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.host_progress_events'::regclass), 'host_progress_events has RLS');

select ok(not has_table_privilege('anon', 'public.entitlements', 'select'), 'anon cannot read entitlements');
select ok(not has_table_privilege('authenticated', 'public.entitlements', 'select'), 'authenticated cannot read entitlements');
select ok(not has_table_privilege('anon', 'public.rooms', 'select'), 'anon cannot read rooms');
select ok(not has_table_privilege('authenticated', 'public.rooms', 'select'), 'authenticated cannot read rooms');
select ok(not has_table_privilege('anon', 'public.safety_reports', 'insert'), 'anon cannot insert reports directly');
select ok(not has_table_privilege('authenticated', 'public.safety_reports', 'insert'), 'authenticated cannot insert reports directly');
select ok(has_table_privilege('service_role', 'public.entitlements', 'select'), 'service role can read entitlements');
select ok(has_table_privilege('service_role', 'public.rooms', 'update'), 'service role can update rooms');
select ok(has_table_privilege('service_role', 'public.payment_events', 'insert'), 'service role can store webhooks');
select ok(has_table_privilege('service_role', 'public.safety_reports', 'insert'), 'service role can store reports');

select * from finish();
rollback;
