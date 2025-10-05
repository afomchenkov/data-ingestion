-- Control table for jobs
CREATE TABLE ingestion_job (
    job_id uuid PRIMARY KEY,
    uploader_id uuid,
    filename text,
    content_sha256 text,
    status text CHECK (status IN ('uploaded','processing','initiated','complete','failed')) DEFAULT 'initiated',
    total_rows bigint,
    processed_rows bigint DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Data table (example for generic row storage)
CREATE TABLE processed_data (
    row_key text PRIMARY KEY, -- derived natural key or GUID
    tenant_id uuid,
    payload jsonb NOT NULL,
    row_content_sha256 text NOT NULL,
    source_timestamp timestamptz,
    ingestion_job_id uuid REFERENCES ingestion_job(job_id),
    version bigint DEFAULT 1,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- CREATE TABLE customer (
--     id uuid PRIMARY KEY,
--     name text NOT NULL,
--     email text NOT NULL,
--     phone text NOT NULL,
--     created_at timestamptz DEFAULT now(),
--     updated_at timestamptz DEFAULT now()
-- );


-- Indexes for common filters
CREATE INDEX ON processed_data (tenant_id);
CREATE INDEX ON processed_data ((payload->>'status'));
CREATE INDEX ON processed_data (source_timestamp);