# DukaanMitra-AI
AI-powered inventory and expiry management assistant for small retail shops

DukaanMitra AI is a student project designed to help small Indian kirana store owners manage inventory, monitor product expiry dates, and make better stock-management decisions using AI and computer vision.

## 🚀 Features

* Shelf Product Detection: Uses YOLO and OpenCV to detect packaged products in shelf images.
* Inventory Dashboard: Displays detected stock information to support inventory monitoring.
* Expiry Date Detection: Uses Tesseract OCR to extract expiry dates from product images.
* Sales Analysis: Provides a dashboard for sales-related analysis.
* AI Shopkeeper Assistant: Provides an interface for stock-management queries.

## 🛠️ Technologies Used

* Python
* Flask
* YOLO
* OpenCV
* Tesseract OCR
* HTML
* CSS
* JavaScript
* Google Colab

## 📂 Project Structure

DukaanMitra-AI/
├── app.py
├── yolo_detector.py
├── forecast_model.py
├── sales_analysis.py
├── generates_sales.py
├── expiray_checker.py
├── expiray_ocr.py
├── requirements.txt
├── static/
├── templates/
├── dukaanmitra_v1/
└── README.md


## 📊 Model Performance

The improved YOLO model achieved these validation metrics in training experiments:

Precision: 0.731
Recall: 0.556
mAP@50: 0.617
mAP@50–95: 0.403

These results are validation metrics and do not guarantee the same performance on real-world shop shelves. Product detection accuracy and coverage are still being improved.

## ▶️ Running the Project

Clone or download this repository.

Install the required Python packages:

pip install -r requirements.txt
Install Tesseract OCR if you want to use the expiry-date OCR feature.
Ensure the required YOLO model weights and configuration are available.

Start the application:

python app.py

Open this address in your browser:

http://127.0.0.1:5000

5000
🔧 Current Project Status

Ongoing Student Project

The project combines a Flask web application with shelf product detection, expiry-date OCR, and sales-related modules. Current development focuses on improving product detection accuracy, reducing false predictions, and making the inventory workflow more reliable.


## 🎯 Future Improvements

* Improve product detection accuracy using more real-world shelf images.
* Expand the number of supported product categories.
* Improve expiry-date extraction across different packaging formats.
* Enhance demand forecasting and restocking recommendations.

## 👩‍💻 Author

BCA Artificial Intelligence and Machine Learning Student

This project was developed as a practical application of AI, computer vision, and web development for small retail businesses.
