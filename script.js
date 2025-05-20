let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let currentSearchQuery = "";
let currentPriorityFilter = "All";

const inProgressList = document.getElementById("inprogress-list");
const completedList = document.getElementById("completed-list");
const overdueList = document.getElementById("overdue-list");
const countInProgress = document.getElementById("count-inprogress");
const countCompleted = document.getElementById("count-completed");
const countOverdue = document.getElementById("count-overdue");

document.getElementById("searchInput").addEventListener("input", (e) => {
  currentSearchQuery = e.target.value.toLowerCase();
  renderTasks();
});

document.querySelector(".add-task-btn").addEventListener("click", () => {
  document.getElementById("taskId").value = "";
  document.getElementById("taskForm").reset();
  document.getElementById("taskModal").style.display = "flex";
});

window.addEventListener("click", (e) => {
  const modal = document.getElementById("taskModal");
  if (e.target === modal) modal.style.display = "none";
});

function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function updateChecklist(id, newValue) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.checklist = newValue;
    saveTasks();
    renderTasks();
  }
}

function editTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  document.getElementById("taskId").value = task.id;
  document.getElementById("taskTitle").value = task.title;
  document.getElementById("taskDescription").value = task.description;
  document.getElementById("taskPriority").value = task.priority;
  document.getElementById("taskDueDate").value = task.dueDate;
  document.getElementById("taskCategory").value = task.category;
  document.getElementById("taskModal").style.display = "flex";
}

document.getElementById("taskForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const id = document.getElementById("taskId").value;
  const title = document.getElementById("taskTitle").value;
  const description = document.getElementById("taskDescription").value;
  const priority = document.getElementById("taskPriority").value;
  const dueDate = document.getElementById("taskDueDate").value;
  const category = document.getElementById("taskCategory").value;

  if (id) {
    const task = tasks.find(t => t.id == id);
    if (task) Object.assign(task, { title, description, priority, dueDate, category });
  } else {
    tasks.push({
      id: Date.now(),
      title, description, priority, dueDate, category,
      checklist: "0/3", status: "in-progress"
    });
  }

  saveAndRender();
  document.getElementById("taskModal").style.display = "none";
});

function changeStatus(id, newStatus) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.status = newStatus;
    saveAndRender();
  }
}

function deleteTask(id) {
  tasks = tasks.filter(task => task.id !== id);
  saveAndRender();
}

function saveAndRender() {
  saveTasks();
  renderTasks();
}

function renderTasks() {
  inProgressList.innerHTML = "";
  completedList.innerHTML = "";
  overdueList.innerHTML = "";

  let inProgressCount = 0, completedCount = 0, overdueCount = 0;

  tasks.forEach(task => {
    if (currentPriorityFilter !== "All" && task.priority !== currentPriorityFilter) return;
    if (currentSearchQuery && !task.title.toLowerCase().includes(currentSearchQuery)) return;

    const card = document.createElement("div");
    card.className = "task-card";
    card.draggable = true;
    card.dataset.id = task.id;

    const [done, total] = (task.checklist || "0/3").split("/").map(Number);
    const progress = total ? Math.min((done / total) * 100, 100) : 0;

    // Normalize category to create a safe class
const normalizedCategory = (task.category || "uncategorized")
  .toLowerCase()
  .replace(/\s+/g, '-')
  .replace(/[^a-z0-9\-]/g, '');
    card.innerHTML = `
      <div class="tags">
        <span class="tag tag-${task.priority.toLowerCase()}">${task.priority}</span>
        <span class="tag tag-date">${task.dueDate}</span>
        <span class="tag tag-${normalizedCategory}">${task.category}</span>
      </div>
      <h4>${task.title}</h4>
      <p>${task.description}</p>
      <div style="font-size: 13px; color: #888;">
        ✅ <input type="text" value="${task.checklist}" onchange="updateChecklist(${task.id}, this.value)" style="width: 50px; border: none; background: transparent; color: #555;" />
        <div class="progress-container">
          <div class="progress-bar" style="width: ${progress}%"></div>
        </div>
      </div>
      <div class="avatars">
        <img src="https://i.pravatar.cc/24?u=${task.id}" />
      </div>
      <div class="actions">
        <button onclick="editTask(${task.id})" title="Edit"><i class="fas fa-edit"></i></button>
        <button onclick="changeStatus(${task.id}, 'completed')" title="Complete"><i class="fas fa-check"></i></button>
        <button onclick="changeStatus(${task.id}, 'overdue')" title="Overdue"><i class="fas fa-exclamation-triangle"></i></button>
        <button onclick="deleteTask(${task.id})" title="Delete"><i class="fas fa-trash"></i></button>
      </div>
    `;

    if (task.status === "in-progress") {
      inProgressList.appendChild(card);
      inProgressCount++;
    } else if (task.status === "completed") {
      completedList.appendChild(card);
      completedCount++;
    } else {
      overdueList.appendChild(card);
      overdueCount++;
    }
  });

  countInProgress.textContent = inProgressCount;
  countCompleted.textContent = completedCount;
  countOverdue.textContent = overdueCount;

  [
    { element: inProgressList, status: "in-progress" },
    { element: completedList, status: "completed" },
    { element: overdueList, status: "overdue" }
  ].forEach(({ element, status }) => {
    element.ondragover = (e) => {
      e.preventDefault();
      element.classList.add("drag-over");
    };
    element.ondragleave = () => {
      element.classList.remove("drag-over");
    };
    element.ondrop = (e) => {
      e.preventDefault();
      element.classList.remove("drag-over");
      const taskId = parseInt(e.dataTransfer.getData("text/plain"));
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        task.status = status;
        saveAndRender();
      }
    };
  });
}

document.getElementById("sortPriorityBtn").addEventListener("click", () => {
  const priorityOrder = { "High": 1, "Medium": 2, "Low": 3 };
  tasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  saveAndRender();
});

document.getElementById("sortDateBtn").addEventListener("click", () => {
  tasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  saveAndRender();
});

document.getElementById("filterBtn").addEventListener("click", () => {
  const options = ["All", "High", "Medium", "Low"];
  const index = options.indexOf(currentPriorityFilter);
  currentPriorityFilter = options[(index + 1) % options.length];
  document.getElementById("filterBtn").textContent = `Filter: ${currentPriorityFilter}`;
  renderTasks();
});

document.getElementById("exportBtn").addEventListener("click", () => {
  const dataStr = JSON.stringify(tasks, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "tasks.json";
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById("importBtn").addEventListener("click", () => {
  document.getElementById("importInput").click();
});

document.getElementById("importInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (event) {
    try {
      const importedTasks = JSON.parse(event.target.result);
      if (Array.isArray(importedTasks)) {
        tasks = importedTasks;
        saveAndRender();
        alert("Tasks imported successfully!");
      } else {
        alert("Invalid file format.");
      }
    } catch {
      alert("Error reading file.");
    }
  };
  reader.readAsText(file);
});

renderTasks();

const today = new Date().toISOString().split("T")[0];
const overdueReminders = tasks.filter(task => task.status === "in-progress" && task.dueDate < today);
if (overdueReminders.length > 0) {
  alert(`Reminder: You have ${overdueReminders.length} overdue task(s).`);
}
