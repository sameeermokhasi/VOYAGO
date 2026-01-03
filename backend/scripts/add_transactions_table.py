import sqlite3
import os

DB_PATH = 'uber.db'

def add_table():
    print(f"Updating database at {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Create transactions table
    try:
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            amount FLOAT NOT NULL,
            type VARCHAR NOT NULL,
            description VARCHAR NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
        """)
        print("Created transactions table")
    except Exception as e:
        print(f"Error creating table: {e}")

    conn.commit()
    conn.close()
    print("Update complete")

if __name__ == "__main__":
    add_table()
