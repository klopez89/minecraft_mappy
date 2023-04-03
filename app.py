from flask import Flask, request, abort, render_template, jsonify, redirect, make_response
from werkzeug.exceptions import BadRequest
from werkzeug.exceptions import NotFound
from flask_cors import CORS

import ast
import base64
import json
from helperFunctions import timestamp_string

from datetime import datetime
from pytz import timezone

from login import get_microsoft_login_data

app = Flask(__name__, template_folder='templates', static_folder='static')
CORS(app, resources={r"/*": {"origins": ["https://www.whollyaigame.com", "https://api.replicate.com"]}})

SITE_DOMAIN = 'https://www.whollyaigame.com'

@app.route("/")
def index():
		return render_template('index.html')

@app.route("/login/microsoft", methods=['POST'])
def login_microsoft():
	request_json = request.get_json()
	login_data = get_microsoft_login_data()
	response = jsonify(success=True,login_data=login_data)


@app.route("/generate", methods=['POST'])
def generate():
		request_json = request.get_json() # dictionary type

		print("The JSON hitting generate is:")
		for k, v in request_json.items():
			print(k, v)

		img_to_img_url = request_json.get('imgToImgUrl','')
		prompt_strength = request_json.get('promptStrength','')
		prompt = request_json.get('prompt')
		negative_prompt = request_json.get('negativePrompt')
		idea_id = request_json.get('selectedIdea')
		guidance_scale = request_json.get('guidanceScale')
		seed = request_json.get('seed')
		inference_steps =request_json.get('inferenceSteps', 50)
		modelName = request_json.get('modelName') 
		modelVersion = request_json.get('modelVersion') 
		output = generate_ai_with(prompt, negative_prompt, guidance_scale, seed, inference_steps, modelName, modelVersion, img_to_img_url, prompt_strength)

		(fileName, image_url, genTime, usedSeed) = ast.literal_eval(output)

		promptInfo = {
			'text' : prompt,
			'ideaId' : idea_id,
			'imageUrl' : image_url,
			'genTime' : str(genTime),
			'negText' : negative_prompt,
			'gScale' : guidance_scale,
			'seed' : usedSeed,
			'inference_steps' : inference_steps,
			'modelName' : modelName,
			'modelVersion' : modelVersion,
			'img_to_img_url' : img_to_img_url,
			'prompt_strength' : prompt_strength,
		}

		createPromptOutput = create_prompt(promptInfo)
		(created_prompt_rec_id, created_date) = ast.literal_eval(createPromptOutput)
	
		resp = jsonify(success=True,imageUrl=image_url,prompt=prompt,
			creationDate=created_date,generationTime=str(genTime),promptId=created_prompt_rec_id,
			usedSeed=usedSeed)
		return resp



# @app.route("/brainstorm/model/create", methods=['POST','OPTIONS'])
# def createNewModel():

# 	if request.method == "OPTIONS": # CORS preflight
# 		return _build_cors_preflight_response()
# 	elif request.method != "POST":
# 		raise RuntimeError("Weird - don't know how to handle method {}".format(request.method))

# 	request_json = request.get_json() # dictionary type

# 	print("The request json for model create is: ", request_json);

# 	member_id = request_json.get('memberId')
# 	email = request_json.get('email','')
# 	displayName = request_json.get('displayName','')
# 	customModelName = request_json.get('customModelName','') # used for brainstorm site
# 	price_id = request_json.get('price_id','')
# 	image_data = request_json.get('files')
# 	image_count = len(image_data)

# 	member_rec_id = fetch_member_reference_with(member_id)
# 	timestamp = timestamp_string()
# 	folder_name = f'{member_rec_id}_{timestamp}'
# 	model_name = createModelName(member_id, displayName, email, customModelName)
# 	short_model_name = model_name.split("/")[1]

# 	returned_purchase_record = fetchPurchaseForUser(member_rec_id, price_id)

# 	instance_data_url = create_folder_and_upload_images('model_creation', folder_name, image_data)

# 	anchor_64b_string = determine_anchor_img(image_data)
# 	anchor_img_blob_info = save_anchor_img_to_gcloud(anchor_64b_string, short_model_name)

# 	print(f'Things are good so far if we are here and anchor_img_blob_info: {anchor_img_blob_info}, short model name: {short_model_name}')

# 	webhook_endpoint = 'model/finished'
# 	replicate_prediction_id = kickoffModelCreationOnReplicate(instance_data_url, member_id, model_name, image_count, webhook_endpoint)
# 	response_new_model = create_new_model(model_name, member_rec_id, '', replicate_prediction_id, anchor_img_blob_info)

# 	response = { 
# 		'msg' : 'Succeeded in kick starting model creation!',
# 		'trainingId' : replicate_prediction_id,
# 	}
# 	return _corsify_actual_response(jsonify(response))   



def _corsify_actual_response(response):
	response.headers.add("Access-Control-Allow-Origin", "*")
	return response

def _build_cors_preflight_response():
	response = make_response()
	response.headers.add("Access-Control-Allow-Origin", "*")
	response.headers.add('Access-Control-Allow-Headers', "*")
	response.headers.add('Access-Control-Allow-Methods', "*")
	return response

if __name__ == '__main__':
	app.run(debug=True, host="0.0.0.0", port=int(os.environ.get("PORT", 8080)))
