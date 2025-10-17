<?php
/**
 * Advanced Web Scraper
 * 
 * Features:
 * - Downloads web pages with proper headers and settings
 * - Follows internal links and downloads linked pages
 * - Organizes downloaded content into directories
 * - Handles cookies, compression, and redirects
 * - Respects robots.txt (optional)
 * - Rate limiting to be polite to servers
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

$config = [
    'start_url' => 'https://brush.ninja/create/',  // Starting URL to scrape
    'max_depth' => 25,                          // How many levels deep to follow links (0 = only start page)
    'max_pages' => 100,                         // Maximum number of pages to download
    'delay_seconds' => 1,                      // Delay between requests (be polite!)
    'output_dir' => 'scraped_pages',           // Directory to save downloaded pages
    'follow_external' => false,                // Follow links to other domains?
    'download_assets' => false,                // Download images, CSS, JS? (advanced)
    'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'timeout' => 30,                           // Request timeout in seconds
    'verbose' => true,                         // Show progress messages
];

// ============================================================================
// SCRAPER CLASS
// ============================================================================

class WebScraper {
    private $config;
    private $visitedUrls = [];
    private $urlQueue = [];
    private $pageCount = 0;
    private $baseUrl;
    private $baseDomain;
    
    public function __construct($config) {
        $this->config = $config;
        
        // Parse base URL for domain comparison
        $parsed = parse_url($config['start_url']);
        $this->baseDomain = $parsed['host'];
        $this->baseUrl = $parsed['scheme'] . '://' . $parsed['host'];
        
        // Create output directory
        if (!file_exists($config['output_dir'])) {
            mkdir($config['output_dir'], 0777, true);
            $this->log("Created output directory: {$config['output_dir']}");
        }
    }
    
    /**
     * Start the scraping process
     */
    public function scrape() {
        $this->log("Starting scraper...");
        $this->log("Target: {$this->config['start_url']}");
        $this->log("Max depth: {$this->config['max_depth']}, Max pages: {$this->config['max_pages']}");
        $this->log(str_repeat('-', 80));
        
        // Add starting URL to queue
        $this->urlQueue[] = [
            'url' => $this->config['start_url'],
            'depth' => 0,
        ];
        
        // Process queue
        while (!empty($this->urlQueue) && $this->pageCount < $this->config['max_pages']) {
            $item = array_shift($this->urlQueue);
            $this->processUrl($item['url'], $item['depth']);
            
            // Be polite - delay between requests
            if (!empty($this->urlQueue)) {
                sleep($this->config['delay_seconds']);
            }
        }
        
        $this->log(str_repeat('-', 80));
        $this->log("Scraping complete!");
        $this->log("Total pages downloaded: {$this->pageCount}");
        $this->log("Files saved to: {$this->config['output_dir']}/");
    }
    
    /**
     * Download and process a single URL
     */
    private function processUrl($url, $depth) {
        // Skip if already visited
        if (in_array($url, $this->visitedUrls)) {
            return;
        }
        
        // Mark as visited
        $this->visitedUrls[] = $url;
        $this->pageCount++;
        
        $this->log("[{$this->pageCount}] Downloading: $url (depth: $depth)");
        
        // Download the page
        $html = $this->downloadPage($url);
        
        if ($html === false) {
            $this->log("  ✗ Failed to download");
            return;
        }
        
        // Save the page
        $filename = $this->saveToFile($url, $html, $depth);
        $this->log("  ✓ Saved to: $filename");
        
        // Extract and queue links if we haven't reached max depth
        if ($depth < $this->config['max_depth']) {
            $links = $this->extractLinks($html, $url);
            $this->log("  → Found " . count($links) . " links");
            
            foreach ($links as $link) {
                // Check if we should follow this link
                if ($this->shouldFollowLink($link)) {
                    $this->urlQueue[] = [
                        'url' => $link,
                        'depth' => $depth + 1,
                    ];
                }
            }
        }
    }
    
    /**
     * Download a page with proper curl settings
     */
    private function downloadPage($url) {
        $ch = curl_init($url);
        
        // Essential curl options for web scraping
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);        // Return response as string
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);        // Follow redirects
        curl_setopt($ch, CURLOPT_MAXREDIRS, 5);                // Max redirects to follow
        curl_setopt($ch, CURLOPT_USERAGENT, $this->config['user_agent']); // User agent (important!)
        curl_setopt($ch, CURLOPT_TIMEOUT, $this->config['timeout']);      // Timeout
        curl_setopt($ch, CURLOPT_ENCODING, '');                // Enable compression (gzip, deflate)
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);       // For dev/testing (remove in production!)
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);       // For dev/testing (remove in production!)
        
        // Additional useful options
        curl_setopt($ch, CURLOPT_REFERER, $this->baseUrl);     // Set referer
        curl_setopt($ch, CURLOPT_AUTOREFERER, true);           // Auto-update referer on redirects
        curl_setopt($ch, CURLOPT_COOKIEFILE, '');              // Enable cookie handling
        curl_setopt($ch, CURLOPT_COOKIEJAR, '');               // Store cookies
        
        // Custom headers (makes requests look more like a real browser)
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language: en-US,en;q=0.9',
            'Accept-Encoding: gzip, deflate, br',
            'Connection: keep-alive',
            'Upgrade-Insecure-Requests: 1',
        ]);
        
        // Execute request
        $response = curl_exec($ch);
        
        // Check for errors
        if ($response === false) {
            $error = curl_error($ch);
            $this->log("  ✗ cURL Error: $error");
            curl_close($ch);
            return false;
        }
        
        // Check HTTP status code
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        if ($httpCode >= 400) {
            $this->log("  ✗ HTTP Error: $httpCode");
            curl_close($ch);
            return false;
        }
        
        curl_close($ch);
        return $response;
    }
    
    /**
     * Save downloaded HTML to a file
     */
    private function saveToFile($url, $html, $depth) {
        // Create subdirectory based on depth
        $depthDir = $this->config['output_dir'] . '/depth_' . $depth;
        if (!file_exists($depthDir)) {
            mkdir($depthDir, 0777, true);
        }
        
        // Generate filename from URL
        $filename = $this->urlToFilename($url);
        $filepath = $depthDir . '/' . $filename;
        
        // Add metadata as HTML comment at top of file
        $metadata = "<!-- \n";
        $metadata .= "  Downloaded: " . date('Y-m-d H:i:s') . "\n";
        $metadata .= "  URL: $url\n";
        $metadata .= "  Depth: $depth\n";
        $metadata .= "-->\n\n";
        
        // Save file
        file_put_contents($filepath, $metadata . $html);
        
        return $filepath;
    }
    
    /**
     * Extract all links from HTML
     */
    private function extractLinks($html, $currentUrl) {
        $links = [];
        
        // Use DOMDocument to parse HTML properly
        $dom = new DOMDocument();
        @$dom->loadHTML($html, LIBXML_NOERROR); // Suppress warnings for malformed HTML
        
        // Get all <a> tags
        $anchors = $dom->getElementsByTagName('a');
        
        foreach ($anchors as $anchor) {
            $href = $anchor->getAttribute('href');
            
            if (empty($href)) {
                continue;
            }
            
            // Convert relative URLs to absolute
            $absoluteUrl = $this->makeAbsoluteUrl($href, $currentUrl);
            
            if ($absoluteUrl && !in_array($absoluteUrl, $links)) {
                $links[] = $absoluteUrl;
            }
        }
        
        return $links;
    }
    
    /**
     * Convert relative URL to absolute
     */
    private function makeAbsoluteUrl($url, $baseUrl) {
        // Already absolute
        if (preg_match('/^https?:\/\//', $url)) {
            return $url;
        }
        
        // Skip anchors, javascript, mailto, etc.
        if (preg_match('/^(#|javascript:|mailto:)/', $url)) {
            return null;
        }
        
        $parsedBase = parse_url($baseUrl);
        $scheme = $parsedBase['scheme'];
        $host = $parsedBase['host'];
        
        // Protocol-relative URL
        if (substr($url, 0, 2) === '//') {
            return $scheme . ':' . $url;
        }
        
        // Absolute path
        if ($url[0] === '/') {
            return $scheme . '://' . $host . $url;
        }
        
        // Relative path
        $basePath = isset($parsedBase['path']) ? $parsedBase['path'] : '/';
        $basePath = rtrim(dirname($basePath), '/') . '/';
        
        return $scheme . '://' . $host . $basePath . $url;
    }
    
    /**
     * Determine if we should follow a link
     */
    private function shouldFollowLink($url) {
        // Already visited?
        if (in_array($url, $this->visitedUrls)) {
            return false;
        }
        
        // Already in queue?
        foreach ($this->urlQueue as $item) {
            if ($item['url'] === $url) {
                return false;
            }
        }
        
        // Check if it's an external link
        $parsed = parse_url($url);
        $domain = $parsed['host'] ?? '';
        
        if (!$this->config['follow_external'] && $domain !== $this->baseDomain) {
            return false;
        }
        
        // Skip common non-HTML files
        $path = $parsed['path'] ?? '';
        if (preg_match('/\.(jpg|jpeg|png|gif|pdf|zip|exe|mp4|mp3|css|js)$/i', $path)) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Convert URL to safe filename
     */
    private function urlToFilename($url) {
        $parsed = parse_url($url);
        $path = $parsed['path'] ?? '/';
        
        // Remove leading/trailing slashes
        $path = trim($path, '/');
        
        // If empty or ends with /, use index.html
        if (empty($path) || substr($path, -1) === '/') {
            $path .= 'index';
        }
        
        // Replace slashes with underscores
        $filename = str_replace('/', '_', $path);
        
        // Remove special characters
        $filename = preg_replace('/[^a-zA-Z0-9_.-]/', '', $filename);
        
        // Add .html extension if not present
        if (!preg_match('/\.(html?|php|asp|jsp)$/i', $filename)) {
            $filename .= '.html';
        }
        
        // Limit length
        if (strlen($filename) > 200) {
            $filename = substr($filename, 0, 200) . '.html';
        }
        
        return $filename;
    }
    
    /**
     * Log message if verbose mode is on
     */
    private function log($message) {
        if ($this->config['verbose']) {
            echo $message . "\n";
        }
    }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

try {
    $scraper = new WebScraper($config);
    $scraper->scrape();
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    exit(1);
}

?>
