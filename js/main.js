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
			if (result.text && result.text.trim() !== '') {
				resultEl.textContent = result.text;
			} else {
				resultEl.innerHTML = `
					<div class="no-text">no text found</div>
					<div class="hint">Please upload an image which have visible text.</div>
				`;
			}
		} else {
			resultEl.textContent = 'Ошибка: ' + (result.error || 'Неизвестная ошибка');
		}
	} catch (error) {
		resultEl.textContent = 'Ошибка сети: ' + error.message;
	}
}

// ==== FILE UPLOAD BUTTON / RIGHT PANEL ====
const imgBtn = document.querySelector(".custom-upload");
const resultWrapper = document.querySelector('.result--wrapper');
const btnUrl = document.querySelector(".btn-link");

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

function updateRightPanelVisibility() {
	if (!resultWrapper || !sendBtn || !fileWrapper) return;
	const hasFiles = fileWrapper.querySelector('.file-row');
	if (hasFiles) {
		resultWrapper.classList.add('success');
		sendBtn.style.display = 'flex';
		updatePhotoCount();
	} else {
		resultWrapper.classList.remove('success');
		sendBtn.style.display = 'none';
	}
	
	// RESET после любого обновления
	if (imageInput) imageInput.value = "";
}

if (imageInput && fileWrapper) {
	imageInput.addEventListener('change', handleFiles);
}

let cropper;
const cropModal = document.getElementById('cropModal');
const cropImage = document.getElementById('cropImage');
const cropConfirm = document.getElementById('cropConfirm');
const cropClose = document.getElementById('cropClose');

// ==== ОБРАБОТКА ФАЙЛОВ ====
function handleFiles(e) {
	const files = Array.from(e.target.files || []);
	if (!files.length) return;
	
	const existingFiles = fileWrapper.querySelectorAll('.file-row').length;
	if (existingFiles + files.length > 3) {
		showPopup('limit');
		return;
	}
	
	files.forEach(file => {
		if (!file.type.startsWith('image/')) {
			showPopup('type');
			return;
		}
		
		if (file.size > 5 * 1024 * 1024) {
			showPopup('size');
			return;
		}
		
		const row = document.createElement('div');
		row.className = 'file-row';
		
		const imgWrap = document.createElement('div');
		imgWrap.className = 'file-thumb-wrap';
		
		const img = document.createElement('img');
		img.className = 'file-thumb';
		img.file = file;
		
		const reader = new FileReader();
		reader.onload = e => img.src = e.target.result;
		reader.readAsDataURL(file);
		
		const cropBtn = document.createElement('button');
		cropBtn.className = 'crop-btn';
		cropBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">\n' +
			'  <g clip-path="url(#clip0_109_17625)">\n' +
			'    <path d="M3.065 0.5L3 8C3 8.26522 3.10536 8.51957 3.29289 8.70711C3.48043 8.89464 3.73478 9 4 9H11.5" stroke="#6C6F73" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>\n' +
			'    <path d="M0.5 3.065L8 3C8.26522 3 8.51957 3.10536 8.70711 3.29289C8.89464 3.48043 9 3.73478 9 4V11.5" stroke="#6C6F73" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>\n' +
			'  </g>\n' +
			'  <defs>\n' +
			'    <clipPath id="clip0_109_17625">\n' +
			'      <rect width="12" height="12" fill="white"/>\n' +
			'    </clipPath>\n' +
			'  </defs>\n' +
			'</svg>';
		cropBtn.type = 'button';
		cropBtn.onclick = () => openCropper(img);
		
		imgWrap.appendChild(img);
		imgWrap.appendChild(cropBtn);
		
		const info = document.createElement('div');
		info.className = 'file-info';
		info.innerHTML = `
			<div class="size">
				<span class="filename">${file.name}</span> (${(file.size / 1024).toFixed(1)} KB)
			</div>
			<div class="status"></div>
		`;
		
		const remove = document.createElement('button');
		remove.className = 'remove-btn';
		remove.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">\n' +
			'  <path d="M15 5L5 15" stroke="#6C6F73" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>\n' +
			'  <path d="M5 5L15 15" stroke="#6C6F73" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>\n' +
			'</svg>`;
		remove.type = 'button';
		remove.onclick = () => {
			row.remove();
			updatePhotoCount();
			updateRightPanelVisibility();
			
			// RESET при удалении файла
			if (imageInput) imageInput.value = "";
			if (cameraInput) cameraInput.value = "";
		};
		
		const progress = document.createElement('div');
		progress.className = 'file-progress';
		progress.style.width = '0%';
		
		row.appendChild(imgWrap);
		row.appendChild(info);
		row.appendChild(remove);
		row.appendChild(progress);
		fileWrapper.appendChild(row);
	});
	
	updateRightPanelVisibility();
	
	// RESET, чтобы можно было выбрать те же файлы
	if (imageInput) imageInput.value = "";
	if (cameraInput) cameraInput.value = "";
}

