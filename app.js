const days = ["Dilluns","Dimarts","Dimecres","Dijous","Divendres","Dissabte","Diumenge"];
let classes = JSON.parse(localStorage.getItem("classes")) || [];

// 📌 Mostrar/ocultar dies de repetició
document.addEventListener("DOMContentLoaded", () => {
  const repeatCheckbox = document.getElementById("repeat");
  if (repeatCheckbox) {
    repeatCheckbox.addEventListener("change", function() {
      document.getElementById("repeatDays").classList.toggle("hidden", !this.checked);
    });
  }
});

// 📌 Render calendari
function renderCalendar() {
  const calendar = document.getElementById("calendar");
  calendar.innerHTML = "";
  days.forEach((day, i) => {
    const col = document.createElement("div");
    col.className = "bg-white shadow rounded p-2";
    col.innerHTML = `<h3 class="font-bold mb-2">${day}</h3>`;
    classes.filter(c => parseInt(c.day) === i).forEach((c) => {
      const div = document.createElement("div");
      div.className = `p-2 mb-2 rounded ${c.cancelled ? 'bg-gray-300 line-through' : 'bg-green-200'}`;
      div.innerHTML = `
        <div><b>${c.time}</b> - ${c.teacher} amb ${c.student} (${c.price}€)</div>
        <button onclick="toggleCancel(${c.id})" class="text-xs mt-1 underline">Anul·lar</button>
      `;
      col.appendChild(div);
    });
    calendar.appendChild(col);
  });
  renderSummary();
}

// 📌 Afegir classe
function addClass() {
  const day = parseInt(document.getElementById("day").value);
  const time = document.getElementById("time").value;
  const teacher = document.getElementById("teacher").value;
  const student = document.getElementById("student").value;
  const price = parseFloat(document.getElementById("price").value) || 0;
  const repeat = document.getElementById("repeat").checked;

  if (repeat) {
    // Afegir per a tots els dies seleccionats
    const repeatDays = [...document.querySelectorAll("#repeatDays input:checked")].map(cb => parseInt(cb.value));
    repeatDays.forEach(d => {
      const id = Date.now() + Math.floor(Math.random() * 1000); // id únic
      classes.push({ id, day: d, time, teacher, student, price, cancelled: false });
    });
  } else {
    // Classe única
    const id = Date.now();
    classes.push({ id, day, time, teacher, student, price, cancelled: false });
  }

  localStorage.setItem("classes", JSON.stringify(classes));
  renderCalendar();
}

// 📌 Anul·lar / reactivar classe
function toggleCancel(id) {
  const c = classes.find(c => c.id === id);
  if (c) {
    c.cancelled = !c.cancelled;
    localStorage.setItem("classes", JSON.stringify(classes));
    renderCalendar();
  }
}

// 📌 Resum mensual
function renderSummary() {
  const summary = document.getElementById("summary");
  if (classes.length === 0) {
    summary.innerHTML = "Encara no hi ha dades.";
    return;
  }
  let totals = {};
  classes.forEach(c => {
    if (!totals[c.teacher]) totals[c.teacher] = { hores: 0, diners: 0 };
    if (!c.cancelled) {
      totals[c.teacher].hores += 1;
      totals[c.teacher].diners += c.price;
    }
  });
  summary.innerHTML = Object.entries(totals).map(([teacher, t]) =>
    `<p><b>${teacher}</b>: ${t.hores} classes, ${t.diners} €</p>`
  ).join("");
}

// 📌 Reset mensual (esborrar dades)
function resetMonth() {
  if (confirm("Segur que vols fer reset del mes?")) {
    classes = [];
    localStorage.setItem("classes", JSON.stringify(classes));
    renderCalendar();
  }
}

renderCalendar();
