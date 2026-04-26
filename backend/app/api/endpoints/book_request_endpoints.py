"""
Book Request Endpoints - Complete
Both Students AND Employees can request books
Librarians can view and process all requests
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy.orm import joinedload
from app.core.database import get_db
from app.api.deps_with_librarian import get_current_student, get_current_employee, get_current_librarian, get_current_user
from app.models.student import Student
from app.models.employee import Employee
from app.models.book import Book
from app.models.author import Author
from app.models.author_junction import AuthorJunction
from app.models.request_book import RequestBook
from app.models.issue_book import IssueBook
from app.models.employee_post import EmployeePost
from app.schemas.book_request_schemas import (
    BookRequestCreate,
    BookRequestResponse,
    BookRequestDetail,
    ProcessBookRequestRequest
)


router = APIRouter()


# ==================== HELPER FUNCTIONS ====================

def get_librarian_for_processing(db: Session):
    """Get a librarian employee to assign for processing requests"""
    librarian_post = db.query(EmployeePost).filter(
        EmployeePost.post_name == "Librarian"
    ).first()
    
    if not librarian_post:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No librarian position configured in system"
        )
    
    librarian = db.query(Employee).filter(
        Employee.Employee_post_id == librarian_post.Employee_post_id
    ).first()
    
    if not librarian:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No librarian available to process requests"
        )
    
    return librarian


def build_request_detail(request: RequestBook, db: Session) -> dict:
    """Build detailed request information"""
    
    # Determine if this is a student or employee request
    # If Student_Prn_id is set, it's a student request
    # Otherwise, Employee_Emp_Id is the requesting employee
    
    if request.Student_Prn_id:
        # Student request
        requester_type = "student"
        requester = db.query(Student).filter(Student.Prn_id == request.Student_Prn_id).first()
        requester_id = requester.Prn_id
        requester_name = f"{requester.first_name} {requester.last_name}"
        requester_email = requester.gmail
        requester_phone = requester.Phone_no
    else:
        # Employee request (Employee_Emp_Id is the requester)
        requester_type = "employee"
        requester = db.query(Employee).filter(Employee.Emp_Id == request.Employee_Emp_Id).first()
        requester_id = requester.Emp_Id
        requester_name = f"{requester.First_name} {requester.Last_name}"
        requester_email = requester.Gmail
        requester_phone = requester.Phone_no
    
    # Get book details
    book = db.query(Book).filter(
        Book.Accession_number == request.Books_Accession_number
    ).first()
    
    # Get authors
    author_junctions = db.query(AuthorJunction).filter(
        AuthorJunction.Books_Accession_number == book.Accession_number
    ).all()
    
    authors = []
    for junction in author_junctions:
        author = db.query(Author).filter(Author.Author_id == junction.Author_id).first()
        if author:
            authors.append(author.Author_name)
    
    # Get current holder if book is issued
    current_holder_name = None
    current_holder_type = None
    expected_return_date = None
    
    if book.Status == "Issued":
        current_issue = db.query(IssueBook).filter(
            IssueBook.Books_Accession_number == book.Accession_number,
            IssueBook.status == "Issued"
        ).first()
        
        if current_issue:
            holder = db.query(Student).filter(
                Student.Prn_id == current_issue.Student_Prn_id
            ).first()
            
            if holder:
                current_holder_name = f"{holder.first_name} {holder.last_name}"
                current_holder_type = "student"
                expected_return_date = current_issue.due_date
    
    # Check if book is now available
    can_be_processed = book.Status == "Available"
    
    return {
        "request_id": request.request_id,
        "book_accession_number": book.Accession_number,
        "book_title": book.Title,
        "book_authors": authors,
        "current_holder_name": current_holder_name,
        "current_holder_type": current_holder_type,
        "expected_return_date": expected_return_date,
        "requester_id": requester_id,
        "requester_type": requester_type,
        "requester_name": requester_name,
        "requester_email": requester_email,
        "requester_phone": requester_phone,
        "request_time": request.book_request_time,
        "can_be_processed": can_be_processed
    }


# ==================== STUDENT ENDPOINTS ====================

@router.post("/book-requests/student/create", response_model=BookRequestResponse)
def create_book_request_student(
    request: BookRequestCreate,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """
    Create a book request (Student only)
    
    Frontend Flow:
    1. Student searches for book
    2. Sees book is "Available"
    3. Clicks "Request This Book"
    4. Scan book QR → Get accession number
    5. Submit to this API
    """
    
    # Validate book exists
    book = db.query(Book).filter(
        Book.Accession_number == request.book_accession_number
    ).first()
    
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Book with accession number {request.book_accession_number} not found"
        )
    
    # Check if book is issued
    if book.Status == "Issued":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Book is currently issued to another student. You cant request it."
        )
        
    # Check if there is already a pending request for this book
    existing_book_request = db.query(RequestBook).filter(
          RequestBook.Books_Accession_number == request.book_accession_number,
          RequestBook.status == "Pending"
         ).first()

    if existing_book_request:
        raise HTTPException(
           status_code=400,
           detail="This book already has a pending request."
        )

    
    # Check if student already has this book
    existing_issue = db.query(IssueBook).filter(
        IssueBook.Student_Prn_id == current_student.Prn_id,
        IssueBook.Books_Accession_number == request.book_accession_number,
        IssueBook.status == "Issued"
    ).first()
    
    if existing_issue:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have this book issued to you"
        )
    
    # Check if student already requested this book
    existing_request = db.query(RequestBook).filter(
        RequestBook.Student_Prn_id == current_student.Prn_id,
        RequestBook.Books_Accession_number == request.book_accession_number,
        RequestBook.status == "Pending"
    ).first()
    
    if existing_request:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already requested this book. Please wait for it to become available."
        )
    
    # Get librarian for processing
    librarian = get_librarian_for_processing(db)
    
    # Create book request (Student request: Student_Prn_id is set)
    new_request = RequestBook(
        book_request_time=datetime.now(),
        Books_Accession_number=request.book_accession_number,
        Employee_Emp_Id= None,  
        Student_Prn_id=current_student.Prn_id  # Student requesting
    )
    
    db.add(new_request)
    db.commit()
    db.refresh(new_request)
    
    return BookRequestResponse(
        request_id=new_request.request_id,
        book_accession_number=book.Accession_number,
        book_title=book.Title,
        book_status=book.Status,
        requester_id=current_student.Prn_id,
        requester_type="student",
        requester_name=f"{current_student.first_name} {current_student.last_name}",
        request_time=new_request.book_request_time,
        message="Book request submitted successfully. You can get the book from library."
    )


# @router.get("/book-requests/student/my-requests", response_model=List[BookRequestDetail])
# def get_my_book_requests_student(
#     current_student: Student = Depends(get_current_student),
#     db: Session = Depends(get_db)
# ):
#     """
#     Get all book requests made by logged-in STUDENT
#     """
    