// === КРОППЕР ===
function openCropper(imgEl) {
	cropImage.src = imgEl.src;
	cropModal.classList.add('active');
	
	if (cropper) cropper.destroy();
	cropper = new Cropper(cropImage, {
		aspectRatio: NaN,
		viewMode: 1,
		responsive: true,
		zoomable: true,
		zoomOnWheel: true
	});
	
	const zoomInput = document.getElementById('cropZoom');
	const cropConfirm = document.getElementById('cropConfirm');
	const cropCancel = document.getElementById('cropCancel');
	const cropClose = document.getElementById('cropClose');
	
	zoomInput.value = 1;
	
	zoomInput.oninput = () => cropper.zoomTo(parseFloat(zoomInput.value));
	
	cropConfirm.onclick = async () => {
		const canvas = cropper.getCroppedCanvas({maxWidth: 2000, maxHeight: 2000});
		const croppedBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
		const croppedFile = new File([croppedBlob], imgEl.file.name, {type: 'image/png'});
		imgEl.src = canvas.toDataURL('image/png');
		imgEl.file = croppedFile;
		cropModal.classList.remove('active');
		cropper.destroy();
	};
	
	const closeModal = () => {
		cropModal.classList.remove('active');
		cropper.destroy();
	};
	cropCancel.onclick = closeModal;
	cropClose.onclick = closeModal;
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
			text: resultText,
			mimeType: file.type
		});
		
		await new Promise(r => setTimeout(r, 300));
	}
	
	showFinalResults(allResults);
});

// ==== ОБРАБОТКА ОДНОГО ФАЙЛА ====
async function processSingleFile(file, row, statusEl, progressEl) {
	let base64;
	try {
		base64 = await fileToBase64(file);
	} catch (err) {
		statusEl.textContent = 'Ошибка при чтении файла';
		return 'Ошибка при чтении файла';
	}
	
	statusEl.textContent = 'Processing...';
	
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
		
		if (result.success) {
			statusEl.textContent = 'Done';
			if (result.text && result.text.trim() !== '') {
				return result.text;
			} else {
				return `
    <div class="no-text-block">
        <div class="no-text-top">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
  <path d="M22.3879 18.5627L14.1757 4.0945C13.7756 3.38923 13.028 2.95447 12.2178 2.95447C11.4066 2.95447 10.659 3.38923 10.259 4.0945L2.04761 18.5627C1.65179 19.2591 1.65687 20.1147 2.05988 20.8077C2.4629 21.4998 3.20458 21.9265 4.00595 21.9265H20.4291C21.2309 21.9265 21.9718 21.4998 22.3752 20.8077C22.7786 20.1147 22.7829 19.2587 22.3879 18.5627ZM13.3396 19.268C13.0644 19.5127 12.7376 19.6367 12.3693 19.6367C11.9964 19.6367 11.6666 19.5144 11.388 19.2731C11.1035 19.0259 10.9588 18.6796 10.9588 18.2436C10.9588 17.8609 11.0951 17.5307 11.3639 17.2623C11.6323 16.9943 11.965 16.858 12.3528 16.858C12.7397 16.858 13.075 16.9935 13.3493 17.2614C13.6241 17.5302 13.7638 17.8609 13.7638 18.2436C13.7633 18.6732 13.6207 19.0174 13.3396 19.268ZM13.7041 9.95173L13.3464 14.0487C13.3061 14.5589 13.2198 14.9432 13.0826 15.2226C12.9315 15.5317 12.6678 15.6955 12.3194 15.6955C11.9642 15.6955 11.7026 15.5351 11.5624 15.2315C11.438 14.9619 11.3525 14.5703 11.3004 14.0327L11.0337 10.0457C10.9833 9.25789 10.9583 8.70798 10.9583 8.36466C10.9583 7.86851 11.0934 7.4727 11.3597 7.18822C11.6285 6.9012 11.9853 6.75515 12.4188 6.75515C12.9539 6.75515 13.3197 6.94946 13.5068 7.33215C13.6787 7.68521 13.7625 8.17289 13.7625 8.82271C13.7633 9.191 13.7434 9.57073 13.7041 9.95173Z" fill="#EB5757"/>
</svg>
            <span>No Text Found!</span>
        </div>
        <div class="no-text-hint">
            Please upload an image which have visible text.
        </div>
    </div>
`;
			}
		} else {
			const errText = 'Ошибка: ' + (result.error || 'Неизвестная ошибка');
			statusEl.textContent = 'Error';
			return errText;
		}
	} catch (err) {
		const errText = 'Ошибка: ' + err.message;
		statusEl.textContent = errText;
		return errText;
	}
}

