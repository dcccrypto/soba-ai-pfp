-- Storage policies for nft-images bucket
create policy "Anyone can view images"
  on storage.objects for select
  using (bucket_id = 'nft-images');

create policy "Authenticated users can upload images"
  on storage.objects for insert
  with check (
    bucket_id = 'nft-images' and
    auth.role() = 'authenticated'
  );

create policy "Users can update their own images"
  on storage.objects for update
  using (
    bucket_id = 'nft-images' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own images"
  on storage.objects for delete
  using (
    bucket_id = 'nft-images' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Enable RLS
alter table storage.objects enable row level security; 