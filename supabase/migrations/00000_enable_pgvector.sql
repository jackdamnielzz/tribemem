-- Enable the pgvector extension for vector similarity search
-- This must be enabled before creating any VECTOR columns or indexes
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;