#     requests = db.query(RequestBook).filter(
#         RequestBook.Student_Prn_id == current_student.Prn_id
#     ).order_by(RequestBook.book_request_time.desc()).all()
    
#     result = []
#     for req in requests:
#         result.append(build_request_detail(req, db))
    
#     return result

@router.get("/book-requests/student/my-requests/pending", response_model=List[BookRequestDetail])
def get_my_pending_requests_student(
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """
    Get all PENDING book requests made by logged-in STUDENT
    """

    requests = db.query(RequestBook).filter(
        RequestBook.Student_Prn_id == current_student.Prn_id,
        RequestBook.status == "Pending"
    ).order_by(RequestBook.book_request_time.desc()).all()

    result = []
    for req in requests:
        result.append(build_request_detail(req, db))

    return result

@router.get("/book-requests/student/my-requests/approved", response_model=List[BookRequestDetail])
def get_my_approved_requests_student(
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """
    Get all APPROVED book requests made by logged-in STUDENT
    """

    requests = db.query(RequestBook).filter(
        RequestBook.Student_Prn_id == current_student.Prn_id,
        RequestBook.status == "Approved"
    ).order_by(RequestBook.book_request_time.desc()).all()

    result = []
    for req in requests:
        result.append(build_request_detail(req, db))

    return result

@router.get("/book-requests/student/my-requests/rejected", response_model=List[BookRequestDetail])
def get_my_rejected_requests_student(
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """
    Get all REJECTED book requests made by logged-in STUDENT
    """

    requests = db.query(RequestBook).filter(
        RequestBook.Student_Prn_id == current_student.Prn_id,
        RequestBook.status == "Rejected"
    ).order_by(RequestBook.book_request_time.desc()).all()

    result = []
    for req in requests:
        result.append(build_request_detail(req, db))

    return result


# @router.delete("/book-requests/student/{request_id}")
# def cancel_my_book_request_student(
#     request_id: int,
#     current_student: Student = Depends(get_current_student),
#     db: Session = Depends(get_db)
# ):
#     """
#     Cancel my own book request (Student only)
#     """
    
#     book_request = db.query(RequestBook).filter(
#         RequestBook.request_id == request_id,
#         RequestBook.Student_Prn_id == current_student.Prn_id
#     ).first()
    
#     if not book_request:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Book request not found or you don't have permission to cancel it"
#         )
    
#     db.delete(book_request)
#     db.commit()
    
#     return {
#         "message": "Book request cancelled successfully",
#         "request_id": request_id
#     }

@router.put("/book-requests/student/{request_id}")
def cancel_my_book_request_student(
    request_id: int,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """
    Cancel my own book request (Student only)
    Instead of deleting, update status to 'rejected'
    """

    book_request = db.query(RequestBook).filter(
        RequestBook.request_id == request_id,
        RequestBook.Student_Prn_id == current_student.Prn_id
    ).first()

    if not book_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book request not found or you don't have permission"
        )

    # Optional: Prevent cancelling already approved/rejected request
    if book_request.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only pending requests can be cancelled"
        )

    # Update status instead of deleting
    book_request.status = "Rejected"

    db.commit()
    db.refresh(book_request)

    return {
        "message": "Book request cancelled successfully",
        "request_id": request_id,
        "updated_status": book_request.status
    }


# ==================== EMPLOYEE ENDPOINTS ====================

@router.post("/book-requests/employee/create", response_model=BookRequestResponse)
def create_book_request_employee(
    request: BookRequestCreate,
    current_employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db)
):
    """
    Create a book request (Employee only)
    
    Employees can also borrow books from the library!
    
    Frontend Flow:
    1. Employee searches for book
    2. Sees book is "Available"
    3. Clicks "Request This Book"
    4. Scan book QR → Get accession number
    5. Submit to this API
    
    Note: Employee requests are tracked with Student_Prn_id = NULL
          and Employee_Emp_Id = requesting employee's ID
    """
    
    # Validate book exists
    book = db.query(Book).filter(
        Book.Accession_number == request.book_accession_number
    ).first()
    
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Book with accession number {request.book_accession_number} not found"
        )
    
    # Check if book is Issued
    if book.Status == "Issued":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Book is currently Issued. You cant request this book."
        )
    

    # Check if there is already a pending request for this book
    existing_book_request = db.query(RequestBook).filter(
          RequestBook.Books_Accession_number == request.book_accession_number,
          RequestBook.status == "Pending"
         ).first()

    if existing_book_request:
        raise HTTPException(
           status_code=400,
           detail="This book already has a pending request."
        )
        
        
    # Check if employee already requested this book
    # For employee requests: Student_Prn_id is NULL, Employee_Emp_Id is the requester
    existing_request = db.query(RequestBook).filter(
        RequestBook.Student_Prn_id == None,
        RequestBook.Employee_Emp_Id == current_employee.Emp_Id,
        RequestBook.Books_Accession_number == request.book_accession_number,
        RequestBook.status == "Pending"
    ).first()
    
    if existing_request:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already requested this book."
        )
    
    # Create book request (Employee request: Student_Prn_id is NULL, Employee_Emp_Id is requester)
    new_request = RequestBook(
        book_request_time=datetime.now(),
        Books_Accession_number=request.book_accession_number,
        Employee_Emp_Id=current_employee.Emp_Id,  # Employee requesting (not processing!)
        Student_Prn_id=None  # NULL indicates employee request
    )
    
    db.add(new_request)
    db.commit()
    db.refresh(new_request)
    
    return BookRequestResponse(
        request_id=new_request.request_id,
        book_accession_number=book.Accession_number,
        book_title=book.Title,
        book_status=book.Status,
        requester_id=current_employee.Emp_Id,
        requester_type="employee",
        requester_name=f"{current_employee.First_name} {current_employee.Last_name}",
        request_time=new_request.book_request_time,
        message="Book request submitted successfully. You can get the book from library."
    )


