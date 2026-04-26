"""
Student Endpoints - Complete CRUD Operations
"""
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import joinedload
from sqlalchemy import func
from app.core.database import get_db
from app.core.security import hash_password
from app.api.deps_with_librarian import get_current_librarian
from app.models.student import Student
from app.models.branch import Branch
from app.schemas.student_schemas import (
    StudentCreate,
    StudentCreateThroughExcel,
    StudentUpdate,
    StudentResponse,
    StudentDetailResponse
)


router = APIRouter()


# ==================== CREATE ====================

@router.post("/students", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
def create_student(
    student: StudentCreate,
    db: Session = Depends(get_db),
    current_librarian = Depends(get_current_librarian)
):
    """
    Create a new student (Librarian only)
    """
    
    # Check if PRN already exists
    existing = db.query(Student).filter(Student.Prn_id == student.Prn_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Student with PRN {student.Prn_id} already exists"
        )
    
    # Check if email already exists
    existing_email = db.query(Student).filter(Student.gmail == student.gmail).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Email {student.gmail} is already registered"
        )
    
    # Check if phone already exists
    existing_phone = db.query(Student).filter(Student.Phone_no == student.Phone_no).first()
    if existing_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Phone number {student.Phone_no} is already registered"
        )
    
    # Verify branch exists if provided
    if student.Branch_id:
        branch = db.query(Branch).filter(Branch.Branch_id == student.Branch_id).first()
        if not branch:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Branch with ID {student.Branch_id} not found"
            )
    
    # Create new student
    student_data = student.dict()
    student_data['password'] = hash_password(student_data['password'])  # Hash password
    student_data['student_creation_time'] = datetime.now()
    
    new_student = Student(**student_data)
    db.add(new_student)
    db.commit()
    db.refresh(new_student)
    
    return new_student




@router.post("/students_through_excel", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
def create_student_through_excel(
    student: StudentCreateThroughExcel,
    db: Session = Depends(get_db),
    current_librarian = Depends(get_current_librarian)
):
    """
    Create a new student (Librarian only)
    """

    # 🔹 Check PRN
    existing = db.query(Student).filter(Student.Prn_id == student.Prn_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Student with PRN {student.Prn_id} already exists"
        )

    # 🔹 Check Email
    existing_email = db.query(Student).filter(Student.gmail == student.gmail).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Email {student.gmail} is already registered"
        )

    # 🔹 Check Phone
    existing_phone = db.query(Student).filter(Student.Phone_no == student.Phone_no).first()
    if existing_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Phone number {student.Phone_no} is already registered"
        )

    # 🔹 Handle Branch using Branch_name
    branch_id = None

    if student.Branch_name:
        branch = db.query(Branch).filter(
            func.lower(Branch.Branch_name) == student.Branch_name.lower()
        ).first()

        if not branch:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Branch '{student.Branch_name}' not found"
            )

        branch_id = branch.Branch_id

    # 🔹 Prepare data
    student_data = student.dict()

    # Remove Branch_name (not in DB)
    student_data.pop("Branch_name", None)

    # Add Branch_id
    student_data["Branch_id"] = branch_id

    # Hash password
    student_data["password"] = hash_password(student_data["password"])

    # Add timestamp
    student_data["student_creation_time"] = datetime.now()

    # 🔹 Create student
    new_student = Student(**student_data)

    db.add(new_student)
    db.commit()
    db.refresh(new_student)

    return new_student


# ==================== READ ====================

def calculate_age(dob):
    """
    Calculate age from date of birth
    """
    today = date.today()
    
    age = today.year - dob.year - (
        (today.month, today.day) < (dob.month, dob.day)
    )
    
    return age

@router.get("/students", response_model=List[StudentResponse])
def get_all_students(
    last_prn: Optional[int] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    branch_id: Optional[int] = None,
    sem: Optional[str] = None,
    db: Session = Depends(get_db),
    current_librarian = Depends(get_current_librarian)
):
    """
    Infinite Scroll Pagination (Cursor Based)
    Returns branch name instead of only branch id
    """

    query = db.query(Student).options(joinedload(Student.branch))

    # Apply filters
    if branch_id:
        query = query.filter(Student.Branch_id == branch_id)

    if sem:
        query = query.filter(Student.sem == sem)

    # Cursor-based pagination
    if last_prn:
        query = query.filter(Student.Prn_id > last_prn)

    students = (
        query
        .order_by(Student.Prn_id.asc())
        .limit(limit)
        .all()
    )

    # Attach branch name dynamically
    result = []

    for student in students:
        result.append(
            StudentResponse(
                Prn_id=student.Prn_id,
                first_name=student.first_name,
                Middle_name=student.Middle_name,
                last_name=student.last_name,
                DOB=student.DOB,
                sem=student.sem,
                Phone_no=student.Phone_no,
                gmail=student.gmail,
                student_creation_time=student.student_creation_time,
                Branch_id=student.Branch_id,
                branch_name=student.branch.Branch_name if student.branch else None
            )
        )

    return result

@router.get("/qr_generator_students", response_model=List[StudentResponse])
def get_all_students(
    branch_id: Optional[int] = None,
    sem: Optional[str] = None,
    db: Session = Depends(get_db),
    current_librarian = Depends(get_current_librarian)
):
    """
    Get all students (No Pagination)
    """

    query = db.query(Student).options(joinedload(Student.branch))

    # Apply filters
    if branch_id:
        query = query.filter(Student.Branch_id == branch_id)

    if sem:
        query = query.filter(Student.sem == sem)

    # Fetch all students (no limit)
    students = query.order_by(Student.Prn_id.asc()).all()

    # Attach branch name dynamically
    result = []

    for student in students:
        result.append(
            StudentResponse(
                Prn_id=student.Prn_id,
                first_name=student.first_name,
                Middle_name=student.Middle_name,
                last_name=student.last_name,
                DOB=student.DOB,
                sem=student.sem,
                Phone_no=student.Phone_no,
                gmail=student.gmail,
                student_creation_time=student.student_creation_time,
                Branch_id=student.Branch_id,
                branch_name=student.branch.Branch_name if student.branch else None
            )
        )

    return result


