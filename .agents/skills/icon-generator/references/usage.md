# Icon Generator Reference

## Script

Run:

```bash
python3 scripts/icon_generator.py INPUT -o OUTPUT_DIR
```

Dependency:

```bash
python3 -m pip install 'Pillow>=10.0.0'
```

## Arguments

- `input`: source image path
- `-o`, `--output`: output directory, default `output_icons`
- `--name`: Android icon filename, default `ic_launcher.png`
- `--mode`: `contain` or `cover`, default `contain`
- `--background`: padding color for `contain`, `#RRGGBB` or `#RRGGBBAA`
- `--extra-sizes`: extra square PNG sizes, for example `128 216 256`
- `--corner-radius`: rounded-corner percentage from `0` to `50`
- `--android-adaptive`: also generate adaptive icon foreground/background/XML
- `--adaptive-background`: adaptive icon background color, default white

## Built-In Android Sizes

- `mipmap-mdpi`: `48`
- `mipmap-hdpi`: `72`
- `mipmap-xhdpi`: `96`
- `custom-128`: `128`
- `mipmap-xxhdpi`: `144`
- `mipmap-xxxhdpi`: `192`
- `custom-216`: `216`
- `play-store`: `512`
- `custom-1024`: `1024`

## Built-In Android Adaptive Sizes

- `mipmap-mdpi`: `108`
- `mipmap-hdpi`: `162`
- `mipmap-xhdpi`: `216`
- `mipmap-xxhdpi`: `324`
- `mipmap-xxxhdpi`: `432`

## Built-In iOS Outputs

The script writes PNGs into `ios/AppIcon.appiconset/` and generates `Contents.json` for:

- iPhone notification, settings, spotlight, and app icons
- iPad notification, settings, spotlight, app, and iPad Pro icons
- App Store marketing icon at `1024x1024`

## Output Layout

Default export:

```text
OUTPUT_DIR/
  android/
    mipmap-*/
    custom-128/
    custom-216/
    custom-1024/
    play-store/
    extra/                # only when --extra-sizes is used
  ios/
    AppIcon.appiconset/
      *.png
      Contents.json
```

Adaptive export adds:

```text
android/
  mipmap-*/ic_launcher_foreground.png
  mipmap-*/ic_launcher_background.png
  mipmap-anydpi-v26/ic_launcher.xml
  mipmap-anydpi-v26/ic_launcher_round.xml
```

## Decision Hints

- Prefer `contain` for logos, marks, and artwork that must not be cropped.
- Prefer `cover` when edge-to-edge composition matters more than preserving every pixel.
- Apply `--corner-radius` only when the user wants raster files with permanent rounded corners.
- Skip `--android-adaptive` unless the user explicitly needs Android adaptive icon resources.
