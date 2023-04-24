

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
        <div class="world-card-container grid grid-cols-1 gap-4 pb-4 overflow-y-auto max-h-80">
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
  const realWorldSelectionContainer = document.getElementById('realWorldSelectionContainer');
  const worldSelectionBg = document.getElementById('worldSelectionBg');

  realWorldSelectionContainer.classList.replace('opacity-100', 'opacity-0');
  realWorldSelectionContainer.classList.replace('z-[51]', 'z-0');

  worldSelectionBg.classList.replace('opacity-100', 'opacity-0');
  worldSelectionBg.classList.replace('z-50', 'z-0');
}