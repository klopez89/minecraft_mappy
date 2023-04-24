document.addEventListener('TailwindLoaded', function() {
  configureHomePage();
});

function configureHomePage() {
	addHomePageToDOM();
	styleButtons();
}

function styleButtons() {
	const getStartedButton = document.getElementById('get-started-button');
  styleEnabledButton([getStartedButton]);
}

function takeUserToAuth() {
	window.location.href = base_site_url + auth_page; // Constants from webflow
}

function addHomePageToDOM() {
	let home_page_html = homePageHtml();
	let home_page_div = $($.parseHTML(home_page_html));
  $('body').append(home_page_div);
}

function homePageHtml() {
	return `
	<div class="relative isolate overflow-hidden custom-dark-gray-bg">
		<svg class="absolute inset-0 -z-10 h-full w-full stroke-gray-600  [mask-image:radial-gradient(90%_90%_at_top_left,gray,transparent)]" aria-hidden="true">
			<defs>
				<pattern id="0787a7c5-978c-4f66-83c7-11c213f99cb7" width="200" height="200" x="50%" y="-1" patternUnits="userSpaceOnUse">
					<path d="M.5 200V.5H200" fill="none" />
				</pattern>
			</defs>
			<rect width="100%" height="100%" stroke-width="0" fill="url(#0787a7c5-978c-4f66-83c7-11c213f99cb7)" />
		</svg>
		
		<div class="mx-auto max-w-7xl px-6 pb-24 pt-10 sm:pb-32 lg:flex lg:px-8 lg:py-40">
		
		
		
		
			<div class="mx-auto max-w-2xl lg:mx-0 lg:max-w-lg lg:flex-shrink-0 lg:pt-8">
				<img class="h-11" src="https://storage.googleapis.com/minecraft_maps/bnw_mappy_logo.png" alt="Your Company">
				<div class="mt-24 sm:mt-32 lg:mt-16">

				</div>
				<h1 class="mt-10 text-4xl font-bold text-shadow-style sm:text-6xl">Realm maps in one place.</h1>
				<p class="mt-6 text-lg leading-8 text-gray-100">Explore your Minecraft Realms in one place with Minecraft Mappy. Easily generate and share maps to plan your next adventure and discover new areas.</p>
				<div class="mt-10 flex items-center gap-x-6">

					<button id="get-started-button" onClick="takeUserToAuth()" class="text-xl bg-orange-500">
						<div class="button-title">&nbsp;Get Started&nbsp;</div>
					</button>

				</div>
			</div>
			
			<div class="mx-auto mt-16 flex max-w-2xl sm:mt-24 lg:ml-10 lg:mr-0 lg:mt-0 lg:max-w-none lg:flex-none xl:ml-32">
				<div class="max-w-3xl flex-none sm:max-w-5xl lg:max-w-none">
					<div class="-m-2 rounded-xl bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/10 lg:-m-4 lg:rounded-2xl lg:p-4">
						<img src="https://storage.googleapis.com/minecraft_maps/dantes_screenshot1-min.png" alt="App screenshot" width="1084" height="1086" class="w-[40rem] rounded-md shadow-2xl ring-1 ring-gray-900/10">
					</div>
				</div>
			</div>
			
		</div>
	</div>
	`;
}