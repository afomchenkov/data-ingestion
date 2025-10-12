# Architecture overview

![ingest-data-flow](https://github.com/user-attachments/assets/721c92b9-ce02-487e-a86f-b92abf7104c6)

---

The ingestion pipeline consists of the services Uploader/Parser, Kafka as a message broker for main steps of the ingestion pipeline,
PostgreSQL as DB, the source files are stored in S3.


## DB tables structure

<img width="1519" height="1159" alt="ingestion-data-db" src="https://github.com/user-attachments/assets/ef899e2b-7c3a-470d-aa61-b0bd432dbd4d" />

The main table to store parsed data is `processed_data`
The table to store ingestion jobs `ingest_job`
The table to store data schemas `data_schema`
The table to store the data about customers/tenants `tenant`

## Ingestion job lifecycle

Ingestion job data is supposed to track the upload lifecycle since the signed URL issue till the data saved to DB.

The required payload to init the ingestion job is:

```json
{
  "fileName": "string",
  "fileType": "string",
  "dataName": "string",
  "schemaId": "uuid",
  "tenantId": "uuid"
}
```

The filed `fileType` defines the uploaded file extension, supported types: `['csv', 'json', 'ndjson']`

The fields `schemaId` and `tenantId` must be corresponding IDs of the records in DB, otherwise it won't be possible to submit a request.

The `schemaId` must be the id of the schema, according to which the data will be validated and parsed. The schema also defines the `key unique`
property which will be used to override the data if any duplicate row is uploaded, hence the `last-write-wins upsert` approach.

The field `dataName` is an important property to define the data grouping, if `dataName` does not exist, all data will be grouped anew, if
the `dataName` already exist, all new data will be populated to the same group and in case of duplicates it'll override existing items.

<img src="https://github.com/user-attachments/assets/b82e6dd6-4f3d-44c9-91f6-27bb1c66ad40" alt="data-parsing-flow" width="800"/>

## File upload validation

Once a user uploads the file, the following validation happens:

- the tenant ID checked, if not exist, the job will fail
- the schema ID checked, if not exist, the job will fail
- the job status checked, it not INITIATED, it means that the same signed URL was used more than once, flow stops
- the uploaded file type/extension checked, if the declared file type does not match the real one, the job will fail
- SHA256 is calculated for the whole file, if duplicate hash value, the job is marked as DUPLICATE and flow stops
- in the end, the job is marked as QUEUED


## Kafka events

- the uploaded file is not found by some reason in S3 - `FileNotFoundErrorEvent`
- the initiated ingestion job record is not found in DB - `IngestJobNotFoundErrorEvent`
- the declared file type does not match the real type or the file is not valid - `FileTypeErrorEvent`
- the uploaded file has a duplicate SHA256 hash - `DuplicateUploadErrorEvent`
- any other error that can occur while parsing the source file - `SQSErrorEvent`
- a success event to mark the job as QUEUED for further processing - `NewFileUploadSuccessEvent`

## Data parsing

The ingestion pipeline accepts the file types `['csv', 'json', 'ndjson']` which should contain the list of homogeneous data.
For data parsing and extraction, there must be a corresponding data schema which defines the rules according to which the
data is processed, the validator is using `Ajv` library for parsing, if the record is not valid against the schema, it's
skipped from being saved in DB and the error is logged.
An important field in the schema is `x-unique` which defines a unique key to override the duplicates.

An example of the data schema is:

```json
{
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
  "additionalProperties": false,
  "x-unique": ["name"]
}
```

## Data parsing flow

<img src="https://github.com/user-attachments/assets/81cb7f93-cce1-49fe-a2eb-45837ae18af8" alt="data-parsing-flow" width="800"/>
