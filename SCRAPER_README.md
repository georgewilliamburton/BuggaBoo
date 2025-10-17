# Advanced Web Scraper - Usage Guide

## Features

✅ **Professional Web Scraping:**
- Downloads web pages with proper browser headers
- Follows internal links automatically
- Organizes content by depth level
- Rate limiting (polite to servers)
- Handles redirects, cookies, and compression
- Converts relative URLs to absolute
- Skips already-visited pages

✅ **Smart Link Following:**
- Configurable depth (how many levels deep)
- Max pages limit (prevent runaway scraping)
- Skip external domains (optional)
- Skip images, PDFs, etc.

✅ **Organized Output:**
```
scraped_pages/
├── depth_0/           # Starting page
│   └── index.html
├── depth_1/           # First level links
│   ├── about.html
│   ├── contact.html
│   └── products.html
└── depth_2/           # Second level links
    ├── product1.html
    └── product2.html
```

## Quick Start

### 1. Edit Configuration (lines 18-30 in scraper.php)

```php
$config = [
    'start_url' => 'https://www.example.com',  // Change this!
    'max_depth' => 2,                          // 0 = only start page, 1 = start + first level, etc.
    'max_pages' => 10,                         // Maximum pages to download
    'delay_seconds' => 1,                      // Delay between requests (be polite!)
    'output_dir' => 'scraped_pages',           // Where to save files
    'follow_external' => false,                // Follow links to other domains?
    'verbose' => true,                         // Show progress messages
];
```

### 2. Run the Scraper

```bash
php scraper.php
```

### 3. View Results

Check the `scraped_pages/` directory!

## Configuration Options Explained

### `start_url`
The URL to start scraping from.
- Example: `'https://www.example.com'`
- Example: `'https://github.com/features'`

### `max_depth`
How many levels of links to follow:
- `0` = Only download the starting page
- `1` = Starting page + all linked pages
- `2` = Starting page + first level + second level
- `3+` = Keep going deeper

### `max_pages`
Safety limit - stops after downloading this many pages.
- Prevents accidentally downloading entire websites
- Good starting value: 10-50

### `delay_seconds`
Wait time between requests (in seconds):
- `1` = Wait 1 second between each page
- `2` = Wait 2 seconds (more polite)
- Be respectful! Don't hammer servers.

### `follow_external`
Should we follow links to other domains?
- `false` = Stay on the starting domain only (recommended)
- `true` = Follow all links (can download a LOT!)

## Example Usage Scenarios

### Scenario 1: Download a Single Page
```php
$config = [
    'start_url' => 'https://www.example.com',
    'max_depth' => 0,      // Don't follow any links
    'max_pages' => 1,
];
```

### Scenario 2: Download a Small Website Section
```php
$config = [
    'start_url' => 'https://www.example.com/docs',
    'max_depth' => 2,
    'max_pages' => 20,
    'delay_seconds' => 1,
];
```

### Scenario 3: Archive a Blog
```php
$config = [
    'start_url' => 'https://blog.example.com',
    'max_depth' => 3,
    'max_pages' => 100,
    'delay_seconds' => 2,  // Be extra polite
];
```

## What Gets Downloaded

✅ **Includes:**
- HTML pages
- PHP pages (the generated HTML)
- Text content

❌ **Skips:**
- Images (.jpg, .png, .gif)
- PDFs
- Videos (.mp4)
- Audio files (.mp3)
- CSS/JS files (optional - can be enabled)
- Anchor links (#section)
- JavaScript URLs (javascript:...)
- Email links (mailto:...)

## Output File Naming

URLs are converted to safe filenames:

| Original URL | Saved As |
|--------------|----------|
| `https://example.com/` | `index.html` |
| `https://example.com/about` | `about.html` |
| `https://example.com/products/item1` | `products_item1.html` |
| `https://example.com/blog/2025/01/post` | `blog_2025_01_post.html` |

## Key Scraping Features Explained

### CURL Options Used

```php
CURLOPT_FOLLOWLOCATION   // Follow redirects automatically
CURLOPT_USERAGENT        // Identifies as a real browser (important!)
CURLOPT_ENCODING         // Accepts compressed responses (faster)
CURLOPT_REFERER          // Tells server where we came from
CURLOPT_COOKIEFILE       // Handles cookies/sessions
CURLOPT_TIMEOUT          // Prevents hanging on slow sites
```

### Browser-Like Headers

The scraper sends headers that make it look like a real browser:
- Accept HTML, images, etc.
- Accept compressed responses
- Send language preferences
- Connection keep-alive

### Link Extraction

Uses PHP's DOMDocument to properly parse HTML and extract `<a>` tags:
- Converts relative URLs (`/about`) to absolute (`https://example.com/about`)
- Skips duplicates
- Validates URLs before adding to queue

## Safety Features

1. **Visit Tracking** - Never downloads the same page twice
2. **Max Pages Limit** - Stops after configured number of pages
3. **Depth Limit** - Prevents following links forever
4. **Rate Limiting** - Delays between requests to be polite
5. **External Link Filtering** - Can restrict to one domain
6. **Timeout Protection** - Won't hang on slow servers

## Legal & Ethical Notes

⚠️ **Important:**
- Always check a website's `robots.txt` before scraping
- Respect the site's Terms of Service
- Don't overload servers (use reasonable delays)
- Some sites prohibit scraping
- Be a good internet citizen!

## Troubleshooting

### "Failed to download"
- Check the URL is correct
- Check your internet connection
- The site might be blocking scrapers
- Try increasing the timeout

### "Too many pages downloaded"
- Reduce `max_depth` or `max_pages`
- Set `follow_external` to `false`

### "Slow performance"
- Reduce `delay_seconds` (but be polite!)
- Reduce `max_depth`

## Advanced Modifications

Want to customize? Here's where to look:

- **Line 141**: Change curl options (add headers, etc.)
- **Line 206**: Modify link extraction logic
- **Line 284**: Change file naming convention
- **Line 252**: Modify which links to follow

## Need Help?

Check the inline comments in `scraper.php` - every function is documented!

---

**Created:** October 10, 2025
**Based on:** readexternal.php from File I/O project
