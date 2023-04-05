import requests
import urllib.request
import tarfile
import os
import subprocess
from image_download import save_image_to_bucket, get_signed_url


from google.cloud import storage


def get_realms_info(access_token, username, uuid):
	headers = {"Authorization": f"Bearer {access_token}", "User-Agent": "Java/1.6.0_27"}
	cookies = {"sid": f"token:{access_token}:{uuid}", "user": f"{username}", "version": "1.19.4"}
	realms_url = f"https://pc.realms.minecraft.net/worlds"

	response = requests.get(realms_url, headers=headers, cookies=cookies)
	
	if response.status_code == 200:
		return response.json()
	else:
		print(f"Error getting realms, status code: {response.status_code}, response text: {response.text}")
		return None


def get_world_backups(access_token, username, uuid, world_id):
    realm_backups_url = f"https://pc.realms.minecraft.net/worlds/{world_id}/backups"
    response = requests.get(realm_backups_url, headers=headers, cookies=cookies)
    
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error getting world_backups, status code: {response.status_code}, response text: {response.text}")
        return None


def get_world_map_img(access_token, username, uuid, world_id, active_slot):
	headers = {"Authorization": f"Bearer {access_token}", "User-Agent": "Java/1.6.0_27"}
	cookies = {"sid": f"token:{access_token}:{uuid}", "user": f"{username}", "version": "1.19.4"}

	latest_backup_download_info = get_latest_backup_url(world_id, active_slot, headers, cookies)
	download_link = latest_backup_download_info["downloadLink"]

	print(f'The realm_backup download_link: {download_link}')

	backup_folder_path = download_extract_backup(download_link)
	parent_backup_dir = os.path.dirname(os.path.abspath(backup_folder_path))

	# Define the command for extracting the map image
	output_map_path = f'{parent_backup_dir}/latest_map.png'
	cmd = f'unmined/unmined-cli image render --trim --world="{backup_folder_path}" --output="{output_map_path}"'

	# Run the command and capture the output and error messages
	p = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

	# Get the output and error messages from the process
	out, err = p.communicate()

	# Print the output and error messages
	print(out.decode())
	print(err.decode())
	print('Finished getting the latest_map!')

	bucket_name = "minecraft_maps"
	saved_img_info = save_image_to_bucket(bucket_name, world_id, output_map_path)

	return saved_img_info

def get_latest_map_img_url(bucket_name, blob_path):
	return get_signed_url(bucket_name, blob_path)


def get_latest_backup_url(world_id, active_slot, headers, cookies):
	realm_backup_download_endpoint = f"https://pc.realms.minecraft.net/worlds/{world_id}/slot/{active_slot}/download"
	response = requests.get(realm_backup_download_endpoint, headers=headers, cookies=cookies)
	
	if response.status_code == 200:
		return response.json()
	else:
		print(f"Error getting realm_backup_download_url, status code: {response.status_code}, response text: {response.text}")
		return None


def download_extract_backup(url):
	file_name = url.split('/')[-1].split('?')[0]

	# Download the file
	response = requests.get(url, stream=True)
	with open(file_name, 'wb') as f:
		for chunk in response.iter_content(chunk_size=1024):
			if chunk:
				f.write(chunk)

	# Extract the contents of the tar file
	extracted_folder_name = 'latest_backup'
	with tarfile.open(file_name, 'r:gz') as tar:
		tar.extractall(path=extracted_folder_name)


	# Get the path of world folder within the extracted folder
	folder_path = os.path.abspath(extracted_folder_name) + '/world'

	print(f'the extracted_folder_name: {extracted_folder_name}, extracted_folder_path: {folder_path}')

	return folder_path