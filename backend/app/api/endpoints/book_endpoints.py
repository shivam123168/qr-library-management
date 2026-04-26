"""
Book Endpoints - Complete CRUD Operations
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime
from sqlalchemy import func
from app.core.database import get_db
from app.api.deps_with_librarian import get_current_librarian
from app.models.book import Book
from app.models.request_book import RequestBook
from app.models.publisher import Publisher
from app.models.author import Author
from app.models.author_junction import AuthorJunction
from app.schemas.book_schemas import (
    BookCreate,
    BookCreateThroughExcel,
    BookUpdate,
    BookResponse,
    BookDetailResponse
)


router = APIRouter()


# ==================== CREATE ====================

@router.post("/books", response_model=BookResponse, status_code=status.HTTP_201_CREATED)
def create_book(
    book: BookCreate,
    db: Session = Depends(get_db),
    current_librarian = Depends(get_current_librarian)
):
    """
    Create a new book (Librarian only)
    """
    
    # Check if accession number already exists
    existing = db.query(Book).filter(Book.Accession_number == book.Accession_number).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Book with accession number {book.Accession_number} already exists"
        )
    
    # Verify publisher exists
    publisher = db.query(Publisher).filter(Publisher.publisher_id == book.publisher_id).first()
    if not publisher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Publisher with ID {book.publisher_id} not found"
        )
    
    # Verify all authors exist
    for author_id in book.author_ids:
        author = db.query(Author).filter(Author.Author_id == author_id).first()
        if not author:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Author with ID {author_id} not found"
            )
    
    # Create new book
    book_data = book.dict()
    author_ids = book_data.pop('author_ids')  # Remove author_ids as it's not a Book field
    book_data['book_upload_time'] = datetime.now()
    
    new_book = Book(**book_data)
    db.add(new_book)
    db.flush()  # Flush to get the book ID
    
    # Create author junctions
    for author_id in author_ids:
        junction = AuthorJunction(
            Books_Accession_number=new_book.Accession_number,
            Author_id=author_id
        )
        db.add(junction)
    
    db.commit()
    db.refresh(new_book)
    
    return new_book



@router.post("/books_through_excel", response_model=BookResponse, status_code=status.HTTP_201_CREATED)
def create_book_through_excel(
    book: BookCreateThroughExcel,
    db: Session = Depends(get_db),
    current_librarian = Depends(get_current_librarian)
):
    """
    Create a new book (Librarian only)
    """

    # 🔹 Check accession number
    existing = db.query(Book).filter(Book.Accession_number == book.Accession_number).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Book with accession number {book.Accession_number} already exists"
        )

    # 🔹 Get Publisher ID from name
    publisher = db.query(Publisher).filter(
        func.lower(Publisher.publisher_name) == book.publisher_name.lower()
    ).first()

    if not publisher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Publisher '{book.publisher_name}' not found"
        )

    publisher_id = publisher.publisher_id

    # 🔹 Get Author IDs from names
    author_ids = []

    for author_name in book.author_names:
        author = db.query(Author).filter(
            func.lower(Author.Author_name) == author_name.lower()
        ).first()

        if not author:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Author '{author_name}' not found"
            )

        author_ids.append(author.Author_id)

    # 🔹 Prepare book data
    book_data = book.dict()

    # ❗ Remove fields that are NOT in Book table
    book_data.pop("author_names", None)
    book_data.pop("publisher_name", None)
    book_data.pop("author_ids", None)   

    # Add correct DB fields
    book_data["publisher_id"] = publisher_id
    book_data["book_upload_time"] = datetime.now()

    # 🔹 Create Book
    new_book = Book(**book_data)

    db.add(new_book)
    db.flush()  # Get Accession_number before commit

    # 🔹 Insert into Author Junction Table
    for author_id in author_ids:
        junction = AuthorJunction(
            Books_Accession_number=new_book.Accession_number,
            Author_id=author_id
        )
        db.add(junction)

    # 🔹 Commit all changes
    db.commit()
    db.refresh(new_book)

    return new_book


# ==================== READ ====================

@router.get("/books", response_model=List[BookResponse])
def get_all_books(
    last_book_id: Optional[int] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    status_filter: Optional[str] = Query(None, alias="status"),
    book_title: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get books using infinite scroll pagination

    - **last_book_id**: ID of last book from previous request
    - **limit**: Number of records to fetch
    - **status**: Filter by status ('Available' or 'Issued')
    - **book_title**: Search books by title
    """

    query = db.query(Book)

    # Infinite scroll pagination
    if last_book_id:
        query = query.filter(Book.Accession_number > last_book_id)

    # Status filter
    if status_filter:
        query = query.filter(Book.Status == status_filter)

    # Book title search
    if book_title:
        query = query.filter(Book.Title.ilike(f"%{book_title}%"))

    books = query.options(joinedload(Book.publisher)) \
             .order_by(Book.Accession_number) \
             .limit(limit) \
             .all()

    result = []
    for book in books:
       result.append({
         "Accession_number": book.Accession_number,
         "Title": book.Title,
         "total_pages": book.total_pages,
         "Total_Copy": book.Total_Copy,
         "Copy_Number": book.Copy_Number,
         "Book_Cost": book.Book_Cost,
         "Publisher_place": book.Publisher_place,
         "book_upload_time": book.book_upload_time,
         "Status": book.Status,
         "rack_location": book.rack_location,
         "self_location": book.self_location,
         "publisher_id": book.publisher_id,
         "publisher_name": book.publisher.publisher_name if book.publisher else None,  # 👈 HERE
         "author_names": [author.Author_name for author in book.authors]
    })

    return result


