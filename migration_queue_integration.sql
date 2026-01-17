-- Migration: Add notes and transaction_id to queues table
-- Purpose: Support queue-cashier integration

-- Add notes column for initial customer requirements/complaints
ALTER TABLE queues ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add transaction_id to link queue to final transaction
ALTER TABLE queues ADD COLUMN IF NOT EXISTS transaction_id UUID REFERENCES transactions(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_queues_transaction_id ON queues(transaction_id);
CREATE INDEX IF NOT EXISTS idx_queues_status ON queues(status);
