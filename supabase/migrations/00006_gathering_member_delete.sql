-- Allow members to delete their own gathering membership (leave)
create policy "gathering_members_delete"
on gathering_members for delete
using (auth.uid() = user_id);
