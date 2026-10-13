from ultralytics import YOLO

MODEL_PATH = r"C:\Users\shrej\Downloads\best.pt"

model = YOLO(MODEL_PATH)



def detect_objects(image_path):

    results = model.predict(
        source=image_path,
        conf=0.35,
        imgsz=960,
        iou=0.45,
        verbose=False
    )

    detections = []

    for result in results:
        for box in result.boxes:
            class_id = int(box.cls[0])
            confidence = float(box.conf[0])

            x1, y1, x2, y2 = map(
                int, box.xyxy[0].tolist()
            )

            detections.append({
                "product": model.names[class_id],
                "confidence": round(confidence * 100, 1),
                "box": [x1, y1, x2, y2]
            })

    return detections
print("Products supported by model:", model.names)