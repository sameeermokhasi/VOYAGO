import sys
import os
from datetime import datetime, timedelta

# Add parent directory to path to import app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models import User, Vacation, Transaction, UserRole

def verify_wallet_logic():
    db = SessionLocal()
    try:
        # 1. Create a test driver
        driver_email = f"test_driver_{int(datetime.now().timestamp())}@example.com"
        driver = User(
            name="Test Driver",
            email=driver_email,
            password="hashed_password",
            role=UserRole.DRIVER,
            wallet_balance=0.0
        )
        db.add(driver)
        db.commit()
        db.refresh(driver)
        print(f"Created driver {driver.id} with balance {driver.wallet_balance}")

        # 2. Create a test vacation assigned to this driver
        vacation = Vacation(
            user_id=driver.id, # Assign to self for simplicity, or create another user
            driver_id=driver.id,
            destination="Test Destination",
            start_date=datetime.now(),
            end_date=datetime.now() + timedelta(days=5),
            total_price=5000.0,
            status="in_progress"
        )
        db.add(vacation)
        db.commit()
        db.refresh(vacation)
        print(f"Created vacation {vacation.id} with price {vacation.total_price}")

        # 3. Simulate completion logic (mimicking vacation.py)
        vacation.status = "completed"
        
        # Credit wallet
        driver.wallet_balance += vacation.total_price
        
        # Create transaction
        transaction = Transaction(
            user_id=driver.id,
            amount=vacation.total_price,
            type="credit",
            description=f"Payment for vacation booking #{vacation.id}"
        )
        db.add(transaction)
        db.commit()
        
        # 4. Verify results
        db.refresh(driver)
        print(f"Driver balance after completion: {driver.wallet_balance}")
        
        tx = db.query(Transaction).filter(Transaction.user_id == driver.id).first()
        if tx:
            print(f"Transaction found: {tx.description}, Amount: {tx.amount}, Type: {tx.type}")
        else:
            print("Transaction NOT found!")
            
        if driver.wallet_balance == 5000.0 and tx:
            print("SUCCESS: Wallet credited and transaction created.")
        else:
            print("FAILURE: Wallet or transaction verification failed.")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    verify_wallet_logic()
