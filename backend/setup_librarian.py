"""
Setup Librarian - Create Employee Post and Test Librarian
Run this once to setup librarian data
"""

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.employee_post import EmployeePost
from app.models.department import Department
from app.models.employee import Employee
from datetime import datetime

db = SessionLocal()

print("=" * 60)
print("LIBRARIAN SETUP")
print("=" * 60)

# Step 1: Create "Librarian" employee post
print("\n1. Creating 'Librarian' employee post...")
librarian_post = db.query(EmployeePost).filter(EmployeePost.post_name == "Librarian").first()

if not librarian_post:
    librarian_post = EmployeePost(
        # Employee_post_id=1,  # ID 1 for Librarian
        post_name="Librarian"
    )
    db.add(librarian_post)
    db.commit()
    db.refresh(librarian_post)
    print(f"   ✅ Created: Librarian (Post ID: {librarian_post.Employee_post_id})")
else:
    print(f"   ✅ Already exists: Librarian (Post ID: {librarian_post.Employee_post_id})")

# Step 2: Create "Library" department (optional)
print("\n2. Creating 'Library' department...")
library_dept = db.query(Department).filter(Department.department_name == "Library").first()

if not library_dept:
    library_dept = Department(
        department_name="Library"
    )
    db.add(library_dept)
    db.commit()
    db.refresh(library_dept)
    print(f"   ✅ Created: Library Department (Dept ID: {library_dept.Department_id})")
else:
    print(f"   ✅ Already exists: Library Department (Dept ID: {library_dept.Department_id})")

# Step 3: Create test librarian
print("\n3. Creating test librarian account...")
existing_librarian = db.query(Employee).filter(Employee.Emp_Id == 100).first()

if existing_librarian:
    print(f"   ⚠️  Librarian already exists (Emp ID: 100)")
    print(f"   Name: {existing_librarian.First_name} {existing_librarian.Last_name}")
    print(f"   Email: {existing_librarian.Gmail}")
else:
    test_librarian = Employee(
        Emp_Id=100,
        First_name="Sarah",
        Middle_name="K",
        Last_name="Johnson",
        DOB=datetime(1985, 6, 20).date(),
        Phone_no="5551234567",
        Gmail="librarian@library.com",
        Password=hash_password("librarian123"),
        employee_creation_time=datetime.now(),
        Employee_post_id=librarian_post.Employee_post_id,  # Librarian post
        Department_id=library_dept.Department_id  # Library department
    )
    
    db.add(test_librarian)
    db.commit()
    db.refresh(test_librarian)
    
    print(f"   ✅ Created test librarian:")
    print(f"   Employee ID: {test_librarian.Emp_Id}")
    print(f"   Name: {test_librarian.First_name} {test_librarian.Last_name}")
    print(f"   Email: {test_librarian.Gmail}")
    print(f"   Post: Librarian (ID: {test_librarian.Employee_post_id})")
    print(f"   Department: Library (ID: {test_librarian.Department_id})")

# Step 4: Create a regular employee for comparison
print("\n4. Creating test regular employee...")
existing_employee = db.query(Employee).filter(Employee.Emp_Id == 200).first()

# Create "Clerk" post
clerk_post = db.query(EmployeePost).filter(EmployeePost.post_name == "Clerk").first()
if not clerk_post:
    clerk_post = EmployeePost(
       
        post_name="Clerk"
    )
    db.add(clerk_post)
    db.commit()
    db.refresh(clerk_post)

if existing_employee:
    print(f"   ⚠️  Regular employee already exists (Emp ID: 200)")
else:
    regular_employee = Employee(
        Emp_Id=200,
        First_name="John",
        Middle_name="M",
        Last_name="Smith",
        DOB=datetime(1990, 3, 15).date(),
        Phone_no="5559876543",
        Gmail="employee@library.com",
        Password=hash_password("employee123"),
        employee_creation_time=datetime.now(),
        Employee_post_id=clerk_post.Employee_post_id,  # NOT a librarian
        Department_id=library_dept.Department_id
    )
    
    db.add(regular_employee)
    db.commit()
    db.refresh(regular_employee)
    
    print(f"   ✅ Created regular employee:")
    print(f"   Employee ID: {regular_employee.Emp_Id}")
    print(f"   Name: {regular_employee.First_name} {regular_employee.Last_name}")
    print(f"   Email: {regular_employee.Gmail}")
    print(f"   Post: Clerk (ID: {regular_employee.Employee_post_id})")

db.close()

print("\n" + "=" * 60)
print("✅ SETUP COMPLETE!")
print("=" * 60)
print("\nLogin Credentials:")
print("-" * 60)
print("LIBRARIAN LOGIN:")
print("  Employee ID: 100")
print("  Password: librarian123")
print("  Endpoint: POST /api/auth/login/librarian")
print()
print("REGULAR EMPLOYEE LOGIN:")
print("  Employee ID: 200")
print("  Password: employee123")
print("  Endpoint: POST /api/auth/login/employee")
print("-" * 60)