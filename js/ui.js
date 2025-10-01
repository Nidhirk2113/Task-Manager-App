// UI Management for Task Manager
class UIManager {
  constructor(storageAPI) {
      this.storage = storageAPI;
      this.chart = null;
      this.editingTaskId = null;
  }

  renderTasks(tasks, filter = 'all', sort = 'newest') {
      const tasksContainer = document.getElementById('tasksList');
      
      // Filter tasks
      let filteredTasks = tasks;
      switch (filter) {
          case 'completed':
              filteredTasks = tasks.filter(task => task.completed);
              break;
          case 'pending':
              filteredTasks = tasks.filter(task => !task.completed);
              break;
          default:
              filteredTasks = tasks;
      }

      // Sort tasks
      filteredTasks = this.sortTasks(filteredTasks, sort);

      // Render tasks or empty state
      if (filteredTasks.length === 0) {
          tasksContainer.innerHTML = `
              <div class="empty-state">
                  <p>${filter === 'all' ? 'No tasks yet. Add one above to get started!' : `No ${filter} tasks found.`}</p>
              </div>
          `;
          return;
      }

      tasksContainer.innerHTML = filteredTasks.map(task => this.renderTask(task)).join('');
  }

  renderTask(task) {
      const isEditing = this.editingTaskId === task.id;
      const formattedDate = new Date(task.createdAt).toLocaleDateString();
      
      if (isEditing) {
          return `
              <div class="task-item" data-task-id="${task.id}">
                  <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} disabled>
                  <div class="task-content">
                      <form class="edit-form" data-task-id="${task.id}">
                          <input type="text" value="${this.escapeHtml(task.title)}" class="edit-title" required>
                          <select class="edit-priority">
                              <option value="low" ${task.priority === 'low' ? 'selected' : ''}>Low</option>
                              <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>Medium</option>
                              <option value="high" ${task.priority === 'high' ? 'selected' : ''}>High</option>
                          </select>
                          <button type="submit" class="btn btn-small btn-primary">Save</button>
                          <button type="button" class="btn btn-small btn-secondary cancel-edit">Cancel</button>
                      </form>
                  </div>
              </div>
          `;
      }

      return `
          <div class="task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
              <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
              <div class="task-content">
                  <div class="task-title">${this.escapeHtml(task.title)}</div>
                  <div class="task-meta">
                      <span class="task-priority priority-${task.priority}">${task.priority}</span>
                      <span class="task-date">${formattedDate}</span>
                  </div>
              </div>
              <div class="task-actions">
                  <button class="edit-task" title="Edit task" aria-label="Edit task">✏️</button>
                  <button class="delete-task" title="Delete task" aria-label="Delete task">🗑️</button>
              </div>
          </div>
      `;
  }

  renderStats(tasks) {
      const total = tasks.length;
      const completed = tasks.filter(task => task.completed).length;
      const pending = total - completed;
      const highPriority = tasks.filter(task => task.priority === 'high').length;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

      // Update stat numbers
      document.getElementById('totalTasks').textContent = total;
      document.getElementById('completedTasks').textContent = completed;
      document.getElementById('pendingTasks').textContent = pending;
      document.getElementById('highPriorityTasks').textContent = highPriority;

      // Update progress bar
      const progressFill = document.getElementById('progressFill');
      const progressText = document.getElementById('progressText');
      progressFill.style.width = `${progress}%`;
      progressText.textContent = `${progress}% Complete`;
  }

  renderChart(tasks) {
      const canvas = document.getElementById('progressChart');
      const ctx = canvas.getContext('2d');
      
      const completed = tasks.filter(task => task.completed).length;
      const pending = tasks.length - completed;

      // Destroy existing chart
      if (this.chart) {
          this.chart.destroy();
      }

      // Create new chart
      this.chart = new Chart(ctx, {
          type: 'doughnut',
          data: {
              labels: ['Completed', 'Pending'],
              datasets: [{
                  data: [completed, pending],
                  backgroundColor: [
                      '#10b981', // Success green
                      '#e2e8f0'  // Light gray
                  ],
                  borderWidth: 0,
                  hoverOffset: 4
              }]
          },
          options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                  legend: {
                      position: 'bottom',
                      labels: {
                          padding: 20,
                          usePointStyle: true
                      }
                  },
                  tooltip: {
                      callbacks: {
                          label: function(context) {
                              const label = context.label || '';
                              const value = context.parsed;
                              const total = context.dataset.data.reduce((a, b) => a + b, 0);
                              const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                              return `${label}: ${value} (${percentage}%)`;
                          }
                      }
                  }
              },
              cutout: '60%'
          }
      });

      // Resize chart container
      canvas.style.height = '200px';
  }

  sortTasks(tasks, sortBy) {
      const tasksCopy = [...tasks];
      
      switch (sortBy) {
          case 'oldest':
              return tasksCopy.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          case 'a-z':
              return tasksCopy.sort((a, b) => a.title.toLowerCase().localeCompare(b.title.toLowerCase()));
          case 'priority':
              const priorityOrder = { high: 3, medium: 2, low: 1 };
              return tasksCopy.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
          case 'newest':
          default:
              return tasksCopy.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
  }

  showConfirmDialog(message, callback) {
      const modal = document.getElementById('confirmModal');
      const messageEl = document.getElementById('confirmMessage');
      const confirmBtn = document.getElementById('confirmOk');
      const cancelBtn = document.getElementById('confirmCancel');

      messageEl.textContent = message;
      modal.classList.add('active');

      const handleConfirm = () => {
          modal.classList.remove('active');
          callback(true);
          cleanup();
      };

      const handleCancel = () => {
          modal.classList.remove('active');
          callback(false);
          cleanup();
      };

      const cleanup = () => {
          confirmBtn.removeEventListener('click', handleConfirm);
          cancelBtn.removeEventListener('click', handleCancel);
      };

      confirmBtn.addEventListener('click', handleConfirm);
      cancelBtn.addEventListener('click', handleCancel);

      // Focus management
      confirmBtn.focus();
  }

  startEdit(taskId) {
      this.editingTaskId = taskId;
  }

  cancelEdit() {
      this.editingTaskId = null;
  }

  escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
  }

  showToast(message, type = 'info') {
      // Simple toast implementation
      const toast = document.createElement('div');
      toast.className = `toast toast-${type}`;
      toast.textContent = message;
      toast.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 1rem 1.5rem;
          background: var(--primary-color);
          color: white;
          border-radius: var(--border-radius);
          box-shadow: var(--shadow-lg);
          z-index: 1001;
          opacity: 0;
          transform: translateX(100%);
          transition: var(--transition);
      `;
      
      document.body.appendChild(toast);
      
      // Animate in
      setTimeout(() => {
          toast.style.opacity = '1';
          toast.style.transform = 'translateX(0)';
      }, 10);
      
      // Remove after 3 seconds
      setTimeout(() => {
          toast.style.opacity = '0';
          toast.style.transform = 'translateX(100%)';
          setTimeout(() => {
              document.body.removeChild(toast);
          }, 200);
      }, 3000);
  }
}
