import pandas as pd
from datetime import date


def check_expiry():

    df = pd.read_csv("expiry_data.csv")

    today = date.today()

    results = []

    for _, row in df.iterrows():

        expiry_date = pd.to_datetime(
            row["expiry_date"]
        ).date()

        days_left = (
            expiry_date - today
        ).days

        if days_left < 0:

            status = "Expired"

        elif days_left <= 30:

            status = "Expiring Soon"

        else:

            status = "Safe"

        if status == "Expired":

            recommendation = (
                "Remove from shelf immediately."
            )

        elif status == "Expiring Soon":

            recommendation = (
                "Consider discount or clearance sale."
            )

        else:

            recommendation = (
                "Stock is safe."
            )

        results.append({

            "product": row["product"],

            "expiry_date": str(
                expiry_date
            ),

            "quantity": int(
                row["quantity"]
            ),

            "days_left": days_left,

            "status": status,

            "recommendation": recommendation

        })

    return results