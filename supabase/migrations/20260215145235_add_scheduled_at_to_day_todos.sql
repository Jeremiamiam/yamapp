-- Add scheduled_at column to day_todos table
ALTER TABLE day_todos
ADD COLUMN IF NOT EXISTS scheduled_at timestamptz;

-- Add index for scheduled todos queries
CREATE INDEX IF NOT EXISTS idx_day_todos_scheduled_at 
ON day_todos(scheduled_at) 
WHERE scheduled_at IS NOT NULL;
