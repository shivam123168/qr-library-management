"""
Issue Book View Endpoints - COMPLETE
For Students: View books THEY borrowed
For Employees: View books THEY borrowed (not books they issued as librarian!)
For Librarians: View all system books

Database Logic:
- Student borrows: Student_Prn_id = PRN, Employee_Emp_Id = NULL
- Employee borrows: Student_Prn_id = NULL, Employee_Emp_Id = Emp_Id
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date

from app.core.database import get_db
from app.api.deps_with_librarian import get_current_student, get_current_employee, get_current_librarian
from app.models.student import Student
from app.models.employee import Employee
from app.models.book import Book
from app.models.author import Author
from app.models.author_junction import AuthorJunction
from app.models.issue_book import IssueBook
from app.models.penalty import Penalty
from app.models.penalty_amount import PenaltyAmount
from app.models.branch import Branch
from app.schemas.issue_book_schemas import (
    IssueBookDetailResponse,
    OverdueBookSummary,
    IssuedBookStats
)


router = APIRouter()

# ==================== HELPER FUNCTION ====================

def build_issue_book_response(issue_record: IssueBook, db: Session) -> dict:
    """Build detailed issue book response with all relationships"""
    
    # Determine borrower type and get borrower details
    if issue_record.Student_Prn_id:
        # Student borrowed
        borrower_type = "student"
        student = db.query(Student).filter(Student.Prn_id == issue_record.Student_Prn_id).first()
        borrower_dict = {
            "type": "student",
            "Prn_id": student.Prn_id,
            "name": f"{student.first_name} {student.last_name}",
            "email": student.gmail,
            "phone": student.Phone_no,
            "semester": student.sem,
            "branch_id": student.Branch_id
        }
        
        if student.Branch_id:
            branch = db.query(Branch).filter(Branch.Branch_id == student.Branch_id).first()
            if branch:
                borrower_dict["branch_name"] = branch.Branch_name
    else:
        # Employee borrowed
        borrower_type = "employee"
        employee = db.query(Employee).filter(Employee.Emp_Id == issue_record.Employee_Emp_Id).first()
        borrower_dict = {
            "type": "employee",
            "Emp_Id": employee.Emp_Id,
            "name": f"{employee.First_name} {employee.Last_name}",
            "email": employee.Gmail,
            "phone": employee.Phone_no
        }
    
    # Get book details
    book = db.query(Book).filter(Book.Accession_number == issue_record.Books_Accession_number).first()
    
    # Get authors
    author_junctions = db.query(AuthorJunction).filter(
        AuthorJunction.Books_Accession_number == book.Accession_number
    ).all()
    
    authors = []
    for junction in author_junctions:
        author = db.query(Author).filter(Author.Author_id == junction.Author_id).first()
        if author:
            authors.append(author.Author_name)
    
    book_dict = {
        "Accession_number": book.Accession_number,
        "title": book.Title,
        "authors": authors,
        "rack_location": book.rack_location,
        "self_location": book.self_location,
        "status": book.Status
    }
    
    # Check for penalty
    penalty = db.query(Penalty).filter(Penalty.issue_book_id == issue_record.issue_book_id).first()
    has_penalty = False
    penalty_amount_value = None
    penalty_status = None
    
    if penalty:
        has_penalty = True
        penalty_status = penalty.Amount_status
        
        penalty_amount_obj = db.query(PenaltyAmount).filter(
            PenaltyAmount.id == penalty.penalty_amount_id
        ).first()
        
        if penalty_amount_obj:
            penalty_amount_value = penalty_amount_obj.penalty_amount
    
    # Calculate days overdue if applicable
    days_overdue = None
    if issue_record.status == "Overdue" and datetime.now() > issue_record.due_date:
        days_overdue = (datetime.now() - issue_record.due_date).days
    
    return {
        "issue_book_id": issue_record.issue_book_id,
        "issue_time": issue_record.issue_time,
        "due_date": issue_record.due_date,
        "returned_date": issue_record.returned_date,
        "status": issue_record.status,
        "days_overdue": days_overdue,
        "borrower": borrower_dict,  # Changed from "student" to "borrower"
        "book": book_dict,
        "has_penalty": has_penalty,
        "penalty_amount": penalty_amount_value,
        "penalty_status": penalty_status
    }


# ==================== STUDENT ENDPOINTS ====================

@router.get("/students/my-issued-books", response_model=List[IssueBookDetailResponse])
def get_my_issued_books_student(
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """
    Get all currently issued books for logged-in STUDENT
    (Books that STUDENT has borrowed and not yet returned)
    
    Query: Student_Prn_id = PRN AND Employee_Emp_Id IS NULL
    """
    
    issue_records = db.query(IssueBook).filter(
        IssueBook.Student_Prn_id == current_student.Prn_id,
        IssueBook.Employee_Emp_Id == None,  # Student borrowed indicator
        IssueBook.status == "Issued"
    ).all()
    
    result = []
    for record in issue_records:
        result.append(build_issue_book_response(record, db))
    
    return result


@router.get("/students/my-returned-books", response_model=List[IssueBookDetailResponse])
def get_my_returned_books_student(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """
    Get all returned books for logged-in STUDENT
    (Book borrowing history)
    """
    
    issue_records = db.query(IssueBook).filter(
        IssueBook.Student_Prn_id == current_student.Prn_id,
        IssueBook.Employee_Emp_Id == None,
        IssueBook.status == "Returned"
    ).order_by(IssueBook.returned_date.desc()).offset(skip).limit(limit).all()
    
    result = []
    for record in issue_records:
        result.append(build_issue_book_response(record, db))
    
    return result


@router.get("/students/my-overdue-books", response_model=List[IssueBookDetailResponse])
def get_my_overdue_books_student(
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """
    Get all overdue books for logged-in STUDENT
    (Books that should have been returned by now)
    """
    
    today = datetime.now()
    
    issue_records = db.query(IssueBook).filter(
        IssueBook.Student_Prn_id == current_student.Prn_id,
        IssueBook.Employee_Emp_Id == None,
        IssueBook.status == "Overdue",
        IssueBook.due_date < today
    ).all()
    
    result = []
    for record in issue_records:
        result.append(build_issue_book_response(record, db))
    
    return result


@router.get("/students/my-book-history")
def get_my_book_history_student(
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """
    Get complete book borrowing history for logged-in STUDENT
    """
    
    total_issued = db.query(IssueBook).filter(
        IssueBook.Student_Prn_id == current_student.Prn_id,
        IssueBook.Employee_Emp_Id == None
    ).count()
    
    total_returned = db.query(IssueBook).filter(
        IssueBook.Student_Prn_id == current_student.Prn_id,
        IssueBook.Employee_Emp_Id == None,
        IssueBook.status == "Returned"
    ).count()
    
    currently_issued = db.query(IssueBook).filter(
        IssueBook.Student_Prn_id == current_student.Prn_id,
        IssueBook.Employee_Emp_Id == None,
        IssueBook.status == "Issued"
    ).count()
    
    today = datetime.now()
    overdue_count = db.query(IssueBook).filter(
        IssueBook.Student_Prn_id == current_student.Prn_id,
        IssueBook.Employee_Emp_Id == None,
        IssueBook.status == "Overdue",
        IssueBook.due_date < today
    ).count()
    
    return {
        "prn_id": current_student.Prn_id,
        "student_name": f"{current_student.first_name} {current_student.last_name}",
        "total_books_borrowed": total_issued,
        "total_books_returned": total_returned,
        "currently_issued": currently_issued,
        "overdue_books": overdue_count
    }


# ==================== EMPLOYEE ENDPOINTS ====================
# IMPORTANT: These show books the EMPLOYEE BORROWED, not books they issued as librarian!

@router.get("/employees/my-borrowed-books", response_model=List[IssueBookDetailResponse])
def get_my_borrowed_books_employee(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db)
):
    """
    Get all books currently borrowed by logged-in EMPLOYEE
    (Books that EMPLOYEE has borrowed and not yet returned)
    
    Query: Employee_Emp_Id = Emp_Id AND Student_Prn_id IS NULL
    """
    
    issue_records = db.query(IssueBook).filter(
        IssueBook.Employee_Emp_Id == current_employee.Emp_Id,
        IssueBook.Student_Prn_id == None,  # Employee borrowed indicator
        IssueBook.status == "Issued"
    ).order_by(IssueBook.issue_time.desc()).offset(skip).limit(limit).all()
    
    result = []
    for record in issue_records:
        result.append(build_issue_book_response(record, db))
    
    return result


@router.get("/employees/my-returned-books", response_model=List[IssueBookDetailResponse])
def get_my_returned_books_employee(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db)
):
    """
    Get all books that EMPLOYEE borrowed and returned
    (Employee's borrowing history)
    """
    
    issue_records = db.query(IssueBook).filter(
        IssueBook.Employee_Emp_Id == current_employee.Emp_Id,
        IssueBook.Student_Prn_id == None,
        IssueBook.status == "Returned"
    ).order_by(IssueBook.returned_date.desc()).offset(skip).limit(limit).all()
    
    result = []
    for record in issue_records:
        result.append(build_issue_book_response(record, db))
    
    return result


@router.get("/employees/my-overdue-books", response_model=List[IssueBookDetailResponse])
def get_my_overdue_books_employee(
    current_employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db)
):
    """
    Get all overdue books that EMPLOYEE borrowed
    (Books the employee should have returned by now)
    """
    
    today = datetime.now()
    
    issue_records = db.query(IssueBook).filter(
        IssueBook.Employee_Emp_Id == current_employee.Emp_Id,
        IssueBook.Student_Prn_id == None,
        IssueBook.status == "Overdue",
        IssueBook.due_date < today
    ).order_by(IssueBook.due_date.asc()).all()
    
    result = []
    for record in issue_records:
        result.append(build_issue_book_response(record, db))
    
    return result


@router.get("/employees/my-book-history")
def get_my_book_history_employee(
    current_employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db)
):
    """
    Get complete book borrowing history for logged-in EMPLOYEE
    (Books they borrowed, not books they issued as librarian)
    """
    
    total_borrowed = db.query(IssueBook).filter(
        IssueBook.Employee_Emp_Id == current_employee.Emp_Id,
        IssueBook.Student_Prn_id == None
    ).count()
    
    total_returned = db.query(IssueBook).filter(
        IssueBook.Employee_Emp_Id == current_employee.Emp_Id,
        IssueBook.Student_Prn_id == None,
        IssueBook.status == "Returned"
    ).count()
    
    currently_borrowed = db.query(IssueBook).filter(
        IssueBook.Employee_Emp_Id == current_employee.Emp_Id,
        IssueBook.Student_Prn_id == None,
        IssueBook.status == "Issued"
    ).count()
    
    today = datetime.now()
    overdue_count = db.query(IssueBook).filter(
        IssueBook.Employee_Emp_Id == current_employee.Emp_Id,
        IssueBook.Student_Prn_id == None,
        IssueBook.status == "Overdue",
        IssueBook.due_date < today
    ).count()
    
    return {
        "emp_id": current_employee.Emp_Id,
        "employee_name": f"{current_employee.First_name} {current_employee.Last_name}",
        "total_books_borrowed": total_borrowed,
        "total_books_returned": total_returned,
        "currently_borrowed": currently_borrowed,
        "overdue_books": overdue_count
    }


# ==================== LIBRARIAN ENDPOINTS ====================

from typing import Optional
from fastapi import Query

@router.get("/librarian/issued-books/all", response_model=List[IssueBookDetailResponse])
def get_all_issued_books(
    limit: int = Query(10, ge=1, le=50),
    last_id: Optional[int] = Query(None),
    borrower_type: Optional[str] = Query(None, description="Filter by 'student' or 'employee'"),
    db: Session = Depends(get_db),
    current_librarian = Depends(get_current_librarian)
):
    """
    Get all currently issued books in the system (Librarian only)
    Infinite scroll using cursor pagination
    """

    query = db.query(IssueBook).filter(
        IssueBook.status == "Issued"
    )

    # 🔥 Cursor filter
    if last_id:
        query = query.filter(IssueBook.issue_book_id < last_id)

    # 🔥 Borrower filter
    if borrower_type == "student":
        query = query.filter(
            IssueBook.Student_Prn_id.isnot(None),
            IssueBook.Employee_Emp_Id.is_(None)
        )

    elif borrower_type == "employee":
        query = query.filter(
            IssueBook.Student_Prn_id.is_(None),
            IssueBook.Employee_Emp_Id.isnot(None)
        )

    # 🔥 IMPORTANT: Order by DESC for cursor
    issue_records = query.order_by(
        IssueBook.issue_book_id.desc()
    ).limit(limit).all()

    result = []
    for record in issue_records:
        result.append(build_issue_book_response(record, db))

    return result


from typing import Optional
from datetime import datetime
from fastapi import Query

@router.get("/librarian/returned-books/all", response_model=List[IssueBookDetailResponse])
def get_all_returned_books(
    limit: int = Query(10, ge=1, le=50),
    last_returned_date: Optional[datetime] = Query(None),
    borrower_type: Optional[str] = Query(None, description="Filter by 'student' or 'employee'"),
    db: Session = Depends(get_db),
    current_librarian = Depends(get_current_librarian)
):
    """
    Get all returned books in the system (Librarian only)
    Infinite scroll using cursor pagination
    """

    query = db.query(IssueBook).filter(
        IssueBook.status == "Returned"
    )

    # 🔥 Cursor filter
    if last_returned_date:
        query = query.filter(
            IssueBook.returned_date < last_returned_date
        )

    # 🔥 Borrower filter
    if borrower_type == "student":
        query = query.filter(
            IssueBook.Student_Prn_id.isnot(None),
            IssueBook.Employee_Emp_Id.is_(None)
        )

    elif borrower_type == "employee":
        query = query.filter(
            IssueBook.Student_Prn_id.is_(None),
            IssueBook.Employee_Emp_Id.isnot(None)
        )

    # 🔥 IMPORTANT
    issue_records = query.order_by(
        IssueBook.returned_date.desc()
    ).limit(limit).all()

    result = []
    for record in issue_records:
        result.append(build_issue_book_response(record, db))

    return result

@router.get("/librarian/returned-books-gnererate-pdf/all", response_model=List[IssueBookDetailResponse])
def get_all_returned_books_generate_pdf(
    borrower_type: Optional[str] = Query(None, description="Filter by 'student' or 'employee'"),
    db: Session = Depends(get_db),
    current_librarian = Depends(get_current_librarian)
):
    """
    Get all returned books (No Pagination)
    """

    query = db.query(IssueBook).filter(
        IssueBook.status == "Returned"
    )

    # Borrower filter
    if borrower_type == "student":
        query = query.filter(
            IssueBook.Student_Prn_id.isnot(None),
            IssueBook.Employee_Emp_Id.is_(None)
        )

    elif borrower_type == "employee":
        query = query.filter(
            IssueBook.Student_Prn_id.is_(None),
            IssueBook.Employee_Emp_Id.isnot(None)
        )

    # Fetch all records (no limit)
    issue_records = query.order_by(
        IssueBook.returned_date.desc()
    ).all()

    result = []
    for record in issue_records:
        result.append(build_issue_book_response(record, db))

    return result


from typing import Optional
from fastapi import Query
from datetime import datetime

@router.get("/librarian/overdue-books/all")
def get_all_overdue_books(
    limit: int = Query(10, ge=1, le=50),
    last_id: Optional[int] = Query(None),
    borrower_type: Optional[str] = Query(None, description="Filter by 'student' or 'employee'"),
    db: Session = Depends(get_db),
    current_librarian = Depends(get_current_librarian)
):
    """
    Get overdue books (Infinite Scroll Version)
    """

    today = datetime.now()

    query = db.query(IssueBook).filter(
        IssueBook.status == "Overdue",
        IssueBook.due_date < today
    )

    # 🔥 Cursor filter
    if last_id:
        query = query.filter(IssueBook.issue_book_id < last_id)

    # 🔥 Borrower filter
    if borrower_type == "student":
        query = query.filter(
            IssueBook.Student_Prn_id.isnot(None),
            IssueBook.Employee_Emp_Id.is_(None)
        )
    elif borrower_type == "employee":
        query = query.filter(
            IssueBook.Student_Prn_id.is_(None),
            IssueBook.Employee_Emp_Id.isnot(None)
        )

    # 🔥 Order by DESC for cursor
    issue_records = query.order_by(
        IssueBook.issue_book_id.desc()
    ).limit(limit).all()

    books_list = []

    for record in issue_records:

        # Determine borrower
        if record.Student_Prn_id:
            borrower = db.query(Student).filter(
                Student.Prn_id == record.Student_Prn_id
            ).first()

            borrower_type_value = "student"
            borrower_id = record.Student_Prn_id
            borrower_name = f"{borrower.first_name} {borrower.last_name}" if borrower else "Unknown"
            borrower_email = borrower.gmail if borrower else None
            borrower_phone = borrower.Phone_no if borrower else None

        else:
            borrower = db.query(Employee).filter(
                Employee.Emp_Id == record.Employee_Emp_Id
            ).first()

            borrower_type_value = "employee"
            borrower_id = record.Employee_Emp_Id
            borrower_name = f"{borrower.First_name} {borrower.Last_name}" if borrower else "Unknown"
            borrower_email = borrower.Gmail if borrower else None
            borrower_phone = borrower.Phone_no if borrower else None

        # Book
        book = db.query(Book).filter(
            Book.Accession_number == record.Books_Accession_number
        ).first()

        # Authors
        author_junctions = db.query(AuthorJunction).filter(
            AuthorJunction.Books_Accession_number == record.Books_Accession_number
        ).all()

        authors = []
        for junction in author_junctions:
            author = db.query(Author).filter(
                Author.Author_id == junction.Author_id
            ).first()
            if author:
                authors.append(author.Author_name)

        books_list.append({
            "issue_book_id": record.issue_book_id,
            "issue_time": record.issue_time,
            "due_date": record.due_date,
            "borrower_type": borrower_type_value,
            "borrower_id": borrower_id,
            "borrower_name": borrower_name,
            "borrower_email": borrower_email,
            "borrower_phone": borrower_phone,
            "book_accession_number": record.Books_Accession_number,
            "book_title": book.Title if book else None,
            "book_authors": ", ".join(authors) if authors else None
        })

    return {
        "count": len(books_list),
        "books": books_list
    }

@router.get("/librarian/issued-books/by-student/{prn_id}", response_model=List[IssueBookDetailResponse])
def get_issued_books_by_student(
    prn_id: int,
    db: Session = Depends(get_db),
    current_librarian = Depends(get_current_librarian)
):
    """
    Get all issued books for a specific student (Librarian only)
    """
    
    student = db.query(Student).filter(Student.Prn_id == prn_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with PRN {prn_id} not found"
        )
    
    issue_records = db.query(IssueBook).filter(
        IssueBook.Student_Prn_id == prn_id,
        IssueBook.Employee_Emp_Id == None,
        IssueBook.status == "Issued"
    ).all()
    
    result = []
    for record in issue_records:
        result.append(build_issue_book_response(record, db))
    
    return result


@router.get("/librarian/issued-books/by-employee/{emp_id}", response_model=List[IssueBookDetailResponse])
def get_issued_books_by_employee(
    emp_id: int,
    db: Session = Depends(get_db),
    current_librarian = Depends(get_current_librarian)
):
    """
    Get all issued books for a specific employee (Librarian only)
    Shows books the EMPLOYEE borrowed (not books they issued as librarian)
    """
    
    employee = db.query(Employee).filter(Employee.Emp_Id == emp_id).first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee with ID {emp_id} not found"
        )
    
    issue_records = db.query(IssueBook).filter(
        IssueBook.Employee_Emp_Id == emp_id,
        IssueBook.Student_Prn_id == None,
        IssueBook.status == "Issued"
    ).all()
    
    result = []
    for record in issue_records:
        result.append(build_issue_book_response(record, db))
    
    return result


@router.get("/librarian/books/due-today", response_model=List[IssueBookDetailResponse])
def get_books_due_today(
    db: Session = Depends(get_db),
    current_librarian = Depends(get_current_librarian)
):
    """
    Get all books that are due for return today (Librarian only)
    Includes both student and employee borrowers
    """
    
    today = date.today()
    
    issue_records = db.query(IssueBook).filter(
        (IssueBook.status == "Issued") | (IssueBook.status == "Overdue"),
        IssueBook.due_date >= datetime.combine(today, datetime.min.time()),
        IssueBook.due_date < datetime.combine(today, datetime.max.time())
    ).all()
    
    result = []
    for record in issue_records:
        result.append(build_issue_book_response(record, db))
    
    return result


@router.get("/librarian/issued-books/stats", response_model=IssuedBookStats)
def get_issued_books_statistics(
    db: Session = Depends(get_db),
    current_librarian = Depends(get_current_librarian)
):
    """
    Get statistics about issued books (Librarian only)
    Includes both students and employees
    """
    
    total_issued = db.query(IssueBook).count()
    
    total_returned = db.query(IssueBook).filter(
        IssueBook.status == "Returned"
    ).count()
    
    total_available = db.query(Book).filter(
        Book.Status == "Available"
    ).count()
    
    currently_issued = db.query(IssueBook).filter(
        IssueBook.status == "Issued"
    ).count()
    
    today = datetime.now()
    total_overdue = db.query(IssueBook).filter(
        IssueBook.status == "Overdue",
        IssueBook.due_date < today
    ).count()
    
    # Additional stats by borrower type
    student_issued = db.query(IssueBook).filter(
        IssueBook.status == "Issued",
        IssueBook.Student_Prn_id != None,
        IssueBook.Employee_Emp_Id == None
    ).count()
    
    employee_issued = db.query(IssueBook).filter(
        IssueBook.status == "Issued",
        IssueBook.Student_Prn_id == None,
        IssueBook.Employee_Emp_Id != None
    ).count()
    
    return {
        "total_issued": total_issued,
        "total_available": total_available,
        "total_returned": total_returned,
        "total_overdue": total_overdue,
        "currently_issued": currently_issued,
        "student_issued": student_issued,
        "employee_issued": employee_issued
    }