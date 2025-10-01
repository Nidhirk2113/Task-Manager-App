// Enhanced UI Management for Task Manager
class UIManager {
  constructor(storageAPI) {
      this.storage = storageAPI;
      this.chart = null;
      this.editingTaskId = null;
  }

  // Theme Management
  initThemeSelector() {
      const themeSelector = document.getElementById('themeSelector');
      const savedTheme = this.storage.getTheme();
      themeSelector.value = savedTheme;
      this.applyTheme(savedTheme);
  }

  applyTheme(themeName) {
      document.body.className = document.body.className.replace(/theme-\w+/g, '');
      if (themeName !== 'default') {
          document.body.classList.add(`theme-${themeName}`);
      }
      this.storage.setTheme(themeName);
  }

  // User Interface Management
  showLoginModal() {
      const modal = document.getElementById('loginModal');
      const mainApp = document.getElementById('mainApp');
      modal.classList.add('active');
      mainApp.style.display = 'none';
  }

  hideLoginModal() {
      const modal = document.getElementById('loginModal');
      const mainApp = document.getElementById('mainApp');
      modal.classList.remove('active');
      mainApp.style.display = 'block';
  }

  updateUserProfile(user) {
      document.getElementById('userAvatar').textContent = user.avatar;
      document.getElementById('userName').textContent = user.name;
      document.getElementById('userEmail').textContent = user.email;
  }

  // Task Rendering
  renderTasks(tasks, filter = 'all', categoryFilter = 'all', sort = 'newest') {
      const tasksContainer = document.getElementById('tasksList');
      
      // Filter tasks
      let filteredTasks = this.filterTasks(tasks, filter, categoryFilter);
      
      // Sort tasks
      filteredTasks = this.sortTasks(filteredTasks, sort);

      // Render tasks or empty state
      if (filteredTasks.length === 0) {
          tasksContainer.innerHTML = `
              <div class="empty-state">
                  <p>${this.getEmptyStateMessage(filter, categoryFilter)}</p>
              </div>
          `;
          return;
      }

      tasksContainer.innerHTML = filteredTasks.map(task => this.renderTask(task)).join('');
  }

  filterTasks(tasks, filter, categoryFilter) {
      let filteredTasks = tasks;
      
      // Status filter
      switch (filter) {
          case 'completed':
              filteredTasks = filteredTasks.filter(task => task.completed);
              break;
          case 'pending':
              filteredTasks = filteredTasks.filter(task => !task.completed);
              break;
      }
      
      // Category filter
      if (categoryFilter !== 'all') {
          filteredTasks = filteredTasks.filter(task => task.category === categoryFilter);
      }
      
      return filteredTasks;
  }

