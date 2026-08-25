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
  document.addEventListener("click", (e) => {
    if (
      mainNav.classList.contains("open") &&
      !mainNav.contains(e.target) &&
      !navToggle.contains(e.target)
    ) {
      mainNav.classList.remove("open");
      navToggle.classList.remove("open");
    }
  });

  // Sticky mobile booking CTA — hide once the booking section is in view
  const stickyCta = document.getElementById("mobile-sticky-cta");
  const reservationSection = document.getElementById("reservation");
  if (stickyCta && reservationSection && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      ([entry]) => stickyCta.classList.toggle("is-hidden", entry.isIntersecting),
      { threshold: 0.15 }
    );
    observer.observe(reservationSection);
  }

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

  // Reviews carousel
  const track = document.getElementById("reviews-grid");
  const prevBtn = document.getElementById("reviews-prev");
  const nextBtn = document.getElementById("reviews-next");
  if (track && prevBtn && nextBtn) {
    const scrollByCard = (dir) => {
      const card = track.querySelector(".review-card");
      const amount = card ? card.getBoundingClientRect().width + 24 : 340;
      track.scrollBy({ left: dir * amount, behavior: "smooth" });
    };
    prevBtn.addEventListener("click", () => scrollByCard(-1));
    nextBtn.addEventListener("click", () => scrollByCard(1));
  }

  // Modèles carousel
  const modelesTrack = document.getElementById("modeles-track");
  const modelesPrev = document.getElementById("modeles-prev");
  const modelesNext = document.getElementById("modeles-next");
  if (modelesTrack && modelesPrev && modelesNext) {
    const scrollModeles = (dir) => {
      const card = modelesTrack.querySelector(".modele-card");
      const amount = card ? card.getBoundingClientRect().width + 24 : 300;
      modelesTrack.scrollBy({ left: dir * amount, behavior: "smooth" });
    };
    modelesPrev.addEventListener("click", () => scrollModeles(-1));
    modelesNext.addEventListener("click", () => scrollModeles(1));
  }
})();
