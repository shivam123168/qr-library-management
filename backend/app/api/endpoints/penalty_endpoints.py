"""
Penalty Management Endpoints - COMPLETE
View, pay, and manage penalties/fines for BOTH students AND employees

Database Logic:
- Student penalties: From issue_book where Student_Prn_id NOT NULL
- Employee penalties: From issue_book where Employee_Emp_Id NOT NULL and Student_Prn_id IS NULL
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.core.database import get_db
from app.api.deps_with_librarian import get_current_student, get_current_employee, get_current_librarian
from app.models.student import Student
from app.models.employee import Employee
from app.models.book import Book
from app.models.issue_book import IssueBook
from app.models.penalty import Penalty
from app.models.penalty_amount import PenaltyAmount
from app.models.penalty_excuse import PenaltyExcuse


router = APIRouter()


# ==================== SCHEMAS ====================

class PenaltyResponse(BaseModel):
    """Schema for penalty details"""
    penalty_id: int
    amount: float
    status: str
    issue_book_id: int
    borrower_type: str  # "student" or "employee"
    borrower_id: int
    borrower_name: str
    book_title: str
    days_overdue: int
    excuse: Optional[str] = None
    
    class Config:
        from_attributes = True


class PayPenaltyRequest(BaseModel):
    """Request to mark penalty as paid"""
    penalty_id: int


class WaivePenaltyRequest(BaseModel):
    penalty_excuse_id: int  # ID of existing excuse to link to this penalty when waiving


# ==================== STUDENT ENDPOINTS ====================

@router.get("/penalties/student/my-penalties")
def get_my_penalties_student(
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """
    Get all penalties for logged-in STUDENT
    """
    
    # Get all issue records for this student
    issue_records = db.query(IssueBook).filter(
        IssueBook.Student_Prn_id == current_student.Prn_id,
        IssueBook.Employee_Emp_Id == None  # Student borrowing
    ).all()
    
    penalties_list = []
    total_unpaid = 0.0
    
    for issue in issue_records:
        penalty = db.query(Penalty).filter(
            Penalty.issue_book_id == issue.issue_book_id
        ).first()
        
        if penalty:
            
            # Get book
            book = db.query(Book).filter(
                Book.Accession_number == issue.Books_Accession_number
            ).first()
            
            # Get excuse if any
            excuse_text = None
            if penalty.penalty_excuse_id:
                excuse = db.query(PenaltyExcuse).filter(
                    PenaltyExcuse.penalty_excuse_id == penalty.penalty_excuse_id
                ).first()
                if excuse:
                    excuse_text = excuse.excuse
            
            # Calculate days overdue
            from datetime import datetime
            days_overdue = 0
            if issue.returned_date:
                if issue.returned_date > issue.due_date:
                    days_overdue = (issue.returned_date - issue.due_date).days
            
            penalties_list.append({
                "penalty_id": penalty.penalty_id,
                "amount": penalty.total_amount,
                "status": penalty.Amount_status,
                "issue_book_id": issue.issue_book_id,
                "book_accession_number": issue.Books_Accession_number,
                "book_title": book.Title if book else "Unknown",
                "issue_date": issue.issue_time,
                "due_date": issue.due_date,
                "returned_date": issue.returned_date,
                "days_overdue": days_overdue,
                "excuse": excuse_text
            })
            

    return {
        "penalties": penalties_list
    }


# @router.get("/penalties/student/my-unpaid")
# def get_my_unpaid_penalties_student(
#     current_student: Student = Depends(get_current_student),
#     db: Session = Depends(get_db)
# ):
#     """
#     Get only unpaid penalties for logged-in STUDENT
#     """
    
#     issue_records = db.query(IssueBook).filter(
#         IssueBook.Student_Prn_id == current_student.Prn_id,
#         IssueBook.Employee_Emp_Id == None
#     ).all()
    
#     unpaid_penalties = []
#     total_amount = 0.0
    
