import os
import boto3
from dotenv import load_dotenv

load_dotenv()

BUCKET_NAME = os.getenv("S3_BUCKET_NAME")
APP_ENV = os.getenv("APP_ENV", "development")
IMAGE_DIR = os.getenv("IMAGE_DIRECTORY", "./dataset_images")

def sync_folder_to_s3(local_folder):
    s3_client = boto3.client('s3')
    
    if not os.path.exists(local_folder):
        print(f"[{APP_ENV}] Folder {local_folder} tidak ditemukan. Membuat folder baru...")
        os.makedirs(local_folder)
        return

    print(f"[{APP_ENV}] Memindai folder: {local_folder}...")
    
    # os.walk akan menelusuri folder utama dan semua sub-foldernya
    for root, dirs, files in os.walk(local_folder):
        for file in files:
            # Opsional: Filter hanya file gambar berdasarkan ekstensi
            if file.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
                local_file_path = os.path.join(root, file)
                
                # Mendapatkan path relatif untuk mempertahankan struktur folder di S3
                # Contoh: jika local_file = "./dataset_images/raw_frames/img.jpg"
                # relative_path = "raw_frames/img.jpg"
                relative_path = os.path.relpath(local_file_path, local_folder)
                
                # S3 Key: production/images/raw_frames/img.jpg
                s3_key = f"{APP_ENV}/images/{relative_path}"
                
                try:
                    print(f"Mengunggah: {relative_path} -> s3://{BUCKET_NAME}/{s3_key}")
                    s3_client.upload_file(local_file_path, BUCKET_NAME, s3_key)
                    
                    # HAPUS komentar di bawah jika ingin mengosongkan storage EC2 setelah upload berhasil
                    # os.remove(local_file_path)
                    
                except Exception as e:
                    print(f"Gagal mengunggah {local_file_path}: {e}")

if __name__ == "__main__":
    sync_folder_to_s3(IMAGE_DIR)