import sqlite3
import os

dbs = ['voyago.db', 'uber.db', 'sql_app.db']

def migrate_db(db_name):
    if not os.path.exists(db_name):
        print(f"Skipping {db_name} (not found)")
        return

    print(f"Migrating {db_name}...")
    try:
        conn = sqlite3.connect(db_name)
        cursor = conn.cursor()
        
        # Check if users table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
        if not cursor.fetchone():
            print(f"  No 'users' table in {db_name}")
            conn.close()
            return

        # Try adding columns
        columns = [
            ("otp_code", "VARCHAR"),
            ("otp_expiry", "DATETIME")
        ]
        
        for col, dtype in columns:
            try:
                cursor.execute(f"ALTER TABLE users ADD COLUMN {col} {dtype}")
                print(f"  Added {col}")
            except sqlite3.OperationalError as e:
                # SQLite error for duplicate column usually contains "duplicate column name"
                if "duplicate column name" in str(e).lower():
                    print(f"  Column {col} already exists")
                else:
                    print(f"  Error adding {col}: {e}")
            
        conn.commit()
        conn.close()
        print(f"Finished {db_name}")
    except Exception as e:
        print(f"Failed to migrate {db_name}: {e}")

if __name__ == "__main__":
    for db in dbs:
        migrate_db(db)
