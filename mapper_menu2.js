

function add_slide_over_menu() {
  const worldName = localStorage.getItem('selected_world_name');
  const worldOwner = localStorage.getItem('selected_world_owner_username');
  const backupDate = localStorage.getItem('map_backup_date');

  const has_newer_map_to_load = false;
  const has_new_map_to_generate = false;
  const is_auth_user_host = false;
  const host = "";

  const loadLatestMapHTML = load_latest_map_html(has_newer_map_to_load);
  const generateNewMapHTML = generate_new_map_html(has_new_map_to_generate, is_auth_user_host, host);

  const slideOutMenuHTML = menu_html(loadLatestMapHTML, generateNewMapHTML);

  const parser = new DOMParser();
  const slideOutMenu_element = parser.parseFromString(slideOutMenuHTML, 'text/html').body.firstChild;

  slideOutMenu_element.classList.toggle('translate-x-full');
  document.body.appendChild(slideOutMenu_element);
  configure_slide_over_menu();
}

function configure_slide_over_menu() {
  const exitMenuPanelButton = document.getElementById('exit-menu-button');
  const slideOverPanel = document.getElementById('slide-over-panel');
  const menuButton = document.getElementById('menu-button');
  const menuUnderlay = document.getElementById('menu-underlay');
  const tapCloseContainer = document.getElementById('tap-close-layer');

  exitMenuPanelButton.addEventListener('click', function() {
    slideOverPanel.classList.toggle('translate-x-full');
  });

  menuButton.addEventListener('click', function() {
    slideOverPanel.classList.toggle('translate-x-full');
  });

  tapCloseContainer.addEventListener('click', function(event) {
    if (event.target === tapCloseContainer && slideOverPanel.classList.contains('showing')) {
        slideOverPanel.classList.toggle('translate-x-full');
        slideOverPanel.classList.toggle('showing');
    }
  });
}


function load_latest_map_html(has_newer_map_to_load) {
  if (has_newer_map_to_load) {
    const latestBlobPath = localStorage.getItem('latest_blob_path');
    const latestBackupDate = localStorage.getItem('map_backup_date');
    return `
      <button id="load-latest-button" latestBlobPath="${latestBlobPath}" class="block load-latest-map text-xs bg-yellow-500 hover:bg-yellow-700 text-white font-extrabold py-3 px-4 rounded mr-2 mb-1 mt-8">
        Load Latest Map
      </button>
      <p class="small-mapper-font text-slate-300 mb-5 text-slate-500 pl-1">Latest map from ${latestBackupDate} is available.</p>
                
    `;
  } else {
    return `
      <button id="load-latest-button" class="block load-latest-map text-xs bg-gray-500 text-gray-400 font-extrabold py-3 px-4 rounded mr-2 mb-1 mt-8">
        Load Latest Map
      </button>
      <p class="small-mapper-font text-slate-300 mb-5 text-slate-500 pl-1">No new map found. Refresh page to check again.</p>    
    `;
  }
}

function generate_new_map_html(has_new_map_to_generate, is_auth_user_host, host) {
  if (has_new_map_to_generate) {
    return `
      <button id="gen-map-button" class="block generate-new-map text-xs bg-orange-500 hover:bg-orange-700 text-white font-extrabold py-3 px-4 rounded mb-1">
        Generate New Map
      </button>
      <p class="small-mapper-font text-slate-300 mb-0 text-slate-500 pl-1">If new backup is found, world host can generate a new map.</p>
    `;
  } else {
    const no_new_backup_txt = 'No new backup found. Refresh page to check again.';
    const not_authorized_txt = `Only ${host} can generate a new map, if newer backup is available.`;
    const subtext = is_auth_user_host ? no_new_backup_txt : not_authorized_txt;
    return `
      <button id="gen-map-button" class="block generate-new-map text-xs bg-gray-500 text-gray-400 font-extrabold py-3 px-4 rounded mb-1">
        Generate New Map
      </button>
      <p class="small-mapper-font text-slate-300 mb-0 text-slate-500 pl-1">${subtext}</p>
    `;
  }
}

function menu_html(load_latest_html, generate_new_html) {
  htmlString = `

  <div id="slide-out-menu" class="relative z-10" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">


    <!--
      Background backdrop, show/hide based on slide-over state.

      Entering: "ease-in-out duration-500"
        From: "opacity-0"
        To: "opacity-100"
      Leaving: "ease-in-out duration-500"
        From: "opacity-100"
        To: "opacity-0"
    -->
    <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity ease-in-out duration-500"></div>




    <div class="fixed inset-0 overflow-hidden">
      <div id="tap-close-layer" class="absolute inset-0 overflow-hidden">

        <!--           <div id="menu-underlay" class="absolute bg-red-300 pointer-events-none h-full"></div> -->

        <div class="fixed pointer-events-none inset-y-0 right-0 flex max-w-full pl-10">




          <button id="menu-button" class="pointer-events-auto absolute bottom-4 right-4 py-3 px-4 bg-blue-500 hover:bg-blue-700 text-white rounded-md shadow-md">
            Menu
          </button>




          <div id="slide-over-panel" class="pointer-events-auto w-screen max-w-md transform transition ease-in-out duration-500 sm:duration-700 showing">
            <div class="slider-over-bg flex h-full flex-col overflow-y-scroll py-6 shadow-xl">
              <div class="px-4 sm:px-6 mb-2">
                <div class="flex items-start justify-between">

                  <div class="world-info">
                    <div class="world-name text-slate-300 text-xl">World Name</div>
                    <p class="hosted-by small-mapper-font text-slate-300 mt-1">hosted by klopez89</p>
                    <p class="backup-date-label text-slate-500 mt-1">Last backup: &nbsp;April 11, 2023</p>
                  </div>




                  <div class="ml-3 flex h-7 items-center">
                    <button id="exit-menu-button" type="button" class="rounded-md bg-transaprent text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                      <span class="sr-only">Close panel</span>
                      <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              <div class="menu-content relative mt-6 flex-1 flex flex-col px-4 sm:px-6 pb-8">
                <!-- Your content -->
                <div>
                  ${load_latest_html}
                </div>

                <div>
                  ${generate_new_html}
                </div>


                <div class="flex-1 mt-10">
                  <div class="flex flex-col justify-end h-full">
                    <div class="flex justify-center pb-1">
                      <img class="max-h-16" src="https://storage.googleapis.com/minecraft_maps/bnw_mappy_logo.png" alt="Image description">
                    </div>
                    <div class="flex justify-center">
                      <p class="small-mapper-font text-slate-300 mb-0 text-slate-500 pl-1">Minecraft Mapper, 2023</p>
                    </div>
                  </div>
                </div>

              </div>

              <div class="mt-6 flex justify-end px-5">
                <button class="generate-new-map text-xs bg-blue-500 hover:bg-blue-700 text-white font-extrabold py-3 px-4 rounded">
                  Sign in with Microsoft
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  `;
}