@router.get("/books_for_PDF", response_model=List[BookResponse])
def get_all_books_for_PDF(
    status_filter: Optional[str] = Query(None, alias="status"),
    book_title: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get all books (No pagination - useful for reports/PDF)

    - **status**: Filter by status ('Available' or 'Issued')
    - **book_title**: Search books by title
    """

    query = db.query(Book)

    # Status filter
    if status_filter:
        query = query.filter(Book.Status == status_filter)

    # Book title search
    if book_title:
        query = query.filter(Book.Title.ilike(f"%{book_title}%"))

    books = query.options(joinedload(Book.publisher)) \
                 .order_by(Book.Accession_number) \
                 .all()

    result = []
    for book in books:
        result.append({
            "Accession_number": book.Accession_number,
            "Title": book.Title,
            "total_pages": book.total_pages,
            "Total_Copy": book.Total_Copy,
            "Copy_Number": book.Copy_Number,
            "Book_Cost": book.Book_Cost,
            "Publisher_place": book.Publisher_place,
            "book_upload_time": book.book_upload_time,
            "Status": book.Status,
            "rack_location": book.rack_location,
            "self_location": book.self_location,
            "publisher_id": book.publisher_id,
            "publisher_name": book.publisher.publisher_name if book.publisher else None,
            "author_names": [author.Author_name for author in book.authors]
        })

    return result

@router.get("/books_QR_generation", response_model=List[BookResponse])
def get_all_books_QR_generation(
    db: Session = Depends(get_db)
):
    """
    Get all books (No Pagination)

    - **status**: Filter by status ('Available' or 'Issued')
    - **book_title**: Search books by title
    """
    query = db.query(Book)

    # Fetch all books
    books = query.order_by(Book.Accession_number).all()

    return books



@router.get("/books/{accession_number}", response_model=BookDetailResponse)
def get_book_by_accession(
    accession_number: int,
    db: Session = Depends(get_db)
):
    """
    Get book details by accession number
    """
    
    book = db.query(Book).filter(Book.Accession_number == accession_number).first()
    
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Book with accession number {accession_number} not found"
        )
    
    # Get publisher name
    publisher_name = None
    if book.publisher_id:
        publisher = db.query(Publisher).filter(
            Publisher.publisher_id == book.publisher_id
        ).first()
        if publisher:
            publisher_name = publisher.publisher_name
    
    # Get all authors
    authors = []
    junctions = db.query(AuthorJunction).filter(
        AuthorJunction.Books_Accession_number == accession_number
    ).all()
    
    for junction in junctions:
        author = db.query(Author).filter(Author.Author_id == junction.Author_id).first()
        if author:
            authors.append(author.Author_name)
    
    # Create response with relationships
    book_dict = {
        "Accession_number": book.Accession_number,
        "Title": book.Title,
        "total_pages": book.total_pages,
        "Total_Copy": book.Total_Copy,
        "Copy_Number": book.Copy_Number,
        "Book_Cost": book.Book_Cost,
        "Publisher_place": book.Publisher_place,
        "book_upload_time": book.book_upload_time,
        "Status": book.Status,
        "rack_location": book.rack_location,
        "self_location": book.self_location,
        "publisher_id": book.publisher_id,
        "publisher_name": publisher_name,
        "authors": authors
    }
    
    return book_dict


from sqlalchemy import and_

@router.get("/books/search/by-title")
def search_books_by_title(
    title: str = Query(..., min_length=2),
    db: Session = Depends(get_db)
):
    """
    Search books by title
    Only show books that:
    - Are Available
    - Do NOT have any Pending request
    """

    search_term = f"%{title}%"

    # Subquery to check if pending request exists
    pending_request_exists = db.query(RequestBook).filter(
        and_(
            RequestBook.Books_Accession_number == Book.Accession_number,
            RequestBook.status == "Pending"
        )
    ).exists()

    books = db.query(Book).filter(
        Book.Title.like(search_term),
        Book.Status == "Available",
        ~pending_request_exists   # NOT EXISTS
    ).all()

    return books


@router.get("/books/search/by-author")
def search_books_by_author(
    author_name: str = Query(..., min_length=2),
    db: Session = Depends(get_db)
):
    """
    Search books by author name
    """
    
    # Find authors matching the search
    search_term = f"%{author_name}%"
    authors = db.query(Author).filter(Author.Author_name.like(search_term)).all()
    
    if not authors:
        return []
    
    # Get all books by these authors
    books = []
    for author in authors:
        junctions = db.query(AuthorJunction).filter(
            AuthorJunction.Author_id == author.Author_id
        ).all()
        
        for junction in junctions:
            book = db.query(Book).filter(
                Book.Accession_number == junction.Books_Accession_number
            ).first()
            if book and book not in books:
                books.append(book)
    
    return books


@router.get("/books/available/list", response_model=List[BookResponse])
def get_available_books(
    last_accession_number: int | None = Query(None),
    limit: int = Query(2, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Get all available books (not issued)
    Cursor-based infinite scroll pagination
    """
    
    query = db.query(Book).filter(Book.Status == "Available")
    
    # Load next books after the last one received
    if last_accession_number:
        query = query.filter(Book.Accession_number > last_accession_number)
    
    books = query.order_by(Book.Accession_number).limit(limit).all()
    
    return books


@router.get("/books/issued/list", response_model=List[BookResponse])
def get_issued_books(
    last_accession_number: int | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_librarian = Depends(get_current_librarian)
):
    """
    Get issued books using cursor-based pagination (Infinite Scroll)
    """

    query = db.query(Book).filter(Book.Status == "Issued")

    # If last book is provided, load next records
    if last_accession_number:
        query = query.filter(Book.Accession_number > last_accession_number)

    books = query.order_by(Book.Accession_number).limit(limit).all()

    return books


# ==================== UPDATE ====================

@router.put("/books/{accession_number}", response_model=BookResponse)
def update_book(
    accession_number: int,
    book_update: BookUpdate,
    db: Session = Depends(get_db),
    current_librarian = Depends(get_current_librarian)
):
    """
    Update book information (Librarian only)
    """
    
    book = db.query(Book).filter(Book.Accession_number == accession_number).first()
    
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Book with accession number {accession_number} not found"
        )
    
    # Get only provided fields
    update_data = book_update.dict(exclude_unset=True)
    
    # Handle author updates separately
    author_ids = update_data.pop('author_ids', None)
    
    # Verify publisher exists if being updated
    if 'publisher_id' in update_data:
        publisher = db.query(Publisher).filter(
            Publisher.publisher_id == update_data['publisher_id']
        ).first()
        if not publisher:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Publisher with ID {update_data['publisher_id']} not found"
            )
    
    # Update book fields
    for key, value in update_data.items():
        setattr(book, key, value)
    
    # Update authors if provided
    if author_ids is not None:
        # Verify all authors exist
        for author_id in author_ids:
            author = db.query(Author).filter(Author.Author_id == author_id).first()
            if not author:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Author with ID {author_id} not found"
                )
        
        # Delete existing author junctions
        db.query(AuthorJunction).filter(
            AuthorJunction.Books_Accession_number == accession_number
        ).delete()
        
        # Create new author junctions
        for author_id in author_ids:
            junction = AuthorJunction(
                Books_Accession_number=accession_number,
                Author_id=author_id
            )
            db.add(junction)
    
    db.commit()
    db.refresh(book)
    
    return book


