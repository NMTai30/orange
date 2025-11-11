import json
import os

import torch
import uvicorn
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from google.cloud import firestore
from model_unet import crop_orange
from model_vit import predict_sweetness
from PIL import Image

# -----------------------------
# 🔥 Khởi tạo FastAPI
# -----------------------------
app = FastAPI()

# Cho phép React Native hoặc web truy cập API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# 🔥 Kết nối Firestore
# -----------------------------
# Cần file key Firebase: serviceAccountKey.json
# Tải từ Firebase → Project settings → Service Accounts → Generate new private key
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "serviceAccountKey.json"
db = firestore.Client()

# -----------------------------
# 🧠 Route 1: Lấy thư viện cam
# -----------------------------
@app.get("/library")
def get_library():
    """
    Lấy danh sách tất cả các loại cam (trừ phần introduction)
    từ Firestore collection 'library'
    """
    try:
        docs = db.collection("library").stream()
        items = []
        for doc in docs:
            data = doc.to_dict()
            if data.get("type") != "introduction":
                items.append(data)
        return items
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

# -----------------------------
# 🟠 Route 2: Lấy phần giới thiệu cam
# -----------------------------
@app.get("/library/introduction")
def get_introduction():
    """
    Lấy phần giới thiệu (introduction) về cam từ Firestore
    """
    try:
        docs = db.collection("library").where("type", "==", "introduction").stream()
        for doc in docs:
            return doc.to_dict()
        return JSONResponse({"error": "Không tìm thấy phần giới thiệu"}, status_code=404)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

# -----------------------------
# 🍊 Route 3: Dự đoán độ ngọt của cam (U-Net + ViT)
# -----------------------------
@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        # Lưu ảnh tạm
        image_path = f"uploads/{file.filename}"
        with open(image_path, "wb") as f:
            f.write(await file.read())

        # Dự đoán mask U-Net → crop cam
        cropped = crop_orange(image_path)
        if cropped is None:
            return JSONResponse({"error": "Không nhận diện được cam"}, status_code=400)

        cropped_path = f"uploads/cropped_{file.filename}"
        Image.fromarray(cropped).save(cropped_path)

        # Dự đoán độ ngọt bằng ViT
        result = predict_sweetness(cropped_path)
        return result

    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

@app.get("/library/{name}")
def get_orange_detail(name: str):
    """
    Trả về thông tin chi tiết của một loại cam theo tên
    """
    for folder in os.listdir(LIBRARY_PATH):
        info_path = os.path.join(LIBRARY_PATH, folder, "info.json")
        if os.path.exists(info_path):
            with open(info_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            if data.get("name") == name:
                image_path = None
                for f in os.listdir(os.path.join(LIBRARY_PATH, folder)):
                    if f.lower().endswith((".jpg", ".png", ".jpeg")):
                        image_path = f"/static/{folder}/{f}"
                        break
                if image_path:
                    data["image"] = image_path
                return data

    return JSONResponse({"error": "Không tìm thấy loại cam này"}, status_code=404)


# -----------------------------
# 🚀 Chạy server
# -----------------------------
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

# @app.get("/test-firebase")
# def test_firebase():
#     try:
#         db.collection("test").add({"msg": "Kết nối thành công!"})
#         return {"status": "✅ Firebase hoạt động!"}
#     except Exception as e:
#         return {"error": str(e)}