#     for issue in issue_records:
#         penalty = db.query(Penalty).filter(
#             Penalty.issue_book_id == issue.issue_book_id,
#             Penalty.Amount_status == "not paid"
#         ).first()
        
#         if penalty:
#             penalty_amount_obj = db.query(PenaltyAmount).filter(
#                 PenaltyAmount.id == penalty.penalty_amount_id
#             ).first()
            
#             amount = penalty_amount_obj.penalty_amount if penalty_amount_obj else 0.0
#             total_amount += amount
            
#             book = db.query(Book).filter(
#                 Book.Accession_number == issue.Books_Accession_number
#             ).first()
            
#             unpaid_penalties.append({
#                 "penalty_id": penalty.penalty_id,
#                 "amount": amount,
#                 "book_title": book.Title if book else "Unknown",
#                 "issue_date": issue.issue_time,
#                 "due_date": issue.due_date
#             })
    
#     return {
#         "borrower_type": "student",
#         "borrower_id": current_student.Prn_id,
#         "borrower_name": f"{current_student.first_name} {current_student.last_name}",
#         "unpaid_count": len(unpaid_penalties),
#         "total_amount": total_amount,
#         "penalties": unpaid_penalties
#     }


# ==================== EMPLOYEE ENDPOINTS ====================

@router.get("/penalties/employee/my-penalties")
def get_my_penalties_employee(
    current_employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db)
):
    """
    Get all penalties for logged-in EMPLOYEE
    (Penalties from books THEY borrowed, not books they issued as librarian)
    """
    
    # Get all issue records where this employee was the borrower
    issue_records = db.query(IssueBook).filter(
        IssueBook.Employee_Emp_Id == current_employee.Emp_Id,
        IssueBook.Student_Prn_id == None  # Employee borrowing indicator
    ).all()
    
    penalties_list = []
    total_unpaid = 0.0
    
    for issue in issue_records:
        penalty = db.query(Penalty).filter(
            Penalty.issue_book_id == issue.issue_book_id
        ).first()
        
        if penalty:
            
            # Get book
            book = db.query(Book).filter(
                Book.Accession_number == issue.Books_Accession_number
            ).first()
            
            # Get excuse if any
            excuse_text = None
            if penalty.penalty_excuse_id:
                excuse = db.query(PenaltyExcuse).filter(
                    PenaltyExcuse.penalty_excuse_id == penalty.penalty_excuse_id
                ).first()
                if excuse:
                    excuse_text = excuse.excuse
            
            # Calculate days overdue
            from datetime import datetime
            days_overdue = 0
            if issue.returned_date:
                if issue.returned_date > issue.due_date:
                    days_overdue = (issue.returned_date - issue.due_date).days
            
            penalties_list.append({
                "penalty_id": penalty.penalty_id,
                "amount": penalty.total_amount,
                "status": penalty.Amount_status,
                "issue_book_id": issue.issue_book_id,
                "book_accession_number": issue.Books_Accession_number,
                "book_title": book.Title if book else "Unknown",
                "issue_date": issue.issue_time,
                "due_date": issue.due_date,
                "returned_date": issue.returned_date,
                "days_overdue": days_overdue,
                "excuse": excuse_text
            })
            
    
    return {
        "penalties": penalties_list
    }


# @router.get("/penalties/employee/my-unpaid")
# def get_my_unpaid_penalties_employee(
#     current_employee: Employee = Depends(get_current_employee),
#     db: Session = Depends(get_db)
# ):
#     """
#     Get only unpaid penalties for logged-in EMPLOYEE
#     """
    
#     issue_records = db.query(IssueBook).filter(
#         IssueBook.Employee_Emp_Id == current_employee.Emp_Id,
#         IssueBook.Student_Prn_id == None
#     ).all()
    
#     unpaid_penalties = []
#     total_amount = 0.0
    
#     for issue in issue_records:
#         penalty = db.query(Penalty).filter(
#             Penalty.issue_book_id == issue.issue_book_id,
#             Penalty.Amount_status == "not paid"
#         ).first()
        