// ==== ФИНАЛЬНЫЙ ЭКРАН ====
function showFinalResults(initialResults) {
	const heroSection = document.querySelector('.hero');
	if (!heroSection) return;
	
	heroSection.innerHTML = '';
	const container = document.createElement('div');
	container.className = 'final-results container';
	
	const header = document.createElement('div');
	header.className = 'final-header';
	header.innerHTML = `
		<h2>Files Converting...</h2>
		<div class="final-buttons hidden">
			<button class="restart-btn">Start Over</button>
			<button class="download-btn">Download Zip</button>
		</div>
	`;
	container.appendChild(header);
	heroSection.appendChild(container);
	
	initialResults.forEach((res, index) => {
		const item = document.createElement('div');
		item.className = 'result-item converting';
		item.dataset.index = index;
		item.innerHTML = `
			<div class="result-img">
			<button class="info-btn">
			<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
  <g clip-path="url(#clip0_109_20792)">
    <path d="M6 11C8.76142 11 11 8.76142 11 6C11 3.23858 8.76142 1 6 1C3.23858 1 1 3.23858 1 6C1 8.76142 3.23858 11 6 11Z" stroke="#6C6F73" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M6 8V6" stroke="#6C6F73" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M6 4H6.005" stroke="#6C6F73" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <defs>
    <clipPath id="clip0_109_20792">
      <rect width="12" height="12" fill="white"/>
    </clipPath>
  </defs>
</svg></button>
				<img src="${res.imageSrc}" alt="${res.name}">
				<div class="file-info-line">${res.name}</div>
			</div>
			<div class="result-text">
				<div class="convert-overlay"></div>
				<span class="convert-text">Converting</span>
			</div>
		`;
		container.appendChild(item);
		
		const infoBtn = item.querySelector('.info-btn');
		infoBtn.addEventListener('click', () => {
			openInfoModal({
				name: res.name,
				size: res.size,
				mimeType: res.mimeType,
				imageSrc: res.imageSrc
			});
		});
		
		let progress = 0;
		const overlay = item.querySelector('.convert-overlay');
		const progressTimer = setInterval(() => {
			progress += Math.random() * 4;
			if (progress >= 100) {
				progress = 100;
				clearInterval(progressTimer);
				
				item.classList.remove('converting');
				const resultHTML = res.text.includes('no-text-block')
					? `${res.text}`
					: `<p contenteditable="true">${res.text}</p>
       <div class="item-buttons">
           <button class="expand-btn"><img src="/images/expand.svg" alt=""></button>
           <button class="copy-btn"><img src="/images/copy.svg" alt=""></button>
           <button class="save-btn"><img src="/images/download.svg" alt=""></button>
       </div>`;
				
				item.querySelector('.result-text').innerHTML = resultHTML;

// добавляем красный бордер для пустых результатов
				if (res.text.includes('no-text-block')) {
					item.classList.add('no-text-result');
				}
				
				
				const textarea = item.querySelector('p');
				const expandBtn = item.querySelector('.expand-btn');
				const copyBtn = item.querySelector('.copy-btn');
				const saveBtn = item.querySelector('.save-btn');
				
				let expanded = false;
				
				expandBtn.addEventListener('click', () => {
					item.classList.toggle('expanded');
				});
				
				
				copyBtn.addEventListener('click', async () => {
					await navigator.clipboard.writeText(textarea.value);
					copyBtn.classList.add('copied');
					setTimeout(() => copyBtn.classList.remove('copied'), 1500);
				});
				
				saveBtn.addEventListener('click', () => {
					const blob = new Blob([textarea.value], {type: 'text/plain'});
					const link = document.createElement('a');
					link.href = URL.createObjectURL(blob);
					link.download = res.name.replace(/\.[^/.]+$/, '') + '.txt';
					link.click();
					URL.revokeObjectURL(link.href);
				});
			}
			overlay.style.setProperty('--progress', `${progress}%`);
		}, 200);
	});
	
	setTimeout(() => {
		header.querySelector('h2').textContent = 'Files Converted';
		header.querySelector('.final-buttons').classList.remove('hidden');
		document.querySelector('.restart-btn').addEventListener('click', () => location.reload());
		document.querySelector('.download-btn').addEventListener('click', () => downloadZip(initialResults));
	}, 3500);
}

