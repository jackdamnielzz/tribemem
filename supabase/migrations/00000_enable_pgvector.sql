-- Enable the pgvector extension for vector similarity search
-- This must be enabled before creating any VECTOR columns or indexes
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Make vector type available without schema prefix
ALTER DATABASE postgres SET search_path TO public, extensions;
