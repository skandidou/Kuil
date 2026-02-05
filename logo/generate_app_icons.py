#!/usr/bin/env python3
"""
Kuil App Icon Generator
Generates all required PNG icons for iOS App Store
Uses pure Pillow - no external dependencies required
"""

import os
import sys
import re
import math

# Add user site-packages to path
sys.path.insert(0, '/Users/skandermabrouk2/Library/Python/3.9/lib/python/site-packages')

from PIL import Image, ImageDraw

# Paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SVG_PATH = os.path.join(SCRIPT_DIR, "kuil-icon.svg")
OUTPUT_DIR = os.path.join(SCRIPT_DIR, "..", "Echoapp", "Echoapp", "Assets.xcassets", "AppIcon.appiconset")

# Kuil brand color
KUIL_VIOLET_RGB = (69, 64, 226)
DARK_BG_RGB = (45, 42, 158)

def parse_svg_path(svg_content):
    """Extract path data from SVG"""
    match = re.search(r'd="([^"]+)"', svg_content)
    if match:
        return match.group(1)
    return None

def parse_path_to_points(path_data, scale=1.0, offset_x=0, offset_y=0):
    """
    Parse SVG path data to list of polygon points
    Handles M, L, C, Z commands (simplified for this specific icon)
    """
    points = []
    current_x, current_y = 0, 0

    # Split path into commands
    commands = re.findall(r'([MLCZ])([^MLCZ]*)', path_data, re.IGNORECASE)

    for cmd, args in commands:
        cmd = cmd.upper()
        numbers = [float(n) for n in re.findall(r'-?\d+\.?\d*', args)]

        if cmd == 'M':  # Move to
            current_x, current_y = numbers[0], numbers[1]
            points.append((current_x * scale + offset_x, current_y * scale + offset_y))

        elif cmd == 'L':  # Line to
            for i in range(0, len(numbers), 2):
                current_x, current_y = numbers[i], numbers[i+1]
                points.append((current_x * scale + offset_x, current_y * scale + offset_y))

        elif cmd == 'C':  # Cubic Bezier - approximate with endpoint
            for i in range(0, len(numbers), 6):
                # For simplicity, use multiple points along the curve
                if i + 5 < len(numbers):
                    x1, y1 = numbers[i], numbers[i+1]
                    x2, y2 = numbers[i+2], numbers[i+3]
                    x3, y3 = numbers[i+4], numbers[i+5]

                    # Add intermediate points for smoother curve
                    for t in [0.25, 0.5, 0.75, 1.0]:
                        # Cubic bezier formula
                        mt = 1 - t
                        bx = mt**3 * current_x + 3*mt**2*t*x1 + 3*mt*t**2*x2 + t**3*x3
                        by = mt**3 * current_y + 3*mt**2*t*y1 + 3*mt*t**2*y2 + t**3*y3
                        points.append((bx * scale + offset_x, by * scale + offset_y))

                    current_x, current_y = x3, y3

        elif cmd == 'H':  # Horizontal line
            for x in numbers:
                current_x = x
                points.append((current_x * scale + offset_x, current_y * scale + offset_y))

        elif cmd == 'V':  # Vertical line
            for y in numbers:
                current_y = y
                points.append((current_x * scale + offset_x, current_y * scale + offset_y))

        elif cmd == 'Z':  # Close path
            if points:
                points.append(points[0])  # Close the polygon

    return points

def create_kuil_icon_image(size=1024, bg_color=KUIL_VIOLET_RGB, icon_color=(255, 255, 255)):
    """
    Create the Kuil icon programmatically
    """
    # Read SVG
    with open(SVG_PATH, 'r') as f:
        svg_content = f.read()

    # Get path data
    path_data = parse_svg_path(svg_content)

    # Original SVG is 1220x1220
    original_size = 1220

    # Calculate padding and scale
    padding_percent = 0.15
    padding = int(size * padding_percent)
    icon_area = size - (2 * padding)
    scale = icon_area / original_size

    # Create image with background
    img = Image.new('RGBA', (size, size), bg_color + (255,))
    draw = ImageDraw.Draw(img)

    # Parse path to points
    points = parse_path_to_points(path_data, scale, padding, padding)

    # Draw filled polygon
    if len(points) >= 3:
        draw.polygon(points, fill=icon_color + (255,))

    return img

