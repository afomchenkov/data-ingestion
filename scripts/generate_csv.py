import csv
import random
import string
from datetime import datetime, timedelta


def random_date(start, end):
    return start + timedelta(
        seconds=random.randint(0, int((end - start).total_seconds())),
    )


def random_name():
    first = "".join(random.choices(string.ascii_uppercase, k=1)) + "".join(
        random.choices(string.ascii_lowercase, k=random.randint(3, 7))
    )
    last = "".join(random.choices(string.ascii_uppercase, k=1)) + "".join(
        random.choices(string.ascii_lowercase, k=random.randint(4, 8))
    )
    return f"{first} {last}"


def random_description():
    words = [
        "alpha",
        "beta",
        "gamma",
        "delta",
        "omega",
        "sigma",
        "lambda",
        "theta",
        "zeta",
    ]
    return " ".join(random.choices(words, k=random.randint(5, 12)))


def generate_csv(filename="random_data.csv", rows=10000):
    start_date = datetime.now() - timedelta(days=365 * 5)
    end_date = datetime.now()

    with open(filename, mode="w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow(
            [
                "date",
                "name",
                "description",
                "random_sum",
                "random_average",
                "random_decimals",
            ]
        )

        for _ in range(rows):
            date = random_date(start_date, end_date).strftime("%Y-%m-%d")
            name = random_name()
            description = random_description()
            random_sum = random.randint(100, 10000)
            random_average = round(random.uniform(10, 1000), 2)
            random_decimals = round(random.random(), 6)

            writer.writerow(
                [date, name, description, random_sum, random_average, random_decimals]
            )

    print(f"✅ Generated {rows} rows in {filename}")


if __name__ == "__main__":
    generate_csv()
