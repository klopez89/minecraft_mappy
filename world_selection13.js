

function fetchWorldList() {
  minecraft_auth_info = {
    'username': localStorage.getItem('username'),
    'uuid': localStorage.getItem('uuid'),
    'access_token': localStorage.getItem('access_token')
  }
  $.ajax({
    url: `${base_server_url}/realms`,
    method: 'POST',
    data: JSON.stringify(minecraft_auth_info),
    contentType: "application/json",
    dataType: "json",
    success: function(response) {
      console.log('Realms info fetch successful:', response);
      const realms_info = response["realms_info"];
      const realm_servers = realms_info["servers"];
      presentRealmWorldSelection(realm_servers, minecraft_auth_info['uuid'])
    },
    error: function(xhr, status, error) {
      console.error('Realms info fetch failed:', error);
    }
  });
}

function worldSelected(button) {
  let accessToken = localStorage.getItem('access_token');
  let uuid = button.getAttribute('uuid');
  let username = button.getAttribute('host');
  let activeSlot = button.getAttribute('activeSlot');
  let worldId = button.getAttribute('worldId');
  let worldName = button.getAttribute('worldName');
  let blobPath = button.getAttribute('blobPath');

  localStorage.setItem('selected_world_id', worldId);
  localStorage.setItem('selected_world_name', worldName);
  localStorage.setItem('selected_world_slot', activeSlot);
  localStorage.setItem('selected_world_owner_uuid', uuid);
  localStorage.setItem('selected_world_owner_username', username);

  console.log(`Selected Realm World: UUID=${uuid}, Host=${username}, Active Slot=${activeSlot}, worldId=${worldId}, worldName=${worldName}`);

  world_info = {
    'uuid': uuid,
    'username': username,
    'active_slot': activeSlot,
    'world_id': worldId,
    'access_token': accessToken
  }

  const hasBlobPath = blobPath != null || blobPath != "undefined";
  console.log(`The blob path upon world selection: ${blobPath}`);

  if (hasBlobPath) {
    const bucketName = "minecraft_maps";
    console.log(`About to try to redirect to mappy`);
    showMessageAfterWorldSelection(hasBlobPath, button);
    setTimeout(function() {
      redirectToMapperPage(bucketName, blobPath, worldName, worldId, activeSlot, uuid, username);
    }, 800);
  } else if (access_token != null) {
    console.log(`About to try to generate a new map`);
    showMessageAfterWorldSelection(hasBlobPath, button);
    generateNewMapImage(world_info)
  } else {
    console.log('ran into error navigating user to a map from realm world selection');
  }
}

function generateNewMapImage(world_info) {
  $.ajax({
    url: `${base_server_url}/world/map/generate`,
    method: 'POST',
    data: JSON.stringify(world_info),
    contentType: "application/json",
    dataType: "json",
    success: function(response) {
      console.log('World map generation successful:', response);

      const blob_path = response["blob_path"];
      const bucket_name = response["bucket_name"];

      const world_name = localStorage.getItem('selected_world_name');
      const world_id = localStorage.getItem('selected_world_id');
      const world_slot = localStorage.getItem('selected_world_slot');
      const world_owner_uuid = localStorage.getItem('selected_world_owner_uuid');
      const world_owner = localStorage.getItem('selected_world_owner_username');

      redirectToMapperPage(bucket_name, blob_path, world_name, world_id, world_slot, world_owner_uuid, world_owner);
    },
    error: function(xhr, status, error) {
      console.error('World map fetch failed:', error);
    }
  });
}

function redirectToMapperPage(bucket_name, blob_path, world_name, world_id, world_slot, world_owner_uuid, world_owner) {
  const queryParams = {
    'bucket_name': bucket_name,
    'blob_path': blob_path,
    'world_name': world_name,
    'world_id': world_id,
    'world_slot': world_slot,
    'world_owner_uuid': world_owner_uuid,
    'world_owner': world_owner
  };
  const mapperUrl = base_site_url + map_page; // Constants from webflow site
  const modifiedMapperUrl = `${mapperUrl}?${new URLSearchParams(queryParams).toString()}`;

  window.location.href = modifiedMapperUrl;
}

function showMessageAfterWorldSelection(hasBlobPath, button) {
  const worldNameTextElement = button.querySelector('div.world-name-txt');
  const worldHostTextElement = button.querySelector('div.world-host-txt');
  const routingTypeText = hasBlobPath ? 'Loading map' : 'Generating 1st map';

  worldNameTextElement.innerHTML = `${routingTypeText}  &nbsp; <i class="fa fa-spinner fa-spin"></i>`;
  worldHostTextElement.innerHTML = '';
  button.disabled = true;
  button.style.pointerEvents = 'none';
}



