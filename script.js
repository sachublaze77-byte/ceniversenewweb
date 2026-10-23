document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("wallpaperGrid");
  const cards = [...grid.querySelectorAll(".wallpaper-card")];
  const searchInput = document.getElementById("searchInput");
  const filters = [...document.querySelectorAll(".filter")];
  const emptyState = document.getElementById("emptyState");
  const count = document.getElementById("wallpaperCount");
  const toast = document.getElementById("toast");
  const lightbox = document.getElementById("lightbox");
  const lightboxImage = document.getElementById("lightboxImage");
  const lightboxCaption = document.getElementById("lightboxCaption");
  const lightboxDownload = document.getElementById("lightboxDownload");

  let activeFilter = "all";
  let currentImage = "";
  let currentName = "spidey-wallpaper.jpg";
  let toastTimer;

  document.getElementById("year").textContent = new Date().getFullYear();

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
  }

  // SEARCH + CATEGORY FILTERS
  function filterWallpapers() {
    const query = searchInput.value.trim().toLowerCase();
    let visible = 0;

    cards.forEach(card => {
      const title = card.dataset.title.toLowerCase();
      const category = card.dataset.category.toLowerCase();
      const description = card.querySelector(".card-info p").textContent.toLowerCase();

      const matchesSearch =
        title.includes(query) || description.includes(query);

      const matchesCategory =
        activeFilter === "all" || category === activeFilter;

      const show = matchesSearch && matchesCategory;
      card.hidden = !show;

      if (show) visible++;
    });

    count.textContent = String(visible).padStart(2, "0");
    emptyState.hidden = visible !== 0;
  }

  searchInput.addEventListener("input", filterWallpapers);

  filters.forEach(button => {
    button.addEventListener("click", () => {
      filters.forEach(item => item.classList.remove("active"));
      button.classList.add("active");
      activeFilter = button.dataset.filter;
      filterWallpapers();
    });
  });

  // DOWNLOAD A LOCAL WALLPAPER
  async function downloadWallpaper(file, filename) {
    if (!file) {
      showToast("Wallpaper file not found.");
      return;
    }

    try {
      showToast("Preparing your download...");

      const response = await fetch(file);

      if (!response.ok) {
        throw new Error("Image file is missing.");
      }

      const blob = await response.blob();

      if (!blob.type.startsWith("image/")) {
        throw new Error("The selected file is not an image.");
      }

      const objectURL = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = objectURL;
      link.download = filename || "spidey-wallpaper.jpg";
      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => URL.revokeObjectURL(objectURL), 1500);
      showToast("Download started! Enjoy your wallpaper.");
    } catch (error) {
      console.error("Wallpaper download failed:", error);
      showToast(
        "Download unavailable. Add the image file and run with Live Server."
      );
    }
  }

  document.querySelectorAll(".download-btn").forEach(button => {
    button.addEventListener("click", () => {
      downloadWallpaper(button.dataset.file, button.dataset.name);
    });
  });

  // FULLSCREEN PREVIEW
  function openPreview(card) {
    const img = card.querySelector(".wallpaper-image img");

    if (!img || img.style.display === "none" || !img.complete || !img.naturalWidth) {
      showToast("Add this wallpaper image to the images folder first.");
      return;
    }

    currentImage = card.querySelector(".download-btn").dataset.file;
    currentName = card.querySelector(".download-btn").dataset.name;

    lightboxImage.src = img.src;
    lightboxImage.alt = img.alt;
    lightboxCaption.textContent = card.dataset.title;
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  document.querySelectorAll(".preview-btn").forEach(button => {
    button.addEventListener("click", () => {
      openPreview(button.closest(".wallpaper-card"));
    });
  });

  function closePreview() {
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
    lightboxImage.src = "";
    document.body.style.overflow = "";
  }

  document.getElementById("lightboxClose").addEventListener("click", closePreview);

  lightbox.addEventListener("click", event => {
    if (event.target === lightbox) closePreview();
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closePreview();
  });

  lightboxDownload.addEventListener("click", () => {
    downloadWallpaper(currentImage, currentName);
  });

  // ANIMATED SCROLL REVEALS
  const revealItems = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });

    revealItems.forEach(item => observer.observe(item));
  } else {
    revealItems.forEach(item => item.classList.add("visible"));
  }

  // RED CURSOR GLOW ON DESKTOP
  const cursorGlow = document.getElementById("cursorGlow");

  if (window.matchMedia("(pointer: fine)").matches) {
    document.addEventListener("pointermove", event => {
      cursorGlow.style.left = `${event.clientX}px`;
      cursorGlow.style.top = `${event.clientY}px`;
    });
  } else {
    cursorGlow.style.display = "none";
  }

  filterWallpapers();
});