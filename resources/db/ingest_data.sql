\connect data-ingestion;

INSERT INTO tenant (id, name, email, phone)
SELECT
    gen_random_uuid(),
    'Tenant' || ((random() * 100)::int + 1),
    'tenant' || ((random() * 1000)::int + 1) || '@example.com',
    '+49(162)' || lpad(((random() * 9999)::int)::text, 4, '0')
FROM generate_series(1, 10);

-- add test tenant
INSERT INTO tenant (id, name, email, phone)
VALUES (
    '33b268bd-8639-448d-93d0-300b62e2bb99',
    'Test Tenant Organization',
    'contact@testtenantorganization.com',
    '+49(162)1234567'
);

-- add test data schema for json array item upload
INSERT INTO data_schema (name, description, tenant_id, schema, file_type, delimiter)
VALUES (
  'Array Item Schema - JSON array of objects - 1',
  'Schema for array objects: name, description, year, created, random_number, score',
  '33b268bd-8639-448d-93d0-300b62e2bb99',
  '{
     "type": "object",
     "properties": {
       "name": { "type": "string" },
       "description": { "type": "string" },
       "year": { "type": "integer" },
       "created": { "type": "string", "format": "date" },
       "random_number": { "type": "integer" },
       "score": { "type": "number" }
     },
     "required": ["name", "year", "created"],
     "x-unique": ["name"]
   }'::jsonb,
  'json',
  ','
);

-- add test data schema for csv upload items
INSERT INTO data_schema (name, description, tenant_id, schema, file_type, delimiter)
VALUES (
  'CSV Example Schema - 1',
  'Schema for CSV items',
  '33b268bd-8639-448d-93d0-300b62e2bb99',
  '{
     "type": "object",
     "properties": {
       "date": { "type": "string", "format": "date" },
       "name": { "type": "string" },
       "description": { "type": "string" },
       "random_sum": { "type": "integer" },
       "random_average": { "type": "number" },
       "random_decimals": { "type": "number" }
     },
     "required": ["date", "name", "random_sum"],
     "x-unique": ["name"]
   }'::jsonb,
  'csv',
  ','
);

-- add test data schema for ndjson upload items
INSERT INTO data_schema (name, description, tenant_id, schema, file_type, delimiter)
VALUES (
  'Test Data Schema - NDJSON - 1',
  'Test data schema for NDJSON items - user activity',
  '33b268bd-8639-448d-93d0-300b62e2bb99',
  '{
     "type": "object",
     "properties": {
       "id": { "type": "string", "format": "uuid" },
       "name": { "type": "string" },
       "age": { "type": "integer" },
       "score": { "type": "number" },
       "active": { "type": "boolean" },
       "created_at": { "type": "string", "format": "date-time" }
     },
     "required": ["id", "name", "age", "score", "active", "created_at"],
     "x-unique": ["id"]
   }'::jsonb,
  'ndjson',
  ','
);
