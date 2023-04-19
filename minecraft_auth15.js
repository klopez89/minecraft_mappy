

document.addEventListener('DOMContentLoaded', function() {
  document.body.style.fontFamily = 'Minecrafty';
  document.body.style.height = "100%";
  const wasRedirected = checkForAuthRedirect();
  configurePage(wasRedirected);
});

window.onpageshow = function(event) {
  const queryString = window.location.search;
  console.log(`query string is: ${queryString}`);
  const urlParams = new URLSearchParams(queryString);
  const microsoft_code = urlParams.get('code');
  const wasRedirected = microsoft_code != null;

  if (event.persisted && wasRedirected === false) {
    location.reload(true);
  }
};

function checkForAuthRedirect() {
  const queryString = window.location.search;
  console.log(`query string is: ${queryString}`);
  const urlParams = new URLSearchParams(queryString);
  const microsoft_code = urlParams.get('code');
  const wasRedirected = microsoft_code != null;
  if (wasRedirected) {
    console.log(`microsoft_code is ${microsoft_code}`);
    beginMinecraftLogin();
  }
  return wasRedirected;
}

function configurePage(wasRedirectedFromMicrosoft) {
  const bg_div_html = backgroundDivHtml();
  const bg_div = $($.parseHTML(bg_div_html));
  $('body').append(bg_div);

  const sign_in_container_html = signInContainerHtml();
  const sing_in_container_div = $($.parseHTML(sign_in_container_html));
  if (wasRedirectedFromMicrosoft) {
    sing_in_container_div.find('#signInTextDiv').html(`Signing in &nbsp; <i class="fa fa-spinner fa-spin">`);
  }
  $('body').append(sing_in_container_div);

  const world_selection_html = realmWorldSelectionContainerHtml();
  const world_selection_div = $($.parseHTML(world_selection_html));
  $('body').append(world_selection_div);
}

function clickedSignInWithMicrosoft(button) {
  const signInTextDiv = document.getElementById('signInTextDiv');
  signInTextDiv.innerHTML = `Signing in &nbsp; <i class="fa fa-spinner fa-spin">`;
  button.disabled = true;
  beginMicrosoftLogin();
}

function beginMicrosoftLogin() {
  $.ajax({
    url: `${base_server_url}/login/microsoft`,
    method: 'POST',
    data: JSON.stringify({}),
    contentType: "application/json",
    dataType: "json",
    success: function(response) {
      console.log('Login successful:', response);
      login_data = response["login_data"];
      code_verifier = login_data["code_verifier"];
      login_url = login_data["login_url"];
      state = login_data["state"];

      localStorage.setItem('auth_code_verifier', code_verifier);
      localStorage.setItem('auth_state', state);

      // Redirect the user to another URL
      window.location.href = login_url;

    },
    error: function(xhr, status, error) {
      console.error('Login failed:', error);
    }
  });
}


function beginMinecraftLogin() {
  const auth_code_verifier = localStorage.getItem('auth_code_verifier');
  const auth_state = localStorage.getItem('auth_state');

  if (auth_code_verifier == null && auth_state == null) {
    console.log('We dont have code auth_code_verifier or auth_state so wont continue with minecraft login!');
    return
  }

  jsonObj = {
    'redirected_url': window.location.href,
    'auth_code_verifier': auth_code_verifier,
    'auth_state': auth_state
  }

  console.log(`the json obj for minecraft login is: ${jsonObj}`);

  $.ajax({
    url: `${base_server_url}/login/minecraft`,
    method: 'POST',
    data: JSON.stringify(jsonObj),
    contentType: "application/json",
    dataType: "json",
    success: function(response) {
      console.log('Minecraft login successful:', response);
      const minecraft_login_data = response["minecraft_login_data"];
      const access_token = minecraft_login_data["access_token"];
      const refresh_token = minecraft_login_data["refresh_token"];
      const username = minecraft_login_data["username"];
      const uuid = minecraft_login_data["uuid"];

      // Save acccess and refresh tokens to local storage
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      localStorage.setItem('username', username);
      localStorage.setItem('uuid', uuid);

      fetchRealmsInfo(username, uuid, access_token);
    },
    error: function(xhr, status, error) {
      console.error('Minecraft login failed:', error);
    }
  });
}



function fetchRealmsInfo(username, uuid, access_token) {
  minecraft_auth_info = {
    'username': username,
    'uuid': uuid,
    'access_token': access_token
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
      presentRealmWorldSelection(realm_servers, uuid)
    },
    error: function(xhr, status, error) {
      console.error('Realms info fetch failed:', error);
    }
  });
}


