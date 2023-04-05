

import minecraft_launcher_lib
import subprocess
import sys
import requests
import time
from realms import download_extract_backup


# uuid': 'ae66b652e508403a9c4587ff0f011760', 'name': 'klopez89'

def get_microsoft_login_data():
    # Replace these values with your own, these need to be place in the google cloud service dedicated to this site
    client_id = "5beeb873-aaa4-4fc9-90ea-d58811e59ff7"
    client_secret = "GIS8Q~NiwTfVrq1YJLrSpVuussbEGepIxhvy0c17"
    redirect_uri = "https://www.whollyaigame.com/minecraftauth"

    # Set the data for your Azure Application here. For more information look at the documentation.
    CLIENT_ID = client_id
    REDIRECT_URL = redirect_uri

    start_time = time.time()

    # Login
    login_url, state, code_verifier = minecraft_launcher_lib.microsoft_account.get_secure_login_data(CLIENT_ID, REDIRECT_URL)
    print(f"Please open {login_url} in your browser and copy the url you are redirected into the prompt below.")

    secs_after_get_secure_login_data = time.time() - start_time
    print("secs_after_get_secure_login_data", secs_after_get_secure_login_data)

    # Return login data
    login_data = {
        'login_url' : login_url,
        'state' : state,
        'code_verifier' : code_verifier
    }

    return login_data


def get_minecraft_login_data(redirected_url, auth_code_verifier, auth_state):
    # Replace these values with your own, these need to be place in the google cloud service dedicated to this site
    client_id = "5beeb873-aaa4-4fc9-90ea-d58811e59ff7"
    client_secret = "GIS8Q~NiwTfVrq1YJLrSpVuussbEGepIxhvy0c17"
    redirect_uri = "https://www.whollyaigame.com/minecraftauth"

    # Set the data for your Azure Application here. For more information look at the documentation.
    CLIENT_ID = client_id
    REDIRECT_URL = redirect_uri

    # Get the code from the url
    try:
        auth_code = minecraft_launcher_lib.microsoft_account.parse_auth_code_url(redirected_url, auth_state)
    except AssertionError:
        print("States do not match!")
        sys.exit(1)
    except KeyError:
        print("Url not valid")
        sys.exit(1)

    login_data = minecraft_launcher_lib.microsoft_account.complete_login(CLIENT_ID, [client_secret], REDIRECT_URL, auth_code, auth_code_verifier)

    print(f'The resulting loggin data for minecraft: {login_data}')

    minecraft_login_info = {
        'access_token': login_data["access_token"],
        'refresh_token': login_data["refresh_token"],
        'uuid': login_data["id"],
        'username': login_data["name"]
    }
    return minecraft_login_info



def get_minecraft_profile(access_token):
    profile_url = f"https://api.minecraftservices.com/minecraft/profile"
    print(f'The profile_url: {profile_url}')
    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.get(profile_url, headers=headers)
    
    if response.status_code == 200:
        return response.json()
    else:
        print("Error getting profile:", response)
        return None

def check_game_ownership(access_token):
    mcstore_url = f"https://api.minecraftservices.com/entitlements/mcstore"
    print(f'The mcstore_url: {mcstore_url}')
    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.get(mcstore_url, headers=headers)
    
    if response.status_code == 200:
        return response.json()
    else:
        print("Error getting mcstore:", response)
        return None

# def get_realms(headers, cookies):
#     realms_url = f"https://pc.realms.minecraft.net/worlds"
#     print(f'The realms url: {realms_url}')
#     response = requests.get(realms_url, headers=headers, cookies=cookies)
    
#     if response.status_code == 200:
#         return response.json()
#     else:
#         print(f"Error getting realms, status code: {response.status_code}, response text: {response.text}")
#         return None


def get_world_backups(world_id, headers, cookies):
    realm_backups_url = f"https://pc.realms.minecraft.net/worlds/{world_id}/backups"
    print(f'The realm_backups_url: {realm_backups_url}')
    response = requests.get(realm_backups_url, headers=headers, cookies=cookies)
    
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error getting world_backups, status code: {response.status_code}, response text: {response.text}")
        return None