#         if penalty:
#             penalty_amount_obj = db.query(PenaltyAmount).filter(
#                 PenaltyAmount.id == penalty.penalty_amount_id
#             ).first()
            
#             amount = penalty_amount_obj.penalty_amount if penalty_amount_obj else 0.0
#             total_amount += amount
            
#             book = db.query(Book).filter(
#                 Book.Accession_number == issue.Books_Accession_number
#             ).first()
            
#             unpaid_penalties.append({
#                 "penalty_id": penalty.penalty_id,
#                 "amount": amount,
#                 "book_title": book.Title if book else "Unknown",
#                 "issue_date": issue.issue_time,
#                 "due_date": issue.due_date
#             })
    
#     return {
#         "borrower_type": "employee",
#         "borrower_id": current_employee.Emp_Id,
#         "borrower_name": f"{current_employee.First_name} {current_employee.Last_name}",
#         "unpaid_count": len(unpaid_penalties),
#         "total_amount": total_amount,
#         "penalties": unpaid_penalties
#     }


# ==================== LIBRARIAN ENDPOINTS ====================

@router.get("/penalties/all")
def get_all_penalties(
    limit: int = Query(10, ge=1, le=50),
    last_id: Optional[int] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    borrower_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_librarian = Depends(get_current_librarian)
):
    """
    Get all penalties in the system (Librarian only)
    Includes BOTH student and employee penalties
    """
    
    
    query = db.query(Penalty)

    #  Add cursor filter
    if last_id:
        query = query.filter(Penalty.penalty_id < last_id)

    if status_filter:
        query = query.filter(Penalty.Amount_status == status_filter)

    #  IMPORTANT: Order by DESC for cursor pagination
    penalties = query.order_by(
        Penalty.penalty_id.desc()
    ).limit(limit).all()
    
    
    
    penalties_list = []
    
    for penalty in penalties:
        # Get issue record
        issue = db.query(IssueBook).filter(
            IssueBook.issue_book_id == penalty.issue_book_id
        ).first()
        
        if not issue:
            continue
        
        # Determine borrower type
        if issue.Student_Prn_id:
            # Student penalty
            borrower_type_value = "student"
            borrower = db.query(Student).filter(
                Student.Prn_id == issue.Student_Prn_id,
                IssueBook.Employee_Emp_Id == None  # Ensure it's a student borrowing record
             
                
            ).first()
            borrower_id = issue.Student_Prn_id
            borrower_name = f"{borrower.first_name} {borrower.last_name}" if borrower else "Unknown"
            borrower_email = borrower.gmail if borrower else None
            borrower_phone = borrower.Phone_no if borrower else None
        else:
            # Employee penalty
            borrower_type_value = "employee"
            borrower = db.query(Employee).filter(
                Employee.Emp_Id == issue.Employee_Emp_Id
            ).first()
            borrower_id = issue.Employee_Emp_Id
            borrower_name = f"{borrower.First_name} {borrower.Last_name}" if borrower else "Unknown"
            borrower_email = borrower.Gmail if borrower else None
            borrower_phone = borrower.Phone_no if borrower else None
        
        # Filter by borrower_type if specified
        if borrower_type and borrower_type != borrower_type_value:
            continue
        
        # Get book
        book = db.query(Book).filter(
            Book.Accession_number == issue.Books_Accession_number
        ).first()
        

        
        # Get excuse if any
        excuse_text = None
        if penalty.penalty_excuse_id:
            excuse = db.query(PenaltyExcuse).filter(
                PenaltyExcuse.penalty_excuse_id == penalty.penalty_excuse_id
            ).first()
            if excuse:
                excuse_text = excuse.excuse
        
        # # Calculate days overdue
        # from datetime import datetime
        #  today = datetime.now()
        # days_overdue = 0
        # if issue.returned_date and issue.returned_date > issue.due_date:
        #     days_overdue = (issue.returned_date - issue.due_date).days
        
        penalties_list.append({
            "penalty_id": penalty.penalty_id,
            "amount": penalty.total_amount,
            "issued_date": issue.issue_time,
            "due_date": issue.due_date,
            "status": penalty.Amount_status,
            "borrower_type": borrower_type_value,
            "borrower_id": borrower_id,
            "borrower_name": borrower_name,
            "borrower_email": borrower_email,
            "borrower_phone": borrower_phone,
            "book_accession_number": issue.Books_Accession_number,
            "book_title": book.Title if book else "Unknown",
            # "days_overdue": days_overdue,
            "excuse": excuse_text
        })
    
    return {
        "total": len(penalties_list),
        "penalties": penalties_list
    }

