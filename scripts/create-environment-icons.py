#!/usr/bin/env python3

"""
Environment Icon Generator
Creates complete environment icon sets from dev original icons with custom colors and optional labels

USAGE:
python3 create-environment-icons.py <environment> <hex_color> [--label <text>] [--no-label]

COLORS:
dev - original color
staging - created with #9b59b6
prod - created with #31572c

EXAMPLES:
python3 create-environment-icons.py test "#ff6b35" --label "TEST"
python3 create-environment-icons.py local "#9b59b6" --label "LOCAL"  
python3 create-environment-icons.py demo "#3498db"
python3 create-environment-icons.py qa "#e67e22" --no-label
python3 create-environment-icons.py test "#ff6b35" --output-dir "./temp-test-icons"

FEATURES:
- Changes background color from cyan to any hex color
- Optionally adds environment labels with shadow style
- Creates complete icon sets (all sizes)
- Preserves original dev icons
- Uses HSV color replacement for precise results
- Professional shadow styling with asymmetric text placement
"""

import os
import sys
from PIL import Image, ImageDraw, ImageFont
import argparse
from pathlib import Path
import colorsys

def hex_to_rgb(hex_color):
    """Convert hex color to RGB tuple"""
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def rgb_to_hsv(r, g, b):
    """Convert RGB to HSV"""
    return colorsys.rgb_to_hsv(r/255.0, g/255.0, b/255.0)

def hsv_to_rgb(h, s, v):
    """Convert HSV to RGB"""
    r, g, b = colorsys.hsv_to_rgb(h, s, v)
    return int(r * 255), int(g * 255), int(b * 255)

def is_cyan_like(pixel):
    """Check if pixel is cyan-like using HSV analysis"""
    r, g, b = pixel[:3]
    
    # Skip very dark or very light pixels
    brightness = (r + g + b) / 3
    if brightness < 50 or brightness > 250:
        return False, 0
    
    # Convert to HSV for better color analysis
    h, s, v = rgb_to_hsv(r, g, b)
    
    # Cyan is around 180 degrees (0.5 in normalized hue)
    # Acceptable range: 160-200 degrees (0.44-0.56 normalized)
    cyan_hue_center = 0.5  # Pure cyan
    hue_distance = min(abs(h - cyan_hue_center), 1.0 - abs(h - cyan_hue_center))
    
    # Must have reasonable saturation and value to be considered cyan
    is_cyan = (hue_distance < 0.08 and  # Within cyan hue range
               s > 0.3 and             # Sufficient saturation
               v > 0.3 and             # Sufficient brightness
               g > r and b > r)        # Green and blue dominate red
    
    # Calculate strength based on how close to ideal cyan it is
    if is_cyan:
        strength = (1.0 - hue_distance * 12.5) * s * v
        return True, min(1.0, strength)
    
    return False, 0

def replace_background_color(image, target_color_rgb):
    """Replace cyan background with target color using HSV analysis"""
    # Convert to RGBA if not already
    if image.mode != 'RGBA':
        image = image.convert('RGBA')
    
    # Create a new image
    new_image = image.copy()
    pixels = new_image.load()
    
    width, height = image.size
    
    # Convert target color to HSV for hue shifting
    target_h, target_s, target_v = rgb_to_hsv(*target_color_rgb)
    
    for y in range(height):
        for x in range(width):
            pixel = pixels[x, y]
            r, g, b, a = pixel
            
            # Skip transparent pixels
            if a < 20:
                continue
            
            # Check if pixel is cyan-like
            is_cyan, cyan_strength = is_cyan_like((r, g, b))
            
            if is_cyan and cyan_strength > 0.1:
                # Convert original to HSV
                orig_h, orig_s, orig_v = rgb_to_hsv(r, g, b)
                
                if cyan_strength > 0.6:
                    # Strong cyan - replace with target color, adjusting brightness proportionally
                    new_h = target_h
                    new_s = target_s
                    
                    # Scale brightness relative to original, but cap it to target's max brightness
                    brightness_factor = 0.8 + (orig_v * 0.4)  # Range: 0.8 to 1.2
                    new_v = target_v * brightness_factor
                    
                else:
                    # Weak cyan (edges) - blend towards target color
                    blend_factor = cyan_strength
                    new_h = orig_h * (1 - blend_factor) + target_h * blend_factor
                    new_s = orig_s * (1 - blend_factor) + target_s * blend_factor
                    
                    # For brightness, blend more conservatively towards target
                    target_brightness_factor = 0.8 + (orig_v * 0.4)
                    target_adjusted_v = target_v * target_brightness_factor
                    new_v = orig_v * (1 - blend_factor) + target_adjusted_v * blend_factor
                
                # Convert back to RGB
                new_r, new_g, new_b = hsv_to_rgb(new_h, new_s, new_v)
                pixels[x, y] = (new_r, new_g, new_b, a)
    
    return new_image

