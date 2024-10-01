<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $targetDir = "../assets/uploads/"; // Directory to save uploaded files
    $chunkIndex = intval($_POST['chunkIndex']); // Current chunk index
    $totalChunks = intval($_POST['totalChunks']); // Total chunks
    $fileName = basename($_POST['fileName']); // Sanitize file name
    $fileSize = ($_POST['fileSize']); // Sanitize file name

    // Create target directory if it doesn't exist
    if (!is_dir($targetDir)) {
        mkdir($targetDir, 0755, true);
    }

    // Save the uploaded chunk
    $chunkFilePath = $targetDir . "$fileName.part$chunkIndex";
    if (move_uploaded_file($_FILES['fileChunk']['tmp_name'], $chunkFilePath)) {
        $finalFile = $targetDir . $fileName;
        // Check if all chunks have been uploaded
        if ($chunkIndex == $totalChunks - 1) {

            // Merge chunks into one file
            $out = fopen($finalFile, "wb");
            for ($i = 0; $i < $totalChunks; $i++) {
                $chunk = "$targetDir$fileName.part$i";
                if (file_exists($chunk)) {
                    fwrite($out, file_get_contents($chunk)); // Write chunk to final file
                    unlink($chunk); // Delete chunk after merging
                }
            }
            fclose($out);
            //echo json_encode(["status" => "success", "message" => "File uploaded successfully."]);
            $response[] = [
                'file' => $fileName,
                'status' => 'Uploaded',
                'size' => $fileSize // size in KB
            ];
        } else {
            //echo json_encode(["status" => "success", "message" => "Chunk uploaded successfully."]);
            $response[] = [
                'file' => $fileName,
                'status' => 'Uploaded',
                'size' => $fileSize // size in KB
            ];
        }
    } else {
        http_response_code(500);
        //echo json_encode(["status" => "error", "message" => "Failed to upload chunk."]);
        $response[] = [
            'file' => $fileName,
            'status' => 'Failed',
            'size' => 0
        ];

    }
} else {
    http_response_code(405);
    //echo json_encode(["status" => "error", "message" => "Invalid request method."]);
    $response[] = [
        'file' => 'Invalid request method.',
        'status' => 'Failed',
        'size' => 0
    ];

}
// Return response as JSON
header('Content-Type: application/json');
echo json_encode($response);
?>
