from flask import Flask, request, jsonify
from flask_cors import CORS
import boto3
import os
from dotenv import load_dotenv

# Load konfigurasi dari file .env
load_dotenv()

app = Flask(__name__)

# Mengambil origin dari .env, default '*' jika tidak diset
CORS_ORIGIN = os.getenv("CORS_ORIGIN", "*")
origins = [o.strip() for o in CORS_ORIGIN.split(",")]
CORS(app, resources={r"/api/*": {"origins": origins}})

# Wajib ada di .env
BUCKET_NAME = os.getenv("S3_BUCKET_NAME")
if not BUCKET_NAME:
    raise ValueError("Error: S3_BUCKET_NAME tidak ditemukan di file .env")

s3_client = boto3.client('s3')

@app.route('/', methods=['GET'])
def home():
    return jsonify({"status": "success", "message": "API EC2-S3 Berjalan Normal!"}), 200

@app.route('/api/images', methods=['GET'])
def get_images():
    """READ: Mengambil daftar gambar dari S3"""
    try:
        response = s3_client.list_objects_v2(Bucket=BUCKET_NAME, Prefix="production/images/")
        images = []
        if 'Contents' in response:
            for item in response['Contents']:
                # Mengabaikan nama folder itu sendiri
                if item['Key'] != "production/images/":
                    images.append({
                        "filename": item['Key'].split('/')[-1],
                        "key": item['Key']
                    })
        return jsonify({"status": "success", "data": images}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/images', methods=['POST'])
def upload_image():
    """CREATE: Mengunggah gambar baru ke S3"""
    if 'file' not in request.files:
        return jsonify({"status": "error", "message": "Tidak ada file"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"status": "error", "message": "Nama file kosong"}), 400
        
    s3_key = f"production/images/{file.filename}"
    
    try:
        s3_client.upload_fileobj(file, BUCKET_NAME, s3_key)
        return jsonify({"status": "success", "message": "File berhasil diunggah"}), 201
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/images/<filename>', methods=['DELETE'])
def delete_image(filename):
    """DELETE: Menghapus gambar dari S3"""
    s3_key = f"production/images/{filename}"
    try:
        s3_client.delete_object(Bucket=BUCKET_NAME, Key=s3_key)
        return jsonify({"status": "success", "message": "File berhasil dihapus"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    # Mengambil port dan host dari .env
    port = int(os.getenv("FLASK_PORT", 5000))
    host = os.getenv("FLASK_HOST", "0.0.0.0")
    app.run(host=host, port=port)