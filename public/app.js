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

function showMissedForm(id) {
  const form = document.getElementById(`missed-form-${id}`);
  form.style.display = form.style.display === "none" ? "block" : "none";
}

async function saveMissedTime(id) {
  const hour = document.getElementById(`hour-${id}`).value;
  const minute = document.getElementById(`minute-${id}`).value;
  const period = document.getElementById(`period-${id}`).value;

  await fetch(`/api/medicines/${id}/custom-time`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ hour, minute, period })
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

    const hourOptions = Array.from({ length: 12 }, (_, i) => {
      const hour = i + 1;
      return `<option value="${hour}">${hour}</option>`;
    }).join("");

    const minuteOptions = ["00", "15", "30", "45"].map(min => {
      return `<option value="${min}">${min}</option>`;
    }).join("");

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
        I took it now
      </button>

      <button class="missed" onclick="showMissedForm(${med.id})">
        I took it at missed time
      </button>

      <div class="missed-form" id="missed-form-${med.id}" style="display:none;">
        <p class="info">Select the time you actually took it:</p>

        <div class="time-row">
          <select id="hour-${med.id}">
            ${hourOptions}
          </select>

          <select id="minute-${med.id}">
            ${minuteOptions}
          </select>

          <select id="period-${med.id}">
            <option value="AM">AM</option>
            <option value="PM">PM</option>
          </select>
        </div>

        <button class="save-time" onclick="saveMissedTime(${med.id})">
          Save this time
        </button>
      </div>
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