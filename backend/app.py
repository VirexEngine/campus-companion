from flask import Flask, request, jsonify, send_from_directory
import os
import uuid
from werkzeug.utils import secure_filename
try:
    with open('.env') as f:
        for line in f:
            if '=' in line and not line.strip().startswith('#'):
                k, v = line.strip().split('=', 1)
                os.environ[k] = v
except Exception:
    pass

from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash
import random
from datetime import datetime
import google.generativeai as genai

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = 'super-secret-key-change-in-prod'
CORS(app)
jwt = JWTManager(app)

@app.route("/")
def home():
    return "Campus Companion Backend is Live 🚀"

# Initialize Gemini
api_key = os.environ.get('GEMINI_API_KEY')
if api_key:
    genai.configure(api_key=api_key)

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def migrate_documents():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            filename TEXT NOT NULL,
            original_name TEXT NOT NULL,
            file_size INTEGER,
            upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(user_id)
        )
    ''')
    
    # Add face_descriptor to users table if not exists
    cursor.execute("PRAGMA table_info(users)")
    columns = [row[1] for row in cursor.fetchall()]
    if 'face_descriptor' not in columns:
        cursor.execute("ALTER TABLE users ADD COLUMN face_descriptor TEXT")
        
    conn.commit()
    conn.close()

def get_db_connection():
    conn = sqlite3.connect('database.db')
    conn.execute('PRAGMA foreign_keys = ON')
    conn.row_factory = sqlite3.Row
    return conn

def generate_user_id(role):
    prefix = 'ADM' if role == 'admin' else 'TCH' if role == 'teacher' else 'STU'
    return f"{prefix}-{random.randint(1000, 9999)}"

def init_db_if_needed():
    """Create all tables that might be missing without dropping existing ones."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            department TEXT,
            password TEXT NOT NULL,
            role TEXT NOT NULL,
            last_login DATETIME
        );
        CREATE TABLE IF NOT EXISTS attendance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            subject TEXT NOT NULL,
            date TEXT NOT NULL,
            status TEXT NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(user_id),
            UNIQUE(user_id, subject, date)
        );
        CREATE TABLE IF NOT EXISTS timetable (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            subject TEXT NOT NULL,
            day TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,
            teacher TEXT NOT NULL,
            room TEXT NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(user_id)
        );
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            message TEXT NOT NULL,
            type TEXT NOT NULL,
            date TEXT NOT NULL,
            is_read BOOLEAN DEFAULT 0,
            FOREIGN KEY(user_id) REFERENCES users(user_id)
        );
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            due_date TEXT,
            completed BOOLEAN DEFAULT 0,
            priority TEXT,
            FOREIGN KEY(user_id) REFERENCES users(user_id)
        );
        CREATE TABLE IF NOT EXISTS user_subjects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            subject TEXT NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(user_id)
        );
        CREATE TABLE IF NOT EXISTS queries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            message TEXT NOT NULL,
            reply TEXT,
            status TEXT DEFAULT 'open',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            receiver_role TEXT DEFAULT 'admin',
            receiver_id TEXT DEFAULT 'ADMIN-GLOBAL',
            FOREIGN KEY(user_id) REFERENCES users(user_id)
        );
        CREATE TABLE IF NOT EXISTS chat_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(user_id)
        );
        CREATE TABLE IF NOT EXISTS quizzes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            teacher_id TEXT NOT NULL,
            topic_name TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(teacher_id) REFERENCES users(user_id)
        );
        CREATE TABLE IF NOT EXISTS quiz_questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            quiz_id INTEGER NOT NULL,
            question_text TEXT NOT NULL,
            option_a TEXT NOT NULL,
            option_b TEXT NOT NULL,
            option_c TEXT NOT NULL,
            option_d TEXT NOT NULL,
            correct_option TEXT NOT NULL,
            FOREIGN KEY(quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS quiz_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            quiz_id INTEGER NOT NULL,
            score INTEGER NOT NULL,
            streak_count INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(user_id),
            FOREIGN KEY(quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
        );
    """)
    conn.commit()
    conn.close()

def migrate_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    # Check if receiver_role exists in queries
    cursor.execute("PRAGMA table_info(queries)")
    columns = [row[1] for row in cursor.fetchall()]

    if columns:  # Table exists
        if 'receiver_role' not in columns:
            cursor.execute("ALTER TABLE queries ADD COLUMN receiver_role TEXT DEFAULT 'admin'")
        if 'receiver_id' not in columns:
            cursor.execute("ALTER TABLE queries ADD COLUMN receiver_id TEXT DEFAULT 'ADMIN-GLOBAL'")
    
    # Notifications migration
    cursor.execute("PRAGMA table_info(notifications)")
    n_columns = [row[1] for row in cursor.fetchall()]
    if n_columns:  # Table exists
        if 'query_id' not in n_columns:
            cursor.execute("ALTER TABLE notifications ADD COLUMN query_id INTEGER")
        
        # Patch old notifications to enable reply button
        cursor.execute("UPDATE notifications SET type='query' WHERE (message LIKE 'Re: %' OR message LIKE 'New Inquiry from %' OR message LIKE 'Inquiry from %' OR message LIKE '%: %, %:') AND type != 'query'")
        
        # Attempt to backfill query_id for notifications by matching message fragments
        cursor.execute("""
            UPDATE notifications 
            SET query_id = (
                SELECT id FROM queries 
                WHERE notifications.message LIKE '%' || queries.message || '%'
                LIMIT 1
            )
            WHERE type = 'query' AND query_id IS NULL
        """)
        
        # Mark any query notifications that couldn't be linked OR whose query has been deleted as read
        cursor.execute("""
            UPDATE notifications 
            SET is_read = 1 
            WHERE type = 'query' 
            AND (query_id IS NULL OR query_id NOT IN (SELECT id FROM queries))
        """)

    # Quiz timer migration
    cursor.execute("PRAGMA table_info(quizzes)")
    q_cols = [row[1] for row in cursor.fetchall()]
    if q_cols and 'timer_seconds' not in q_cols:
        cursor.execute("ALTER TABLE quizzes ADD COLUMN timer_seconds INTEGER DEFAULT 30")
    all_users = cursor.execute("SELECT user_id, name, department, role FROM users WHERE role != 'admin'").fetchall()
    for uid, name, dept, role in all_users:
        if dept in DEFAULT_TIMETABLES or (role == 'student' and dept in ['CSE', 'DS']):
            # Normalize department for timetable lookup
            timetable_dept = dept if dept in DEFAULT_TIMETABLES else 'CSE'
            
            # A. Subject Maintenance (Ensure AI-ML has English)
            if dept == 'CSE AI-ML':
                exists = cursor.execute("SELECT 1 FROM user_subjects WHERE user_id = ? AND subject = 'English'", (uid,)).fetchone()
                if not exists:
                    cursor.execute("INSERT INTO user_subjects (user_id, subject) VALUES (?, 'English')", (uid,))
            
            # B. Timetable Refresh
            cursor.execute("DELETE FROM timetable WHERE user_id = ?", (uid,))
            
            # Get user's subjects to filter timetable if teacher
            user_subjs = cursor.execute("SELECT subject FROM user_subjects WHERE user_id = ?", (uid,)).fetchall()
            subscribed_subjs = [s[0] for s in user_subjs]
            
            timetable = DEFAULT_TIMETABLES.get(timetable_dept, [])
            for entry in timetable:
                # Filter for teachers: only their assigned subjects
                if role == 'teacher' and entry['subject'] not in subscribed_subjs:
                    continue
                
                teacher_name = name if role == 'teacher' else entry['teacher']
                cursor.execute("INSERT INTO timetable (user_id, subject, day, start_time, end_time, teacher, room) VALUES (?, ?, ?, ?, ?, ?, ?)",
                            (uid, entry['subject'], entry['day'], entry['start_time'], entry['end_time'], teacher_name, entry['room']))
    
    conn.commit()
    conn.close()



def is_admin(user_id):
    conn = get_db_connection()
    user = conn.execute('SELECT role FROM users WHERE user_id = ?', (user_id,)).fetchone()
    conn.close()
    return user and user['role'] == 'admin'

def get_department_subjects(department):
    if department in ['CSE', 'DS', 'CSE/DS']:
        return ['Maths', 'BEE', 'EVS', 'PPS', 'Physics']
    elif department == 'CSE AI-ML':
        return ['Maths', 'FEE', 'Chemistry', 'Mechanics', 'English']
    return []

DEFAULT_TIMETABLES = {
    'CSE': [
        {'subject': s, 'day': d, 'start_time': t[0], 'end_time': t[1], 'teacher': t[2], 'room': t[3]}
        for d in ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        for s, t in zip(['Maths', 'BEE', 'EVS', 'PPS', 'Physics'], [
            ('09:00', '10:00', 'Dr. Sharma', 'CS-101'),
            ('10:00', '11:00', 'Prof. Verma', 'EE-201'),
            ('11:00', '12:00', 'Ms. Iyer', 'L-301'),
            ('12:00', '13:00', 'Dr. Gupta', 'CS-102'),
            ('14:00', '15:00', 'Dr. Reddy', 'PH-105')
        ])
    ],
    'DS': [
        {'subject': s, 'day': d, 'start_time': t[0], 'end_time': t[1], 'teacher': t[2], 'room': t[3]}
        for d in ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        for s, t in zip(['Maths', 'BEE', 'EVS', 'PPS', 'Physics'], [
            ('09:00', '10:00', 'Dr. Sharma', 'CS-101'),
            ('10:00', '11:00', 'Prof. Verma', 'EE-201'),
            ('11:00', '12:00', 'Ms. Iyer', 'L-301'),
            ('12:00', '13:00', 'Dr. Gupta', 'CS-102'),
            ('14:00', '15:00', 'Dr. Reddy', 'PH-105')
        ])
    ],
    'CSE/DS': [
        {'subject': s, 'day': d, 'start_time': t[0], 'end_time': t[1], 'teacher': t[2], 'room': t[3]}
        for d in ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        for s, t in zip(['Maths', 'BEE', 'EVS', 'PPS', 'Physics'], [
            ('09:00', '10:00', 'Dr. Sharma', 'CS-101'),
            ('10:00', '11:00', 'Prof. Verma', 'EE-201'),
            ('11:00', '12:00', 'Ms. Iyer', 'L-301'),
            ('12:00', '13:00', 'Dr. Gupta', 'CS-102'),
            ('14:00', '15:00', 'Dr. Reddy', 'PH-105')
        ])
    ],
    'CSE AI-ML': [
        {'subject': s, 'day': d, 'start_time': t[0], 'end_time': t[1], 'teacher': t[2], 'room': t[3]}
        for d in ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        for s, t in zip(['Maths', 'FEE', 'Chemistry', 'Mechanics', 'English'], [
            ('09:00', '10:00', 'Dr. Sharma', 'CS-101'),
            ('10:00', '11:00', 'Prof. Singh', 'AI-201'),
            ('11:00', '12:00', 'Dr. Paul', 'CH-101'),
            ('12:00', '13:00', 'Prof. Das', 'ME-102'),
            ('14:00', '15:00', 'Ms. Jones', 'L-201')
        ])
    ]
}

def assign_default_subjects(cur, user_id, name, department, role, chosen_subject=None):
    if role == 'teacher' and chosen_subject:
        subjects = [chosen_subject]
    else:
        subjects = get_department_subjects(department)
        
    for subj in subjects:
        cur.execute("INSERT INTO user_subjects (user_id, subject) VALUES (?, ?)", (user_id, subj))
    
    # Assign timetable
    timetable = DEFAULT_TIMETABLES.get(department, [])
    for entry in timetable:
        # If teacher, only assign entries for THEIR subject
        if role == 'teacher' and chosen_subject:
            if entry['subject'] != chosen_subject:
                continue
        
        teacher_name = name if role == 'teacher' else entry['teacher']
        cur.execute("INSERT INTO timetable (user_id, subject, day, start_time, end_time, teacher, room) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    (user_id, entry['subject'], entry['day'], entry['start_time'], entry['end_time'], teacher_name, entry['room']))


# =========================================================
# AUTHENTICATION
# =========================================================

@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.json
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role')
    department = data.get('department', '')

    if not all([name, email, password, role]):
        return jsonify({'error': 'Missing required fields'}), 400

    hashed_password = generate_password_hash(password)
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    while True:
        user_id = generate_user_id(role)
        existing = cur.execute('SELECT id FROM users WHERE user_id = ?', (user_id,)).fetchone()
        if not existing:
            break
            
    try:
        face_descriptor = data.get('face_descriptor')
        cur.execute("INSERT INTO users (user_id, name, email, department, password, role, face_descriptor) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    (user_id, name, email, department, hashed_password, role, face_descriptor))
        
        subject = data.get('subject')
        assign_default_subjects(cur, user_id, name, department, role, subject)
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'error': 'Email already exists'}), 400

    conn.close()
    return jsonify({'message': 'User created successfully', 'user_id': user_id}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    user_id = data.get('user_id')
    password = data.get('password')
    print(f"DEBUG: Login attempt for user_id='{user_id}'")

    try:
        conn = get_db_connection()
        user = conn.execute('SELECT * FROM users WHERE user_id = ?', (user_id,)).fetchone()
        conn.close()

        if not user:
            print(f"DEBUG: User '{user_id}' NOT FOUND in database")
            return jsonify({'error': 'Invalid ID or password'}), 401

        print(f"DEBUG: User '{user_id}' found. Role: {user['role']}")
        if check_password_hash(user['password'], password):
            # Update last login
            db = get_db_connection()
            db.execute('UPDATE users SET last_login = ? WHERE user_id = ?', (datetime.now().isoformat(), user_id))
            db.commit()
            db.close()
            print(f"DEBUG: Password MATCH for '{user_id}'. Login SUCCESS.")
            
            access_token = create_access_token(identity=user['user_id'])
            user_dict = dict(user)
            user_dict.pop('password', None)
            return jsonify({'access_token': access_token, 'user': user_dict}), 200
        else:
            print(f"DEBUG: Password MISMATCH for '{user_id}'.")
    except Exception as e:
        print(f"DEBUG: Login Exception: {str(e)}")
        return jsonify({'error': 'Internal Server Error'}), 500

    return jsonify({'error': 'Invalid ID or password'}), 401

@app.route('/api/login/face/get-descriptor/<user_id>', methods=['GET'])
def get_face_descriptor(user_id):
    try:
        conn = get_db_connection()
        user = conn.execute('SELECT face_descriptor FROM users WHERE user_id = ?', (user_id,)).fetchone()
        conn.close()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        return jsonify({'face_descriptor': user['face_descriptor']}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/login/face', methods=['POST'])
def login_face():
    data = request.json
    user_id = data.get('user_id')
    print(f"DEBUG: Face Login attempt for user_id='{user_id}'")

    try:
        conn = get_db_connection()
        user = conn.execute('SELECT * FROM users WHERE user_id = ?', (user_id,)).fetchone()
        conn.close()

        if not user:
            return jsonify({'error': 'User not found'}), 404

        if not user['face_descriptor']:
            return jsonify({'error': 'Face ID not set up for this user'}), 400

        if data.get('verified') == True:
            # Update last login
            db = get_db_connection()
            db.execute('UPDATE users SET last_login = ? WHERE user_id = ?', (datetime.now().isoformat(), user_id))
            db.commit()
            db.close()
            
            access_token = create_access_token(identity=user['user_id'])
            user_dict = dict(user)
            user_dict.pop('password', None)
            return jsonify({'access_token': access_token, 'user': user_dict}), 200
        else:
            return jsonify({'error': 'Face verification failed'}), 401
            
    except Exception as e:
        print(f"DEBUG: Face Login Exception: {str(e)}")
        return jsonify({'error': 'Internal Server Error'}), 500

@app.route('/api/user/password', methods=['PUT'])
@jwt_required()
def change_password():
    current_user_id = get_jwt_identity()
    new_password = request.json.get('password')
    if not new_password:
        return jsonify({'error': 'Password required'}), 400
        
    hashed_password = generate_password_hash(new_password)
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('UPDATE users SET password = ? WHERE user_id = ?', (hashed_password, current_user_id))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Password updated successfully'}), 200


# =========================================================
# DASHBOARD DATA (USER SPECIFIC)
# =========================================================

@app.route('/api/attendance', methods=['GET'])
@jwt_required()
def get_attendance():
    current_user_id = get_jwt_identity()
    conn = get_db_connection()
    user = conn.execute('SELECT role FROM users WHERE user_id = ?', (current_user_id,)).fetchone()
    
    if user and user['role'] == 'teacher':
        # Return all attendance for subjects this teacher teaches
        teacher_subjs = conn.execute('SELECT subject FROM user_subjects WHERE user_id = ?', (current_user_id,)).fetchall()
        subj_list = [s['subject'] for s in teacher_subjs]
        if not subj_list:
            records = []
        else:
            placeholders = ', '.join(['?'] * len(subj_list))
            records = conn.execute(f'''
                SELECT a.*, u.name as studentName 
                FROM attendance a 
                JOIN users u ON a.user_id = u.user_id 
                WHERE a.subject IN ({placeholders})
                ORDER BY a.date DESC
            ''', subj_list).fetchall()
    else:
        # Return only own attendance for students
        records = conn.execute('''
            SELECT a.*, u.name as studentName 
            FROM attendance a 
            JOIN users u ON a.user_id = u.user_id 
            WHERE a.user_id = ? 
            ORDER BY a.date DESC
        ''', (current_user_id,)).fetchall()
        
    conn.close()
    return jsonify([{
        'id': r['id'],
        'studentId': r['user_id'],
        'studentName': r['studentName'],
        'subject': r['subject'],
        'date': r['date'],
        'status': r['status']
    } for r in records])

@app.route('/api/timetable', methods=['GET'])
@jwt_required()
def get_timetable():
    current_user_id = get_jwt_identity()
    conn = get_db_connection()
    records = conn.execute('SELECT * FROM timetable WHERE user_id = ?', (current_user_id,)).fetchall()
    conn.close()
    return jsonify([{
        'id': r['id'],
        'user_id': r['user_id'],
        'subject': r['subject'],
        'day': r['day'],
        'startTime': r['start_time'],
        'endTime': r['end_time'],
        'teacher': r['teacher'],
        'room': r['room']
    } for r in records])

@app.route('/api/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    current_user_id = get_jwt_identity()
    conn = get_db_connection()
    records = conn.execute('SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC', (current_user_id,)).fetchall()
    conn.close()
    return jsonify([dict(r) for r in records])

@app.route('/api/tasks', methods=['GET'])
@jwt_required()
def get_tasks():
    current_user_id = get_jwt_identity()
    conn = get_db_connection()
    records = conn.execute('SELECT * FROM tasks WHERE user_id = ?', (current_user_id,)).fetchall()
    conn.close()
    return jsonify([dict(r) for r in records])

@app.route('/api/subjects', methods=['GET'])
@jwt_required()
def get_user_subjects():
    current_user_id = get_jwt_identity()
    conn = get_db_connection()
    records = conn.execute('SELECT * FROM user_subjects WHERE user_id = ?', (current_user_id,)).fetchall()
    conn.close()
    return jsonify([dict(r) for r in records])


# =========================================================
# TEACHER ENDPOINTS
# =========================================================

@app.route('/api/teacher/students', methods=['GET'])
@jwt_required()
def get_teacher_students():
    current_user_id = get_jwt_identity()
    conn = get_db_connection()
    
    # Get teacher's department
    teacher = conn.execute('SELECT department FROM users WHERE user_id = ?', (current_user_id,)).fetchone()
    if not teacher:
        conn.close()
        return jsonify([])
        
    dept = teacher['department']
    if dept == 'CSE/DS':
        # Teacher for CSE/DS sees students from both CSE and DS
        records = conn.execute('''
            SELECT user_id, name, department, email 
            FROM users 
            WHERE role = "student" AND department IN ("CSE", "DS") AND last_login IS NOT NULL
        ''').fetchall()
    else:
        # Teacher for specific department (e.g. AI-ML)
        records = conn.execute('''
            SELECT user_id, name, department, email 
            FROM users 
            WHERE role = "student" AND department = ? AND last_login IS NOT NULL
        ''', (dept,)).fetchall()
        
    conn.close()
    return jsonify([dict(r) for r in records])

@app.route('/api/attendance', methods=['POST'])
@jwt_required()
def post_attendance():
    data = request.json
    student_id = data.get('user_id')
    subject = data.get('subject')
    date_str = data.get('date', datetime.now().strftime('%Y-%m-%d'))
    status = data.get('status')
    
    conn = get_db_connection()
    cur = conn.cursor()
    # Use REPLACE to allow real-time updates without duplicates
    cur.execute("INSERT OR REPLACE INTO attendance (user_id, subject, date, status) VALUES (?, ?, ?, ?)",
                (student_id, subject, date_str, status))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Attendance recorded'}), 201


# =========================================================
# ADMIN ENDPOINTS
# =========================================================

@app.route('/api/admin/students', methods=['GET'])
@jwt_required()
def get_admin_students():
    # Only Admin should access this (add role check if needed)
    conn = get_db_connection()
    students = conn.execute('SELECT user_id, name, department, email, last_login FROM users WHERE role = "student"').fetchall()
    
    result = []
    for s in students:
        user_id = s['user_id']
        # Calculate attendance %
        records = conn.execute('SELECT status FROM attendance WHERE user_id = ?', (user_id,)).fetchall()
        total = len(records)
        present = len([r for r in records if r['status'] in ['present', 'late']])
        percentage = round((present / total) * 100) if total > 0 else 0
        
        status = 'active'
        if percentage < 75: status = 'warning'
        if percentage < 60: status = 'critical'
        if total == 0: status = 'active'
        
        result.append({
            'id': user_id,
            'name': s['name'],
            'rollNo': user_id,
            'department': s['department'],
            'email': s['email'],
            'attendance': percentage,
            'status': status,
            'lastLogin': s['last_login']
        })
    conn.close()
    return jsonify(result)

@app.route('/api/admin/attendance/<user_id>', methods=['GET'])
@jwt_required()
def get_admin_student_attendance(user_id):
    conn = get_db_connection()
    records = conn.execute('''
        SELECT id, subject, date, status FROM attendance 
        WHERE user_id = ? ORDER BY date DESC
    ''', (user_id,)).fetchall()
    conn.close()
    return jsonify([dict(r) for r in records])

@app.route('/api/admin/attendance/<int:record_id>', methods=['DELETE'])
@jwt_required()
def delete_attendance_record(record_id):
    conn = get_db_connection()
    conn.execute('DELETE FROM attendance WHERE id = ?', (record_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Record deleted successfully'})

@app.route('/api/admin/attendance/update', methods=['PATCH'])
@jwt_required()
def update_attendance_record():
    data = request.json
    status = data.get('status')
    record_id = data.get('id')
    conn = get_db_connection()
    conn.execute('UPDATE attendance SET status = ? WHERE id = ?', (status, record_id))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Record updated successfully'})

@app.route('/api/admin/analytics', methods=['GET'])
@jwt_required()
def get_admin_analytics():
    if not is_admin(get_jwt_identity()):
        return jsonify({'error': 'Unauthorized'}), 403
        
    conn = get_db_connection()
    cur = conn.cursor()
    
    # 1. Basic Counts
    total_students = cur.execute('SELECT COUNT(*) FROM users WHERE role = "student"').fetchone()[0]
    total_teachers = cur.execute('SELECT COUNT(*) FROM users WHERE role = "teacher"').fetchone()[0]
    
    # 2. Global Avg Attendance
    att_rows = cur.execute('SELECT status FROM attendance').fetchall()
    total_att = len(att_rows)
    present_att = len([r for r in att_rows if r['status'] in ['present', 'late']])
    global_avg = round((present_att / total_att) * 100) if total_att > 0 else 0
    
    # 3. Active Today
    today_str = datetime.now().strftime('%Y-%m-%d')
    active_today = cur.execute("SELECT COUNT(*) FROM users WHERE role='student' AND last_login LIKE ?", (f"{today_str}%",)).fetchone()[0]
    
    # 4. Department & Subject Stats
    depts = cur.execute('SELECT DISTINCT department FROM users WHERE role = "student"').fetchall()
    dept_stats = []
    low_att_count = 0
    
    for d in depts:
        dept_name = d['department']
        dept_users = cur.execute('SELECT user_id FROM users WHERE role="student" AND department=?', (dept_name,)).fetchall()
        user_ids = [u['user_id'] for u in dept_users]
        
        if not user_ids:
            dept_stats.append({'name': dept_name, 'students': 0, 'avgAttendance': 0, 'subjects': []})
            continue
            
        # Dept Attendance
        placeholders = ', '.join(['?'] * len(user_ids))
        dept_att = cur.execute(f'SELECT status, subject FROM attendance WHERE user_id IN ({placeholders})', user_ids).fetchall()
        
        d_total = len(dept_att)
        d_present = len([r for r in dept_att if r['status'] in ['present', 'late']])
        d_avg = round((d_present / d_total) * 100) if d_total > 0 else 0
        
        # Subject breakdown within dept
        subj_map = {}
        for r in dept_att:
            s_name = r['subject']
            if s_name not in subj_map: subj_map[s_name] = {'total': 0, 'present': 0}
            subj_map[s_name]['total'] += 1
            if r['status'] in ['present', 'late']: subj_map[s_name]['present'] += 1
            
        subjects_list = []
        for name, counts in subj_map.items():
            subjects_list.append({
                'name': name,
                'avgAttendance': round((counts['present'] / counts['total']) * 100)
            })
            
        dept_stats.append({
            'name': dept_name,
            'students': len(user_ids),
            'avgAttendance': d_avg,
            'subjects': subjects_list
        })
        
    # 5. Low Attendance Alerts (Individual level < 75%)
    # Note: Optimization - this can be slow if there are many students, but fine for small/medium scale
    student_ids = [s[0] for s in cur.execute('SELECT user_id FROM users WHERE role = "student"').fetchall()]
    for sid in student_ids:
        s_att = cur.execute('SELECT status FROM attendance WHERE user_id = ?', (sid,)).fetchall()
        if s_att:
            s_total = len(s_att)
            s_present = len([r for r in s_att if r['status'] in ['present', 'late']])
            if (s_present / s_total) < 0.75:
                low_att_count += 1

    # 6. Pending Queries
    pending_queries = cur.execute('SELECT COUNT(*) FROM queries WHERE status = "pending"').fetchone()[0]
    
    # 7. Recent Queries
    recent_q_rows = cur.execute('''
        SELECT q.message as query, u.name as "from", q.status 
        FROM queries q 
        JOIN users u ON q.user_id = u.user_id 
        ORDER BY q.id DESC LIMIT 4
    ''').fetchall()
    
    conn.close()
    return jsonify({
        'totalStudents': total_students,
        'totalTeachers': total_teachers,
        'avgAttendance': global_avg,
        'activeToday': active_today,
        'departments': dept_stats,
        'pendingQueries': pending_queries,
        'lowAttendanceAlerts': low_att_count,
        'recentQueries': [dict(r) for r in recent_q_rows]
    })

@app.route('/api/admin/teachers', methods=['GET'])
@jwt_required()
def get_admin_teachers():
    conn = get_db_connection()
    teachers = conn.execute('SELECT user_id, name, department FROM users WHERE role = "teacher"').fetchall()
    
    result = []
    for t in teachers:
        user_id = t['user_id']
        subjects = conn.execute('SELECT subject FROM user_subjects WHERE user_id = ?', (user_id,)).fetchall()
        subject_list = [s['subject'] for s in subjects]
        student_count = conn.execute('SELECT COUNT(*) FROM users WHERE role="student" AND department=?', (t['department'],)).fetchone()[0]
        
        result.append({
            'id': user_id,
            'name': t['name'],
            'department': t['department'],
            'subjects': subject_list,
            'students': student_count
        })
    conn.close()
    return jsonify(result)

@app.route('/api/admin/queries', methods=['GET'])
@jwt_required()
def get_admin_queries_list():
    if not is_admin(get_jwt_identity()): return jsonify({'error': 'Unauthorized'}), 403
    conn = get_db_connection()
    records = conn.execute('''
        SELECT q.id, q.message as question, u.name as "from", q.created_at as date, q.status, q.reply
        FROM queries q
        JOIN users u ON q.user_id = u.user_id
        WHERE q.receiver_role = 'admin'
        ORDER BY q.id DESC
    ''').fetchall()
    conn.close()
    return jsonify([dict(r) for r in records])

@app.route('/api/teacher/queries', methods=['GET'])
@jwt_required()
def get_teacher_queries_list():
    current_user_id = get_jwt_identity()
    conn = get_db_connection()
    records = conn.execute('''
        SELECT q.id, q.message as question, u.name as "from", q.created_at as date, q.status, q.reply
        FROM queries q
        JOIN users u ON q.user_id = u.user_id
        WHERE q.receiver_role = 'teacher' AND q.receiver_id = ?
        ORDER BY q.id DESC
    ''', (current_user_id,)).fetchall()
    conn.close()
    return jsonify([dict(r) for r in records])

@app.route('/api/queries/reply', methods=['POST'])
@jwt_required()
def reply_to_query():
    current_user_id = get_jwt_identity()
    data = request.json
    query_id = data.get('id')
    reply_text = data.get('reply')
    
    conn = get_db_connection()
    cur = conn.cursor()
    query = cur.execute('SELECT user_id, message, receiver_role, receiver_id, reply FROM queries WHERE id = ?', (query_id,)).fetchone()
    
    if not query:
        conn.close()
        return jsonify({'error': 'Query not found'}), 404
        
    # Check if user is either the asker or the receiver (or admin)
    is_asker = query['user_id'] == current_user_id
    is_receiver = (query['receiver_id'] == current_user_id) or (query['receiver_role'] == 'admin' and is_admin(current_user_id))
    
    if not (is_asker or is_receiver):
        conn.close()
        return jsonify({'error': 'Unauthorized'}), 403

    # Update the query. If it was already answered, we can append to the reply or just overwrite?
    # For now, let's just overwrite but keep the status tracking.
    new_status = 'pending' if is_asker else 'answered'
    cur.execute('UPDATE queries SET reply = ?, status = ? WHERE id = ?', (reply_text, new_status, query_id))
    
    # Notify the OTHER party
    other_party_id = query['receiver_id'] if is_asker else query['user_id']
    if other_party_id == 'ADMIN-GLOBAL':
        # If replying to global admin, maybe just don't notify every admin or pick one?
        # For now, let's just use the current user name for the notification
        pass 
    
    sender_name = cur.execute('SELECT name FROM users WHERE user_id = ?', (current_user_id,)).fetchone()['name']
    # Format: teacher name : original message, reply text:
    notif_msg = f"{sender_name}: {query['message']}, {reply_text}:"
    date_str = datetime.now().strftime('%Y-%m-%d')
    
    # If other_party_id is ADMIN-GLOBAL, we notify all admins
    if other_party_id == 'ADMIN-GLOBAL':
        admins = cur.execute("SELECT user_id FROM users WHERE role = 'admin'").fetchall()
        for admin in admins:
            cur.execute("INSERT INTO notifications (user_id, message, type, date, query_id) VALUES (?, ?, ?, ?, ?)",
                        (admin['user_id'], notif_msg, 'query', date_str, query_id))
    else:
        cur.execute("INSERT INTO notifications (user_id, message, type, date, query_id) VALUES (?, ?, ?, ?, ?)",
                    (other_party_id, notif_msg, 'query', date_str, query_id))
                    
    conn.commit()
    conn.close()
    return jsonify({'message': 'Reply sent successfully'})

# =========================================================
# QUERIES
# =========================================================

@app.route('/api/queries', methods=['POST'])
@jwt_required()
def create_query():
    current_user_id = get_jwt_identity()
    data = request.json
    message = data.get('message')
    receiver_role = data.get('receiver_role', 'admin')
    receiver_id = data.get('receiver_id', 'ADMIN-GLOBAL')
    
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("INSERT INTO queries (user_id, message, receiver_role, receiver_id) VALUES (?, ?, ?, ?)", 
               (current_user_id, message, receiver_role, receiver_id))
    query_id = cur.lastrowid
    
    # Notification logic
    student = cur.execute('SELECT name FROM users WHERE user_id = ?', (current_user_id,)).fetchone()
    student_name = student['name'] if student else current_user_id
    # Updated message format for student inquiry
    notif_msg = f"{student_name}: {message}:"
    date_str = datetime.now().strftime('%Y-%m-%d')

    if receiver_role == 'teacher':
        cur.execute("INSERT INTO notifications (user_id, message, type, date, query_id) VALUES (?, ?, ?, ?, ?)",
                    (receiver_id, notif_msg, 'query', date_str, query_id))
    elif receiver_role == 'admin':
        admins = cur.execute("SELECT user_id FROM users WHERE role = 'admin'").fetchall()
        for admin in admins:
            cur.execute("INSERT INTO notifications (user_id, message, type, date, query_id) VALUES (?, ?, ?, ?, ?)",
                        (admin['user_id'], notif_msg, 'query', date_str, query_id))
    
    conn.commit()
    conn.close()
    return jsonify({'message': f'Query submitted to {receiver_role}', 'id': query_id}), 201

@app.route('/api/queries/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_query(id):
    current_user_id = get_jwt_identity()
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Check if user owns the query or is admin
    query = cur.execute('SELECT user_id, message FROM queries WHERE id = ?', (id,)).fetchone()
    if not query:
        conn.close()
        return jsonify({'error': 'Query not found'}), 404
        
    is_owner = query['user_id'] == current_user_id
    is_admin_user = is_admin(current_user_id)
    
    if not (is_owner or is_admin_user):
        conn.close()
        return jsonify({'error': 'Unauthorized'}), 403
        
    msg_to_match = query['message']
    cur.execute('DELETE FROM queries WHERE id = ?', (id,))
    
    # Delete related notifications by ID OR by message content fallback
    cur.execute("DELETE FROM notifications WHERE query_id = ? OR (type='query' AND message LIKE ?)", 
               (id, f"%{msg_to_match}%"))
    
    conn.commit()
    conn.close()
    return jsonify({'message': 'Query and related notifications deleted'})

@app.route('/api/queries/read/<int:query_id>', methods=['POST'])
@jwt_required()
def mark_query_notifications_read(query_id):
    current_user_id = get_jwt_identity()
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND query_id = ?', (current_user_id, query_id))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Notifications marked as read'})

@app.route('/api/notifications/clear-queries', methods=['POST'])
@jwt_required()
def clear_all_query_notifications():
    current_user_id = get_jwt_identity()
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("UPDATE notifications SET is_read = 1 WHERE user_id = ? AND type = 'query'", (current_user_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'All query notifications marked as read'})

@app.route('/api/queries', methods=['GET'])
@jwt_required()
def get_user_queries():
    current_user_id = get_jwt_identity()
    conn = get_db_connection()
    records = conn.execute("SELECT * FROM queries WHERE user_id = ? ORDER BY id DESC", (current_user_id,)).fetchall()
    conn.close()
    return jsonify([dict(r) for r in records])

@app.route('/api/teachers', methods=['GET'])
@jwt_required()
def get_all_teachers_public():
    conn = get_db_connection()
    teachers = conn.execute('SELECT user_id as id, name, department FROM users WHERE role = "teacher"').fetchall()
    conn.close()
    return jsonify([dict(t) for t in teachers])


# =========================================================
# SYSTEM BROADCAST (TEACHER/ADMIN)
# =========================================================

@app.route('/api/notifications/broadcast', methods=['POST'])
@jwt_required()
def broadcast_notification():
    current_user_id = get_jwt_identity()
    conn = get_db_connection()
    user = conn.execute('SELECT role, name FROM users WHERE user_id = ?', (current_user_id,)).fetchone()
    
    if not user or user['role'] == 'student':
        conn.close()
        return jsonify({'error': 'Unauthorized'}), 403
        
    data = request.json
    message = f"Announcement from {user['name']}: {data.get('message')}"
    type_ = data.get('type', 'info')
    date_str = datetime.now().strftime('%Y-%m-%d')
    
    all_users = conn.execute('SELECT user_id FROM users').fetchall()
    cur = conn.cursor()
    for u in all_users:
        cur.execute("INSERT INTO notifications (user_id, message, type, date) VALUES (?, ?, ?, ?)",
                    (u['user_id'], message, type_, date_str))
        
    conn.commit()
    conn.close()
    return jsonify({'message': 'Broadcast sent successfully'}), 201


# =========================================================
# ADMIN ENDPOINTS
# =========================================================

@app.route('/api/admin/users', methods=['GET'])
@jwt_required()
def get_all_users():
    if not is_admin(get_jwt_identity()):
        return jsonify({'error': 'Unauthorized'}), 403
    conn = get_db_connection()
    users = conn.execute('SELECT id, user_id, name, email, department, role FROM users').fetchall()
    conn.close()
    return jsonify([dict(u) for u in users])

@app.route('/api/admin/users', methods=['POST'])
@jwt_required()
def create_user_admin():
    if not is_admin(get_jwt_identity()):
        return jsonify({'error': 'Unauthorized'}), 403
        
    data = request.json
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role')
    department = data.get('department', '')

    if not all([name, email, password, role]):
        return jsonify({'error': 'Missing required fields'}), 400

    hashed_password = generate_password_hash(password)
    conn = get_db_connection()
    cur = conn.cursor()
    
    while True:
        user_id = generate_user_id(role)
        existing = cur.execute('SELECT id FROM users WHERE user_id = ?', (user_id,)).fetchone()
        if not existing:
            break
            
    try:
        cur.execute("INSERT INTO users (user_id, name, email, department, password, role) VALUES (?, ?, ?, ?, ?, ?)",
                    (user_id, name, email, department, hashed_password, role))
        assign_default_subjects(cur, user_id, name, department, role)
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'error': 'Email already exists'}), 400

    conn.close()
    return jsonify({'message': 'User created', 'user_id': user_id}), 201

@app.route('/api/admin/users/<string:uid>', methods=['PUT', 'DELETE'])
@jwt_required()
def manage_user(uid):
    if not is_admin(get_jwt_identity()):
        return jsonify({'error': 'Unauthorized'}), 403
    conn = get_db_connection()
    cur = conn.cursor()
    if request.method == 'DELETE':
        print(f"DEBUG: Attempting to delete user with UID {uid}")
        
        # Check if user exists
        existing = conn.execute('SELECT id FROM users WHERE user_id = ?', (uid,)).fetchone()
        if not existing:
            print(f"DEBUG: User with UID {uid} not found in database")
            conn.close()
            return jsonify({'error': 'User not found'}), 404
            
        # Manual cascade cleanup for all referencing tables
        cur.execute('DELETE FROM attendance WHERE user_id = ?', (uid,))
        cur.execute('DELETE FROM timetable WHERE user_id = ?', (uid,))
        cur.execute('DELETE FROM notifications WHERE user_id = ?', (uid,))
        cur.execute('DELETE FROM tasks WHERE user_id = ?', (uid,))
        cur.execute('DELETE FROM user_subjects WHERE user_id = ?', (uid,))
        cur.execute('DELETE FROM queries WHERE user_id = ?', (uid,))
        cur.execute('DELETE FROM chat_history WHERE user_id = ?', (uid,))
        cur.execute('DELETE FROM quiz_results WHERE user_id = ?', (uid,))
        cur.execute('DELETE FROM quizzes WHERE teacher_id = ?', (uid,))
        
        # Cleanup Document Vault (Database and physical files)
        docs = conn.execute('SELECT filename FROM user_documents WHERE user_id = ?', (uid,)).fetchall()
        for doc in docs:
            file_path = os.path.join(UPLOAD_FOLDER, doc['filename'])
            if os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except Exception as e:
                    print(f"DEBUG: Failed to delete user file {file_path}: {e}")
        cur.execute('DELETE FROM user_documents WHERE user_id = ?', (uid,))
        
        # Finally delete from users
        cur.execute('DELETE FROM users WHERE user_id = ?', (uid,))
        print(f"DEBUG: All related records for {uid} deleted successfully.")
        
        conn.commit()
        conn.close()
        return jsonify({'message': 'User and all related records deleted successfully'}), 200
    if request.method == 'PUT':
        data = request.json
        cur.execute('''
            UPDATE users SET name = ?, email = ?, department = ?, role = ?
            WHERE user_id = ?
        ''', (data.get('name'), data.get('email'), data.get('department'), data.get('role'), uid))
        conn.commit()
        conn.close()
        return jsonify({'message': 'User updated'}), 200

# Admin Timetable
@app.route('/api/admin/timetable', methods=['POST'])
@jwt_required()
def add_timetable_entry():
    if not is_admin(get_jwt_identity()): return jsonify({'error': 'Unauthorized'}), 403 
    data = request.json
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('''INSERT INTO timetable (user_id, subject, day, start_time, end_time, teacher, room) 
                   VALUES (?, ?, ?, ?, ?, ?, ?)''', 
                (data.get('user_id'), data.get('subject'), data.get('day'), data.get('start_time'), data.get('end_time'), data.get('teacher'), data.get('room')))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Timetable entry added'}), 201

@app.route('/api/admin/timetable/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_timetable_entry(id):
    if not is_admin(get_jwt_identity()): return jsonify({'error': 'Unauthorized'}), 403
    conn = get_db_connection()
    conn.execute('DELETE FROM timetable WHERE id = ?', (id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Timetable entry deleted'}), 200

@app.route('/api/admin/timetable', methods=['GET'])
@jwt_required()
def get_all_timetable_entries():
    if not is_admin(get_jwt_identity()): return jsonify({'error': 'Unauthorized'}), 403
    conn = get_db_connection()
    records = conn.execute('SELECT * FROM timetable').fetchall()
    conn.close()
    return jsonify([dict(r) for r in records])

# Admin Queries
@app.route('/api/admin/queries', methods=['GET'])
@jwt_required()
def admin_get_queries():
    if not is_admin(get_jwt_identity()): return jsonify({'error': 'Unauthorized'}), 403
    conn = get_db_connection()
    # Fetch queries with user details
    records = conn.execute('''
        SELECT q.*, u.name, u.role FROM queries q 
        JOIN users u ON q.user_id = u.user_id 
        ORDER BY q.id DESC
    ''').fetchall()
    conn.close()
    return jsonify([dict(r) for r in records])


# Admin Subjects Overrides
@app.route('/api/admin/subjects', methods=['POST'])
@jwt_required()
def admin_add_subject():
    if not is_admin(get_jwt_identity()): return jsonify({'error': 'Unauthorized'}), 403
    data = request.json
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("INSERT INTO user_subjects (user_id, subject) VALUES (?, ?)", (data.get('user_id'), data.get('subject')))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Subject added'}), 201

@app.route('/api/admin/subjects/<int:id>', methods=['DELETE'])
@jwt_required()
def admin_remove_subject(id):
    if not is_admin(get_jwt_identity()): return jsonify({'error': 'Unauthorized'}), 403
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM user_subjects WHERE id = ?", (id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Subject removed'}), 200

@app.route('/api/admin/subjects', methods=['GET'])
@jwt_required()
def admin_get_all_subjects():
    if not is_admin(get_jwt_identity()): return jsonify({'error': 'Unauthorized'}), 403
    conn = get_db_connection()
    records = conn.execute('SELECT * FROM user_subjects').fetchall()
    conn.close()
    return jsonify([dict(r) for r in records])


import urllib.request
import urllib.error
import json
import re

# --- Anti-Spam In-Memory Dictionaries ---
from collections import defaultdict
import time
chat_rate_limits = defaultdict(list)  # Tracks timestamps of messages per IP
chat_blocks = {}                      # Tracks expiration time of 20-min blocks per IP

@app.route('/api/chat', methods=['POST'])
def chat_proxy():
    client_ip = request.remote_addr
    current_time = time.time()

    if client_ip in chat_blocks:
        if current_time < chat_blocks[client_ip]:
            remaining_mins = max(1, int((chat_blocks[client_ip] - current_time) / 60))
            safe_msg = f"🚫 Anti-Spam Security: You are sending messages too quickly! Please wait {remaining_mins} minutes before chatting again."
            return jsonify({"choices": [{"message": {"content": safe_msg}}]}), 200
        else:
            del chat_blocks[client_ip]
            chat_rate_limits[client_ip] = []

    recent_requests = [t for t in chat_rate_limits[client_ip] if current_time - t < 50]
    if len(recent_requests) >= 5:
        chat_blocks[client_ip] = current_time + 1200
        safe_msg = "🚦 System Protected: You exceeded the limit of 5 messages per 50 seconds. Please wait 20 minutes before trying again."
        return jsonify({"choices": [{"message": {"content": safe_msg}}]}), 200

    recent_requests.append(current_time)
    chat_rate_limits[client_ip] = recent_requests

    data = request.json or {}
    messages = data.get("messages", [])

    if not os.getenv("GEMINI_API_KEY"):
        return jsonify({"choices": [{"message": {"content": "AI service is offline. Please add GEMINI_API_KEY to backend/.env and restart the server."}}]}), 200

    system_context = ""
    for msg in messages:
        if msg.get('role') == 'system':
            system_context = msg.get('content', '')
            break

    messages = [m for m in messages if m.get('role') != 'system']
    final_prompt = ""
    if messages and messages[-1].get('role') == 'user':
        final_prompt = messages[-1].get('content', '')
        if system_context:
            final_prompt = f"{system_context}\n\nUser Question: {final_prompt}"
    else:
        final_prompt = system_context or "Answer the user's questions clearly and concisely."

    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(
            final_prompt,
            generation_config=genai.types.GenerationConfig(max_output_tokens=200)
        )
        output_text = response.text.strip()
        return jsonify({"choices": [{"message": {"content": output_text}}]}), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        error_str = str(e)
        if "429" in error_str:
            safe_msg = "🚦 Rate limit reached. Please wait a few moments and ask again."
            return jsonify({"choices": [{"message": {"content": safe_msg}}]}), 200
        if "400" in error_str:
            safe_msg = "Oops! The AI key appears invalid or the request was rejected. Check GEMINI_API_KEY in backend/.env."
            return jsonify({"choices": [{"message": {"content": safe_msg}}]}), 200
        return jsonify({"choices": [{"message": {"content": "Sorry, I couldn't connect to the AI service right now. Please check GEMINI_API_KEY or try again later."}}]}), 200

@app.route('/api/gn-chat', methods=['POST'])
def gn_chat_proxy():
    client_ip = request.remote_addr
    current_time = time.time()
    
    if client_ip in chat_blocks:
        if current_time < chat_blocks[client_ip]:
            remaining_mins = max(1, int((chat_blocks[client_ip] - current_time) / 60))
            return jsonify({"choices": [{"message": {"content": f"🚫 Anti-Spam Security: Please wait {remaining_mins} minutes."}}]}), 200
        else:
            del chat_blocks[client_ip]
            chat_rate_limits[client_ip] = []
            
    recent_requests = [t for t in chat_rate_limits[client_ip] if current_time - t < 50]
    if len(recent_requests) >= 5:
        chat_blocks[client_ip] = current_time + 1200 
        return jsonify({"choices": [{"message": {"content": "🚦 Limit reached. Paused for 20 minutes."}}]}), 200
        
    recent_requests.append(current_time)
    chat_rate_limits[client_ip] = recent_requests

    data = request.json
    messages = data.get("messages", [])
    
    platform_info = ""
    try:
        txt_path = os.path.join(os.path.dirname(__file__), '..', 'cleaned_knowledge.txt')
        with open(txt_path, 'r', encoding='utf-8', errors='ignore') as f:
            platform_info = f.read()
            platform_info = platform_info[:80000]
    except Exception:
        platform_info = "Information about the Campus Companion platform and campus management features."

    messages = [m for m in messages if m['role'] != 'system']
    
    if messages and messages[-1]['role'] == 'user':
        instructions = "You are the official AI Assistant for Campus Companion. Answer any question clearly and helpfully, including general knowledge and campus-specific requests. You may provide guidance on attendance, individual document vault entries, quiz result details, leaderboard information, and student or teacher workflows. Do not limit your responses to only platform mechanics."
        messages[-1]['content'] = f"Platform Info:\n{platform_info}\n\nInstructions: {instructions}\n\nUser Question: {messages[-1]['content']}"
    
    try:
        gemini_key = os.getenv("GEMINI_LANDING_API_KEY")
        if not gemini_key:
            return jsonify({"choices": [{"message": {"content": "Please provide a GEMINI_LANDING_API_KEY in the .env file."}}]}), 200
            
        prompt = "\n".join([m['content'] for m in messages])
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={gemini_key}"
        import json, urllib.request
        payload = json.dumps({"contents": [{"parts": [{"text": prompt}]}]}).encode('utf-8')
        req = urllib.request.Request(url, data=payload, headers={'Content-Type': 'application/json'})
        
        with urllib.request.urlopen(req, timeout=10) as response:
            res = json.loads(response.read().decode())
            output_text = res['candidates'][0]['content']['parts'][0]['text']
            return jsonify({"choices": [{"message": {"content": output_text}}]}), 200
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"choices": [{"message": {"content": f"An error occurred: {str(e)}"}}]}), 200

import PyPDF2
import io

@app.route('/api/teacher/quizzes/generate', methods=['POST'])
@jwt_required()
def generate_quiz():
    current_user = get_jwt_identity()
    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE user_id = ?', (current_user,)).fetchone()
    
    if not user or user['role'] != 'teacher':
        conn.close()
        return jsonify({'error': 'Unauthorized'}), 401
    
    if 'file' not in request.files:
        conn.close()
        return jsonify({'error': 'No PDF file uploaded'}), 400
        
    file = request.files['file']
    topic = request.form.get('topic', 'General Quiz')
    timer_seconds = int(request.form.get('timer', 30))
    
    try:
        # Extract text from PDF
        pdf_reader = PyPDF2.PdfReader(file)
        text = ""
        # Strictly limit to 15 pages max to protect Token Quotas
        num_pages = min(len(pdf_reader.pages), 15)
        for i in range(num_pages):
            page_text = pdf_reader.pages[i].extract_text()
            if page_text:
                text += page_text + "\n"
            
        # Truncate text to ~15,000 words maximum for API limits
        text = text[:80000] 
        
        gemini_key = os.getenv("GEMINI_API_KEY")
        if not gemini_key:
            return jsonify({'error': 'GEMINI_API_KEY missing from .env'}), 500
            
        import urllib.request
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={gemini_key}"
        
        prompt = f"""
You are an expert AI professor. Create a highly accurate 10-question multiple-choice quiz based ONLY on the following text.
You MUST output ONLY a valid JSON array of exactly 10 objects. Do not use markdown formatting like ```json.
Each object must have exactly these keys:
"question" (string)
"a" (string)
"b" (string)
"c" (string)
"d" (string)
"correct" (string, strictly "A", "B", "C", or "D")

Text:
{text}
"""
        payload = json.dumps({"contents": [{"parts": [{"text": prompt}]}]}).encode('utf-8')
        req = urllib.request.Request(url, data=payload, headers={'Content-Type': 'application/json'})
        
        with urllib.request.urlopen(req, timeout=30) as response:
            res = json.loads(response.read().decode())
            output_text = res['candidates'][0]['content']['parts'][0]['text']
            
            # Dynamically clean potential markdown wrapping out of the LLM payload
            output_text = output_text.strip()
            if output_text.startswith("```json"):
                output_text = output_text[7:]
            if output_text.endswith("```"):
                output_text = output_text[:-3]
            output_text = output_text.strip()
            
            questions = json.loads(output_text)
            
            # Database Insertion
            cursor = conn.cursor()
            cursor.execute('INSERT INTO quizzes (teacher_id, topic_name, timer_seconds) VALUES (?, ?, ?)', (current_user, topic, timer_seconds))
            quiz_id = cursor.lastrowid
            
            for q in questions:
                cursor.execute('''
                INSERT INTO quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (quiz_id, q['question'], q['a'], q['b'], q['c'], q['d'], q['correct']))
                
            conn.commit()
            conn.close()
            return jsonify({'message': 'Quiz generated successfully!', 'quiz_id': quiz_id}), 201

    except Exception as e:
        conn.close()
        import traceback
        traceback.print_exc()
        return jsonify({'error': f"Failed to generate: {str(e)}"}), 500

