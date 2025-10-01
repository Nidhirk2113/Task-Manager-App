// Enhanced Task Manager Application
class TaskManager {
  constructor() {
      this.storageKeys = {
          users: 'taskmanager_users_v2',
          currentUser: 'taskmanager_current_user_v2',
          tasks: 'taskmanager_tasks_v2_',
          theme: 'taskmanager_theme_v2'
      };
      
      this.themes = {
          default: { primary: '#3b82f6', name: 'Default Blue' },
          forest: { primary: '#10b981', name: 'Forest Green' },
          sunset: { primary: '#f59e0b', name: 'Sunset Orange' },
          berry: { primary: '#8b5cf6', name: 'Berry Purple' },
          ocean: { primary: '#06b6d4', name: 'Ocean Teal' },
          rose: { primary: '#ec4899', name: 'Rose Pink' }
      };

      this.categories = ['Work', 'Personal', 'Health', 'Finance', 'Learning', 'Shopping', 'Travel'];
      this.avatars = ['👤', '👨‍💼', '👩‍💼', '👨‍💻', '👩‍💻', '👨‍🎨', '👩‍🎨', '🧑‍🎓'];

      this.currentUser = null;
      this.tasks = [];
      this.currentFilter = 'all';
      this.currentCategoryFilter = 'all';
      this.currentSort = 'newest';
      this.editingTaskId = null;
      this.chart = null;
      this.confirmCallback = null;
      this.selectedAvatar = '👤';

      this.init();
  }

  // Initialize the application
  init() {
      this.loadTheme();
      this.checkUserLogin();
      this.setupEventListeners();
  }

  // Theme Management
  loadTheme() {
      const savedTheme = localStorage.getItem(this.storageKeys.theme) || 'default';
      this.applyTheme(savedTheme);
      document.getElementById('themeSelector').value = savedTheme;
  }

  applyTheme(themeName) {
      document.body.className = document.body.className.replace(/theme-\w+/g, '');
      if (themeName !== 'default') {
          document.body.classList.add(`theme-${themeName}`);
      }
      localStorage.setItem(this.storageKeys.theme, themeName);
  }

  // User Management
  checkUserLogin() {
      const currentUserId = localStorage.getItem(this.storageKeys.currentUser);
      if (currentUserId) {
          const users = this.getUsers();
          this.currentUser = users.find(user => user.id === currentUserId);
      }

      if (!this.currentUser) {
          this.showLoginModal();
      } else {
          this.startApplication();
      }
  }

  getUsers() {
      try {
          const data = localStorage.getItem(this.storageKeys.users);
          return data ? JSON.parse(data) : [];
      } catch (error) {
          console.error('Error reading users from localStorage:', error);
          return [];
      }
  }

  saveUser(user) {
      try {
          const users = this.getUsers();
          const existingIndex = users.findIndex(u => u.id === user.id);
          
          if (existingIndex !== -1) {
              users[existingIndex] = user;
          } else {
              users.push(user);
          }
          
          localStorage.setItem(this.storageKeys.users, JSON.stringify(users));
          return user;
      } catch (error) {
          console.error('Error saving user to localStorage:', error);
          return null;
      }
  }

  createUser(name, email, avatar) {
      const user = {
          id: this.generateId(),
          name: name.trim(),
          email: email.trim(),
          avatar: avatar,
          createdAt: new Date().toISOString()
      };

      return this.saveUser(user);
  }

  loginUser(email) {
      const users = this.getUsers();
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (user) {
          this.currentUser = user;
          localStorage.setItem(this.storageKeys.currentUser, user.id);
          this.hideLoginModal();
          this.startApplication();
          return true;
      }
      return false;
  }

  logoutUser() {
      this.currentUser = null;
      localStorage.removeItem(this.storageKeys.currentUser);
      this.showLoginModal();
  }

  showLoginModal() {
      const modal = document.getElementById('loginModal');
      modal.classList.remove('hidden');
      modal.setAttribute('aria-hidden', 'false');
  }

  hideLoginModal() {
      const modal = document.getElementById('loginModal');
      modal.classList.add('hidden');
      modal.setAttribute('aria-hidden', 'true');
  }