// === PHOTO MODAL ===
function openPhotoModal(src) {
	const modal = document.getElementById('photoModal');
	const close = document.getElementById('photoClose');
	const img = document.getElementById('photoView');
	
	img.src = src;
	modal.classList.add('active');
	
	const closeModal = () => modal.classList.remove('active');
	close.onclick = closeModal;
	modal.onclick = e => {
		if (e.target === modal) closeModal();
	};
}

// === INFO MODAL ===
function openInfoModal(data) {
	const modal = document.getElementById('infoModal');
	const close = document.getElementById('infoClose');
	const img = document.getElementById('infoImage');
	const name = document.getElementById('infoName');
	const size = document.getElementById('infoSize');
	const dimensions = document.getElementById('infoDimensions');
	const type = document.getElementById('infoType');
	
	img.src = data.imageSrc;
	name.textContent = data.name;
	size.textContent = data.size;
	type.textContent = data.mimeType || '—';
	
	const tempImg = new Image();
	tempImg.src = data.imageSrc;
	tempImg.onload = () => {
		dimensions.textContent = `${tempImg.width} × ${tempImg.height}px`;
	};
	
	modal.classList.add('active');
	
	const closeModal = () => modal.classList.remove('active');
	close.onclick = closeModal;
	modal.onclick = e => {
		if (e.target === modal) closeModal();
	};
}

