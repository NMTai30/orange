import albumentations as A
import cv2
import numpy as np
import torch
from albumentations.pytorch import ToTensorV2

UNET_IMG_SIZE = 256
VIT_IMG_SIZE = 224
MASK_THRESHOLD = 0.5

device = "cuda" if torch.cuda.is_available() else "cpu"

# TRANSFORM cho UNet
unet_transform = A.Compose([
    A.Resize(UNET_IMG_SIZE, UNET_IMG_SIZE),
    A.Normalize(mean=(0.5, 0.5, 0.5),
                std=(0.5, 0.5, 0.5)),
    ToTensorV2(),
])

def yolo_crop_best_orange(yolo_model, image_bgr):
    results = yolo_model(image_bgr)[0]

    if results.boxes is None or len(results.boxes) == 0:
        raise ValueError("❌ Không phát hiện object")

    boxes = results.boxes
    names = yolo_model.names

    orange_indices = []

    for i, cls_id in enumerate(boxes.cls):
        if names[int(cls_id)].lower() == "orange":
            orange_indices.append(i)

    if len(orange_indices) == 0:
        raise ValueError("❌ Phát hiện object nhưng KHÔNG phải cam")

    best_idx = max(orange_indices, key=lambda i: float(boxes.conf[i]))

    x1, y1, x2, y2 = boxes.xyxy[best_idx].cpu().numpy().astype(int)
    h, w = image_bgr.shape[:2]

    x1 = max(0, min(x1, w - 1))
    x2 = max(0, min(x2, w))
    y1 = max(0, min(y1, h - 1))
    y2 = max(0, min(y2, h))

    if x2 <= x1 or y2 <= y1:
        raise ValueError("❌ Bounding box không hợp lệ")

    return image_bgr[y1:y2, x1:x2]

# UNET MASK
def unet_predict_mask(unet_model, image_bgr):
    image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    augmented = unet_transform(image=image_rgb)
    x = augmented["image"].unsqueeze(0).to(device)

    with torch.no_grad():
        pred = torch.sigmoid(unet_model(x))[0, 0].cpu().numpy()

    return (pred > MASK_THRESHOLD).astype(np.uint8)

# APPLY MASK
def apply_mask(image_bgr, mask):
    mask = cv2.resize(mask, (image_bgr.shape[1], image_bgr.shape[0]))
    out = image_bgr.copy()
    out[mask == 0] = 0
    return out

# PIPELINE CHÍNH
def process_image(image_path, yolo_model, unet_model):
    image_bgr = cv2.imread(image_path)
    if image_bgr is None:
        raise ValueError("❌ Không đọc được ảnh")

    cropped = yolo_crop_best_orange(yolo_model, image_bgr)
    mask = unet_predict_mask(unet_model, cropped)
    masked = apply_mask(cropped, mask)

    vit_input = cv2.resize(masked, (VIT_IMG_SIZE, VIT_IMG_SIZE))

    return vit_input

# PREPROCESS cho ViT
def vit_preprocess(image_bgr):
    image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    image_rgb = image_rgb.astype(np.float32) / 255.0
    tensor = torch.from_numpy(image_rgb).permute(2, 0, 1).unsqueeze(0)
    return tensor.to(device)
