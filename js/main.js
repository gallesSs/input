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
	resultWrapper?.classList.add('success');
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
		// ignore
	}
}

// ==== ФЕЙКОВЫЙ ПЛАВНЫЙ ПРОГРЕСС ====
function startFakeProgress(progressEl, statusEl, start = 0, end = 100, label = 'Processing') {
	let progress = start;
	statusEl.textContent = `${label} ${Math.floor(progress)}%`;
	
	const timer = setInterval(() => {
		let diff = end - progress;
		
		if (diff <= 0) {
			clearInterval(timer);
			progress = end;
			progressEl.style.width = end + '%';
			statusEl.textContent = `${label} ${Math.floor(progress)}%`;
			return;
		}
		
		const speed = Math.max(0.5, diff * 0.1);
		progress += speed;
		
		if (progress > end) progress = end;
		progressEl.style.width = progress + '%';
		statusEl.textContent = `${label} ${Math.floor(progress)}%`;
	}, 200);
	
	return {
		complete() {
			clearInterval(timer);
			progressEl.style.width = end + '%';
			statusEl.textContent = `${label} 100%`;
		},
		error() {
			clearInterval(timer);
			progressEl.style.width = '100%';
			statusEl.textContent = 'Ошибка';
		}
	};
}

const imageInput = document.getElementById('imageInput');
const fileWrapper = document.querySelector('.file-info-wrapper');
const sendBtn = document.getElementById('sendBtn');

// ==== ОБРАБОТКА ФАЙЛОВ ====
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
				<div class="size">
					<span class="filename">${file.name}</span> — ${(file.size / 1024).toFixed(1)} KB
				</div>
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
}

// ==== ПОСЛЕДОВАТЕЛЬНАЯ ОБРАБОТКА ====
sendBtn?.addEventListener('click', async () => {
	const rows = Array.from(fileWrapper.querySelectorAll('.file-row'));
	if (!rows.length) {
		alert('Нет файлов для обработки');
		return;
	}
	
	const allResults = [];
	
	for (const [index, row] of rows.entries()) {
		const img = row.querySelector('img');
		const file = img?.file;
		if (!file) continue;
		
		const statusEl = row.querySelector('.status');
		const progressEl = row.querySelector('.file-progress');
		
		statusEl.textContent = `Processing file ${index + 1} of ${rows.length}...`;
		
		const resultText = await processSingleFile(file, row, statusEl, progressEl);
		
		allResults.push({
			name: file.name,
			size: (file.size / 1024).toFixed(1) + ' KB',
			imageSrc: img.src,
			text: resultText
		});
		await new Promise(r => setTimeout(r, 300));
	}
	
	showFinalResults(allResults);
});

// ==== ОБРАБОТКА ОДНОГО ФАЙЛА ====
async function processSingleFile(file, row, statusEl, progressEl) {
	const uploadProgress = startFakeProgress(progressEl, statusEl, 0, 60);
	
	let base64;
	try {
		base64 = await fileToBase64(file);
		uploadProgress.complete();
	} catch (err) {
		uploadProgress.error();
		statusEl.textContent = 'Ошибка при чтении файла';
		return 'Ошибка при чтении файла';
	}
	
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
		processProgress.complete();
		
		if (result.success) {
			statusEl.textContent = 'Done';
			return result.text || '⚠️ Текст не найден.';
		} else {
			statusEl.textContent = 'Error';
			return 'Ошибка: ' + (result.error || 'Неизвестная ошибка');
		}
	} catch (err) {
		processProgress.error();
		statusEl.textContent = 'Ошибка: ' + err.message;
		return 'Ошибка: ' + err.message;
	}
}

// ==== ФИНАЛЬНЫЙ ЭКРАН ====
function showFinalResults(results) {
	const heroSection = document.querySelector('.hero');
	if (!heroSection) return;
	
	heroSection.innerHTML = '';
	
	const container = document.createElement('div');
	container.className = 'final-results container';
	
	const header = document.createElement('div');
	header.className = 'final-header';
	header.innerHTML = `
		<h2>Files Converted</h2>
		<div class="final-buttons">
			<button class="restart-btn">Start Over</button>
			<button class="download-btn">Download Zip</button>
		</div>
	`;
	container.appendChild(header);
	
	results.forEach(res => {
		const item = document.createElement('div');
		item.className = 'result-item';
		item.innerHTML = `
			<div class="result-img">
				<img src="${res.imageSrc}" alt="${res.name}">
				<div class="file-info-line">${res.size}</div>
			</div>
			<div class="result-text">
				<textarea readonly>${res.text}</textarea>
				<div class="item-buttons">
					<button class="expand-btn">Expand</button>
					<button class="copy-btn">Copy</button>
					<button class="save-btn">Download</button>
				</div>
			</div>
		`;
		container.appendChild(item);
		
		// === функционал кнопок ===
		const textarea = item.querySelector('textarea');
		const expandBtn = item.querySelector('.expand-btn');
		const copyBtn = item.querySelector('.copy-btn');
		const saveBtn = item.querySelector('.save-btn');
		
		let expanded = false;
		
		expandBtn.addEventListener('click', () => {
			expanded = !expanded;
			if (expanded) {
				textarea.style.height = '400px';
				expandBtn.textContent = 'Collapse';
			} else {
				textarea.style.height = '52px';
				expandBtn.textContent = 'Expand';
			}
		});
		
		
		copyBtn.addEventListener('click', async () => {
			await navigator.clipboard.writeText(res.text);
			copyBtn.textContent = 'Copied!';
			setTimeout(() => (copyBtn.textContent = 'Copy'), 1500);
		});
		
		saveBtn.addEventListener('click', () => {
			const blob = new Blob([res.text], {type: 'text/plain'});
			const link = document.createElement('a');
			link.href = URL.createObjectURL(blob);
			link.download = res.name.replace(/\.[^/.]+$/, '') + '.txt';
			link.click();
			URL.revokeObjectURL(link.href);
		});
	});
	
	heroSection.appendChild(container);
	
	document.querySelector('.restart-btn').addEventListener('click', () => location.reload());
	document.querySelector('.download-btn').addEventListener('click', () => downloadZip(results));
}

// ==== ZIP ====
async function downloadZip(results) {
	const zip = new JSZip();
	results.forEach(res => {
		const safeName = res.name.replace(/\.[^/.]+$/, '') + '.txt';
		zip.file(safeName, res.text);
	});
	const blob = await zip.generateAsync({type: 'blob'});
	const link = document.createElement('a');
	link.href = URL.createObjectURL(blob);
	link.download = 'converted_texts.zip';
	link.click();
	URL.revokeObjectURL(link.href);
}

// ==== URL BUTTONS ====
const btnLink = document.querySelector(".btn-link");
const urlBtns = document.querySelector('.url--btns__list');

btnLink?.addEventListener('click', () => {
	urlBtns?.classList.toggle("active");
});

// ==== CAMERA BUTTON ====
const cameraBtn = document.getElementById('cameraBtn');
const cameraInput = document.getElementById('cameraInput');

cameraBtn?.addEventListener('click', () => {
	// открываем камеру / галерею
	cameraInput?.click();
});

// когда пользователь сделал фото или выбрал файл
cameraInput?.addEventListener('change', (e) => {
	const files = Array.from(e.target.files || []);
	if (!files.length) return;
	
	// добавляем фото в список так же, как при обычной загрузке
	handleFiles({target: {files}});
	
	// автоматически показываем секцию с файлами
	resultWrapper?.classList.add('success');
});
