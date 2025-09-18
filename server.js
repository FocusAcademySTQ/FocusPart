const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static("public"));

// SQLite
const db = new sqlite3.Database("./db.sqlite");

// Crear taules si no existeixen
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS professors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT,
    usuari TEXT UNIQUE,
    contrasenya TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS alumnes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alumne_id INTEGER,
    profe_id INTEGER,
    data TEXT,
    hora TEXT,
    preu REAL,
    done INTEGER,
    FOREIGN KEY(alumne_id) REFERENCES alumnes(id),
    FOREIGN KEY(profe_id) REFERENCES professors(id)
  )`);
});

// API: Login molt simple
app.post("/api/login", (req, res) => {
  const { usuari, contrasenya } = req.body;
  db.get(
    "SELECT * FROM professors WHERE usuari=? AND contrasenya=?",
    [usuari, contrasenya],
    (err, row) => {
      if (err) return res.status(500).json({ error: err });
      if (!row) return res.status(401).json({ error: "Credencials incorrectes" });

      if (row.usuari === "admin") {
        res.json({ rol: "admin", id: row.id, nom: row.nom });
      } else {
        res.json({ rol: "profe", id: row.id, nom: row.nom });
      }
    }
  );
});

// API: Afegir classe (només admin)
app.post("/api/classes", (req, res) => {
  const { alumne_id, profe_id, data, hora, preu } = req.body;
  db.run(
    "INSERT INTO classes (alumne_id, profe_id, data, hora, preu, done) VALUES (?,?,?,?,?,0)",
    [alumne_id, profe_id, data, hora, preu],
    function (err) {
      if (err) return res.status(500).json({ error: err });
      res.json({ id: this.lastID });
    }
  );
});

// API: Llistar classes
app.get("/api/classes", (req, res) => {
  db.all(
    `SELECT classes.id, alumnes.nom as alumne, professors.nom as profe, data, hora, preu, done
     FROM classes
     JOIN alumnes ON classes.alumne_id = alumnes.id
     JOIN professors ON classes.profe_id = professors.id`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err });
      res.json(rows);
    }
  );
});

// API: Toggle estat classe (feta/no feta)
app.put("/api/classes/:id/toggle", (req, res) => {
  db.run("UPDATE classes SET done = NOT done WHERE id=?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err });
    res.json({ changed: this.changes });
  });
});

// Inici servidor
app.listen(PORT, () => console.log(`Servidor a http://localhost:${PORT}`));
