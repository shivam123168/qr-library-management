from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models import IssueBook, Penalty, PenaltyAmount


def check_and_update_penalties():
    db: Session = SessionLocal()

    try:
        print("⏰ Running hourly penalty check...")

        current_time = datetime.now()

        # Get per-day penalty amount (assuming only one row exists)
        penalty_amount_record = db.query(PenaltyAmount).first()

        if not penalty_amount_record:
            print("⚠ No penalty amount configured in database.")
            return

        penalty_per_day = float(penalty_amount_record.penalty_amount)

        # Get all issued or overdue books
        issued_books = db.query(IssueBook).filter(
            IssueBook.status.in_(["Issued", "Overdue"])
        ).all()

        for issue in issued_books:

            # Skip if already returned
            if issue.returned_date:
                continue

            # Check if overdue
            if issue.due_date <= current_time:

                issue.status = "Overdue"

                seconds_overdue = (current_time - issue.due_date).total_seconds()

                if seconds_overdue <= 0:
                       continue

                days_overdue = max(1, int(seconds_overdue // 86400) + 1)


                total_penalty = days_overdue * penalty_per_day

                # Check if penalty already exists
                existing_penalty = db.query(Penalty).filter(
                    Penalty.issue_book_id == issue.issue_book_id
                ).first()

                if existing_penalty:

                    # Skip if paid or excuse exists
                    if (
                        existing_penalty.Amount_status == "paid"
                        or existing_penalty.penalty_excuse_id is not None
                    ):
                        continue

                    # Update total amount
                    existing_penalty.total_amount = total_penalty
                    existing_penalty.Amount_status = "not paid"
                    existing_penalty.penalty_amount_id = penalty_amount_record.id

                else:
                    # Create new penalty record
                    new_penalty = Penalty(
                        Amount_status="not paid",
                        penalty_excuse_id=None,
                        issue_book_id=issue.issue_book_id,
                        penalty_amount_id=penalty_amount_record.id,
                        total_amount=total_penalty
                    )
                    db.add(new_penalty)
            print("Checking issue:", issue.issue_book_id)
            print("Due date:", issue.due_date)
            print("Current time:", current_time)
            # print("Days overdue:", days_overdue)


        db.commit()
        print("✅ Penalty check completed.")

    except Exception as e:
        print("❌ Error in penalty scheduler:", e)
        db.rollback()
    finally:
        db.close()


def start_scheduler():
    scheduler = BackgroundScheduler()
    scheduler.add_job(check_and_update_penalties, "interval", minutes=1)
    scheduler.start()
