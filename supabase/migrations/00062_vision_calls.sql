-- Vision (wine label) call audit + rate limiting
-- Each wine-vision Edge Function invocation logs one row so the shared
-- rateLimit helper can count recent calls per user. Also gives us per-user
-- cost attribution for Anthropic API spend.
--
-- Apply via `supabase db push`.

create table if not exists vision_calls (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  model       text not null,
  confidence  numeric(3,2),
  input_tokens  integer,
  output_tokens integer,
  created_at  timestamptz not null default now()
);

create index if not exists vision_calls_user_created_idx
  on vision_calls (user_id, created_at desc);

alter table vision_calls enable row level security;

drop policy if exists "vision_calls_read_own" on vision_calls;
create policy "vision_calls_read_own" on vision_calls
  for select using (auth.uid() = user_id);

-- Writes happen from the wine-vision Edge Function using the service role key;
-- no client insert/update/delete policies (default-deny).

grant select on vision_calls to authenticated;