@app.route('/api/quizzes', methods=['GET'])
@jwt_required()
def get_quizzes():
    conn = get_db_connection()
    quizzes = conn.execute('''
        SELECT q.id, q.topic_name, q.created_at, q.teacher_id, q.timer_seconds, u.name as teacher_name 
        FROM quizzes q
        JOIN users u ON q.teacher_id = u.user_id
        ORDER BY q.created_at DESC
    ''').fetchall()
    
    results = [dict(r) for r in quizzes]
    conn.close()
    return jsonify(results), 200

@app.route('/api/quizzes/<int:quiz_id>', methods=['DELETE'])
@jwt_required()
def delete_quiz(quiz_id):
    current_user = get_jwt_identity()
    conn = get_db_connection()
    quiz = conn.execute('SELECT teacher_id FROM quizzes WHERE id = ?', (quiz_id,)).fetchone()
    
    if not quiz:
        conn.close()
        return jsonify({'error': 'Quiz not found'}), 404
        
    # Auth Check: Admin or the teacher who created it
    if not is_admin(current_user) and quiz['teacher_id'] != current_user:
        conn.close()
        return jsonify({'error': 'Unauthorized'}), 403
        
    cur = conn.cursor()
    cur.execute('DELETE FROM quiz_results WHERE quiz_id = ?', (quiz_id,))
    cur.execute('DELETE FROM quiz_questions WHERE quiz_id = ?', (quiz_id,))
    cur.execute('DELETE FROM quizzes WHERE id = ?', (quiz_id,))
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Quiz deleted successfully'}), 200