function worldSelectionContainerHtml() {
  return `
  <div id="realWorldSelectionContainer" class="relative w-full h-full opacity-0 transition-opacity duration-500 z-0">

    <div class="absolute top-0 right-0 mt-6 mr-6">
      <button id="exit-world-selection-button" type="button" class="rounded-md bg-transaprent text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
        <span class="sr-only">Close panel</span>
        <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <div class="w-full h-full flex justify-center items-center ">
      <div class="max-w-lg mx-auto my-auto grow">
        <h2 id="selection-title" class="text-2xl font-bold mb-20 text-center text-shadow-style">Select a Realm World</h2>
        <div id="worldCardContainer" class="world-card-container grid grid-cols-1 gap-4 pb-4 overflow-y-auto max-h-80">
        </div>
      </div>
    </div>

  </div>
  `;
}

function backgroundDivHtml() {
  return `
  <div id="worldSelectionBg" class="w-full h-full absolute opacity-0 transition-opacity duration-500 z-0">
    <div class="w-full h-full bg-gray-950 bg-opacity-90 absolute z-1"></div>
    <img src="https://storage.googleapis.com/minecraft_maps/minecraft_mappy_bg1_compressed.png" alt="Minecraft map" class="w-full h-full object-cover">
  </div>
  `;
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
    const blobPathExists = jsonObj.blobPath != null;
    const hasABackup = jsonObj.hasABackup === "true";
    const mapGenNeededFromOwner = blobPathExists === false && isOwnerOfRealm === false;
    const doesOwnButNoBackupToGenMap = blobPathExists === false && isOwnerOfRealm === true && hasABackup === false
    const isNotClickable = mapGenNeededFromOwner || doesOwnButNoBackupToGenMap;
    const cursorType = isNotClickable ? 'cursor-not-allowed not-clickable' : '';
    var notClickableText = '';

    if (mapGenNeededFromOwner) {
      notClickableText = 'Owner needs to generate a map first.';
    } else if (doesOwnButNoBackupToGenMap) {
      notClickableText = 'No backup available yet.';
    }

    const notClickableHtml = isNotClickable ? 
    `<div class="bg-[#FFF5] text-gray-700 font-normal text-sm px-3 pb-3 pt-2" style="text-align: left;">
          <span style="display: inline-block; text-shadow:none;">${notClickableText}</span>
      </div>` : '';

    const textClassAddIfNotClickable = isNotClickable ? 'text-gray-400' : '';

    htmlString += `
      <button onClick="worldSelected(this)" class="minecraft-style text-shadow-style relative w-full pt-4 font-bold ${cursorType}" worldId="${jsonObj.id}" uuid="${jsonObj.ownerUUID}" host="${jsonObj.owner}" activeSlot="${jsonObj.activeSlot}" worldName="${jsonObj.name}" blobPath="${jsonObj.blobPath}" hasABackup="${jsonObj.hasABackup}">
        <div class="world-name-txt text-xl font-bold ${textClassAddIfNotClickable}">${jsonObj.name}</div>
        <div class="world-host-txt mt-2 font-normal pl-4 pr-4 pb-4 ${textClassAddIfNotClickable}">Hosted by ${jsonObj.owner}</div>
        ${notClickableHtml}
      </button>
    `;
  });

  return htmlString;
}

function presentRealmWorldSelection(realm_servers, uuid) {
  const realm_servers_html = generateCardHtml(realm_servers, uuid);
  const realm_servers_elements = $($.parseHTML(realm_servers_html));
  $('.world-card-container').append(realm_servers_elements);
  transitionInWorldSelection();
}

function configureWorldSelectionUI() {
  const bg_div_html = backgroundDivHtml();
  const bg_div = $($.parseHTML(bg_div_html));
  $('body').append(bg_div);

  const world_selection_html = worldSelectionContainerHtml();
  const world_selection_div = $($.parseHTML(world_selection_html));
  $('body').append(world_selection_div);

  const exitWorldSelectionButton = document.getElementById('exit-world-selection-button');

  exitWorldSelectionButton.addEventListener('click', function() {
    transitionOutWorldSelection();
  });
}

function transitionInWorldSelection() {
  const realWorldSelectionContainer = document.getElementById('realWorldSelectionContainer');
  const worldSelectionBg = document.getElementById('worldSelectionBg');

  realWorldSelectionContainer.classList.replace('opacity-0', 'opacity-100');
  realWorldSelectionContainer.classList.replace('z-0', 'z-[51]');

  worldSelectionBg.classList.replace('opacity-0', 'opacity-100');
  worldSelectionBg.classList.replace('z-0', 'z-50');
}


function transitionOutWorldSelection() {
  const worldCardContainer = document.getElementById('worldCardContainer');
  worldCardContainer.innerHTML = '';

  const realWorldSelectionContainer = document.getElementById('realWorldSelectionContainer');
  const worldSelectionBg = document.getElementById('worldSelectionBg');

  realWorldSelectionContainer.classList.replace('opacity-100', 'opacity-0');
  realWorldSelectionContainer.classList.replace('z-[51]', 'z-0');

  worldSelectionBg.classList.replace('opacity-100', 'opacity-0');
  worldSelectionBg.classList.replace('z-50', 'z-0');
}