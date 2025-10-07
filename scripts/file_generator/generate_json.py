import json
import random
import string


def random_string(length=6):
    """Generate a random string of fixed length."""
    return "".join(random.choices(string.ascii_lowercase, k=length))


def random_value(depth, max_depth):
    """Generate a random value: int, float, string, list, or dict (nested)."""
    if depth >= max_depth:
        return random.choice([random.randint(1, 100), random.random(), random_string()])

    choice = random.choice(["int", "float", "string", "list", "dict"])
    if choice == "int":
        return random.randint(1, 100)
    elif choice == "float":
        return round(random.uniform(1, 100), 2)
    elif choice == "string":
        return random_string()
    elif choice == "list":
        return [random_value(depth + 1, max_depth) for _ in range(random.randint(2, 5))]
    elif choice == "dict":
        return {
            random_string(): random_value(depth + 1, max_depth)
            for _ in range(random.randint(2, 5))
        }


def generate_random_json(max_depth=3, num_keys=5):
    """Generate a random nested JSON object."""
    return {random_string(): random_value(1, max_depth) for _ in range(num_keys)}


if __name__ == "__main__":
    data = generate_random_json(max_depth=10, num_keys=30)

    with open("random_nested.json", "w") as f:
        json.dump(data, f, indent=4)

    print("Random nested JSON file generated: random_nested.json")
