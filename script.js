
const navLinks = document.getElementById("navLinks");
const menuBtn = document.getElementById("menuBtn");
const searchInput = document.getElementById("searchInput");
const movieGrid = document.getElementById("movieGrid");
const emptyState = document.getElementById("emptyState");

const modal = document.getElementById("bookingModal");
const closeModalBtn = document.getElementById("closeModal");
const modalMovieInfo = document.getElementById("modalMovieInfo");
const showSelect = document.getElementById("showSelect");
const seatMap = document.getElementById("seatMap");
const selectedSeatsText = document.getElementById("selectedSeats");
const totalPriceText = document.getElementById("totalPrice");
const confirmBtn = document.getElementById("confirmBooking");
const toast = document.getElementById("toast");

const TICKET_PRICE = 180;
const MAX_SEATS = 8;

let activeGenre = "All";
let currentMovie = null;
let selectedSeats = [];
let toastTimer;
let lastFocusedElement = null;

// Demo-only occupied seats, fixed for consistency.
const occupiedSeats = new Set([
    "A3", "A4", "B2", "B7", "C5",
    "D1", "D6", "E3", "E8"
]);

// Mobile navigation
menuBtn.addEventListener("click", () => {
    const open = navLinks.classList.toggle("open");
    menuBtn.textContent = open ? "✕" : "☰";
    menuBtn.setAttribute("aria-expanded", String(open));
});

navLinks.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
        navLinks.classList.remove("open");
        menuBtn.textContent = "☰";
        menuBtn.setAttribute("aria-expanded", "false");
    });
});

// Search and genre filters
function filterMovies() {
    const query = searchInput.value.trim().toLowerCase();
    let visibleCount = 0;

    document.querySelectorAll(".movie-card").forEach(card => {
        const title = card.dataset.title.toLowerCase();
        const genre = card.dataset.genre;
        const matchesSearch = title.includes(query);
        const matchesGenre = activeGenre === "All" || genre === activeGenre;
        const visible = matchesSearch && matchesGenre;

        card.hidden = !visible;

        if (visible) visibleCount++;
    });

    emptyState.hidden = visibleCount !== 0;
}

searchInput.addEventListener("input", filterMovies);

document.querySelectorAll(".filter").forEach(button => {
    button.addEventListener("click", () => {
        activeGenre = button.dataset.genre;

        document.querySelectorAll(".filter").forEach(filter => {
            const active = filter === button;
            filter.classList.toggle("active", active);
            filter.setAttribute("aria-pressed", String(active));
        });

        filterMovies();
    });

    button.setAttribute(
        "aria-pressed",
        String(button.classList.contains("active"))
    );
});

// Notifications
function showToast(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("visible");

    toastTimer = setTimeout(() => {
        toast.classList.remove("visible");
    }, 3000);
}

// Open a booking for the selected movie
function openBooking(card, preferredTime = null) {
    currentMovie = {
        title: card.dataset.title,
        genre: card.dataset.genre,
        rating: card.dataset.rating,
        duration: card.dataset.duration,
        description: card.dataset.description
    };

    lastFocusedElement = document.activeElement;
    selectedSeats = [];

    document.getElementById("modalTitle").innerHTML =
        'Choose your <span>seats.</span>';

    modalMovieInfo.textContent =
        `${currentMovie.title} · ${currentMovie.genre} · ` +
        `${currentMovie.duration} · ★ ${currentMovie.rating}`;

    showSelect.replaceChildren();

    const timeButtons = card.querySelectorAll("[data-time]");

    timeButtons.forEach(button => {
        const option = document.createElement("option");
        option.value = button.dataset.time;
        option.textContent = button.dataset.time;
        showSelect.appendChild(option);
    });

    if (preferredTime) {
        showSelect.value = preferredTime;
    }

    renderSeats();
    updateSummary();

    modal.hidden = false;
    document.body.classList.add("modal-open");
    closeModalBtn.focus();
}

function closeBooking() {
    modal.hidden = true;
    document.body.classList.remove("modal-open");

    if (lastFocusedElement) {
        lastFocusedElement.focus();
    }
}

// Book Now buttons
document.querySelectorAll("[data-book]").forEach(button => {
    button.addEventListener("click", () => {
        openBooking(button.closest(".movie-card"));
    });
});

// Clicking a showtime opens booking with that time selected.
document.querySelectorAll("[data-time]").forEach(button => {
    button.addEventListener("click", () => {
        openBooking(button.closest(".movie-card"), button.dataset.time);
    });
});

// Close modal
closeModalBtn.addEventListener("click", closeBooking);

modal.querySelectorAll("[data-close]").forEach(element => {
    element.addEventListener("click", closeBooking);
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !modal.hidden) {
        closeBooking();
    }
});