# @router.get("/book-requests/employee/my-requests", response_model=List[BookRequestDetail])
# def get_my_book_requests_employee(
#     current_employee: Employee = Depends(get_current_employee),
#     db: Session = Depends(get_db)
# ):
#     """
#     Get all book requests made by logged-in EMPLOYEE
#     """
    
#     # Employee requests have Student_Prn_id = NULL and Employee_Emp_Id = requester
#     requests = db.query(RequestBook).filter(
#         RequestBook.Student_Prn_id == None,
#         RequestBook.Employee_Emp_Id == current_employee.Emp_Id
#     ).order_by(RequestBook.book_request_time.desc()).all()
    
#     result = []
#     for req in requests:
#         result.append(build_request_detail(req, db))
    
#     return result

@router.get("/book-requests/employee/my-requests/pending", response_model=List[BookRequestDetail])
def get_my_pending_requests_employee(
    current_employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db)
):
    """
    Get all PENDING book requests made by logged-in EMPLOYEE
    """

    requests = db.query(RequestBook).filter(
        RequestBook.Student_Prn_id == None,
        RequestBook.Employee_Emp_Id == current_employee.Emp_Id,
        RequestBook.status == "Pending"
    ).order_by(RequestBook.book_request_time.desc()).all()

    return [build_request_detail(req, db) for req in requests]


