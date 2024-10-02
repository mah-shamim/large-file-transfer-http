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
        const sanitizedFileName = sanitizeFileName(file.name);
        fileList.append(`<div class="file-status" id="file-status-${sanitizedFileName}">${file.name} (${(file.size / 1024).toFixed(2)} KB) - <span id="status-${sanitizedFileName}">Pending</span></div>`);
    });
}

// Function to sanitize the file name by replacing special characters
function sanitizeFileName(fileName) {
    return fileName.replace(/[^a-zA-Z0-9-_]/g, '-');
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
                    const sanitizedFileName = sanitizeFileName(file.name);
                    $('#status-' + sanitizedFileName).html('Uploaded chunk ' + (currentChunk) + ' of ' + totalChunks); // Update status
                    if (currentChunk < totalChunks) {
                        uploadChunk(); // Upload next chunk
                    } else {
                        $('#status-' + file.name.replaceAll(' ', '-')).html('Upload complete'); // Final status
                    }
                    getFileList();
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
$(document).ready(function() {
    getFileList();
});

// Fetch available files from the server
function getFileList() {
    $.ajax({
        url: './src/get_files.php',
        type: 'GET',
        success: function (response) {
            const files = JSON.parse(response);
            const fileList = $('#fileList');
            fileList.html('');
            // Populate the list of files
            files.forEach(function (file) {
                const listItem = $('<li></li>').text(file);
                const downloadLink = $('<a></a>').attr('href', '#').text(' Download');

                downloadLink.on('click', function (e) {
                    e.preventDefault();
                    downloadFile(file);
                });

                listItem.append(downloadLink);
                fileList.append(listItem);
            });
        },
        error: function () {
            alert('Error fetching file list.');
        }
    });
}

// Functionality for downloading files
function downloadFile(fileName) {
    $.ajax({
        url: './src/download.php?file=' + fileName,
        type: 'GET',
        xhr: function() {
            const xhr = new XMLHttpRequest();
            xhr.responseType = 'blob';
            return xhr;
        },
        success: function(data) {
            const url = window.URL.createObjectURL(data);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        },
        error: function() {
            alert('Error downloading file.');
        }
    });
}