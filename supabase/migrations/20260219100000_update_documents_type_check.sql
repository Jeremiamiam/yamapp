-- Update documents type check constraint to include 'creative-strategy'
ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_type_check;

ALTER TABLE public.documents 
  ADD CONSTRAINT documents_type_check 
  CHECK (type IN ('brief', 'report', 'note', 'creative-strategy'));
