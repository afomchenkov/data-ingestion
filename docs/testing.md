## Testing

## Test credentials

```txt
Test tenant ID: 33b268bd-8639-448d-93d0-300b62e2bb99

Test schema ID (JSON): ab6f65c7-4858-478c-ab8f-e54b932ff95d
Test schema ID (NDJSON): 6027618b-5fc7-483f-a7a2-6fe5c2b6988e
Test schema ID (CSV): 3bf3126f-2a8e-45ec-9443-e32ee3332ddb
```

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


## Submit test CSV/JSON file

```sh
# 1. go to folder ./scripts/file_generator
# 2. run necessary file generator
# 3. adjust the file name
# 4. choose any tenant by running the URL (GET): http://localhost:8181/api/v1/files/tenants
# 5. run the following URL to get signed URL (POST): http://localhost:8181/api/v1/files/uploads/init
# 6. upload to S3 via signed URL with the request below

# supported types:
#   'text/csv'
#   'application/json'
#   'application/x-ndjson'

# NDJSON request for upload
curl -X PUT \
  -T ./random_data.ndjson \
  -H "Content-Type: application/x-ndjson" \
  "signed_url"

# CSV request for upload
curl -X PUT \
  -T ./random_data.csv \
  -H "Content-Type: text/csv" \
  "signed_url"

# JSON request for upload
curl -X PUT \
  -T ./random_array.json \
  -H "Content-Type: application/json" \
  "signed_url"
```
