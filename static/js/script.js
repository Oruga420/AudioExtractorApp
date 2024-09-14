document.addEventListener('DOMContentLoaded', () => {
    const uploadForm = document.getElementById('uploadForm');
    const videoFiles = document.getElementById('videoFiles');
    const audioFormat = document.getElementById('audioFormat');
    const audioQuality = document.getElementById('audioQuality');
    const progressContainer = document.getElementById('progressContainer');
    const uploadProgress = document.getElementById('uploadProgress');
    const statusMessage = document.getElementById('statusMessage');
    const downloadContainer = document.getElementById('downloadContainer');
    const downloadList = document.getElementById('downloadList');

    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!videoFiles.files.length) {
            alert('Please select at least one video file.');
            return;
        }

        progressContainer.classList.remove('hidden');
        uploadProgress.value = 0;
        statusMessage.textContent = 'Uploading...';
        downloadList.innerHTML = '';

        const formData = new FormData();
        for (let i = 0; i < videoFiles.files.length; i++) {
            formData.append('videos', videoFiles.files[i]);
        }
        formData.append('audioFormat', audioFormat.value);
        formData.append('audioQuality', audioQuality.value);

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
                result.files.forEach(file => {
                    const li = document.createElement('li');
                    const a = document.createElement('a');
                    a.href = `/download/${file}`;
                    a.textContent = file;
                    a.download = true;
                    li.appendChild(a);
                    downloadList.appendChild(li);
                });
            } else {
                throw new Error(result.error || 'Unknown error occurred');
            }
        } catch (error) {
            console.error('Error:', error);
            statusMessage.textContent = `Error: ${error.message}`;
        }
    });

    videoFiles.addEventListener('change', () => {
        downloadContainer.classList.add('hidden');
        progressContainer.classList.add('hidden');
        statusMessage.textContent = '';
    });
});
