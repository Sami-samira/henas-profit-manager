-- Henas Cafe OS Cloud Schema for Supabase
-- Run this entire script in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  join_code text not null unique default upper(substr(encode(gen_random_bytes(8), 'hex'), 1, 8)),
  created_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','manager','staff')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table if not exists public.workspace_state (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  version bigint not null default 1,
  updated_at timestamptz not null default now()
);

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.workspace_state enable row level security;

drop policy if exists "members read workspaces" on public.workspaces;
create policy "members read workspaces"
on public.workspaces for select to authenticated
using (
  owner_id = auth.uid()
  or exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = id and wm.user_id = auth.uid()
  )
);

drop policy if exists "members read memberships" on public.workspace_members;
create policy "members read memberships"
on public.workspace_members for select to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.workspace_members me
    where me.workspace_id = workspace_members.workspace_id
      and me.user_id = auth.uid()
      and me.role in ('owner','manager')
  )
);

drop policy if exists "members read state" on public.workspace_state;
create policy "members read state"
on public.workspace_state for select to authenticated
using (
  exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = workspace_state.workspace_id
      and wm.user_id = auth.uid()
  )
);

drop policy if exists "members insert state" on public.workspace_state;
create policy "members insert state"
on public.workspace_state for insert to authenticated
with check (
  exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = workspace_state.workspace_id
      and wm.user_id = auth.uid()
  )
);

drop policy if exists "members update state" on public.workspace_state;
create policy "members update state"
on public.workspace_state for update to authenticated
using (
  exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = workspace_state.workspace_id
      and wm.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = workspace_state.workspace_id
      and wm.user_id = auth.uid()
  )
);

create or replace function public.create_workspace(p_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  insert into public.workspaces(name, owner_id)
  values (coalesce(nullif(trim(p_name),''),'کافه هناس'), auth.uid())
  returning id into v_id;

  insert into public.workspace_members(workspace_id,user_id,role)
  values(v_id,auth.uid(),'owner');

  insert into public.workspace_state(workspace_id,data)
  values(v_id,'{}'::jsonb);

  return v_id;
end;
$$;

create or replace function public.join_workspace(p_join_code text, p_role text default 'staff')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_role text;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  select id into v_id from public.workspaces
  where upper(join_code)=upper(trim(p_join_code));
  if v_id is null then raise exception 'Invalid join code'; end if;

  -- For security, public join can only create staff membership.
  -- Managers should be promoted later by the owner in SQL or a future admin screen.
  v_role := 'staff';

  insert into public.workspace_members(workspace_id,user_id,role)
  values(v_id,auth.uid(),v_role)
  on conflict (workspace_id,user_id) do nothing;

  return v_id;
end;
$$;

grant execute on function public.create_workspace(text) to authenticated;
grant execute on function public.join_workspace(text,text) to authenticated;
