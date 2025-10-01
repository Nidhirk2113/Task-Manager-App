(function (global) {
    const KEY = "tasks_v1";
  
    function read() {
      try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return [];
        return JSON.parse(raw);
      } catch (e) {
        console.error("Failed to parse tasks from localStorage", e);
        return [];
      }
    }
  
    function write(tasks) {
      try {
        localStorage.setItem(KEY, JSON.stringify(tasks));
      } catch (e) {
        console.error("Failed to write tasks to localStorage", e);
      }
    }
  
    function add(task) {
      const tasks = read();
      tasks.push(task);
      write(tasks);
      return tasks;
    }
  
    function update(id, patch) {
      let tasks = read();
      tasks = tasks.map(t => (t.id === id ? Object.assign({}, t, patch) : t));
      write(tasks);
      return tasks;
    }
  
    function remove(id) {
      let tasks = read();
      tasks = tasks.filter(t => t.id !== id);
      write(tasks);
      return tasks;
    }
  
    function clearAll() {
      write([]);
      return [];
    }
  
    function all() {
      return read();
    }
  
    // expose
    global.StorageAPI = {
      all,
      add,
      update,
      remove,
      clearAll,
      key: KEY
    };
  })(window);
  