# ==================== DELETE ====================

@router.delete("/books/{accession_number}", status_code=status.HTTP_204_NO_CONTENT)
def delete_book(
    accession_number: int,
    db: Session = Depends(get_db),
    current_librarian = Depends(get_current_librarian)
):
    """
    Delete a book (Librarian only)
    Warning: This will also delete related author junctions, issue records, and requests
    """
    
    book = db.query(Book).filter(Book.Accession_number == accession_number).first()
    
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Book with accession number {accession_number} not found"
        )
    
    # Check if book is currently issued
    if book.Status == "Issued":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete a book that is currently issued. Please return the book first."
        )
    
    db.delete(book)
    db.commit()
    
    return None


# ==================== STATISTICS ====================

@router.get("/books/stats/count")
def get_book_count(
    db: Session = Depends(get_db)
):
    """
    Get total number of books with breakdown
    """
    
    total = db.query(Book).count()
    available = db.query(Book).filter(Book.Status == "Available").count()
    issued = db.query(Book).filter(Book.Status == "Issued").count()
    
    # Count by publisher
    publishers = db.query(Publisher).all()
    by_publisher = {}
    for publisher in publishers:
        count = db.query(Book).filter(
            Book.publisher_id == publisher.publisher_id
        ).count()
        by_publisher[publisher.publisher_name] = count
    
    return {
        "total_books": total,
        "available": available,
        "issued": issued,
        "by_publisher": by_publisher
    }