@router.get("/book-requests/employee/my-requests/approved", response_model=List[BookRequestDetail])
def get_my_approved_requests_employee(
    current_employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db)
):
    """
    Get all APPROVED book requests made by logged-in EMPLOYEE
    """

    requests = db.query(RequestBook).filter(
        RequestBook.Student_Prn_id == None,
        RequestBook.Employee_Emp_Id == current_employee.Emp_Id,
        RequestBook.status == "Approved"
    ).order_by(RequestBook.book_request_time.desc()).all()

    return [build_request_detail(req, db) for req in requests]


@router.get("/book-requests/employee/my-requests/rejected", response_model=List[BookRequestDetail])
def get_my_rejected_requests_employee(
    current_employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db)
):
    """
    Get all REJECTED book requests made by logged-in EMPLOYEE
    """

    requests = db.query(RequestBook).filter(
        RequestBook.Student_Prn_id == None,
        RequestBook.Employee_Emp_Id == current_employee.Emp_Id,
        RequestBook.status == "Rejected"
    ).order_by(RequestBook.book_request_time.desc()).all()

    return [build_request_detail(req, db) for req in requests]


# @router.delete("/book-requests/employee/{request_id}")
# def cancel_my_book_request_employee(
#     request_id: int,
#     current_employee: Employee = Depends(get_current_employee),
#     db: Session = Depends(get_db)
# ):
#     """
#     Cancel my own book request (Employee only)
#     """
    
#     book_request = db.query(RequestBook).filter(
#         RequestBook.request_id == request_id,
#         RequestBook.Student_Prn_id == None,  # Employee request
#         RequestBook.Employee_Emp_Id == current_employee.Emp_Id
#     ).first()
    
#     if not book_request:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Book request not found or you don't have permission to cancel it"
#         )
    
#     db.delete(book_request)
#     db.commit()
    
#     return {
#         "message": "Book request cancelled successfully",
#         "request_id": request_id
#     }

@router.put("/book-requests/employee/{request_id}")
def cancel_my_book_request_employee(
    request_id: int,
    current_employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db)
):
    """
    Cancel my own book request (Employee only)
    Instead of deleting, update status to 'cancelled'
    """

    book_request = db.query(RequestBook).filter(
        RequestBook.request_id == request_id,
        RequestBook.Student_Prn_id.is_(None),  # Employee request
        RequestBook.Employee_Emp_Id == current_employee.Emp_Id
    ).first()

    if not book_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book request not found or you don't have permission"
        )

    # Only pending requests can be cancelled
    if book_request.status != "Pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only pending requests can be cancelled"
        )

    # Update status instead of deleting
    book_request.status = "Rejected"

    db.commit()
    db.refresh(book_request)

    return {
        "message": "Book request cancelled successfully",
        "request_id": request_id,
        "updated_status": book_request.status
    }


