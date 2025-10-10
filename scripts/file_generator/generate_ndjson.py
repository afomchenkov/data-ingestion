import json
import random
import uuid
from datetime import datetime, timedelta


def random_date(start, end):
    """Return a random datetime between two datetime objects."""
    return start + (end - start) * random.random()


def generate_random_record():
    """Generate a random JSON record."""
    return {
        "id": str(uuid.uuid4()),
        "name": random.choice(["Alice", "Bob", "Charlie", "Diana", "Eve", "Frank"]),
        "age": random.randint(18, 80),
        "score": round(random.uniform(0, 100), 2),
        "active": random.choice([True, False]),
        "created_at": random_date(
            datetime(2020, 1, 1), datetime(2025, 1, 1)
        ).isoformat(),
    }


def generate_ndjson(filename, num_records=1000):
    """Generate an NDJSON file with random records."""
    with open(filename, "w", encoding="utf-8") as f:
        for _ in range(num_records):
            record = generate_random_record()
            f.write(json.dumps(record) + "\n")


if __name__ == "__main__":
    generate_ndjson("random_data.ndjson", num_records=1000)
    print("NDJSON file 'random_data.ndjson' generated successfully.")
