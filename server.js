const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_FILE = path.join(__dirname, "data", "medicines.json");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/medicines", (req, res) => {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  res.json(data);
});

app.post("/api/medicines/:id/custom-time", (req, res) => {
  const medicines = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  const id = Number(req.params.id);

  const { hour, minute, period } = req.body;
  const medicine = medicines.find(m => m.id === id);

  if (!medicine) {
    return res.status(404).json({ error: "Medicine not found" });
  }

  let selectedHour = Number(hour);
  const selectedMinute = Number(minute);

  if (period === "PM" && selectedHour !== 12) {
    selectedHour += 12;
  }

  if (period === "AM" && selectedHour === 12) {
    selectedHour = 0;
  }

  const customDate = new Date();
  customDate.setHours(selectedHour, selectedMinute, 0, 0);

  medicine.lastTaken = customDate.toISOString();

  fs.writeFileSync(DATA_FILE, JSON.stringify(medicines, null, 2));

  const nextDose = new Date(
    customDate.getTime() + medicine.intervalHours * 60 * 60 * 1000
  );

  res.json({
    message: "Custom time saved",
    medicine,
    nextDose
  });
});

app.listen(PORT, () => {
  console.log(`Medicine reminder running at http://localhost:${PORT}`);
});