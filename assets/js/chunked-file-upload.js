// Handle drag and drop events
const dropArea = $('#drop-area');

// Prevent default behavior for drag and drop events
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.on(eventName, preventDefaults, false);
    $(document).on(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// Highlight the drop area when files are dragged over it
['dragenter', 'dragover'].forEach(eventName => {
    dropArea.on(eventName, () => dropArea.addClass('highlight'));
});

// Remove highlight when files are dragged away or dropped
['dragleave', 'drop'].forEach(eventName => {
    dropArea.on(eventName, () => dropArea.removeClass('highlight'));
});

// Handle files when dropped
dropArea.on('drop', handleDrop);

function handleDrop(e) {
    const dt = e.originalEvent.dataTransfer;
    const files = dt.files;

    // Add the files to the input
    $('#fileInput')[0].files = files;
    displayFileList(files);
}

// Handle file selection via the input button
$('#fileInput').on('change', function() {
    const files = this.files;
    displayFileList(files); // Show the file list when files are selected
});

// Display selected files
function displayFileList(files) {
    const fileList = $('#file-list');
    fileList.empty();
    Array.from(files).forEach(file => {
        fileList.append(`<div class="file-status" id="file-status-${file.name.replaceAll(' ', '-')}">${file.name} (${(file.size / 1024).toFixed(2)} KB) - <span id="status-${file.name.replaceAll(' ', '-')}">Pending</span></div>`);
    });
}

$('#uploadBtn').on('click', function() {
    const files = $('#fileInput')[0].files;
    if (files.length === 0) {
        alert('Please select a file to upload.');
        return;
    }

    // Process each file
    for (let file of files) {
        const chunkSize = 1 * 1024 * 1024; // 1MB
        const totalChunks = Math.ceil(file.size / chunkSize);
        let currentChunk = 0;

        function uploadChunk() {
            const start = currentChunk * chunkSize;
            const end = Math.min(start + chunkSize, file.size);
            const chunk = file.slice(start, end);
            const formData = new FormData();
            formData.append('fileChunk', chunk);
            formData.append('chunkIndex', currentChunk);
            formData.append('totalChunks', totalChunks);
            formData.append('fileName', file.name); // Include the file name
            formData.append('fileSize', (file.size / 1024).toFixed(2) + 'KB'); // Include the file name

            $.ajax({
                url: './src/chunked-file-upload.php', // Server-side script to handle uploads
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                success: function(response) {
                    currentChunk++;
                    $('#progress-bar').css('width', ((currentChunk / totalChunks) * 100) + '%');
                    $('#status-' + file.name.replaceAll(' ', '-')).html('Uploaded chunk ' + (currentChunk) + ' of ' + totalChunks); // Update status
                    if (currentChunk < totalChunks) {
                        uploadChunk(); // Upload next chunk
                    } else {
                        $('#status-' + file.name.replaceAll(' ', '-')).html('Upload complete'); // Final status
                    }
                },
                error: function(xhr, status, error) {
                    console.error('Error uploading chunk:', error);
                    $('#status-' + file.name.replaceAll(' ', '-')).html('Upload failed'); // Mark as failed
                }
            });
        }

        uploadChunk(); // Start uploading chunks
    }
});

// Functionality for downloading files
$('#downloadBtn').on('click', function() {
    $('#download-list').empty();
    // Get list of files from the server
    $.ajax({
        url: './src/get_files.php',
        type: 'GET',
        success: function(response) {
            try {
                const files = JSON.parse(response); // Parse the JSON string
                files.forEach(file => {
                    const listItem = $(`<div>${file} <button class="btn btn-link" onclick="downloadFile('${file}')">Download</button></div>`);
                    $('#download-list').append(listItem);
                });
            } catch (error) {
                alert('Error parsing response: ' + error);
            }
        },
        error: function() {
            alert('Error occurred while fetching files.');
        }
    });
});


function downloadFile(fileName) {
    window.location.href = './src/download.php?file=' + fileName;
}
