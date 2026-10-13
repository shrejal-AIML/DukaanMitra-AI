import pandas as pd
import random
from datetime import date, timedelta

products = [
    "Maggi",
    "Parle",
    "Britannia",
    "Kissan",
    "Nescafe",
    "Pepsi",
    "Soap",
    "ToothPaste"
]

start_date = date(2026, 8, 1)

rows = []

for i in range(60):
    current_date = start_date + timedelta(days=i)

    for product in products:
        units_sold = random.randint(2, 15)

        rows.append({
            "date": current_date,
            "product": product,
            "units_sold": units_sold
        })

df = pd.DataFrame(rows)

df.to_csv("sales_data.csv", index=False)

print("Sales dataset created!")
print("Rows:", len(df))