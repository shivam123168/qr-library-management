"""
Test Issue Book View APIs
Tests for students and librarians
"""

import requests

BASE_URL = "http://localhost:8000/api"


def test_student_views():
    """Test student viewing their own issued books"""
    
    print("\n" + "="*70)
    print("TEST 1: STUDENT VIEWING THEIR BOOKS")
    print("="*70)
    
    # Login as student
    print("\n1️⃣  Logging in as student...")
    login_response = requests.post(
        f"{BASE_URL}/auth/login/student",
        json={"prn": 1001, "password": "student123"}
    )
    
    if login_response.status_code != 200:
        print("   ❌ Student login failed!")
        return
    
    student_token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {student_token}"}
    print(f"   ✅ Student logged in")
    
    # Get my issued books
    print("\n2️⃣  Getting my currently issued books...")
    response = requests.get(
        f"{BASE_URL}/students/my-issued-books",
        headers=headers
    )
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        books = response.json()
        print(f"   ✅ Found {len(books)} currently issued books")
        for book in books:
            print(f"      📖 {book['book']['title']}")
            print(f"         Due: {book['return_date'][:10]}")
            if book['days_overdue']:
                print(f"         ⚠️  OVERDUE by {book['days_overdue']} days!")
    
    # Get my returned books
    print("\n3️⃣  Getting my returned books (history)...")
    response = requests.get(
        f"{BASE_URL}/students/my-returned-books",
        headers=headers
    )
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        books = response.json()
        print(f"   ✅ Found {len(books)} returned books in history")
    
    # Get my overdue books
    print("\n4️⃣  Getting my overdue books...")
    response = requests.get(
        f"{BASE_URL}/students/my-overdue-books",
        headers=headers
    )
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        books = response.json()
        if books:
            print(f"   ⚠️  Found {len(books)} overdue books!")
            for book in books:
                print(f"      📖 {book['book']['title']} - {book['days_overdue']} days overdue")
        else:
            print(f"   ✅ No overdue books (Good job!)")
    
    # Get my book history stats
    print("\n5️⃣  Getting my book history statistics...")
    response = requests.get(
        f"{BASE_URL}/students/my-book-history",
        headers=headers
    )
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        stats = response.json()
        print(f"   ✅ Statistics:")
        print(f"      Total borrowed: {stats['total_books_borrowed']}")
        print(f"      Total returned: {stats['total_books_returned']}")
        print(f"      Currently issued: {stats['currently_issued']}")
        print(f"      Overdue: {stats['overdue_books']}")


def test_librarian_views():
    """Test librarian viewing all issued books"""
    
    print("\n" + "="*70)
    print("TEST 2: LIBRARIAN VIEWING ALL BOOKS")
    print("="*70)
    
    # Login as librarian
    print("\n1️⃣  Logging in as librarian...")
    login_response = requests.post(
        f"{BASE_URL}/auth/login/librarian",
        json={"emp_id": 100, "password": "librarian123"}
    )
    
    if login_response.status_code != 200:
        print("   ❌ Librarian login failed!")
        return
    
    librarian_token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {librarian_token}"}
    print(f"   ✅ Librarian logged in")
    
    # Get all issued books
    print("\n2️⃣  Getting all currently issued books in system...")
    response = requests.get(
        f"{BASE_URL}/librarian/issued-books/all",
        headers=headers
    )
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        books = response.json()
        print(f"   ✅ Found {len(books)} currently issued books")
        if books:
            print(f"      Sample: {books[0]['student']['name']} has '{books[0]['book']['title']}'")
    
    # Get all returned books
    print("\n3️⃣  Getting all returned books in system...")
    response = requests.get(
        f"{BASE_URL}/librarian/returned-books/all",
        headers=headers
    )
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        books = response.json()
        print(f"   ✅ Found {len(books)} returned books")
    
    # Get all overdue books
    print("\n4️⃣  Getting all overdue books (IMPORTANT!)...")
    response = requests.get(
        f"{BASE_URL}/librarian/overdue-books/all",
        headers=headers
    )
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        summary = response.json()
        print(f"   ⚠️  OVERDUE SUMMARY:")
        print(f"      Total overdue books: {summary['total_overdue']}")
        print(f"      Students with overdue: {summary['total_students_with_overdue']}")
        print(f"      Total penalty amount: ₹{summary['total_penalty_amount']}")
        
        if summary['books']:
            print(f"\n      Overdue Books List:")
            for book in summary['books'][:5]:  # Show first 5
                print(f"      📖 {book['student_name']} (PRN: {book['Student_Prn_id']})")
                print(f"         Book: {book['book_title']}")
                print(f"         Was due: {book['return_date'][:10]}")
    
    # Get books due today
    print("\n5️⃣  Getting books due today...")
    response = requests.get(
        f"{BASE_URL}/librarian/books/due-today",
        headers=headers
    )
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        books = response.json()
        if books:
            print(f"   ⚠️  {len(books)} books are due for return TODAY!")
            for book in books:
                print(f"      📖 {book['student']['name']} should return '{book['book']['title']}'")
        else:
            print(f"   ✅ No books due today")
    
    # Get statistics
    print("\n6️⃣  Getting system-wide statistics...")
    response = requests.get(
        f"{BASE_URL}/librarian/issued-books/stats",
        headers=headers
    )
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        stats = response.json()
        print(f"   ✅ SYSTEM STATISTICS:")
        print(f"      Total issued (ever): {stats['total_issued']}")
        print(f"      Total returned: {stats['total_returned']}")
        print(f"      Currently issued: {stats['currently_issued']}")
        print(f"      Overdue: {stats['total_overdue']}")


def test_librarian_view_by_student():
    """Test librarian viewing specific student's books"""
    
    print("\n" + "="*70)
    print("TEST 3: LIBRARIAN VIEWING SPECIFIC STUDENT'S BOOKS")
    print("="*70)
    
    # Login as librarian
    print("\n1️⃣  Logging in as librarian...")
    login_response = requests.post(
        f"{BASE_URL}/auth/login/librarian",
        json={"emp_id": 100, "password": "librarian123"}
    )
    
    if login_response.status_code != 200:
        print("   ❌ Librarian login failed!")
        return
    
    librarian_token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {librarian_token}"}
    print(f"   ✅ Librarian logged in")
    
    # Get books for specific student
    prn_id = 1001
    print(f"\n2️⃣  Getting issued books for student PRN {prn_id}...")
    response = requests.get(
        f"{BASE_URL}/librarian/issued-books/by-student/{prn_id}",
        headers=headers
    )
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        books = response.json()
        print(f"   ✅ Student PRN {prn_id} has {len(books)} books currently issued")
        for book in books:
            print(f"      📖 {book['book']['title']}")
            print(f"         Issued: {book['issue_time'][:10]}")
            print(f"         Due: {book['return_date'][:10]}")
            if book['days_overdue']:
                print(f"         ⚠️  OVERDUE by {book['days_overdue']} days!")
            if book['has_penalty']:
                print(f"         💰 Penalty: ₹{book['penalty_amount']} ({book['penalty_status']})")
    elif response.status_code == 404:
        print(f"   ❌ Student not found")


if __name__ == "__main__":
    print("="*70)
    print(" " * 15 + "ISSUE BOOK VIEW API TESTS")
    print("="*70)
    
    test_student_views()
    test_librarian_views()
    test_librarian_view_by_student()
    
    print("\n" + "="*70)
    print("✅ ALL ISSUE BOOK VIEW TESTS COMPLETED")
    print("="*70)
    print("\n💡 TIP: Make sure you have created test issue book data first!")
    print("   Run: python create_test_issue_data.py")