const apiBaseUrl = `https://qr-library-management-production.up.railway.app`;
const toggleBtn = document.querySelector('.toggle_btn')
const toggleBtnIcon = document.querySelector('.toggle_btn i')
const dropDownManue = document.querySelector('.dropdown_manue')
const searchInput = document.getElementById("searchInput");
const suggestionsBox = document.getElementById("suggestions");

toggleBtn.onclick = function () {
    dropDownManue.classList.toggle('open')
    const isOpen = dropDownManue.classList.contains('open')

    toggleBtnIcon.classList = isOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-bars'
}

// logout function
function logout() {
    // Remove token
    localStorage.removeItem("access_token");

    // (Optional) Remove other user data
    localStorage.removeItem("name");
    localStorage.removeItem("token_type");

    // Redirect to login page
    window.location.href = "librarian_login.html";
}



searchInput.addEventListener("input", async () => {
    const query = searchInput.value;

    if (query.length < 1) {
        suggestionsBox.style.display = "none";
        return;
    }

    const response = await fetch(`${apiBaseUrl}/api/books/search/by-title?title=${query}`);
    const books = await response.json();

    suggestionsBox.innerHTML = "";

    books.forEach(book => {
        const div = document.createElement("div");
        div.classList.add("suggestion-item");

        div.textContent ="Copy No:" + book.Copy_Number + " Title:" + book.Title + " Rack:" + book.rack_location + " Self:" + book.self_location;




        suggestionsBox.appendChild(div);
    });

    suggestionsBox.style.display = books.length ? "block" : "none";
});


// Employee Page info get JS
document.addEventListener("DOMContentLoaded", async function () {

    const token = localStorage.getItem("access_token");

    // 🚨 If not logged in → redirect
    if (!token) {
        window.location.href = "librarian_login.html";
        return;
    }

    try {
        const response = await fetch(`${apiBaseUrl}/api/employees/my-profile`, {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            }
        });

        // 🔴 If token expired or invalid
        if (response.status === 401) {
            alert("Session expired. Please login again.");
            localStorage.clear();
            window.location.href = "librarian_login.html";
            return;
        }

        if (!response.ok) {
            console.error("Server error:", response.status);
            return;
        }

        const data = await response.json();

        if (!response.ok) {
            console.error("Error:", data);
            alert("Failed to load profile.");
            return;
        }

      

        setText("short_name", data.First_name + " " + data.Last_name);


        setText("department", data.department_name || "N/A");

      


        function setText(id, value) {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value ?? "";
            } else {
                console.warn("Element not found:", id);
            }
        }

        loadIssuedBooks(); // load the issued books
        loadReturnedBooks(); // load the returned books


    } catch (error) {
        console.error("Error:", error);

        // If token expired or invalid → logout
        localStorage.removeItem("access_token");
        window.location.href = "librarian_login.html";
    }

});





async function IssueStudentBook() {

    const studentId = document.getElementById("StudentID").value.trim();
    const bookId = document.getElementById("BookAccessation").value.trim();
    const daysLimit = document.getElementById("DaysLimit").value.trim();

    if (!studentId || !bookId || !daysLimit) {
        alert("Please fill all fields");
        return;
    }

    const token = localStorage.getItem("access_token");

    if (!token) {
        alert("Session expired. Please login again.");
        window.location.href = "librarian_login.html";
        return;
    }

    try {

        const response = await fetch(
            `${apiBaseUrl}/api/transactions/issue-book/student`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    student_prn_id: parseInt(studentId),
                    book_accession_number: parseInt(bookId),
                    days_limit: parseInt(daysLimit)
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            alert(data.detail || "Failed to issue book");
            return;
        }

        alert(data.message);

        // ✅ Clear inputs after success
        document.getElementById("StudentID").value = "";
        document.getElementById("BookAccessation").value = "";
        document.getElementById("DaysLimit").value = "";

    } catch (error) {
        console.error("Error issuing book:", error);
        alert("Something went wrong");
    }
}