@app.route('/api/quizzes/<int:quiz_id>', methods=['GET'])
@jwt_required()
def get_quiz_details(quiz_id):
    conn = get_db_connection()
    quiz = conn.execute('SELECT q.*, u.name as teacher_name FROM quizzes q JOIN users u ON q.teacher_id = u.user_id WHERE q.id = ?', (quiz_id,)).fetchone()
    if not quiz:
        conn.close()
        return jsonify({'error': 'Quiz not found'}), 404
        
    questions = conn.execute('SELECT id, question_text, option_a, option_b, option_c, option_d FROM quiz_questions WHERE quiz_id = ?', (quiz_id,)).fetchall()
    
    conn.close()
    return jsonify({
        'quiz': dict(quiz),
        'questions': [dict(q) for q in questions]
    }), 200

@app.route('/api/quizzes/<int:quiz_id>/submit', methods=['POST'])
@jwt_required()
def submit_quiz(quiz_id):
    current_user = get_jwt_identity()
    answers = request.json.get('answers', {}) # format: { question_id: "A", ... }
    
    conn = get_db_connection()
    questions = conn.execute('SELECT id, correct_option FROM quiz_questions WHERE quiz_id = ?', (quiz_id,)).fetchall()
    
    score = 0
    total = len(questions)
    for q in questions:
        q_id_str = str(q['id'])
        if q_id_str in answers and answers[q_id_str].upper() == q['correct_option'].upper():
            score += 1
            
    # Advanced Streak Processing Algorithm
    last_result = conn.execute('SELECT streak_count FROM quiz_results WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', (current_user,)).fetchone()
    current_streak = last_result['streak_count'] if last_result else 0
    
    # Passing score logic (>= 70%)
    if total > 0 and (score / total) >= 0.7:
        new_streak = current_streak + 1
    else:
        new_streak = 0
        
    conn.execute('''
        INSERT INTO quiz_results (user_id, quiz_id, score, streak_count) 
        VALUES (?, ?, ?, ?)
    ''', (current_user, quiz_id, score, new_streak))
    
    conn.commit()
    conn.close()
    
    return jsonify({
        'score': score,
        'total': total,
        'new_streak': new_streak,
        'message': f"Amazing! Streak bumping to {new_streak} 🔥" if new_streak > 0 else "Streak lost. Keep training to build it back!"
    }), 200

