import pandas as pd
from sklearn.ensemble import RandomForestRegressor


def forecast_demand(product_name):

    df = pd.read_csv("sales_data.csv")

    df["date"] = pd.to_datetime(df["date"])

    product_data = df[
        df["product"] == product_name
    ].copy()

    if len(product_data) < 10:
        return None

    product_data = product_data.sort_values("date")

    # Create time-based features
    product_data["day_number"] = range(
        len(product_data)
    )

    product_data["day_of_week"] = (
        product_data["date"].dt.dayofweek
    )

    X = product_data[
        [
            "day_number",
            "day_of_week"
        ]
    ]

    y = product_data["units_sold"]

    # Train model
    model = RandomForestRegressor(
        n_estimators=100,
        random_state=42
    )

    model.fit(X, y)

    # Predict next day
    next_day_number = len(product_data)

    next_date = (
        product_data["date"].max()
        + pd.Timedelta(days=1)
    )

    next_day_of_week = next_date.dayofweek

    prediction = model.predict([
        [
            next_day_number,
            next_day_of_week
        ]
    ])

    return round(
        max(0, prediction[0]),
        2
    )