// Generate a cinema seating layout
function renderSeats() {
    seatMap.replaceChildren();

    const rows = ["A", "B", "C", "D", "E"];

    rows.forEach(row => {
        const rowElement = document.createElement("div");
        rowElement.className = "seat-row";

        const label = document.createElement("span");
        label.className = "row-label";
        label.textContent = row;
        rowElement.appendChild(label);

        // Three seats, an aisle, then six seats.
        // The aisle helps distinguish the seating blocks.
        for (let group = 0; group < 3; group++) {
            if (group > 0) {
                const aisle = document.createElement("span");
                aisle.setAttribute("aria-hidden", "true");
                aisle.style.width = group === 1 ? "7px" : "0px";
                rowElement.appendChild(aisle);
            }

            const seatGroup = document.createElement("div");
            seatGroup.className = "seat-group";

            const start = group === 0 ? 1 : group === 1 ? 4 : 7;
            const end = group === 0 ? 3 : group === 1 ? 6 : 9;

            for (let number = start; number <= end; number++) {
                const seatId = `${row}${number}`;
                const seat = document.createElement("button");

                seat.type = "button";
                seat.className = "seat";
                seat.textContent = number;
                seat.dataset.seat = seatId;

                const occupied = occupiedSeats.has(seatId);
                seat.disabled = occupied;

                if (occupied) {
                    seat.setAttribute("aria-label",
                        `Seat ${seatId}, occupied`);
                } else {
                    seat.setAttribute("aria-label",
                        `Seat ${seatId}, available`);
                    seat.setAttribute("aria-pressed", "false");

                    seat.addEventListener("click", () => {
                        toggleSeat(seatId);
                    });
                }

                seatGroup.appendChild(seat);
            }

            rowElement.appendChild(seatGroup);
        }

        seatMap.appendChild(rowElement);
    });
}

function toggleSeat(seatId) {
    if (selectedSeats.includes(seatId)) {
        selectedSeats = selectedSeats.filter(id => id !== seatId);
    } else {
        if (selectedSeats.length >= MAX_SEATS) {
            showToast(`You can select up to ${MAX_SEATS} seats.`);
            return;
        }

        selectedSeats.push(seatId);
    }

    const seatButtons = seatMap.querySelectorAll("[data-seat]");

    seatButtons.forEach(button => {
        const isSelected = selectedSeats.includes(button.dataset.seat);

        button.classList.toggle("selected", isSelected);
        button.setAttribute("aria-pressed", String(isSelected));
    });

    updateSummary();
}

function updateSummary() {
    selectedSeatsText.textContent = selectedSeats.length
        ? selectedSeats.slice().sort().join(", ")
        : "None";

    const total = selectedSeats.length * TICKET_PRICE;

    totalPriceText.textContent =
        `₹${total.toLocaleString("en-IN")}`;

    confirmBtn.disabled = selectedSeats.length === 0;
}

// Showtime changes do not change the sample ticket price.
showSelect.addEventListener("change", updateSummary);

// Demo booking confirmation
confirmBtn.addEventListener("click", () => {
    if (!currentMovie || selectedSeats.length === 0) {
        showToast("Please select at least one seat.");
        return;
    }

    const booking = {
        movie: currentMovie.title,
        showtime: showSelect.value,
        seats: [...selectedSeats].sort(),
        total: selectedSeats.length * TICKET_PRICE
    };

    // This is a demo, not a real booking or payment.
    document.getElementById("modalTitle").textContent =
        "You're all set!";

    modalMovieInfo.textContent =
        `${booking.movie} · ${booking.showtime}`;

    seatMap.replaceChildren();

    const receipt = document.createElement("div");
    receipt.style.cssText =
        "padding:25px 10px;text-align:center;line-height:2";

    const icon = document.createElement("div");
    icon.textContent = "✓";
    icon.style.cssText =
        "margin:auto auto 15px;width:54px;height:54px;" +
        "display:grid;place-items:center;border-radius:50%;" +
        "background:#17382c;color:#5ed5a0;font-size:28px";

    const details = document.createElement("p");
    details.textContent =
        `Seats: ${booking.seats.join(", ")}`;

    const amount = document.createElement("strong");
    amount.textContent =
        `Demo total: ₹${booking.total.toLocaleString("en-IN")}`;
    amount.style.color = "#e9bd70";

    const note = document.createElement("p");
    note.textContent =
        "Demo confirmation only. No ticket has been issued.";
    note.style.cssText =
        "margin-top:15px;color:#9496a5;font-size:11px";

    receipt.append(icon, details, amount, note);
    seatMap.appendChild(receipt);

    document.querySelector(".screen").hidden = true;
    document.querySelector(".seat-legend").hidden = true;
    document.querySelector(".show-select").hidden = true;

    selectedSeatsText.textContent = booking.seats.join(", ");
    totalPriceText.textContent =
        `₹${booking.total.toLocaleString("en-IN")}`;

    confirmBtn.textContent = "Done ✓";
    confirmBtn.disabled = false;
    confirmBtn.onclick = () => {
        resetModal();
        closeBooking();
        showToast("Thanks for trying CINEVERSE!");
    };
});

function resetModal() {
    document.querySelector(".screen").hidden = false;
    document.querySelector(".seat-legend").hidden = false;
    document.querySelector(".show-select").hidden = false;

    confirmBtn.textContent = "Confirm Booking ↗";
    confirmBtn.onclick = null;
    confirmBtn.disabled = true;

    selectedSeats = [];
    currentMovie = null;
}

// Initialize the booking button state
confirmBtn.disabled = true;
