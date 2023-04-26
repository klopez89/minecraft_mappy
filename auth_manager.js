
function clearAuthInfo() {
	localStorage.removeItem('username');
	localStorage.removeItem('uuid');
	localStorage.removeItem('access_token');
	localStorage.removeItem('refresh_token');
}

function is_authenticated() {
	return get_auth_info() != null
}

function get_auth_info() {
	const access_token = localStorage.getItem('access_token');
	const refresh_token = localStorage.getItem('refresh_token')
	const username = localStorage.getItem('username');
	const uuid = localStorage.getItem('uuid');
	const world_id = localStorage.getItem('selected_world_id');

	if (access_token == null || refresh_token == null || username == null || uuid == null || world_id == null) {
		return null
	}

	return {
		'access_token': access_token,
		'refresh_token': refresh_token,
		'username': username,
		'uuid': uuid,
		'world_id': world_id
	}
}

function validateAccessToken() {
	const access_token = localStorage.getItem('access_token');
	const refresh_token = localStorage.getItem('refresh_token');
	const url = `${base_server_url}/login/validate_access_token`;

	json_obj = {
	'access_token': access_token,
	'refresh_token': refresh_token
	}

	return new Promise((resolve, reject) => {
		$.ajax({
			url: url,
			method: 'POST',
			data: JSON.stringify(json_obj),
			contentType: "application/json",
			dataType: "json",
			success: function(response) {
				console.log('Validate_access_token endpoint hit was successful:', response);

				const has_new_auth_info = response["refresh_info"] != null;
				if (has_new_auth_info) {
					localStorage.setItem('access_token', response["refresh_info"]["access_token"]);
					localStorage.setItem('refresh_token', response["refresh_info"]["refresh_token"]);
				}

				const is_access_token_valid = response["valid"] == true;
				if (is_access_token_valid || has_new_auth_info) {
					console.log('Ready to make an auth required API call')
					resolve();
				} else {
					console.log('Will need to ask the user to go through original auth path')
					reject(new Error('Issue refreshing auth, take user to original auth flow'));
				}
			},
			error: function(xhr, status, error) {
				console.error('Validating access token failed:', error);
				reject(new Error('Issue refreshing auth, take user to original auth flow'));
			}
		});
	});
}

function errorValidatingAccessToken(error) {
	console.error('AJAX call to login/validate_access_token failed with error:', error);
}