## Testing

## Prerequisites

All services are started and the Swagger API accessible.
Please note that for a proper data parsing, there must be a tenant and data schema created. Test tenant and schemas you'll find below.
Supported file types:

- 'text/csv'
- 'application/json'
- 'application/x-ndjson'


## Test credentials

```txt
Test tenant ID: 33b268bd-8639-448d-93d0-300b62e2bb99

Test schema ID (JSON): ab6f65c7-4858-478c-ab8f-e54b932ff95d
Test schema ID (NDJSON): 6027618b-5fc7-483f-a7a2-6fe5c2b6988e
Test schema ID (CSV): 3bf3126f-2a8e-45ec-9443-e32ee3332ddb
```

## 1. Generate signed URLs for file upload

```sh
# Get signed URL for JSON upload
# POST: http://localhost:8181/api/v1/files/uploads/init
curl -X POST "http://localhost:8181/api/v1/files/uploads/init" \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "random_json-data1",
    "fileType": "json",
    "dataName": "my_json_data_1",
    "schemaId": "ab6f65c7-4858-478c-ab8f-e54b932ff95d",
    "tenantId": "33b268bd-8639-448d-93d0-300b62e2bb99"
  }'

# Get signed URL for CSV upload
# POST: http://localhost:8181/api/v1/files/uploads/init
curl -X POST "http://localhost:8181/api/v1/files/uploads/init" \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "random_csv-data1",
    "fileType": "csv",
    "dataName": "my_csv_data_1",
    "schemaId": "3bf3126f-2a8e-45ec-9443-e32ee3332ddb",
    "tenantId": "33b268bd-8639-448d-93d0-300b62e2bb99"
  }'

# Get signed URL for NDJSON upload
# POST: http://localhost:8181/api/v1/files/uploads/init
curl -X POST "http://localhost:8181/api/v1/files/uploads/init" \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "random_ndjson-data1",
    "fileType": "ndjson",
    "dataName": "my_ndjson_data_1",
    "schemaId": "6027618b-5fc7-483f-a7a2-6fe5c2b6988e",
    "tenantId": "33b268bd-8639-448d-93d0-300b62e2bb99"
  }'
```

Every request returns unique signed URL for one time upload of a file. The response should look like this:
```json
{
    "uploadId": "84510aad-5b53-4397-9073-04590e274560",
    "originalFileName": "random_csv-data1",
    "s3Key": "/2025/10/11/tenant/33b268bd-8639-448d-93d0-300b62e2bb99/upload/84510aad-5b53-4397-9073-04590e274560/random_csv-data1.csv",
    "presignedUrl": "http://localhost:4566/raw-data-ingestion-bucket//2025/10/11/tenant/33b268bd-8639-448d-93d0-300b62e2bb99/upload/84510aad-5b53-4397-9073-04590e274560/random_csv-data1.csv?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=your_access_key%2F20251011%2Feu-west-1%2Fs3%2Faws4_request&X-Amz-Date=20251011T174103Z&X-Amz-Expires=300&X-Amz-Signature=eda1c6a29429353d7949d5c70265fda4d08b2c9ddd09142200177f260eca31e3&X-Amz-SignedHeaders=host&x-amz-acl=private&x-amz-checksum-crc32=AAAAAA%3D%3D&x-amz-meta-filetype=csv&x-amz-meta-tenantid=33b268bd-8639-448d-93d0-300b62e2bb99&x-amz-meta-uploadid=84510aad-5b53-4397-9073-04590e274560&x-amz-sdk-checksum-algorithm=CRC32&x-id=PutObject"
}
```

## 2. Submit test CSV/JSON/NDJSON files

Go to `~/scripts/file_generator/*` and from this folder run the requests below.
Replace `"{presignedUrl}"` with the corresponding generated `presignedUrl`.

