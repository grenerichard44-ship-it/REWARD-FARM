-- Complete the Admin Platform domain and secure every operational table.
create or replace function public.is_active_admin(required_role text default null)
returns boolean language sql stable security definer set search_path=public as $$
  select exists (
    select 1 from public.admin_users a
    where a.user_id=auth.uid() and a.disabled_at is null
      and (required_role is null or a.role=required_role)
  )
$$;
revoke all on function public.is_active_admin(text) from public;
grant execute on function public.is_active_admin(text) to authenticated;

alter table public.campaigns drop constraint if exists campaigns_status_check;
alter table public.campaigns add constraint campaigns_status_check check(status in ('draft','published','paused','closed','archived'));
alter table public.tasks drop constraint if exists tasks_status_check;
alter table public.tasks add constraint tasks_status_check check(status in ('draft','published','paused','closed','archived'));
alter table public.tasks drop constraint if exists tasks_verification_method_check;
alter table public.tasks add constraint tasks_verification_method_check check(verification_method in ('webhook','sdk_event','pixel','manual','youtube'));

create table if not exists public.task_versions (
 id uuid primary key default gen_random_uuid(), task_id uuid not null references public.tasks(id) on delete cascade,
 version int not null, snapshot jsonb not null, created_by uuid references public.admin_users(id),
 created_at timestamptz not null default now(), unique(task_id,version)
);
create table if not exists public.youtube_connections (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 google_account_email text, channel_id text not null, channel_title text, access_token_encrypted text,
 refresh_token_encrypted text, token_expires_at timestamptz, status text not null default 'active'
 check(status in ('active','revoked','expired')), created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(), unique(user_id,channel_id)
);
create table if not exists public.platform_settings (
 key text primary key, value jsonb not null, updated_by uuid references public.admin_users(id),
 updated_at timestamptz not null default now()
);
create table if not exists public.admin_invitations (
 id uuid primary key default gen_random_uuid(), email text not null, role text not null check(role in ('admin','super_admin')),
 token_hash text not null unique, invited_by uuid not null references public.admin_users(id),
 expires_at timestamptz not null, accepted_at timestamptz, revoked_at timestamptz,
 created_at timestamptz not null default now()
);
create table if not exists public.guide_conversations (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 title text, status text not null default 'clean' check(status in ('clean','flagged','reviewed')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.guide_messages (
 id uuid primary key default gen_random_uuid(), conversation_id uuid not null references public.guide_conversations(id) on delete cascade,
 role text not null check(role in ('user','assistant','system')), content text not null,
 grounded_calls text[] not null default '{}', flagged boolean not null default false,
 created_at timestamptz not null default now()
);

create index if not exists idx_campaigns_status on public.campaigns(status);
create index if not exists idx_tasks_campaign_status on public.tasks(campaign_id,status);
create index if not exists idx_submissions_status_created on public.submissions(status,created_at);
create index if not exists idx_payout_requests_status_created on public.payout_requests(status,created_at);
create index if not exists idx_ledger_user_created on public.ledger_entries(user_id,created_at);
create index if not exists idx_audit_created on public.audit_log(created_at desc);

alter table public.admin_users enable row level security;
alter table public.campaigns enable row level security;
alter table public.tasks enable row level security;
alter table public.verification_events enable row level security;
alter table public.audit_log enable row level security;
alter table public.task_versions enable row level security;
alter table public.youtube_connections enable row level security;
alter table public.platform_settings enable row level security;
alter table public.admin_invitations enable row level security;
alter table public.guide_conversations enable row level security;
alter table public.guide_messages enable row level security;

do $$ declare t text;
begin
 foreach t in array array['admin_users','campaigns','tasks','submissions','submission_notes','ledger_entries',
 'wallet_addresses','payout_requests','verification_events','notifications','audit_log','task_versions',
 'youtube_connections','platform_settings','admin_invitations','guide_conversations','guide_messages']
 loop execute format('drop policy if exists "active admins manage" on public.%I',t);
      execute format('create policy "active admins manage" on public.%I for all to authenticated using (public.is_active_admin()) with check (public.is_active_admin())',t);
 end loop;
end $$;
create policy "published campaigns read" on public.campaigns for select to authenticated using(status='published');
create policy "published tasks read" on public.tasks for select to authenticated using(status='published');
create policy "own youtube manage" on public.youtube_connections for all to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy "own guide conversations" on public.guide_conversations for all to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy "own guide messages read" on public.guide_messages for select to authenticated using(exists(select 1 from public.guide_conversations c where c.id=conversation_id and c.user_id=auth.uid()));

create or replace function public.admin_balance(target_user uuid)
returns bigint language sql stable security definer set search_path=public as $$
 select coalesce(sum(amount_cents),0)::bigint from public.ledger_entries where user_id=target_user
$$;
revoke all on function public.admin_balance(uuid) from public;
grant execute on function public.admin_balance(uuid) to authenticated;

create or replace function public.review_submission(target_submission uuid, decision text, reason text default null)
returns public.submissions language plpgsql security definer set search_path=public as $$
declare s public.submissions; actor uuid; reward bigint;
begin
 if not public.is_active_admin() then raise exception 'forbidden'; end if;
 if decision not in ('approved','rejected') then raise exception 'invalid decision'; end if;
 select id into actor from public.admin_users where user_id=auth.uid() and disabled_at is null;
 select * into s from public.submissions where id=target_submission for update;
 if s.id is null or s.status<>'pending' then raise exception 'submission is not pending'; end if;
 update public.submissions set status=decision, reviewed_by=actor, rejection_reason=case when decision='rejected' then reason end, reviewed_at=now() where id=s.id returning * into s;
 if decision='approved' then
   select reward_cents into reward from public.tasks where id=s.task_id;
   insert into public.ledger_entries(user_id,amount_cents,type,reference_id,description)
   values(s.user_id,reward,'task_reward',s.id,'Task completion reward') on conflict(type,reference_id) do nothing;
 end if;
 insert into public.audit_log(actor_id,action,target_type,target_id,details) values(actor,'submission.'||decision,'submission',s.id,jsonb_build_object('reason',reason));
 return s;
end $$;
revoke all on function public.review_submission(uuid,text,text) from public;
grant execute on function public.review_submission(uuid,text,text) to authenticated;

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at=now(); return new; end $$;
do $$ declare t text;
begin foreach t in array array['profiles','campaigns','tasks','wallet_addresses','youtube_connections','guide_conversations']
loop execute format('drop trigger if exists touch_updated_at on public.%I',t);
execute format('create trigger touch_updated_at before update on public.%I for each row execute function public.touch_updated_at()',t);
end loop; end $$;
