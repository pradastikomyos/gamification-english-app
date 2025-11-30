-- Migration: add explanation and order_number columns to questions table
ALTER TABLE questions ADD COLUMN explanation TEXT;
ALTER TABLE questions ADD COLUMN order_number INTEGER;
