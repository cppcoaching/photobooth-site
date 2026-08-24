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
  const bookingConfirm = document.getElementById("booking-confirm");
  const stripeBtn = document.getElementById("stripe-deposit-btn");

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
        bookingConfirm.hidden = false;
        const formule = document.getElementById("formule-select").value;
        const link = (CONFIG.STRIPE_LINKS || {})[formule];
        if (link && !link.includes("VOTRE_LIEN")) {
          stripeBtn.href = link;
          stripeBtn.hidden = false;
        }
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
