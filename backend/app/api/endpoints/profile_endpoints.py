"""
Profile Endpoints
Students and Employees can view and update their personal information
(Passwords are NOT included for security)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.database import get_db
from app.api.deps_with_librarian import get_current_student, get_current_employee
from app.models.student import Student
from app.models.employee import Employee
from app.models.branch import Branch
from app.models.department import Department
from app.models.employee_post import EmployeePost
from app.models.issue_book import IssueBook
from app.models.penalty import Penalty
from app.models.penalty_amount import PenaltyAmount
from app.schemas.profile_schemas import (
    StudentProfileResponse,
    EmployeeProfileResponse,
    UpdateStudentProfileRequest,
    UpdateEmployeeProfileRequest
)


router = APIRouter()


# ==================== STUDENT PROFILE ENDPOINTS ====================

@router.get("/students/my-profile", response_model=StudentProfileResponse)
def get_my_profile_student(
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """
    Get complete profile information for logged-in STUDENT
    
    Returns:
    - Personal information (name, email, phone, semester, branch)
    - Borrowing statistics
    - Penalty information
    
    Note: Password is NOT included for security
    """
    
    # Get branch information
    branch_name = None
    if current_student.Branch_id:
        branch = db.query(Branch).filter(Branch.Branch_id == current_student.Branch_id).first()
        if branch:
            branch_name = branch.Branch_name
    
    # Calculate borrowing statistics
    total_books_borrowed = db.query(IssueBook).filter(
        IssueBook.Student_Prn_id == current_student.Prn_id,
        IssueBook.Employee_Emp_Id == None
    ).count()
    
    currently_issued = db.query(IssueBook).filter(
        IssueBook.Student_Prn_id == current_student.Prn_id,
        IssueBook.Employee_Emp_Id == None,
        IssueBook.status == "Issued"
    ).count()
    
    currently_overdue = db.query(IssueBook).filter(
        IssueBook.Student_Prn_id == current_student.Prn_id,
        IssueBook.Employee_Emp_Id == None,
        IssueBook.status == "Overdue"
    ).count()
    
    # Calculate penalty statistics
    issue_records = db.query(IssueBook).filter(
        IssueBook.Student_Prn_id == current_student.Prn_id,
        IssueBook.Employee_Emp_Id == None
    ).all()
    
    total_penalties = 0
    unpaid_penalties = 0
    total_unpaid_amount = 0
    
    for issue in issue_records:
        penalty = db.query(Penalty).filter(
            Penalty.issue_book_id == issue.issue_book_id
        ).first()
        
        if penalty:
            total_penalties += 1
            
            if penalty.Amount_status == "not paid":
                unpaid_penalties += 1
                
                total_unpaid_amount += penalty.total_amount
    
    return StudentProfileResponse(
        Prn_id=current_student.Prn_id,
        first_name=current_student.first_name,
        DOB = str(current_student.DOB),
        middle_name=current_student.Middle_name,
        last_name=current_student.last_name,
        gmail=current_student.Gmail,
        Phone_no=current_student.Phone_no,
        sem=current_student.sem,
        Branch_id=current_student.Branch_id,
        branch_name=branch_name,
        student_creation_time=current_student.student_creation_time,
        total_books_borrowed=total_books_borrowed,
        currently_issued=currently_issued,
        currently_overdue=currently_overdue,
        total_penalties=total_penalties,
        unpaid_penalties=unpaid_penalties,
        total_unpaid_amount=total_unpaid_amount
    )


@router.put("/students/my-profile")
def update_my_profile_student(
    profile_update: UpdateStudentProfileRequest,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """
    Update profile information for logged-in STUDENT
    
    Students can update:
    - Email (gmail)
    - Phone number
    - Semester
    
    Students CANNOT update:
    - PRN (primary key)
    - Name (must contact admin)
    - Branch (must contact admin)
    - Password (use separate password change endpoint)
    """
    
    updated_fields = []
    
    # Update email
    if profile_update.Gmail is not None:
        # Check if email is already taken by another student
        existing = db.query(Student).filter(
            Student.Gmail == profile_update.Gmail,
            Student.Prn_id != current_student.Prn_id
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already registered to another student"
            )
        
        current_student.Gmail = profile_update.Gmail
        updated_fields.append("email")
    
    # Update phone
    if profile_update.Phone_no is not None:
        current_student.Phone_no = profile_update.Phone_no
        updated_fields.append("phone number")
    
    # Update semester
    if profile_update.sem is not None:
        if profile_update.sem < 1 or profile_update.sem > 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Semester must be between 1 and 8"
            )
        current_student.sem = str(profile_update.sem)
        updated_fields.append("sem")
    
    if not updated_fields:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )
    
    db.commit()
    db.refresh(current_student)
    
    return {
        "message": f"Profile updated successfully. Updated: {', '.join(updated_fields)}",
        "updated_fields": updated_fields,
        "prn_id": current_student.Prn_id,
        "name": f"{current_student.first_name} {current_student.last_name}"
    }


# ==================== EMPLOYEE PROFILE ENDPOINTS ====================

@router.get("/employees/my-profile", response_model=EmployeeProfileResponse)
def get_my_profile_employee(
    current_employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db)
):
    """
    Get complete profile information for logged-in EMPLOYEE
    
    Returns:
    - Personal information (name, email, phone, department, post)
    - Borrowing statistics
    - Penalty information
    
    Note: Password is NOT included for security
    """
    
    # Get department information
    department_name = None
    if current_employee.Department_id:
        department = db.query(Department).filter(
            Department.Department_id == current_employee.Department_id
        ).first()
        if department:
            department_name = department.department_name
    
    # Get post information
    post_name = None
    if current_employee.Employee_post_id:
        post = db.query(EmployeePost).filter(
            EmployeePost.Employee_post_id == current_employee.Employee_post_id
        ).first()
        if post:
            post_name = post.post_name
    
    # Calculate borrowing statistics (books THEY borrowed, not books they issued)
    total_books_borrowed = db.query(IssueBook).filter(
        IssueBook.Employee_Emp_Id == current_employee.Emp_Id,
        IssueBook.Student_Prn_id == None  # Employee borrowing indicator
    ).count()
    
    currently_borrowed = db.query(IssueBook).filter(
        IssueBook.Employee_Emp_Id == current_employee.Emp_Id,
        IssueBook.Student_Prn_id == None,
        IssueBook.status == "Issued"
    ).count()
    
    currently_overdue = db.query(IssueBook).filter(
        IssueBook.Employee_Emp_Id == current_employee.Emp_Id,
        IssueBook.Student_Prn_id == None,
        IssueBook.status == "Overdue"
    ).count()
    
    # Calculate penalty statistics
    issue_records = db.query(IssueBook).filter(
        IssueBook.Employee_Emp_Id == current_employee.Emp_Id,
        IssueBook.Student_Prn_id == None
    ).all()
    
    total_penalties = 0
    unpaid_penalties = 0
    total_unpaid_amount = 0
    
    for issue in issue_records:
        penalty = db.query(Penalty).filter(
            Penalty.issue_book_id == issue.issue_book_id
        ).first()
        
        if penalty:
            total_penalties += 1
            
            if penalty.Amount_status == "not paid":
                unpaid_penalties += 1
                
                total_unpaid_amount += penalty.total_amount
    
    return EmployeeProfileResponse(
        Emp_Id=current_employee.Emp_Id,
        First_name=current_employee.First_name,
        Middel_name=current_employee.Middle_name,   
        Last_name=current_employee.Last_name,
        DOB = str(current_employee.DOB),
        Gmail=current_employee.Gmail,
        Phone_no=current_employee.Phone_no,
        Department_id=current_employee.Department_id,
        department_name=department_name,
        Employee_post_id=current_employee.Employee_post_id,
        post_name=post_name,
        employee_creation_time=current_employee.employee_creation_time,
        total_books_borrowed=total_books_borrowed,
        currently_borrowed=currently_borrowed,
        total_penalties=total_penalties,
        unpaid_penalties=unpaid_penalties,
        currently_overdue=currently_overdue,
        total_unpaid_amount=total_unpaid_amount
    )


@router.put("/employees/my-profile")
def update_my_profile_employee(
    profile_update: UpdateEmployeeProfileRequest,
    current_employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db)
):
    """
    Update profile information for logged-in EMPLOYEE
    
    Employees can update:
    - Email (Gmail)
    - Phone number
    
    Employees CANNOT update:
    - Emp_Id (primary key)
    - Name (must contact admin)
    - Department (must contact admin)
    - Post (must contact admin)
    - Password (use separate password change endpoint)
    """
    
    updated_fields = []
    
    # Update email
    if profile_update.Gmail is not None:
        # Check if email is already taken by another employee
        existing = db.query(Employee).filter(
            Employee.Gmail == profile_update.Gmail,
            Employee.Emp_Id != current_employee.Emp_Id
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already registered to another employee"
            )
        
        current_employee.Gmail = profile_update.Gmail
        updated_fields.append("email")
    
    # Update phone
    if profile_update.Phone_no is not None:
        current_employee.Phone_no = profile_update.Phone_no
        updated_fields.append("phone number")
    
    if not updated_fields:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )
    
    db.commit()
    db.refresh(current_employee)
    
    return {
        "message": f"Profile updated successfully. Updated: {', '.join(updated_fields)}",
        "updated_fields": updated_fields,
        "emp_id": current_employee.Emp_Id,
        "name": f"{current_employee.First_name} {current_employee.Last_name}"
    }