def create_label_font(font_size):
    """Create a bold font for the label"""
    try:
        font_paths = [
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf", 
            "/System/Library/Fonts/Helvetica.ttc",
            "/Windows/Fonts/arial.ttf"
        ]
        
        for font_path in font_paths:
            if os.path.exists(font_path):
                return ImageFont.truetype(font_path, font_size)
        
        return ImageFont.load_default()
    except:
        return ImageFont.load_default()

def add_environment_label(image, label_text):
    """Add environment label with shadow style and asymmetric text placement"""
    width, height = image.size
    
    # Get label specifications for size-4 (extra large) style
    base_font = 12
    base_padding = 3
    base_border = 2
    
    # Scale based on icon size
    scale = width / 128
    
    # Size-4 multiplier (extra large)
    multiplier = 1.6
    
    font_size = max(6, int(base_font * scale * multiplier))
    padding = max(2, int(base_padding * scale * multiplier))
    border_width = max(1, int(base_border * multiplier))
    
    # Create font
    font = create_label_font(font_size)
    
    # Create a drawing context
    draw = ImageDraw.Draw(image)
    
    # Get text dimensions
    text = label_text.upper()
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    # Asymmetric padding - more space on right/bottom
    padding_left = padding 
    padding_top = padding
    padding_right = padding * 2
    padding_bottom = padding * 2
    
    label_width = text_width + padding_left + padding_right
    label_height = text_height + padding_top + padding_bottom
    
    # Calculate margins based on image size
    margin = max(4, width // 20)
    
    # Bottom-right placement with gap
    label_x = width - label_width - margin
    label_y = height - label_height - margin
    
    # Draw shadow first
    shadow_offset = 2
    shadow_rect = [label_x + shadow_offset, label_y + shadow_offset, 
                   label_x + label_width + shadow_offset, label_y + label_height + shadow_offset]
    draw.rectangle(shadow_rect, fill='#666666', outline=None)
    
    # Draw white background rectangle
    background_rect = [label_x, label_y, label_x + label_width, label_y + label_height]
    draw.rectangle(background_rect, fill='white', outline='black', width=border_width)
    
    # Draw text with asymmetric positioning
    text_x = label_x + padding_left
    text_y = label_y + padding_top
    draw.text((text_x, text_y), text, fill='black', font=font)
    
    return image

def process_icon(input_path, output_path, target_color_hex, label_text=None):
    """Process a single icon file"""
    
    target_color_rgb = hex_to_rgb(target_color_hex)
    
    print(f"Processing {os.path.basename(input_path)} -> {os.path.basename(output_path)}")
    if label_text:
        print(f"  Color: {target_color_hex} {target_color_rgb}, Label: {label_text}")
    else:
        print(f"  Color: {target_color_hex} {target_color_rgb}, No label")
    
    try:
        with Image.open(input_path) as img:
            # Convert to RGBA if not already
            if img.mode != 'RGBA':
                img = img.convert('RGBA')
            
            # Step 1: Change background color
            colored_img = replace_background_color(img, target_color_rgb)
            
            # Step 2: Add label if specified
            if label_text:
                labeled_img = add_environment_label(colored_img, label_text)
            else:
                labeled_img = colored_img
            
            # Ensure output directory exists
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            
            # Save the result
            labeled_img.save(output_path, 'PNG')
            print(f"  ✓ Saved {output_path}")
            
    except Exception as e:
        print(f"  ✗ Error processing {input_path}: {e}")
        return False
    
    return True

def validate_hex_color(hex_color):
    """Validate hex color format"""
    hex_color = hex_color.lstrip('#')
    if len(hex_color) != 6:
        return False
    try:
        int(hex_color, 16)
        return True
    except ValueError:
        return False

def main():
    parser = argparse.ArgumentParser(
        description='Create environment icon sets with custom colors and optional labels',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
EXAMPLES:
  python3 create-environment-icons.py test "#ff6b35" --label "TEST"
  python3 create-environment-icons.py local "#9b59b6" --label "LOCAL"
  python3 create-environment-icons.py demo "#3498db"
  python3 create-environment-icons.py qa "#e67e22" --no-label
  python3 create-environment-icons.py test "#ff6b35" --output-dir "/custom/path/icons"

COMMON COLORS:
  Orange:     #ff6b35   Purple:     #9b59b6
  Blue:       #3498db   Teal:       #1abc9c  
  Yellow:     #f39c12   Pink:       #e91e63
  Brown:      #8d6e63   Indigo:     #673ab7
  
OUTPUT:
  Default: public/img/icon/<environment>/
  With label: public/img/icon/<environment>-labeled/
  Custom: --output-dir specifies exact path
        """
    )
    
    parser.add_argument('environment', 
                       help='Environment name (e.g., test, local, demo, qa)')
    parser.add_argument('color', 
                       help='Background color in hex format (e.g., #ff6b35)')
    
    label_group = parser.add_mutually_exclusive_group()
    label_group.add_argument('--label', 
                           help='Add environment label text (e.g., "TEST", "LOCAL")')
    label_group.add_argument('--no-label', action='store_true',
                           help='Explicitly specify no label (default)')
    
    parser.add_argument('--output-dir', 
                       help='Custom output directory (overrides default path logic)')
    
    args = parser.parse_args()
    
    # Validate inputs
    if not validate_hex_color(args.color):
        print(f"Error: Invalid hex color '{args.color}'. Use format #rrggbb (e.g., #ff6b35)")
        sys.exit(1)
    
    # Ensure color starts with #
    target_color = args.color if args.color.startswith('#') else f'#{args.color}'
    
    # Setup paths
    script_dir = Path(__file__).parent
    icon_dir = script_dir.parent / 'public' / 'img' / 'icon'
    dev_dir = icon_dir / 'dev'
    
    # Determine output directory
    if args.output_dir:
        # Use custom output directory
        output_dir = Path(args.output_dir)
        label_text = args.label if args.label else None
    else:
        # Use default path logic
        if args.label:
            output_dir = icon_dir / f"{args.environment}-labeled"
            label_text = args.label
        else:
            output_dir = icon_dir / args.environment
            label_text = None
    
    # Check if dev directory exists
    if not dev_dir.exists():
        print(f"Error: Dev icons directory not found: {dev_dir}")
        print("Make sure you have the original dev icons in public/img/icon/dev/")
        sys.exit(1)
    
    # Get all PNG files in dev directory
    icon_files = list(dev_dir.glob('*.png'))
    if not icon_files:
        print(f"Error: No PNG files found in {dev_dir}")
        sys.exit(1)
    
    print(f"Creating {args.environment} environment icons...")
    print(f"Source: {dev_dir}")
    print(f"Target: {output_dir}")
    print(f"Color: {target_color}")
    print(f"Label: {label_text if label_text else 'None'}")
    print(f"Icons to process: {len(icon_files)}")
    print("-" * 50)
    
    # Process all icons
    success_count = 0
    for icon_file in icon_files:
        output_file = output_dir / icon_file.name
        if process_icon(str(icon_file), str(output_file), target_color, label_text):
            success_count += 1
    
    print("-" * 50)
    print(f"✓ Successfully processed {success_count}/{len(icon_files)} icons")
    print(f"✓ Environment icons saved to: {output_dir}")
    
    if success_count == len(icon_files):
        print(f"\n🎉 Complete! Your {args.environment} environment icons are ready.")
        print(f"\nTo use these icons, update your environment variables:")
        if label_text:
            print(f"  VITE_ICON_PATH={args.environment}-labeled")
        else:
            print(f"  VITE_ICON_PATH={args.environment}")
    else:
        print(f"\n⚠️  Some icons failed to process. Check error messages above.")

if __name__ == '__main__':
    if len(sys.argv) == 1:
        print("Environment Icon Generator")
        print("")
        print("USAGE:")
        print("  python3 create-environment-icons.py <environment> <hex_color> [options]")
        print("")
        print("EXAMPLES:")
        print('  python3 create-environment-icons.py test "#ff6b35" --label "TEST"')
        print('  python3 create-environment-icons.py local "#9b59b6" --label "LOCAL"')
        print('  python3 create-environment-icons.py demo "#3498db"')
        print('  python3 create-environment-icons.py qa "#e67e22" --no-label')
        print('  python3 create-environment-icons.py test "#ff6b35" --output-dir "/custom/path"')
        print("")
        print("For full help: python3 create-environment-icons.py --help")
        sys.exit(1)
    
    main()