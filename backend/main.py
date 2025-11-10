import json
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

app = FastAPI()

# Cho phép React Native truy cập API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")

# === 📚 Đường dẫn thư viện cam ===
LIBRARY_PATH = os.path.join(os.getcwd(), "library")

@app.get("/library")
def get_library():
    """
    Trả về danh sách tất cả các loại cam (không bao gồm introduction)
    """
    items = []
    for folder in os.listdir(LIBRARY_PATH):
        folder_path = os.path.join(LIBRARY_PATH, folder)
        info_path = os.path.join(folder_path, "info.json")
        image_path = None

        # Nếu có ảnh trong thư mục -> lấy ảnh đầu tiên
        for f in os.listdir(folder_path):
            if f.lower().endswith((".jpg", ".png", ".jpeg")):
                image_path = f"/static/{folder}/{f}"
                break

        # Nếu có file info.json
        if os.path.exists(info_path):
            with open(info_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            data["folder"] = folder
            if image_path:
                data["image"] = image_path
            if folder != "introduction":
                items.append(data)

    return items


@app.get("/library/introduction")
def get_introduction():
    """
    Trả về thông tin phần giới thiệu về cam
    """
    intro_path = os.path.join(LIBRARY_PATH, "introduction", "info.json")
    if not os.path.exists(intro_path):
        return JSONResponse({"error": "Không tìm thấy file giới thiệu"}, status_code=404)

    with open(intro_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Gắn đường dẫn ảnh nếu có
    intro_dir = os.path.join(LIBRARY_PATH, "introduction")
    for f in os.listdir(intro_dir):
        if f.lower().endswith((".jpg", ".png", ".jpeg")):
            data["image"] = f"/static/image/{f}"
            break

    return data
