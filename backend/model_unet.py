import torch
import torch.nn as nn
from torchvision import transforms


# UNET LITE
class SepConvBlock(nn.Module):
    def __init__(self, in_c, out_c):
        super().__init__()
        self.depth = nn.Conv2d(in_c, in_c, kernel_size=3, padding=1, groups=in_c, bias=False)
        self.point = nn.Conv2d(in_c, out_c, kernel_size=1, bias=False)
        self.gn = nn.GroupNorm(8, out_c)
        self.relu = nn.ReLU(inplace=True)

    def forward(self, x):
        x = self.depth(x)
        x = self.point(x)
        x = self.gn(x)
        return self.relu(x)

def upsample(in_c, out_c):
    return nn.ConvTranspose2d(in_c, out_c, kernel_size=2, stride=2)

class UNetLite(nn.Module):
    def __init__(self):
        super().__init__()
        self.c1 = SepConvBlock(3, 32)
        self.p1 = nn.MaxPool2d(2)
        self.c2 = SepConvBlock(32, 64)
        self.p2 = nn.MaxPool2d(2)
        self.c3 = SepConvBlock(64, 128)
        self.p3 = nn.MaxPool2d(2)
        self.c4 = SepConvBlock(128, 256)
        self.p4 = nn.MaxPool2d(2)

        self.c5 = SepConvBlock(256, 512)

        self.u4 = upsample(512, 256)
        self.c6 = SepConvBlock(512, 256)
        self.u3 = upsample(256, 128)
        self.c7 = SepConvBlock(256, 128)
        self.u2 = upsample(128, 64)
        self.c8 = SepConvBlock(128, 64)
        self.u1 = upsample(64, 32)
        self.c9 = SepConvBlock(64, 32)

        self.out = nn.Conv2d(32, 1, 1)

    def forward(self, x):
        c1 = self.c1(x); p1 = self.p1(c1)
        c2 = self.c2(p1); p2 = self.p2(c2)
        c3 = self.c3(p2); p3 = self.p3(c3)
        c4 = self.c4(p3); p4 = self.p4(c4)
        bott = self.c5(p4)

        u4 = self.u4(bott)
        u4 = torch.cat([u4, c4], dim=1)
        u4 = self.c6(u4)
        u3 = self.u3(u4)
        u3 = torch.cat([u3, c3], dim=1)
        u3 = self.c7(u3)
        u2 = self.u2(u3)
        u2 = torch.cat([u2, c2], dim=1)
        u2 = self.c8(u2)
        u1 = self.u1(u2)
        u1 = torch.cat([u1, c1], dim=1)
        u1 = self.c9(u1)
        return self.out(u1)


def load_unet(model_path, device):
    model = UNetLite().to(device)
    model.load_state_dict(torch.load(model_path, map_location=device))
    model.eval()
    return model
