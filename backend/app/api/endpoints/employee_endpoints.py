"""
Employee Endpoints - Complete CRUD Operations
"""
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from sqlalchemy import func
from app.core.database import get_db
from app.core.security import hash_password
from app.api.deps_with_librarian import get_current_librarian
from app.models.employee import Employee
from app.models.employee_post import EmployeePost
from app.models.department import Department
from app.schemas.employee_schemas import (
    EmployeeCreate,
    EmployeeCreateThroughExcel,
    EmployeeUpdate,
    EmployeeResponse,
    EmployeeDetailResponse
)


router = APIRouter()
# ====================helper function====================
def calculate_age(dob):
    """
    Calculate age from date of birth
    """
    today = date.today()
    
    age = today.year - dob.year - (
        (today.month, today.day) < (dob.month, dob.day)
    )
    
    return age

# ==================== CREATE ====================

@router.post("/employees", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
def create_employee(
    employee: EmployeeCreate,
    db: Session = Depends(get_db),
    current_librarian = Depends(get_current_librarian)
):
    """
    Create a new employee (Librarian only)
    """
    
    # Check if email already exists
    existing_email = db.query(Employee).filter(Employee.Gmail == employee.Gmail).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Email {employee.Gmail} is already registered"
        )
    
    # Check if phone already exists
    existing_phone = db.query(Employee).filter(Employee.Phone_no == employee.Phone_no).first()
    if existing_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Phone number {employee.Phone_no} is already registered"
        )
    
    # Verify employee post exists if provided
    if employee.Employee_post_id:
        post = db.query(EmployeePost).filter(
            EmployeePost.Employee_post_id == employee.Employee_post_id
        ).first()
        if not post:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Employee post with ID {employee.Employee_post_id} not found"
            )
    
    # Verify department exists if provided
    if employee.Department_id:
        department = db.query(Department).filter(
            Department.Department_id == employee.Department_id
        ).first()
        if not department:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Department with ID {employee.Department_id} not found"
            )
    
    # Create new employee
    employee_data = employee.dict()
    employee_data['Password'] = hash_password(employee_data['Password'])  # Hash password
    employee_data['employee_creation_time'] = datetime.now()
    
    new_employee = Employee(**employee_data)
    db.add(new_employee)
    db.commit()
    db.refresh(new_employee)
    
    return new_employee




@router.post("/employees_through_excel", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
def create_employee_through_excel(
    employee: EmployeeCreateThroughExcel,
    db: Session = Depends(get_db),
    current_librarian = Depends(get_current_librarian)
):
    """
    Create a new employee (Librarian only)
    """

    # 🔹 Check Email
    existing_email = db.query(Employee).filter(Employee.Gmail == employee.Gmail).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Email {employee.Gmail} is already registered"
        )

    # 🔹 Check Phone
    existing_phone = db.query(Employee).filter(Employee.Phone_no == employee.Phone_no).first()
    if existing_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Phone number {employee.Phone_no} is already registered"
        )

    # 🔹 Handle Department using name
    department_id = None
    if employee.Department_name:
        department = db.query(Department).filter(
            func.lower(Department.department_name) == employee.Department_name.lower()
        ).first()

        if not department:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Department '{employee.Department_name}' not found"
            )

        department_id = department.Department_id

    # 🔹 Handle Employee Post using name
    post_id = None
    if employee.Post_name:
        post = db.query(EmployeePost).filter(
            func.lower(EmployeePost.post_name) == employee.Post_name.lower()
        ).first()

        if not post:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Post '{employee.Post_name}' not found"
            )

        post_id = post.Employee_post_id

    # 🔹 Prepare data
    employee_data = employee.dict()

    # Remove names (not in DB)
    employee_data.pop("Department_name", None)
    employee_data.pop("Post_name", None)

    # Add IDs
    employee_data["Department_id"] = department_id
    employee_data["Employee_post_id"] = post_id

    # Hash password
    employee_data["Password"] = hash_password(employee_data["Password"])

    # Add timestamp
    employee_data["employee_creation_time"] = datetime.now()

    # 🔹 Create employee
    new_employee = Employee(**employee_data)

    db.add(new_employee)
    db.commit()
    db.refresh(new_employee)

    return new_employee

# ==================== READ ====================

from sqlalchemy.orm import joinedload