  sortTasks(tasks, sortBy) {
      const tasksCopy = [...tasks];
      
      switch (sortBy) {
          case 'oldest':
              return tasksCopy.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          case 'dueDate':
              return tasksCopy.sort((a, b) => {
                  if (!a.dueDate && !b.dueDate) return 0;
                  if (!a.dueDate) return 1;
                  if (!b.dueDate) return -1;
                  return new Date(a.dueDate) - new Date(b.dueDate);
              });
          case 'priority':
              const priorityOrder = { high: 3, medium: 2, low: 1 };
              return tasksCopy.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
          case 'a-z':
              return tasksCopy.sort((a, b) => a.title.toLowerCase().localeCompare(b.title.toLowerCase()));
          case 'newest':
          default:
              return tasksCopy.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
  }

  renderTask(task) {
      const isEditing = this.editingTaskId === task.id;
      const formattedDate = new Date(task.createdAt).toLocaleDateString();
      const dueDate = task.dueDate ? new Date(task.dueDate) : null;
      const isOverdue = dueDate && dueDate < new Date() && !task.completed;
      
      if (isEditing) {
          return this.renderEditForm(task);
      }

      return `
          <div class="task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
              <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
              <div class="task-content">
                  <div class="task-title">${this.escapeHtml(task.title)}</div>
                  ${task.description ? `<div class="task-description">${this.escapeHtml(task.description)}</div>` : ''}
                  <div class="task-meta">
                      <div class="task-meta-item">
                          <span class="task-priority priority-${task.priority}">${task.priority}</span>
                      </div>
                      <div class="task-meta-item">
                          <span class="task-category">${task.category}</span>
                      </div>
                      ${task.dueDate ? `
                          <div class="task-meta-item">
                              <span class="task-due ${isOverdue ? 'overdue' : ''}">
                                  📅 ${this.formatDate(task.dueDate)}
                              </span>
                          </div>
                      ` : ''}
                      ${task.estimatedTime ? `
                          <div class="task-meta-item">
                              <span>⏱️ ${task.estimatedTime}h</span>
                          </div>
                      ` : ''}
                      <div class="task-meta-item">
                          <span>📅 ${formattedDate}</span>
                      </div>
                  </div>
                  ${task.progress > 0 && !task.completed ? `
                      <div class="task-progress">
                          <div class="progress-bar-small">
                              <div class="progress-fill-small" style="width: ${task.progress}%"></div>
                          </div>
                          <span>${task.progress}%</span>
                      </div>
                  ` : ''}
              </div>
              <div class="task-actions">
                  <button class="edit-task" title="Edit task" aria-label="Edit task">✏️</button>
                  <button class="delete-task" title="Delete task" aria-label="Delete task">🗑️</button>
              </div>
          </div>
      `;
  }

  renderEditForm(task) {
      return `
          <div class="task-item" data-task-id="${task.id}">
              <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} disabled>
              <div class="task-content">
                  <form class="edit-form" data-task-id="${task.id}">
                      <div class="edit-form-row">
                          <input type="text" value="${this.escapeHtml(task.title)}" class="edit-title form-control" placeholder="Task title" required>
                      </div>
                      <div class="edit-form-row">
                          <textarea class="edit-description form-control" placeholder="Description (optional)">${this.escapeHtml(task.description || '')}</textarea>
                      </div>
                      <div class="edit-form-row">
                          <select class="edit-priority form-control">
                              <option value="low" ${task.priority === 'low' ? 'selected' : ''}>Low</option>
                              <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>Medium</option>
                              <option value="high" ${task.priority === 'high' ? 'selected' : ''}>High</option>
                          </select>
                          <select class="edit-category form-control">
                              <option value="Work" ${task.category === 'Work' ? 'selected' : ''}>Work</option>
                              <option value="Personal" ${task.category === 'Personal' ? 'selected' : ''}>Personal</option>
                              <option value="Health" ${task.category === 'Health' ? 'selected' : ''}>Health</option>
                              <option value="Finance" ${task.category === 'Finance' ? 'selected' : ''}>Finance</option>
                              <option value="Learning" ${task.category === 'Learning' ? 'selected' : ''}>Learning</option>
                              <option value="Shopping" ${task.category === 'Shopping' ? 'selected' : ''}>Shopping</option>
                              <option value="Travel" ${task.category === 'Travel' ? 'selected' : ''}>Travel</option>
                          </select>
                      </div>
                      <div class="edit-form-row">
                          <input type="date" value="${task.dueDate || ''}" class="edit-due-date form-control">
                          <input type="number" value="${task.estimatedTime || ''}" class="edit-time form-control" placeholder="Hours" min="0.5" max="24" step="0.5">
                          <input type="range" value="${task.progress}" class="edit-progress" min="0" max="100" step="5">
                          <span class="progress-display">${task.progress}%</span>
                      </div>
                      <div class="edit-form-row">
                          <button type="submit" class="btn btn-primary btn-small">Save</button>
                          <button type="button" class="btn btn-secondary btn-small cancel-edit">Cancel</button>
                      </div>
                  </form>
              </div>
          </div>
      `;
  }

  // Statistics and Chart Rendering
  renderStats(tasks) {
      const total = tasks.length;
      const completed = tasks.filter(task => task.completed).length;
      const pending = total - completed;
      const overdue = this.getOverdueTasks(tasks).length;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

      // Update stat numbers
      document.getElementById('totalTasks').textContent = total;
      document.getElementById('completedTasks').textContent = completed;
      document.getElementById('pendingTasks').textContent = pending;
      document.getElementById('overdueTasks').textContent = overdue;

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
                      'var(--success-color)',
                      'var(--border-color)'
                  ],
                  borderWidth: 0,
                  hoverOffset: 6
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
                          usePointStyle: true,
                          font: {
                              size: 14
                          }
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

      canvas.style.height = '200px';
  }

