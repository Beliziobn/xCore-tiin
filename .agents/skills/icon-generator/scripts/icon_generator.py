#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

try:
    from PIL import Image, ImageDraw
except ImportError:
    print("缺少依赖 Pillow，请先执行: python3 -m pip install -r requirements.txt", file=sys.stderr)
    sys.exit(1)


ANDROID_ICONS = [
    ("mipmap-mdpi", 48),
    ("mipmap-hdpi", 72),
    ("mipmap-xhdpi", 96),
    ("custom-128", 128),
    ("mipmap-xxhdpi", 144),
    ("mipmap-xxxhdpi", 192),
    ("custom-216", 216),
    ("play-store", 512),
    ("custom-1024", 1024)
]

ANDROID_ADAPTIVE_ICONS = [
    ("mipmap-mdpi", 108),
    ("mipmap-hdpi", 162),
    ("mipmap-xhdpi", 216),
    ("mipmap-xxhdpi", 324),
    ("mipmap-xxxhdpi", 432),
]

IOS_ICONS = [
    ("iphone-notification-20@2x.png", "iphone", "20x20", "2x", 40),
    ("iphone-notification-20@3x.png", "iphone", "20x20", "3x", 60),
    ("iphone-settings-29@2x.png", "iphone", "29x29", "2x", 58),
    ("iphone-settings-29@3x.png", "iphone", "29x29", "3x", 87),
    ("iphone-spotlight-40@2x.png", "iphone", "40x40", "2x", 80),
    ("iphone-spotlight-40@3x.png", "iphone", "40x40", "3x", 120),
    ("iphone-app-60@2x.png", "iphone", "60x60", "2x", 120),
    ("iphone-app-60@3x.png", "iphone", "60x60", "3x", 180),
    ("ipad-notification-20@1x.png", "ipad", "20x20", "1x", 20),
    ("ipad-notification-20@2x.png", "ipad", "20x20", "2x", 40),
    ("ipad-settings-29@1x.png", "ipad", "29x29", "1x", 29),
    ("ipad-settings-29@2x.png", "ipad", "29x29", "2x", 58),
    ("ipad-spotlight-40@1x.png", "ipad", "40x40", "1x", 40),
    ("ipad-spotlight-40@2x.png", "ipad", "40x40", "2x", 80),
    ("ipad-app-76@1x.png", "ipad", "76x76", "1x", 76),
    ("ipad-app-76@2x.png", "ipad", "76x76", "2x", 152),
    ("ipad-pro-app-83.5@2x.png", "ipad", "83.5x83.5", "2x", 167),
    ("ios-marketing-1024@1x.png", "ios-marketing", "1024x1024", "1x", 1024),
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="根据一张源图片生成 Android 和 iOS 常用应用图标。"
    )
    parser.add_argument("input", type=Path, help="输入图片路径")
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        default=Path("output_icons"),
        help="输出目录，默认: output_icons",
    )
    parser.add_argument(
        "--name",
        default="ic_launcher.png",
        help="Android 图标文件名，默认: ic_launcher.png",
    )
    parser.add_argument(
        "--mode",
        choices=("contain", "cover"),
        default="contain",
        help="图片适配模式: contain 补边, cover 居中裁切。默认: contain",
    )
    parser.add_argument(
        "--background",
        default="#00000000",
        help="补边背景色，支持 #RRGGBB 或 #RRGGBBAA，默认透明",
    )
    parser.add_argument(
        "--extra-sizes",
        type=int,
        nargs="*",
        default=[],
        help="额外导出的正方形尺寸，例如: --extra-sizes 128 216 256",
    )
    parser.add_argument(
        "--corner-radius",
        type=float,
        default=0,
        help="圆角百分比，范围 0-50，按图标边长百分比计算，例如 18",
    )
    parser.add_argument(
        "--android-adaptive",
        action="store_true",
        help="额外生成 Android Adaptive Icon 的前景图、背景图和 XML",
    )
    parser.add_argument(
        "--adaptive-background",
        default="#FFFFFFFF",
        help="Android Adaptive Icon 背景色，默认白色",
    )
    return parser.parse_args()


def parse_color(value: str) -> tuple[int, int, int, int]:
    hex_value = value.strip().lstrip("#")
    if len(hex_value) == 6:
        hex_value += "FF"
    if len(hex_value) != 8:
        raise ValueError(f"无法解析颜色: {value}")
    return tuple(int(hex_value[index:index + 2], 16) for index in range(0, 8, 2))


