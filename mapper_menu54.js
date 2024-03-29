
window.addEventListener('beforeunload', function(event) {
  const slideOverPanel = document.getElementById('slide-over-panel');
  if (slideOverPanel.classList.contains('showing')) {
    const exitMenuPanelButton = document.getElementById('exit-menu-button');
    exitMenuPanelButton.click();
  }
});

function add_slide_over_menu(is_authenticated) {

  console.log(`is_authenticated value from add_slide_over_menu: ${is_authenticated}`);

  const worldName = localStorage.getItem('selected_world_name');
  const worldOwner = localStorage.getItem('selected_world_owner_username');
  const backupDate = localStorage.getItem('map_backup_date');
  const authUser = localStorage.getItem('username');
  const is_auth_user_host = worldOwner === authUser;

  const loadLatestMapHTML = load_latest_map_html();
  const generateNewMapHTML = generate_new_map_html(is_auth_user_host, worldOwner);

  const slideOutMenuHTML = menu_html(worldName, worldOwner, backupDate, loadLatestMapHTML, generateNewMapHTML, is_authenticated);

  const slideOutMenu_element = $($.parseHTML(slideOutMenuHTML));
  const slideOutPanel_element = slideOutMenu_element.find('#slide-over-panel');

  slideOutPanel_element.toggleClass('translate-x-full'); //sets the panel of the menu to be initially hidden
  $('body').append(slideOutMenu_element);
  configure_slide_over_menu();
  configureAuthButton();
}

function configure_slide_over_menu() {
  const exitMenuPanelButton = document.getElementById('exit-menu-button');
  const slideOverPanel = document.getElementById('slide-over-panel');
  const menuButton = document.getElementById('menu-button');
  const menuUnderlay = document.getElementById('menu-underlay');
  const tapCloseContainer = document.getElementById('tap-close-layer');
  const slideMenuBg = document.getElementById('slide-menu-bg');
  const loadLatestMapButton = document.getElementById('load-latest-button');
  const genMapButton = document.getElementById('gen-map-button');
  const changeWorldButton = document.getElementById('change-world');

  styleDisabledButton([loadLatestMapButton, genMapButton]);
  styleEnabledButton([menuButton]);

  if (changeWorldButton != null) {
    styleEnabledButton([changeWorldButton]);

    changeWorldButton.addEventListener('click', function() {
      showChangeWorldButtonLoadingState();

      validateAccessToken()
      .then(() => {
        return fetchWorldList();
      })
      .then(() => {
        setTimeout(function() {
          resetChangeWorldButton();
        }, 500);
      })
      .catch((error) => {
        errorValidatingAccessToken(error);
        resetChangeWorldButton();
      });
    });
  }

  exitMenuPanelButton.addEventListener('click', function() {
    toggleSlideMenu(slideOverPanel, slideMenuBg);
  });

  menuButton.addEventListener('click', function() {
    toggleSlideMenu(slideOverPanel, slideMenuBg);
  });

  tapCloseContainer.addEventListener('click', function(event) {
    if (event.target === tapCloseContainer && slideOverPanel.classList.contains('showing')) {
      toggleSlideMenu(slideOverPanel, slideMenuBg);
    }
  });

  loadLatestMapButton.addEventListener('click', function(event) {
    loadLatestMapButton.disabled = true;
    loadLatestMapButton.innerHTML = 'Loading <i class="fa fa-spinner fa-spin"></i>';
    loadLatestMapButton.classList.remove('hover:bg-yellow-700');
    latest_blob_path = localStorage.getItem('latest_blob_path');
    setTimeout(function() {
      revertLoadLatestMapButtonState();
      dismissSlideOutMenu();
      redirectToLatestMap(latest_blob_path);
    }, 500);
  });

  genMapButton.addEventListener('click', function() {
    genMapButton.disabled = true;
    genMapButton.classList.toggle('not-clickable');
    const buttonTitle = genMapButton.querySelector('.button-title');
    buttonTitle.innerHTML = 'Generating &nbsp; <i class="fa fa-spinner fa-spin"></i>';
    
    validateAccessToken()
    .then(() => triggerMapGeneration())
    .catch(errorValidatingAccessToken);
  });
}

function configureAuthButton() {
  const is_signed_in = is_authenticated();
  const authButton = document.getElementById('auth-button');
  const buttonTitle = authButton.querySelector('.button-title');

  styleEnabledButton([authButton]);

  if (is_signed_in) {
    buttonTitle.innerHTML = 'Sign out';
    authButton.setAttribute('signedIn', 'true');
  } else {
    buttonTitle.innerHTML = 'Sign in';
    authButton.setAttribute('signedIn', 'false');
  }

  authButton.addEventListener('click', function() {
    authButton.disabled = true;

    if (authButton.getAttribute('signedIn') === 'true') {
      // sign them out
      showSignInButtonLoadingState();
      clearAuthInfo();
      setTimeout(function() {
        location.reload();
      }, 500);
    } else {
      // sign them in
      window.location.href = base_site_url + auth_page; // Constants from webflow
    }
  });
}

