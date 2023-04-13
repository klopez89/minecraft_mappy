
$(document).ready(function() {

	document.body.style.fontFamily = "Minecrafty";

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

	const mapperHasMinReq = bucketName != null && blobPath != null && worldName != null && worldId != null && worldSlot != null && worldOwnerUUID != null;

	if (mapperHasMinReq) {
		localStorage.setItem("map_bucket_name", bucketName)
		localStorage.setItem("map_blob_path", blobPath);

		console.log(`map_blob_path is: ${blobPath}`)

		localStorage.setItem("selected_world_name", worldName);
		localStorage.setItem("selected_world_id", worldId);
		localStorage.setItem("selected_world_slot", worldSlot);
		localStorage.setItem("selected_world_owner_uuid", worldOwnerUUID);
		continueToLoadMapper();
	} else {
		console.log('Mapper doesnt have min requirements so we should route user to home page, or auth page. TBD')
	}
});

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

// minecraft_auth_info = checkForMinecraftAuthInfo()

// if (minecraft_auth_info != null) {
// 	fetchRealmsInfo(minecraft_auth_info)
// } else {
// 	console.log('Take user back to main auth page')
// 	window.location.href = "https://www.whollyaigame.com/minecraftauth"
// }






function fetchNewSignedMapImageULR(img_info) {
	$.ajax({
		url: 'https://minecraftmappy-5k3b37mzsa-ue.a.run.app/world/map/retrieve',
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
			} else {
	      localStorage.setItem('map_backup_date', backup_date);
	      localStorage.setItem('map_backup_id', backup_id);
	      presentMapExplorer(signed_img_url);
			}

			if (latest_blob_path != null) {
				console.log(`We have a newer map to load into! Show the user this option as a button! New blob_path: ${latest_blob_path}`)
				const latest_backup_id = response["latest_backup_id"];
				const latest_backup_date = response["latest_backup_date"];
				localStorage.setItem('latest_blob_path', latest_blob_path);
				localStorage.setItem('latest_backup_id',latest_backup_id);
				localStorage.setItem('latest_backup_date', latest_backup_date);
			}
		},
		error: function(xhr, status, error) {
			console.error('New signed world map img url fetch failed:', error);
		}
	});
}

	// access_token = request_json["access_token"]
	// username = request_json["username"]
	// uuid = request_json["uuid"]
	// worldId = request_json["worldId"]

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
	const url = 'https://minecraftmappy-5k3b37mzsa-ue.a.run.app/login/validate_access_token';

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
		url: 'https://minecraftmappy-5k3b37mzsa-ue.a.run.app/realms/latest_backup_info',
		method: 'POST',
		data: JSON.stringify(auth_info),
		contentType: "application/json",
		dataType: "json",
		success: function(response) {
			console.log('Latest backup info fetch successful:', response);
			const latest_backup_id = response["latest_backup_id"];
			const latest_backup_date = response["latest_backup_date"];

			const stored_latest_backup_id = localStorage.getItem('latest_backup_id');
			const stored_current_backup_id = localStorage.getItem('map_backup_id');

			const backup_id_to_compare_to = stored_latest_backup_id != null ? stored_latest_backup_id : stored_current_backup_id;

			if (backup_id_to_compare_to == latest_backup_id) {
				console.log('We already have the latest backup map');
			} else {
				console.log(`We can generate a newer world map, latest_backup_date: ${latest_backup_date}, so show generate button`);
			}
		},
		error: function(xhr, status, error) {
			console.error('Latest backup info fetch failed:', error);
		}
	});
}


function presentMapExplorer(signed_img_url) {
	// Fade out the existing div
	$('#realWorldSelectionContainer').fadeOut(500, function() {
	  // After the fade out animation is complete, remove the div from the DOM
	  $(this).remove();
	});

	// Add the map explorer to the body and hide it
	const map_explorer_html = map_html(signed_img_url);
	const map_explorer_element = $($.parseHTML(map_explorer_html)).hide();
  $('body').append(map_explorer_element);

  // Configure then fade in the map explorer
  configureMap()
  map_explorer_element.fadeIn(500);

  //Check for new map to generate, reserved only for authenticated user w/ a matching uuid to the owner_uuid of the current world map
	if (get_auth_info() != null) {
		validateAccessToken().then(checkForNewBackup).catch(errorValidatingAccessToken);
	}
}


