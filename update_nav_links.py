#!/usr/bin/env python3
"""
Script to update educational-games.html with corrected paths
"""
import re

filepath = r"c:\Users\fatte\NBCC\fall2025\PHP\transcript\fileIO2025-addedscraper\BuggaBoo\educational-games.html"

# Read the file
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# URL mapping: old URL -> new relative path
url_map = {
    # Stage 1 (redirect pages, leave as is or update to depth_2)
    'https://owlieboo.com/juegos-educativos/animals/': 'depth_1/juegos-educativos_animals.html',
    'https://owlieboo.com/juegos-educativos/marine/': 'depth_1/juegos-educativos_marine.html',
    'https://owlieboo.com/juegos-educativos/jungle/': 'depth_1/juegos-educativos_jungle.html',
    'https://owlieboo.com/juegos-educativos/dogs/': 'depth_1/educational-games_dogs.html',
    'https://owlieboo.com/juegos-educativos/leaps/': 'depth_1/juegos-educativos_leaps.html',
    'https://owlieboo.com/juegos-educativos/egg/': 'depth_1/juegos-educativos_egg.html',
    'https://owlieboo.com/juegos-educativos/flying/': 'depth_1/juegos-educativos_flying.html',
    'https://owlieboo.com/juegos-educativos/shell/': 'depth_1/juegos-educativos_shell.html',
    'https://owlieboo.com/juegos-educativos/monkeys/': 'depth_1/juegos-educativos_monkeys.html',
    'https://owlieboo.com/juegos-educativos/hidden/': 'depth_1/juegos-educativos_hidden.html',
    'https://owlieboo.com/juegos-educativos/dolphin/': 'depth_1/juegos-educativos_dolphin.html',
    'https://owlieboo.com/juegos-educativos/frog/': 'depth_1/juegos-educativos_frog.html',
    
    # Stage 2
    'https://owlieboo.com/educational-games/tree/': 'depth_1/educational-games_tree.html',
    'https://owlieboo.com/educational-games/deep/': 'depth_1/educational-games_deep.html',
    'https://owlieboo.com/educational-games/bugs/': 'depth_1/educational-games_bugs.html',
    'https://owlieboo.com/educational-games/farm/': 'depth_1/educational-games_farm.html',
    'https://owlieboo.com/educational-games/nocturnal/': 'depth_1/educational-games_nocturnal.html',
    'https://owlieboo.com/educational-games/bananas/': 'depth_1/educational-games_bananas.html',
    'https://owlieboo.com/educational-games/birds/': 'depth_1/educational-games_birds.html',
    'https://owlieboo.com/educational-games/bubbles/': 'depth_1/educational-games_bubbles.html',
    'https://owlieboo.com/educational-games/flowers/': 'depth_1/educational-games_flowers.html',
    'https://owlieboo.com/educational-games/hummingbird/': 'depth_1/educational-games_hummingbird.html',
    'https://owlieboo.com/educational-games/kids/': 'depth_1/educational-games_kids.html',
    'https://owlieboo.com/educational-games/forms/': 'depth_1/educational-games_forms.html',
    
    # Stage 3
    'https://owlieboo.com/educational-games/music/': 'depth_1/educational-games_music.html',
    'https://owlieboo.com/educational-games/tooneame/': 'depth_1/educational-games_tooneame.html',
    'https://owlieboo.com/educational-games/houses/': 'depth_1/educational-games_houses.html',
    'https://owlieboo.com/educational-games/puzzles/': 'depth_1/educational-games_puzzles.html',
    'https://owlieboo.com/educational-games/released/': 'depth_1/educational-games_released.html',
    'https://owlieboo.com/educational-games/colors/': 'depth_1/educational-games_colors.html',
    'https://owlieboo.com/educational-games/numbers/': 'depth_1/educational-games_numbers.html',
    'https://owlieboo.com/educational-games/points/': 'depth_1/educational-games_points.html',
    'https://owlieboo.com/educational-games/jungle/': 'depth_1/educational-games_jungle.html',
}

# Replace all URLs
for old_url, new_path in url_map.items():
    # Replace in href attributes
    content = content.replace(f'href={old_url}', f'href="{new_path}"')
    content = content.replace(f'href="{old_url}"', f'href="{new_path}"')

print(f"Updated {len(url_map)} URL patterns")

# Write back
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"✓ Updated {filepath}")