@router.get("/employees", response_model=List[EmployeeResponse])
def get_all_employees(
    last_emp_id: Optional[int] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    department_id: Optional[int] = None,
    post_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_librarian = Depends(get_current_librarian)
):
    """
    Get all employees with optional filtering (Librarian only)

    - **last_emp_id**: Cursor for infinite scroll pagination
    - **limit**: Maximum number of records to return
    - **department_id**: Filter by department
    - **post_id**: Filter by employee post
    """

    query = db.query(Employee).options(
        joinedload(Employee.department),
        joinedload(Employee.employee_post)
    )

    # Apply filters
    if department_id:
        query = query.filter(Employee.Department_id == department_id)

    if post_id:
        query = query.filter(Employee.Employee_post_id == post_id)

    # Cursor pagination
    if last_emp_id:
        query = query.filter(Employee.Emp_Id > last_emp_id)

    employees = (
        query
        .order_by(Employee.Emp_Id.asc())
        .limit(limit)
        .all()
    )

    result = []

    for emp in employees:
        result.append(
            EmployeeResponse(
                Emp_Id=emp.Emp_Id,
                First_name=emp.First_name,
                Middle_name=emp.Middle_name,
                Last_name=emp.Last_name,
                DOB=emp.DOB,
                Phone_no=emp.Phone_no,
                Gmail=emp.Gmail,
                Department_id=emp.Department_id,
                Employee_post_id=emp.Employee_post_id,

                department_name=emp.department.department_name if emp.department else None,
                post_name=emp.employee_post.post_name if emp.employee_post else None
            )
        )

    return result


@router.get("/employees_for_QR", response_model=List[EmployeeResponse])
def get_all_employees_for_qr(
    department_id: Optional[int] = None,
    post_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_librarian = Depends(get_current_librarian)
):
    """
    Get all employees (No Pagination)
    """

    query = db.query(Employee).options(
        joinedload(Employee.department),
        joinedload(Employee.employee_post)
    )

    # Apply filters
    if department_id:
        query = query.filter(Employee.Department_id == department_id)

    if post_id:
        query = query.filter(Employee.Employee_post_id == post_id)

    # Fetch all employees (no limit)
    employees = (
        query
        .order_by(Employee.Emp_Id.asc())
        .all()
    )

    result = []

    for emp in employees:
        result.append(
            EmployeeResponse(
                Emp_Id=emp.Emp_Id,
                First_name=emp.First_name,
                Middle_name=emp.Middle_name,
                Last_name=emp.Last_name,
                DOB=emp.DOB,
                Phone_no=emp.Phone_no,
                Gmail=emp.Gmail,
                Department_id=emp.Department_id,
                Employee_post_id=emp.Employee_post_id,

                department_name=emp.department.department_name if emp.department else None,
                post_name=emp.employee_post.post_name if emp.employee_post else None
            )
        )

    return result


@router.get("/employees/{emp_id}", response_model=EmployeeDetailResponse)
def get_employee_by_id(
    emp_id: int,
    db: Session = Depends(get_db),
    current_librarian = Depends(get_current_librarian)
):
    """
    Get employee details by ID (Librarian only)
    """
    
    employee = db.query(Employee).filter(Employee.Emp_Id == emp_id).first()
    
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee with ID {emp_id} not found"
        )
    
    # Get post name if exists
    post_name = None
    if employee.Employee_post_id:
        post = db.query(EmployeePost).filter(
            EmployeePost.Employee_post_id == employee.Employee_post_id
        ).first()
        if post:
            post_name = post.post_name
    
    # Get department name if exists
    department_name = None
    if employee.Department_id:
        department = db.query(Department).filter(
            Department.Department_id == employee.Department_id
        ).first()
        if department:
            department_name = department.department_name
    
    # Create response with relationships
    employee_dict = {
        "Emp_Id": employee.Emp_Id,
        "First_name": employee.First_name,
        "Middle_name": employee.Middle_name,
        "Last_name": employee.Last_name,
        "DOB": employee.DOB,
        "Phone_no": employee.Phone_no,
        "Gmail": employee.Gmail,
        "employee_creation_time": employee.employee_creation_time,
        "Employee_post_id": employee.Employee_post_id,
        "Department_id": employee.Department_id,
        "post_name": post_name,
        "department_name": department_name
    }
    
    return employee_dict




