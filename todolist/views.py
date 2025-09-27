from flask import Blueprint,render_template, request, flash, jsonify
from flask_login import login_required, current_user
from sqlalchemy.sql.functions import user
from werkzeug.exceptions import RequestURITooLarge
from .models import Task
from . import db
import json
from datetime import datetime
from sqlalchemy import or_

views = Blueprint("views",__name__)

@views.route("/home", methods=["GET", "POST"])
@views.route("/", methods=["GET", "POST"])
@login_required  
def home():
    if request.method == "POST":
        form_type = request.form.get("form_type")
        if form_type == "task":
            title = request.form.get("title")
            status = request.form.get("status") or "Chưa xong"
            priority = request.form.get("priority") or "trung bình"
            start_date_str = request.form.get("start_date")
            end_date_str = request.form.get("end_date")
            
            # Xử lý chuyển đổi ngày tháng
            try:
                start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date() if start_date_str else None
                end_date = datetime.strptime(end_date_str, "%Y-%m-%d").date() if end_date_str else None
            except ValueError:
                start_date = None
                end_date = None
                
            # Kiểm tra tiêu đề không được trống
            if not title:
                flash("Vui lòng nhập tên Task", category="error")
            else:
                new_task = Task(
                    title=title,
                    status=status,
                    priority=priority,
                    start_date=start_date,
                    end_date=end_date,
                    user_id=current_user.id, 
                )
                db.session.add(new_task)
                db.session.commit()
                flash("Đã thêm công việc!", category="success")
                
    # Lấy các tham số tìm kiếm và lọc từ URL parameters
    search_query = request.args.get('search', '').strip()
    status_filter = request.args.get('status', '')
    priority_filter = request.args.get('priority', '')
    
    # Xây dựng query cơ bản - chỉ lấy task của user hiện tại
    query = Task.query.filter_by(user_id=current_user.id)
    if search_query:
        query = query.filter(Task.title.ilike(f'%{search_query}%'))
    if status_filter:
        query = query.filter(Task.status == status_filter)
    if priority_filter:
        query = query.filter(Task.priority == priority_filter)
    tasks = query.order_by(Task.created_at.desc()).all()
    
    return render_template("index.html", user=current_user, tasks=tasks, 
                         search_query=search_query, status_filter=status_filter, priority_filter=priority_filter)

@views.route("/delete-task", methods=["POST"])
def delete_task():
    # Parse dữ liệu JSON từ request
    payload = json.loads(request.data)
    task_id = payload.get("task_id")
    
    # Tìm task theo ID và kiểm tra quyền sở hữu
    result = Task.query.get(task_id)
    if result and result.user_id == current_user.id:
        db.session.delete(result)
        db.session.commit()
        
    return jsonify({"code": 200})

@views.route("/update-task", methods=["POST"])
def update_task():
    payload = json.loads(request.data)
    task_id = payload.get("task_id")
    task = Task.query.get(task_id)
    if not task or task.user_id != current_user.id:
        return jsonify({"code": 404}), 404

    # Hỗ trợ cập nhật nhiều trường cùng lúc (dạng object)
    updates = payload.get("data")
    if updates and isinstance(updates, dict):
        for field, value in updates.items():
            if field in ("status", "priority", "title"):
                setattr(task, field, value)
            elif field in ("start_date", "end_date"):
                try:
                    setattr(task, field, datetime.strptime(value, "%Y-%m-%d").date() if value else None)
                except Exception:
                    return jsonify({"code": 400, "message": f"invalid date for {field}"}), 400
            else:
                return jsonify({"code": 400, "message": f"invalid field {field}"}), 400
    else:
        field = payload.get("field")
        value = payload.get("value")
        if field in ("status", "priority", "title"):
            setattr(task, field, value)
        elif field in ("start_date", "end_date"):
            try:
                setattr(task, field, datetime.strptime(value, "%Y-%m-%d").date() if value else None)
            except Exception:
                return jsonify({"code": 400, "message": "invalid date"}), 400
        else:
            return jsonify({"code": 400}), 400
    db.session.commit()
    return jsonify({"code": 200})

@views.route("/search-tasks", methods=["GET"])
@login_required
def search_tasks():
    search_query = request.args.get('search', '').strip()
    status_filter = request.args.get('status', '')
    priority_filter = request.args.get('priority', '')
    
    query = Task.query.filter_by(user_id=current_user.id)
    # Áp dụng các bộ lọc
    if search_query:
        query = query.filter(Task.title.ilike(f'%{search_query}%'))
    if status_filter:
        query = query.filter(Task.status == status_filter)
    if priority_filter:
        query = query.filter(Task.priority == priority_filter)
    tasks = query.order_by(Task.created_at.desc()).all()
    tasks_data = []
    for task in tasks:
        tasks_data.append({
            'id': task.id,
            'title': task.title,
            'status': task.status,
            'priority': task.priority,
            'start_date': task.start_date.isoformat() if task.start_date else None,
            'end_date': task.end_date.isoformat() if task.end_date else None,
            'created_at': task.created_at.isoformat()
        })
    
    return jsonify({"code": 200, "tasks": tasks_data})