def fit_image(image: Image.Image, size: int, mode: str, background: tuple[int, int, int, int]) -> Image.Image:
    src = image.convert("RGBA")
    src_w, src_h = src.size

    if src_w == src_h:
        return src.resize((size, size), Image.Resampling.LANCZOS)

    if mode == "contain":
        ratio = min(size / src_w, size / src_h)
        resized = src.resize((round(src_w * ratio), round(src_h * ratio)), Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA", (size, size), background)
        offset = ((size - resized.width) // 2, (size - resized.height) // 2)
        canvas.paste(resized, offset, resized)
        return canvas

    ratio = max(size / src_w, size / src_h)
    resized = src.resize((round(src_w * ratio), round(src_h * ratio)), Image.Resampling.LANCZOS)
    left = (resized.width - size) // 2
    top = (resized.height - size) // 2
    return resized.crop((left, top, left + size, top + size))


def save_png(image: Image.Image, output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    image.save(output_path, format="PNG")


def validate_sizes(sizes: list[int]) -> list[int]:
    valid_sizes: list[int] = []
    for size in sizes:
        if size <= 0:
            raise ValueError(f"尺寸必须大于 0: {size}")
        valid_sizes.append(size)
    return valid_sizes


def validate_corner_radius(value: float) -> float:
    if value < 0 or value > 50:
        raise ValueError(f"圆角百分比必须在 0 到 50 之间: {value}")
    return value


def apply_corner_radius(image: Image.Image, corner_radius_percent: float) -> Image.Image:
    if corner_radius_percent == 0:
        return image

    rounded = image.copy()
    radius = round(image.width * (corner_radius_percent / 100))
    mask = Image.new("L", image.size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((0, 0, image.width, image.height), radius=radius, fill=255)
    rounded.putalpha(mask)
    return rounded


def generate_android_icons(
    image: Image.Image,
    output_dir: Path,
    file_name: str,
    mode: str,
    background: tuple[int, int, int, int],
    extra_sizes: list[int],
    corner_radius_percent: float,
) -> None:
    android_root = output_dir / "android"
    for folder, size in ANDROID_ICONS:
        icon = fit_image(image, size, mode, background)
        icon = apply_corner_radius(icon, corner_radius_percent)
        if folder == "play-store":
            target = android_root / folder / "play_store_icon.png"
        else:
            target = android_root / folder / file_name
        save_png(icon, target)

    for size in extra_sizes:
        icon = fit_image(image, size, mode, background)
        icon = apply_corner_radius(icon, corner_radius_percent)
        target = android_root / "extra" / f"{size}x{size}.png"
        save_png(icon, target)


def write_text_file(output_path: Path, content: str) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(content, encoding="utf-8")


def generate_android_adaptive_icons(
    image: Image.Image,
    output_dir: Path,
    mode: str,
    adaptive_background: tuple[int, int, int, int],
) -> None:
    android_root = output_dir / "android"
    foreground_name = "ic_launcher_foreground.png"
    background_name = "ic_launcher_background.png"

    for folder, size in ANDROID_ADAPTIVE_ICONS:
        foreground = fit_image(image, size, mode, (0, 0, 0, 0))
        background = Image.new("RGBA", (size, size), adaptive_background)
        save_png(foreground, android_root / folder / foreground_name)
        save_png(background, android_root / folder / background_name)

    xml = """<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
"""
    write_text_file(android_root / "mipmap-anydpi-v26" / "ic_launcher.xml", xml)
    write_text_file(android_root / "mipmap-anydpi-v26" / "ic_launcher_round.xml", xml)


def generate_ios_icons(
    image: Image.Image,
    output_dir: Path,
    mode: str,
    background: tuple[int, int, int, int],
    extra_sizes: list[int],
    corner_radius_percent: float,
) -> None:
    ios_root = output_dir / "ios" / "AppIcon.appiconset"
    contents = {"images": [], "info": {"author": "xcode", "version": 1}}

    for filename, idiom, size_label, scale, size in IOS_ICONS:
        icon = fit_image(image, size, mode, background)
        icon = apply_corner_radius(icon, corner_radius_percent)
        save_png(icon, ios_root / filename)
        contents["images"].append(
            {
                "filename": filename,
                "idiom": idiom,
                "scale": scale,
                "size": size_label,
            }
        )

    for size in extra_sizes:
        filename = f"extra-{size}x{size}.png"
        icon = fit_image(image, size, mode, background)
        icon = apply_corner_radius(icon, corner_radius_percent)
        save_png(icon, ios_root / filename)

    contents_path = ios_root / "Contents.json"
    contents_path.write_text(json.dumps(contents, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def main() -> int:
    args = parse_args()

    if not args.input.exists():
        print(f"输入文件不存在: {args.input}", file=sys.stderr)
        return 1

    try:
        background = parse_color(args.background)
    except ValueError as error:
        print(str(error), file=sys.stderr)
        return 1

    try:
        adaptive_background = parse_color(args.adaptive_background)
    except ValueError as error:
        print(str(error), file=sys.stderr)
        return 1

    try:
        extra_sizes = validate_sizes(args.extra_sizes)
    except ValueError as error:
        print(str(error), file=sys.stderr)
        return 1

    try:
        corner_radius_percent = validate_corner_radius(args.corner_radius)
    except ValueError as error:
        print(str(error), file=sys.stderr)
        return 1

    image = Image.open(args.input)
    generate_android_icons(
        image,
        args.output,
        args.name,
        args.mode,
        background,
        extra_sizes,
        corner_radius_percent,
    )
    generate_ios_icons(
        image,
        args.output,
        args.mode,
        background,
        extra_sizes,
        corner_radius_percent,
    )
    if args.android_adaptive:
        generate_android_adaptive_icons(image, args.output, args.mode, adaptive_background)

    print(f"图标已生成到: {args.output.resolve()}")
    print("Android 目录: android/")
    print("iOS 目录: ios/AppIcon.appiconset/")
    if args.android_adaptive:
        print("已额外生成 Android Adaptive Icon 资源")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