function map_html(map_img_url) {
	htmlString = 
	`
	<div class="map-container" style="width: 100vw; height: 100vh; /* align-items: center; */">
		<div id="panzoom-container-element" class="panzoom-container" style="overflow: hidden; touch-action: none;">
			<img id="panzoom-element" src="${map_img_url}" alt="Your image description" class="panzoom-element panzoom-img" ondragstart="return false;">
		</div>
		
		<div id="menu-overlay-element" class="menu-overlay">

			<div class="relative">
			  <div class="slide-up-container">
			    <button class="absolute top-0 right-0 m-4 bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded" id="slide-button" style="cursor: pointer; pointer-events: auto; z-index: 30;">
			      Slide Up
			    </button>
			    <div class="fixed bottom-0 left-0 right-0 bg-white p-4 transform transition-transform duration-500 ease-in-out translate-y-full" id="slide-up-div">
			      <h1 class="text-lg font-bold mb-2">Slide Up Div</h1>
			      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi commodo vehicula ante, id facilisis leo consectetur sit amet. Nullam euismod sapien ac bibendum fringilla.</p>
			    </div>
			  </div>
			</div>

			<div class="zoom-reset-zoom-container w-full pt-2 pb-4 px-4 flex justify-end">
     		<div class="zoom-hugging-container" style="min-width: 150px;">
        	<div class="zoom-buttons flex flex-row">
					  <button id="zoom-in-button" class="zoom-button text-xs bg-green-700 hover:bg-green-900 text-white font-extrabold py-3 px-4 rounded mr-1" style="cursor: pointer; pointer-events: auto; width: 50%;">
					    <i class="fa fa-plus"></i>
					  </button>
					  <button id="zoom-out-button" class="zoom-button text-xs bg-green-700 hover:bg-green-900 text-white font-extrabold py-3 px-4 rounded ml-1" style="cursor: pointer; pointer-events: auto; width: 50%;">
					    <i class="fa fa-minus"></i>
					  </button>
					</div>
					<div class="reset-button flex flex-row mt-2">
					  <button class="zoom-reset text-xs bg-green-700 hover:bg-green-900 text-white font-extrabold py-3 px-4 rounded" style="width: 100%;">
					    &nbsp;Reset&nbsp;
					  </button>
					</div>
        </div>
      </div>

      <div class="menu-wrapper">

				<div class="menu-button-container w-full pt-2 pb-2 px-4">

					<div class="hidden-button flex justify-end">
			      <button class="show-menu bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
			        Menu
			      </button>
			    </div>

					<div class="world-info" style="color: white;">
	    			<div class="world-name text-xl">World Name</div>
				    <p class="hosted-by text-xs">hosted by klopez89</p>
				    <p class="backup-date-label text-xs text-slate-400">Last backup: &nbsp;April 11, 2023</p>
				  </div>

				  <div class="button-container flex justify-end" style="display: flex; align-items: center;">
			    	<button class="load-latest-map text-xs bg-yellow-500 hover:bg-yellow-700 text-white font-extrabold py-3 px-4 rounded mr-2">
			      	Load Latest Map
			    	</button>
			    	<button class="generate-new-map text-xs bg-orange-500 hover:bg-orange-700 text-white font-extrabold py-3 px-4 rounded">
			      	Generate New Map
			    	</button>
		  		</div>

		    </div>

	    </div>


		</div>
	</div>
	`;
	return htmlString
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
	zoomInButton.addEventListener('click', panzoomInstance.zoomIn);
	zoomOutButton.addEventListener('click', panzoomInstance.zoomOut);

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
	
	document.querySelector('.zoom-reset').addEventListener('click', () => {
		panzoomInstance.pan(0, 0);
		panzoomInstance.zoom(1, { animate: true })
	});
	
 window.addEventListener('wheel', (event) => {
		event.preventDefault();
	}, { passive: false });
	
	menu_element = document.getElementById('menu-overlay-element');
	menu_element.addEventListener('wheel', (event) => {
		event.preventDefault();
	}, { passive: false });
	
	pz_container_element = document.getElementById('panzoom-container-element');
	pz_container_element.addEventListener('wheel', (event) => {
		event.preventDefault();
	}, { passive: false });
	
	element.parentElement.addEventListener('wheel', panzoomInstance.zoomWithWheel)

	const menuWrapper = document.querySelector('.menu-wrapper');
  const hiddenButton = document.querySelector('.hidden-button');
  hiddenButton.addEventListener('click', () => {
    menuWrapper.classList.toggle('hidden');
    menuWrapper.classList.toggle('show-menu');
	});

  const slideButton = document.getElementById('slide-button');
  const slideUpContainer = document.querySelector('.slide-up-container');
  const slideUpDiv = document.getElementById('slide-up-div');
  slideButton.addEventListener('click', () => {
    const containerHeight = slideUpDiv.clientHeight;
    slideUpContainer.style.height = containerHeight + 'px';
    slideUpDiv.classList.toggle('translate-y-full');
    slideButton.classList.toggle('absolute');
    slideButton.classList.toggle('fixed');
    slideButton.classList.toggle('top-0');
    slideButton.classList.toggle('bottom-0');
    if (slideButton.classList.contains('fixed')) {
      slideUpContainer.style.height = 0;
    }
  });
}

function getImageExpirationTime() {
  const currentTime = Math.floor(Date.now() / 1000);

  // Set the expiration time for the signed map URL (14.5 mins from now)
  const expirationTime = currentTime + 870;
}
