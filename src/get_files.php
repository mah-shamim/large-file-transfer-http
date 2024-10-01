<?php
// get_files.php

$targetDir = "../assets/uploads/";
$files = array_diff(scandir($targetDir), array('..', '.')); // Get all files except '.' and '..'
echo json_encode(array_values($files)); // Return as JSON
?>
