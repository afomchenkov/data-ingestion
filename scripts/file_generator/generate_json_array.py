import json
import random
import string
from datetime import datetime, timedelta


def random_string(length=8):
    """Generate a random string of fixed length."""
    return "".join(random.choices(string.ascii_lowercase, k=length))


def random_date(start_year=2000, end_year=2025):
    """Generate a random date between two years (ISO 8601 format)."""
    start_date = datetime(start_year, 1, 1)
    end_date = datetime(end_year, 12, 31)
    delta = end_date - start_date
    random_days = random.randint(0, delta.days)
    return (start_date + timedelta(days=random_days)).strftime("%Y-%m-%d")


def generate_random_object():
    """Generate an object with fixed keys but random values."""
    return {
        "name": random_string(6).capitalize(),
        "description": " ".join(random_string(5) for _ in range(3)),
        "year": random.randint(1990, 2025),
        "created": random_date(),
        "random_number": random.randint(1, 1000),
        "score": round(random.uniform(0, 100), 2),
    }


def generate_random_json_array(num_objects=10):
    """Generate a JSON array of objects with fixed schema."""
    return [generate_random_object() for _ in range(num_objects)]


if __name__ == "__main__":
    data = generate_random_json_array(num_objects=10_000)

    with open("random_array.json", "w") as f:
        json.dump(data, f, indent=4)

    print("Random JSON array file generated: random_array.json")
