#!/usr/bin/env python3
"""
Script to clean up game HTML files - removes all site chrome and keeps only the game iframe
"""
import os
import re
from pathlib import Path

# Base directory
BASE_DIR = Path(r"c:\Users\fatte\NBCC\fall2025\PHP\transcript\fileIO2025-addedscraper\BuggaBoo")

# Game template - clean iframe-only version
GAME_TEMPLATE = '''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{title}</title>
  <style>
    html, body {{ height: 100%; margin: 0; }}
    body {{
      display: grid;
      place-items: center;
      background: #111;
      color: #fff;
      font-family: system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji";
    }}
    .game-wrapper {{
      width: min(100vw, 1000px);
      aspect-ratio: 16/9;
      position: relative;
      background: #000;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0,0,0,.4);
    }}
    .game-wrapper iframe {{
      position: absolute; inset: 0; width: 100%; height: 100%; border: 0;
    }}
    .hint {{ position: fixed; bottom: 10px; left: 50%; transform: translateX(-50%); font-size: 12px; opacity: .7; }}
  </style>
</head>
<body>
  <div class="game-wrapper">
    <iframe id="juego" src="{iframe_src}" allowfullscreen scrolling="no"></iframe>
  </div>
  <div class="hint">Tip: click/tap the game area if input doesn't register right away.</div>
  <script>
    function focusGame(){{
      var f = document.getElementById('juego');
      try {{ f && f.contentWindow && f.contentWindow.focus && f.contentWindow.focus(); }} catch(e){{}}
      try {{ f && f.focus && f.focus(); }} catch(e){{}}
    }}
    window.addEventListener('load', ()=>{{ setTimeout(focusGame, 150); }});
    window.addEventListener('click', (e)=>{{ if (e.target.tagName !== 'IFRAME') focusGame(); }});
  </script>
</body>
</html>
'''

def extract_iframe_src(html_content):
    """Extract the iframe src from the HTML content"""
    # Look for iframe with src containing 'juegos' or similar game paths
    patterns = [
        r'<iframe[^>]*src=["\']([^"\']*juegos[^"\']*)["\']',
        r'<iframe[^>]*src=([^\s>]*juegos[^\s>]*)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, html_content, re.IGNORECASE)
        if match:
            return match.group(1)
    
    return None

def extract_title_from_filename(filename):
    """Extract a clean title from the filename"""
    # Remove file extension
    name = filename.replace('.html', '')
    
    # Handle patterns like 'educational-games_bananas'
    if '_' in name:
        name = name.split('_')[-1]
    
    # Capitalize and format
    return name.replace('-', ' ').title() + ' - Game'

def process_game_file(filepath):
    """Process a single game file"""
    print(f"Processing: {filepath.name}")
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Extract iframe src
        iframe_src = extract_iframe_src(content)
        
        if not iframe_src:
            print(f"  ⚠ No iframe found, skipping")
            return False
        
        # Extract title
        title = extract_title_from_filename(filepath.name)
        
        # Generate new content
        new_content = GAME_TEMPLATE.format(
            title=title,
            iframe_src=iframe_src
        )
        
        # Write back
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        print(f"  ✓ Updated with iframe: {iframe_src[:60]}...")
        return True
    
    except Exception as e:
        print(f"  ✗ Error: {e}")
        return False

def main():
    """Main processing function"""
    # Process depth_1 files
    depth1_dir = BASE_DIR / "depth_1"
    
    if not depth1_dir.exists():
        print(f"Error: {depth1_dir} not found")
        return
    
    # Get all HTML files that look like game files
    game_patterns = [
        'educational-games_*.html',
        'juegos-educativos_*.html',
    ]
    
    files_processed = 0
    files_skipped = 0
    
    for pattern in game_patterns:
        for filepath in depth1_dir.glob(pattern):
            # Skip files we don't want to process
            if 'gameonly' in filepath.name:
                continue
            if filepath.name in ['index.html', 'educational-videos_play-list-1.html']:
                continue
            
            if process_game_file(filepath):
                files_processed += 1
            else:
                files_skipped += 1
    
    print(f"\n{'='*60}")
    print(f"Processing complete!")
    print(f"  Files processed: {files_processed}")
    print(f"  Files skipped: {files_skipped}")
    print(f"{'='*60}")

if __name__ == "__main__":
    main()
