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
INSERT INTO data_schema (id, name, description, tenant_id, schema, file_type, delimiter)
VALUES (
  'ab6f65c7-4858-478c-ab8f-e54b932ff95d',
  'Array Item Schema - JSON array of objects - 1',
  'Schema for array objects: name, description, year, created, random_number, score',
  '33b268bd-8639-448d-93d0-300b62e2bb99',
  '{
     "type": "object",
     "properties": {
       "name": { "type": "string", "trimString": true },
       "description": { "type": "string", "trimString": true },
       "year": { "type": "integer" },
       "created": { "type": "string", "format": "date", "normalizeDate": true },
       "random_number": { "type": "integer" },
       "score": { "type": "number" }
     },
     "required": ["name", "year", "created"],
     "additionalProperties": false,
     "x-unique": ["name"]
   }'::jsonb,
  'json',
  ','
);

-- add test data schema for csv upload items
INSERT INTO data_schema (id, name, description, tenant_id, schema, file_type, delimiter)
VALUES (
  '3bf3126f-2a8e-45ec-9443-e32ee3332ddb',
  'CSV Example Schema - 1',
  'Schema for CSV items',
  '33b268bd-8639-448d-93d0-300b62e2bb99',
  '{
     "type": "object",
     "properties": {
       "date": { "type": "string", "format": "date", "normalizeDate": true },
       "name": { "type": "string", "trimString": true },
       "description": { "type": "string", "trimString": true },
       "random_sum": { "type": "integer" },
       "random_average": { "type": "number" },
       "random_decimals": { "type": "number" }
     },
     "required": ["date", "name", "random_sum"],
     "additionalProperties": false,
     "x-unique": ["name"]
   }'::jsonb,
  'csv',
  ','
);

-- add test data schema for ndjson upload items
INSERT INTO data_schema (id, name, description, tenant_id, schema, file_type, delimiter)
VALUES (
  '6027618b-5fc7-483f-a7a2-6fe5c2b6988e',
  'Test Data Schema - NDJSON - 1',
  'Test data schema for NDJSON items - user activity',
  '33b268bd-8639-448d-93d0-300b62e2bb99',
  '{
     "type": "object",
     "properties": {
       "id": { "type": "string", "format": "uuid" },
       "name": { "type": "string", "trimString": true },
       "age": { "type": "integer" },
       "score": { "type": "number" },
       "active": { "type": "boolean" },
       "created_at": { "type": "string", "format": "date-time", "normalizeDate": true }
     },
     "required": ["id", "name", "age", "score", "active", "created_at"],
     "additionalProperties": false,
     "x-unique": ["id"]
   }'::jsonb,
  'ndjson',
  ','
);
