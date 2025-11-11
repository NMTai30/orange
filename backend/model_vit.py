import os

import numpy as np
import timm
import torch
import torch.nn as nn
import torchvision.transforms as transforms
from PIL import Image

# =============================
# 1️⃣ Cấu hình thiết bị
# =============================
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# =============================
# 2️⃣ Load model ViT
# =============================
model_path = os.path.join(os.getcwd(), "vit_orange_classifier.pth")

# ⚠️ Số lớp phải đúng với model bạn đã train
# Ví dụ: nếu bạn train chỉ 3 mức ngọt, đổi num_classes=3
NUM_CLASSES = 3

# Tạo model ViT
model = timm.create_model("vit_base_patch16_224", pretrained=False, num_classes=NUM_CLASSES)

# Load trọng số
if os.path.exists(model_path):
    try:
        state_dict = torch.load(model_path, map_location=device)
        model.load_state_dict(state_dict, strict=False)
        print("✅ Đã load model ViT thành công!")
    except Exception as e:
        print(f"⚠️ Lỗi khi load model ViT: {e}")
else:
    print("❌ Không tìm thấy file vit_orange_classifier.pth")

model.to(device)
model.eval()

# =============================
# 3️⃣ Transform ảnh đầu vào
# =============================
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.5, 0.5, 0.5], [0.5, 0.5, 0.5]),
])

# =============================
# 4️⃣ Hàm dự đoán độ ngọt
# =============================
def predict_sweetness(image_path: str):
    """
    Dự đoán độ ngọt của quả cam từ ảnh đầu vào.
    Trả về:
      {
        "sweetness": "Vừa",
        "confidence": 0.87
      }
    Hoặc:
      {"error": "Không nhận diện được cam"}
    """
    try:
        if not os.path.exists(image_path):
            return {"error": "Không tìm thấy ảnh đầu vào"}

        image = Image.open(image_path).convert("RGB")
        img_tensor = transform(image).unsqueeze(0).to(device)

        with torch.no_grad():
            outputs = model(img_tensor)
            probs = torch.softmax(outputs, dim=1)
            conf, pred = torch.max(probs, dim=1)

        pred = pred.item()
        conf = conf.item()

        # Danh sách mức độ ngọt
        classes = ["Ít ngọt", "Vừa", "Rất ngọt"]

        # Kiểm tra an toàn index
        if pred < 0 or pred >= len(classes):
            return {"error": "Không nhận diện được cam"}

        return {
            "sweetness": classes[pred],
            "confidence": float(conf)
        }

    except Exception as e:
        return {"error": f"Lỗi dự đoán: {str(e)}"}