```sh
# NDJSON request for upload
curl -X PUT \
  -T ./random_data.ndjson \
  -H "Content-Type: application/x-ndjson" \
  "{presignedUrl}"

# CSV request for upload
curl -X PUT \
  -T ./random_data.csv \
  -H "Content-Type: text/csv" \
  "{presignedUrl}"

# JSON request for upload
curl -X PUT \
  -T ./random_array.json \
  -H "Content-Type: application/json" \
  "{presignedUrl}"
```

e.g. the CSV submit data request will look like:

```sh
curl -X PUT \
  -T ./random_data.csv \
  -H "Content-Type: text/csv" \
  "http://localhost:4566/raw-data-ingestion-bucket//2025/10/11/tenant/33b268bd-8639-448d-93d0-300b62e2bb99/upload/84510aad-5b53-4397-9073-04590e274560/random_csv-data1.csv?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=your_access_key%2F20251011%2Feu-west-1%2Fs3%2Faws4_request&X-Amz-Date=20251011T174103Z&X-Amz-Expires=300&X-Amz-Signature=eda1c6a29429353d7949d5c70265fda4d08b2c9ddd09142200177f260eca31e3&X-Amz-SignedHeaders=host&x-amz-acl=private&x-amz-checksum-crc32=AAAAAA%3D%3D&x-amz-meta-filetype=csv&x-amz-meta-tenantid=33b268bd-8639-448d-93d0-300b62e2bb99&x-amz-meta-uploadid=84510aad-5b53-4397-9073-04590e274560&x-amz-sdk-checksum-algorithm=CRC32&x-id=PutObject"
```

This should start the data ingestion once the file is submitted.

## 3. Check the status of the upload

If the data is ingested properly, status should be: `COMPLETE`

```sh
# get the upload status, `uploadId` is returned in generated signed URL response
curl -X GET  "http://localhost:8181/api/v1/files/uploads/{uploadId}"
# response example
{
    "id": "bb02bff8-59df-4916-ad93-9afd7d58814b",
    "createdAt": "2025-10-11T17:17:17.556Z",
    "updatedAt": "2025-10-11T17:17:17.556Z",
    "tenantId": "33b268bd-8639-448d-93d0-300b62e2bb99",
    "uploadId": "e0e40ec1-a6f8-45ea-a12b-228f98be3abc",
    "fileName": "random_json-data1",
    "fileType": "json",
    "dataName": "my_json_data_1",
    "schemaId": "ab6f65c7-4858-478c-ab8f-e54b932ff95d",
    "filePath": "/2025/10/11/tenant/33b268bd-8639-448d-93d0-300b62e2bb99/upload/e0e40ec1-a6f8-45ea-a12b-228f98be3abc/random_json-data1.json",
    "contentSha256": "36f726543f4839b3bfa6d34249dd75048cbb4ecb1812069db17dd5cd04d424f1",
    "status": "complete",
    "sizeBytes": "1906939"
}
```

## 4. Check API to fetch parsed data

Here is a list of example requests to test the APIs:

```sh
# fetch all upload jobs per tenant
curl -X GET "http://localhost:8181/api/v1/files/uploads?tenant_id=33b268bd-8639-448d-93d0-300b62e2bb99"
# fetch available data schemas
curl -X GET "http://localhost:8181/api/v1/files/data-schemas"
# fetch all available tenants
curl -X GET "http://localhost:8181/api/v1/files/tenants"
# fetch parsed data
curl "http://localhost:8282/api/v1/data-records?dataName=my_json_data_1&tenantId=33b268bd-8639-448d-93d0-300b62e2bb99&page=1&limit=20&sortBy=createdAt"
```

Also check API docs for more:

```txt
Uploader Service: http://localhost:8181/api/v1/docs
Parser service: http://localhost:8282/api/v1/docs
```

---
---

## Test data scripts

Test data is located in `~/scripts/file_generator/*`

```sh
# to re-generate new test data for JSON
python ./generate_json_array.py

# to re-generate new test data for NDJSON
python ./generate_ndjson.py

# to re-generate new test data for JSON
python ./generate_csv.py
```