function realmWorldSelected(button) {
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

  const hasBlobPath = blobPath != null;

  if (hasBlobPath) {
    const bucketName = "minecraft_maps";
    showMessageAfterWorldSelection(hasBlobPath, button);
    setTimeout(function() {
      redirectToMapperPage(bucketName, blobPath, worldName, worldId, activeSlot, uuid, username);
    }, 800);
  } else if (access_token != null) {
    showMessageAfterWorldSelection(hasBlobPath, button);
    generateNewMapImage(world_info)
  } else {
    console.log('ran into error navigating user to a map from realm world selection');
  }
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

// world info has: uuid, username, active_slot, world_id, access_token
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
  const mapperUrl = "https://www.whollyaigame.com/mapper";
  const modifiedMapperUrl = `${mapperUrl}?${new URLSearchParams(queryParams).toString()}`;

  window.location.href = modifiedMapperUrl;
}

function resetSignInButton() {
  const signInTextDiv = document.getElementById('signInTextDiv');
  signInTextDiv.innerHTML = `Sign  in with Microsoft`;
  const signInButton = signInTextDiv.parentElement;
  signInButton.disabled = false;
}

function getImageExpirationTime() {
  const currentTime = Math.floor(Date.now() / 1000);

  // Set the expiration time for the signed map URL (14.5 mins from now)
  const expirationTime = currentTime + 870;
}


function presentRealmWorldSelection(realm_servers, uuid) {
  const realm_servers_html = generateCardHtml(realm_servers, uuid);
  const realm_servers_elements = $($.parseHTML(realm_servers_html));
  $('.world-card-container').append(realm_servers_elements);
  transitionToWorldSelection();
  resetSignInButton();
}

function transitionToWorldSelection() {
  const signInContainer = document.getElementById('signInContainer');
  const realWorldSelectionContainer = document.getElementById('realWorldSelectionContainer');
  signInContainer.classList.replace('opacity-100','opacity-0');
  signInContainer.classList.replace('z-30','z-10'); 
  realWorldSelectionContainer.classList.replace('opacity-0','opacity-100');
  realWorldSelectionContainer.classList.replace('z-10','z-30'); 
}//https://storage.googleapis.com/minecraft_maps/minecraft_mappy_bg1.png


function backgroundDivHtml() {
  return `
  <div class="w-full h-full absolute z-0">
    <div class="w-full h-full bg-gray-950 bg-opacity-90 absolute z-1"></div>
    <img src="https://storage.googleapis.com/minecraft_maps/minecraft_mappy_bg1_compressed.png" alt="Minecraft map" class="w-full h-full object-cover">
  </div>
  `;
}

function signInContainerHtml() {
  return `
  <div id="signInContainer" class="w-full h-full flex justify-center items-center absolute opacity-100 transition-opacity duration-500 z-30">
    <div class="max-w-lg max-h-lg mx-auto my-auto overflow-y-auto grow">

      <h2 id="selection-titlea" class="text-2xl font-bold mb-5 text-left text-shadow-style">Sign in</h2>
      <p class="text-md font-normal mb-20 text-left text-shadow-style">A Microsoft sign in is required to generate a Realm world map you host or find generated maps to Realm worlds you've joined.</p>

      <button onclick="clickedSignInWithMicrosoft(this)" class="minecraft-style text-shadow-style relative w-full pt-4 pb-5 font-bold">
        <div id="signInTextDiv" class="text-xl font-bold">Sign in with Microsoft</div>
      </button>

    </div>
  </div>
  `;
}

function realmWorldSelectionContainerHtml() {
  return `
  <div id="realWorldSelectionContainer" class="w-full h-full flex justify-center items-center relative opacity-0 transition-opacity duration-500 z-10">
    <div class="max-w-lg max-h-lg mx-auto my-auto overflow-y-auto grow">
      <h2 id="selection-title" class="text-2xl font-bold mb-20 text-center text-shadow-style">Select a Realm World</h2>
      <div class="world-card-container grid grid-cols-1 gap-4 pb-4">
      </div>
    </div>
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
    const isNotClickable = isOwnerOfRealm === false && blobPathExists === false;
    const cursorType = isNotClickable ? 'cursor-not-allowed not-clickable' : '';
    const notOwnerText = isNotClickable ?
      `<div class="bg-[#FFF5] text-gray-700 font-normal text-sm px-3 pb-3 pt-2" style="text-align: left;">
          <span style="display: inline-block; text-shadow:none;">Owner needs to generate a map first.</span>
      </div>` : '';
    const textClassAddIfNotClickable = isNotClickable ? 'text-gray-400' : '';

    htmlString += `
      <button onClick="realmWorldSelected(this)" class="minecraft-style text-shadow-style relative w-full pt-4 font-bold ${cursorType}" worldId="${jsonObj.id}" uuid="${jsonObj.ownerUUID}" host="${jsonObj.owner}" activeSlot="${jsonObj.activeSlot}" worldName="${jsonObj.name}" blobPath="${jsonObj.blobPath}">
        <div class="world-name-txt text-xl font-bold ${textClassAddIfNotClickable}">${jsonObj.name}</div>
        <div class="world-host-txt mt-2 font-normal pl-4 pr-4 pb-4 ${textClassAddIfNotClickable}">Hosted by ${jsonObj.owner}</div>
        ${notOwnerText}
      </button>
    `;
  });

  return htmlString;
}
