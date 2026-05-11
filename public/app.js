const medicineList = document.getElementById("medicineList");
const notifyBtn = document.getElementById("notifyBtn");

notifyBtn.addEventListener("click", async () => {
  if ("Notification" in window) {
    await Notification.requestPermission();
    alert("Notifications enabled");
  }
});

async function fetchMedicines() {
  const res = await fetch("/api/medicines");
  return await res.json();
}

function calculateNextDose(lastTaken, intervalHours) {
  const last = new Date(lastTaken);
  return new Date(last.getTime() + intervalHours * 60 * 60 * 1000);
}

function formatTime(date) {
  return date.toLocaleString([], {
    hour: "2-digit",
    minute: "2-digit",
    day: "numeric",
    month: "short"
  });
}

async function markTaken(id) {
  await fetch(`/api/medicines/${id}/taken`, {
    method: "POST"
  });

  loadMedicines();
}

async function loadMedicines() {
  const medicines = await fetchMedicines();
  medicineList.innerHTML = "";

  medicines.forEach(med => {
    const nextDose = calculateNextDose(med.lastTaken, med.intervalHours);
    const now = new Date();
    const isDue = now >= nextDose;

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <h2>${med.name}</h2>
      <p class="info">Take every ${med.intervalHours} hours</p>
      <p class="info">Last taken: ${formatTime(new Date(med.lastTaken))}</p>
      <p class="${isDue ? "due" : "next"}">
        ${isDue ? "Time to take now" : "Next dose: " + formatTime(nextDose)}
      </p>
      <p class="info">Duration: ${med.durationDays} days</p>
      <button class="taken" onclick="markTaken(${med.id})">
        I took this medicine
      </button>
    `;

    medicineList.appendChild(card);

    if (isDue && Notification.permission === "granted") {
      new Notification(`Time to take ${med.name}`, {
        body: `${med.name} is due now.`
      });
    }
  });
}

loadMedicines();
setInterval(loadMedicines, 60000);