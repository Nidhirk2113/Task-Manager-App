(function (global) {
    const selectors = {
      taskList: document.getElementById("taskList"),
      emptyState: document.getElementById("emptyState"),
      totalCount: document.getElementById("totalCount"),
      completedCount: document.getElementById("completedCount"),
      pendingCount: document.getElementById("pendingCount"),
      progressFill: document.getElementById("progressFill"),
      progressChart: document.getElementById("progressChart"),
      highCount: document.getElementById("highCount"),
      lowCount: document.getElementById("lowCount"),
    };
  
    let chartInstance = null;
  
    function createTaskNode(task) {
      const li = document.createElement("li");
      li.className = "task-item";
      li.dataset.id = task.id;
  
      const left = document.createElement("div");
      left.className = "task-left";
  
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = !!task.completed;
      checkbox.setAttribute("aria-label", "Mark task complete");
  
      const titleWrap = document.createElement("div");
      titleWrap.style.flex = "1";
  
      const title = document.createElement("div");
      title.className = "task-title" + (task.completed ? " done" : "");
      title.textContent = task.title;
      title.title = task.title;
  
      const meta = document.createElement("div");
      meta.className = "task-meta";
      const created = new Date(task.createdAt).toLocaleString();
      meta.textContent = `${created} • ${task.priority || "medium"} priority`;
  
      titleWrap.appendChild(title);
      titleWrap.appendChild(meta);
  
      left.appendChild(checkbox);
      left.appendChild(titleWrap);
  
      const actions = document.createElement("div");
      actions.className = "task-actions";
  
      const editBtn = document.createElement("button");
      editBtn.className = "icon-btn";
      editBtn.title = "Edit";
      editBtn.innerHTML = "✏️";
  
      const deleteBtn = document.createElement("button");
      deleteBtn.className = "icon-btn";
      deleteBtn.title = "Delete";
      deleteBtn.innerHTML = "🗑️";
  
      const priorityBadge = document.createElement("div");
      if (task.priority === "high") {
        priorityBadge.className = "priority-high";
        priorityBadge.textContent = "High";
      } else if (task.priority === "low") {
        priorityBadge.className = "priority-low";
        priorityBadge.textContent = "Low";
      } else {
        priorityBadge.className = "priority-medium";
        priorityBadge.textContent = "Med";
      }
  
      actions.appendChild(priorityBadge);
      actions.appendChild(editBtn);
      actions.appendChild(deleteBtn);
  
      li.appendChild(left);
      li.appendChild(actions);
  
      // attach handlers
      checkbox.addEventListener("change", () => {
        global.App.toggleComplete(task.id);
      });
  
      deleteBtn.addEventListener("click", () => {
        global.App.deleteTask(task.id);
      });
  
      editBtn.addEventListener("click", () => {
        editInline(li, task);
      });
  
      return li;
    }
  
    function editInline(listItem, task) {
      const titleDiv = listItem.querySelector(".task-title");
      const meta = listItem.querySelector(".task-meta");
      const actions = listItem.querySelector(".task-actions");
      // Hide original
      titleDiv.style.display = "none";
      meta.style.display = "none";
      actions.style.display = "none";
  
      // create edit UI
      const editWrap = document.createElement("div");
      editWrap.style.display = "flex";
      editWrap.style.gap = "8px";
      editWrap.style.alignItems = "center";
      editWrap.style.width = "100%";
  
      const input = document.createElement("input");
      input.type = "text";
      input.value = task.title;
      input.style.flex = "1";
      input.className = "edit-input";
  
      const prioritySelect = document.createElement("select");
      ["high","medium","low"].forEach(p=>{
        const o=document.createElement("option");
        o.value=p;o.text=o.value;
        if(p===task.priority) o.selected=true;
        prioritySelect.appendChild(o);
      });
  
      const saveBtn = document.createElement("button");
      saveBtn.textContent = "Save";
      saveBtn.className = "small";
  
      const cancelBtn = document.createElement("button");
      cancelBtn.textContent = "Cancel";
      cancelBtn.className = "small";
  
      editWrap.appendChild(input);
      editWrap.appendChild(prioritySelect);
      editWrap.appendChild(saveBtn);
      editWrap.appendChild(cancelBtn);
  
      listItem.querySelector(".task-left").appendChild(editWrap);
      input.focus();
  
      cancelBtn.addEventListener("click", () => {
        editWrap.remove();
        titleDiv.style.display = "";
        meta.style.display = "";
        actions.style.display = "";
      });
  
      saveBtn.addEventListener("click", () => {
        const newTitle = input.value.trim();
        const newPriority = prioritySelect.value;
        if (!newTitle) {
          input.focus();
          return;
        }
        global.App.editTask(task.id, { title: newTitle, priority: newPriority });
      });
    }
  
    function renderList(tasks) {
      selectors.taskList.innerHTML = "";
      if (!tasks || tasks.length === 0) {
        selectors.emptyState.style.display = "block";
        return;
      }
      selectors.emptyState.style.display = "none";
      tasks.forEach(t => {
        selectors.taskList.appendChild(createTaskNode(t));
      });
    }
  
    function updateStats(tasks) {
      const total = tasks.length;
      const completed = tasks.filter(t => t.completed).length;
      const pending = total - completed;
      const high = tasks.filter(t => t.priority === "high").length;
      const low = tasks.filter(t => t.priority === "low").length;
  
      selectors.totalCount.textContent = total;
      selectors.completedCount.textContent = completed;
      selectors.pendingCount.textContent = pending;
      selectors.highCount.textContent = high;
      selectors.lowCount.textContent = low;
  
      const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
      selectors.progressFill.style.width = pct + "%";
    }
  
    function drawChart(tasks) {
      const completed = tasks.filter(t => t.completed).length;
      const pending = tasks.length - completed;
  
      const data = {
        labels: ["Completed", "Pending"],
        datasets: [{
          data: [completed, pending],
          backgroundColor: ["#10b981", "#ef4444"]
        }]
      };
  
      if (!chartInstance) {
        chartInstance = new Chart(selectors.progressChart.getContext("2d"), {
          type: "doughnut",
          data,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%',
            plugins: {
              legend: { position: 'bottom' },
              tooltip: { enabled: true }
            }
          }
        });
      } else {
        chartInstance.data = data;
        chartInstance.update();
      }
    }
  
    function render(tasks) {
      const copy = Array.isArray(tasks) ? tasks.slice() : [];
      renderList(copy);
      updateStats(copy);
      drawChart(copy);
    }
  
    // Expose
    global.UI = {
      render,
      selectors
    };
  })(window);
  