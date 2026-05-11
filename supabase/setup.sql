create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'workspace_role') then
    create type public.workspace_role as enum ('admin', 'editor', 'viewer');
  end if;
end
$$;

create or replace function public.jsonb_has_only_keys(value jsonb, allowed_keys text[])
returns boolean
language sql
immutable
as $$
  select coalesce(
    (
      select bool_and(key = any(allowed_keys))
      from jsonb_object_keys(value) as keys(key)
    ),
    true
  );
$$;

create or replace function public.jsonb_array_objects_have_only_keys(value jsonb, allowed_keys text[])
returns boolean
language sql
immutable
as $$
  select jsonb_typeof(value) = 'array'
    and not exists (
      select 1
      from jsonb_array_elements(value) as items(item)
      where jsonb_typeof(item) <> 'object'
         or not public.jsonb_has_only_keys(item, allowed_keys)
    );
$$;

create or replace function public.jsonb_object_values_have_only_keys(value jsonb, allowed_keys text[])
returns boolean
language sql
immutable
as $$
  select jsonb_typeof(value) = 'object'
    and not exists (
      select 1
      from jsonb_each(value) as items(key, item)
      where key !~ '^[A-Za-z][A-Za-z0-9_-]{0,39}$'
         or jsonb_typeof(item) <> 'object'
         or not public.jsonb_has_only_keys(item, allowed_keys)
    );
$$;

create or replace function public.is_valid_resos_data(value jsonb)
returns boolean
language sql
immutable
as $$
  select
    jsonb_typeof(value) = 'object'
    and value ?& array[
      'restaurantProfile',
      'menuItems',
      'recipeIngredients',
      'complianceTasks',
      'safetyTasks',
      'supplierItems',
      'supplierPriceHistory',
      'reviews',
      'businessProfiles'
    ]
    and public.jsonb_has_only_keys(value, array[
      'restaurantProfile',
      'menuItems',
      'recipeIngredients',
      'complianceTasks',
      'safetyTasks',
      'supplierItems',
      'supplierPriceHistory',
      'reviews',
      'businessProfiles'
    ])
    and jsonb_typeof(value->'restaurantProfile') = 'object'
    and public.jsonb_has_only_keys(value->'restaurantProfile', array[
      'restaurantName',
      'address',
      'phone',
      'cuisine',
      'ownerName',
      'weeklySalesGoal'
    ])
    and jsonb_typeof(value->'businessProfiles') = 'object'
    and public.jsonb_object_values_have_only_keys(value->'businessProfiles', array[
      'restaurantName',
      'phone',
      'address',
      'mondayHours',
      'fridayHours',
      'menuUrl',
      'holidayHours',
      'deliveryUrl'
    ])
    and jsonb_typeof(value->'menuItems') = 'array'
    and public.jsonb_array_objects_have_only_keys(value->'menuItems', array[
      'id',
      'name',
      'category',
      'price',
      'ingredientCost',
      'costMode',
      'avgPrepMinutes',
      'salesThisWeek',
      'station',
      'notes'
    ])
    and jsonb_typeof(value->'recipeIngredients') = 'array'
    and public.jsonb_array_objects_have_only_keys(value->'recipeIngredients', array[
      'id',
      'menuItemId',
      'ingredientName',
      'quantity',
      'unit',
      'costingMode',
      'supplierItemId',
      'notes'
    ])
    and jsonb_typeof(value->'complianceTasks') = 'array'
    and public.jsonb_array_objects_have_only_keys(value->'complianceTasks', array[
      'id',
      'title',
      'category',
      'owner',
      'dueDate',
      'recurrence',
      'status',
      'riskLevel',
      'notes',
      'completedAt'
    ])
    and jsonb_typeof(value->'safetyTasks') = 'array'
    and public.jsonb_array_objects_have_only_keys(value->'safetyTasks', array[
      'id',
      'title',
      'area',
      'frequency',
      'assignedTo',
      'lastCompleted',
      'nextDue',
      'status',
      'requiresTemperatureLog',
      'temperatureType',
      'temperatureValue',
      'notes'
    ])
    and jsonb_typeof(value->'supplierItems') = 'array'
    and public.jsonb_array_objects_have_only_keys(value->'supplierItems', array[
      'id',
      'supplierName',
      'ingredientName',
      'price',
      'unit',
      'lastUpdated',
      'reliabilityScore',
      'deliveryDays',
      'notes'
    ])
    and jsonb_typeof(value->'supplierPriceHistory') = 'array'
    and public.jsonb_array_objects_have_only_keys(value->'supplierPriceHistory', array[
      'id',
      'supplierItemId',
      'supplierName',
      'ingredientName',
      'price',
      'unit',
      'updatedAt',
      'note'
    ])
    and jsonb_typeof(value->'reviews') = 'array'
    and public.jsonb_array_objects_have_only_keys(value->'reviews', array[
      'id',
      'platform',
      'rating',
      'date',
      'text',
      'category',
      'urgency',
      'replied',
      'replyDraft'
    ])
    and jsonb_array_length(value->'menuItems') <= 500
    and jsonb_array_length(value->'recipeIngredients') <= 2500
    and jsonb_array_length(value->'complianceTasks') <= 1000
    and jsonb_array_length(value->'safetyTasks') <= 1000
    and jsonb_array_length(value->'supplierItems') <= 1000
    and jsonb_array_length(value->'supplierPriceHistory') <= 5000
    and jsonb_array_length(value->'reviews') <= 5000;
