<?php
// get_files.php

$targetDir = "../assets/uploads/";

// Exclude '.', '..', and '.gitignore' from the file list
$files = array_diff(scandir($targetDir), array('..', '.', '.gitignore'));

// Return the list of files as JSON
echo json_encode(array_values($files));
?>