// ==== ZIP ====
async function downloadZip(results) {
	if (!results.length) {
		alert('Нет файлов для скачивания');
		return;
	}
	
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
const btnLinkUrl = document.querySelector(".btn-link");
const urlBtns = document.querySelector('.url--btns__list');
const sendBtnUrl = document.getElementById('sendBtnUrl');

btnLinkUrl?.addEventListener('click', () => {
	urlBtns?.classList.toggle("active");
});

sendBtnUrl?.addEventListener('click', () => {
	addImageFromUrl();
});

async function addImageFromUrl() {
	const input = document.getElementById('imageUrl');
	if (!input) return;
	const url = input.value.trim();
	
	if (!url || !/^https?:\/\//i.test(url)) {
		alert('Please enter a valid image URL (https://...)');
		return;
	}
	
	try {
		const resp = await fetch(url);
		if (!resp.ok) {
			alert('Cannot load image from this URL');
			return;
		}
		
		const contentType = resp.headers.get('Content-Type') || '';
		if (!contentType.startsWith('image/')) {
			alert('URL does not point to an image file');
			return;
		}
		
		const blob = await resp.blob();
		const ext = (contentType.split('/')[1] || 'png').split(';')[0];
		const urlName = url.split('/').pop() || `image_from_url.${ext}`;
		const safeName = urlName.includes('.') ? urlName : `${urlName}.${ext}`;
		const file = new File([blob], safeName, {type: blob.type || contentType});
		
		handleFiles({target: {files: [file]}});
		
		// RESET for URL uploads
		if (imageInput) imageInput.value = "";
		input.value = "";
		
		updateRightPanelVisibility();
	} catch (e) {
		console.error(e);
		alert('Error while loading image from URL');
	}
}

// ==== CAMERA BUTTON ====
const cameraBtn = document.getElementById('cameraBtn');
const cameraInput = document.getElementById('cameraInput');

cameraBtn?.addEventListener('click', () => {
	cameraInput?.click();
});

cameraInput?.addEventListener('change', (e) => {
	const files = Array.from(e.target.files || []);
	if (!files.length) return;
	
	handleFiles({target: {files}});
	
	// RESET camera input
	cameraInput.value = "";
	updateRightPanelVisibility();
});

// ==== POPUP ====
function showPopup(type = 'generic') {
	const popup = document.getElementById('popup');
	const img = document.getElementById('popupImage');
	const title = document.getElementById('popupTitle');
	const msg = document.getElementById('popupMessage');
	const close = document.getElementById('popupClose');
	
	switch (type) {
		case 'limit':
			img.src = './images/limit.png';
			title.textContent = 'File Limit Exceed';
			msg.textContent = 'You can upload up to 3 files only.';
			break;
		
		case 'type':
			img.src = './images/type.png';
			title.textContent = 'Unsupported File Type';
			msg.textContent = 'The uploaded file must be an image file like png, jpeg, webp, gif, bmp, heic or tiff.';
			break;
		
		case 'size':
			img.src = './images/size.png';
			title.textContent = 'File Size Exceed';
			msg.textContent = 'The website allows users to upload files up to a maximum size of 5 MB only.';
			break;
		
		default:
			img.src = './images/limit.png';
			title.textContent = 'Error';
			msg.textContent = 'An unknown error occurred.';
	}
	
	popup.classList.add('active');
	
	const closePopup = () => popup.classList.remove('active');
	close.onclick = closePopup;
	popup.onclick = e => {
		if (e.target === popup) closePopup();
	};
}

// ==== DRAG & DROP ====
const dropContainer = document.querySelector('.input__container');

if (dropContainer) {
	dropContainer.addEventListener('dragover', (e) => {
		e.preventDefault();
		dropContainer.classList.add('dragover');
	});
	
	dropContainer.addEventListener('dragleave', (e) => {
		if (!dropContainer.contains(e.relatedTarget)) {
			dropContainer.classList.remove('dragover');
		}
	});
	
	dropContainer.addEventListener('drop', (e) => {
		e.preventDefault();
		dropContainer.classList.remove('dragover');
		
		const files = Array.from(e.dataTransfer.files || []);
		if (files.length) {
			handleFiles({target: {files}});
			
			// RESET for drag & drop
			if (imageInput) imageInput.value = "";
			if (cameraInput) cameraInput.value = "";
			
			updateRightPanelVisibility();
			updatePhotoCount();
		}
	});
}

// ==== CTRL + V ====
if (dropContainer) {
	document.addEventListener('paste', (e) => {
		const items = e.clipboardData?.items;
		if (!items) return;
		
		const files = [];
		for (const item of items) {
			if (item.kind === 'file') {
				const file = item.getAsFile();
				if (file && file.type.startsWith('image/')) {
					files.push(file);
				}
			}
		}
		
		if (files.length) {
			handleFiles({target: {files}});
			
			// RESET for paste
			if (imageInput) imageInput.value = "";
			if (cameraInput) cameraInput.value = "";
			
			updateRightPanelVisibility();
			updatePhotoCount();
		}
	});
}

// ==== UPDATE PHOTO COUNT ====
function updatePhotoCount() {
	const title = document.querySelector('.result-current');
	if (!title) return;
	
	const fileRows = document.querySelectorAll('.file-info-wrapper .file-row');
	const count = fileRows.length;
	
	if (count > 0) {
		title.textContent = `${count} Photo${count > 1 ? 's' : ''} Uploaded`;
	} else {
		title.textContent = 'Photos Uploaded';
	}
}