  startApplication() {
      this.updateUserProfile();
      this.loadTasks();
      this.render();
      this.initChart();
  }

  updateUserProfile() {
      document.getElementById('userAvatar').textContent = this.currentUser.avatar;
      document.getElementById('userName').textContent = this.currentUser.name;
      
      // Update profile modal
      document.getElementById('profileAvatar').textContent = this.currentUser.avatar;
      document.getElementById('profileName').textContent = this.currentUser.name;
      document.getElementById('profileEmail').textContent = this.currentUser.email;
      
      // Update profile form
      document.getElementById('profileNameInput').value = this.currentUser.name;
      document.getElementById('profileEmailInput').value = this.currentUser.email;
      
      // Update avatar selector
      document.querySelectorAll('#profileAvatarSelector .avatar-option').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.avatar === this.currentUser.avatar);
      });
  }

  // Task Storage with User Support
  getTaskStorageKey() {
      return this.storageKeys.tasks + this.currentUser.id;
  }

  loadTasks() {
      try {
          const data = localStorage.getItem(this.getTaskStorageKey());
          this.tasks = data ? JSON.parse(data) : [];
      } catch (error) {
          console.error('Error reading tasks from localStorage:', error);
          this.tasks = [];
      }
  }

  saveTasks() {
      try {
          localStorage.setItem(this.getTaskStorageKey(), JSON.stringify(this.tasks));
          return true;
      } catch (error) {
          console.error('Error saving tasks to localStorage:', error);
          return false;
      }
  }

  // Generate unique ID
  generateId() {
      return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Enhanced Task Management
  addTask(taskData) {
      const task = {
          id: this.generateId(),
          title: taskData.title.trim(),
          description: taskData.description?.trim() || '',
          completed: false,
          priority: taskData.priority || 'medium',
          category: taskData.category || 'Personal',
          dueDate: taskData.dueDate || null,
          estimatedTime: parseInt(taskData.estimatedTime) || 60,
          progress: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          userId: this.currentUser.id
      };

      this.tasks.push(task);
      if (this.saveTasks()) {
          this.render();
          return task;
      }
      return null;
  }

  updateTask(id, updates) {
      const index = this.tasks.findIndex(task => task.id === id);
      if (index !== -1) {
          this.tasks[index] = {
              ...this.tasks[index],
              ...updates,
              updatedAt: new Date().toISOString()
          };
          
          if (this.saveTasks()) {
              this.render();
              return this.tasks[index];
          }
      }
      return null;
  }

  deleteTask(id) {
      this.tasks = this.tasks.filter(task => task.id !== id);
      if (this.saveTasks()) {
          this.render();
          return true;
      }
      return false;
  }

  clearAllTasks() {
      this.tasks = [];
      if (this.saveTasks()) {
          this.render();
          return true;
      }
      return false;
  }

  toggleTask(id) {
      const task = this.tasks.find(task => task.id === id);
      if (task) {
          this.updateTask(id, { 
              completed: !task.completed,
              progress: !task.completed ? 100 : task.progress
          });
      }
  }

  // Enhanced Filtering and Sorting
  getFilteredTasks() {
      let filteredTasks = [...this.tasks];

      // Apply status filter
      switch (this.currentFilter) {
          case 'pending':
              filteredTasks = filteredTasks.filter(task => !task.completed);
              break;
          case 'completed':
              filteredTasks = filteredTasks.filter(task => task.completed);
              break;
          case 'overdue':
              filteredTasks = filteredTasks.filter(task => {
                  if (!task.dueDate || task.completed) return false;
                  return new Date(task.dueDate) < new Date();
              });
              break;
      }

      // Apply category filter - Fixed the filtering logic
      if (this.currentCategoryFilter && this.currentCategoryFilter !== 'all') {
          filteredTasks = filteredTasks.filter(task => 
              task.category === this.currentCategoryFilter
          );
      }

      // Apply sorting
      switch (this.currentSort) {
          case 'oldest':
              filteredTasks.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
              break;
          case 'a-z':
              filteredTasks.sort((a, b) => a.title.localeCompare(b.title));
              break;
          case 'priority':
              const priorityOrder = { high: 3, medium: 2, low: 1 };
              filteredTasks.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
              break;
          case 'dueDate':
              filteredTasks.sort((a, b) => {
                  if (!a.dueDate && !b.dueDate) return 0;
                  if (!a.dueDate) return 1;
                  if (!b.dueDate) return -1;
                  return new Date(a.dueDate) - new Date(b.dueDate);
              });
              break;
          case 'estimatedTime':
              filteredTasks.sort((a, b) => a.estimatedTime - b.estimatedTime);
              break;
          case 'newest':
          default:
              filteredTasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
              break;
      }

      return filteredTasks;
  }

  // Enhanced Statistics
  getStats() {
      const total = this.tasks.length;
      const completed = this.tasks.filter(task => task.completed).length;
      const pending = total - completed;
      const highPriority = this.tasks.filter(task => task.priority === 'high').length;
      
      const overdue = this.tasks.filter(task => {
          if (!task.dueDate || task.completed) return false;
          return new Date(task.dueDate) < new Date();
      }).length;
      
      const progressPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
          total,
          completed,
          pending,
          highPriority,
          overdue,
          progressPercentage
      };
  }

  // Date Utilities
  isOverdue(task) {
      if (!task.dueDate || task.completed) return false;
      return new Date(task.dueDate) < new Date();
  }

  isDueToday(task) {
      if (!task.dueDate) return false;
      const today = new Date().toDateString();
      const dueDate = new Date(task.dueDate).toDateString();
      return today === dueDate;
  }

  formatDueDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      const today = new Date();
      const diffTime = date - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Due today';
      if (diffDays === 1) return 'Due tomorrow';
      if (diffDays === -1) return 'Due yesterday';
      if (diffDays < -1) return `${Math.abs(diffDays)} days overdue`;
      if (diffDays > 1) return `Due in ${diffDays} days`;
      
      return date.toLocaleDateString();
  }

  formatEstimatedTime(minutes) {
      if (minutes < 60) return `${minutes}m`;
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }

  // Rendering
  render() {
      this.renderTasks();
      this.renderStats();
      this.updateChart();
      this.updateClearButton();
  }

  renderTasks() {
      const tasksList = document.getElementById('tasksList');
      const emptyState = document.getElementById('emptyState');
      const filteredTasks = this.getFilteredTasks();

      if (filteredTasks.length === 0) {
          emptyState.style.display = 'block';
          tasksList.innerHTML = '';
          tasksList.appendChild(emptyState);
          return;
      }

      emptyState.style.display = 'none';
      tasksList.innerHTML = filteredTasks.map(task => this.createTaskHTML(task)).join('');
  }

  createTaskHTML(task) {
      const formattedDate = new Date(task.createdAt).toLocaleDateString();
      const completedClass = task.completed ? 'completed' : '';
      const priorityClass = `priority-${task.priority}`;
      const overdueClass = this.isOverdue(task) ? 'overdue' : '';
      const dueTodayClass = this.isDueToday(task) ? 'due-today' : '';
      
      const dueDateFormatted = task.dueDate ? this.formatDueDate(task.dueDate) : '';
      const dueDateClass = this.isOverdue(task) ? 'overdue' : this.isDueToday(task) ? 'due-today' : '';
      const estimatedTimeFormatted = this.formatEstimatedTime(task.estimatedTime);

      return `
          <div class="task-card ${completedClass} ${priorityClass} ${overdueClass} ${dueTodayClass}" data-task-id="${task.id}">
              <div class="task-header">
                  <input 
                      type="checkbox" 
                      class="task-checkbox" 
                      ${task.completed ? 'checked' : ''}
                      aria-label="Mark task as ${task.completed ? 'incomplete' : 'complete'}"
                  >
                  <div class="task-content">
                      <h4 class="task-title" tabindex="0" role="button">${task.title}</h4>
                      ${task.description ? `<p class="task-description">${task.description}</p>` : ''}
                      <div class="task-meta">
                          <span class="task-priority ${task.priority}">${task.priority}</span>
                          <span class="task-category">${task.category}</span>
                          ${dueDateFormatted ? `<span class="task-due-date ${dueDateClass}">${dueDateFormatted}</span>` : ''}
                          <span class="task-estimated-time">${estimatedTimeFormatted}</span>
                      </div>
                      ${task.progress > 0 && !task.completed ? `
                          <div class="task-progress-bar">
                              <div class="task-progress-fill" style="width: ${task.progress}%"></div>
                          </div>
                      ` : ''}
                  </div>
                  <div class="task-actions">
                      <button class="task-action-btn edit" aria-label="Edit task" title="Edit">
                          ✏️
                      </button>
                      <button class="task-action-btn delete" aria-label="Delete task" title="Delete">
                          🗑️
                      </button>
                  </div>
              </div>
          </div>
      `;
  }

  renderStats() {
      const stats = this.getStats();

      document.getElementById('totalTasks').textContent = stats.total;
      document.getElementById('completedTasks').textContent = stats.completed;
      document.getElementById('pendingTasks').textContent = stats.pending;
      document.getElementById('highPriorityTasks').textContent = stats.highPriority;
      document.getElementById('overdueTasks').textContent = stats.overdue;

      const progressFill = document.getElementById('progressFill');
      const progressPercentage = document.getElementById('progressPercentage');
      
      progressFill.style.width = `${stats.progressPercentage}%`;
      progressPercentage.textContent = `${stats.progressPercentage}%`;
  }

  initChart() {
      const ctx = document.getElementById('tasksChart').getContext('2d');
      const stats = this.getStats();

      this.chart = new Chart(ctx, {
          type: 'doughnut',
          data: {
              labels: ['Completed', 'Pending', 'Overdue'],
              datasets: [{
                  data: [stats.completed, stats.pending - stats.overdue, stats.overdue],
                  backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C'],
                  borderWidth: 0,
                  cutout: '60%'
              }]
          },
          options: {
              responsive: true,
              maintainAspectRatio: true,
              plugins: {
                  legend: {
                      position: 'bottom',
                      labels: {
                          padding: 20,
                          usePointStyle: true,
                          font: { size: 14 }
                      }
                  }
              }
          }
      });
  }

  updateChart() {
      if (this.chart) {
          const stats = this.getStats();
          this.chart.data.datasets[0].data = [stats.completed, stats.pending - stats.overdue, stats.overdue];
          this.chart.update();
      }
  }

  updateClearButton() {
      const clearAllBtn = document.getElementById('clearAllBtn');
      clearAllBtn.style.display = this.tasks.length > 0 ? 'block' : 'none';
  }

  // Download Functionality
  async downloadTasksAsImage() {
      const tasksSection = document.getElementById('tasksSection');
      const statsSection = document.getElementById('statsSection');
      
      // Create a container for download
      const downloadContainer = document.createElement('div');
      downloadContainer.className = 'download-area';
      downloadContainer.innerHTML = `
          <div style="text-align: center; margin-bottom: 24px;">
              <h2 style="margin: 0 0 8px 0; color: var(--color-text);">${this.currentUser.name}'s Tasks</h2>
              <p style="margin: 0; color: var(--color-text-secondary);">Generated on ${new Date().toLocaleDateString()}</p>
          </div>
          ${statsSection.outerHTML}
          ${tasksSection.outerHTML}
      `;
      
      document.body.appendChild(downloadContainer);
      
      try {
          const canvas = await html2canvas(downloadContainer, {
              backgroundColor: '#ffffff',
              scale: 2,
              useCORS: true,
              allowTaint: true
          });
          
          const link = document.createElement('a');
          link.download = `tasks-${this.currentUser.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.png`;
          link.href = canvas.toDataURL();
          link.click();
          
      } catch (error) {
          console.error('Error generating image:', error);
          alert('Error generating image. Please try again.');
      } finally {
          document.body.removeChild(downloadContainer);
      }
  }

  async downloadProfileAsImage() {
      const profileCard = document.getElementById('profileCard');
      const stats = this.getStats();
      
      const downloadContainer = document.createElement('div');
      downloadContainer.className = 'download-area';
      downloadContainer.innerHTML = `
          <div style="text-align: center; padding: 32px;">
              <div style="margin-bottom: 24px;">
                  <div style="width: 120px; height: 120px; border-radius: 50%; background: var(--color-primary); color: white; display: flex; align-items: center; justify-content: center; font-size: 48px; margin: 0 auto 16px;">
                      ${this.currentUser.avatar}
                  </div>
                  <h2 style="margin: 0 0 8px 0; color: var(--color-text);">${this.currentUser.name}</h2>
                  <p style="margin: 0 0 24px 0; color: var(--color-text-secondary);">${this.currentUser.email}</p>
              </div>
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; max-width: 400px; margin: 0 auto;">
                  <div style="text-align: center; padding: 16px; background: var(--color-surface); border-radius: 8px;">
                      <div style="font-size: 24px; font-weight: 600; color: var(--color-primary);">${stats.total}</div>
                      <div style="font-size: 12px; color: var(--color-text-secondary);">Total Tasks</div>
                  </div>
                  <div style="text-align: center; padding: 16px; background: var(--color-surface); border-radius: 8px;">
                      <div style="font-size: 24px; font-weight: 600; color: var(--color-primary);">${stats.completed}</div>
                      <div style="font-size: 12px; color: var(--color-text-secondary);">Completed</div>
                  </div>
                  <div style="text-align: center; padding: 16px; background: var(--color-surface); border-radius: 8px;">
                      <div style="font-size: 24px; font-weight: 600; color: var(--color-primary);">${stats.progressPercentage}%</div>
                      <div style="font-size: 12px; color: var(--color-text-secondary);">Progress</div>
                  </div>
                  <div style="text-align: center; padding: 16px; background: var(--color-surface); border-radius: 8px;">
                      <div style="font-size: 24px; font-weight: 600; color: var(--color-primary);">${stats.highPriority}</div>
                      <div style="font-size: 12px; color: var(--color-text-secondary);">High Priority</div>
                  </div>
              </div>
              <p style="margin-top: 24px; font-size: 12px; color: var(--color-text-secondary);">Generated on ${new Date().toLocaleDateString()}</p>
          </div>
      `;
      
      document.body.appendChild(downloadContainer);
      
      try {
          const canvas = await html2canvas(downloadContainer, {
              backgroundColor: '#ffffff',
              scale: 2,
              useCORS: true,
              allowTaint: true
          });
          
          const link = document.createElement('a');
          link.download = `profile-${this.currentUser.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.png`;
          link.href = canvas.toDataURL();
          link.click();
          
      } catch (error) {
          console.error('Error generating profile image:', error);
          alert('Error generating profile image. Please try again.');
      } finally {
          document.body.removeChild(downloadContainer);
      }
  }

  // Modal Management
  showConfirmation(message, callback) {
      const modal = document.getElementById('confirmModal');
      const messageEl = document.getElementById('confirmMessage');
      
      messageEl.textContent = message;
      this.confirmCallback = callback;
      
      modal.classList.remove('hidden');
      modal.setAttribute('aria-hidden', 'false');
      
      setTimeout(() => {
          document.getElementById('confirmAction').focus();
      }, 100);
  }

  hideConfirmation() {
      const modal = document.getElementById('confirmModal');
      modal.classList.add('hidden');
      modal.setAttribute('aria-hidden', 'true');
      this.confirmCallback = null;
  }

  showEditModal(taskId) {
      const task = this.tasks.find(t => t.id === taskId);
      if (!task) return;

      const modal = document.getElementById('editModal');
      
      document.getElementById('editTaskTitle').value = task.title;
      document.getElementById('editTaskDescription').value = task.description || '';
      document.getElementById('editTaskPriority').value = task.priority;
      document.getElementById('editTaskCategory').value = task.category;
      document.getElementById('editTaskDueDate').value = task.dueDate || '';
      document.getElementById('editTaskEstimatedTime').value = task.estimatedTime;
      document.getElementById('editTaskProgress').value = task.progress;
      document.getElementById('progressValue').textContent = task.progress;
      
      this.editingTaskId = taskId;

      modal.classList.remove('hidden');
      modal.setAttribute('aria-hidden', 'false');

      setTimeout(() => {
          document.getElementById('editTaskTitle').focus();
      }, 100);
  }

  hideEditModal() {
      const modal = document.getElementById('editModal');
      modal.classList.add('hidden');
      modal.setAttribute('aria-hidden', 'true');
      this.editingTaskId = null;
  }

  showProfileModal() {
      const modal = document.getElementById('profileModal');
      modal.classList.remove('hidden');
      modal.setAttribute('aria-hidden', 'false');
  }

  hideProfileModal() {
      const modal = document.getElementById('profileModal');
      modal.classList.add('hidden');
      modal.setAttribute('aria-hidden', 'true');
  }

  // Event Listeners Setup
  setupEventListeners() {
      // Theme selector
      document.getElementById('themeSelector').addEventListener('change', (e) => {
          this.applyTheme(e.target.value);
      });

      // Authentication
      document.querySelectorAll('.auth-tab').forEach(tab => {
          tab.addEventListener('click', () => {
              document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
              document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
              
              tab.classList.add('active');
              document.getElementById(tab.dataset.tab + 'Form').classList.add('active');
          });
      });

      document.querySelectorAll('.avatar-option').forEach(btn => {
          btn.addEventListener('click', (e) => {
              e.preventDefault();
              const container = btn.closest('.avatar-selector');
              container.querySelectorAll('.avatar-option').forEach(b => b.classList.remove('active'));
              btn.classList.add('active');
              this.selectedAvatar = btn.dataset.avatar;
          });
      });

      document.getElementById('loginForm').addEventListener('submit', (e) => {
          e.preventDefault();
          const email = document.getElementById('loginEmail').value.trim();
          
          if (!this.loginUser(email)) {
              alert('User not found. Please register first.');
          }
      });

      document.getElementById('registerForm').addEventListener('submit', (e) => {
          e.preventDefault();
          const name = document.getElementById('registerName').value.trim();
          const email = document.getElementById('registerEmail').value.trim();
          
          if (name && email) {
              const user = this.createUser(name, email, this.selectedAvatar);
              if (user) {
                  this.loginUser(email);
              }
          }
      });

      // Profile management
      document.getElementById('profileBtn').addEventListener('click', () => {
          this.showProfileModal();
      });

      document.getElementById('switchUserBtn').addEventListener('click', () => {
          this.logoutUser();
      });

      document.getElementById('closeProfileModal').addEventListener('click', () => {
          this.hideProfileModal();
      });

      document.getElementById('cancelProfile').addEventListener('click', () => {
          this.hideProfileModal();
      });

      document.getElementById('profileForm').addEventListener('submit', (e) => {
          e.preventDefault();
          const name = document.getElementById('profileNameInput').value.trim();
          const email = document.getElementById('profileEmailInput').value.trim();
          
          if (name && email) {
              this.currentUser = {
                  ...this.currentUser,
                  name,
                  email,
                  avatar: this.selectedAvatar
              };
              
              this.saveUser(this.currentUser);
              this.updateUserProfile();
              this.hideProfileModal();
          }
      });

      // Download buttons
      document.getElementById('downloadBtn').addEventListener('click', () => {
          this.downloadTasksAsImage();
      });

      document.getElementById('downloadTasksBtn').addEventListener('click', () => {
          this.downloadTasksAsImage();
      });

      document.getElementById('downloadProfileBtn').addEventListener('click', () => {
          this.downloadProfileAsImage();
      });

      // Task form
      document.getElementById('addTaskForm').addEventListener('submit', (e) => {
          e.preventDefault();
          
          const taskData = {
              title: document.getElementById('taskTitle').value,
              description: document.getElementById('taskDescription').value,
              priority: document.getElementById('taskPriority').value,
              category: document.getElementById('taskCategory').value,
              dueDate: document.getElementById('taskDueDate').value,
              estimatedTime: document.getElementById('taskEstimatedTime').value
          };

          if (taskData.title.trim()) {
              if (this.addTask(taskData)) {
                  e.target.reset();
                  document.getElementById('taskTitle').focus();
              }
          }
      });

      // Edit task form
      document.getElementById('editTaskForm').addEventListener('submit', (e) => {
          e.preventDefault();
          
          if (this.editingTaskId) {
              const updates = {
                  title: document.getElementById('editTaskTitle').value,
                  description: document.getElementById('editTaskDescription').value,
                  priority: document.getElementById('editTaskPriority').value,
                  category: document.getElementById('editTaskCategory').value,
                  dueDate: document.getElementById('editTaskDueDate').value,
                  estimatedTime: parseInt(document.getElementById('editTaskEstimatedTime').value),
                  progress: parseInt(document.getElementById('editTaskProgress').value)
              };
              
              this.updateTask(this.editingTaskId, updates);
              this.hideEditModal();
          }
      });

      // Progress slider
      document.getElementById('editTaskProgress').addEventListener('input', (e) => {
          document.getElementById('progressValue').textContent = e.target.value;
      });

      // Filter buttons
      document.querySelectorAll('.filter-btn').forEach(btn => {
          btn.addEventListener('click', () => {
              document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
              btn.classList.add('active');
              this.currentFilter = btn.dataset.filter;
              this.renderTasks();
          });
      });

      // Category filter - Fixed event listener
      document.getElementById('categoryFilter').addEventListener('change', (e) => {
          this.currentCategoryFilter = e.target.value;
          console.log('Category filter changed to:', this.currentCategoryFilter); // Debug log
          this.renderTasks();
      });

      // Sort dropdown
      document.getElementById('sortSelect').addEventListener('change', (e) => {
          this.currentSort = e.target.value;
          this.renderTasks();
      });

      // Clear all button
      document.getElementById('clearAllBtn').addEventListener('click', () => {
          this.showConfirmation(
              'Are you sure you want to delete all tasks? This action cannot be undone.',
              () => {
                  this.clearAllTasks();
                  this.hideConfirmation();
              }
          );
      });

      // Tasks list event delegation
      document.getElementById('tasksList').addEventListener('click', (e) => {
          const taskCard = e.target.closest('.task-card');
          if (!taskCard) return;

          const taskId = taskCard.dataset.taskId;

          if (e.target.classList.contains('task-checkbox')) {
              this.toggleTask(taskId);
          } else if (e.target.classList.contains('delete') || e.target.closest('.delete')) {
              const task = this.tasks.find(t => t.id === taskId);
              if (task) {
                  this.showConfirmation(
                      `Are you sure you want to delete "${task.title}"?`,
                      () => {
                          this.deleteTask(taskId);
                          this.hideConfirmation();
                      }
                  );
              }
          } else if (e.target.classList.contains('edit') || e.target.closest('.edit') || e.target.classList.contains('task-title')) {
              this.showEditModal(taskId);
          }
      });

      // Modal close events
      document.getElementById('confirmAction').addEventListener('click', () => {
          if (this.confirmCallback) {
              this.confirmCallback();
          } else {
              this.hideConfirmation();
          }
      });

      document.getElementById('cancelConfirm').addEventListener('click', () => {
          this.hideConfirmation();
      });

      document.getElementById('closeEditModal').addEventListener('click', () => {
          this.hideEditModal();
      });

      document.getElementById('cancelEdit').addEventListener('click', () => {
          this.hideEditModal();
      });

      // Close modals on overlay click
      document.querySelectorAll('.modal-overlay').forEach(overlay => {
          overlay.addEventListener('click', () => {
              const modal = overlay.closest('.modal');
              if (modal.id === 'confirmModal') this.hideConfirmation();
              else if (modal.id === 'editModal') this.hideEditModal();
              else if (modal.id === 'profileModal') this.hideProfileModal();
          });
      });

      // Escape key to close modals
      document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') {
              if (!document.getElementById('confirmModal').classList.contains('hidden')) {
                  this.hideConfirmation();
              } else if (!document.getElementById('editModal').classList.contains('hidden')) {
                  this.hideEditModal();
              } else if (!document.getElementById('profileModal').classList.contains('hidden')) {
                  this.hideProfileModal();
              }
          }
      });
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new TaskManager();
});