  // Download Functionality
  async downloadTasksAsImage(tasks, user) {
      try {
          // Create a temporary container for the image
          const container = document.createElement('div');
          container.style.cssText = `
              width: 800px;
              background: white;
              padding: 40px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              position: absolute;
              left: -9999px;
              top: 0;
          `;

          // Create content
          const content = this.createTasksImageContent(tasks, user);
          container.innerHTML = content;
          document.body.appendChild(container);

          // Generate image
          const canvas = await html2canvas(container, {
              backgroundColor: '#ffffff',
              scale: 2,
              logging: false,
              useCORS: true
          });

          // Clean up
          document.body.removeChild(container);

          // Download
          this.downloadImage(canvas, `tasks-${user.name}-${new Date().toISOString().split('T')[0]}.png`);
          
          this.showToast('Tasks downloaded as image!', 'success');
      } catch (error) {
          console.error('Error downloading tasks as image:', error);
          this.showToast('Failed to download tasks as image', 'error');
      }
  }

  async downloadProfileAsImage(user, stats) {
      try {
          const container = document.createElement('div');
          container.style.cssText = `
              width: 600px;
              background: white;
              padding: 40px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              position: absolute;
              left: -9999px;
              top: 0;
          `;

          const content = this.createProfileImageContent(user, stats);
          container.innerHTML = content;
          document.body.appendChild(container);

          const canvas = await html2canvas(container, {
              backgroundColor: '#ffffff',
              scale: 2,
              logging: false,
              useCORS: true
          });

          document.body.removeChild(container);
          this.downloadImage(canvas, `profile-${user.name}-${new Date().toISOString().split('T')[0]}.png`);
          
          this.showToast('Profile downloaded as image!', 'success');
      } catch (error) {
          console.error('Error downloading profile as image:', error);
          this.showToast('Failed to download profile as image', 'error');
      }
  }

  createTasksImageContent(tasks, user) {
      const completedTasks = tasks.filter(t => t.completed);
      const pendingTasks = tasks.filter(t => !t.completed);
      const overdueTasks = this.getOverdueTasks(tasks);
      
      return `
          <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #3b82f6; margin: 0; font-size: 2rem;">Task Manager Report</h1>
              <p style="color: #64748b; margin: 5px 0 0 0;">Generated for ${user.name} on ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div style="display: flex; gap: 20px; margin-bottom: 30px; justify-content: center;">
              <div style="text-align: center; padding: 20px; background: #f8fafc; border-radius: 8px; min-width: 100px;">
                  <div style="font-size: 2rem; font-weight: bold; color: #3b82f6;">${tasks.length}</div>
                  <div style="color: #64748b; font-size: 0.9rem;">Total Tasks</div>
              </div>
              <div style="text-align: center; padding: 20px; background: #f8fafc; border-radius: 8px; min-width: 100px;">
                  <div style="font-size: 2rem; font-weight: bold; color: #10b981;">${completedTasks.length}</div>
                  <div style="color: #64748b; font-size: 0.9rem;">Completed</div>
              </div>
              <div style="text-align: center; padding: 20px; background: #f8fafc; border-radius: 8px; min-width: 100px;">
                  <div style="font-size: 2rem; font-weight: bold; color: #f59e0b;">${pendingTasks.length}</div>
                  <div style="color: #64748b; font-size: 0.9rem;">Pending</div>
              </div>
              <div style="text-align: center; padding: 20px; background: #f8fafc; border-radius: 8px; min-width: 100px;">
                  <div style="font-size: 2rem; font-weight: bold; color: #ef4444;">${overdueTasks.length}</div>
                  <div style="color: #64748b; font-size: 0.9rem;">Overdue</div>
              </div>
          </div>
          
          <div style="margin-bottom: 20px;">
              <h3 style="color: #1e293b; margin-bottom: 15px;">Recent Tasks</h3>
              ${tasks.slice(0, 10).map(task => `
                  <div style="padding: 15px; margin-bottom: 10px; border: 1px solid #e2e8f0; border-radius: 8px; background: ${task.completed ? '#f0fdf4' : '#ffffff'};">
                      <div style="font-weight: 600; margin-bottom: 5px; ${task.completed ? 'text-decoration: line-through; color: #64748b;' : 'color: #1e293b;'}">${this.escapeHtml(task.title)}</div>
                      ${task.description ? `<div style="color: #64748b; font-size: 0.9rem; margin-bottom: 8px;">${this.escapeHtml(task.description)}</div>` : ''}
                      <div style="display: flex; gap: 10px; font-size: 0.8rem; color: #64748b;">
                          <span style="padding: 2px 8px; background: ${this.getPriorityColor(task.priority)}; border-radius: 12px; color: white;">${task.priority.toUpperCase()}</span>
                          <span style="padding: 2px 8px; background: #e2e8f0; border-radius: 12px;">${task.category}</span>
                          ${task.dueDate ? `<span>Due: ${this.formatDate(task.dueDate)}</span>` : ''}
                      </div>
                  </div>
              `).join('')}
          </div>
      `;
  }

