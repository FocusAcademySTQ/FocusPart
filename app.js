const days = ["Dg","Dl","Dt","Dc","Dj","Dv","Ds"];
let classes = JSON.parse(localStorage.getItem("classes")) || [];
let editingId = null; // per saber si estem editant
let currentDate = new Date(); // mes actual

// 📌 Colors pastel per professors
const pastelColors = ["bg-blue-100","bg-green-100","bg-pink-100","bg-yellow-100","bg-purple-100","bg-teal-100"];
function getColorForTeacher(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return pastelColors[Math.abs(hash) % pastelColors.length];
}

// 📌 Obtenir mes actual
function getMonthDays(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  let daysArray = [];
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month, d);
    daysArray.push({ date, weekday: date.getDay() });
  }
  return daysArray;
}

// 📌 Render calendari mensual
function renderCalendar() {
  const calendar = document.getElementById("calendar");
  calendar.innerHTML = "";

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  document.getElementById("monthTitle").textContent =
    currentDate.toLocaleString("ca-ES", { month: "long", year: "numeric" });

  const monthDays = getMonthDays(year, month);

  // filtres actius
  const teacherFilter = document.getElementById("filterTeacher").value;
  const studentFilter = document.getElementById("filterStudent").value;

  // Omplir select professors i alumnes
  const teachers = [...new Set(classes.map(c => c.teacher))];
  const students = [...new Set(classes.map(c => c.student))];
  document.getElementById("filterTeacher").innerHTML = `<option value="">Tots els profes</option>` + teachers.map(t => `<option value="${t}" ${t===teacherFilter?'selected':''}>${t}</option>`).join("");
  document.getElementById("filterStudent").innerHTML = `<option value="">Tots els alumnes</option>` + students.map(s => `<option value="${s}" ${s===studentFilter?'selected':''}>${s}</option>`).join("");

  // Crear dies buits per començar en dilluns
  const firstDay = monthDays[0].weekday;
  for (let i = 0; i < (firstDay === 0 ? 6 : firstDay-1); i++) {
    const empty = document.createElement("div");
    empty.className = "p-2";
    calendar.appendChild(empty);
  }

  monthDays.forEach(dayObj => {
    const dayDiv = document.createElement("div");
    dayDiv.className = "bg-white rounded-lg shadow p-2 min-h-[100px] flex flex-col";

    const dayNumber = dayObj.date.getDate();
    dayDiv.innerHTML = `<div class="text-sm font-semibold mb-1">${dayNumber}</div>`;

    // classes d’aquest dia
    classes.filter(c => {
      const d = new Date(c.date);
      return d.toDateString() === dayObj.date.toDateString();
    }).filter(c => {
      return (!teacherFilter || c.teacher === teacherFilter) &&
             (!studentFilter || c.student === studentFilter);
    }).forEach(c => {
      const classDiv = document.createElement("div");
      classDiv.className = `fade-in ${getColorForTeacher(c.teacher)} rounded shadow p-1 mb-1 text-xs flex justify-between items-center ${c.cancelled ? 'opacity-50 line-through' : ''}`;
      classDiv.innerHTML = `
        <div>
          <div class="font-semibold">${c.time} - ${c.student}</div>
          <div class="text-gray-600">${c.teacher} (${c.price}€)</div>
        </div>
        <div class="flex gap-1">
          <button class="text-blue-600" onclick="editClass(${c.id})">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M15.232 5.232l3.536 3.536M9 11l6-6 3.536 3.536-6 6H9v-3.536z"/></svg>
          </button>
          <button class="text-red-600" onclick="toggleCancel(${c.id})">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      `;
      dayDiv.appendChild(classDiv);
    });

    calendar.appendChild(dayDiv);
  });
}

// 📌 Obrir / tancar modal
function openModal() {
  editingId = null;
  document.getElementById("date").value = "";
  document.getElementById("time").value = "";
  document.getElementById("teacher").value = "";
  document.getElementById("student").value = "";
  document.getElementById("price").value = "";
  document.getElementById("repeatWeekly").checked = false;
  document.getElementById("modal").classList.remove("hidden");
}
function closeModal() {
  document.getElementById("modal").classList.add("hidden");
}

// 📌 Guardar classe
function saveClass() {
  const date = document.getElementById("date").value;
  const time = document.getElementById("time").value;
  const teacher = document.getElementById("teacher").value;
  const student = document.getElementById("student").value;
  const price = parseFloat(document.getElementById("price").value) || 0;
  const repeat = document.getElementById("repeatWeekly").checked;

  if (editingId) {
    const c = classes.find(c => c.id === editingId);
    if (c) {
      c.date = date; c.time = time; c.teacher = teacher; c.student = student; c.price = price;
    }
  } else {
    const id = Date.now();
    classes.push({ id, date, time, teacher, student, price, cancelled:false });
    if (repeat) {
      let start = new Date(date);
      for (let i = 0; i < 8; i++) { // 8 setmanes ≈ 2 mesos
        start.setDate(start.getDate() + 7);
        const idr = Date.now() + i + 1;
        classes.push({ id: idr, date: start.toISOString().split("T")[0], time, teacher, student, price, cancelled:false });
      }
    }
  }

  localStorage.setItem("classes", JSON.stringify(classes));
  closeModal();
  renderCalendar();
}

// 📌 Editar classe
function editClass(id) {
  const c = classes.find(c => c.id === id);
  if (c) {
    editingId = id;
    document.getElementById("date").value = c.date;
    document.getElementById("time").value = c.time;
    document.getElementById("teacher").value = c.teacher;
    document.getElementById("student").value = c.student;
    document.getElementById("price").value = c.price;
    document.getElementById("modal").classList.remove("hidden");
  }
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

// 📌 Canvi de mesos
function prevMonth() {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
}
function nextMonth() {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
}

// 📌 Inici
document.getElementById("filterTeacher").addEventListener("change", renderCalendar);
document.getElementById("filterStudent").addEventListener("change", renderCalendar);
renderCalendar();
