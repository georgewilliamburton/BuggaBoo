<?php
$url = "https://www.facebook.com"; //url to get data from
$downloadedContent = "downloaded-content.html";

$ch = curl_init($url);

curl_setopt($ch, CURLOPT_RETURNTRANSFER, true); //return string response

//additional useful web scraping tools:
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true); //Follows redirects (like when www.github.com redirects to github.com).
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); //Disables SSL certificate verification 
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0'); //GitHub blocks requests without a user agent
curl_setopt($ch, CURLOPT_REFERER, 'https://www.google.com'); //tells the site you came from google
curl_setopt($ch, CURLOPT_TIMEOUT, 30); //setting a timeout
curl_setopt($ch, CURLOPT_ENCODING, ''); //enables automatic decoding

// scrapping logged in pages, perists session
curl_setopt($ch, CURLOPT_COOKIEFILE, 'cookies.txt');
curl_setopt($ch, CURLOPT_COOKIEJAR, 'cookies.txt');


$response = curl_exec($ch);

if ($response === false) {
    echo "Error fetching the url: ", curl_error($ch);
    curl_close($ch);
    exit;
}
$handle = fopen($downloadedContent, 'w');

if ($handle === false) {
    echo "Error opening steadm for writing to file: ", curl_error($ch);
    curl_close($ch);
    exit;
}

fwrite($handle, $response);

fclose($handle);
curl_close($ch);

$handle = fopen($downloadedContent, 'r');
if ($handle === false) {
    echo "Error opening steadm for writing to file: ";
    curl_close($ch);
    exit;
}

$fileContentToRead = fread($handle, filesize($downloadedContent));
echo "This content comes from the downloaded file:\n\n";
echo $fileContentToRead;