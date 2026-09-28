// ===== Taskflow — To-Do List Application =====

(function () {
  'use strict';

  // ===== Constants =====
  const STORAGE_KEY = 'taskflow_tasks';
  const PRIORITIES = ['low', 'medium', 'high'];
  const CATEGORY_COLORS = {
    personal: '#a78bfa',
    work: '#6ee7b7',
    health: '#fbbf24',
    learning: '#f472b6',
  };
  const PRIORITY_COLORS = {
    low: '#6ee7b7',
    medium: '#fbbf24',
    high: '#f87171',
  };

  // ===== State =====
  let tasks = [];
  let currentPriority = 0; // index in PRIORITIES
  let currentCategory = 'personal';
  let currentFilter = 'all';

  // ===== DOM Elements =====
  const taskForm = document.getElementById('task-form');
  const taskInput = document.getElementById('task-input');
  const priorityToggle = document.getElementById('priority-toggle');
  const priorityDot = priorityToggle.querySelector('.priority-dot');
  const categorySelector = document.getElementById('category-selector');
  const filterTabs = document.getElementById('filter-tabs');
  const clearCompletedBtn = document.getElementById('clear-completed');
  const taskList = document.getElementById('task-list');
  const emptyState = document.getElementById('empty-state');
  const progressSection = document.getElementById('progress-section');
  const progressFill = document.getElementById('progress-fill');
  const progressPercent = document.getElementById('progress-percent');
  const statTotal = document.querySelector('#stat-total .stat-value');
  const statActive = document.querySelector('#stat-active .stat-value');
  const statDone = document.querySelector('#stat-done .stat-value');

  // ===== Helpers =====
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // ===== Storage =====
  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.warn('Failed to save tasks to localStorage:', e);
    }
  }

  function loadTasks() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        tasks = JSON.parse(data);
      }
    } catch (e) {
      console.warn('Failed to load tasks from localStorage:', e);
      tasks = [];
    }
  }

  // ===== Task Operations =====
  function addTask(text) {
    const task = {
      id: generateId(),
      text: text.trim(),
      completed: false,
      priority: PRIORITIES[currentPriority],
      category: currentCategory,
      createdAt: Date.now(),
    };
    tasks.unshift(task);
    saveTasks();
    render();
    return task;
  }

  function toggleTask(id) {
    const task = tasks.find((t) => t.id === id);
    if (task) {
      task.completed = !task.completed;
      saveTasks();
      render();
    }
  }

  function deleteTask(id) {
    const item = document.querySelector(`[data-id="${id}"]`);
    if (item) {
      item.classList.add('removing');
      setTimeout(() => {
        tasks = tasks.filter((t) => t.id !== id);
        saveTasks();
        render();
      }, 300);
    } else {
      tasks = tasks.filter((t) => t.id !== id);
      saveTasks();
      render();
    }
  }

  function clearCompleted() {
    const completedItems = document.querySelectorAll('.task-item.completed');
    completedItems.forEach((item) => item.classList.add('removing'));

    setTimeout(() => {
      tasks = tasks.filter((t) => !t.completed);
      saveTasks();
      render();
    }, 300);
  }

  // ===== Filtering =====
  function getFilteredTasks() {
    switch (currentFilter) {
      case 'active':
        return tasks.filter((t) => !t.completed);
      case 'completed':
        return tasks.filter((t) => t.completed);
      default:
        return tasks;
    }
  }

  // ===== Rendering =====
  function createTaskElement(task) {
    const li = document.createElement('li');
    li.className = `task-item${task.completed ? ' completed' : ''}`;
    li.dataset.id = task.id;
    li.style.animationDelay = '0ms';

    li.innerHTML = `
      <label class="task-checkbox">
        <input type="checkbox" ${task.completed ? 'checked' : ''} aria-label="Toggle task completion" />
        <span class="checkmark">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
      </label>
      <div class="task-content">
        <span class="task-text">${escapeHTML(task.text)}</span>
        <div class="task-meta">
          <span class="task-category">
            <span class="cat-dot" style="background: ${CATEGORY_COLORS[task.category] || CATEGORY_COLORS.personal}"></span>
            ${task.category}
          </span>
          <span class="task-priority-indicator" style="background: ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.low}"></span>
          <span class="task-time">${formatTime(task.createdAt)}</span>
        </div>
      </div>
      <div class="task-actions">
        <button class="action-btn delete" title="Delete task" aria-label="Delete task">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    `;

    // Event listeners
    const checkbox = li.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', () => toggleTask(task.id));

    const deleteBtn = li.querySelector('.delete');
    deleteBtn.addEventListener('click', () => deleteTask(task.id));

    return li;
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const active = total - completed;

    animateValue(statTotal, parseInt(statTotal.textContent), total);
    animateValue(statActive, parseInt(statActive.textContent), active);
    animateValue(statDone, parseInt(statDone.textContent), completed);

    // Progress
    if (total > 0) {
      const percent = Math.round((completed / total) * 100);
      progressSection.classList.add('visible');
      progressFill.style.width = `${percent}%`;
      progressPercent.textContent = `${percent}%`;
    } else {
      progressSection.classList.remove('visible');
    }
  }

  function animateValue(element, start, end) {
    if (start === end) return;
    element.textContent = end;
    element.style.transform = 'scale(1.2)';
    element.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
    setTimeout(() => {
      element.style.transform = 'scale(1)';
    }, 150);
  }

  function render() {
    const filtered = getFilteredTasks();

    // Clear list
    taskList.innerHTML = '';

    // Show tasks or empty state
    if (filtered.length === 0) {
      emptyState.classList.add('visible');
    } else {
      emptyState.classList.remove('visible');
      filtered.forEach((task, index) => {
        const el = createTaskElement(task);
        el.style.animationDelay = `${index * 40}ms`;
        taskList.appendChild(el);
      });
    }

    updateStats();
  }

  // ===== Event Handlers =====

  // Form submit
  taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = taskInput.value.trim();
    if (!text) {
      taskInput.focus();
      // Subtle shake animation
      taskInput.style.animation = 'none';
      taskInput.offsetHeight; // trigger reflow
      taskInput.style.animation = 'shake 0.4s ease';
      return;
    }
    addTask(text);
    taskInput.value = '';
    taskInput.focus();
  });

  // Add shake keyframes dynamically
  const shakeStyle = document.createElement('style');
  shakeStyle.textContent = `
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20% { transform: translateX(-4px); }
      40% { transform: translateX(4px); }
      60% { transform: translateX(-3px); }
      80% { transform: translateX(3px); }
    }
  `;
  document.head.appendChild(shakeStyle);

  // Priority toggle
  priorityToggle.addEventListener('click', () => {
    currentPriority = (currentPriority + 1) % PRIORITIES.length;
    const p = PRIORITIES[currentPriority];
    priorityDot.className = 'priority-dot';
    if (p !== 'low') {
      priorityDot.classList.add(p);
    }
    // Bounce animation
    priorityToggle.style.transform = 'scale(0.85)';
    setTimeout(() => {
      priorityToggle.style.transform = 'scale(1)';
    }, 150);
  });

  // Category selector
  categorySelector.addEventListener('click', (e) => {
    const chip = e.target.closest('.cat-chip');
    if (!chip) return;
    categorySelector.querySelectorAll('.cat-chip').forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    currentCategory = chip.dataset.category;
  });

  // Filter tabs
  filterTabs.addEventListener('click', (e) => {
    const tab = e.target.closest('.filter-tab');
    if (!tab) return;
    filterTabs.querySelectorAll('.filter-tab').forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
    currentFilter = tab.dataset.filter;
    render();
  });

  // Clear completed
  clearCompletedBtn.addEventListener('click', clearCompleted);

  // Keyboard shortcut
  document.addEventListener('keydown', (e) => {
    // Focus input with '/' key
    if (e.key === '/' && document.activeElement !== taskInput) {
      e.preventDefault();
      taskInput.focus();
    }
    // Escape to blur
    if (e.key === 'Escape') {
      taskInput.blur();
    }
  });

  // Update relative times every minute
  setInterval(() => {
    document.querySelectorAll('.task-time').forEach((el, i) => {
      const filtered = getFilteredTasks();
      if (filtered[i]) {
        el.textContent = formatTime(filtered[i].createdAt);
      }
    });
  }, 60000);

  // ===== Initialization =====
  loadTasks();
  render();
  taskInput.focus();
})();
