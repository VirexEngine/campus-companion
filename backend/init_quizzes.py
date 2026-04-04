import sqlite3

conn = sqlite3.connect('c:/Users/Administrator/Pictures/campus-companion-main/backend/database.db')
c = conn.cursor()

c.execute('''
CREATE TABLE IF NOT EXISTS quizzes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    teacher_id TEXT NOT NULL,
    topic_name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(teacher_id) REFERENCES users(user_id)
)
''')

c.execute('''
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
)
''')

c.execute('''
CREATE TABLE IF NOT EXISTS quiz_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    quiz_id INTEGER NOT NULL,
    score INTEGER NOT NULL,
    streak_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(user_id),
    FOREIGN KEY(quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
)
''')

conn.commit()
conn.close()
print("Success: Quiz tables structured into live database.")
