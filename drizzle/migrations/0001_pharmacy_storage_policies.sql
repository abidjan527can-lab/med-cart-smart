create policy "staff read pharmacy files" on storage.objects for select to authenticated using (bucket_id = 'pharmacy');
create policy "staff upload pharmacy files" on storage.objects for insert to authenticated with check (bucket_id = 'pharmacy');
create policy "staff update pharmacy files" on storage.objects for update to authenticated using (bucket_id = 'pharmacy');
create policy "staff delete pharmacy files" on storage.objects for delete to authenticated using (bucket_id = 'pharmacy');