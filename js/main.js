// ==== BURGER ====
const burgerBtn = document.querySelector(".burger");
const burgerContent = document.querySelector(".mobile__menu");
const mask = document.querySelector(".mask");

burgerBtn?.addEventListener("click", () => {
	burgerContent.classList.toggle("active");
	mask.classList.toggle("active");
});

const closeBurgers = document.querySelectorAll(".closeBurger");
closeBurgers.forEach((elem) => {
	elem.addEventListener("click", () => {
		burgerContent.classList.remove("active");
		burgerBtn.classList.remove("opened");
	});
});

// ==== FAQ ====
const faq = document.querySelectorAll(".faq--item");
faq.forEach((elem) => {
	elem.addEventListener("click", () => {
		elem.classList.toggle("active");
	});
});

// ==== DROPDOWN ====
const dropdown = document.getElementById('languageDropdown');
const btn = dropdown?.querySelector('.dropdown-btn');
const selected = document.getElementById('selectedLang');
const items = dropdown?.querySelectorAll('.dropdown-item') || [];

if (btn) {
	btn.addEventListener('click', () => dropdown.classList.toggle('open'));
}

items.forEach(item => {
	item.addEventListener('click', () => {
		selected.textContent = item.textContent;
		dropdown.classList.remove('open');
	});
});

document.addEventListener('click', (e) => {
	if (dropdown && !dropdown.contains(e.target)) dropdown.classList.remove('open');
});

// ==== OCR TURNSTILE + FILE/LINK/CAMERA SUPPORT ====
const TURNSTILE_SITE_KEY = '1x00000000000000000000AA';
const API_URL = 'https://extracttextfromimage.io/image-to-text/';
let turnstileToken = null;
let ocrMode = 'file'; // file | url | camera

function startOCR(mode = 'file') {
	ocrMode = mode;
	const turnstileContainer = document.getElementById('turnstile-container');
	if (!turnstileContainer) {
		alert('Turnstile контейнер не найден!');
		return;
	}
	
	turnstileContainer.style.display = 'block';
	
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
	const imageInput = document.getElementById('imageInput');
	const imageUrlInput = document.getElementById('imageUrl');
	const cameraInput = document.getElementById('cameraInput');
	const resultEl = document.getElementById('result');
	
	if (!resultEl) {
		alert('Не найден элемент для вывода результата!');
		return;
	}
	
	let imageData = null;
	let mimeType = '';
	let fileName = '';
	
	try {
		if (ocrMode === 'file' || ocrMode === 'camera') {
			const imageFile = (ocrMode === 'file') ? imageInput?.files[0] : cameraInput?.files[0];
			if (!imageFile) {
				alert('Выберите фото');
				return;
			}
			imageData = await fileToBase64(imageFile);
			mimeType = imageFile.type;
			fileName = imageFile.name;
		} else if (ocrMode === 'url') {
			const url = imageUrlInput?.value?.trim();
			if (!url || !/^https?:\/\//i.test(url)) {
				alert('Введите корректную ссылку (https://...)');
				return;
			}
			imageData = url;
			mimeType = 'image/url';
			fileName = url.split('/').pop();
		}
		
		// Старт псевдо-прогресса для одиночного режима (только текстом)
		resultEl.textContent = 'Processing...';
		let singleProgress = 0;
		const singleTimer = setInterval(() => {
			if (singleProgress < 90) {
				singleProgress += 1 + Math.random() * 3;
				if (singleProgress > 90) singleProgress = 90;
				resultEl.textContent = `Processing... ${Math.floor(singleProgress)}%`;
			}
		}, 200);
		
		const response = await fetch(API_URL, {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			body: JSON.stringify({
				image: imageData,
				mimeType: mimeType,
				fileName: fileName,
				token: turnstileToken
			})
		});
		
		const result = await response.json();
		
		clearInterval(singleTimer);
		
		if (result.success) {
			resultEl.textContent = result.text || '⚠️ Текст не найден.';
		} else {
			resultEl.textContent = 'Ошибка: ' + (result.error || 'Неизвестная ошибка');
		}
	} catch (error) {
		resultEl.textContent = 'Ошибка сети: ' + error.message;
	}
}

const imgBtn = document.querySelector(".custom-upload");
const resultWrapper = document.querySelector('.result--wrapper');

imgBtn?.addEventListener('click', () => {
	resultWrapper?.classList.add('success'); // добавляем класс один раз
}, {once: true});

function fileToBase64(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result);
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});
}

