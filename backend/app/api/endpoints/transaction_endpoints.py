"""
Book Transaction Endpoints - COMPLETE
Supports BOTH Student AND Employee Borrowing
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional

from app.core.database import get_db
from app.api.deps_with_librarian import get_current_librarian, get_current_employee
from app.models.student import Student
from app.models.employee import Employee
from app.models.book import Book
from app.models.issue_book import IssueBook
from app.models.penalty import Penalty
from app.models.penalty_amount import PenaltyAmount
from app.schemas.transaction_schemas import (
    IssueBookRequest,
    IssueBookResponse,
    ReturnBookRequest,
    ReturnBookResponse,
    RenewBookRequest,
    RenewBookResponse
)
from pydantic import BaseModel


router = APIRouter()


# ==================== NEW SCHEMAS FOR EMPLOYEE BORROWING ====================

class IssueBookToEmployeeRequest(BaseModel):
    """Schema for issuing a book to an employee"""
    employee_id: int
    book_accession_number: int
    days_limit: int
    
    class Config:
        json_schema_extra = {
            "example": {
                "employee_id": 200,
                "book_accession_number": 5001,
                "days_limit": 14
            }
        }


# ==================== ISSUE BOOK TO STUDENT ====================

@router.post("/transactions/issue-book/student", response_model=IssueBookResponse)
def issue_book_to_student(
    request: IssueBookRequest,
    db: Session = Depends(get_db),
    current_librarian: Employee = Depends(get_current_librarian)
):
    """
    Issue a book to a STUDENT (Librarian only)
    
    Frontend Flow:
    1. Scan student QR → Get PRN
    2. Scan book QR → Get Accession Number
    3. Librarian selects day limit
    4. Submit to this API
    """
    
    # Validate student exists
    student = db.query(Student).filter(Student.Prn_id == request.student_prn_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with PRN {request.student_prn_id} not found"
        )
    
    # Validate book exists
    book = db.query(Book).filter(Book.Accession_number == request.book_accession_number).first()
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Book with accession number {request.book_accession_number} not found"
        )
    
    # Check if book is available
    if book.Status != "Available":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Book is not available. Current status: {book.Status}"
        )
    
    # Check if student already has this book
    existing_issue = db.query(IssueBook).filter(
        IssueBook.Student_Prn_id == request.student_prn_id,
        IssueBook.Books_Accession_number == request.book_accession_number,
        IssueBook.status == "Issued"
    ).first()
    
    if existing_issue:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student already has this book issued"
        )
    
    # Check for unpaid penalties
    overdue_issues = db.query(IssueBook).filter(
        IssueBook.Student_Prn_id == request.student_prn_id,
        IssueBook.status == "Overdue",
        IssueBook.due_date < datetime.now()
    ).all()
    
    for overdue_issue in overdue_issues:
        penalty = db.query(Penalty).filter(
            Penalty.issue_book_id == overdue_issue.issue_book_id,
            Penalty.Amount_status == "not paid"
        ).first()
        
        if penalty:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Student has unpaid penalties. Please clear dues before issuing new books."
            )
    
    # Calculate return date
    issue_time = datetime.now()
    due_date = issue_time + timedelta(days=request.days_limit)
    
    # Create issue record
    new_issue = IssueBook(
        issue_time=issue_time,
        due_date=due_date,
        returned_date=None,
        status="Issued",
        Student_Prn_id=request.student_prn_id,  # Student borrower
        Books_Accession_number=request.book_accession_number,
        # Employee_Emp_Id=current_librarian.Emp_Id  # Librarian who issued
    )
    
    db.add(new_issue)
    book.Status = "Issued"
    
    db.commit()
    db.refresh(new_issue)
    
    return IssueBookResponse(
        issue_book_id=new_issue.issue_book_id,
        student_prn_id=student.Prn_id,
        student_name=f"{student.first_name} {student.last_name}",
        book_accession_number=book.Accession_number,
        book_title=book.Title,
        # issued_by=f"{current_librarian.First_name} {current_librarian.Last_name}",
        issue_time=new_issue.issue_time,
        due_date=new_issue.due_date,
        days_allowed=request.days_limit,
        message="Book issued successfully to student"
    )


# ==================== ISSUE BOOK TO EMPLOYEE ====================

@router.post("/transactions/issue-book/employee")
def issue_book_to_employee(
    request: IssueBookToEmployeeRequest,
    db: Session = Depends(get_db),
    current_librarian: Employee = Depends(get_current_librarian)
):
    """
    Issue a book to an EMPLOYEE (Librarian only)
    
    Employees can also borrow books from the library!
    
    Frontend Flow:
    1. Scan employee QR → Get Emp_Id
    2. Scan book QR → Get Accession Number
    3. Librarian selects day limit
    4. Submit to this API
    
    NOTE: Due to schema limitations, for employee borrows:
    - Student_Prn_id = NULL (indicates employee borrow)
    - Employee_Emp_Id = Borrowing employee's ID
    - We lose track of "who issued it" but track "who borrowed it"
    """
    
    # Validate employee exists
    employee = db.query(Employee).filter(Employee.Emp_Id == request.employee_id).first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee with ID {request.employee_id} not found"
        )
    
    # Validate book exists
    book = db.query(Book).filter(Book.Accession_number == request.book_accession_number).first()
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Book with accession number {request.book_accession_number} not found"
        )
    
    # Check if book is available
    if book.Status != "Available":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Book is not available. Current status: {book.Status}"
        )
    
    # Check if employee already has this book
    existing_issue = db.query(IssueBook).filter(
        IssueBook.Student_Prn_id == None,  # Employee borrow
        IssueBook.Employee_Emp_Id == request.employee_id,
        IssueBook.Books_Accession_number == request.book_accession_number,
        IssueBook.status == "Issued"
    ).first()
    
    if existing_issue:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Employee already has this book issued"
        )    
        
        # Check for unpaid penalties
    overdue_issues = db.query(IssueBook).filter(
        IssueBook.Employee_Emp_Id == request.employee_id,
        IssueBook.status == "Overdue",
        IssueBook.due_date < datetime.now()
    ).all()
    
    for overdue_issue in overdue_issues:
        penalty = db.query(Penalty).filter(
            Penalty.issue_book_id == overdue_issue.issue_book_id,
            Penalty.Amount_status == "not paid"
        ).first()
        
        if penalty:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Employees has unpaid penalties. Please clear dues before issuing new books."
            )
    

    
    # Calculate return date
    issue_time = datetime.now()
    due_date = issue_time + timedelta(days=request.days_limit)
    
    # Create issue record for EMPLOYEE
    new_issue = IssueBook(
        issue_time=issue_time,
        due_date=due_date,
        returned_date=None,
        status="Issued",
        Student_Prn_id=None,  # NULL indicates employee borrow
        Books_Accession_number=request.book_accession_number,
        Employee_Emp_Id=request.employee_id  # Employee borrower (NOT issuer!)
    )
    
    db.add(new_issue)
    book.Status = "Issued"
    
    db.commit()
    db.refresh(new_issue)
    
    return {
        "issue_book_id": new_issue.issue_book_id,
        "employee_id": employee.Emp_Id,
        "employee_name": f"{employee.First_name} {employee.Last_name}",
        "book_accession_number": book.Accession_number,
        "book_title": book.Title,
        "issue_time": new_issue.issue_time,
        "due_date": new_issue.due_date,
        "days_allowed": request.days_limit,
        "message": "Book issued successfully to employee",
        "note": "Employee borrowing tracked - issuing librarian not recorded due to schema limitations"
    }


# ==================== RETURN BOOK (STUDENT OR EMPLOYEE) ====================

@router.post("/transactions/return-book", response_model=ReturnBookResponse)
def return_book_from_borrower(
    request: ReturnBookRequest,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee)
):
    """
    Return a book from STUDENT or EMPLOYEE (Employee/Librarian only)
    
    Works for both student and employee borrows!
    
    Frontend Flow:
    1. Scan book QR → Get Accession Number
    2. System auto-detects if student or employee borrowed it
    3. Submit to this API
    """
    
    # Find active issue record for this book
    issue_record = db.query(IssueBook).filter(
        IssueBook.Books_Accession_number == request.book_accession_number,
        IssueBook.status.in_(["Issued", "Overdue"])
    ).first()
    
    if not issue_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No active issue found for book {request.book_accession_number}"
        )
    
    # Determine if student or employee borrowed
    if issue_record.Student_Prn_id:
        # Student borrowed
        borrower_type = "student"
        student = db.query(Student).filter(Student.Prn_id == issue_record.Student_Prn_id).first()
        borrower_name = f"{student.first_name} {student.last_name}"
        borrower_id = student.Prn_id
    else:
        # Employee borrowed
        borrower_type = "employee"
        employee = db.query(Employee).filter(Employee.Emp_Id == issue_record.Employee_Emp_Id).first()
        borrower_name = f"{employee.First_name} {employee.Last_name}"
        borrower_id = employee.Emp_Id
    
    # Get book details
    book = db.query(Book).filter(Book.Accession_number == issue_record.Books_Accession_number).first()
    
    # Calculate return details
    returned_date = datetime.now()
    days_borrowed = (returned_date - issue_record.issue_time).days
    
    days_overdue = (returned_date - issue_record.due_date).days
    is_overdue = returned_date > issue_record.due_date 
    
    # Update issue record
    issue_record.returned_date = returned_date
    issue_record.status = "Returned"
    
    # Update book status
    book.Status = "Available"
    
    db.commit()
    
    # Build message
    if is_overdue:
        message = f"Book returned from {borrower_type}. {days_overdue} days late."
    else:
        message = f"Book returned from {borrower_type} successfully. No penalty."
    
    return {
        "issue_book_id": issue_record.issue_book_id,
        "student_prn_id": borrower_id if borrower_type == "student" else 0,
        "student_name": borrower_name,
        "book_accession_number": book.Accession_number,
        "book_title": book.Title,
        "issue_time": issue_record.issue_time,
        "due_date": issue_record.due_date,
        "returned_date": returned_date,
        "days_borrowed": days_borrowed,
        "days_overdue": days_overdue,
        "is_overdue": is_overdue,
        "message": message,
        "borrower_type": borrower_type  # Extra info
    }


# ==================== RENEW BOOK (STUDENT OR EMPLOYEE) ====================

@router.post("/transactions/renew-book")
def renew_book_for_borrower(
    book_accession_number: int,
    borrower_id: int,
    borrower_type: str,  # "student" or "employee"
    additional_days: int,
    db: Session = Depends(get_db),
    current_librarian: Employee = Depends(get_current_librarian)
):
    """
    Renew/Extend return date for a book (Librarian only)
    Works for both students and employees
    """
    try:
      # Find active issue record
      if borrower_type == "student":
          issue_record = db.query(IssueBook).filter(
              IssueBook.Student_Prn_id == borrower_id,
              IssueBook.Books_Accession_number == book_accession_number,
              IssueBook.status == "Issued"
          ).first()
      elif borrower_type == "employee":
          issue_record = db.query(IssueBook).filter(
              IssueBook.Student_Prn_id == None,
              IssueBook.Employee_Emp_Id == borrower_id,
              IssueBook.Books_Accession_number == book_accession_number,
              IssueBook.status == "Issued"
          ).first()
      else:
          raise HTTPException(
              status_code=status.HTTP_400_BAD_REQUEST,
              detail="borrower_type must be 'student' or 'employee'"
          )
    
      if not issue_record:
          raise HTTPException(
               status_code=status.HTTP_404_NOT_FOUND,
               detail=f"No active issue found for this {borrower_type} and book"
          )
    
       # Check if already overdue
      if datetime.now() > issue_record.due_date:
          raise HTTPException(
              status_code=status.HTTP_400_BAD_REQUEST,
              detail="Cannot renew an overdue book. Please return it first."
          )
    
    except Exception as e:
        print(f"Error in renew_book_for_borrower: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error renewing book: {str(e)}"
        )
    # Get book
    book = db.query(Book).filter(Book.Accession_number == book_accession_number).first()
    
    # Store old return date
    old_return_date = issue_record.due_date
    
    # Calculate new return date
    new_return_date = issue_record.due_date + timedelta(days=additional_days)
    
    # Update issue record
    issue_record.due_date = new_return_date
    
    db.commit()
    
    return {
        "issue_book_id": issue_record.issue_book_id,
        "borrower_type": borrower_type,
        "book_title": book.Title,
        "old_return_date": old_return_date,
        "new_return_date": new_return_date,
        "additional_days": additional_days,
        "message": f"Book renewed successfully for {borrower_type}. New return date: {new_return_date.strftime('%Y-%m-%d')}"
    }


# ==================== GET DAY LIMITS ====================

@router.get("/transactions/day-limits")
def get_available_day_limits(
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee)
):
    """Get all available day limits for book issue"""
    from app.models.day_limit_book import DayLimitBook
    
    day_limits = db.query(DayLimitBook).all()
    
    if not day_limits:
        return {
            "available_limits": [7, 14, 21, 30],
            "message": "Using default day limits"
        }
    
    return {
        "available_limits": [limit.days_limit for limit in day_limits],
        "message": "Day limits from database"
    }