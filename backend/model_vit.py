import numpy as np
import timm
import torch
import torch.nn as nn
import torchvision.transforms as transforms
from PIL import Image

# =============================
# 1️⃣ Load model ViT
# =============================
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# ⚠️ Đường dẫn tới model đã train
model_path = "vit_orange_classifier.pth"

# Tạo model ViT (nếu bạn train bằng timm)
model = timm.create_model("vit_base_patch16_224", pretrained=False, num_classes=5)
# Số lớp (num_classes) chỉnh đúng với lúc bạn train: ví dụ 3 mức ngọt → num_classes=3

# Load weights
try:
    state_dict = torch.load(model_path, map_location=device)
    model.load_state_dict(state_dict, strict=False)
    print("✅ Đã load model ViT thành công.")
except Exception as e:
    print("⚠️ Lỗi khi load ViT:", e)

model.to(device)
model.eval()

# =============================
# 2️⃣ Transform ảnh đầu vào
# =============================
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.5, 0.5, 0.5], [0.5, 0.5, 0.5]),
])

# =============================
# 3️⃣ Hàm dự đoán độ ngọt
# =============================
def predict_sweetness(image_path: str):
    try:
        # Mở ảnh
        image = Image.open(image_path).convert("RGB")
        img_tensor = transform(image).unsqueeze(0).to(device)

        # Dự đoán
        with torch.no_grad():
            outputs = model(img_tensor)
            probs = torch.softmax(outputs, dim=1)
            conf, pred = torch.max(probs, dim=1)

        pred = pred.item()
        conf = conf.item()

        # Danh sách độ ngọt (ví dụ bạn có 3 mức)
        classes = ["Ít ngọt", "Vừa", "Rất ngọt"]

        # Kiểm tra index an toàn
        if pred < 0 or pred >= len(classes):
            return {"error": "Không nhận diện được cam"}

        sweetness = classes[pred]
        return {
            "sweetness": sweetness,
            "confidence": float(conf)
        }

    except Exception as e:
        return {"error": f"Lỗi dự đoán: {str(e)}"}