@router.get("/penalties_for_PDF/all")
def get_all_penalties_for_PDF(
    status_filter: Optional[str] = Query(None, alias="status"),
    borrower_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_librarian = Depends(get_current_librarian)
):
    """
    Get all penalties (No Pagination)
    Includes BOTH student and employee penalties
    """

    query = db.query(Penalty)

    # Status filter
    if status_filter:
        query = query.filter(Penalty.Amount_status == status_filter)

    # Fetch all penalties (no limit)
    penalties = query.order_by(
        Penalty.penalty_id.desc()
    ).all()

    penalties_list = []

    for penalty in penalties:
        # Get issue record
        issue = db.query(IssueBook).filter(
            IssueBook.issue_book_id == penalty.issue_book_id
        ).first()

        if not issue:
            continue

        # Determine borrower type
        if issue.Student_Prn_id:
            borrower_type_value = "student"
            borrower = db.query(Student).filter(
                Student.Prn_id == issue.Student_Prn_id
            ).first()

            borrower_id = issue.Student_Prn_id
            borrower_name = f"{borrower.first_name} {borrower.last_name}" if borrower else "Unknown"
            borrower_email = borrower.gmail if borrower else None
            borrower_phone = borrower.Phone_no if borrower else None

        else:
            borrower_type_value = "employee"
            borrower = db.query(Employee).filter(
                Employee.Emp_Id == issue.Employee_Emp_Id
            ).first()

            borrower_id = issue.Employee_Emp_Id
            borrower_name = f"{borrower.First_name} {borrower.Last_name}" if borrower else "Unknown"
            borrower_email = borrower.Gmail if borrower else None
            borrower_phone = borrower.Phone_no if borrower else None

        # Filter by borrower_type
        if borrower_type and borrower_type != borrower_type_value:
            continue

        # Get book
        book = db.query(Book).filter(
            Book.Accession_number == issue.Books_Accession_number
        ).first()

        # Get excuse
        excuse_text = None
        if penalty.penalty_excuse_id:
            excuse = db.query(PenaltyExcuse).filter(
                PenaltyExcuse.penalty_excuse_id == penalty.penalty_excuse_id
            ).first()
            if excuse:
                excuse_text = excuse.excuse

        penalties_list.append({
            "penalty_id": penalty.penalty_id,
            "amount": penalty.total_amount,
            "issued_date": issue.issue_time,
            "due_date": issue.due_date,
            "status": penalty.Amount_status,
            "borrower_type": borrower_type_value,
            "borrower_id": borrower_id,
            "borrower_name": borrower_name,
            "borrower_email": borrower_email,
            "borrower_phone": borrower_phone,
            "book_accession_number": issue.Books_Accession_number,
            "book_title": book.Title if book else "Unknown",
            "excuse": excuse_text
        })

    return {
        "total": len(penalties_list),
        "penalties": penalties_list
    }

