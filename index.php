<?php
//creating / writing to a file
    $file = 'MyFile.txt';

    $handle = fopen($file, 'w');

    if($handle === false){
        echo "Error opening the file for writing";
        exit;
    }

    $text = 'This is the first bit of text I am writing to the file';


    fwrite($handle, $text);

    fclose($handle);

    $handle = fopen($file, 'r');

if($handle === false){
    echo "Error opening the file for reading";
    exit;
}

$readContent = fread($handle, filesize($file));
fclose($handle);

echo "This was the text that was inside the file\n";
echo $readContent;

?>