function showSignInButtonLoadingState() {
  const signInButton =  document.getElementById('auth-button');
  signInButton.classList.add('not-clickable');
  const signInButtonTitle = signInButton.querySelector('.button-title');
  signInButtonTitle.innerHTML = 'Signing out &nbsp; <i class="fa fa-spinner fa-spin"></i>';
}

function showChangeWorldButtonLoadingState() {
  const changeWorldButton = document.getElementById('change-world');
  changeWorldButton.classList.add('not-clickable');
  changeWorldButton.disabled = true;
  const changeWorldButtonTitle = changeWorldButton.querySelector('.button-title');
  changeWorldButtonTitle.innerHTML = 'Change world &nbsp; <i class="fa fa-spinner fa-spin"></i>';
}

function resetChangeWorldButton() {
  const changeWorldButton = document.getElementById('change-world');
  changeWorldButton.classList.remove('not-clickable');
  changeWorldButton.disabled = false;
  const changeWorldButtonTitle = changeWorldButton.querySelector('.button-title');
  changeWorldButtonTitle.innerHTML = 'Change world';
}

function dismissSlideOutMenu() {
  document.getElementById('tap-close-layer').click();
}

function revertLoadLatestMapButtonState() {
  const button = document.getElementById('load-latest-button');
  button.disabled = false;
  button.innerHTML = 'Load Latest Map';
  button.classList.add('hover:bg-yellow-700');
}

function revertGenMapButtonState() {
  const button = document.getElementById('gen-map-button');
  const buttonTitle = button.querySelector('.button-title');
  button.disabled = false;
  genMapButton.classList.toggle('not-clickable');
  buttonTitle.innerHTML = 'Generate New Map';
}

function changeGenMapButtonStateToSuccess() {
  const button = document.getElementById('gen-map-button');
  const buttonTitle = button.querySelector('.button-title');
  buttonTitle.innerHTML = 'Generated!';
  button.classList.replace('bg-orange-500','bg-green-700');
}

function resetGenMapElements() {
  // Reset the gen map button
  const button = document.getElementById('gen-map-button');
  const buttonTitle = button.querySelector('.button-title');
  buttonTitle.innerHTML = 'Generate New Map';
  styleDisabledButton([button]);
  button.disabled = true;

  // Reset the text under the button
  const genMapAreaText = document.getElementById('gen-map-text');
  const worldOwner = localStorage.getItem('selected_world_owner_username');
  const authUser = localStorage.getItem('username');
  const is_auth_user_host = worldOwner === authUser;
  const no_new_backup_txt = 'No new backup found. Refresh page to check again.';
  const not_authorized_txt = `Only ${worldOwner} can generate a new map, if newer backup is available.`;
  const subtext = is_auth_user_host ? no_new_backup_txt : not_authorized_txt;
  genMapAreaText.textContent = subtext;
}

function triggerMapGeneration() {
  let uuid = localStorage.getItem('uuid');
  let username = localStorage.getItem('username');
  let activeSlot = localStorage.getItem("selected_world_slot");
  let worldId = localStorage.getItem("selected_world_id");
  let accessToken = localStorage.getItem('access_token');

  world_info = {
    'uuid': uuid,
    'username': username,
    'active_slot': activeSlot,
    'world_id': worldId,
    'access_token': accessToken
  }

  $.ajax({
    url: `${base_server_url}/world/map/generate`,
    method: 'POST',
    data: JSON.stringify(world_info),
    contentType: "application/json",
    dataType: "json",
    success: function(response) {
      console.log('World map generation successful:', response);
      const new_blob_path = response["blob_path"];
      changeGenMapButtonStateToSuccess();
      setTimeout(function() {
        resetGenMapElements();
        dismissSlideOutMenu();
        redirectToLatestMap(new_blob_path);
      }, 500);
    },
    error: function(xhr, status, error) {
      console.error('World map fetch failed:', error);
      revertGenMapButtonState();
    }
  });
}

function redirectToLatestMap(new_blob_path) {
  // Get the current URL
  const currentUrl = new URL(window.location.href);

  // Get the search params from the URL
  const searchParams = new URLSearchParams(currentUrl.search);

  // Update the "blob_path" parameter to a new value
  searchParams.set('blob_path', new_blob_path);

  // Set the new search params on the URL
  currentUrl.search = searchParams.toString();

  // Reload the page with the updated URL
  window.location.href = currentUrl.href;
}


function toggleSlideMenu(slideOverPanel, slideMenuBg) {
  const tapCloseLayer = document.getElementById('tap-close-layer');
  tapCloseLayer.classList.toggle('pointer-events-auto');

  slideOverPanel.classList.toggle('translate-x-full');
  slideOverPanel.classList.toggle('showing');
  if (slideMenuBg.classList.contains('bg-opacity-0')) {
    slideMenuBg.classList.replace('bg-opacity-0','bg-opacity-80');
  } else {
    slideMenuBg.classList.replace('bg-opacity-80','bg-opacity-0');
  }
}

