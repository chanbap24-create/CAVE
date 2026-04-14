-- Fix chat policies for room creation and member insertion

-- Allow reading all rooms (filter by membership in app)
drop policy if exists "chat_rooms_read" on chat_rooms;
create policy "chat_rooms_read" on chat_rooms for select using (true);

-- Allow inserting members (needed when creating rooms)
drop policy if exists "chat_members_insert" on chat_members;
create policy "chat_members_insert" on chat_members for insert with check (auth.uid() is not null);

-- Allow reading members
drop policy if exists "chat_members_read" on chat_members;
create policy "chat_members_read" on chat_members for select using (true);

-- Fix message insert (simplified)
drop policy if exists "chat_messages_insert" on chat_messages;
create policy "chat_messages_insert" on chat_messages for insert with check (auth.uid() = user_id);