async function IssueEmployeeBook() {

    const employeeId = document.getElementById("EmployeeUserID").value.trim();
    const bookId = document.getElementById("EmployeeBookID").value.trim();
    const daysLimit = document.getElementById("EmployeeDaysLimit").value.trim();

    if (!employeeId || !bookId || !daysLimit) {
        alert("Please fill all fields");
        return;
    }

    const token = localStorage.getItem("access_token");

    if (!token) {
        alert("Session expired. Please login again.");
        window.location.href = "/login.html";
        return;
    }

    try {

        const response = await fetch(
            `${apiBaseUrl}/api/transactions/issue-book/employee`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    employee_id: parseInt(employeeId),
                    book_accession_number: parseInt(bookId),
                    days_limit: parseInt(daysLimit)
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            alert(data.detail || "Failed to issue book");
            return;
        }

        alert(data.message);

        // ✅ Clear inputs after success
        document.getElementById("EmployeeUserID").value = "";
        document.getElementById("EmployeeBookID").value = "";
        document.getElementById("EmployeeDaysLimit").value = "";

    } catch (error) {
        console.error("Error issuing book:", error);
        alert("Something went wrong");
    }
}


// ===============================
// RETURN BOOK FUNCTION
// ===============================

async function ReturnBook() {
    const bookInput = document.getElementById("ReturnBookID");
    const bookAccessionNumber = bookInput.value.trim();

    if (!bookAccessionNumber) {
        alert("Please enter or scan Book ID");
        return;
    }

    // Get JWT token from localStorage
    const token = localStorage.getItem("access_token");

    if (!token) {
        alert("You are not logged in. Please login again.");
        return;
    }

    try {
        const response = await fetch(`${apiBaseUrl}/api/transactions/return-book`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                book_accession_number: bookAccessionNumber
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || "Failed to return book");
        }

        // ✅ Success
        alert(data.message);

        console.log("Return response:", data);

        // Optional: Clear inputs
        bookInput.value = "";
        document.getElementById("ReturnUserID").value = "";

    } catch (error) {
        console.error("Return error:", error);
        alert("Error: " + error.message);
    }
}


// ===============================
// RENEW BOOK FUNCTION
// ===============================

async function RenewBook() {

    const bookId = document.getElementById("RenewBookID").value.trim();
    const userId = document.getElementById("RenewUserID").value.trim();
    const userType = document.getElementById("Usertype").value;
    const daysLimit = document.getElementById("RenewDaysLimit").value.trim();

    if (!bookId || !userId || !userType || !daysLimit) {
        alert("Please fill all fields");
        return;
    }

    const token = localStorage.getItem("access_token");

    if (!token) {
        alert("You are not logged in. Please login again.");
        return;
    }

    try {

        const url = `${apiBaseUrl}/api/transactions/renew-book` +
            `?book_accession_number=${bookId}` +
            `&borrower_id=${userId}` +
            `&borrower_type=${userType}` +
            `&additional_days=${daysLimit}`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || "Failed to renew book");
        }

        // ✅ Success
        alert(data.message);
        console.log("Renew response:", data);

        // Optional: Clear fields
        document.getElementById("RenewBookID").value = "";
        document.getElementById("RenewUserID").value = "";
        document.getElementById("RenewDaysLimit").value = "";
        document.getElementById("Usertype").value = "";

    } catch (error) {
        console.error("Renew error:", error);
        alert("Error: " + error.message);
    }
}

let lastIssuedId = null;
let isIssuedLoading = false;
let hasIssuedMore = true;


const tableIssuedBody = document.getElementById("IssuedBookInfo");
const scrollContainer = document.getElementById("issuedScrollContainer");

// OPTIONAL: if you have borrower filter dropdown
const borrowerIssuedFilter = document.getElementById("borrowerIssuedFilter");


