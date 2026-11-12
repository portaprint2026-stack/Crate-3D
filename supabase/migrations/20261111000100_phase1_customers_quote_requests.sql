begin;

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users (id) on delete set null,
  email text not null check (email = lower(btrim(email))),
  full_name text not null check (char_length(btrim(full_name)) between 1 and 120),
  phone text check (phone is null or char_length(phone) between 7 and 25),
  created_at timestamptz not null default now()
);

create index customers_auth_user_id_idx
  on public.customers (auth_user_id)
  where auth_user_id is not null;

create index customers_email_idx on public.customers (email);

create table public.admin_memberships (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('admin')),
  created_at timestamptz not null default now()
);

create table public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  request_code text not null unique
    check (request_code ~ '^PP-S-[A-F0-9]{20}$'),
  idempotency_key_hash text not null unique
    check (idempotency_key_hash ~ '^[a-f0-9]{64}$'),
  customer_id uuid references public.customers (id) on delete set null,
  contact_name text not null
    check (char_length(btrim(contact_name)) between 1 and 120),
  contact_email text not null
    check (
      contact_email = lower(btrim(contact_email))
      and char_length(contact_email) <= 254
    ),
  contact_phone text
    check (contact_phone is null or char_length(contact_phone) between 7 and 25),
  category text not null
    check (category in ('home', 'decor', 'personal', 'desk', 'custom', 'other')),
  description text not null
    check (char_length(btrim(description)) between 10 and 5000),
  status text not null default 'received'
    check (status in ('received', 'in_review')),
  created_at timestamptz not null default now()
);

create index quote_requests_customer_created_idx
  on public.quote_requests (customer_id, created_at desc)
  where customer_id is not null;

create index quote_requests_status_created_idx
  on public.quote_requests (status, created_at desc);

create index quote_requests_contact_email_created_idx
  on public.quote_requests (contact_email, created_at desc);

create table public.quote_request_rate_limits (
  identifier_hash text not null check (identifier_hash ~ '^[a-f0-9]{64}$'),
  dimension text not null check (dimension = 'email_10m'),
  window_start timestamptz not null,
  request_count integer not null check (request_count > 0),
  primary key (identifier_hash, dimension, window_start)
);

create index quote_request_rate_limits_window_idx
  on public.quote_request_rate_limits (window_start);

alter table public.customers enable row level security;
alter table public.admin_memberships enable row level security;
alter table public.quote_requests enable row level security;
alter table public.quote_request_rate_limits enable row level security;

revoke all on table
  public.customers,
  public.admin_memberships,
  public.quote_requests,
  public.quote_request_rate_limits
  from public, anon, authenticated;

grant select on table public.customers, public.quote_requests to authenticated;
grant all on table
  public.customers,
  public.admin_memberships,
  public.quote_requests,
  public.quote_request_rate_limits
  to service_role;

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_memberships
    where user_id = (select auth.uid())
      and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;

create policy customers_select_own_or_admin
  on public.customers
  for select
  to authenticated
  using (
    auth_user_id = (select auth.uid())
    or (select public.is_admin())
  );

create policy quote_requests_select_own_or_admin
  on public.quote_requests
  for select
  to authenticated
  using (
    (select public.is_admin())
    or exists (
      select 1
      from public.customers
      where customers.id = quote_requests.customer_id
        and customers.auth_user_id = (select auth.uid())
    )
  );

create function public.submit_quote_request(
  p_email_hash text,
  p_idempotency_key_hash text,
  p_request_code text,
  p_customer_id uuid,
  p_contact_name text,
  p_contact_email text,
  p_contact_phone text,
  p_category text,
  p_description text
)
returns table (outcome text, request_code text, status text)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_window_10m timestamptz;
  v_existing public.quote_requests%rowtype;
  v_email_count integer;
begin
  if p_email_hash is null
    or p_email_hash !~ '^[a-f0-9]{64}$'
    or p_idempotency_key_hash is null
    or p_idempotency_key_hash !~ '^[a-f0-9]{64}$'
    or p_request_code is null
    or p_request_code !~ '^PP-S-[A-F0-9]{20}$'
    or p_contact_name is null
    or char_length(btrim(p_contact_name)) not between 1 and 120
    or p_contact_email is null
    or char_length(btrim(p_contact_email)) = 0
    or p_contact_email <> lower(btrim(p_contact_email))
    or char_length(p_contact_email) > 254
    or (p_contact_phone is not null and char_length(p_contact_phone) not between 7 and 25)
    or p_category is null
    or p_category not in ('home', 'decor', 'personal', 'desk', 'custom', 'other')
    or p_description is null
    or char_length(btrim(p_description)) not between 10 and 5000 then
    raise exception 'Invalid quote request parameters';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_idempotency_key_hash, 0));

  select *
    into v_existing
    from public.quote_requests
    where idempotency_key_hash = p_idempotency_key_hash;

  if found then
    if v_existing.customer_id is distinct from p_customer_id
      or v_existing.contact_name is distinct from p_contact_name
      or v_existing.contact_email is distinct from p_contact_email
      or v_existing.contact_phone is distinct from p_contact_phone
      or v_existing.category is distinct from p_category
      or v_existing.description is distinct from p_description then
      return query select 'conflict'::text, null::text, null::text;
    else
      return query select 'duplicate'::text, v_existing.request_code, v_existing.status;
    end if;
    return;
  end if;

  v_window_10m := to_timestamp(floor(extract(epoch from v_now) / 600) * 600);

  insert into public.quote_request_rate_limits as limits
    (identifier_hash, dimension, window_start, request_count)
  values (p_email_hash, 'email_10m', v_window_10m, 1)
  on conflict (identifier_hash, dimension, window_start)
  do update set request_count = limits.request_count + 1
  returning request_count into v_email_count;

  delete from public.quote_request_rate_limits
  where window_start < v_now - interval '2 days';

  if v_email_count > 3 then
    return query select 'rate_limited'::text, null::text, null::text;
    return;
  end if;

  insert into public.quote_requests (
    request_code,
    idempotency_key_hash,
    customer_id,
    contact_name,
    contact_email,
    contact_phone,
    category,
    description
  ) values (
    p_request_code,
    p_idempotency_key_hash,
    p_customer_id,
    p_contact_name,
    p_contact_email,
    p_contact_phone,
    p_category,
    p_description
  );

  return query select 'created'::text, p_request_code, 'received'::text;
end;
$$;

revoke all on function public.submit_quote_request(
  text, text, text, uuid, text, text, text, text, text
)
  from public, anon, authenticated;
grant execute on function public.submit_quote_request(
  text, text, text, uuid, text, text, text, text, text
)
  to service_role;

comment on table public.customers is
  'Verified customer profiles. Guest requests are not linked by email.';
comment on table public.admin_memberships is
  'Administrative roles assigned only by trusted database operators.';
comment on table public.quote_requests is
  'Guest-capable quote requests. Writes are accepted only through the submit-quote-request Edge Function.';
comment on column public.quote_requests.request_code is
  'Public reference only; it is not an authentication credential.';
comment on column public.quote_requests.idempotency_key_hash is
  'SHA-256 digest of a client-generated UUID v4; the original key is never stored.';
comment on table public.quote_request_rate_limits is
  'Atomic fixed-window email counters keyed by HMAC-pseudonymized normalized email identifiers.';

commit;
