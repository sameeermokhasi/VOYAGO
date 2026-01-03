
import sqlite3
import os

# Database path
DB_PATH = "uber.db"

def add_vacation_id_column():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # Check if column exists
        cursor.execute("PRAGMA table_info(rides)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if "vacation_id" in columns:
            print("Column 'vacation_id' already exists in 'rides' table.")
        else:
            print("Adding 'vacation_id' column to 'rides' table...")
            cursor.execute("ALTER TABLE rides ADD COLUMN vacation_id INTEGER REFERENCES vacations(id)")
            conn.commit()
            print("Column added successfully.")
            
    except Exception as e:
        print(f"Error updating database: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    add_vacation_id_column()
