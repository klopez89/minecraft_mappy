function setTailwindSource() {
	// Get the current time
	const currentTime = Date.now();

	// Get the last time the script was appended from local storage
	const lastAppendTime = localStorage.getItem('tailwindLastAppendTime');

	// If the last append time is not set, or if it's been more than 24 hours since the last append
	if (!lastAppendTime || (currentTime - lastAppendTime > 24 * 60 * 60 * 1000)) {
		// Set the last append time to the current time
		localStorage.setItem('tailwindLastAppendTime', currentTime);

		// Construct the Tailwind CSS CDN URL with the query parameter
		const tailwindUrl = `https://cdn.tailwindcss.com?v=${Math.floor(currentTime / 1000)}`;

		// Create a new script element and set its source to the Tailwind CSS CDN URL
		const tailwindScript = document.createElement('script');
		tailwindScript.src = tailwindUrl;

		// Add an event listener to the script element's load event
		tailwindScript.addEventListener('load', function() {
			// Fire the TailwindLoaded event to indicate that the Tailwind CSS script has finished loading
			document.dispatchEvent(new Event('TailwindLoaded'));
		});

		// Append the script element to the document's head
		document.head.appendChild(tailwindScript);
	} else {
		// Construct the Tailwind CSS CDN URL with the query parameter
		const tailwindUrl = `https://cdn.tailwindcss.com?v=${Math.floor(lastAppendTime / 1000)}`;

		// Create a new script element and set its source to the Tailwind CSS CDN URL
		const tailwindScript = document.createElement('script');
		tailwindScript.src = tailwindUrl;

		// Add an event listener to the script element's load event
		tailwindScript.addEventListener('load', function() {
			// Fire the TailwindLoaded event to indicate that the Tailwind CSS script has finished loading
			document.dispatchEvent(new Event('TailwindLoaded'));
		});

		// Append the script element to the document's head
		document.head.appendChild(tailwindScript);	
	}
}

setTailwindSource();