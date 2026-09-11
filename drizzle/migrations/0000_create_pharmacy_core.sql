-- ROLES
create type public.app_role as enum ('admin','staff');

create table public.profiles (
  id uuid primary key,
  full_name text not null default 'Staff',
  phone text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "read profiles" on public.profiles for select to authenticated using (true);
create policy "update own profile" on public.profiles for update to authenticated using (id = auth.uid());
create policy "insert own profile" on public.profiles for insert to authenticated with check (id = auth.uid());

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "read own roles" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

-- new user handler: first user becomes admin
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)));
  insert into public.user_roles (user_id, role)
  values (new.id, case when (select count(*) from public.user_roles) = 0 then 'admin'::public.app_role else 'staff'::public.app_role end);
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

-- SUPPLIERS
create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  address text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.suppliers to authenticated;
grant all on public.suppliers to service_role;
alter table public.suppliers enable row level security;
create policy "staff manage suppliers" on public.suppliers for all to authenticated using (true) with check (true);

-- CUSTOMERS
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  address text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.customers to authenticated;
grant all on public.customers to service_role;
alter table public.customers enable row level security;
create policy "staff manage customers" on public.customers for all to authenticated using (true) with check (true);

-- MEDICINES
create table public.medicines (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  generic_name text,
  manufacturer text,
  barcode text unique,
  strength text,
  form text,
  pack_size text,
  rack text,
  unit text not null default 'pcs',
  purchase_price numeric(12,2) not null default 0,
  sale_price numeric(12,2) not null default 0,
  quantity integer not null default 0,
  min_stock integer not null default 10,
  expiry_date date,
  batch_no text,
  image_url text,
  notes text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.medicines (lower(name));
grant select, insert, update, delete on public.medicines to authenticated;
grant all on public.medicines to service_role;
alter table public.medicines enable row level security;
create policy "staff manage medicines" on public.medicines for all to authenticated using (true) with check (true);
create trigger medicines_touch before update on public.medicines for each row execute function public.touch_updated_at();

-- STOCK MOVEMENTS
create type public.movement_type as enum ('in','out','adjust');
create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  medicine_id uuid not null references public.medicines(id) on delete cascade,
  type public.movement_type not null,
  quantity integer not null,
  reason text,
  source text not null default 'manual',
  reference_id uuid,
  created_by uuid,
  created_at timestamptz not null default now()
);
create index on public.stock_movements (medicine_id, created_at desc);
grant select, insert on public.stock_movements to authenticated;
grant all on public.stock_movements to service_role;
alter table public.stock_movements enable row level security;
create policy "staff read movements" on public.stock_movements for select to authenticated using (true);
create policy "staff insert movements" on public.stock_movements for insert to authenticated with check (true);

create or replace function public.apply_stock_movement()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.type = 'in' then
    update public.medicines set quantity = quantity + abs(new.quantity) where id = new.medicine_id;
  elsif new.type = 'out' then
    update public.medicines set quantity = greatest(0, quantity - abs(new.quantity)) where id = new.medicine_id;
  else
    update public.medicines set quantity = abs(new.quantity) where id = new.medicine_id;
  end if;
  return new;
end; $$;
create trigger stock_movement_applied after insert on public.stock_movements
for each row execute function public.apply_stock_movement();

-- PURCHASE INVOICES
create type public.invoice_status as enum ('draft','posted');
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid references public.suppliers(id) on delete set null,
  supplier_name text,
  invoice_no text,
  invoice_date date default current_date,
  total numeric(12,2) not null default 0,
  image_url text,
  status public.invoice_status not null default 'draft',
  ai_raw jsonb,
  created_by uuid,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.invoices to authenticated;
grant all on public.invoices to service_role;
alter table public.invoices enable row level security;
create policy "staff manage invoices" on public.invoices for all to authenticated using (true) with check (true);

create table public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  medicine_id uuid references public.medicines(id) on delete set null,
  name text not null,
  batch_no text,
  expiry_date date,
  quantity integer not null default 0,
  unit_price numeric(12,2) not null default 0,
  sale_price numeric(12,2) not null default 0
);
grant select, insert, update, delete on public.invoice_items to authenticated;
grant all on public.invoice_items to service_role;
alter table public.invoice_items enable row level security;
create policy "staff manage invoice items" on public.invoice_items for all to authenticated using (true) with check (true);

-- ORDERS (sales / customer orders)
create type public.order_status as enum ('pending','confirmed','ready','delivered','cancelled');
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_no serial,
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text,
  customer_phone text,
  status public.order_status not null default 'pending',
  total numeric(12,2) not null default 0,
  note text,
  prescription_url text,
  ai_raw jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "staff manage orders" on public.orders for all to authenticated using (true) with check (true);
create trigger orders_touch before update on public.orders for each row execute function public.touch_updated_at();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  medicine_id uuid references public.medicines(id) on delete set null,
  name text not null,
  quantity integer not null default 1,
  unit_price numeric(12,2) not null default 0
);
grant select, insert, update, delete on public.order_items to authenticated;
grant all on public.order_items to service_role;
alter table public.order_items enable row level security;
create policy "staff manage order items" on public.order_items for all to authenticated using (true) with check (true);