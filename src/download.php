<?php
// download.php

$targetDir = "../assets/uploads/";

if (isset($_GET['file'])) {
    $fileName = basename($_GET['file']);
    $filePath = $targetDir . $fileName;

    if (file_exists($filePath)) {
        // Get file size
        $fileSize = filesize($filePath);
        $file = fopen($filePath, 'rb');

        // Check for the 'Range' header to allow partial download
        $start = 0;
        $length = $fileSize;
        $end = $fileSize - 1;

        if (isset($_SERVER['HTTP_RANGE'])) {
            // Parse the range header to get the start and end of the requested range
            if (preg_match('/bytes=(\d+)-(\d*)/', $_SERVER['HTTP_RANGE'], $matches)) {
                $start = intval($matches[1]);
                if (!empty($matches[2])) {
                    $end = intval($matches[2]);
                }
            }

            // Set the content-length for the partial request
            $length = $end - $start + 1;

            header('HTTP/1.1 206 Partial Content');
            header('Content-Range: bytes ' . $start . '-' . $end . '/' . $fileSize);
        }

        header('Content-Type: application/octet-stream');
        header('Content-Disposition: attachment; filename="' . $fileName . '"');
        header('Accept-Ranges: bytes');
        header('Content-Length: ' . $length);
        header('Expires: 0');
        header('Cache-Control: must-revalidate');
        header('Pragma: public');

        // Move to the starting byte and stream the file
        fseek($file, $start);
        $bufferSize = 8192; // Send data in 8KB chunks
        while (!feof($file) && ($pos = ftell($file)) <= $end) {
            if ($pos + $bufferSize > $end) {
                $bufferSize = $end - $pos + 1;
            }
            echo fread($file, $bufferSize);
            flush();
        }

        fclose($file);
        exit;
    } else {
        header('HTTP/1.1 404 Not Found');
        echo "File not found.";
    }
}
?>
