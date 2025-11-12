import os

import firebase_admin
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from firebase_admin import credentials, firestore, storage

# =====================================================
# 🚀 Khởi tạo FastAPI
# =====================================================
app = FastAPI()

# Cho phép React Native truy cập API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================================================
# 🔥 Kết nối Firebase
# =====================================================
if not firebase_admin._apps:
    try:
        cred = credentials.Certificate("serviceAccountKey.json")
        firebase_admin.initialize_app(cred, {
            "storageBucket": "YOUR_FIREBASE_PROJECT_ID.appspot.com"
        })
        print("✅ Đã kết nối Firebase thành công!")
    except Exception as e:
        print("⚠️ Không thể khởi tạo Firebase:", e)

db = firestore.client()
bucket = storage.bucket()

# =====================================================
# 📚 API: Lấy phần giới thiệu
# =====================================================
@app.get("/library/introduction")
def get_introduction():
    try:
        doc = db.collection("library").document("introduction").get()
        if not doc.exists:
            return JSONResponse({"error": "Không tìm thấy phần giới thiệu"}, status_code=404)
        data = doc.to_dict()

        # Nếu có ảnh → tạo URL tải từ Firebase Storage
        if "image" in data:
            blob = bucket.blob(data["image"])
            data["image_url"] = blob.generate_signed_url(expiration=3600)
        return data
    except Exception as e:
        return JSONResponse({"error": f"Lỗi lấy dữ liệu: {e}"}, status_code=500)

# =====================================================
# 🍊 API: Lấy danh sách các loại cam
# =====================================================
@app.get("/library")
def get_library():
    try:
        docs = db.collection("library").stream()
        items = []
        for doc in docs:
            if doc.id == "introduction":
                continue
            data = doc.to_dict()

            # Nếu có ảnh
            if "image" in data:
                blob = bucket.blob(data["image"])
                data["image_url"] = blob.generate_signed_url(expiration=3600)

            data["id"] = doc.id
            items.append(data)
        return items
    except Exception as e:
        return JSONResponse({"error": f"Lỗi lấy danh sách cam: {e}"}, status_code=500)

# =====================================================
# 🍊 API: Lấy chi tiết 1 loại cam
# =====================================================
@app.get("/library/{orange_name}")
def get_orange_detail(orange_name: str):
    try:
        doc_ref = db.collection("library").document(orange_name)
        doc = doc_ref.get()
        if not doc.exists:
            return JSONResponse({"error": "Không tìm thấy loại cam"}, status_code=404)

        data = doc.to_dict()
        if "image" in data:
            blob = bucket.blob(data["image"])
            data["image_url"] = blob.generate_signed_url(expiration=3600)
        return data
    except Exception as e:
        return JSONResponse({"error": f"Lỗi lấy chi tiết: {e}"}, status_code=500)
