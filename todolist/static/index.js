document.addEventListener("DOMContentLoaded", function () {
    // Enhanced alert animations
    const alerts = document.querySelectorAll('.alert');
    if (alerts.length > 0) {
        alerts.forEach((alert, index) => {
            alert.style.animationDelay = `${index * 0.1}s`;
        });
        
        setTimeout(function () {
            alerts.forEach(function (el) {
                el.style.animation = 'slideOutRight 0.5s ease-out forwards';
                setTimeout(() => {
                    try {
                        if (typeof $(el).alert === 'function') {
                            $(el).alert('close');
                        } else {
                            el.parentNode && el.parentNode.removeChild(el);
                        }
                    } catch (e) {
                        el.parentNode && el.parentNode.removeChild(el);
                    }
                }, 500);
            });
        }, 3000);
    }

    // Add loading states to buttons
    const buttons = document.querySelectorAll('button[type="submit"], .btn');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            if (this.type === 'submit' || this.classList.contains('btn-success')) {
                this.style.position = 'relative';
                this.style.overflow = 'hidden';
                
                // Add ripple effect
                const ripple = document.createElement('span');
                ripple.style.position = 'absolute';
                ripple.style.borderRadius = '50%';
                ripple.style.background = 'rgba(255,255,255,0.6)';
                ripple.style.transform = 'scale(0)';
                ripple.style.animation = 'ripple 0.6s linear';
                ripple.style.left = '50%';
                ripple.style.top = '50%';
                ripple.style.width = '20px';
                ripple.style.height = '20px';
                ripple.style.marginLeft = '-10px';
                ripple.style.marginTop = '-10px';
                
                this.appendChild(ripple);
                
                setTimeout(() => {
                    ripple.remove();
                }, 600);
            }
        });
    });

    // Enhanced form interactions
    const formControls = document.querySelectorAll('.form-control');
    formControls.forEach(control => {
        control.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        control.addEventListener('blur', function() {
            if (!this.value) {
                this.parentElement.classList.remove('focused');
            }
        });
    });

    // Add stagger animation to task items
    const taskItems = document.querySelectorAll('.list-group-item');
    taskItems.forEach((item, index) => {
        item.style.animationDelay = `${index * 0.1}s`;
    });
});

// Enhanced delete task with animation
const deleteTask = (taskId) => {
    const taskElement = document.getElementById(`task-${taskId}`);
    if (taskElement) {
        // Add loading state
        const deleteBtn = taskElement.querySelector('.close');
        if (deleteBtn) {
            deleteBtn.innerHTML = '<span class="loading-spinner"></span>';
            deleteBtn.style.pointerEvents = 'none';
        }
        
        // Slide out animation
        taskElement.style.animation = 'slideOutLeft 0.3s ease-out forwards';
        
        fetch("/delete-task", {
            method: "POST",
            body: JSON.stringify({ task_id: taskId }),
        }).then(() => {
            setTimeout(() => {
                window.location.href = "/";
            }, 300);
        }).catch(() => {
            // Reset button on error
            if (deleteBtn) {
                deleteBtn.innerHTML = '<span aria-hidden="true">&times</span>';
                deleteBtn.style.pointerEvents = 'auto';
            }
            taskElement.style.animation = '';
        });
    }
}

const updateTask = (taskId, field, value) => {
    fetch("/update-task", {
        method: "POST",
        body: JSON.stringify({ task_id: taskId, field, value }),
    }).then(() => {
        // Add success animation
        const taskElement = document.getElementById(`task-${taskId}`);
        if (taskElement) {
            taskElement.style.animation = 'pulse 0.6s ease-out';
            setTimeout(() => {
                taskElement.style.animation = '';
            }, 600);
        }
    })
}

const toggleTaskEdit = (taskId) => {
    const el = document.getElementById(`task-edit-${taskId}`);
    if (!el) return;
    
    if (el.classList.contains('d-none')) {
        el.classList.remove('d-none');
        el.style.opacity = '0';
        el.style.transform = 'translateY(-10px)';
        
        // Animate in
        setTimeout(() => {
            el.style.transition = 'all 0.3s ease-out';
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        }, 10);
    } else {
        // Animate out
        el.style.transition = 'all 0.3s ease-out';
        el.style.opacity = '0';
        el.style.transform = 'translateY(-10px)';
        
        setTimeout(() => {
            el.classList.add('d-none');
            el.style.transition = '';
            el.style.opacity = '';
            el.style.transform = '';
        }, 300);
    }
}