# ==================== LIBRARIAN ENDPOINTS ====================

# @router.get("/book-requests/all", response_model=List[BookRequestDetail])
# def get_all_book_requests(
#     skip: int = Query(0, ge=0),
#     limit: int = Query(100, ge=1, le=500),
#     requester_type: Optional[str] = Query(None, description="Filter by 'student' or 'employee'"),
#     db: Session = Depends(get_db),
#     current_librarian = Depends(get_current_librarian)
# ):
#     """
#     Get all book requests in the system (Librarian only)
#     Includes both student and employee requests
#     """
    
#     query = db.query(RequestBook)
    
#     # Filter by requester type if specified
#     if requester_type == "student":
#         query = query.filter(RequestBook.Student_Prn_id != None)
#     elif requester_type == "employee":
#         query = query.filter(RequestBook.Student_Prn_id == None)
    
#     requests = query.order_by(
#         RequestBook.book_request_time.desc()
#     ).offset(skip).limit(limit).all()
    
#     result = []
#     for req in requests:
#         result.append(build_request_detail(req, db))
    
#     return result


@router.get("/book-requests/all/approved", response_model=List[BookRequestDetail])
def get_all_approved_requests(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    requester_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_librarian = Depends(get_current_librarian)
):
    """
    Get all APPROVED book requests
    """

    query = db.query(RequestBook).filter(
        RequestBook.status == "approved"
    )

    if requester_type == "student":
        query = query.filter(RequestBook.Student_Prn_id.isnot(None))
    elif requester_type == "employee":
        query = query.filter(RequestBook.Student_Prn_id.is_(None))

    requests = query.order_by(
        RequestBook.book_request_time.desc()
    ).offset(skip).limit(limit).all()

    return [build_request_detail(req, db) for req in requests]

@router.get("/book-requests/all/rejected", response_model=List[BookRequestDetail])
def get_all_rejected_requests(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    requester_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_librarian = Depends(get_current_librarian)
):
    """
    Get all REJECTED book requests
    """

    query = db.query(RequestBook).filter(
        RequestBook.status == "rejected"
    )

    if requester_type == "student":
        query = query.filter(RequestBook.Student_Prn_id.isnot(None))
    elif requester_type == "employee":
        query = query.filter(RequestBook.Student_Prn_id.is_(None))

    requests = query.order_by(
        RequestBook.book_request_time.desc()
    ).offset(skip).limit(limit).all()

    return [build_request_detail(req, db) for req in requests]


# from typing import Optional
# from fastapi import Query

@router.get("/book-requests/all/pending")
def get_pending_requests(
    last_id: Optional[int] = None,
    limit: int = Query(10, ge=1, le=50),
    requester_type: Optional[str] = Query(
        None,
        description="student or employee"
    ),
    db: Session = Depends(get_db),
    current_librarian = Depends(get_current_librarian)
):

    
    query = db.query(RequestBook).filter(
        RequestBook.status == "pending"
    )

    #  Filter by requester type
    if requester_type == "student":
        query = query.filter(RequestBook.Student_Prn_id.isnot(None))

    elif requester_type == "employee":
        query = query.filter(RequestBook.Student_Prn_id.is_(None))

    #  Cursor pagination
    if last_id:
        query = query.filter(RequestBook.request_id < last_id)



    requests = query.options(
      joinedload(RequestBook.student),
      joinedload(RequestBook.employee),
      joinedload(RequestBook.book)
    ).order_by(
       RequestBook.request_id.desc()
    ).limit(limit).all()
    
    response = []

    for req in requests:

        if req.Student_Prn_id:
            requester_name = f"{req.student.first_name} {req.student.last_name}"
            requester_id = req.Student_Prn_id
            requester_type = "student"
        else:
            requester_name = f"{req.employee.First_name} {req.employee.Last_name}"
            requester_id = req.Employee_Emp_Id
            requester_type = "employee"

        if req.Books_Accession_number:
                book_title = req.book.Title
                
        response.append({
          "request_id": req.request_id,
          "Books_Accession_number": req.Books_Accession_number,
          "Title": book_title,
          "book_request_time": req.book_request_time,
          "requester_id": requester_id,
          "requester_name": requester_name,
          "requester_type": requester_type
       })

    return response


