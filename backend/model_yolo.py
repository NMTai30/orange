# model_yolo.py
from ultralytics import YOLO


def load_yolo(model_path="yolov8n.pt"):
    return YOLO(model_path)
