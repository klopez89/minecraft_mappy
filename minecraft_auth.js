

$(document).ready(function() {
  document.body.style.height = "100%";
  checkForAuthRedirect()
  configurePage()
});



function checkForAuthRedirect() {
  const queryString = window.location.search;
  console.log(`query string is: ${queryString}`);
  const urlParams = new URLSearchParams(queryString);
  const microsoft_code = urlParams.get('code');
  if (microsoft_code != null) {

    console.log(`microsoft_code is ${microsoft_code}`);
    beginMinecraftLogin()
  }
}

function configurePage() {
  $('#login-microsoft').click(function() {
    beginMicrosoftLogin()
  });
}

function beginMicrosoftLogin() {
  $.ajax({
    url: 'https://minecraftmappy-5k3b37mzsa-ue.a.run.app/login/microsoft',
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
    url: 'https://minecraftmappy-5k3b37mzsa-ue.a.run.app/login/minecraft',
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

      // const mapper_url = `https://www.whollyaigame.com/mapper`
      // window.location.href = mapper_url

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
    url: 'https://minecraftmappy-5k3b37mzsa-ue.a.run.app/realms',
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




function realmWorldSelected(event) {
  let accessToken = localStorage.getItem('access_token');
  let uuid = event.getAttribute('uuid');
  let username = event.getAttribute('host');
  let activeSlot = event.getAttribute('activeSlot');
  let worldId = event.getAttribute('worldId');
  let worldName = event.getAttribute('worldName');

  localStorage.setItem('selected_world_id', worldId);
  localStorage.setItem('selected_world_name', worldName);
  localStorage.setItem('selected_world_slot', activeSlot);
  localStorage.setItem('selected_world_owner_uuid', uuid);

  console.log(`Selected Realm World: UUID=${uuid}, Host=${username}, Active Slot=${activeSlot}, worldId=${worldId}, worldName=${worldName}`);

  world_info = {
    'uuid': uuid,
    'username': username,
    'active_slot': activeSlot,
    'world_id': worldId,
    'access_token': accessToken
  }

  generateNewMapImage(world_info)
}

// world info has: uuid, username, active_slot, world_id, access_token
function generateNewMapImage(world_info) {

  $.ajax({
    url: 'https://minecraftmappy-5k3b37mzsa-ue.a.run.app/world/map/generate',
    method: 'POST',
    data: JSON.stringify(world_info),
    contentType: "application/json",
    dataType: "json",
    success: function(response) {
      console.log('World map fetch successful:', response);

      const map_img_info = response["map_img_info"];
      const latest_backup_id = response["latest_backup_id"];
      const latest_backup_date = response["latest_backup_date"];

      const blob_path = map_img_info["blob_path"];
      const bucket_name = map_img_info["bucket_name"];
      const signed_img_url = map_img_info["signed_img_url"];
      const map_img_expiration = getImageExpirationTime();

      //Save fetched info locally (blob path unique per world id)
      localStorage.setItem('map_blob_path', blob_path);
      localStorage.setItem('map_bucket_name', bucket_name);
      localStorage.setItem('map_img_url', signed_img_url);
      localStorage.setItem('map_img_expiration', map_img_expiration);
      localStorage.setItem('latest_backup_id', latest_backup_id);
      localStorage.setItem('latest_backup_date', latest_backup_date);

      const world_name = localStorage.getItem('selected_world_name');
      const world_id = localStorage.getItem('selected_world_id');
      const world_slot = localStorage.getItem('selected_world_slot');
      const world_owner_uuid = localStorage.getItem('selected_world_owner_uuid');

      redirectToMapperPage(bucket_name, blob_path, world_name, world_id, world_slot, world_owner_uuid);
    },
    error: function(xhr, status, error) {
      console.error('World map fetch failed:', error);
    }
  });
}

function redirectToMapperPage(bucket_name, blob_path, world_name, world_id, world_slot, world_owner_uuid) {
  const queryParams = {
    'bucket_name': bucket_name,
    'blob_path': blob_path,
    'world_name': world_name,
    'world_id': world_id,
    'world_slot': world_slot,
    'world_owner_uuid': world_owner_uuid,
  };
  const mapperUrl = "https://www.whollyaigame.com/mapper";
  const modifiedMapperUrl = `${mapperUrl}?${new URLSearchParams(queryParams).toString()}`;

  window.location.href = modifiedMapperUrl;
}

function getImageExpirationTime() {
  const currentTime = Math.floor(Date.now() / 1000);

  // Set the expiration time for the signed map URL (14.5 mins from now)
  const expirationTime = currentTime + 870;
}



function presentRealmWorldSelection(realm_servers, uuid) {
  const realm_servers_html = generateCardHtml(realm_servers, uuid);
  const realm_servers_elements = $($.parseHTML(realm_servers_html));
  $('body').append(realm_servers_elements);
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
