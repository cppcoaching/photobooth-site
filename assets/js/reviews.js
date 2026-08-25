(function () {
  const grid = document.getElementById("reviews-grid");
  const heroCount = document.getElementById("hero-review-count");
  if (!grid && !heroCount) return;

  fetch("data/reviews.json")
    .then((res) => res.json())
    .then((data) => {
      const reviews = data.reviews || [];
      if (heroCount) heroCount.textContent = `(${reviews.length})`;
      if (!grid) return;
      grid.innerHTML = reviews
        .map(
          (r) => `
        <div class="review-card">
          <span class="review-stars">${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</span>
          <p class="review-text">"${r.text}"</p>
          <p class="review-author">${r.author} <span>· ${r.context}</span></p>
        </div>
      `
        )
        .join("");
    })
    .catch(() => {
      grid.innerHTML = "<p class=\"review-fallback\">Retrouvez tous nos avis sur notre fiche Google.</p>";
    });
})();
