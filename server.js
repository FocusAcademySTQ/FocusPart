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
  contrasenya: String,
  valoracio: { type: Number, default: 0 }
}));

const Classe = mongoose.model("Classe", new mongoose.Schema({
  alumne: String,
  profe: String, // guardem el nom del profe
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
  const profes = await Professor.find({}, "nom usuari contrasenya valoracio");
  res.json(profes);
});

// 🔹 Actualitzar valoració / dades del professor
app.put("/api/professors/:id", async (req, res) => {
  try {
    const profe = await Professor.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!profe) return res.status(404).json({ error: "Professor no trobat" });
    res.json(profe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔹 API Login
app.post("/api/login", async (req, res) => {
  const { usuari, contrasenya } = req.body;
  try {
    // 👇 Cas especial admin
    if (usuari === "admin" && contrasenya === "Focusgrup4") {
      return res.json({ id: "0", nom: "Administrador", usuari: "admin", role: "admin" });
    }

    // 👇 Professors a Mongo
    const user = await Professor.findOne({ usuari, contrasenya });
    if (!user) return res.status(401).json({ error: "Credencials incorrectes" });

    res.json({ id: user._id, nom: user.nom, usuari: user.usuari, role: "profe" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
  try {
    const { month } = req.query;
    let filter = {};
    if (month) {
      const [year, mon] = month.split("-");
      const start = new Date(year, mon - 1, 1);
      const end = new Date(year, mon, 0, 23, 59, 59);
      filter = {
        data: { $gte: start.toISOString().split("T")[0], $lte: end.toISOString().split("T")[0] }
      };
    }
    const classes = await Classe.find(filter);
    res.json(classes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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

app.put("/api/classes/:id/cancel", async (req, res) => {
  try {
    const classe = await Classe.findById(req.params.id);
    if (!classe) return res.status(404).json({ error: "No trobada" });
    classe.cancelled = !classe.cancelled;
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
