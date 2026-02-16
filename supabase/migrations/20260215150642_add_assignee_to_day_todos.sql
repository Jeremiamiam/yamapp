-- Add assignee_id column to day_todos table
ALTER TABLE day_todos
ADD COLUMN IF NOT EXISTS assignee_id uuid REFERENCES team(id);

-- Add index for assignee queries
CREATE INDEX IF NOT EXISTS idx_day_todos_assignee_id 
ON day_todos(assignee_id) 
WHERE assignee_id IS NOT NULL;
