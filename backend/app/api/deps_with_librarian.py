"""
API Dependencies - Reusable dependency functions
Now includes get_current_librarian
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import JWTError
from app.core.database import get_db
from app.core.security import verify_token
from app.models.student import Student
from app.models.employee import Employee
from app.models.employee_post import EmployeePost
from app.schemas.auth import TokenData


# OAuth2 scheme - gets token from Authorization header
security = HTTPBearer()



def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)

):
    print("Authorization header received")
    print("Credentials:", credentials)

    """
    Get current user from JWT token
    Works for students, employees, and librarians
    
    Usage:
        @app.get("/profile")
        def get_profile(current_user = Depends(get_current_user)):
            return current_user
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Verify and decode token
        token = credentials.credentials
        payload = verify_token(token)
        if payload is None:
            raise credentials_exception
        
        user_id = payload.get("sub")

        if user_id is None:
             raise credentials_exception

        # Convert to int safely
        try:
            user_id = int(user_id)
        except ValueError:
             raise credentials_exception

        user_type: str = payload.get("user_type")
        
        if user_id is None or user_type is None:
            raise credentials_exception
            
        token_data = TokenData(user_id=user_id, user_type=user_type)
        
    except JWTError:
        raise credentials_exception
    
    # Find user in database based on type
    if token_data.user_type == "student":
        user = db.query(Student).filter(Student.Prn_id == token_data.user_id).first()
    elif token_data.user_type in ["employee", "librarian"]:
        user = db.query(Employee).filter(Employee.Emp_Id == token_data.user_id).first()
    else:
        raise credentials_exception
    
    if user is None:
        raise credentials_exception
    
    print("USER TYPE FROM TOKEN:", user_type)

    return user


def get_current_student(
    current_user = Depends(get_current_user)
) -> Student:
    """
    Ensure current user is a student
    Raises 403 if user is not a student
    
    Usage:
        @app.get("/student-only-route")
        def student_route(current_student: Student = Depends(get_current_student)):
            return current_student
    """
    print("Checking if current user is a student...")
    if not isinstance(current_user, Student):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can access this resource"
        )
    return current_user


def get_current_employee(
    current_user = Depends(get_current_user)
) -> Employee:
    """
    Ensure current user is an employee (including librarians)
    Raises 403 if user is not an employee
    
    Usage:
        @app.get("/employee-only-route")
        def employee_route(current_employee: Employee = Depends(get_current_employee)):
            return current_employee
    """
    print("Checking if current user is an employee...")
    if not isinstance(current_user, Employee):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employees can access this resource"
        )
    return current_user


def get_current_librarian(
    current_user: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db)
) -> Employee:
    """
    Ensure current user is a librarian
    Raises 403 if user is not a librarian
    
    Usage:
        @app.get("/librarian-only-route")
        def librarian_route(librarian: Employee = Depends(get_current_librarian)):
            return librarian
    """
    print("i am running get_current_librarian dependency")
    # Check if employee has a post
    if current_user.Employee_post_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only librarians can access this resource"
        )
    
    # Get employee post
    employee_post = db.query(EmployeePost).filter(
        EmployeePost.Employee_post_id == current_user.Employee_post_id
    ).first()
    
    # Verify it's a librarian
    if not employee_post or employee_post.post_name != "Librarian":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only librarians can access this resource"
        )
    
    return current_user