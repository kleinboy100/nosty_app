-- Create a storage bucket for restaurant verification documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('restaurant-documents', 'restaurant-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create policy for restaurant owners to upload their documents
CREATE POLICY "Users can upload their own verification documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'restaurant-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy for users to view their own documents
CREATE POLICY "Users can view their own verification documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'restaurant-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy for users to update their own documents
CREATE POLICY "Users can update their own verification documents"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'restaurant-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy for users to delete their own documents
CREATE POLICY "Users can delete their own verification documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'restaurant-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);