import sqlite3

def verify_raw():
    try:
        conn = sqlite3.connect('uber.db')
        cursor = conn.cursor()
        
        print("Querying users...")
        cursor.execute("SELECT * FROM users LIMIT 1")
        print(cursor.fetchone())
        
        print("Querying vacations...")
        cursor.execute("SELECT * FROM vacations LIMIT 1")
        row = cursor.fetchone()
        print(row)
        
        if row:
            # Get column names
            cursor.execute("PRAGMA table_info(vacations)")
            columns = [info[1] for info in cursor.fetchall()]
            print(f"Vacation columns: {columns}")
            
        conn.close()
    except Exception as e:
        print(f"Raw DB error: {e}")

if __name__ == "__main__":
    verify_raw()
