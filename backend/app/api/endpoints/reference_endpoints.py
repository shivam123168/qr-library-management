"""
Reference Tables Endpoints
APIs for Branch, Department, Publishers, Authors, etc.
All endpoints require librarian authentication
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.api.deps_with_librarian import get_current_librarian
from app.models.branch import Branch
from app.models.department import Department
from app.models.publisher import Publisher
from app.models.author import Author
from app.models.employee_post import EmployeePost
from app.models.penalty_amount import PenaltyAmount
from app.models.penalty_excuse import PenaltyExcuse
from app.models.day_limit_book import DayLimitBook
from app.schemas.reference_schemas import (
    BranchCreate, BranchResponse,
    DepartmentCreate, DepartmentResponse,
    PublisherCreate, PublisherResponse,
    AuthorCreate, AuthorResponse,
    EmployeePostCreate, EmployeePostResponse,
    PenaltyAmountCreate, PenaltyAmountResponse,
    PenaltyExcuseCreate, PenaltyExcuseResponse,
    DayLimitBookCreate, DayLimitBookResponse
)


router = APIRouter()


# ==================== BRANCH ====================

@router.get("/branches", response_model=List[BranchResponse])
def get_all_branches(
    db: Session = Depends(get_db)
):
    """Get all branches"""
    branches = db.query(Branch).all()
    return branches


@router.post("/branches", response_model=BranchResponse, status_code=status.HTTP_201_CREATED)
def create_branch(
    branch: BranchCreate,
    db: Session = Depends(get_db),
    current_librarian = Depends(get_current_librarian)
):
    """Create a new branch (Librarian only)"""
    
    # Check if branch already exists
    existing = db.query(Branch).filter(Branch.Branch_name == branch.Branch_name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Branch '{branch.Branch_name}' already exists"
        )
    
    new_branch = Branch(**branch.model_dump())
    db.add(new_branch)
    db.commit()
    db.refresh(new_branch)
    return new_branch


@router.delete("/branches/{branch_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_branch(
    branch_id: int,
    db: Session = Depends(get_db),
    current_librarian = Depends(get_current_librarian)
):
    """Delete a branch (Librarian only)"""
    
    branch = db.query(Branch).filter(Branch.Branch_id == branch_id).first()
    if not branch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Branch with ID {branch_id} not found"
        )
    
    db.delete(branch)
    db.commit()
    return None


# ==================== DEPARTMENT ====================

@router.get("/departments", response_model=List[DepartmentResponse])
def get_all_departments(
    db: Session = Depends(get_db)
):
    """Get all departments"""
    departments = db.query(Department).all()
    return departments


@router.post("/departments", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
def create_department(
    department: DepartmentCreate,
    db: Session = Depends(get_db),
    current_librarian = Depends(get_current_librarian)
):
    """Create a new department (Librarian only)"""
    
    # Check if department already exists
    existing = db.query(Department).filter(Department.department_name == department.department_name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Department '{department.department_name}' already exists"
        )
    
    new_department = Department(**department.model_dump())
    db.add(new_department)
    db.commit()
    db.refresh(new_department)
    return new_department


@router.delete("/departments/{department_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_department(
    department_id: int,
    db: Session = Depends(get_db),
    current_librarian = Depends(get_current_librarian)
):
    """Delete a department (Librarian only)"""
    
    department = db.query(Department).filter(Department.Department_id == department_id).first()
    if not department:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Department with ID {department_id} not found"
        )
    
    db.delete(department)
    db.commit()
    return None


# ==================== PUBLISHER ====================

@router.get("/publishers", response_model=List[PublisherResponse])
def get_all_publishers(
    db: Session = Depends(get_db)
):
    """Get all publishers"""
    publishers = db.query(Publisher).all()
    return publishers


@router.post("/publishers", response_model=PublisherResponse, status_code=status.HTTP_201_CREATED)
def create_publisher(
    publisher: PublisherCreate,
    db: Session = Depends(get_db),
    current_librarian = Depends(get_current_librarian)
):
    """Create a new publisher (Librarian only)"""
    
    # Check if publisher already exists
    existing = db.query(Publisher).filter(Publisher.publisher_name == publisher.publisher_name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Publisher '{publisher.publisher_name}' already exists"
        )
    
    new_publisher = Publisher(**publisher.model_dump())
    db.add(new_publisher)
    db.commit()
    db.refresh(new_publisher)
    return new_publisher


@router.delete("/publishers/{publisher_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_publisher(
    publisher_id: int,
    db: Session = Depends(get_db),
    current_librarian = Depends(get_current_librarian)
):
    """Delete a publisher (Librarian only)"""
    
    publisher = db.query(Publisher).filter(Publisher.publisher_id == publisher_id).first()
    if not publisher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Publisher with ID {publisher_id} not found"
        )
    
    db.delete(publisher)
    db.commit()
    return None


# ==================== AUTHOR ====================

@router.get("/authors", response_model=List[AuthorResponse])
def get_all_authors(
    db: Session = Depends(get_db)
):
    """Get all authors"""
    authors = db.query(Author).all()
    return authors


@router.post("/authors", response_model=AuthorResponse, status_code=status.HTTP_201_CREATED)
def create_author(
    author: AuthorCreate,
    db: Session = Depends(get_db),
    current_librarian = Depends(get_current_librarian)
):
    """Create a new author (Librarian only)"""
    
    # Check if author already exists
    existing = db.query(Author).filter(Author.Author_name == author.Author_name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Author '{author.Author_name}' already exists"
        )
    
    new_author = Author(**author.model_dump())
    db.add(new_author)
    db.commit()
    db.refresh(new_author)
    return new_author


@router.delete("/authors/{author_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_author(
    author_id: int,
    db: Session = Depends(get_db),
    current_librarian = Depends(get_current_librarian)
):
    """Delete an author (Librarian only)"""
    
    author = db.query(Author).filter(Author.Author_id == author_id).first()
    if not author:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Author with ID {author_id} not found"
        )
    
    db.delete(author)
    db.commit()
    return None


# ==================== EMPLOYEE POST ====================

@router.get("/employee-posts", response_model=List[EmployeePostResponse])
def get_all_employee_posts(
    db: Session = Depends(get_db)
):
    """Get all employee posts"""
    posts = db.query(EmployeePost).all()
    return posts


@router.post("/employee-posts", response_model=EmployeePostResponse, status_code=status.HTTP_201_CREATED)
def create_employee_post(
    post: EmployeePostCreate,
    db: Session = Depends(get_db),
    current_librarian = Depends(get_current_librarian)
):
    existing = db.query(EmployeePost).filter(EmployeePost.post_name == post.post_name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Employee post '{post.post_name}' already exists"
        )
    
    new_post = EmployeePost(post_name=post.post_name)
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    return new_post


@router.delete("/employee-posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_librarian = Depends(get_current_librarian)
):
    """Delete an employee post (Librarian only)"""
    
    post = db.query(EmployeePost).filter(EmployeePost.Employee_post_id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee post with ID {post_id} not found"
        )
    
    db.delete(post)
    db.commit()
    return None


# ==================== PENALTY AMOUNT ====================

@router.get("/penalty-amounts", response_model=List[PenaltyAmountResponse])
def get_all_penalty_amounts(
    db: Session = Depends(get_db)
):
    """Get all penalty amounts"""
    amounts = db.query(PenaltyAmount).all()
    return amounts


@router.post("/penalty-amounts", response_model=PenaltyAmountResponse, status_code=status.HTTP_201_CREATED)
def create_penalty_amount(
    amount: PenaltyAmountCreate,
    db: Session = Depends(get_db),
    current_librarian = Depends(get_current_librarian)
):
    """Create a new penalty amount (Librarian only)"""
    
    new_amount = PenaltyAmount(**amount.model_dump())
    db.add(new_amount)
    db.commit()
    db.refresh(new_amount)
    return new_amount


@router.delete("/penalty-amounts/{amount_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_penalty_amount(
    amount_id: int,
    db: Session = Depends(get_db),
    current_librarian = Depends(get_current_librarian)
):
    """Delete a penalty amount (Librarian only)"""
    
    amount = db.query(PenaltyAmount).filter(PenaltyAmount.id == amount_id).first()
    if not amount:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Penalty amount with ID {amount_id} not found"
        )
    
    db.delete(amount)
    db.commit()
    return None


# ==================== PENALTY EXCUSE ====================

@router.get("/penalty-excuses", response_model=List[PenaltyExcuseResponse])
def get_all_penalty_excuses(
    db: Session = Depends(get_db)
):
    """Get all penalty excuses"""
    excuses = db.query(PenaltyExcuse).all()
    return excuses


@router.post("/penalty-excuses", response_model=PenaltyExcuseResponse, status_code=status.HTTP_201_CREATED)
def create_penalty_excuse(
    excuse: PenaltyExcuseCreate,
    db: Session = Depends(get_db),
    current_librarian = Depends(get_current_librarian)
):
    """Create a new penalty excuse (Librarian only)"""
    
    new_excuse = PenaltyExcuse(**excuse.model_dump())
    db.add(new_excuse)
    db.commit()
    db.refresh(new_excuse)
    return new_excuse


@router.delete("/penalty-excuses/{excuse_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_penalty_excuse(
    excuse_id: int,
    db: Session = Depends(get_db),
    current_librarian = Depends(get_current_librarian)
):
    """Delete a penalty excuse (Librarian only)"""
    
    excuse = db.query(PenaltyExcuse).filter(PenaltyExcuse.penalty_excuse_id == excuse_id).first()
    if not excuse:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Penalty excuse with ID {excuse_id} not found"
        )
    
    db.delete(excuse)
    db.commit()
    return None


# ==================== DAY LIMIT BOOK ====================

@router.get("/day-limit", response_model=List[DayLimitBookResponse])
def get_day_limit(
    db: Session = Depends(get_db)
):
    """Get current day limit for book borrowing"""
    
    day_limit = db.query(DayLimitBook).all()
    if not day_limit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Day limit not configured"
        )
    return day_limit


@router.post("/day-limit", response_model=DayLimitBookResponse, status_code=status.HTTP_201_CREATED)
def create_or_update_day_limit(
    day_limit: DayLimitBookCreate,
    db: Session = Depends(get_db),
    current_librarian = Depends(get_current_librarian)
):
    """
    Create day limit for book borrowing (Librarian only)
    Multiple day limits allowed
    """

    # Always create new row
    new_day_limit = DayLimitBook(**day_limit.model_dump())

    db.add(new_day_limit)
    db.commit()
    db.refresh(new_day_limit)

    return new_day_limit



@router.delete("/day-limit/{day_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_day_limit(
    day_id: int,
    db: Session = Depends(get_db),
    current_librarian = Depends(get_current_librarian)
):
    """Delete day limit configuration (Librarian only)"""
    
    day_limit = db.query(DayLimitBook).filter(DayLimitBook.day_id == day_id).first()
    if not day_limit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Day limit with ID {day_id} not found"
        )
    
    db.delete(day_limit)
    db.commit()
    return None