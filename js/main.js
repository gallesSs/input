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