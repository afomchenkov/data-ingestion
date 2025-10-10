import json
import random
import uuid
from datetime import datetime, timedelta, timezone


def random_date(start, end):
    """Return a random datetime between two datetime objects."""
    return start + (end - start) * random.random()


def generate_random_record():
    """Generate a random JSON record with RFC 3339 compliant datetime."""
    # Generate random datetime in UTC
    random_dt = random_date(
        datetime(2020, 1, 1, tzinfo=timezone.utc),
        datetime(2025, 1, 1, tzinfo=timezone.utc),
    )

    return {
        "id": str(uuid.uuid4()),
        "name": random.choice(["Alice", "Bob", "Charlie", "Diana", "Eve", "Frank"]),
        "age": random.randint(18, 80),
        "score": round(random.uniform(0, 100), 2),
        "active": random.choice([True, False]),
        "created_at": random_dt.isoformat().replace('+00:00', 'Z'),
        # This produces: 2020-01-29T18:01:26.701270+00:00 and replaces +00:00 with Z
    }


def generate_ndjson(filename, num_records=1000):
    """Generate an NDJSON file with random records."""
    with open(filename, "w", encoding="utf-8") as f:
        for _ in range(num_records):
            record = generate_random_record()
            f.write(json.dumps(record) + "\n")


if __name__ == "__main__":
    generate_ndjson("random_data.ndjson", num_records=10_000)
    print("NDJSON file 'random_data.ndjson' generated successfully.")

    # Print a sample record to verify format
    print("\nSample record:")
    print(json.dumps(generate_random_record(), indent=2))
