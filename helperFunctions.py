from datetime import datetime
import pytz
import os
from dateutil.parser import parse


def convertAirtableDateToCustomFormat(created_date):
	date = datetime.strptime(created_date, "%Y-%m-%dT%H:%M:%S.%fZ") # 2022-12-11T01:13:32.000Z (what comes back from airtable)
	tz = pytz.timezone('America/New_York') # force to EST, but in the future user should be able to toggle this
	estPromptDate = date.astimezone(tz).strftime("%m/%d/%y, %I:%M%p %Z") # 12/11/22, 01:33AM EST
	return estPromptDate

def timestamp_string():
	# Get the current time
	now = datetime.now()
	# Format the time as a string with no spaces
	time_string = now.strftime("%Y%m%d%H%M%S")
	return time_string

def convert_minecraft_date_to_est_str(minecraft_date_str):
	# Parse the date string into a datetime object using dateutil.parser
	date = parse(minecraft_date_str)

	# Convert to Eastern Time
	eastern = pytz.timezone('US/Eastern')
	date_eastern = date.astimezone(eastern)

	# Format the date as a string
	date_formatted = date_eastern.strftime('%B %d, %Y at %I:%M%p %Z')

	# Print the formatted date
	print(f'eastern zone formatted: {date_formatted}')

	return date_formatted

# 	using the blob path to the latest map img of png type
def backup_id_from_blob_path(string):
    last_underscore = string.rfind('_')  # find the index of the last underscore
    png_index = string.find('.png')  # find the index of the ".png" text
    return string[last_underscore + 1 : png_index]  # extract the portion of the string between the two indices


def azure_client_id(base_site_url):
	if 'whollyaigame.com' in base_site_url:
		return os.environ.get('azure_client_id_dev')
	else:
		return os.environ.get('azure_client_id_prod')

def azure_client_secret(base_site_url):
	if 'whollyaigame.com' in base_site_url:
		return os.environ.get('azure_client_secret_dev')
	else:
		return os.environ.get('azure_client_secret_prod')

def azure_redirect_url(base_site_url):
	if 'whollyaigame.com' in base_site_url:
		return os.environ.get('azure_redirect_url_dev')
	else:
		return os.environ.get('azure_redirect_url_prod')