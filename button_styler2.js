
function styleDisabledButton(button) {
	button.disabled = true;
  let originalButtonClassName = button.className;
  let buttonTitleElement = button.querySelector('.button-title');
  let originalButtonTitleClassName = buttonTitleElement.className;

  	if (originalButtonClassName.includes('minecraft-style')) {
	  	button.classList.toggle('cursor-default');
			button.classList.toggle('not-clickable');
			buttonTitleElement.classList.replace('text-white','text-gray-400');
  	} else {
			button.className = originalButtonClassName + ' minecraft-style text-shadow-style relative pt-3 font-bold cursor-default not-clickable';
  		buttonTitleElement.className = originalButtonTitleClassName + ' font-bold pl-4 pr-4 pb-4 text-gray-400';
  	}

  const subtitleDiv = button.querySelector('.button-subtitle');
  if (subtitleDiv) {
		subtitleDiv.className = subtitleDiv.className + ' mt-2 font-normal pl-4 pr-4 pb-4 text-gray-400';
  }
}

function styleEnabledButton(button) {
	button.disabled = false;
	let originalButtonClassName = button.className;
  let buttonTitleElement = button.querySelector('.button-title');
  let originalButtonTitleClassName = buttonTitleElement.className;

	if (originalButtonClassName.includes('minecraft-style')) {
		button.classList.toggle('cursor-default');
		button.classList.toggle('not-clickable');
		buttonTitleElement.classList.replace('text-gray-400','text-white');
	} else {
		button.className = originalButtonClassName + ' minecraft-style text-shadow-style relative pt-3 font-bold';
		buttonTitleElement.className = originalButtonTitleClassName + ' font-bold pl-4 pr-4 pb-4 text-white';
	}

  const subtitleDiv = button.querySelector('.button-subtitle')
  if (subtitleDiv) {
		subtitleDiv.className = subtitleDiv.className + ' mt-2 font-normal pl-4 pr-4 pb-4 text-gray-400';
  }
}
