# Architecture overview

![ingest-data-flow](https://github.com/user-attachments/assets/721c92b9-ce02-487e-a86f-b92abf7104c6)

---

The ingestion pipeline consists of the services Uploader/Parser, Kafka as a message broker for main steps of the ingestion pipeline,
PostgreSQL as DB, the source files are stored in S3.


## DB tables structure

<img width="1519" height="1159" alt="ingestion-data-db" src="https://github.com/user-attachments/assets/ef899e2b-7c3a-470d-aa61-b0bd432dbd4d" />


## Ingestion job lifecycle