@app.route('/api/leaderboard', methods=['GET'])
@jwt_required()
def get_leaderboard():
    conn = get_db_connection()
    # High-performance ranking query mathematically grading the leaderboard
    leaders = conn.execute('''
        SELECT u.name, u.department, 
               MAX(qr.streak_count) as max_streak, 
               SUM(qr.score) as total_score,
               COUNT(qr.id) as quizzes_taken
        FROM users u
        JOIN quiz_results qr ON u.user_id = qr.user_id
        GROUP BY u.user_id
        ORDER BY max_streak DESC, total_score DESC
        LIMIT 10
    ''').fetchall()
    
    conn.close()
    return jsonify([dict(l) for l in leaders]), 200


# =========================================================
# DOCUMENT VAULT
# =========================================================

@app.route('/api/documents/upload', methods=['POST'])
@jwt_required()
def upload_document():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file and file.filename.lower().endswith('.pdf'):
        current_user_id = get_jwt_identity()
        original_name = secure_filename(file.filename)
        # Generate a unique filename to prevent collisions and for security
        unique_filename = f"{uuid.uuid4()}_{original_name}"
        file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
        file.save(file_path)
        
        file_size = os.path.getsize(file_path)
        
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO user_documents (user_id, filename, original_name, file_size) VALUES (?, ?, ?, ?)",
            (current_user_id, unique_filename, original_name, file_size)
        )
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'File uploaded successfully', 'filename': original_name}), 201
    
    return jsonify({'error': 'Only PDF files are allowed'}), 400