@router.post("/book-requests/{request_id}/process")
def process_book_request(
    request_id: int,
    process_request: ProcessBookRequestRequest,
    db: Session = Depends(get_db),
    current_librarian: Employee = Depends(get_current_librarian)
):
    """
    Process a book request (Librarian only)
    Works for both student and employee requests
    
    Actions:
    - "issue": Issue the book to the requesting student/employee
    - "cancel": Cancel/reject the request
    """
    
    # Get the book request
    book_request = db.query(RequestBook).filter(
        RequestBook.request_id == request_id
    ).first()
    
    if not book_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Book request with ID {request_id} not found"
        )
    
    # Determine requester type and ID
    if book_request.Student_Prn_id:
        requester_type = "student"
        requester_id = book_request.Student_Prn_id
        requester = db.query(Student).filter(Student.Prn_id == requester_id).first()
        requester_name = f"{requester.first_name} {requester.last_name}"
    else:
        requester_type = "employee"
        requester_id = book_request.Employee_Emp_Id
        requester = db.query(Employee).filter(Employee.Emp_Id == requester_id).first()
        requester_name = f"{requester.First_name} {requester.Last_name}"
    
    if process_request.action == "issue":
        # Issue the book
        if not process_request.days_limit:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="days_limit is required when issuing a book"
            )
        
        # Check if book is available
        book = db.query(Book).filter(
            Book.Accession_number == book_request.Books_Accession_number
        ).first()
        
        if book.Status != "Available":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Book is not available. Current status: {book.Status}"
            )
        
        # Issue the book
        issue_time = datetime.now()
        due_date = issue_time + timedelta(days=process_request.days_limit)
        
        new_issue = IssueBook(
            issue_time=issue_time,
            due_date=due_date,
            returned_date=None,
            status="Issued",
            Student_Prn_id=book_request.Student_Prn_id if requester_type == "student" else None,
            Employee_Emp_Id=book_request.Employee_Emp_Id if requester_type == "employee" else None,
            Books_Accession_number=book_request.Books_Accession_number
        )
        
        db.add(new_issue)
        
        # Update book status
        book.Status = "Issued"
        book_request.status = "Approved"
        
        
        db.commit()
        
        return {
            "message": f"Book issued successfully to {requester_type} {requester_name}",
            "action": "issued",
            "request_id": request_id,
            "requester_type": requester_type,
            "requester_id": requester_id,
            "requester_name": requester_name,
            "book_title": book.Title,
            "return_date": due_date
        }
    
    elif process_request.action == "cancel":
        # Cancel/reject the request
        book_request.status = "Rejected"
        db.commit()
        
        return {
            "message": f"Book request cancelled for {requester_type} {requester_name}",
            "action": "cancelled",
            "request_id": request_id,
            "requester_type": requester_type
        }
    
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid action. Must be 'issue' or 'cancel'"
        )

@router.put("/book-requests/{request_id}/reject")
def reject_book_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_librarian: Employee = Depends(get_current_librarian)
):
    """
    Reject a book request (Librarian only)

    This will permanently delete the request from RequestBook table.
    Works for both student and employee requests.
    """

    # Get the book request
    book_request = db.query(RequestBook).filter(
        RequestBook.request_id == request_id
    ).first()

    if not book_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Book request with ID {request_id} not found"
        )

    # Determine requester type
    if book_request.Student_Prn_id:
        requester_type = "student"
        requester_id = book_request.Student_Prn_id
        requester = db.query(Student).filter(
            Student.Prn_id == requester_id
        ).first()
        requester_name = f"{requester.first_name} {requester.last_name}"
    else:
        requester_type = "employee"
        requester_id = book_request.Employee_Emp_Id
        requester = db.query(Employee).filter(
            Employee.Emp_Id == requester_id
        ).first()
        requester_name = f"{requester.First_name} {requester.Last_name}"

    # Get book info
    book = db.query(Book).filter(
        Book.Accession_number == book_request.Books_Accession_number
    ).first()

    book_title = book.Title if book else None

    # 🔥 Update status instead of deleting
    book_request.status = "Rejected"
    db.commit()

    return {
        "message": f"Book request rejected successfully",
        "action": "rejected",
        "request_id": request_id,
        "requester_type": requester_type,
        "requester_id": requester_id,
        "requester_name": requester_name,
        "book_title": book_title
    }


