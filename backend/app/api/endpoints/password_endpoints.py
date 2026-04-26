"""
Password Update Endpoints
Users can change their own passwords or librarians can reset passwords
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import hash_password, verify_password
from app.api.deps_with_librarian import get_current_user, get_current_student, get_current_employee, get_current_librarian
from app.models.student import Student
from app.models.employee import Employee
from app.schemas.password_schemas import (
    PasswordUpdate,
    PasswordResetByLibrarian,
    PasswordUpdateResponse
)


router = APIRouter()


# ==================== STUDENT PASSWORD ENDPOINTS ====================

@router.put("/students/password/change", response_model=PasswordUpdateResponse)
def change_student_password(
    password_data: PasswordUpdate,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """
    Change student's own password (Student must be logged in)
    
    - **old_password**: Current password for verification
    - **new_password**: New password to set
    """
    
    # Verify old password
    if not verify_password(password_data.old_password, current_student.password):
        
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect"
        )
    
    # Check if new password is same as old
    if password_data.old_password == password_data.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from current password"
        )
    
    # Update password
    current_student.password = hash_password(password_data.new_password)
    db.commit()
    
    return PasswordUpdateResponse(
        message="Password updated successfully",
        user_id=current_student.Prn_id,
        user_type="student"
    )


@router.put("/students/{prn_id}/password/reset", response_model=PasswordUpdateResponse)
def reset_student_password_by_librarian(
    prn_id: int,
    password_data: PasswordResetByLibrarian,
    db: Session = Depends(get_db),
    current_librarian = Depends(get_current_librarian)
):
    """
    Reset student password by librarian (Librarian only)
    
    - **prn_id**: Student PRN number
    - **new_password**: New password to set for the student
    """
    
    # Find student
    student = db.query(Student).filter(Student.Prn_id == prn_id).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with PRN {prn_id} not found"
        )
    
    # Update password
    student.password = hash_password(password_data.new_password)
    db.commit()
    
    return PasswordUpdateResponse(
        message=f"Password reset successfully for student PRN {prn_id}",
        user_id=student.Prn_id,
        user_type="student"
    )


# ==================== EMPLOYEE PASSWORD ENDPOINTS ====================

@router.put("/employees/password/change", response_model=PasswordUpdateResponse)
def change_employee_password(
    password_data: PasswordUpdate,
    current_employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db)
):
    """
    Change employee's own password (Employee must be logged in)
    
    - **old_password**: Current password for verification
    - **new_password**: New password to set
    """
    
    # Verify old password
    if not verify_password(password_data.old_password, current_employee.Password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect"
        )
    
    # Check if new password is same as old
    if password_data.old_password == password_data.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from current password"
        )
    
    # Update password
    current_employee.Password = hash_password(password_data.new_password)
    db.commit()
    
    return PasswordUpdateResponse(
        message="Password updated successfully",
        user_id=current_employee.Emp_Id,
        user_type="employee"
    )


@router.put("/employees/{emp_id}/password/reset", response_model=PasswordUpdateResponse)
def reset_employee_password_by_librarian(
    emp_id: int,
    password_data: PasswordResetByLibrarian,
    db: Session = Depends(get_db),
    current_librarian = Depends(get_current_librarian)
):
    """
    Reset employee password by librarian (Librarian only)
    
    - **emp_id**: Employee ID
    - **new_password**: New password to set for the employee
    """
    
    # Find employee
    employee = db.query(Employee).filter(Employee.Emp_Id == emp_id).first()
    
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee with ID {emp_id} not found"
        )
    
    # Update password
    employee.Password = hash_password(password_data.new_password)
    db.commit()
    
    return PasswordUpdateResponse(
        message=f"Password reset successfully for employee ID {emp_id}",
        user_id=employee.Emp_Id,
        user_type="employee"
    )