$$;

create table if not exists public.restaurant_workspaces (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$'),
  restaurant_name text not null default '' check (length(restaurant_name) <= 120),
  data jsonb not null default '{}'::jsonb check (public.is_valid_resos_data(data)),
  created_by uuid not null references auth.users(id) on delete restrict default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.restaurant_workspace_members (
  workspace_id uuid not null references public.restaurant_workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.workspace_role not null default 'viewer',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

alter table public.restaurant_workspaces enable row level security;
alter table public.restaurant_workspace_members enable row level security;

revoke all on public.restaurant_workspaces from anon, authenticated;
revoke all on public.restaurant_workspace_members from anon, authenticated;
grant select on public.restaurant_workspaces to authenticated;
grant select on public.restaurant_workspace_members to authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists restaurant_workspaces_set_updated_at on public.restaurant_workspaces;
create trigger restaurant_workspaces_set_updated_at
  before update on public.restaurant_workspaces
  for each row
  execute function public.set_updated_at();

drop trigger if exists restaurant_workspace_members_set_updated_at on public.restaurant_workspace_members;
create trigger restaurant_workspace_members_set_updated_at
  before update on public.restaurant_workspace_members
  for each row
  execute function public.set_updated_at();

create or replace function public.current_user_workspace_role(target_workspace_id uuid)
returns public.workspace_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.restaurant_workspace_members
  where workspace_id = target_workspace_id
    and user_id = auth.uid()
  limit 1;
$$;

create or replace function public.current_user_can_access_workspace(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null
    and exists (
      select 1
      from public.restaurant_workspace_members
      where workspace_id = target_workspace_id
        and user_id = auth.uid()
    );
$$;

create or replace function public.current_user_can_edit_workspace(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_workspace_role(target_workspace_id) in ('admin', 'editor');
$$;

drop policy if exists "Workspace members can read workspaces" on public.restaurant_workspaces;
create policy "Workspace members can read workspaces"
  on public.restaurant_workspaces
  for select
  to authenticated
  using (public.current_user_can_access_workspace(id));

drop policy if exists "Workspace members can read memberships" on public.restaurant_workspace_members;
create policy "Workspace members can read memberships"
  on public.restaurant_workspace_members
  for select
  to authenticated
  using (public.current_user_can_access_workspace(workspace_id));

create or replace function public.ensure_restaurant_workspace(p_slug text, p_seed_data jsonb)
returns table (
  id uuid,
  slug text,
  restaurant_name text,
  data jsonb,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  workspace_row public.restaurant_workspaces%rowtype;
  caller uuid := auth.uid();
begin
  if caller is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if p_slug <> 'corner-table-cafe' then
    raise exception 'Invalid workspace slug' using errcode = '22023';
  end if;

  if not public.is_valid_resos_data(p_seed_data) then
    raise exception 'Invalid workspace payload' using errcode = '22023';
  end if;

  select rw.id, rw.slug, rw.restaurant_name, rw.data, rw.created_by, rw.created_at, rw.updated_at
  into workspace_row
  from public.restaurant_workspaces rw
  where rw.slug = p_slug;

  if not found then
    insert into public.restaurant_workspaces (slug, restaurant_name, data, created_by)
    values (p_slug, p_seed_data->'restaurantProfile'->>'restaurantName', p_seed_data, caller)
    returning * into workspace_row;

    insert into public.restaurant_workspace_members (workspace_id, user_id, role, created_by)
    values (workspace_row.id, caller, 'admin', caller)
    on conflict (workspace_id, user_id) do nothing;
  end if;

  if not public.current_user_can_access_workspace(workspace_row.id) then
    raise exception 'Workspace access denied' using errcode = '42501';
  end if;

  return query
    select workspace_row.id, workspace_row.slug, workspace_row.restaurant_name, workspace_row.data, workspace_row.updated_at;
end;
$$;

create or replace function public.save_restaurant_workspace_data(p_slug text, p_data jsonb)
returns table (
  id uuid,
  slug text,
  restaurant_name text,
  data jsonb,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  workspace_row public.restaurant_workspaces%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if p_slug <> 'corner-table-cafe' then
    raise exception 'Invalid workspace slug' using errcode = '22023';
  end if;

  if not public.is_valid_resos_data(p_data) then
    raise exception 'Invalid workspace payload' using errcode = '22023';
  end if;

  select rw.id, rw.slug, rw.restaurant_name, rw.data, rw.created_by, rw.created_at, rw.updated_at
  into workspace_row
  from public.restaurant_workspaces rw
  where rw.slug = p_slug;

  if not found then
    raise exception 'Workspace not found' using errcode = '02000';
  end if;

  if not public.current_user_can_edit_workspace(workspace_row.id) then
    raise exception 'Workspace edit denied' using errcode = '42501';
  end if;

  update public.restaurant_workspaces
  set restaurant_name = p_data->'restaurantProfile'->>'restaurantName',
      data = p_data
  where public.restaurant_workspaces.id = workspace_row.id
  returning * into workspace_row;

  return query
    select workspace_row.id, workspace_row.slug, workspace_row.restaurant_name, workspace_row.data, workspace_row.updated_at;
end;
$$;

create or replace function public.add_restaurant_workspace_member(
  p_slug text,
  p_user_id uuid,
  p_role public.workspace_role
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  workspace_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select id into workspace_id
  from public.restaurant_workspaces
  where slug = p_slug;

  if workspace_id is null then
    raise exception 'Workspace not found' using errcode = '02000';
  end if;

  if public.current_user_workspace_role(workspace_id) <> 'admin' then
    raise exception 'Admin role required' using errcode = '42501';
  end if;

  insert into public.restaurant_workspace_members (workspace_id, user_id, role, created_by)
  values (workspace_id, p_user_id, p_role, auth.uid())
  on conflict (workspace_id, user_id)
  do update set role = excluded.role, updated_at = now();
end;
$$;

grant execute on function public.ensure_restaurant_workspace(text, jsonb) to authenticated;
grant execute on function public.save_restaurant_workspace_data(text, jsonb) to authenticated;
grant execute on function public.add_restaurant_workspace_member(text, uuid, public.workspace_role) to authenticated;
