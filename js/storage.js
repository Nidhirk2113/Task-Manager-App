// Enhanced Storage API for Task Manager
class StorageAPI {
  constructor() {
      this.storageKeys = {
          users: 'taskmanager_users_v2',
          currentUser: 'taskmanager_current_user_v2',
          tasks: 'taskmanager_tasks_v2_',
          theme: 'taskmanager_theme_v2'
      };
      this.initializeStorage();
  }

  initializeStorage() {
      // Initialize users storage
      if (!localStorage.getItem(this.storageKeys.users)) {
          localStorage.setItem(this.storageKeys.users, JSON.stringify([]));
      }
  }

  // User Management
  getUsers() {
      try {
          const data = localStorage.getItem(this.storageKeys.users);
          return data ? JSON.parse(data) : [];
      } catch (error) {
          console.error('Error reading users from localStorage:', error);
          return [];
      }
  }

  addUser(user) {
      try {
          const users = this.getUsers();
          const newUser = {
              id: this.generateId(),
              name: user.name.trim(),
              email: user.email.toLowerCase().trim(),
              avatar: user.avatar || '👤',
              theme: user.theme || 'default',
              createdAt: new Date().toISOString(),
              ...user
          };
          users.push(newUser);
          localStorage.setItem(this.storageKeys.users, JSON.stringify(users));
          return newUser;
      } catch (error) {
          console.error('Error adding user to localStorage:', error);
          return null;
      }
  }

  updateUser(userId, updates) {
      try {
          const users = this.getUsers();
          const index = users.findIndex(user => user.id === userId);
          if (index !== -1) {
              users[index] = { 
                  ...users[index], 
                  ...updates,
                  name: updates.name ? updates.name.trim() : users[index].name,
                  email: updates.email ? updates.email.toLowerCase().trim() : users[index].email
              };
              localStorage.setItem(this.storageKeys.users, JSON.stringify(users));
              return users[index];
          }
          return null;
      } catch (error) {
          console.error('Error updating user in localStorage:', error);
          return null;
      }
  }

  findUserByEmail(email) {
      const users = this.getUsers();
      return users.find(user => user.email === email.toLowerCase().trim());
  }

  getCurrentUser() {
      try {
          const userId = localStorage.getItem(this.storageKeys.currentUser);
          if (userId) {
              const users = this.getUsers();
              return users.find(user => user.id === userId) || null;
          }
          return null;
      } catch (error) {
          console.error('Error getting current user:', error);
          return null;
      }
  }

  setCurrentUser(userId) {
      try {
          localStorage.setItem(this.storageKeys.currentUser, userId);
          return true;
      } catch (error) {
          console.error('Error setting current user:', error);
          return false;
      }
  }

  logout() {
      try {
          localStorage.removeItem(this.storageKeys.currentUser);
          return true;
      } catch (error) {
          console.error('Error logging out:', error);
          return false;
      }
  }

  // Task Management
  getUserTasksKey(userId) {
      return this.storageKeys.tasks + userId;
  }

  getAllTasks(userId) {
      try {
          const key = this.getUserTasksKey(userId);
          const data = localStorage.getItem(key);
          return data ? JSON.parse(data) : [];
      } catch (error) {
          console.error('Error reading tasks from localStorage:', error);
          return [];
      }
  }

  addTask(userId, task) {
      try {
          const tasks = this.getAllTasks(userId);
          const newTask = {
              id: this.generateId(),
              title: task.title.trim(),
              description: task.description ? task.description.trim() : '',
              completed: false,
              priority: task.priority || 'medium',
              category: task.category || 'Personal',
              dueDate: task.dueDate || null,
              estimatedTime: task.estimatedTime || null,
              progress: task.progress || 0,
              userId: userId,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              ...task
          };
          tasks.push(newTask);
          const key = this.getUserTasksKey(userId);
          localStorage.setItem(key, JSON.stringify(tasks));
          return newTask;
      } catch (error) {
          console.error('Error adding task to localStorage:', error);
          return null;
      }
  }

  updateTask(userId, taskId, updates) {
      try {
          const tasks = this.getAllTasks(userId);
          const index = tasks.findIndex(task => task.id === taskId);
          if (index !== -1) {
              tasks[index] = { 
                  ...tasks[index], 
                  ...updates,
                  title: updates.title ? updates.title.trim() : tasks[index].title,
                  description: updates.description !== undefined ? updates.description.trim() : tasks[index].description,
                  updatedAt: new Date().toISOString()
              };
              const key = this.getUserTasksKey(userId);
              localStorage.setItem(key, JSON.stringify(tasks));
              return tasks[index];
          }
          return null;
      } catch (error) {
          console.error('Error updating task in localStorage:', error);
          return null;
      }
  }

  removeTask(userId, taskId) {
      try {
          const tasks = this.getAllTasks(userId);
          const filteredTasks = tasks.filter(task => task.id !== taskId);
          const key = this.getUserTasksKey(userId);
          localStorage.setItem(key, JSON.stringify(filteredTasks));
          return true;
      } catch (error) {
          console.error('Error removing task from localStorage:', error);
          return false;
      }
  }

  clearAllTasks(userId) {
      try {
          const key = this.getUserTasksKey(userId);
          localStorage.setItem(key, JSON.stringify([]));
          return true;
      } catch (error) {
          console.error('Error clearing tasks:', error);
          return false;
      }
  }

  // Theme Management
  getTheme() {
      try {
          return localStorage.getItem(this.storageKeys.theme) || 'default';
      } catch (error) {
          console.error('Error getting theme:', error);
          return 'default';
      }
  }

  setTheme(theme) {
      try {
          localStorage.setItem(this.storageKeys.theme, theme);
          return true;
      } catch (error) {
          console.error('Error setting theme:', error);
          return false;
      }
  }

  // Utility Methods
  generateId() {
      return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Export/Import functionality
  exportUserData(userId) {
      try {
          const user = this.getCurrentUser();
          const tasks = this.getAllTasks(userId);
          return {
              user,
              tasks,
              exportDate: new Date().toISOString(),
              version: '2.0'
          };
      } catch (error) {
          console.error('Error exporting user data:', error);
          return null;
      }
  }

  importUserData(data) {
      try {
          if (data.version !== '2.0') {
              throw new Error('Incompatible data version');
          }
          
          // Import user
          if (data.user) {
              const existingUser = this.findUserByEmail(data.user.email);
              if (!existingUser) {
                  this.addUser(data.user);
              }
          }
          
          // Import tasks
          if (data.tasks && data.user) {
              const key = this.getUserTasksKey(data.user.id);
              localStorage.setItem(key, JSON.stringify(data.tasks));
          }
          
          return true;
      } catch (error) {
          console.error('Error importing user data:', error);
          return false;
      }
  }

  // Get storage usage
  getStorageUsage() {
      try {
          const totalSize = JSON.stringify(localStorage).length;
          const taskManagerSize = Object.keys(this.storageKeys).reduce((size, key) => {
              const data = localStorage.getItem(this.storageKeys[key]);
              return size + (data ? data.length : 0);
          }, 0);
          
          return {
              total: totalSize,
              taskManager: taskManagerSize,
              percentage: Math.round((taskManagerSize / totalSize) * 100) || 0
          };
      } catch (error) {
          console.error('Error calculating storage usage:', error);
          return { total: 0, taskManager: 0, percentage: 0 };
      }
  }
}