  createProfileImageContent(user, stats) {
      return `
          <div style="text-align: center; margin-bottom: 30px;">
              <div style="font-size: 4rem; margin-bottom: 10px;">${user.avatar}</div>
              <h1 style="color: #1e293b; margin: 0; font-size: 2rem;">${user.name}</h1>
              <p style="color: #64748b; margin: 5px 0 0 0;">${user.email}</p>
              <p style="color: #64748b; font-size: 0.9rem;">Member since ${new Date(user.createdAt).toLocaleDateString()}</p>
          </div>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #1e293b; margin: 0 0 15px 0; text-align: center;">Task Statistics</h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                  <div style="text-align: center;">
                      <div style="font-size: 1.5rem; font-weight: bold; color: #3b82f6;">${stats.total}</div>
                      <div style="color: #64748b; font-size: 0.9rem;">Total Tasks</div>
                  </div>
                  <div style="text-align: center;">
                      <div style="font-size: 1.5rem; font-weight: bold; color: #10b981;">${stats.completed}</div>
                      <div style="color: #64748b; font-size: 0.9rem;">Completed</div>
                  </div>
                  <div style="text-align: center;">
                      <div style="font-size: 1.5rem; font-weight: bold; color: #f59e0b;">${stats.pending}</div>
                      <div style="color: #64748b; font-size: 0.9rem;">Pending</div>
                  </div>
                  <div style="text-align: center;">
                      <div style="font-size: 1.5rem; font-weight: bold; color: #ef4444;">${stats.overdue}</div>
                      <div style="color: #64748b; font-size: 0.9rem;">Overdue</div>
                  </div>
              </div>
              <div style="margin-top: 15px; text-align: center;">
                  <div style="background: #e2e8f0; height: 8px; border-radius: 4px; overflow: hidden; margin-bottom: 5px;">
                      <div style="background: #10b981; height: 100%; width: ${stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%; transition: width 0.3s ease;"></div>
                  </div>
                  <div style="color: #64748b; font-size: 0.9rem;">${stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}% Complete</div>
              </div>
          </div>
          
          <div style="text-align: center; color: #64748b; font-size: 0.8rem; border-top: 1px solid #e2e8f0; padding-top: 15px;">
              Generated on ${new Date().toLocaleDateString()} • Task Manager v2.0
          </div>
      `;
  }

  downloadImage(canvas, filename) {
      const link = document.createElement('a');
      link.download = filename;
      link.href = canvas.toDataURL();
      link.click();
  }

  // Utility Methods
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
      
      confirmBtn.focus();
  }

  showToast(message, type = 'info') {
      const toast = document.createElement('div');
      toast.className = `toast toast-${type}`;
      toast.textContent = message;
      
      const colors = {
          success: 'var(--success-color)',
          error: 'var(--danger-color)',
          warning: 'var(--warning-color)',
          info: 'var(--primary-color)'
      };
      
      toast.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 1rem 1.5rem;
          background: ${colors[type] || colors.info};
          color: white;
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
          z-index: 1001;
          opacity: 0;
          transform: translateX(100%);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          font-weight: 500;
      `;
      
      document.body.appendChild(toast);
      
      setTimeout(() => {
          toast.style.opacity = '1';
          toast.style.transform = 'translateX(0)';
      }, 10);
      
      setTimeout(() => {
          toast.style.opacity = '0';
          toast.style.transform = 'translateX(100%)';
          setTimeout(() => {
              if (toast.parentNode) {
                  document.body.removeChild(toast);
              }
          }, 300);
      }, 3000);
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

  formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
      });
  }

  getOverdueTasks(tasks) {
      const now = new Date();
      now.setHours(23, 59, 59, 999); // End of today
      return tasks.filter(task => 
          !task.completed && 
          task.dueDate && 
          new Date(task.dueDate) < now
      );
  }

  getPriorityColor(priority) {
      const colors = {
          high: '#ef4444',
          medium: '#f59e0b',
          low: '#10b981'
      };
      return colors[priority] || colors.medium;
  }

  getEmptyStateMessage(filter, categoryFilter) {
      if (filter === 'all' && categoryFilter === 'all') {
          return 'No tasks yet. Add one above to get started!';
      } else if (categoryFilter !== 'all') {
          return `No ${filter !== 'all' ? filter : ''} tasks found in ${categoryFilter} category.`;
      } else {
          return `No ${filter} tasks found.`;
      }
  }
}
