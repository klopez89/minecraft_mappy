
$(document).ready(function() {
	document.body.style.height = "100%";
	
	minecraft_auth_info = checkForMinecraftAuthInfo()

	if (minecraft_auth_info != null) {
		fetchRealmsInfo(minecraft_auth_info)
	} else {
		console.log('Take user back to main auth page')
		window.location.href = "https://www.whollyaigame.com/minecraftauth"
	}
});



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

function fetchRealmsInfo(minecraft_auth_info) {
	$.ajax({
		url: 'https://minecraftmappy-5k3b37mzsa-ue.a.run.app/realms',
		method: 'POST',
		data: JSON.stringify(minecraft_auth_info),
		contentType: "application/json",
		dataType: "json",
		success: function(response) {
			console.log('Realms info fetch successful:', response);
			const uuid = minecraft_auth_info["uuid"];
			const realms_info = response["realms_info"];
			const realm_servers = realms_info["servers"];
			presentRealmWorldSelection(realm_servers, uuid)

			for (const server of realm_servers) {
				console.log(`A realm server: ${JSON.stringify(server)}`);
			}
		},
		error: function(xhr, status, error) {
			console.error('Realms info fetch failed:', error);
		}
	});
}

function realmWorldSelected(event) {
	// Get the selected button element and its attributes
	let uuid = event.getAttribute('uuid');
	let username = event.getAttribute('host');
	let activeSlot = event.getAttribute('activeSlot');
	let worldId = event.getAttribute('worldId');
	let worldName = event.getAttribute('worldName');

	// Do something with the selected button element and its attributes
	console.log(`Selected Realm World: UUID=${uuid}, Host=${username}, Active Slot=${activeSlot}, worldId=${worldId}, worldName=${worldName}`);

	world_info = {
		'uuid': uuid,
		'username': username,
		'activeSlot': activeSlot,
		'worldId': worldId,
		'worldName': worldName
	}

	generateNewMapImage(world_info)
}

function generateNewMapImage(world_info) {
	const access_token = localStorage.getItem('access_token');
	world_info["access_token"] = access_token;

	$.ajax({
		url: 'https://minecraftmappy-5k3b37mzsa-ue.a.run.app/world/map/generate',
		method: 'POST',
		data: JSON.stringify(world_info),
		contentType: "application/json",
		dataType: "json",
		success: function(response) {
			console.log('World map fetch successful:', response);

			const map_img_info = response["map_img_info"];
			const blob_path = map_img_info["blob_path"];
			const bucket_name = map_img_info["bucket_name"];
			const signed_img_url = map_img_info["signed_img_url"];
			const world_name = world_info["worldName"];
			const map_img_expiration = getImageExpirationTime();

			//Save fetched info locally (blob path unique per world id)
			localStorage.setItem('map_blob_path', blob_path);
			localStorage.setItem('map_bucket_name', bucket_name);
			localStorage.setItem('map_img_url', signed_img_url);
			localStorage.setItem('map_img_expiration', map_img_expiration);
			localStorage.setItem('world_name', world_name);

			updateMapperURLToBeSharable(bucket_name, blob_path, world_name);
			presentMapExplorer(signed_img_url);
		},
		error: function(xhr, status, error) {
			console.error('World map fetch failed:', error);
		}
	});
}

function updateMapperURLToBeSharable(bucket_name, blob_path, world_name) {
	// Get the current URL and parse the query parameters
	const urlParams = new URLSearchParams(window.location.search);

	// Add a new query parameter
	urlParams.set('bucket_name', bucket_name);
	urlParams.set('blob_path', blob_path);
	urlParams.set('world_name', world_name);

	// Get the modified URL with the new query parameter
	const newUrl = `${window.location.pathname}?${urlParams.toString()}`;

	// Modify the URL without refreshing the page
	history.pushState(null, null, newUrl);
}

function getImageExpirationTime() {
	const currentTime = Math.floor(Date.now() / 1000);

	// Set the expiration time for the signed map URL (14.5 mins from now)
	const expirationTime = currentTime + 870;
}

function fetchNewSignedMapImageULR(world_info) {
	const access_token = localStorage.getItem('access_token');
	world_info["access_token"] = access_token;

	$.ajax({
		url: 'https://minecraftmappy-5k3b37mzsa-ue.a.run.app/world/map/retrive',
		method: 'POST',
		data: JSON.stringify(world_info),
		contentType: "application/json",
		dataType: "json",
		success: function(response) {
			console.log('World map signed url fetch successful:', response);

			map_img_url = response["map_img_url"];

		},
		error: function(xhr, status, error) {
			console.error('World map fetch failed:', error);
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


function presentRealmWorldSelection(realm_servers, uuid) {
	const realm_servers_html = generateCardHtml(realm_servers, uuid);
	const realm_servers_elements = $($.parseHTML(realm_servers_html));
	$('body').append(realm_servers_elements);
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

function generateCardHtml(jsonArray, uuid) {
	let htmlString = '';

	// Sort the array so that objects with matching UUIDs are at the front
	jsonArray.sort((a, b) => {
		if (a.ownerUUID === uuid && b.ownerUUID !== uuid) {
			return -1;
		}
		if (b.ownerUUID === uuid && a.ownerUUID !== uuid) {
			return 1;
		}
		return 0;
	});

	jsonArray.forEach(jsonObj => {
		console.log(`jsonObj.ownerUUID: ${jsonObj.ownerUUID}, uuid: ${uuid}`);
		const isOwnerOfRealm = jsonObj.ownerUUID === uuid;
		let notClickable = isOwnerOfRealm ? '' : 'cursor-not-allowed';
		let notOwnerText = isOwnerOfRealm ? '' : '<div class="absolute bottom-0 left-0 bg-gray-300 text-gray-500 font-normal italic px-2 py-1 rounded-tr-md rounded-bl-md">Only owner can select</div>';
		let buttonColorStyle = isOwnerOfRealm ? 'hover:bg-gray-300 text-black bg-gray-200' : 'text-gray-500 bg-gray-200'

		htmlString += `
			<button onClick="realmWorldSelected(this)" class="relative shadow-md w-full h-32 p-4 rounded-lg font-bold ${buttonColorStyle} ${notClickable}" worldId="${jsonObj.id}" uuid="${jsonObj.ownerUUID}" host="${jsonObj.owner}" activeSlot="${jsonObj.activeSlot}" worldName="${jsonObj.name}">
				<div class="text-xl font-bold">${jsonObj.name}</div>
				<div class="mt-2 font-normal">Hosted by ${jsonObj.owner}</div>
				${notOwnerText}
			</button>
		`;
	});

	return `
	<div id="realWorldSelectionContainer" class="w-full h-full flex justify-center items-center">
		<div class="max-w-lg max-h-lg mx-auto my-auto overflow-y-auto grow">
			<h2 class="text-xl font-bold mb-10 text-center">Select a Realm World</h2>
			<div class="grid grid-cols-1 gap-4 pb-4">
				${htmlString}
			</div>
		</div>
	</div>
	`;
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

