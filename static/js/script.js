document.addEventListener('DOMContentLoaded', () => {
    const uploadForm = document.getElementById('uploadForm');
    const videoFile = document.getElementById('videoFile');
    const progressContainer = document.getElementById('progressContainer');
    const uploadProgress = document.getElementById('uploadProgress');
    const statusMessage = document.getElementById('statusMessage');
    const downloadContainer = document.getElementById('downloadContainer');
    const downloadLink = document.getElementById('downloadLink');

    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!videoFile.files.length) {
            alert('Please select a video file.');
            return;
        }

        const formData = new FormData();
        formData.append('video', videoFile.files[0]);

        progressContainer.classList.remove('hidden');
        uploadProgress.value = 0;
        statusMessage.textContent = 'Uploading...';

        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const result = await response.json();

            if (result.success) {
                statusMessage.textContent = 'Audio extracted successfully!';
                downloadContainer.classList.remove('hidden');
                downloadLink.href = `/download/${result.filename}`;
            } else {
                throw new Error(result.error || 'Unknown error occurred');
            }
        } catch (error) {
            console.error('Error:', error);
            statusMessage.textContent = `Error: ${error.message}`;
        }
    });

    videoFile.addEventListener('change', () => {
        downloadContainer.classList.add('hidden');
        progressContainer.classList.add('hidden');
        statusMessage.textContent = '';
    });
});
