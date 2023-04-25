window.addEventListener('beforeunload', function(event) {
	bringLoadingScreenBack();
});

document.addEventListener('TailwindLoaded', function() {

	// Get the current page URL
	const url = new URL(window.location.href);

	// Get the query parameters
	const params = new URLSearchParams(url.search);

	// Get the specific query parameters you need
	const bucketName = params.get("bucket_name");
	const blobPath = params.get("blob_path");
	const worldName = params.get("world_name");
	const worldId = params.get("world_id");
	const worldSlot = params.get("world_slot");
	const worldOwnerUUID = params.get("world_owner_uuid");
	const worldOwner = params.get("world_owner");

	const mapperHasMinReq = bucketName != null && blobPath != null && worldName != null && worldId != null && worldSlot != null && worldOwnerUUID != null && worldOwner != null;

	addLoadingDiv();

	if (mapperHasMinReq) {
		localStorage.setItem("map_bucket_name", bucketName)
		localStorage.setItem("map_blob_path", blobPath);

		console.log(`map_blob_path is: ${blobPath}`);

		localStorage.setItem("selected_world_name", worldName);
		localStorage.setItem("selected_world_id", worldId);
		localStorage.setItem("selected_world_slot", worldSlot);
		localStorage.setItem("selected_world_owner_uuid", worldOwnerUUID);
		localStorage.setItem("selected_world_owner_username", worldOwner);
		continueToLoadMapper();
	} else {
		console.log('Mapper doesnt have min requirements so we should route user to home page, or auth page. TBD')
	}
});

// Forces a page refresh when user hits back in browser. This forces the local sotrage data to be accurate for that map context
window.onpageshow = function(event) {
  if (event.persisted) {
    location.reload(true);
  }
};

function addLoadingDiv() {
	const loading_div_html = loading_html();
	const loading_div_element = $($.parseHTML(loading_div_html));
  $('body').append(loading_div_element);
}

function continueToLoadMapper() {
	requestData = {
		'bucket_name': localStorage.getItem('map_bucket_name'),
		'blob_path': localStorage.getItem('map_blob_path'),
	}
	fetchNewSignedMapImageULR(requestData)
}

function hasLatestMapImgUrlExpired() {
	const expirationTime = localStorage.getItem('map_img_expiration');
	return (expirationTime < Math.floor(Date.now() / 1000) || expirationTime == null)
}


function checkForMinecraftAuthInfo() {
	const username = localStorage.getItem('username');
	const uuid = localStorage.getItem('uuid');
	const access_token = localStorage.getItem('access_token');

	if (access_token != null && username != null && uuid != null) {
		return {
			'access_token': access_token,
			'username': username,
			'uuid': uuid
		}
	} else {
		return null
	}
}

function clearAuthInfo() {
	localStorage.removeItem('username');
	localStorage.removeItem('uuid');
	localStorage.removeItem('access_token');
}