function enable_load_latest_map() {
  // Modify the button
  const loadLatestMapButton = document.getElementById('load-latest-button');
  loadLatestMapButton.classList.toggle('bg-yellow-500');
  styleEnabledButton([loadLatestMapButton]);

  // Modify the text
  const loadLatestTextElement = document.getElementById('load-latest-text');
  const latestBackupDate = localStorage.getItem('latest_backup_date');
  loadLatestTextElement.textContent = `Latest map from ${latestBackupDate} is available.`;
}

function load_latest_map_html() {
  return `
    <button id="load-latest-button" class="load-latest-map mr-2 mb-1 mt-8">
      <div class="button-title text-sm ">Load Latest Map</div>
    </button>
    <p id="load-latest-text" class="text-xs text-slate-400 mb-5 pl-1">No new map found. Refresh page to check again.</p>    
  `;
}

function enable_generate_new(latestBackupDate) {
  // Modify the button
  const genMapButton = document.getElementById('gen-map-button');
  genMapButton.classList.toggle('bg-orange-500');
  console.log(`about to style gen map to be enabled: ${genMapButton}`);
  styleEnabledButton([genMapButton]);

  // Modify the text
  const latestBackupTextElement = document.getElementById('gen-map-text');
  latestBackupTextElement.textContent = `New map can be generated w/ latest backup from: ${latestBackupDate}.`;
}

function generate_new_map_html(is_auth_user_host, host) {
  const no_new_backup_txt = 'No new backup found. Refresh page to check again.';
  const not_authorized_txt = `Only ${host} can generate a new map, if newer backup is available.`;
  const subtext = is_auth_user_host ? no_new_backup_txt : not_authorized_txt;
  return `
    <button id="gen-map-button" class="mb-1">
      <div class="button-title text-sm">Generate New Map</div>
    </button>
    <p id="gen-map-text" class="text-xs text-slate-400 mb-0 pl-1">${subtext}</p>
  `;
}

function menu_html(worldName, worldOwner, backupDate, load_latest_html, generate_new_html, is_authenticated) {
  change_world_button_html = `
    <button id="change-world" class="mt-4">
      <div class="button-title text-sm">Change World</div>
    </button>
  `;

  final_change_world_html = is_authenticated ? change_world_button_html : '';

  htmlString = `

  <div id="slide-out-menu" class="relative z-50 pointer-events-none" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">


    <!--
      Background backdrop, show/hide based on slide-over state.

      Entering: "ease-in-out duration-500"
        From: "opacity-0"
        To: "opacity-100"
      Leaving: "ease-in-out duration-500"
        From: "opacity-100"
        To: "opacity-0"
    -->
    <div id="slide-menu-bg" class="fixed inset-0 bg-gray-500 bg-opacity-0 transition-bg-opacity ease-in-out duration-500"></div>




    <div class="fixed inset-0 overflow-hidden">
      <div id="tap-close-layer" class="absolute inset-0 overflow-hidden">

        <!--           <div id="menu-underlay" class="absolute bg-red-300 pointer-events-none h-full"></div> -->

        <div class="fixed pointer-events-none inset-y-0 right-0 flex max-w-full pl-10">




        <button id="menu-button" class="pointer-events-auto absolute bottom-4 right-4 z-0">
          <div class="button-title text-sm">Menu</div>
        </button>


          <div id="slide-over-panel" class="pointer-events-auto w-screen max-w-md transform transition ease-in-out duration-500 sm:duration-700">
            <div class="slider-over-bg flex h-full flex-col overflow-y-scroll py-6 shadow-xl shadow-gray-900">
              <div class="px-4 sm:px-6 mb-2">
                <div class="flex items-start justify-between">

                  <div class="world-info">
                    <div class="world-name text-slate-300 text-2xl">${worldName}</div>
                    <p class="hosted-by text-xs text-slate-300 mt-1">hosted by ${worldOwner}</p>
                    <p class="backup-date-label text-slate-400 mt-1">Last backup: &nbsp;${backupDate}</p>
                    ${final_change_world_html}
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
                    <div class="flex justify-center pb-4">
                      <a href="https://www.minecraftmappy.com">
                        <img class="max-h-16" src="https://storage.googleapis.com/minecraft_maps/bnw_mappy_logo.png" alt="Image description">
                      </a>
                    </div>
                    <div class="flex justify-center">
                      <p class="text-xs text-slate-400 mb-0 pl-1">Minecraft Mapper &nbsp; &nbsp; 2023</p>
                    </div>
                  </div>
                </div>

              </div>

              <div class="mt-6 flex justify-end px-5">
                <button id="auth-button">
                  <div class="button-title text-sm">Sign in</div>
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  `;
  return htmlString;
}