# @router.get("/book-requests/statistics")
# def get_book_request_statistics(
#     db: Session = Depends(get_db),
#     current_librarian = Depends(get_current_librarian)
# ):
#     """
#     Get statistics about book requests (Librarian only)
#     """
    
#     total_requests = db.query(RequestBook).count()
#     student_requests = db.query(RequestBook).filter(RequestBook.Student_Prn_id != None).count()
#     employee_requests = db.query(RequestBook).filter(RequestBook.Student_Prn_id == None).count()
    
#     # Get requests for available books
#     all_requests = db.query(RequestBook).all()
#     can_process_now = 0
    
#     for req in all_requests:
#         book = db.query(Book).filter(
#             Book.Accession_number == req.Books_Accession_number,
#             Book.Status == "Available"
#         ).first()
#         if book:
#             can_process_now += 1
    
#     # Get most requested books
#     from sqlalchemy import func
#     most_requested = db.query(
#         RequestBook.Books_Accession_number,
#         func.count(RequestBook.request_id).label('request_count')
#     ).group_by(
#         RequestBook.Books_Accession_number
#     ).order_by(
#         func.count(RequestBook.request_id).desc()
#     ).limit(5).all()
    
#     most_requested_books = []
#     for book_acc, count in most_requested:
#         book = db.query(Book).filter(Book.Accession_number == book_acc).first()
#         if book:
#             most_requested_books.append({
#                 "book_title": book.Title,
#                 "accession_number": book_acc,
#                 "request_count": count
#             })
    
#     return {
#         "total_pending_requests": total_requests,
#         "student_requests": student_requests,
#         "employee_requests": employee_requests,
#         "can_process_now": can_process_now,
#         "waiting_for_return": total_requests - can_process_now,
#         "most_requested_books": most_requested_books
#     }

@router.get("/book-requests/statistics")
def get_book_request_statistics(
    db: Session = Depends(get_db),
    current_librarian = Depends(get_current_librarian)
):
    """
    Get statistics about book requests (Librarian only)
    Updated according to status-based architecture
    """

    from sqlalchemy import func

    # 🔹 Basic counts
    total_requests = db.query(RequestBook).count()

    pending_requests = db.query(RequestBook).filter(
        RequestBook.status == "Pending"
    ).count()

    approved_requests = db.query(RequestBook).filter(
        RequestBook.status == "Approved"
    ).count()

    rejected_requests = db.query(RequestBook).filter(
        RequestBook.status == "Rejected"
    ).count()

    # 🔹 Requester type counts
    student_requests = db.query(RequestBook).filter(
        RequestBook.Student_Prn_id.isnot(None)
    ).count()

    employee_requests = db.query(RequestBook).filter(
        RequestBook.Student_Prn_id.is_(None)
    ).count()

    # 🔹 Only check PENDING requests for processable books
    pending_list = db.query(RequestBook).filter(
        RequestBook.status == "Pending"
    ).all()

    can_process_now = 0

    for req in pending_list:
        book = db.query(Book).filter(
            Book.Accession_number == req.Books_Accession_number,
            Book.Status == "Available"
        ).first()

        if book:
            can_process_now += 1

    waiting_for_return = pending_requests - can_process_now

    # 🔹 Most requested books (all statuses)
    most_requested = db.query(
        RequestBook.Books_Accession_number,
        func.count(RequestBook.request_id).label("request_count")
    ).group_by(
        RequestBook.Books_Accession_number
    ).order_by(
        func.count(RequestBook.request_id).desc()
    ).limit(5).all()

    most_requested_books = []

    for book_acc, count in most_requested:
        book = db.query(Book).filter(
            Book.Accession_number == book_acc
        ).first()

        if book:
            most_requested_books.append({
                "book_title": book.Title,
                "accession_number": book_acc,
                "request_count": count
            })

    return {
        "total_requests": total_requests,
        "pending_requests": pending_requests,
        "approved_requests": approved_requests,
        "rejected_requests": rejected_requests,
        "student_requests": student_requests,
        "employee_requests": employee_requests,
        "can_process_now": can_process_now,
        "waiting_for_return": waiting_for_return,
        "most_requested_books": most_requested_books
    }
