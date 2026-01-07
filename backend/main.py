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
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# DEVICE
device = "cuda" if torch.cuda.is_available() else "cpu"
print("🔥 Device:", device)

# LOAD MODELS
print("⏳ Loading models...")

unet = load_unet("unet_lite_best.pth", device)
unet.eval()

yolo = load_yolo("yolov8n.pt")

vit = load_vit("vit_orange_classifier.pth", device)
vit.eval()

print("✅ Models loaded")

# UPLOAD DIR
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# HEALTH CHECK
@app.get("/")
def home():
    return {"status": "OK"}

# PREDICT
@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        if not file or not file.filename:
            return JSONResponse(
                status_code=400,
                content={"is_orange": False, "error": "No file uploaded"},
            )

        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in [".jpg", ".jpeg", ".png"]:
            return JSONResponse(
                status_code=400,
                content={"is_orange": False, "error": "Only JPG/PNG supported"},
            )

        filename = f"{uuid.uuid4().hex}{ext}"
        file_path = os.path.join(UPLOAD_DIR, filename)

        contents = await file.read()
        if not contents:
            return JSONResponse(
                status_code=400,
                content={"is_orange": False, "error": "Empty file"},
            )

        with open(file_path, "wb") as f:
            f.write(contents)

        print(f"📸 Saved image: {file_path}")

        outputs = process_image(
            image_path=file_path,
            yolo_model=yolo,
            unet_model=unet,
        )

        if not isinstance(outputs, list) or len(outputs) == 0:
            return JSONResponse(
                status_code=400,
                content={"is_orange": False, "error": "No orange detected"},
            )

        predictions = []

        for obj in outputs:
            vit_input = obj["vit_input"]
            img_tensor = vit_preprocess(vit_input).to(device)

            with torch.no_grad():
                logits = vit(img_tensor)
                probs = torch.softmax(logits, dim=1)

            class_idx = int(probs.argmax(dim=1).item())
            confidence = float(probs[0, class_idx].item())

            num_classes = probs.shape[1]

            sweetness = round((class_idx / (num_classes - 1)) * 8 + 1, 1)
            sweetness = max(1.0, min(9.0, sweetness))

            # DEBUG (giữ lại để test, xong có thể xoá)
            print(
                f"DEBUG | class_idx={class_idx} / {num_classes} "
                f"→ sweetness={sweetness}"
            )

            predictions.append({
                "id": int(obj["id"]),
                "bbox": [int(x) for x in obj["bbox"]],
                "sweetness": sweetness,
                "confidence": round(confidence, 3),
                "det_confidence": round(float(obj["det_confidence"]), 3),
            })

        return JSONResponse(
            status_code=200,
            content={
                "is_orange": True,
                "num_oranges": len(predictions),
                "predictions": predictions,
            },
        )

    except Exception:
        print("❌ BACKEND CRASH")
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"is_orange": False, "error": "Internal server error"},
        )

# RUN
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