@router.get("/students/{prn_id}", response_model=StudentDetailResponse)
def get_student_by_prn(
    prn_id: int,
    db: Session = Depends(get_db),
    current_librarian = Depends(get_current_librarian)
):
    """
    Get student details by PRN (Librarian only)
    """
    
    student = db.query(Student).filter(Student.Prn_id == prn_id).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with PRN {prn_id} not found"
        )
    
    # Get branch name if exists
    branch_name = None
    if student.Branch_id:
        branch = db.query(Branch).filter(Branch.Branch_id == student.Branch_id).first()
        if branch:
            branch_name = branch.Branch_name
    
    # Create response with branch name
    student_dict = {
        "Prn_id": student.Prn_id,
        "first_name": student.first_name,
        "Middle_name": student.Middle_name,
        "last_name": student.last_name,
        "DOB": student.DOB,
        "sem": student.sem,
        "Phone_no": student.Phone_no,
        "gmail": student.gmail,
        "student_creation_time": student.student_creation_time,
        "Branch_id": student.Branch_id,
        "branch_name": branch_name
    }
    
    return student_dict


@router.get("/students/search/by-name")
def search_students_by_name(
    name: str = Query(..., min_length=2),
    db: Session = Depends(get_db),
    current_librarian = Depends(get_current_librarian)
):
    """
    Search students by name (first, middle, or last name)
    Returns branch name and removes password from response
    """

    search_term = f"%{name}%"

    students = (
        db.query(Student, Branch.Branch_name)
        .outerjoin(Branch, Student.Branch_id == Branch.Branch_id)
        .filter(
            (Student.first_name.like(search_term)) |
            (Student.Middle_name.like(search_term)) |
            (Student.last_name.like(search_term))
        )
        .all()
    )

    result = []

    for student, branch_name in students:
        result.append({
            "Prn_id": student.Prn_id,
            "first_name": student.first_name,
            "Middle_name": student.Middle_name,
            "last_name": student.last_name,
            "DOB": student.DOB,
            "age": calculate_age(student.DOB),
            "Phone_no": student.Phone_no,
            "gmail": student.gmail,
            "created_at": student.student_creation_time,
            "sem": student.sem,
            "Branch_name": branch_name
        })

    return result


# ==================== UPDATE ====================

@router.put("/students/{prn_id}", response_model=StudentResponse)
def update_student(
    prn_id: int,
    student_update: StudentUpdate,
    db: Session = Depends(get_db),
    current_librarian = Depends(get_current_librarian)
):
    """
    Update student information (Librarian only)
    """
    
    student = db.query(Student).filter(Student.Prn_id == prn_id).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with PRN {prn_id} not found"
        )
    
    # Get only provided fields
    update_data = student_update.dict(exclude_unset=True)
    
    # Check if email is being updated and is unique
    if 'gmail' in update_data:
        existing = db.query(Student).filter(
            Student.gmail == update_data['gmail'],
            Student.Prn_id != prn_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Email {update_data['gmail']} is already registered"
            )
    
    # Check if phone is being updated and is unique
    if 'Phone_no' in update_data:
        existing = db.query(Student).filter(
            Student.Phone_no == update_data['Phone_no'],
            Student.Prn_id != prn_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Phone number {update_data['Phone_no']} is already registered"
            )
    
    # Hash password if being updated
    if 'password' in update_data:
        update_data['password'] = hash_password(update_data['password'])
    
    # Verify branch exists if being updated
    if 'Branch_id' in update_data and update_data['Branch_id'] is not None:
        branch = db.query(Branch).filter(Branch.Branch_id == update_data['Branch_id']).first()
        if not branch:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Branch with ID {update_data['Branch_id']} not found"
            )
    
    # Update student
    for key, value in update_data.items():
        setattr(student, key, value)
    
    db.commit()
    db.refresh(student)
    
    return student


# ==================== DELETE ====================

@router.delete("/students/{prn_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(
    prn_id: int,
    db: Session = Depends(get_db),
    current_librarian = Depends(get_current_librarian)
):
    """
    Delete a student (Librarian only)
    Warning: This will also delete related issue records, requests, and penalties
    """
    
    student = db.query(Student).filter(Student.Prn_id == prn_id).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with PRN {prn_id} not found"
        )
    
    db.delete(student)
    db.commit()
    
    return None


# ==================== STATISTICS ====================

@router.get("/students/stats/count")
def get_student_count(
    db: Session = Depends(get_db),
    current_librarian = Depends(get_current_librarian)
):
    """
    Get total number of students
    """
    
    total = db.query(Student).count()
    
    # Count by semester
    by_semester = {}
    for sem in ['1', '2', '3', '4', '5', '6', '7', '8']:
        count = db.query(Student).filter(Student.sem == sem).count()
        by_semester[f"Semester {sem}"] = count
    
    # Count by branch
    branches = db.query(Branch).all()
    by_branch = {}
    for branch in branches:
        count = db.query(Student).filter(Student.Branch_id == branch.Branch_id).count()
        by_branch[branch.Branch_name] = count
    
    return {
        "total_students": total,
        "by_semester": by_semester,
        "by_branch": by_branch
    }
    
    