# in realms, it seems you can have up to 4 different worlds. when not specified, shoudl default to 1.
def get_latest_backup_url(world_id, world_number, headers, cookies):
    realm_backup_download_url = f"https://pc.realms.minecraft.net/worlds/{world_id}/slot/{world_number}/download"
    print(f'The realm_backup_download_url: {realm_backup_download_url}')
    response = requests.get(realm_backup_download_url, headers=headers, cookies=cookies)
    
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error getting realm_backup_download_url, status code: {response.status_code}, response text: {response.text}")
        return None



# url = "https://wsjavaprodeus01.blob.core.windows.net/worlds/12639791/mcr_world.tar.gz?snapshot=2023-03-30T05%3A03%3A50.7487117Z&sig=C3EfSuxMVqmr8r7K3Dr6rxW4hJklNoynvq7W2Btcv2M%3D&st=2023-04-04T06%3A55%3A49Z&sktid=72f988bf-86f1-41af-91ab-2d7cd011db47&se=2023-04-05T07%3A10%3A49Z&sv=2019-02-02&skoid=82a10a84-65a9-451b-8577-a2af8f0edaec&sks=b&ske=2023-04-05T07%3A10%3A49Z&sp=r&skt=2023-04-04T06%3A55%3A49Z&sr=b&skv=2019-02-02"
# folder_path = download_extract_backup(url)
# print(f'the folder path for the extracted world backup: {folder_path}')


# # Replace these values with your own
# client_id = "5beeb873-aaa4-4fc9-90ea-d58811e59ff7"
# client_secret = "GIS8Q~NiwTfVrq1YJLrSpVuussbEGepIxhvy0c17"
# redirect_uri = "https://www.whollyaigame.com/minecraftauth"




# # Set the data for your Azure Application here. For more information look at the documentation.
# CLIENT_ID = client_id
# REDIRECT_URL = redirect_uri

# # Get latest version
# latest_version = minecraft_launcher_lib.utils.get_latest_version()["release"]

# # Get Minecraft directory
# minecraft_directory = minecraft_launcher_lib.utils.get_minecraft_directory()

# # Make sure, the latest version of Minecraft is installed
# minecraft_launcher_lib.install.install_minecraft_version(latest_version, minecraft_directory)

# # Login
# login_url, state, code_verifier = minecraft_launcher_lib.microsoft_account.get_secure_login_data(CLIENT_ID, REDIRECT_URL)

# print(f"The state: {state}, code_verifier: {code_verifier}")

# print(f"Please open {login_url} in your browser and copy the url you are redirected into the prompt below.")
# code_url = input()

# # Get the code from the url
# try:
#     auth_code = minecraft_launcher_lib.microsoft_account.parse_auth_code_url(code_url, state)
# except AssertionError:
#     print("States do not match!")
#     sys.exit(1)
# except KeyError:
#     print("Url not valid")
#     sys.exit(1)

# # Get the login data

# print(f"the auth_code: {auth_code}")

# login_data = minecraft_launcher_lib.microsoft_account.complete_login(CLIENT_ID, [client_secret], REDIRECT_URL, auth_code, code_verifier)


# print(f"the login_data from complete login: {login_data}")

# access_token = login_data["access_token"]
# uuid = login_data["id"]
# username = login_data["name"]



# headers = {"Authorization": f"Bearer {access_token}", "User-Agent": "Java/1.6.0_27"}
# cookies = {"sid": f"token:{access_token}:{uuid}", "user": f"{username}", "version": "1.19.4"}

# realms_info = get_realms(headers, cookies)
# print(f'The realsm info: {realms_info}')

# world_id = '12639791'
# world_backups = get_world_backups(world_id, headers, cookies)
# print(f'The world_backups: {world_backups}')


# latest_backup_download_info = get_latest_backup_url(world_id, 1, headers, cookies)
# print(f'The latest_backup_download_info: {latest_backup_download_info}')


# game_ownership = check_game_ownership(access_token)

# print(f"Game ownership response is: {game_ownership}")

# profile_info = get_minecraft_profile(access_token)

# print(f"Minecraft profile: {profile_info}")



# unmined-cli image render --trim --world="/Users/kevinlopez/Downloads/world" --output="MyMap.png"