const saveTaskEdit = (taskId) => {
    const saveBtn = document.querySelector(`button[onclick="saveTaskEdit(${taskId})"]`);
    if (saveBtn) {
        saveBtn.innerHTML = '<span class="loading-spinner"></span> Lưu...';
        saveBtn.disabled = true;
    }
    
    const status = document.getElementById(`edit-status-${taskId}`)?.value;
    const priority = document.getElementById(`edit-priority-${taskId}`)?.value;
    const start_date = document.getElementById(`edit-start-${taskId}`)?.value;
    const end_date = document.getElementById(`edit-end-${taskId}`)?.value;

    fetch("/update-task", {
        method: "POST",
        body: JSON.stringify({ task_id: taskId, data: { status, priority, start_date, end_date } }),
    }).then(() => {
        // Success animation
        const taskElement = document.getElementById(`task-${taskId}`);
        if (taskElement) {
            taskElement.style.animation = 'bounce 0.6s ease-out';
        }
        
        setTimeout(() => {
            window.location.href = "/";
        }, 600);
    }).catch(() => {
        // Reset button on error
        if (saveBtn) {
            saveBtn.innerHTML = 'Lưu';
            saveBtn.disabled = false;
        }
    });
}

// Password reset validation
document.addEventListener("DOMContentLoaded", function () {
    const resetForm = document.querySelector('form[action*="reset-password"]');
    if (resetForm) {
        const newPasswordInput = document.getElementById('new_password');
        const confirmPasswordInput = document.getElementById('confirm_password');
        
        function validatePasswords() {
            const newPassword = newPasswordInput.value;
            const confirmPassword = confirmPasswordInput.value;
            
            if (newPassword.length !== 8) {
                newPasswordInput.setCustomValidity('Mật khẩu phải đúng 8 ký tự');
                return false;
            }
            
            if (newPassword !== confirmPassword) {
                confirmPasswordInput.setCustomValidity('Mật khẩu xác nhận không trùng khớp');
                return false;
            }
            
            newPasswordInput.setCustomValidity('');
            confirmPasswordInput.setCustomValidity('');
            return true;
        }
        
        newPasswordInput.addEventListener('input', validatePasswords);
        confirmPasswordInput.addEventListener('input', validatePasswords);
        
        resetForm.addEventListener('submit', function(e) {
            if (!validatePasswords()) {
                e.preventDefault();
            }
        });
    }
});

