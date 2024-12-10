-- Create storage bucket for NFT images
insert into storage.buckets (id, name, public)
values ('nft-images', 'nft-images', true);

-- Allow public access to the bucket
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'nft-images' );

-- Allow authenticated users to upload
create policy "Authenticated users can upload images"
  on storage.objects for insert
  with check (
    bucket_id = 'nft-images'
  );

-- Allow users to update their own images
create policy "Users can update their own images"
  on storage.objects for update
  using (
    bucket_id = 'nft-images'
  );

-- Allow users to delete their own images
create policy "Users can delete their own images"
  on storage.objects for delete
  using (
    bucket_id = 'nft-images'
  ); 