function resetTurnstile() {
	turnstileToken = null;
	const container = document.getElementById('turnstile-container');
	if (container) container.style.display = 'none';
	try {
		window.turnstile.reset('#turnstile-widget');
	} catch {
		// игнор
	}
}

// ==== ФЕЙКОВЫЙ ПЛАВНЫЙ ПРОГРЕСС (универсальная функция) ====
// start - с какого процента начинать
// end - до какого процента дойти
function startFakeProgress(progressEl, statusEl, start = 0, end = 100) {
	let progress = start;
	const timer = setInterval(() => {
		let diff = end - progress;
		
		if (diff <= 0) {
			clearInterval(timer);
			progressEl.style.width = end + '%';
			return;
		}
		
		// Чем ближе к end — тем медленнее
		const speed = Math.max(0.5, diff * 0.1);
		progress += speed;
		
		if (progress > end) progress = end;
		progressEl.style.width = progress + '%';
	}, 200);
	
	return {
		complete() {
			clearInterval(timer);
			progressEl.style.width = end + '%';
		},
		error() {
			clearInterval(timer);
			progressEl.style.width = '100%';
		}
	};
}

const imageInput = document.getElementById('imageInput');
const fileWrapper = document.querySelector('.file-info-wrapper');
const sendBtn = document.getElementById('sendBtn');

if (imageInput && fileWrapper) {
	imageInput.addEventListener('change', handleFiles);
	
	function handleFiles(e) {
		const files = Array.from(e.target.files || []);
		if (!files.length) return;
		
		files.forEach(file => {
			const row = document.createElement('div');
			row.className = 'file-row';
			
			const img = document.createElement('img');
			img.className = 'file-thumb';
			img.file = file;
			const reader = new FileReader();
			reader.onload = e => img.src = e.target.result;
			reader.readAsDataURL(file);
			
			const info = document.createElement('div');
			info.className = 'file-info';
			info.innerHTML = `
				<div class="size">${(file.size / 1024).toFixed(1)} KB</div>
				<div class="status">Waiting...</div>
			`;
			
			const remove = document.createElement('button');
			remove.className = 'remove-btn';
			remove.textContent = '✖';
			remove.type = 'button';
			remove.onclick = () => row.remove();
			
			const progress = document.createElement('div');
			progress.className = 'file-progress';
			progress.style.width = '0%';
			
			row.appendChild(img);
			row.appendChild(info);
			row.appendChild(remove);
			row.appendChild(progress);
			
			fileWrapper.appendChild(row);
		});
		
		sendBtn.style.display = 'flex';
	}
	
	sendBtn.addEventListener('click', async () => {
		const rows = fileWrapper.querySelectorAll('.file-row');
		
		for (const row of rows) {
			const img = row.querySelector('img');
			const file = img?.file;
			if (!file) continue;
			
			const statusEl = row.querySelector('.status');
			const progressEl = row.querySelector('.file-progress');
			
			// === ЭТАП 1: Uploading ===
			statusEl.textContent = 'Uploading...';
			const uploadProgress = startFakeProgress(progressEl, statusEl, 0, 60);
			
			let base64 = '';
			try {
				base64 = await fileToBase64(file);
				uploadProgress.complete(); // 60%
			} catch (err) {
				uploadProgress.error();
				statusEl.textContent = 'Ошибка при загрузке файла';
				continue;
			}
			
			// === ЭТАП 2: Processing ===
			statusEl.textContent = 'Processing...';
			const processProgress = startFakeProgress(progressEl, statusEl, 60, 100);
			
			try {
				const res = await fetch(API_URL, {
					method: 'POST',
					headers: {'Content-Type': 'application/json'},
					body: JSON.stringify({
						image: base64,
						mimeType: file.type,
						fileName: file.name,
						token: turnstileToken
					})
				});
				
				const result = await res.json();
				
				processProgress.complete(); // 100%
				
				if (result.success) {
					statusEl.textContent = 'Done';
					const textResult = document.createElement('div');
					textResult.className = 'ocr-result';
					textResult.textContent = result.text || '⚠️ Текст не найден.';
					fileWrapper.appendChild(textResult);
				} else {
					statusEl.textContent = 'Error';
				}
			} catch (err) {
				processProgress.error();
				statusEl.textContent = 'Ошибка: ' + err.message;
			}
		}
	});
}

// (Функция fileToBase64 уже есть у тебя выше)

// URL кнопки
const btnLink = document.querySelector(".btn-link");
const urlBtns = document.querySelector('.url--btns__list');

btnLink?.addEventListener('click', () => {
	urlBtns?.classList.toggle("active");
});