@router.get("/penalties/student/{prn_id}")
def get_penalties_by_student(
    prn_id: int,
    db: Session = Depends(get_db),
    current_librarian = Depends(get_current_librarian)
):
    """
    Get all penalties for a specific STUDENT (Librarian only)
    """
    
    # Verify student exists
    student = db.query(Student).filter(Student.Prn_id == prn_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with PRN {prn_id} not found"
        )
    
    # Get all issue records for this student
    issue_records = db.query(IssueBook).filter(
        IssueBook.Student_Prn_id == prn_id,
        IssueBook.Employee_Emp_Id == None
    ).all()
    
    penalties_list = []
    total_unpaid = 0.0
    
    for issue in issue_records:
        penalty = db.query(Penalty).filter(
            Penalty.issue_book_id == issue.issue_book_id
        ).first()
        
        if penalty:
            
            book = db.query(Book).filter(
                Book.Accession_number == issue.Books_Accession_number
            ).first()
            
            excuse_text = None
            if penalty.penalty_excuse_id:
                excuse = db.query(PenaltyExcuse).filter(
                    PenaltyExcuse.penalty_excuse_id == penalty.penalty_excuse_id
                ).first()
                if excuse:
                    excuse_text = excuse.excuse
            
            penalties_list.append({
                "penalty_id": penalty.penalty_id,
                "amount": penalty.total_amount,
                "status": penalty.Amount_status,
                "book_accession_number": issue.Books_Accession_number,
                "book_title": book.Title if book else "Unknown",
                "issue_date": issue.issue_time,
                "due_date": issue.due_date,
                "returned_date": issue.returned_date,
                "excuse": excuse_text
            })
            
            if penalty.Amount_status == "not paid":
                total_unpaid += int(penalty.total_amount)
    
    return {
        "borrower_type": "student",
        "borrower_id": prn_id,
        "borrower_name": f"{student.first_name} {student.last_name}",
        "borrower_email": student.gmail,
        "borrower_phone": student.Phone_no,
        "total_penalties": len(penalties_list),
        "total_unpaid_amount": total_unpaid,
        "penalties": penalties_list
    }


@router.get("/penalties/employee/{emp_id}")
def get_penalties_by_employee(
    emp_id: int,
    db: Session = Depends(get_db),
    current_librarian = Depends(get_current_librarian)
):
    """
    Get all penalties for a specific EMPLOYEE (Librarian only)
    Shows penalties from books the employee BORROWED
    """
    
    # Verify employee exists
    employee = db.query(Employee).filter(Employee.Emp_Id == emp_id).first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee with ID {emp_id} not found"
        )
    
    # Get all issue records where this employee was the borrower
    issue_records = db.query(IssueBook).filter(
        IssueBook.Employee_Emp_Id == emp_id,
        IssueBook.Student_Prn_id == None
    ).all()
    
    penalties_list = []
    total_unpaid = 0.0
    
    for issue in issue_records:
        penalty = db.query(Penalty).filter(
            Penalty.issue_book_id == issue.issue_book_id
        ).first()
        
        if penalty:
            
            book = db.query(Book).filter(
                Book.Accession_number == issue.Books_Accession_number
            ).first()
            
            excuse_text = None
            if penalty.penalty_excuse_id:
                excuse = db.query(PenaltyExcuse).filter(
                    PenaltyExcuse.penalty_excuse_id == penalty.penalty_excuse_id
                ).first()
                if excuse:
                    excuse_text = excuse.excuse
            
            penalties_list.append({
                "penalty_id": penalty.penalty_id,
                "amount": penalty.total_amount,
                "status": penalty.Amount_status,
                "book_accession_number": issue.Books_Accession_number,
                "book_title": book.Title if book else "Unknown",
                "issue_date": issue.issue_time,
                "due_date": issue.due_date,
                "returned_date": issue.returned_date,
                "excuse": excuse_text
            })
            
            if penalty.Amount_status == "not paid":
                total_unpaid += int(penalty.total_amount)
    
    return {
        "borrower_type": "employee",
        "borrower_id": emp_id,
        "borrower_name": f"{employee.First_name} {employee.Last_name}",
        "borrower_email": employee.Gmail,
        "borrower_phone": employee.Phone_no,
        "total_penalties": len(penalties_list),
        "total_unpaid_amount": total_unpaid,
        "penalties": penalties_list
    }


