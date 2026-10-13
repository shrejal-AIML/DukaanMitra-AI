import pandas as pd

df = pd.read_csv("sales_data.csv")
df["date"] = pd.to_datetime(df["date"])

summary = (
    df.groupby("product")["units_sold"]
    .mean()
    .round(2)
    .reset_index()
)

summary.rename(
    columns={"units_sold": "average_daily_demand"},
    inplace=True
)

summary["recommended_stock"] = (
    summary["average_daily_demand"] * 7
).round().astype(int)

print("\nDukaanMitra Restock Recommendation:\n")
print(summary)