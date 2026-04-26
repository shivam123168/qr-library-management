"""
Authentication Endpoints - Login routes
Now includes separate librarian login
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, create_access_token
from app.models.student import Student
from app.models.employee import Employee
from app.models.employee_post import EmployeePost
from app.schemas.auth import StudentLoginRequest, EmployeeLoginRequest, TokenResponse
from app.api.deps_with_librarian import get_current_user


router = APIRouter()


@router.post("/login/student", response_model=TokenResponse)
def login_student(
    credentials: StudentLoginRequest,
    db: Session = Depends(get_db)
):
    """
    Student Login
    
    - **prn**: Student PRN number (username)
    - **password**: Student password
    
    Returns JWT access token on successful login
    """
    
    # Find student by PRN
    student = db.query(Student).filter(Student.Prn_id == credentials.prn).first()
    
    # Check if student exists
    if not student:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid PRN or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify password
    if not verify_password(credentials.password, student.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid PRN or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token = create_access_token(
        data={
            "sub": str(student.Prn_id),
            "user_type": "student"
        }
    )
    
    # Return token with user info
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user_type="student",
        user_id=student.Prn_id,
        name=f"{student.first_name} {student.last_name}"
    )


@router.post("/login/librarian", response_model=TokenResponse)
def login_librarian(
    credentials: EmployeeLoginRequest,
    db: Session = Depends(get_db)
):
    """
    Librarian Login - Only for employees with "Librarian" post
    
    - **emp_id**: Employee ID
    - **password**: Employee password
    
    Returns JWT access token on successful login
    Only works if employee has "Librarian" post
    """
    
    # Find employee by Emp_Id
    employee = db.query(Employee).filter(Employee.Emp_Id == credentials.emp_id).first()
    
    # Check if employee exists
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Employee ID or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify password
    if not verify_password(credentials.password, employee.Password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Employee ID or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if employee is a librarian
    if employee.Employee_post_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only librarians can use this login.",
        )
    
    # Get employee post
    employee_post = db.query(EmployeePost).filter(
        EmployeePost.Employee_post_id == employee.Employee_post_id
    ).first()
    
    # Verify it's a librarian post
    if not employee_post or employee_post.post_name != "Librarian":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only librarians can use this login.",
        )
    
    # Create access token with librarian role
    access_token = create_access_token(
        data={
            "sub": str(employee.Emp_Id),
            "user_type": "librarian"  # Special type for librarians
        }
    )
    
    # Return token with user info
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user_type="librarian",  # Returns "librarian" not "employee"
        user_id=employee.Emp_Id,
        name=f"{employee.First_name} {employee.Last_name}"
    )


@router.post("/login/employee", response_model=TokenResponse)
def login_employee(
    credentials: EmployeeLoginRequest,
    db: Session = Depends(get_db)
):
    """
    Regular Employee Login - For non-librarian employees
    
    - **emp_id**: Employee ID
    - **password**: Employee password
    
    Returns JWT access token on successful login
    """
    
    # Find employee by Emp_Id
    employee = db.query(Employee).filter(Employee.Emp_Id == credentials.emp_id).first()
    
    # Check if employee exists
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Employee ID or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify password
    if not verify_password(credentials.password, employee.Password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Employee ID or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token = create_access_token(
        data={
            "sub": str(employee.Emp_Id),
            "user_type": "employee"
        }
    )
    
    # Return token with user info
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user_type="employee",
        user_id=employee.Emp_Id,
        name=f"{employee.First_name} {employee.Last_name}"
    )


@router.get("/me")
def get_current_user_info(
    current_user = Depends(get_current_user)
):
    """
    Get current logged-in user information
    Requires authentication (Bearer token in header)
    
    Returns different information based on user type (student, employee, or librarian)
    """
    
    if isinstance(current_user, Student):
        return {
            "user_type": "student",
            "prn_id": current_user.Prn_id,
            "name": f"{current_user.first_name} {current_user.last_name}",
            "email": current_user.gmail,
            "phone": current_user.Phone_no,
            "branch_id": current_user.Branch_id,
            "semester": current_user.sem
        }
    elif isinstance(current_user, Employee):
        # Check if librarian
        is_librarian = False
        if current_user.Employee_post_id:
            from app.models.employee_post import EmployeePost
            from app.core.database import SessionLocal
            db = SessionLocal()
            post = db.query(EmployeePost).filter(
                EmployeePost.Employee_post_id == current_user.Employee_post_id
            ).first()
            if post and post.post_name == "Librarian":
                is_librarian = True
            db.close()
        
        return {
            "user_type": "librarian" if is_librarian else "employee",
            "emp_id": current_user.Emp_Id,
            "name": f"{current_user.First_name} {current_user.Last_name}",
            "email": current_user.Gmail,
            "phone": current_user.Phone_no,
            "department_id": current_user.Department_id,
            "post_id": current_user.Employee_post_id,
            "is_librarian": is_librarian
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unknown user type"
        )