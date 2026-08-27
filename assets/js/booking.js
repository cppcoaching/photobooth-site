(function () {
  const CONFIG = window.BOOTH_CONFIG || {};
  const dateDisplay = document.getElementById("selected-date-display");
  const dateValue = document.getElementById("selected-date-value");

  // ----- Calendrier des disponibilités -----
  fetch("data/unavailable-dates.json")
    .then((res) => res.json())
    .then((data) => {
      const unavailable = data.dates || [];

      flatpickr("#booking-calendar", {
        inline: true,
        locale: "fr",
        minDate: "today",
        dateFormat: "Y-m-d",
        altInput: false,
        disable: unavailable,
        onChange: function (selectedDates, dateStr) {
          if (!dateStr) return;
          const d = selectedDates[0];
          const formatted = d.toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
          });
          dateDisplay.value = formatted;
          dateValue.value = dateStr;
        },
        onDayCreate: function (dObj, dStr, fp, dayElem) {
          const iso = fp.formatDate(dayElem.dateObj, "Y-m-d");
          if (unavailable.includes(iso)) {
            dayElem.classList.add("day-unavailable");
            dayElem.title = "Date déjà réservée";
          }
        }
      });
    })
    .catch((err) => console.error("Impossible de charger le calendrier des disponibilités", err));

  // ----- Formulaire de réservation -----
  const bookingForm = document.getElementById("booking-form");
  const stripeBtn = document.getElementById("stripe-deposit-btn");
  const whatsappBtn = document.getElementById("whatsapp-modal-btn");
  const modalOverlay = document.getElementById("booking-modal-overlay");
  const modalClose = document.getElementById("booking-modal-close");
  const modalDate = document.getElementById("booking-modal-date");

  function openBookingModal() {
    modalOverlay.hidden = false;
  }
  function closeBookingModal() {
    modalOverlay.hidden = true;
  }
  if (modalClose) modalClose.addEventListener("click", closeBookingModal);
  if (modalOverlay) {
    modalOverlay.addEventListener("click", function (e) {
      if (e.target === modalOverlay) closeBookingModal();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !modalOverlay.hidden) closeBookingModal();
    });
  }

  if (bookingForm) {
    bookingForm.addEventListener("submit", function (e) {
      e.preventDefault();

      if (!dateValue.value) {
        alert("Merci de sélectionner une date dans le calendrier avant d'envoyer votre demande.");
        return;
      }

      const endpoint = CONFIG.FORMSPREE_ENDPOINT;
      const formData = new FormData(bookingForm);

      const finishUp = () => {
        modalDate.textContent = dateDisplay.value;

        const formule = document.getElementById("formule-select").value;
        const link = (CONFIG.STRIPE_LINKS || {})[formule];
        if (link && !link.includes("VOTRE_LIEN")) {
          const email = bookingForm.querySelector('[name="email"]').value;
          const url = new URL(link);
          // Permet au webhook Stripe de savoir quelle date bloquer une fois le paiement confirmé.
          url.searchParams.set("client_reference_id", dateValue.value);
          if (email) url.searchParams.set("prefilled_email", email);
          stripeBtn.href = url.toString();
          stripeBtn.hidden = false;
        }

        if (whatsappBtn && CONFIG.WHATSAPP_NUMBER) {
          const nom = bookingForm.querySelector('[name="nom"]').value;
          const message = `Bonjour, je viens de faire une demande de réservation pour le ${dateDisplay.value}${nom ? " (" + nom + ")" : ""}, pouvez-vous me confirmer la disponibilité ?`;
          whatsappBtn.href = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
        }

        openBookingModal();
        bookingForm.querySelector("button[type=submit]").disabled = true;
      };

      if (!endpoint || endpoint.includes("VOTRE_ID_FORMSPREE")) {
        // Pas encore configuré : on affiche quand même la confirmation à l'écran.
        finishUp();
        return;
      }

      fetch(endpoint, {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" }
      })
        .then((res) => {
          if (res.ok) {
            finishUp();
          } else {
            alert("Une erreur est survenue lors de l'envoi. Merci de réessayer ou de nous contacter directement.");
          }
        })
        .catch(() => {
          alert("Une erreur est survenue lors de l'envoi. Merci de réessayer ou de nous contacter directement.");
        });
    });
  }

  // ----- Formulaire de contact -----
  const contactForm = document.getElementById("contact-form");
  const contactConfirm = document.getElementById("contact-confirm");

  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const endpoint = CONFIG.FORMSPREE_ENDPOINT;
      const formData = new FormData(contactForm);

      const finishUp = () => {
        contactConfirm.hidden = false;
        contactForm.querySelector("button[type=submit]").disabled = true;
      };

      if (!endpoint || endpoint.includes("VOTRE_ID_FORMSPREE")) {
        finishUp();
        return;
      }

      fetch(endpoint, {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" }
      })
        .then((res) => {
          if (res.ok) {
            finishUp();
          } else {
            alert("Une erreur est survenue lors de l'envoi. Merci de réessayer ou de nous contacter directement.");
          }
        })
        .catch(() => {
          alert("Une erreur est survenue lors de l'envoi. Merci de réessayer ou de nous contacter directement.");
        });
    });
  }
})();
