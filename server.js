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

app.post("/api/medicines/:id/taken", (req, res) => {
  const medicines = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  const id = Number(req.params.id);

  const medicine = medicines.find(m => m.id === id);

  if (!medicine) {
    return res.status(404).json({ error: "Medicine not found" });
  }

  medicine.lastTaken = new Date().toISOString();

  fs.writeFileSync(DATA_FILE, JSON.stringify(medicines, null, 2));

  res.json({
    message: "Updated successfully",
    medicine
  });
});

app.listen(PORT, () => {
  console.log(`Medicine reminder running at http://localhost:${PORT}`);
});