// Search functionality
document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const priorityFilter = document.getElementById('priorityFilter');
    const searchBtn = document.getElementById('searchBtn');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const taskCount = document.getElementById('task-count');
    const searchResults = document.getElementById('searchResults');
    const tasksContainer = document.getElementById('tasks');
    
    if (!searchInput) return; // Exit if search elements don't exist
    
    let searchTimeout;
    
    // Real-time search with debouncing
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            performSearch();
        }, 300);
    });
    
    // Filter change handlers
    if (statusFilter) {
        statusFilter.addEventListener('change', performSearch);
    }
    
    if (priorityFilter) {
        priorityFilter.addEventListener('change', performSearch);
    }
    
    // Search button
    if (searchBtn) {
        searchBtn.addEventListener('click', function(e) {
            e.preventDefault();
            performSearch();
        });
    }
    
    // Clear search button
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', function(e) {
            e.preventDefault();
            clearSearch();
        });
    }
    
    function performSearch() {
        const searchQuery = searchInput.value.trim();
        const status = statusFilter ? statusFilter.value : '';
        const priority = priorityFilter ? priorityFilter.value : '';
        
        // Build URL parameters
        const params = new URLSearchParams();
        if (searchQuery) params.append('search', searchQuery);
        if (status) params.append('status', status);
        if (priority) params.append('priority', priority);
        
        // Show loading state
        if (searchBtn) {
            searchBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Đang tìm...';
            searchBtn.disabled = true;
        }
        
        // Make AJAX request
        fetch(`/search-tasks?${params.toString()}`)
            .then(response => response.json())
            .then(data => {
                if (data.code === 200) {
                    updateTaskList(data.tasks);
                    updateSearchResults(data.tasks.length, searchQuery, status, priority);
                }
            })
            .catch(error => {
                console.error('Search error:', error);
                // Fallback to page reload
                window.location.href = `/?${params.toString()}`;
            })
            .finally(() => {
                if (searchBtn) {
                    searchBtn.innerHTML = '<i class="fa fa-search"></i> Tìm kiếm';
                    searchBtn.disabled = false;
                }
            });
    }
    
    function clearSearch() {
        searchInput.value = '';
        if (statusFilter) statusFilter.value = '';
        if (priorityFilter) priorityFilter.value = '';
        
        // Reload page to show all tasks
        window.location.href = '/';
    }
    
    function updateTaskList(tasks) {
        if (!tasksContainer) return;
        
        if (tasks.length === 0) {
            tasksContainer.innerHTML = `
                <li class="list-group-item text-center text-muted py-4">
                    <i class="fa fa-search fa-2x mb-2"></i>
                    <div>Không tìm thấy công việc nào</div>
                    <small>Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</small>
                </li>
            `;
        } else {
            tasksContainer.innerHTML = tasks.map(task => `
                <li class="list-group-item task-item" id="task-${task.id}" data-task-id="${task.id}">
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="task-content">
                            <div class="task-title"><strong>${task.title}</strong></div>
                            <div class="small text-muted task-meta">
                                <span class="status-badge status-${task.status.toLowerCase().replace(' ', '-')}">${task.status}</span>
                                <span class="priority-badge priority-${task.priority.toLowerCase().replace(' ', '-')}">${task.priority}</span>
                                <span class="date-range">
                                    ${task.start_date ? task.start_date.split('T')[0] : '-'} → ${task.end_date ? task.end_date.split('T')[0] : '-'}
                                </span>
                            </div>
                        </div>
                        <div class="task-actions">
                            <button class="btn btn-sm btn-outline-primary edit-btn" onclick="toggleTaskEdit(${task.id})">
                                <i class="fa fa-edit"></i> Sửa
                            </button>
                            <button type="button" class="btn btn-sm btn-outline-danger delete-btn ml-2" onClick="deleteTask(${task.id})">
                                <i class="fa fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="mt-3 d-none" id="task-edit-${task.id}">
                        <div class="form-row">
                            <div class="form-group col-md-3">
                                <label class="small mb-1">Trạng thái</label>
                                <select class="form-control form-control-sm" id="edit-status-${task.id}">
                                    <option value="Đã Xong" ${task.status === 'Đã Xong' ? 'selected' : ''}>Đã Xong</option>
                                    <option value="Chưa xong" ${task.status === 'Chưa xong' ? 'selected' : ''}>Chưa xong</option>
                                    <option value="Đang tiến hành" ${task.status === 'Đang tiến hành' ? 'selected' : ''}>Đang tiến hành</option>
                                </select>
                            </div>
                            <div class="form-group col-md-3">
                                <label class="small mb-1">Ưu tiên</label>
                                <select class="form-control form-control-sm" id="edit-priority-${task.id}">
                                    <option value="Cao" ${task.priority === 'Cao' ? 'selected' : ''}>Cao</option>
                                    <option value="Trung bình" ${task.priority === 'Trung bình' ? 'selected' : ''}>Trung bình</option>
                                    <option value="Dễ" ${task.priority === 'Dễ' ? 'selected' : ''}>Dễ</option>
                                </select>
                            </div>
                            <div class="form-group col-md-3">
                                <label class="small mb-1">Ngày bắt đầu</label>
                                <input type="date" class="form-control form-control-sm" id="edit-start-${task.id}" value="${task.start_date ? task.start_date.split('T')[0] : ''}" />
                            </div>
                            <div class="form-group col-md-3">
                                <label class="small mb-1">Ngày kết thúc</label>
                                <input type="date" class="form-control form-control-sm" id="edit-end-${task.id}" value="${task.end_date ? task.end_date.split('T')[0] : ''}" />
                            </div>
                        </div>
                        <div>
                            <button class="btn btn-sm btn-success" onclick="saveTaskEdit(${task.id})">Lưu</button>
                            <button class="btn btn-sm btn-secondary" onclick="toggleTaskEdit(${task.id})">Hủy</button>
                        </div>
                    </div>
                </li>
            `).join('');
        }
        
        // Update task count
        if (taskCount) {
            taskCount.textContent = tasks.length;
        }
    }
    
    function updateSearchResults(count, searchQuery, status, priority) {
        if (!searchResults) return;
        
        let resultText = `Tìm thấy ${count} công việc`;
        const filters = [];
        
        if (searchQuery) filters.push(`tên chứa "${searchQuery}"`);
        if (status) filters.push(`trạng thái "${status}"`);
        if (priority) filters.push(`ưu tiên "${priority}"`);
        
        if (filters.length > 0) {
            resultText += ` với ${filters.join(', ')}`;
        }
        
        searchResults.textContent = resultText;
    }
});