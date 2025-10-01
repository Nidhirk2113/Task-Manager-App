// Storage API for Task Manager
class StorageAPI {
  constructor(key = 'tasks_v1') {
      this.storageKey = key;
      this.initializeStorage();
  }

  initializeStorage() {
      if (!localStorage.getItem(this.storageKey)) {
          localStorage.setItem(this.storageKey, JSON.stringify([]));
      }
  }

  getAll() {
      try {
          const data = localStorage.getItem(this.storageKey);
          return data ? JSON.parse(data) : [];
      } catch (error) {
          console.error('Error reading from localStorage:', error);
          return [];
      }
  }

  add(task) {
      try {
          const tasks = this.getAll();
          const newTask = {
              id: this.generateId(),
              title: task.title.trim(),
              completed: false,
              priority: task.priority || 'medium',
              createdAt: new Date().toISOString(),
              ...task
          };
          tasks.push(newTask);
          localStorage.setItem(this.storageKey, JSON.stringify(tasks));
          return newTask;
      } catch (error) {
          console.error('Error adding task to localStorage:', error);
          return null;
      }
  }

  update(id, updates) {
      try {
          const tasks = this.getAll();
          const index = tasks.findIndex(task => task.id === id);
          if (index !== -1) {
              tasks[index] = { 
                  ...tasks[index], 
                  ...updates,
                  title: updates.title ? updates.title.trim() : tasks[index].title
              };
              localStorage.setItem(this.storageKey, JSON.stringify(tasks));
              return tasks[index];
          }
          return null;
      } catch (error) {
          console.error('Error updating task in localStorage:', error);
          return null;
      }
  }

  remove(id) {
      try {
          const tasks = this.getAll();
          const filteredTasks = tasks.filter(task => task.id !== id);
          localStorage.setItem(this.storageKey, JSON.stringify(filteredTasks));
          return true;
      } catch (error) {
          console.error('Error removing task from localStorage:', error);
          return false;
      }
  }

  clearAll() {
      try {
          localStorage.setItem(this.storageKey, JSON.stringify([]));
          return true;
      } catch (error) {
          console.error('Error clearing localStorage:', error);
          return false;
      }
  }

  generateId() {
      return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}