@router.put("/penalties/{penalty_id}/mark-paid")
def mark_penalty_as_paid(
    penalty_id: int,
    db: Session = Depends(get_db),
    current_librarian = Depends(get_current_librarian)
):
    """
    Mark a penalty as paid (Librarian only)
    Works for both student and employee penalties
    """
    
    penalty = db.query(Penalty).filter(Penalty.penalty_id == penalty_id).first()
    
    if not penalty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Penalty with ID {penalty_id} not found"
        )
    if penalty.Amount_status == "no penalty":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Penalty is waived, cannot mark as paid"
        )
    
    if penalty.Amount_status == "paid":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Penalty is already marked as paid"
        )
    
    # Update status
    penalty.Amount_status = "paid"
    db.commit()
    
 
    
    
    return {
        "message": "Penalty marked as paid successfully",
        "penalty_id": penalty_id,
        "amount": penalty.total_amount,
        "status": "paid"
    }

@router.put("/penalties/{penalty_id}/waive")
def waive_penalty(
    penalty_id: int,
    request: WaivePenaltyRequest,
    db: Session = Depends(get_db),
    current_librarian = Depends(get_current_librarian)
):
    """
    Waive a penalty using existing excuse ID
    """

    penalty = db.query(Penalty).filter(
        Penalty.penalty_id == penalty_id
    ).first()

    if not penalty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Penalty with ID {penalty_id} not found"
        )

    #  Get existing excuse using ID
    excuse = db.query(PenaltyExcuse).filter(
        PenaltyExcuse.penalty_excuse_id == request.penalty_excuse_id
    ).first()

    if not excuse:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Excuse not found"
        )

    if penalty.Amount_status == "paid":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Penalty is already paid, cannot excuse"
        )
    if penalty.Amount_status == "no penalty":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Penalty is already waived"
        )
    #  Update penalty
    penalty.Amount_status = "no penalty"
    penalty.penalty_excuse_id = excuse.penalty_excuse_id

    db.commit()

    return {
        "message": "Penalty waived successfully",
        "penalty_id": penalty_id,
        "excuse_id": excuse.penalty_excuse_id,
        "excuse": excuse.excuse,
        "status": "no penalty"
    }


@router.get("/penalties/statistics")
def get_penalty_statistics(
    db: Session = Depends(get_db),
    current_librarian = Depends(get_current_librarian)
):
    """
    Get penalty statistics (Librarian only)
    Includes breakdown by borrower type
    """
    
    total_penalties = db.query(Penalty).count()
    
    paid_count = db.query(Penalty).filter(Penalty.Amount_status == "paid").count()
    unpaid_count = db.query(Penalty).filter(Penalty.Amount_status == "not paid").count()
    waived_count = db.query(Penalty).filter(Penalty.Amount_status == "no penalty").count()
    
    # Calculate total unpaid amount and breakdown by type
    unpaid_penalties = db.query(Penalty).filter(Penalty.Amount_status == "not paid").all()
    total_unpaid_amount = 0.0
    student_unpaid_amount = 0.0
    employee_unpaid_amount = 0.0
    student_penalty_count = 0
    employee_penalty_count = 0
    
    for penalty in unpaid_penalties:
        penalty_amount_obj = db.query(PenaltyAmount).filter(
            PenaltyAmount.id == penalty.penalty_amount_id
        ).first()
        
        if penalty_amount_obj:
            amount = penalty_amount_obj.penalty_amount
            total_unpaid_amount += amount
            
            # Determine borrower type
            issue = db.query(IssueBook).filter(
                IssueBook.issue_book_id == penalty.issue_book_id
            ).first()
            
            if issue:
                if issue.Student_Prn_id:
                    student_unpaid_amount += amount
                    student_penalty_count += 1
                else:
                    employee_unpaid_amount += amount
                    employee_penalty_count += 1
    
    return {
        "total_penalties": total_penalties,
        "paid": paid_count,
        "unpaid": unpaid_count,
        "waived": waived_count,
        "total_unpaid_amount": total_unpaid_amount,
        "student_penalties": {
            "count": student_penalty_count,
            "unpaid_amount": student_unpaid_amount
        },
        "employee_penalties": {
            "count": employee_penalty_count,
            "unpaid_amount": employee_unpaid_amount
        }
    }