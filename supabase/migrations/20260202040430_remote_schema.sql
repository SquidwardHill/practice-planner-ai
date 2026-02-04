-- Storage policies for Drill Media bucket (practice_plans/scheduled_practices are in 003/004)

create policy "Users can delete their own files"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'Drill Media'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

create policy "Users can read their own files"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'Drill Media'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

create policy "Users can update their own files"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'Drill Media'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)))
with check (((bucket_id = 'Drill Media'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

create policy "Users can upload to their own folder"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'Drill Media'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
