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

![ingestion-job-flow](https://github.com/user-attachments/assets/b82e6dd6-4f3d-44c9-91f6-27bb1c66ad40)

