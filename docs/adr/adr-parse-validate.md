# ADR - Data Parsing and Validation with AJV

Date: 2025-10-12
Status: `In Review`
Owner: not-assigned

---

## Context

The system ingests structured data from customers via API uploads in CSV, NDJSON, or JSON formats.
Each uploaded dataset must be:
- Validated on the source file level to match the format
- Parsed into a normalized object representation.
- Validated against a tenant-specific data schema (stored in the database as JSON Schema).
- Rejected or corrected before insertion into canonical storage if validation fails.

We need a consistent mechanism to enforce schema validation and to guarantee that uploaded data matches the expected structure and types defined by each tenant’s schema.

## Decision

We will use Ajv [(Another JSON Schema Validator)](https://ajv.js.org/) as the standard validation engine for JSON/NDJSON parsing, and for row-level validation of parsed CSV data.
The AJV config rules and the extent on how strict the parsing should be can be dynamic user-defined value.

## Implementation Details

Each tenant defines a schema in the `data_schema` table as a JSON Schema Draft-07 document stored in jsonb format.

On file upload:
- The raw file (CSV, JSON, NDJSON) is parsed into JSON objects.
- The schema is fetched from `data_schema`.
- Ajv compiles the schema into a validator function.
- Each record is validated; invalid rows are rejected/logged.
- Validated data proceeds to the ingestion/upsert pipeline.

Custom metadata `"x-unique": ["id"]` is supported to specify uniqueness or conflict resolution behavior. These fields are not standard JSON Schema keywords, but Ajv safely ignores them, allowing the ingestion layer to enforce the related DB logic.
The field `"x-unique": ["property_name"]` is used to identify the unique value in order to set the override behaviour, you can think of it as a unique data row index.
The value for such unique key is stored in `processed_data` table record in `unique_key_value` field, 
if on upload for the same `tenant_id/data_name` there is a record with the same `unique_key_value`, the DB record will be overriden and new SHA256 will be generated for a record.

Conflict policy `last-write-wins upsert` is implemented at the persistence layer, not inside Ajv.

## Rationale

Standards-based: Ajv fully supports JSON Schema Draft-07 and later.
Performance: Ajv compiles schemas into optimized JavaScript functions for high-volume ingestion, the data is parsed as stream in a batch by 1000 items per batch, data ingested as a bulk upsert in DB.
Extensibility: Allows custom keywords (e.g., uniqueField, tenantIdExists) for domain-specific rules.
Integration: Works seamlessly in NestJS; validator can be reused in both ingestion services and REST endpoints.
Consistency: Uniform validation mechanism for CSV (after parsing), JSON, and NDJSON.

## Consequences

Schema changes can be versioned and validated before enabling ingestion for a tenant.
Ajv introduces a lightweight dependency and must be updated for security patches.
Complex cross-record validations (e.g., uniqueness across files) remain outside the JSON Schema scope and require separate logic or DB constraints.

<img width="2236" height="1930" alt="ingest-data-example" src="https://github.com/user-attachments/assets/fb512e61-abf3-4094-9f51-81aede6b6b9b" />