async function loadIssuedBooks(reset = false) {

    if (reset) {
        lastIssuedId = null;
        hasIssuedMore = true;
        tableIssuedBody.innerHTML = "";
    }

    if (isIssuedLoading || !hasIssuedMore) return;

    isIssuedLoading = true;

    let url = `${apiBaseUrl}/api/librarian/issued-books/all?limit=10`;

    // Borrower filter (optional)
    if (borrowerIssuedFilter && borrowerIssuedFilter.value) {
        url += `&borrower_type=${borrowerIssuedFilter.value}`;
    }

    // Cursor
    if (lastIssuedId) {
        url += `&last_id=${lastIssuedId}`;
    }

    try {
        const response = await fetch(url, {
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("access_token")
            }
        });

        if (!response.ok) {
            console.error("Failed to fetch issued books");
            isIssuedLoading = false;
            return;
        }

        const data = await response.json();

        if (data.length === 0) {
            hasIssuedMore = false;
            isIssuedLoading = false;
            return;
        }

        data.forEach(record => {

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${record.book.Accession_number}</td>
                <td>${record.book.title}</td>
                <td>${record.borrower.Emp_Id || record.borrower.Prn_id || "N/A"}</td>
                <td>${record.borrower.name}</td>
                <td>${record.borrower.type}</td>
                <td>${new Date(record.issue_time).toLocaleDateString()}</td>
                <td>${new Date(record.due_date).toLocaleDateString()}</td>
            `;

            tableIssuedBody.appendChild(row);
        });

        // Set cursor for next scroll
        lastIssuedId = data[data.length - 1].issue_book_id;

    } catch (error) {
        console.error("Error loading issued books:", error);
    }

    isIssuedLoading = false;
}


// ✅ Infinite Scroll (IMPORTANT: attach to div, not window)
scrollContainer.addEventListener("scroll", () => {

    if (
        scrollContainer.scrollTop + scrollContainer.clientHeight >=
        scrollContainer.scrollHeight - 50
    ) {
        loadIssuedBooks();
    }

});


// OPTIONAL: If you have borrower filter dropdown
if (borrowerIssuedFilter) {
    borrowerIssuedFilter.addEventListener("change", () => {
        loadIssuedBooks(true); // reset data
    });
}



let lastReturnedDate = null;
let isReturnedLoading = false;
let hasReturnedMore = true;

const tableReturnedBody = document.getElementById("returnedInfoBody");
const scrollReturnedContainer = document.getElementById("returnedScrollContainer");

// Optional filter dropdown (only if you have it)
const borrowerReturnedFilter = document.getElementById("borrowerReturnedFilter");


async function loadReturnedBooks(reset = false) {

    if (reset) {
        lastReturnedDate = null;
        hasReturnedMore = true;
        tableReturnedBody.innerHTML = "";
    }

    if (isReturnedLoading || !hasReturnedMore) return;

    isReturnedLoading = true;

    let url = `${apiBaseUrl}/api/librarian/returned-books/all?limit=10`;

    // Borrower type filter (optional)
    if (borrowerReturnedFilter && borrowerReturnedFilter.value) {
        url += `&borrower_type=${borrowerReturnedFilter.value}`;
    }

    // Cursor pagination
    if (lastReturnedDate) {
        url += `&last_returned_date=${encodeURIComponent(lastReturnedDate)}`;
    }

    try {
        const response = await fetch(url, {
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("access_token")
            }
        });

        if (!response.ok) {
            console.error("Failed to fetch returned books");
            isReturnedLoading = false;
            return;
        }

        const data = await response.json();

        if (data.length === 0) {
            hasReturnedMore = false;
            isReturnedLoading = false;
            return;
        }

        data.forEach(record => {

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${record.book.Accession_number}</td>
                <td>${record.book.title}</td>
                <td>${record.borrower.Emp_Id || record.borrower.Prn_id || "N/A"}</td>
                <td>${record.borrower.name}</td>
                <td>${record.borrower.type}</td>
                <td>${new Date(record.issue_time).toLocaleDateString()}</td>
                <td>${new Date(record.due_date).toLocaleDateString()}</td>
                <td>${new Date(record.returned_date).toLocaleDateString()}</td>
            `;

            tableReturnedBody.appendChild(row);
        });

        // Set cursor for next scroll
        lastReturnedDate = data[data.length - 1].returned_date;

    } catch (error) {
        console.error("Error loading returned books:", error);
    }

    isReturnedLoading = false;
}


// ✅ Attach scroll to DIV (NOT window)
scrollReturnedContainer.addEventListener("scroll", () => {

    if (
        scrollReturnedContainer.scrollTop + scrollReturnedContainer.clientHeight >=
        scrollReturnedContainer.scrollHeight - 50
    ) {
        loadReturnedBooks();
    }

});


// Optional filter reset
if (borrowerReturnedFilter) {
    borrowerReturnedFilter.addEventListener("change", () => {
        loadReturnedBooks(true);
    });
}
