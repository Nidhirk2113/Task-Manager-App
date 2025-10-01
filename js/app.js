// Enhanced Task Manager Application
class TaskManager {
    constructor() {
        this.storage = new StorageAPI();
        this.ui = new UIManager(this.storage);
        this.currentUser = null;
        this.tasks = [];
        this.currentFilter = 'all';
        this.currentCategoryFilter = 'all';
        this.currentSort = 'newest';
        
        this.init();
    }

    init() {
        this.checkUserLogin();
        this.setupEventListeners();
        this.ui.initThemeSelector();
    }

    // User Management
    checkUserLogin() {
        this.currentUser = this.storage.getCurrentUser();
        if (this.currentUser) {
            this.startApp();
        } else {
            this.ui.showLoginModal();
        }
    }

    startApp() {
        this.ui.hideLoginModal();
        this.ui.updateUserProfile(this.currentUser);
        this.loadTasks();
        this.updateUI();
    }

    // Event Listeners
    setupEventListeners() {
        // Theme selector
        document.getElementById('themeSelector').addEventListener('change', (e) => {
            this.ui.applyTheme(e.target.value);
        });

        // Auth forms
        this.setupAuthListeners();

        // Profile management
        document.getElementById('profileBtn').addEventListener('click', () => {
            this.showProfileModal();
        });

        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });

        // Task management
        document.getElementById('addTaskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask();
        });

        // Filters and sorting
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        document.getElementById('categoryFilter').addEventListener('change', (e) => {
            this.setCategoryFilter(e.target.value);
        });

        document.getElementById('sortTasks').addEventListener('change', (e) => {
            this.setSort(e.target.value);
        });

        // Download buttons
        document.getElementById('downloadTasksBtn').addEventListener('click', () => {
            this.downloadTasks();
        });

        document.getElementById('downloadProfileBtn').addEventListener('click', () => {
            this.downloadProfile();
        });

        // Clear all
        document.getElementById('clearAllBtn').addEventListener('click', () => {
            this.clearAllTasks();
        });

        // Task list events (delegation)
        document.getElementById('tasksList').addEventListener('click', (e) => {
            this.handleTaskAction(e);
        });

        document.getElementById('tasksList').addEventListener('change', (e) => {
            if (e.target.classList.contains('task-checkbox')) {
                const taskId = e.target.closest('.task-item').dataset.taskId;
                this.toggleTask(taskId);
            }
        });

        document.getElementById('tasksList').addEventListener('submit', (e) => {
            if (e.target.classList.contains('edit-form')) {
                e.preventDefault();
                this.saveEdit(e.target);
            }
        });

        document.getElementById('tasksList').addEventListener('input', (e) => {
            if (e.target.classList.contains('edit-progress')) {
                const display = e.target.parentNode.querySelector('.progress-display');
                display.textContent = e.target.value + '%';
            }
        });

        // Modal events
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay') || e.target.classList.contains('modal-close')) {
                const modal = e.target.closest('.modal');
                if (modal) {
                    modal.classList.remove('active');
                }
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const activeModal = document.querySelector('.modal.active');
                if (activeModal) {
                    activeModal.classList.remove('active');
                }
                if (this.ui.editingTaskId) {
                    this.cancelEdit();
                }
            }
            
            // Ctrl+N for new task
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                document.getElementById('taskTitle').focus();
            }
        });
    }

    setupAuthListeners() {
        // Auth tabs
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const targetTab = e.target.dataset.tab;
                document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
                e.target.classList.add('active');
                document.getElementById(targetTab + 'Form').classList.add('active');
            });
        });

        // Avatar selection
        document.querySelectorAll('.avatar-selector').forEach(selector => {
            selector.addEventListener('click', (e) => {
                if (e.target.classList.contains('avatar-option')) {
                    selector.querySelectorAll('.avatar-option').forEach(opt => opt.classList.remove('active'));
                    e.target.classList.add('active');
                }
            });
        });

        // Login form
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Register form
        document.getElementById('registerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });

        // Profile form
        document.getElementById('profileForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateProfile();
        });
    }

    // Authentication
    handleLogin() {
        const email = document.getElementById('loginEmail').value;
        if (!email) return;

        const user = this.storage.findUserByEmail(email);
        if (user) {
            this.storage.setCurrentUser(user.id);
            this.currentUser = user;
            this.startApp();
            this.ui.showToast(`Welcome back, ${user.name}!`, 'success');
        } else {
            this.ui.showToast('User not found. Please register first.', 'error');
        }
    }

    handleRegister() {
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const avatar = document.querySelector('#avatarSelector .avatar-option.active')?.dataset.avatar || '👤';

        if (!name || !email) return;

        const existingUser = this.storage.findUserByEmail(email);
        if (existingUser) {
            this.ui.showToast('Email already registered. Please login instead.', 'error');
            return;
        }

        const user = this.storage.addUser({ name, email, avatar });
        if (user) {
            this.storage.setCurrentUser(user.id);
            this.currentUser = user;
            this.startApp();
            this.ui.showToast(`Welcome to Task Manager, ${user.name}!`, 'success');
        } else {
            this.ui.showToast('Failed to register user', 'error');
        }
    }

    showProfileModal() {
        const modal = document.getElementById('profileModal');
        document.getElementById('profileName').value = this.currentUser.name;
        document.getElementById('profileEmail').value = this.currentUser.email;
        
        // Set active avatar
        document.querySelectorAll('#profileAvatarSelector .avatar-option').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.avatar === this.currentUser.avatar);
        });
        
        modal.classList.add('active');
    }

    updateProfile() {
        const name = document.getElementById('profileName').value;
        const email = document.getElementById('profileEmail').value;
        const avatar = document.querySelector('#profileAvatarSelector .avatar-option.active')?.dataset.avatar;

        if (!name || !email) return;

        const updatedUser = this.storage.updateUser(this.currentUser.id, { name, email, avatar });
        if (updatedUser) {
            this.currentUser = updatedUser;
            this.ui.updateUserProfile(this.currentUser);
            document.getElementById('profileModal').classList.remove('active');
            this.ui.showToast('Profile updated successfully!', 'success');
        } else {
            this.ui.showToast('Failed to update profile', 'error');
        }
    }

    logout() {
        this.storage.logout();
        this.currentUser = null;
        this.tasks = [];
        document.getElementById('profileModal').classList.remove('active');
        this.ui.showLoginModal();
        this.ui.showToast('Logged out successfully', 'success');
    }

    // Task Management
    loadTasks() {
        this.tasks = this.storage.getAllTasks(this.currentUser.id);
    }

    addTask() {
        const form = document.getElementById('addTaskForm');
        const formData = new FormData(form);
        
        const task = {
            title: document.getElementById('taskTitle').value,
            description: document.getElementById('taskDescription').value,
            priority: document.getElementById('taskPriority').value,
            category: document.getElementById('taskCategory').value,
            dueDate: document.getElementById('taskDueDate').value || null,
            estimatedTime: parseFloat(document.getElementById('taskTime').value) || null
        };

        if (!task.title.trim()) {
            this.ui.showToast('Please enter a task title', 'error');
            return;
        }

        const newTask = this.storage.addTask(this.currentUser.id, task);
        if (newTask) {
            this.tasks.push(newTask);
            form.reset();
            this.updateUI();
            this.ui.showToast('Task added successfully!', 'success');
        } else {
            this.ui.showToast('Failed to add task', 'error');
        }
    }

    toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            const updatedTask = this.storage.updateTask(this.currentUser.id, taskId, { 
                completed: !task.completed,
                progress: !task.completed ? 100 : task.progress
            });
            if (updatedTask) {
                Object.assign(task, updatedTask);
                this.updateUI();
                this.ui.showToast(
                    task.completed ? 'Task completed! 🎉' : 'Task marked as pending',
                    task.completed ? 'success' : 'info'
                );
            }
        }
    }

    editTask(taskId) {
        this.ui.startEdit(taskId);
        this.updateUI();
        
        setTimeout(() => {
            const editInput = document.querySelector('.edit-form .edit-title');
            if (editInput) {
                editInput.focus();
                editInput.select();
            }
        }, 10);
    }

    saveEdit(form) {
        const taskId = form.dataset.taskId;
        const updates = {
            title: form.querySelector('.edit-title').value,
            description: form.querySelector('.edit-description').value,
            priority: form.querySelector('.edit-priority').value,
            category: form.querySelector('.edit-category').value,
            dueDate: form.querySelector('.edit-due-date').value || null,
            estimatedTime: parseFloat(form.querySelector('.edit-time').value) || null,
            progress: parseInt(form.querySelector('.edit-progress').value) || 0
        };

        if (!updates.title.trim()) {
            this.ui.showToast('Task title cannot be empty', 'error');
            return;
        }

        const updatedTask = this.storage.updateTask(this.currentUser.id, taskId, updates);
        if (updatedTask) {
            const taskIndex = this.tasks.findIndex(t => t.id === taskId);
            if (taskIndex !== -1) {
                Object.assign(this.tasks[taskIndex], updatedTask);
            }
            this.cancelEdit();
            this.ui.showToast('Task updated successfully!', 'success');
        } else {
            this.ui.showToast('Failed to update task', 'error');
        }
    }

    deleteTask(taskId) {
        this.ui.showConfirmDialog('Are you sure you want to delete this task?', (confirmed) => {
            if (confirmed) {
                if (this.storage.removeTask(this.currentUser.id, taskId)) {
                    this.tasks = this.tasks.filter(t => t.id !== taskId);
                    this.updateUI();
                    this.ui.showToast('Task deleted successfully!', 'success');
                } else {
                    this.ui.showToast('Failed to delete task', 'error');
                }
            }
        });
    }

    clearAllTasks() {
        if (this.tasks.length === 0) {
            this.ui.showToast('No tasks to clear', 'info');
            return;
        }

        this.ui.showConfirmDialog(
            `Are you sure you want to delete all ${this.tasks.length} tasks? This action cannot be undone.`,
            (confirmed) => {
                if (confirmed) {
                    if (this.storage.clearAllTasks(this.currentUser.id)) {
                        this.tasks = [];
                        this.updateUI();
                        this.ui.showToast('All tasks cleared successfully!', 'success');
                    } else {
                        this.ui.showToast('Failed to clear tasks', 'error');
                    }
                }
            }
        );
    }

    cancelEdit() {
        this.ui.cancelEdit();
        this.updateUI();
    }

    // Filters and Sorting
    setFilter(filter) {
        this.currentFilter = filter;
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        this.updateUI();
    }

    setCategoryFilter(category) {
        this.currentCategoryFilter = category;
        this.updateUI();
    }

    setSort(sort) {
        this.currentSort = sort;
        this.updateUI();
    }

    // Event Handlers
    handleTaskAction(e) {
        const taskItem = e.target.closest('.task-item');
        if (!taskItem) return;
        
        const taskId = taskItem.dataset.taskId;
        
        if (e.target.classList.contains('delete-task')) {
            this.deleteTask(taskId);
        } else if (e.target.classList.contains('edit-task')) {
            this.editTask(taskId);
        } else if (e.target.classList.contains('cancel-edit')) {
            this.cancelEdit();
        }
    }

    // Download Functions
    async downloadTasks() {
        if (this.tasks.length === 0) {
            this.ui.showToast('No tasks to download', 'info');
            return;
        }
        
        await this.ui.downloadTasksAsImage(this.tasks, this.currentUser);
    }

    async downloadProfile() {
        const stats = {
            total: this.tasks.length,
            completed: this.tasks.filter(t => t.completed).length,
            pending: this.tasks.filter(t => !t.completed).length,
            overdue: this.ui.getOverdueTasks(this.tasks).length
        };
        
        await this.ui.downloadProfileAsImage(this.currentUser, stats);
    }

    // UI Updates
    updateUI() {
        this.ui.renderTasks(this.tasks, this.currentFilter, this.currentCategoryFilter, this.currentSort);
        this.ui.renderStats(this.tasks);
        this.ui.renderChart(this.tasks);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.taskManager = new TaskManager();
});