@app.route('/api/documents', methods=['GET'])
@jwt_required()
def get_documents():
    current_user_id = get_jwt_identity()
    conn = get_db_connection()
    docs = conn.execute(
        'SELECT id, original_name, file_size, upload_date FROM user_documents WHERE user_id = ? ORDER BY upload_date DESC',
        (current_user_id,)
    ).fetchall()
    conn.close()
    return jsonify([dict(d) for d in docs])

@app.route('/api/documents/<int:doc_id>', methods=['GET'])
@jwt_required()
def download_document(doc_id):
    current_user_id = get_jwt_identity()
    conn = get_db_connection()
    doc = conn.execute(
        'SELECT filename, original_name FROM user_documents WHERE id = ? AND user_id = ?',
        (doc_id, current_user_id)
    ).fetchone()
    conn.close()
    
    if not doc:
        return jsonify({'error': 'Document not found or unauthorized'}), 404
    
    return send_from_directory(UPLOAD_FOLDER, doc['filename'], as_attachment=False)

@app.route('/api/documents/<int:doc_id>', methods=['DELETE'])
@jwt_required()
def delete_document(doc_id):
    current_user_id = get_jwt_identity()
    conn = get_db_connection()
    doc = conn.execute(
        'SELECT filename FROM user_documents WHERE id = ? AND user_id = ?',
        (doc_id, current_user_id)
    ).fetchone()
    
    if not doc:
        conn.close()
        return jsonify({'error': 'Document not found or unauthorized'}), 404
    
    # Delete from filesystem
    file_path = os.path.join(UPLOAD_FOLDER, doc['filename'])
    if os.path.exists(file_path):
        os.remove(file_path)
        
    # Delete from database
    conn.execute('DELETE FROM user_documents WHERE id = ?', (doc_id,))
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Document deleted successfully'})



