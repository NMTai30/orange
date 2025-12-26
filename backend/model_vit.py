import timm
import torch
import torch.nn as nn


class OrangeViT(nn.Module):
    def __init__(self, num_classes=100):
        super().__init__()
        self.backbone = timm.create_model(
            "vit_tiny_patch16_224",
            pretrained=False,
            num_classes=num_classes
        )

    def forward(self, x):
        return self.backbone(x)


def load_vit(model_path, device):
    model = OrangeViT(num_classes=100)

    state_dict = torch.load(model_path, map_location=device)
    model.load_state_dict(state_dict)   # KHÔNG strict=False

    model.to(device)
    model.eval()
    return model
