import sqlite3
import os

DB_PATH = 'backend/uber.db'

def add_column():
    db_path = DB_PATH
    if not os.path.exists(db_path):
        if os.path.exists('uber.db'):
            db_path = 'uber.db'
        else:
            print("DB not found")
            return

    print(f"Updating database at {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Add driver_id to vacations
    try:
        cursor.execute("ALTER TABLE vacations ADD COLUMN driver_id INTEGER REFERENCES users(id)")
        print("Added driver_id to vacations")
    except Exception as e:
        print(f"driver_id error: {e}")

    conn.commit()
    conn.close()
    print("Update complete")

if __name__ == "__main__":
    add_column()