function fetchNewSignedMapImageULR(img_info) {
	$.ajax({
		url: `${base_server_url}/world/map/retrieve`,
		method: 'POST',
		data: JSON.stringify(img_info),
		contentType: "application/json",
		dataType: "json",
		success: function(response) {
			console.log('New signed world map img url fetch was successful:', response);

			const signed_img_url = response["map_img_url"];
			const backup_id = response["backup_id"];
			const backup_date = response["backup_date"]; 
			const latest_blob_path = response["latest_blob_path"];

			if (signed_img_url == null) {
				console.log('Looks like this map image backup was removed from storage, add some placeholder UI instead');
				return
			}

      localStorage.setItem('map_backup_date', backup_date);
      localStorage.setItem('map_backup_id', backup_id);

      const hasNewerMapToLoad = latest_blob_path != null;
      presentMapExplorer(signed_img_url, hasNewerMapToLoad);

			if (hasNewerMapToLoad) {
				console.log(`We have a newer map to load into! Show the user this option as a button! New blob_path: ${latest_blob_path}`)
				const latest_backup_id = response["latest_backup_id"];
				const latest_backup_date = response["latest_backup_date"];
				localStorage.setItem('latest_blob_path', latest_blob_path);
				localStorage.setItem('latest_backup_id',latest_backup_id);
				localStorage.setItem('latest_backup_date', latest_backup_date);
			} else {
				localStorage.removeItem('latest_blob_path');
				localStorage.removeItem('latest_backup_id');
				localStorage.removeItem('latest_backup_date');
			}
		},
		error: function(xhr, status, error) {
			console.error('New signed world map img url fetch failed:', error);
		}
	});
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

function checkForNewBackup() {
	const world_owner_uuid = localStorage.getItem('selected_world_owner_uuid')
	const auth_info = get_auth_info();

	if (auth_info == null) {
		console.log('Not authenticated at all so hard stopping this function.');
		return
	}

	if (auth_info['uuid'] != world_owner_uuid) {
		console.log('Current authd user is not the owner of current world');
		return
	}

	$.ajax({
		url: `${base_server_url}/realms/latest_backup_info`,
		method: 'POST',
		data: JSON.stringify(auth_info),
		contentType: "application/json",
		dataType: "json",
		success: function(response) {
			console.log('Latest backup info fetch successful:', response);
			const latest_backup_id = response["latest_backup_id"];
			const latest_backup_date = response["latest_backup_date"];

			const stored_latest_backup_id = localStorage.getItem('latest_backup_id'); // comes from the context of checking for a newer map
			const stored_current_backup_id = localStorage.getItem('map_backup_id');

			const backup_id_to_compare_to = stored_latest_backup_id != null ? stored_latest_backup_id : stored_current_backup_id;

			if (backup_id_to_compare_to == latest_backup_id) {
				console.log('We already have the latest backup map');
			} else {
				console.log(`We can generate a newer world map, latest_backup_date: ${latest_backup_date}, so show generate button`);
				enable_generate_new(latest_backup_date);
			}
		},
		error: function(xhr, status, error) {
			console.error('Latest backup info fetch failed:', error);
		}
	});
}


function presentMapExplorer(signed_img_url, hasNewerMapToLoad) {
	// Fade out the existing div
	$('#realWorldSelectionContainer').fadeOut(500, function() {
	  // After the fade out animation is complete, remove the div from the DOM
	  $(this).remove();
	});

	// Add the map explorer to the body and hide it
	const map_explorer_html = map_html(signed_img_url);
	const map_explorer_element = $($.parseHTML(map_explorer_html));
  $('body').append(map_explorer_element);

  // Configure then transition to map explorer from the loading div
  configureMap();
  add_slide_over_menu(is_authenticated());
  configureWorldSelectionUI();
  if (hasNewerMapToLoad) { 
  	enable_load_latest_map();
  }
  transitionToMapper()

  //Check for new map to generate, reserved only for authenticated user w/ a matching uuid to the owner_uuid of the current world map
	if (get_auth_info() != null) {
		validateAccessToken().then(checkForNewBackup).catch(errorValidatingAccessToken);
	}
}

function transitionToMapper() {
	const loadingDiv = document.getElementById('loadingContainer');
  const mapperDiv = document.getElementById('mapContainer');
  loadingDiv.classList.replace('opacity-100','opacity-0');
  loadingDiv.classList.replace('z-[99]','z-1'); 
  mapperDiv.classList.replace('opacity-0','opacity-100');
  mapperDiv.classList.replace('z-1','z-40'); 
}

function bringLoadingScreenBack() {
	const loadingDiv = document.getElementById('loadingContainer');
  loadingDiv.classList.replace('opacity-0','opacity-100');
  loadingDiv.classList.replace('z-1','z-[99]'); 
}


function map_html(map_img_url) {
	htmlString = 
	`
	<div id="mapContainer" class="map-container absolute opacity-0 transition-opacity duration-500 z-1" style="width: 100vw; height: 100vh;">
		<div id="panzoom-container-element" class="panzoom-container custom-dark-gray-bg" style="overflow: hidden; touch-action: none;">
			<img id="panzoom-element" src="${map_img_url}" alt="Your image description" class="panzoom-element panzoom-img custom-mid-gray-bg" ondragstart="return false;">
		</div>
		
		<div id="menu-overlay-element" class="menu-overlay">

	    <div class="zoom-reset-zoom-container w-full pt-2 pb-4 px-4 flex justify-start">
	      <div class="zoom-hugging-container" style="min-width: 150px;">
	        <div class="zoom-buttons flex flex-row">
	          <button id="zoom-in-button" class="zoom-button text-xs bg-green-700 mr-1" style="cursor: pointer; pointer-events: auto; width: 50%;">
	          <div class="button-title"><i class="fa fa-plus"></i></div>
	          </button>
	          <button id="zoom-out-button" class="zoom-button bg-green-700 text-xs ml-1" style="cursor: pointer; pointer-events: auto; width: 50%;">
	            <div class="button-title"><i class="fa fa-minus"></i></div>
	          </button>
	        </div>
	        <div class="reset-button flex flex-row mt-2">
	          <button id="zoom-reset-button" class="zoom-reset text-xs bg-green-700" style="width: 100%;">
	            <div class="button-title">&nbsp;Reset&nbsp;</div>
	          </button>
	        </div>
	      </div>
	    </div>

		</div>
	</div>
	`;
	return htmlString
}

function loading_html() {
	return `
	<div id="loadingContainer" class="loading-container absolute w-full h-full flex justify-center items-center opacity-100 transition-opacity duration-500 z-[99] custom-dark-gray-bg">
	  <div class="max-w-lg max-h-lg mx-auto my-auto overflow-y-auto grow text-center">
	   <i class="text-5xl text-white fa fa-spinner fa-spin"></i>
	  </div>
	</div>
	`;
}

function configureMap() {
	const element = document.getElementById('panzoom-element');
	const panzoomInstance = Panzoom(element, {
		maxScale: 5,
		minScale: 0.75,
		smoothScroll: true,
		roundPixels: true,
		origin: "0%, 0%",
	});
	
	const zoomInButton = document.getElementById('zoom-in-button');
	const zoomOutButton = document.getElementById('zoom-out-button');
  const zoomResetButton = document.getElementById('zoom-reset-button');
  styleEnabledButton([zoomInButton, zoomOutButton, zoomResetButton]);
	zoomInButton.addEventListener('click', panzoomInstance.zoomIn);
	zoomOutButton.addEventListener('click', panzoomInstance.zoomOut);
	zoomResetButton.addEventListener('click', () => {
		panzoomInstance.pan(0, 0);
		panzoomInstance.zoom(1, { animate: true })
	});

	// Enable click and drag to pan
	let isPanning = false;
	element.addEventListener('mousedown', (e) => {
		e.preventDefault();
		isPanning = true;
		panzoomInstance.pause();
	});

	element.addEventListener('mousemove', (e) => {
		if (!isPanning) return;
		e.preventDefault();
		panzoomInstance.moveBy(e.movementX, e.movementY);
	});

	element.addEventListener('mouseup', () => {
		isPanning = false;
	});

	element.addEventListener('mouseleave', () => {
		isPanning = false;
	});
	
	menu_element = document.getElementById('menu-overlay-element');
	menu_element.addEventListener('wheel', (event) => {
		event.preventDefault();
	}, { passive: false });
	
	pz_container_element = document.getElementById('panzoom-container-element');
	pz_container_element.addEventListener('wheel', (event) => {
		event.preventDefault();
	}, { passive: false });
	
	element.parentElement.addEventListener('wheel', panzoomInstance.zoomWithWheel)
}

function getImageExpirationTime() {
  const currentTime = Math.floor(Date.now() / 1000);

  // Set the expiration time for the signed map URL (14.5 mins from now)
  const expirationTime = currentTime + 870;
}
