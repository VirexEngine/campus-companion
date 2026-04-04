import sqlite3
from werkzeug.security import check_password_hash, generate_password_hash
from datetime import datetime

def test_login(user_id, password):
    conn = sqlite3.connect('database.db')
    conn.row_factory = sqlite3.Row
    user = conn.execute('SELECT * FROM users WHERE user_id = ?', (user_id,)).fetchone()
    
    if not user:
        print(f"User {user_id} not found in DB.")
        return

    print(f"User found: {user['name']} (Role: {user['role']})")
    
    match = check_password_hash(user['password'], password)
    print(f"Password match: {match}")
    
    if match:
        try:
            conn.execute('UPDATE users SET last_login = ? WHERE user_id = ?', (datetime.now(), user_id))
            conn.commit()
            print("Last login updated successfully.")
        except Exception as e:
            print(f"Failed to update last login: {e}")
            
    conn.close()

if __name__ == '__main__':
    print("Testing Teacher Login:")
    test_login('TCH-2001', 'teacher123')
    print("\nTesting Student Login:")
    test_login('STU-1001', 'student123')
