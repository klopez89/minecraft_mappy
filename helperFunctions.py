from datetime import datetime
from pytz import timezone

def convertAirtableDateToCustomFormat(created_date):
	date = datetime.strptime(created_date, "%Y-%m-%dT%H:%M:%S.%fZ") # 2022-12-11T01:13:32.000Z (what comes back from airtable)
	tz = timezone('America/New_York') # force to EST, but in the future user should be able to toggle this
	estPromptDate = date.astimezone(tz).strftime("%m/%d/%y, %I:%M%p %Z") # 12/11/22, 01:33AM EST
	return estPromptDate

def timestamp_string():
	# Get the current time
	now = datetime.now()
	# Format the time as a string with no spaces
	time_string = now.strftime("%Y%m%d%H%M%S")
	return time_string

def convert_minecraft_date_to_est_str(minecraft_date_str):
	date_str = "2023-03-30T05:03:50.7487117Z"

	# Parse the date string into a datetime object using dateutil.parser
	date = parse(date_str)

	# Convert to Eastern Time
	eastern = pytz.timezone('US/Eastern')
	date_eastern = date.astimezone(eastern)

	# Format the date as a string
	date_formatted = date_eastern.strftime('%B %d, %Y at %I:%M%p %Z')

	# Print the formatted date
	print(f'eastern zone formatted: {date_formatted}')

	return date_formatted

