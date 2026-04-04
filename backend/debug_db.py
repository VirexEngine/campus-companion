import sqlite3
import json

def check_db():
    try:
        conn = sqlite3.connect('database.db')
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        
        # Check tables
        cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [r['name'] for r in cur.fetchall()]
        print(f"Tables: {tables}")
        
        if 'users' in tables:
            cur.execute("SELECT user_id, name, role FROM users")
            users = [dict(r) for r in cur.fetchall()]
            print(f"Users: {json.dumps(users, indent=2)}")
        else:
            print("Table 'users' NOT FOUND!")
            
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    check_db()
