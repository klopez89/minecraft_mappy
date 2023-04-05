import urllib.request
import base64
import os
import tempfile
import requests
from google.cloud import storage
from google.auth.transport import requests as grequests
from google.auth import compute_engine
from datetime import datetime, timedelta


def download_image_to_temp_directory(img_url):
    temp_dir = tempfile.mkdtemp()
    image_path = f'{temp_dir}/generated_img.jpg'
    response = requests.get(img_url)
    with open(image_path, 'wb') as f:
        f.write(response.content)
    return image_path

def save_image_to_bucket(bucket_name: str, folder_path: str, image_path: str) -> dict:
    # Initialize Google Cloud Storage client
    storage_client = storage.Client()
    bucket = storage_client.get_bucket(bucket_name)

    # Upload the image to the bucket
    image_name, image_ext = os.path.splitext(os.path.basename(image_path))
    blob_name = f"{image_name}{image_ext}"
    blob = bucket.blob(f"{folder_path}/{blob_name}")
    extension = os.path.splitext(image_path)[1][1:]
    with open(image_path, 'rb') as f:
        blob.upload_from_file(f, content_type=f'image/{extension}')

    expires_at_ms = datetime.now() + timedelta(minutes=15)
    auth_request = grequests.Request()
    signing_credentials = compute_engine.IDTokenCredentials(auth_request, "")
    signed_url = blob.generate_signed_url(expires_at_ms, credentials=signing_credentials)

    # Return the bucket_name, blob_path of the uploaded image, and signed img url
    return {
        'bucket_name': bucket_name,
        'blob_path': f'{folder_path}/{blob_name}',
        'signed_img_url': signed_url
    }

def get_signed_url(bucket_name: str, blob_path: str) -> str:
    storage_client = storage.Client()
    bucket = storage_client.get_bucket(bucket_name)
    blob = bucket.blob(blob_path)
    expires_at_ms = datetime.now() + timedelta(minutes=15)
    auth_request = grequests.Request()
    signing_credentials = compute_engine.IDTokenCredentials(auth_request, "")
    signed_url = blob.generate_signed_url(expires_at_ms, credentials=signing_credentials)
    return signed_url