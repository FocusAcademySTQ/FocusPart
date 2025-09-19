const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));

// 🔹 Connexió a Mongo Atlas
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ Connectat a MongoDB Atlas"))
  .catch(err => console.error("❌ Error de connexió:", err));

// 🔹 Models
const Professor = mongoose.model("Professor", new mongoose.Schema({
  nom: String,
  usuari: { type: String, unique: true },
  contrasenya: String
}));

const Classe = mongoose.model("Classe", new mongoose.Schema({
  alumne: String,
  profe: String, // aquí guardarem el nom del profe per simplicitat
  data: String,
  hora: String,
  preu: Number,
  done: { type: Boolean, default: false },
  cancelled: { type: Boolean, default: false }
}));

// 🔹 API Professors
app.post("/api/professors", async (req, res) => {
  try {
    const profe = new Professor(req.body);
    await profe.save();
    res.json(profe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/professors", async (req, res) => {
  const profes = await Professor.find({}, "nom usuari");
  res.json(profes);
});

// 🔹 API Classes
app.post("/api/classes", async (req, res) => {
  try {
    const classe = new Classe(req.body);
    await classe.save();
    res.json(classe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/classes", async (req, res) => {
  const classes = await Classe.find();
  res.json(classes);
});

app.put("/api/classes/:id/toggle", async (req, res) => {
  try {
    const classe = await Classe.findById(req.params.id);
    if (!classe) return res.status(404).json({ error: "No trobada" });
    classe.done = !classe.done;
    await classe.save();
    res.json(classe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Endpoint de prova
app.get("/api/ping", (req, res) => {
  res.json({ message: "pong 🏓", time: new Date() });
});

// 🔹 Arrencar servidor
app.listen(PORT, () => console.log(`🌍 Servidor a http://localhost:${PORT}`));