@router.get("/employees/search/by-name")
def search_employees_by_name(
    name: str = Query(..., min_length=2),
    db: Session = Depends(get_db),
    current_librarian = Depends(get_current_librarian)
):
    """
    Search employees by name (first, middle, or last name)
    Returns department name and post name without password
    """

    search_term = f"%{name}%"

    employees = (
        db.query(Employee, EmployeePost.post_name, Department.department_name)
        .outerjoin(EmployeePost, Employee.Employee_post_id == EmployeePost.Employee_post_id)
        .outerjoin(Department, Employee.Department_id == Department.Department_id)
        .filter(
            (Employee.First_name.like(search_term)) |
            (Employee.Middle_name.like(search_term)) |
            (Employee.Last_name.like(search_term))
        )
        .all()
    )

    result = []

    for emp, post_name, dept_name in employees:
        result.append({
            "Emp_Id": emp.Emp_Id,
            "First_name": emp.First_name,
            "Middle_name": emp.Middle_name,
            "Last_name": emp.Last_name,
            "DOB": emp.DOB,
            "age": calculate_age(emp.DOB),
            "Phone_no": emp.Phone_no,
            "Gmail": emp.Gmail,
            "employee_creation_time": emp.employee_creation_time,
            "Employee_post": post_name,
            "Department": dept_name
        })

    return result


# ==================== UPDATE ====================

@router.put("/employees/{emp_id}", response_model=EmployeeResponse)
def update_employee(
    emp_id: int,
    employee_update: EmployeeUpdate,
    db: Session = Depends(get_db),
    current_librarian = Depends(get_current_librarian)
):
    """
    Update employee information (Librarian only)
    """
    
    employee = db.query(Employee).filter(Employee.Emp_Id == emp_id).first()
    
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee with ID {emp_id} not found"
        )
    
    # Get only provided fields
    update_data = employee_update.dict(exclude_unset=True)
    
    # Check if email is being updated and is unique
    if 'Gmail' in update_data:
        existing = db.query(Employee).filter(
            Employee.Gmail == update_data['Gmail'],
            Employee.Emp_Id != emp_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Email {update_data['Gmail']} is already registered"
            )
    
    # Check if phone is being updated and is unique
    if 'Phone_no' in update_data:
        existing = db.query(Employee).filter(
            Employee.Phone_no == update_data['Phone_no'],
            Employee.Emp_Id != emp_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Phone number {update_data['Phone_no']} is already registered"
            )
    
    # Hash password if being updated
    if 'Password' in update_data:
        update_data['Password'] = hash_password(update_data['Password'])
    
    # Verify employee post exists if being updated
    if 'Employee_post_id' in update_data and update_data['Employee_post_id'] is not None:
        post = db.query(EmployeePost).filter(
            EmployeePost.Employee_post_id == update_data['Employee_post_id']
        ).first()
        if not post:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Employee post with ID {update_data['Employee_post_id']} not found"
            )
    
    # Verify department exists if being updated
    if 'Department_id' in update_data and update_data['Department_id'] is not None:
        department = db.query(Department).filter(
            Department.Department_id == update_data['Department_id']
        ).first()
        if not department:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Department with ID {update_data['Department_id']} not found"
            )
    
    # Update employee
    for key, value in update_data.items():
        setattr(employee, key, value)
    
    db.commit()
    db.refresh(employee)
    
    return employee


# ==================== DELETE ====================

@router.delete("/employees/{emp_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(
    emp_id: int,
    db: Session = Depends(get_db),
    current_librarian = Depends(get_current_librarian)
):
    """
    Delete an employee (Librarian only)
    Warning: This will also delete related issue records and requests
    """
    
    employee = db.query(Employee).filter(Employee.Emp_Id == emp_id).first()
    
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee with ID {emp_id} not found"
        )
    
    db.delete(employee)
    db.commit()
    
    return None


# ==================== STATISTICS ====================

@router.get("/employees/stats/count")
def get_employee_count(
    db: Session = Depends(get_db),
    current_librarian = Depends(get_current_librarian)
):
    """
    Get total number of employees with breakdown
    """
    
    total = db.query(Employee).count()
    
    # Count by post
    posts = db.query(EmployeePost).all()
    by_post = {}
    for post in posts:
        count = db.query(Employee).filter(
            Employee.Employee_post_id == post.Employee_post_id
        ).count()
        by_post[post.post_name] = count
    
    # Count by department
    departments = db.query(Department).all()
    by_department = {}
    for dept in departments:
        count = db.query(Employee).filter(
            Employee.Department_id == dept.Department_id
        ).count()
        by_department[dept.department_name] = count
    
    return {
        "total_employees": total,
        "by_post": by_post,
        "by_department": by_department
    }