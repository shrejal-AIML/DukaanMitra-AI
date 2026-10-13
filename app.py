from flask import Flask, render_template, request, jsonify
import os
import pandas as pd
from datetime import datetime, date
from werkzeug.utils import secure_filename

from yolo_detector import detect_objects
from forecast_model import forecast_demand
from expiry_checker import check_expiry
from expiry_ocr import read_expiry_date


app = Flask(__name__)

UPLOAD_FOLDER = "static/uploads"

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

os.makedirs(
    UPLOAD_FOLDER,
    exist_ok=True
)


# =====================================
# HOME
# =====================================

@app.route("/")
def home():

    return render_template(
        "index.html"
    )


# =====================================
# SHELF SCANNER
# =====================================

@app.route(
    "/upload-shelf",
    methods=["POST"]
)
def upload_shelf():

    if "image" not in request.files:

        return jsonify({
            "success": False,
            "message": "कोई image नहीं मिली।"
        }), 400

    image = request.files["image"]

    if image.filename == "":

        return jsonify({
            "success": False,
            "message": "कृपया image चुनें।"
        }), 400

    filename = secure_filename(
        image.filename
    )

    file_path = os.path.join(
        app.config["UPLOAD_FOLDER"],
        filename
    )

    image.save(file_path)

    detections = detect_objects(
        file_path
    )

    return jsonify({

        "success": True,

        "filename": filename,

        "detections": detections

    })


# =====================================
# SALES ANALYSIS
# =====================================

@app.route("/sales-analysis")
def sales_analysis():

    df = pd.read_csv(
        "sales_data.csv"
    )

    df["date"] = pd.to_datetime(
        df["date"]
    )

    results = []

    for product in df["product"].unique():

        product_data = df[
            df["product"] == product
        ].sort_values("date")

        average_demand = (
            product_data["units_sold"].mean()
        )

        predicted_demand = forecast_demand(
            product
        )

        if predicted_demand is None:

            predicted_demand = round(
                average_demand,
                2
            )

        midpoint = (
            len(product_data) // 2
        )

        older_sales = (
            product_data
            .iloc[:midpoint]["units_sold"]
            .mean()
        )

        recent_sales = (
            product_data
            .iloc[midpoint:]["units_sold"]
            .mean()
        )

        if recent_sales > older_sales * 1.10:

            trend = "Increasing"

        elif recent_sales < older_sales * 0.90:

            trend = "Decreasing"

        else:

            trend = "Stable"

        recommended_stock = round(
            predicted_demand * 7
        )

        results.append({

            "product": product,

            "average_daily_demand":
                round(
                    average_demand,
                    2
                ),

            "predicted_daily_demand":
                predicted_demand,

            "recommended_stock":
                recommended_stock,

            "trend":
                trend

        })

    return jsonify(results)


# =====================================
# EXPIRY ANALYSIS
# =====================================

@app.route("/expiry-analysis")
def expiry_analysis():

    results = check_expiry()

    return jsonify(results)


# =====================================
# EXPIRY OCR
# =====================================

@app.route(
    "/ocr-expiry",
    methods=["POST"]
)
def ocr_expiry():

    try:

        if "image" not in request.files:

            return jsonify({

                "success": False,

                "message":
                    "कोई image नहीं मिली।"

            }), 400

        image = request.files["image"]

        if image.filename == "":

            return jsonify({

                "success": False,

                "message":
                    "कृपया image चुनें।"

            }), 400

        filename = secure_filename(
            image.filename
        )

        file_path = os.path.join(

            app.config["UPLOAD_FOLDER"],

            filename

        )

        image.save(file_path)

        print(
            "OCR image saved:",
            file_path
        )

        expiry_date_text = (
            read_expiry_date(
                file_path
            )
        )

        print(
            "OCR result:",
            expiry_date_text
        )

        if not expiry_date_text:

            return jsonify({

                "success": True,

                "expiry_date": None,

                "status": "Unknown",

                "days_left": None,

                "recommendation":
                    "Expiry date नहीं मिली।"

            })

        expiry_date = datetime.strptime(
            expiry_date_text.replace(
                "-",
                "/"
            ),
            "%d/%m/%Y"
        ).date()

        today = date.today()

        days_left = (
            expiry_date - today
        ).days

        if days_left < 0:

            status = "Expired"

            recommendation = (
                "🔴 Product को shelf से "
                "हटा दें।"
            )

        elif days_left <= 30:

            status = "Expiring Soon"

            recommendation = (
                "🟡 Discount या clearance "
                "sale consider करें।"
            )

        else:

            status = "Safe"

            recommendation = (
                "🟢 Product अभी safe है।"
            )

        return jsonify({

            "success": True,

            "expiry_date":
                expiry_date.strftime(
                    "%d/%m/%Y"
                ),

            "days_left":
                days_left,

            "status":
                status,

            "recommendation":
                recommendation

        })

    except Exception as e:

        print(
            "OCR ERROR:",
            str(e)
        )

        return jsonify({

            "success": False,

            "message":
                str(e)

        }), 500


# =====================================
# RUN APP
# =====================================

if __name__ == "__main__":

    app.run(
        debug=True
    )