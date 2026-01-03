import sqlite3

def inspect_schema():
    conn = sqlite3.connect('uber.db')
    cursor = conn.cursor()
    
    print("=== USERS SCHEMA ===")
    cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'")
    print(cursor.fetchone()[0])
    
    print("\n=== VACATIONS SCHEMA ===")
    cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='vacations'")
    print(cursor.fetchone()[0])
    
    conn.close()

if __name__ == "__main__":
    inspect_schema()
