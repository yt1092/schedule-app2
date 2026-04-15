from flask import Blueprint, render_template, request, redirect, url_for, session, flash
from werkzeug.security import generate_password_hash, check_password_hash
from .db import get_connection
from datetime import date
from functools import wraps
import calendar

main = Blueprint('main', __name__)

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('main.login'))
        return f(*args, **kwargs)
    return decorated

@main.route('/')
@login_required
def index():
    return redirect(url_for('main.calendar_view'))

@main.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        email = request.form['email'].strip()
        password = request.form['password'].strip()
        if not email or not password:
            flash('メールアドレスとパスワードを入力してください。', 'error')
            return render_template('register.html')
        hashed = generate_password_hash(password)
        try:
            conn = get_connection()
            cur = conn.cursor()
            cur.execute("INSERT INTO users (email, hashed_password) VALUES (%s, %s)", (email, hashed))
            conn.commit()
            cur.close()
            conn.close()
            flash('登録完了！ログインしてください。', 'success')
            return redirect(url_for('main.login'))
        except Exception:
            flash('このメールアドレスはすでに登録されています。', 'error')
            return render_template('register.html')
    return render_template('register.html')

@main.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email'].strip()
        password = request.form['password'].strip()
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT id, hashed_password FROM users WHERE email = %s", (email,))
        user = cur.fetchone()
        cur.close()
        conn.close()
        if user and check_password_hash(user[1], password):
            session['user_id'] = user[0]
            session['email'] = email
            return redirect(url_for('main.calendar_view'))
        else:
            flash('メールアドレスまたはパスワードが間違っています。', 'error')
    return render_template('login.html')

@main.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('main.login'))

@main.route('/calendar')
@login_required
def calendar_view():
    year = request.args.get('year', date.today().year, type=int)
    month = request.args.get('month', date.today().month, type=int)

    if month == 1:
        prev_year, prev_month = year - 1, 12
    else:
        prev_year, prev_month = year, month - 1

    if month == 12:
        next_year, next_month = year + 1, 1
    else:
        next_year, next_month = year, month + 1

    cal = calendar.monthcalendar(year, month)

    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT id, title, priority, start_date, deadline
        FROM tasks
        WHERE user_id = %s
          AND deadline >= %s
          AND start_date <= %s
        ORDER BY priority ASC
    """, (session['user_id'], date(year, month, 1),
          date(year, month, calendar.monthrange(year, month)[1])))
    tasks = cur.fetchall()
    cur.close()
    conn.close()

# 日付ごとにタスクをまとめる（期間対応）
    tasks_by_day = {}
    for task in tasks:
        task_id, title, priority, start_date, deadline = task
        month_start = date(year, month, 1)
        month_end = date(year, month, calendar.monthrange(year, month)[1])
        show_start = max(start_date, month_start)
        show_end = min(deadline, month_end)
        current = show_start
        while current <= show_end:
            tasks_by_day.setdefault(current.day, []).append({
                'id': task_id,
                'title': title,
                'priority': priority,
            })
            from datetime import timedelta
            current = current + timedelta(days=1)

    return render_template('calendar.html',
        year=year, month=month,
        cal=cal,
        tasks_by_day=tasks_by_day,
        prev_year=prev_year, prev_month=prev_month,
        next_year=next_year, next_month=next_month,
        today=date.today()
    )

@main.route('/task/add', methods=['GET', 'POST'])
@login_required
def add_task():
    selected_date = request.args.get('date', str(date.today()))

    if request.method == 'POST':
        title = request.form['title'].strip()
        description = request.form.get('description', '').strip()
        priority = int(request.form.get('priority', 3))
        start_date = request.form['start_date']
        deadline = request.form['deadline']

        if not title or not start_date or not deadline:
            flash('タイトルと日付は必須です。', 'error')
            return render_template('add_task.html', selected_date=selected_date)

        if start_date > deadline:
            flash('開始日は終了日より前にしてください。', 'error')
            return render_template('add_task.html', selected_date=selected_date)

        conn = get_connection()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO tasks (user_id, title, description, priority, start_date, deadline) VALUES (%s, %s, %s, %s, %s, %s)",
            (session['user_id'], title, description, priority, start_date, deadline)
        )
        conn.commit()
        cur.close()
        conn.close()

        d = date.fromisoformat(deadline)
        return redirect(url_for('main.calendar_view', year=d.year, month=d.month))

    return render_template('add_task.html', selected_date=selected_date)

@main.route('/task/delete/<int:task_id>', methods=['POST'])
@login_required
def delete_task(task_id):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "DELETE FROM tasks WHERE id = %s AND user_id = %s RETURNING deadline",
        (task_id, session['user_id'])
    )
    row = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()

    if row:
        d = row[0]
        return redirect(url_for('main.calendar_view', year=d.year, month=d.month))
    return redirect(url_for('main.calendar_view'))