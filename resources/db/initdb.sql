CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DROP TABLE IF EXISTS ingest_job CASCADE;
CREATE TABLE ingest_job (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid REFERENCES tenant(id),
    filename text,
    file_type text,
    file_version_id text,
    content_sha256 text,
    status text CHECK (status IN ('uploaded','processing','queued','initiated','complete','failed')) DEFAULT 'initiated',
    size_bytes bigint,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

DROP TABLE IF EXISTS tenant CASCADE;
CREATE TABLE tenant (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

DROP TABLE IF EXISTS processed_data CASCADE;
CREATE TABLE processed_data (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid REFERENCES tenant(id),
    filename text,
    file_type text,
    file_version_id text,
    row_content_sha256 text NOT NULL,
    source_timestamp timestamptz,
    ingest_job_id uuid REFERENCES ingest_job(id),
    version bigint DEFAULT 1,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

DROP TABLE IF EXISTS processed_data_content CASCADE;
CREATE TABLE processed_data_content (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    payload jsonb NOT NULL,
    data_record_id uuid REFERENCES processed_data(id),
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
  tenant_id text,
  source_ts timestamptz,
  ingest_job_id uuid REFERENCES ingest_job(id),
  ingest_error_id uuid REFERENCES ingest_error(id),
  processed_data_id uuid REFERENCES processed_data(id),
  version integer,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX ON processed_data (tenant_id);
CREATE INDEX ON processed_data ((payload->>'status'));
CREATE INDEX ON processed_data (source_timestamp);

-- ------------------------------------------------------------
-- ------------------------------------------------------------

INSERT INTO tenant (id, name, email, phone)
SELECT
    gen_random_uuid(),
    'Tenant' || ((random() * 100)::int + 1),
    'tenant' || ((random() * 1000)::int + 1) || '@example.com',
    '+49(162)' || lpad(((random() * 9999)::int)::text, 4, '0')
FROM generate_series(1, 10);
