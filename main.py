import os
from flask import Flask, render_template, request, send_file, jsonify
from werkzeug.utils import secure_filename
import ffmpeg

app = Flask(__name__)

# Configure upload settings
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['EXTRACTED_AUDIO_FOLDER'] = 'extracted_audio'
ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'}

# Ensure upload and extracted audio directories exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['EXTRACTED_AUDIO_FOLDER'], exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_videos():
    if 'videos' not in request.files:
        return jsonify({'error': 'No video files provided'}), 400

    videos = request.files.getlist('videos')
    if not videos:
        return jsonify({'error': 'No video files selected'}), 400

    audio_format = request.form.get('audioFormat', 'mp3')
    audio_quality = request.form.get('audioQuality', 'medium')

    bitrate = {
        'low': '64k',
        'medium': '128k',
        'high': '256k'
    }.get(audio_quality, '128k')

    extracted_files = []
    for video in videos:
        if video and allowed_file(video.filename):
            filename = secure_filename(video.filename)
            video_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            video.save(video_path)

            # Extract audio
            audio_filename = f"{os.path.splitext(filename)[0]}.{audio_format}"
            audio_path = os.path.join(app.config['EXTRACTED_AUDIO_FOLDER'], audio_filename)

            try:
                output_params = {
                    'acodec': {
                        'mp3': 'libmp3lame',
                        'wav': 'pcm_s16le',
                        'aac': 'aac'
                    }.get(audio_format, 'libmp3lame'),
                    'ab': bitrate
                }
                if audio_format == 'wav':
                    del output_params['ab']  # WAV doesn't use bitrate

                (
                    ffmpeg
                    .input(video_path)
                    .output(audio_path, **output_params)
                    .overwrite_output()
                    .run(capture_stdout=True, capture_stderr=True)
                )
                extracted_files.append(audio_filename)
            except ffmpeg.Error as e:
                return jsonify({'error': f'Error processing {filename}: {str(e.stderr, "utf-8")}'}), 500

            # Remove the uploaded video file
            os.remove(video_path)
        else:
            return jsonify({'error': f'Invalid file type: {video.filename}'}), 400

    return jsonify({'success': True, 'files': extracted_files})

@app.route('/download/<filename>')
def download_audio(filename):
    return send_file(os.path.join(app.config['EXTRACTED_AUDIO_FOLDER'], filename), as_attachment=True)

@app.route('/preview/<filename>')
def preview_audio(filename):
    return send_file(os.path.join(app.config['EXTRACTED_AUDIO_FOLDER'], filename), as_attachment=False)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
