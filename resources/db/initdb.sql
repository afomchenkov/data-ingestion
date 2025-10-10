CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DROP TABLE IF EXISTS tenant CASCADE;
CREATE TABLE tenant (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

DROP TABLE IF EXISTS data_schema CASCADE;
CREATE TABLE data_schema (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    tenant_id uuid REFERENCES tenant(id),
    schema JSONB NOT NULL,
    file_type TEXT NOT NULL CHECK (file_type IN ('csv', 'ndjson', 'json')),
    delimiter TEXT DEFAULT ',',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

DROP TABLE IF EXISTS ingest_job CASCADE;
CREATE TABLE ingest_job (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid REFERENCES tenant(id),
    upload_id uuid,
    filename text,
    data_name text,
    schema_id uuid REFERENCES data_schema(id),
    file_type text,
    file_path text,
    status text CHECK (
        status IN (
            'uploaded',
            'processing',
            'queued',
            'initiated',
            'complete',
            'failed',
            'stale',
            'duplicate'
        )
    ) DEFAULT 'initiated',
    content_sha256 text,
    size_bytes bigint,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- canonical table for per-row parsing
DROP TABLE IF EXISTS processed_data CASCADE;
CREATE TABLE processed_data (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid REFERENCES tenant(id),
    data_name text NOT NULL,
    schema_id uuid REFERENCES data_schema(id),
    data jsonb NOT NULL,
    ingest_job_id uuid REFERENCES ingest_job(id),
    content_hash TEXT,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

DROP TABLE IF EXISTS ingest_error CASCADE;
CREATE TABLE ingest_error (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ingest_job_id uuid REFERENCES ingest_job(id),
    tenant_id uuid REFERENCES tenant(id),
    filename text,
    file_type text,
    content_sha256 text,
    error_message text,
    error_status text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

DROP TABLE IF EXISTS ingest_history CASCADE;
CREATE TABLE ingest_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid REFERENCES tenant(id),
    source_ts timestamptz,
    ingest_job_id uuid REFERENCES ingest_job(id),
    ingest_error_id uuid REFERENCES ingest_error(id),
    processed_data_id uuid REFERENCES processed_data(id),
    event_name text,
    message text,
    version integer,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX ON ingest_job (content_sha256);
CREATE INDEX ON ingest_job (tenant_id);
CREATE INDEX ON processed_data (content_hash);
CREATE INDEX ON processed_data (data_name);