@app.route('/api/gn-chat', methods=['POST'])
def gn_chat():
    """Public chatbot endpoint for the landing page."""
    try:
        if not os.environ.get('GEMINI_API_KEY'):
            return jsonify({'choices': [{'message': {'content': 'AI service unavailable.'}}]})
        
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        data = request.json
        messages = data.get('messages', [])
        
        platform_info = ""
        try:
            txt_path = os.path.join(os.path.dirname(__file__), '..', 'cleaned_knowledge.txt')
            with open(txt_path, 'r', encoding='utf-8', errors='ignore') as f:
                platform_info = f.read()
                platform_info = platform_info[:80000]
        except Exception:
            platform_info = "Information about the Campus Companion platform and campus management features."

        messages = [m for m in messages if m['role'] != 'system']
        
        if messages and messages[-1]['role'] == 'user':
            instructions = "You are the official AI Assistant for Campus Companion. Answer any question clearly and helpfully, including general knowledge and campus-specific requests. Provide guidance on attendance, individual document vault entries, quiz result details, leaderboard information, and student or teacher workflows."
            messages[-1]['content'] = f"Platform Info:\n{platform_info}\n\nInstructions: {instructions}\n\nUser Question: {messages[-1]['content']}"
            
        prompt = "\n".join([m['content'] for m in messages])
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={os.getenv('GEMINI_LANDING_API_KEY')}"
        import json, urllib.request
        payload = json.dumps({"contents": [{"parts": [{"text": prompt}]}]}).encode('utf-8')
        req = urllib.request.Request(url, data=payload, headers={'Content-Type': 'application/json'})
        
        with urllib.request.urlopen(req, timeout=10) as response:
            res = json.loads(response.read().decode())
            output_text = res['candidates'][0]['content']['parts'][0]['text']
            return jsonify({"choices": [{"message": {"content": output_text}}]}), 200
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"choices": [{"message": {"content": f"An error occurred: {str(e)}"}}]}), 200
    except Exception as e:
        print(f"DEBUG: GN Chat error: {e}")
        return jsonify({'choices': [{'message': {'content': 'Request timed out or failed. Please ask about GN Group or Campus HuB features.'}}]})


# Ensure database setup runs on import so Gunicorn/Render can initialize the DB correctly.
init_db_if_needed()
migrate_db()
migrate_documents()

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)
