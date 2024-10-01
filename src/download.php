<?php
// download.php

// Directory where uploaded files are stored
$targetDir = "../assets/uploads/";

if (isset($_GET['file'])) {
    $fileName = basename($_GET['file']);
    $filePath = $targetDir . $fileName;

    // Check if the file exists
    if (file_exists($filePath)) {
        // Set headers to download the file
        header('Content-Description: File Transfer');
        header('Content-Type: application/octet-stream');
        header('Content-Disposition: attachment; filename="' . $fileName . '"');
        header('Expires: 0');
        header('Cache-Control: must-revalidate');
        header('Pragma: public');
        header('Content-Length: ' . filesize($filePath));

        // Read the file and send it to the output buffer
        readfile($filePath);
        exit;
    } else {
        echo "File not found.";
    }
}
?>
