(function () {
  // Nav scroll state
  const header = document.getElementById("site-header");
  window.addEventListener("scroll", () => {
    header.classList.toggle("scrolled", window.scrollY > 20);
  });

  // Mobile nav toggle
  const navToggle = document.getElementById("nav-toggle");
  const mainNav = document.getElementById("main-nav");
  navToggle.addEventListener("click", () => {
    mainNav.classList.toggle("open");
    navToggle.classList.toggle("open");
  });
  mainNav.querySelectorAll("a").forEach((link) =>
    link.addEventListener("click", () => {
      mainNav.classList.remove("open");
      navToggle.classList.remove("open");
    })
  );

  // Pricing card "choose formule" -> preselect in booking form
  document.querySelectorAll("[data-choose-formule]").forEach((el) => {
    el.addEventListener("click", () => {
      const formule = el.getAttribute("data-choose-formule");
      const select = document.getElementById("formule-select");
      if (select) select.value = formule;
    });
  });

  // Footer year
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
