CREATE EXTENSION IF NOT EXISTS 'pgcrypto';

DROP TABLE IF EXISTS ingest_job CASCADE;
CREATE TABLE ingest_job (
    id uuid PRIMARY KEY,
    uploader_id uuid,
    filename text,
    content_sha256 text,
    status text CHECK (status IN ('uploaded','processing','initiated','complete','failed')) DEFAULT 'initiated',
    total_rows bigint,
    processed_rows bigint DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

DROP TABLE IF EXISTS tenant CASCADE;
CREATE TABLE tenant (
    id uuid PRIMARY KEY,
    name text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

DROP TABLE IF EXISTS processed_data CASCADE;
CREATE TABLE processed_data (
    id uuid PRIMARY KEY,
    tenant_id uuid REFERENCES tenant(id),
    payload jsonb NOT NULL,
    row_content_sha256 text NOT NULL,
    source_timestamp timestamptz,
    ingest_job_id uuid REFERENCES ingest_job(id),
    version bigint DEFAULT 1,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

DROP TABLE IF EXISTS ingest_error CASCADE;
CREATE TABLE ingest_error (
    id uuid PRIMARY KEY,
    uploader_id uuid,
    filename text,
    content_sha256 text,
    error_message text,
    error_status text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX ON processed_data (tenant_id);
CREATE INDEX ON processed_data ((payload->>'status'));
CREATE INDEX ON processed_data (source_timestamp);

-- ------------------------------------------------------------
-- ------------------------------------------------------------

-- INSERT INTO tenant (id, name, email, phone)
-- VALUES
--     (gen_random_uuid(), 'Tenant1', 'tenant1@example.com', '+49(162)555-0001'),
--     (gen_random_uuid(), 'Tenant2', 'tenant2@example.com', '+49(162)555-0002'),
--     (gen_random_uuid(), 'Tenant3', 'tenant3@example.com', '+49(162)555-0003'),
--     (gen_random_uuid(), 'Tenant4', 'tenant4@example.com', '+49(162)555-0004'),
--     (gen_random_uuid(), 'Tenant5', 'tenant5@example.com', '+49(162)555-0005');

INSERT INTO tenant (id, name, email, phone)
SELECT
    gen_random_uuid(),
    'Tenant' || ((random() * 100)::int + 1),
    'tenant' || ((random() * 1000)::int + 1) || '@example.com',
    '+49(162)' || lpad(((random() * 9999)::int)::text, 4, '0')
FROM generate_series(1, 10);
