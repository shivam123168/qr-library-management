"""
Create Test Issue Book Data
Run this to create sample issued books for testing
"""

from app.core.database import SessionLocal
from app.models.issue_book import IssueBook
from app.models.student import Student
from app.models.book import Book
from app.models.employee import Employee
from datetime import datetime, timedelta

db = SessionLocal()

print("=" * 60)
print("CREATING TEST ISSUE BOOK DATA")
print("=" * 60)

# Get existing students, books, and employees
students = db.query(Student).limit(3).all()
books = db.query(Book).filter(Book.Status == "Available").limit(5).all()
employees = db.query(Employee).limit(1).all()

if not students:
    print("❌ No students found! Please create students first.")
    exit(1)

if not books:
    print("❌ No available books found! Please create books first.")
    exit(1)

if not employees:
    print("❌ No employees found! Please create employees first.")
    exit(1)

print(f"\n📊 Found {len(students)} students, {len(books)} books, {len(employees)} employees")

# Create test issue records
test_records = []

# Currently issued book (on time)
test_records.append({
    "Student_Prn_id": students[0].Prn_id,
    "Books_Accession_number": books[0].Accession_number,
    "Employee_Emp_Id": employees[0].Emp_Id,
    "issue_time": datetime.now() - timedelta(days=5),
    "due_date": datetime.now() + timedelta(days=9),  # Due in 9 days
    "status": "Issued",
    "returned_date": None,
    "description": "Currently issued - On time"
})

# Overdue book (5 days late)
if len(books) > 1:
    test_records.append({
        "Student_Prn_id": students[0].Prn_id,
        "Books_Accession_number": books[1].Accession_number,
        "Employee_Emp_Id": employees[0].Emp_Id,
        "issue_time": datetime.now() - timedelta(days=20),
        "due_date": datetime.now() - timedelta(days=5),  # Was due 5 days ago
        "status": "Overdue",
        "returned_date": None,
        "description": "Overdue - 5 days late"
    })

# Returned book (returned on time)
if len(books) > 2 and len(students) > 1:
    test_records.append({
        "Student_Prn_id": students[1].Prn_id,
        "Books_Accession_number": books[2].Accession_number,
        "Employee_Emp_Id": employees[0].Emp_Id,
        "issue_time": datetime.now() - timedelta(days=30),
        "due_date": datetime.now() - timedelta(days=16),
        "status": "Returned",
        "returned_date": datetime.now() - timedelta(days=18),  # Returned 2 days early
        "description": "Returned - On time"
    })

# Due today
if len(books) > 3 and len(students) > 1:
    test_records.append({
        "Student_Prn_id": students[1].Prn_id,
        "Books_Accession_number": books[3].Accession_number,
        "Employee_Emp_Id": employees[0].Emp_Id,
        "issue_time": datetime.now() - timedelta(days=14),
        "due_date": datetime.now(),  # Due today
        "status": "Overdue",
        "returned_date": None,
        "description": "Due today"
    })

# Overdue book for different student (10 days late)
if len(books) > 4 and len(students) > 2:
    test_records.append({
        "Student_Prn_id": students[2].Prn_id,
        "Books_Accession_number": books[4].Accession_number,
        "Employee_Emp_Id": employees[0].Emp_Id,
        "issue_time": datetime.now() - timedelta(days=25),
        "due_date": datetime.now() - timedelta(days=10),  # Was due 10 days ago
        "status": "Overdue",
        "returned_date": None,
        "description": "Overdue - 10 days late"
    })

print(f"\n📝 Creating {len(test_records)} test issue records...")

created_count = 0
for record_data in test_records:
    description = record_data.pop("description")
    print(record_data)

    # Check if already exists
    existing = db.query(IssueBook).filter(
        IssueBook.Student_Prn_id == record_data["Student_Prn_id"],
        IssueBook.Books_Accession_number == record_data["Books_Accession_number"],
        IssueBook.status == record_data["status"]
    ).first()
    
    if existing:
        print(f"   ⚠️  {description} - Already exists")
        continue
    
    # Create issue record
    issue_record = IssueBook(**record_data)
    db.add(issue_record)
    
    # Update book status
    book = db.query(Book).filter(
        Book.Accession_number == record_data["Books_Accession_number"]
    ).first()
    
    if record_data["status"] == "Issued":
        book.Status = "Issued"
    elif record_data["status"] == "Returned":
        book.Status = "Available"
    
    print(f"   ✅ {description}")
    created_count += 1

db.commit()

print(f"\n" + "=" * 60)
print(f"✅ Created {created_count} test issue records!")
print("=" * 60)

# Show summary
issued_count = db.query(IssueBook).filter(IssueBook.status == "Issued").count()
returned_count = db.query(IssueBook).filter(IssueBook.status == "Returned").count()
overdue_count = db.query(IssueBook).filter(
    IssueBook.status == "Overdue",
    IssueBook.returned_date < datetime.now()
).count()

print(f"\n📊 Current Summary:")
print(f"   Currently Issued: {issued_count}")
print(f"   Returned: {returned_count}")
print(f"   Overdue: {overdue_count}")

db.close()