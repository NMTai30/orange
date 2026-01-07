import albumentations as A
import cv2
import numpy as np
import torch
from albumentations.pytorch import ToTensorV2

# CONFIG
UNET_IMG_SIZE = 256
VIT_IMG_SIZE = 224
MASK_THRESHOLD = 0.5

device = "cuda" if torch.cuda.is_available() else "cpu"

# TRANSFORM cho U-Net
unet_transform = A.Compose([
    A.Resize(UNET_IMG_SIZE, UNET_IMG_SIZE),
    A.Normalize(mean=(0.5, 0.5, 0.5),
                std=(0.5, 0.5, 0.5)),
    ToTensorV2(),
])

# YOLO: detect TẤT CẢ cam
def yolo_detect_oranges(yolo_model, image_bgr):
    results = yolo_model(image_bgr)[0]

    if results.boxes is None or len(results.boxes) == 0:
        raise ValueError("❌ Không phát hiện object")

    boxes = results.boxes
    names = yolo_model.names

    orange_boxes = []

    h, w = image_bgr.shape[:2]

    for i, cls_id in enumerate(boxes.cls):
        class_name = names[int(cls_id)]
        if class_name.lower() != "orange":
            continue

        xyxy = boxes.xyxy[i].cpu().numpy().reshape(-1)
        x1, y1, x2, y2 = map(int, xyxy)

        # clamp bbox
        x1 = max(0, min(x1, w - 1))
        x2 = max(0, min(x2, w))
        y1 = max(0, min(y1, h - 1))
        y2 = max(0, min(y2, h))

        if x2 <= x1 or y2 <= y1:
            continue

        orange_boxes.append({
            "bbox": (x1, y1, x2, y2),
            "confidence": float(boxes.conf[i]),
        })

    if len(orange_boxes) == 0:
        raise ValueError("❌ Phát hiện object nhưng KHÔNG phải cam")

    return orange_boxes


# UNet: predict mask
def unet_predict_mask(unet_model, image_bgr):
    image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)

    augmented = unet_transform(image=image_rgb)
    x = augmented["image"].unsqueeze(0).to(device)

    with torch.no_grad():
        pred = unet_model(x)
        pred = torch.sigmoid(pred)[0, 0].cpu().numpy()

    mask = (pred > MASK_THRESHOLD).astype(np.uint8)
    return mask


# APPLY MASK
def apply_mask(image_bgr, mask):
    mask_resized = cv2.resize(
        mask,
        (image_bgr.shape[1], image_bgr.shape[0]),
        interpolation=cv2.INTER_NEAREST
    )

    masked = image_bgr.copy()
    masked[mask_resized == 0] = 0
    return masked


# PIPELINE CHÍNH
def process_image(image_path, yolo_model, unet_model):
    image_bgr = cv2.imread(image_path)
    if image_bgr is None:
        raise ValueError("❌ Không đọc được ảnh")

    orange_boxes = yolo_detect_oranges(yolo_model, image_bgr)

    results = []

    for idx, item in enumerate(orange_boxes):
        x1, y1, x2, y2 = item["bbox"]

        # Crop từng quả
        cropped = image_bgr[y1:y2, x1:x2]

        # UNet mask
        mask = unet_predict_mask(unet_model, cropped)

        # Apply mask
        masked = apply_mask(cropped, mask)

        # Resize cho ViT
        vit_input = cv2.resize(masked, (VIT_IMG_SIZE, VIT_IMG_SIZE))

        results.append({
            "id": idx,
            "bbox": item["bbox"],
            "det_confidence": item["confidence"],
            "vit_input": vit_input,
            "cropped": cropped,
            "mask": mask,
            "masked": masked,
        })

    return results


# PREPROCESS cho ViT
def vit_preprocess(image_bgr):
    image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    image_rgb = image_rgb.astype(np.float32) / 255.0

    tensor = torch.from_numpy(image_rgb).permute(2, 0, 1)
    tensor = tensor.unsqueeze(0)

    return tensor.to(device)
