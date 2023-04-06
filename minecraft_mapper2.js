
$(document).ready(function() {

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
	if (hasLatestMapImgUrlExpired()) {
		// fetch new signed img url
		requestData = {
			'bucket_name': localStorage.getItem('map_bucket_name'),
			'blob_path': localStorage.getItem('map_blob_path')
		}
		fetchNewSignedMapImageULR(requestData)
	} else {
		// get and use the existing img url
		const map_img_url = localStorage.getItem('map_img_url');
		presentMapExplorer(map_img_url);
	}
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
      const map_img_expiration = getImageExpirationTime();

      localStorage.setItem('map_img_url', signed_img_url);
      localStorage.setItem('map_img_expiration', map_img_expiration);

      presentMapExplorer(signed_img_url);
		},
		error: function(xhr, status, error) {
			console.error('New signed world map img url fetch failed:', error);
		}
	});
}

function fetchLatestBackupInfo(world_info) {
	const access_token = localStorage.getItem('access_token');
	world_info["access_token"] = access_token;

	$.ajax({
		url: 'https://minecraftmappy-5k3b37mzsa-ue.a.run.app/realms/latest_backup_info',
		method: 'POST',
		data: JSON.stringify(world_info),
		contentType: "application/json",
		dataType: "json",
		success: function(response) {
			console.log('Latest backup info fetch successful:', response);
			const latest_backup_id = response["latest_backup_id"];
			const latest_backup_date = response["latest_backup_date"];

			const stored_backup_id = localStorage.getItem('latest_backup_id');
			if (stored_backup_id == latest_backup_id) {
				console.log('We already have the latest backup map');
			} else {
				console.log('We will need to fetch the latest world map');
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
}


function map_html(map_img_url) {
	htmlString = 
	`
	<div class="map-container" style="width: 100vw; height: 100vh; /* align-items: center; */">
		<div id="panzoom-container-element" class="panzoom-container" style="overflow: hidden; touch-action: none;">
			<img id="panzoom-element" src="${map_img_url}" alt="Your image description" class="panzoom-element panzoom-img" ondragstart="return false;">
		</div>
		<div id="menu-overlay-element" class="menu-overlay">
			<button class="zoom-reset bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
				<i class="fas fa-search-minus"></i>
				Reset Zoom
			</button>
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
		smoothScroll: false,
		roundPixels: true,
		origin: "0%, 0%",
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
}

function getImageExpirationTime() {
  const currentTime = Math.floor(Date.now() / 1000);

  // Set the expiration time for the signed map URL (14.5 mins from now)
  const expirationTime = currentTime + 870;
}
