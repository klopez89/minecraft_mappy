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
