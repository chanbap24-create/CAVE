-- ============================================
-- Chat System: rooms + messages
-- Supports both 1:1 DM and gathering group chat
-- ============================================

create type chat_room_type as enum ('dm', 'gathering');

create table chat_rooms (
  id            bigint generated always as identity primary key,
  type          chat_room_type not null,
  gathering_id  bigint references gatherings(id) on delete cascade,
  created_at    timestamptz default now()
);

create table chat_members (
  room_id       bigint references chat_rooms(id) on delete cascade,
  user_id       uuid references profiles(id) on delete cascade,
  joined_at     timestamptz default now(),
  last_read_at  timestamptz default now(),
  primary key (room_id, user_id)
);

create table chat_messages (
  id            bigint generated always as identity primary key,
  room_id       bigint references chat_rooms(id) on delete cascade,
  user_id       uuid references profiles(id) on delete cascade,
  content       text not null,
  created_at    timestamptz default now()
);

create index idx_chat_messages_room on chat_messages (room_id, created_at);
create index idx_chat_members_user on chat_members (user_id);

-- RLS
alter table chat_rooms enable row level security;
alter table chat_members enable row level security;
alter table chat_messages enable row level security;

-- Chat rooms: members can read
create policy "chat_rooms_read" on chat_rooms for select using (
  exists (select 1 from chat_members where chat_members.room_id = chat_rooms.id and chat_members.user_id = auth.uid())
);

-- Chat members: members can read, authenticated can insert
create policy "chat_members_read" on chat_members for select using (
  exists (select 1 from chat_members cm where cm.room_id = chat_members.room_id and cm.user_id = auth.uid())
);
create policy "chat_members_insert" on chat_members for insert with check (auth.uid() = user_id);
create policy "chat_members_update" on chat_members for update using (auth.uid() = user_id);

-- Chat messages: members can read, sender can insert
create policy "chat_messages_read" on chat_messages for select using (
  exists (select 1 from chat_members where chat_members.room_id = chat_messages.room_id and chat_members.user_id = auth.uid())
);
create policy "chat_messages_insert" on chat_messages for insert with check (
  auth.uid() = user_id and
  exists (select 1 from chat_members where chat_members.room_id = chat_messages.room_id and chat_members.user_id = auth.uid())
);
create policy "chat_messages_delete" on chat_messages for delete using (auth.uid() = user_id);

-- Allow authenticated users to create chat rooms
create policy "chat_rooms_insert" on chat_rooms for insert with check (auth.uid() is not null);

-- Enable realtime for chat_messages
alter publication supabase_realtime add table chat_messages;
