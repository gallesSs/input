const burgerBtn = document.querySelector(".burger");
const burgerContent = document.querySelector(".mobile__menu");

burgerBtn.addEventListener("click", () => {
	burgerContent.classList.toggle("active");
});

const closeBurgers = document.querySelectorAll(".closeBurger");
closeBurgers.forEach((elem) => {
	elem.addEventListener("click", () => {
		burgerContent.classList.remove("active");
		burgerBtn.classList.remove("opened");
	});
});

const faq = document.querySelectorAll(".faq--item")

faq.forEach((elem) => {
	elem.addEventListener("click", () => {
		elem.classList.toggle("active");
	})
})

const dropdown = document.getElementById('languageDropdown');
const btn = dropdown.querySelector('.dropdown-btn');
const selected = document.getElementById('selectedLang');
const items = dropdown.querySelectorAll('.dropdown-item');

btn.addEventListener('click', () => {
	dropdown.classList.toggle('open');
});

items.forEach(item => {
	item.addEventListener('click', () => {
		selected.textContent = item.textContent;
		dropdown.classList.remove('open');
	});
});

document.addEventListener('click', (e) => {
	if (!dropdown.contains(e.target)) dropdown.classList.remove('open');
});

const TURNSTILE_SITE_KEY = '1x00000000000000000000AA';
const API_URL = 'https://extracttextfromimage.io/image-to-text/';
let turnstileToken = null;

function startOCR() {
	document.getElementById('turnstile-container').style.display = 'block';
	
	window.turnstile.render('#turnstile-widget', {
		sitekey: TURNSTILE_SITE_KEY,
		callback: function (token) {
			turnstileToken = token;
			processImage();
		},
		'error-callback': function () {
			alert('Turnstile verification failed');
		}
	});
}

async function processImage() {
	const imageFile = document.getElementById('imageInput').files[0];
	if (!imageFile) {
		alert('Please select an image');
		return;
	}
	
	const reader = new FileReader();
	reader.onload = async function (e) {
		const base64Data = e.target.result;
		
		try {
			const response = await fetch(API_URL, {
				method: 'POST',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify({
					image: base64Data,
					mimeType: imageFile.type,
					fileName: imageFile.name,
					token: turnstileToken
				})
			});
			
			const result = await response.json();
			if (result.success) {
				document.getElementById('result').textContent = result.text;
			} else {
				alert('Error: ' + result.error);
			}
		} catch (error) {
			alert('Network error: ' + error.message);
		}
	};
	reader.readAsDataURL(imageFile);
}

function resetTurnstile() {
	turnstileToken = null;
	document.getElementById('turnstile-container').style.display = 'none';
	window.turnstile.reset('#turnstile-widget');
}
