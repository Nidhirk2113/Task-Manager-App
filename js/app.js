(function (global) {
    const form = document.getElementById("taskForm");
    const input = document.getElementById("taskInput");
    const prioritySelect = document.getElementById("prioritySelect");
    const filterBtns = document.querySelectorAll(".filter-btn");
    const sortSelect = document.getElementById("sortSelect");
    const clearAllBtn = document.getElementById("clearAllBtn");
  
    let tasks = StorageAPI.all();
    let activeFilter = "all";
  
    function createTaskObject(title, priority) {
      return {
        id: Date.now().toString(),
        title,
        completed: false,
        priority: priority || "medium",
        createdAt: new Date().toISOString()
      };
    }
  
    function saveAndRender() {
      tasks = StorageAPI.all();
      const view = applySort(applyFilter(tasks));
      UI.render(view);
    }
  
    function applyFilter(arr) {
      if (activeFilter === "all") return arr.slice();
      if (activeFilter === "completed") return arr.filter(t => t.completed);
      if (activeFilter === "pending") return arr.filter(t => !t.completed);
      return arr.slice();
    }
  
    function applySort(arr) {
      const s = sortSelect.value;
      const copy = arr.slice();
      if (s === "newest") return copy.sort((a,b)=> new Date(b.createdAt)-new Date(a.createdAt));
      if (s === "oldest") return copy.sort((a,b)=> new Date(a.createdAt)-new Date(b.createdAt));
      if (s === "alpha") return copy.sort((a,b)=> a.title.localeCompare(b.title));
      if (s === "priority") {
        const order = { high: 0, medium: 1, low: 2 };
        return copy.sort((a,b)=> order[a.priority] - order[b.priority]);
      }
      return copy;
    }
  
    function addTask(title, priority) {
      const t = createTaskObject(title, priority);
      StorageAPI.add(t);
      saveAndRender();
    }
  
    function editTask(id, patch) {
      StorageAPI.update(id, patch);
      saveAndRender();
    }
  
    function toggleComplete(id) {
      const current = StorageAPI.all().find(t => t.id === id);
      if (!current) return;
      StorageAPI.update(id, { completed: !current.completed });
      saveAndRender();
    }
  
    function deleteTask(id) {
      if (!confirm("Delete this task? This action cannot be undone.")) return;
      StorageAPI.remove(id);
      saveAndRender();
    }
  
    function clearAll() {
      if (!confirm("Clear all tasks? This will remove everything stored locally.")) return;
      StorageAPI.clearAll();
      saveAndRender();
    }
  
    // wire UI events
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const title = input.value.trim();
      const priority = prioritySelect.value;
      if (!title) return;
      addTask(title, priority);
      input.value = "";
      input.focus();
    });
  
    filterBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        filterBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        activeFilter = btn.dataset.filter;
        saveAndRender();
      });
    });
  
    sortSelect.addEventListener("change", saveAndRender);
    clearAllBtn.addEventListener("click", clearAll);
  
    // public API used by UI handlers
    global.App = {
      toggleComplete,
      deleteTask,
      editTask
    };
  
    // init
    saveAndRender();
  
    // small friendly note in console
    console.log("Task Manager initialized (localStorage). Storage key:", StorageAPI.key);
  })(window);
  