def create_tinted_icon(size=1024):
    """Create tinted icon with transparent background"""
    # Read SVG
    with open(SVG_PATH, 'r') as f:
        svg_content = f.read()

    path_data = parse_svg_path(svg_content)
    original_size = 1220
    padding_percent = 0.15
    padding = int(size * padding_percent)
    icon_area = size - (2 * padding)
    scale = icon_area / original_size

    # Create transparent image
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    points = parse_path_to_points(path_data, scale, padding, padding)

    if len(points) >= 3:
        draw.polygon(points, fill=(255, 255, 255, 255))

    return img

def main():
    print("🎨 Kuil App Icon Generator")
    print("=" * 40)

    # Ensure output directory exists
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Generate main icon (light mode)
    print("\n📱 Generating Light Mode icon (1024x1024)...")
    light_icon = create_kuil_icon_image(1024, KUIL_VIOLET_RGB)
    light_path = os.path.join(OUTPUT_DIR, "AppIcon.png")
    light_icon.save(light_path, "PNG")
    print(f"   ✅ Saved: AppIcon.png")

    # Generate dark mode icon
    print("\n🌙 Generating Dark Mode icon (1024x1024)...")
    dark_icon = create_kuil_icon_image(1024, DARK_BG_RGB)
    dark_path = os.path.join(OUTPUT_DIR, "AppIcon-Dark.png")
    dark_icon.save(dark_path, "PNG")
    print(f"   ✅ Saved: AppIcon-Dark.png")

    # Generate tinted icon (iOS 18)
    print("\n🎭 Generating Tinted icon (1024x1024)...")
    tinted_icon = create_tinted_icon(1024)
    tinted_path = os.path.join(OUTPUT_DIR, "AppIcon-Tinted.png")
    tinted_icon.save(tinted_path, "PNG")
    print(f"   ✅ Saved: AppIcon-Tinted.png")

    # Also save a copy in the logo folder
    logo_copy_path = os.path.join(SCRIPT_DIR, "AppIcon-1024.png")
    light_icon.save(logo_copy_path, "PNG")
    print(f"\n📁 Also saved copy: AppIcon-1024.png")

    # Update Contents.json
    contents_json = '''{
  "images" : [
    {
      "filename" : "AppIcon.png",
      "idiom" : "universal",
      "platform" : "ios",
      "size" : "1024x1024"
    },
    {
      "appearances" : [
        {
          "appearance" : "luminosity",
          "value" : "dark"
        }
      ],
      "filename" : "AppIcon-Dark.png",
      "idiom" : "universal",
      "platform" : "ios",
      "size" : "1024x1024"
    },
    {
      "appearances" : [
        {
          "appearance" : "luminosity",
          "value" : "tinted"
        }
      ],
      "filename" : "AppIcon-Tinted.png",
      "idiom" : "universal",
      "platform" : "ios",
      "size" : "1024x1024"
    }
  ],
  "info" : {
    "author" : "xcode",
    "version" : 1
  }
}'''

    contents_path = os.path.join(OUTPUT_DIR, "Contents.json")
    with open(contents_path, 'w') as f:
        f.write(contents_json)
    print(f"\n📄 Updated: Contents.json")

    print("\n" + "=" * 40)
    print("✅ All icons generated successfully!")
    print("\n🚀 Next steps:")
    print("   1. Open Xcode")
    print("   2. Clean Build (Cmd+Shift+K)")
    print("   3. Build & Run (Cmd+R)")
    print("\nYour app icon is ready for the App Store! 🎉")

if __name__ == "__main__":
    main()
