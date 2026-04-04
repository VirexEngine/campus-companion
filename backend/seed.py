import sqlite3
from werkzeug.security import generate_password_hash

def init_db():
    conn = sqlite3.connect('database.db')
    with open('schema.sql') as f:
        conn.executescript(f.read())

    cur = conn.cursor()

    # Pre-populate admin
    cur.execute("INSERT INTO users (user_id, name, email, department, password, role, last_login) VALUES (?, ?, ?, ?, ?, ?, ?)",
                ('ADM-0001', 'Pratyush', 'admin@college.edu', 'Management', generate_password_hash('admin123'), 'admin', datetime.now()))
    
    # Pre-populate students (Inactive by default: last_login = NULL)
    students = [
        ('STU-1001', 'Arjun Sharma', 'student@college.edu', 'DS', generate_password_hash('student123')),
        ('STU-1002', 'Sneha Patel', 'sneha@college.edu', 'DS', generate_password_hash('student123')),
        ('STU-1003', 'Vikram Singh', 'vikram@college.edu', 'DS', generate_password_hash('student123')),
    ]
    
    for user_id, name, email, dept, pwd in students:
        cur.execute("INSERT INTO users (user_id, name, email, department, password, role, last_login) VALUES (?, ?, ?, ?, ?, ?, NULL)",
                    (user_id, name, email, dept, pwd, 'student', ))
    
    # Pre-populate teacher (Active)
    cur.execute("INSERT INTO users (user_id, name, email, department, password, role, last_login) VALUES (?, ?, ?, ?, ?, ?, ?)",
                ('TCH-2001', 'Dr. Priya Nair', 'teacher@college.edu', 'DS', generate_password_hash('teacher123'), 'teacher', datetime.now()))

    # Real Subjects for DS Department as requested
    subjects = ['Maths', 'BEE', 'EVS', 'PPS', 'Physics']
    
    # Add subjects for students
    for user_id, _, _, _, _ in students:
        for subj in subjects:
            cur.execute("INSERT INTO user_subjects (user_id, subject) VALUES (?, ?)", (user_id, subj))
    
    # Add subjects for teacher (Crucial for the attendance page dropdown)
    for subj in subjects:
        cur.execute("INSERT INTO user_subjects (user_id, subject) VALUES (?, ?)", ('TCH-2001', subj))

    # Add timetable for STU-1001
    DEFAULT_TIMETABLES = {
        'DS': [
            ('Maths', 'Monday', '09:00', '10:00', 'Dr. Sharma', 'CS-101'),
            ('BEE', 'Monday', '10:00', '11:00', 'Prof. Verma', 'EE-201'),
            ('EVS', 'Tuesday', '09:00', '10:00', 'Ms. Iyer', 'L-301'),
            ('PPS', 'Tuesday', '10:00', '11:00', 'Dr. Gupta', 'CS-102'),
            ('Physics', 'Wednesday', '09:00', '10:00', 'Dr. Reddy', 'PH-105'),
        ]
    }

    for entry in DEFAULT_TIMETABLES['DS']:
        cur.execute("INSERT INTO timetable (user_id, subject, day, start_time, end_time, teacher, room) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    ('STU-1001', *entry))

    # Add timetable for TCH-2001
    for entry in DEFAULT_TIMETABLES['DS']:
        cur.execute("INSERT INTO timetable (user_id, subject, day, start_time, end_time, teacher, room) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    ('TCH-2001', entry[0], entry[1], entry[2], entry[3], 'Dr. Priya Nair', entry[5]))

    conn.commit()
    conn.close()
    print("Database seeded with 'Real Student' and 'Correct Subjects' logic!")

from datetime import datetime
if __name__ == '__main__':
    init_db()
