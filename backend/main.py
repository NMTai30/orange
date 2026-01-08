import os
import traceback
import uuid

import torch
import uvicorn
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from model_unet import load_unet
from model_vit import load_vit
from model_yolo import load_yolo
from processing import process_image, vit_preprocess

app = FastAPI(title="Orange Sweetness Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

device = "cuda" if torch.cuda.is_available() else "cpu"
print("🔥 Device:", device)

# LOAD MODELS
unet = load_unet("unet_lite_best.pth", device).eval()
yolo = load_yolo("yolov8n.pt")
vit = load_vit("vit_orange_classifier.pth", device).eval()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in [".jpg", ".jpeg", ".png"]:
            return JSONResponse(status_code=400, content={"is_orange": False})

        path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4().hex}{ext}")
        with open(path, "wb") as f:
            f.write(await file.read())

        vit_input = process_image(path, yolo, unet)
        img_tensor = vit_preprocess(vit_input)

        with torch.no_grad():
            logits = vit(img_tensor)
            probs = torch.softmax(logits, dim=1)[0].cpu().numpy()

        classes = torch.arange(len(probs))
        sweetness = float((classes * probs).sum())

        sweetness = 1 + sweetness * (8 / (len(probs) - 1))
        sweetness = round(float(sweetness), 2)

        confidence = float(probs.max())

        return {
            "is_orange": True,
            "sweetness": sweetness,
            "confidence": round(confidence, 3),
        }

    except Exception:
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"is_orange": False})

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
