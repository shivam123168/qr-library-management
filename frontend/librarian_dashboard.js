const apiBaseUrl = `qr-library-management-production.up.railway.app`;
const toggleBtn = document.querySelector('.toggle_btn')
const toggleBtnIcon = document.querySelector('.toggle_btn i')
const dropDownManue = document.querySelector('.dropdown_manue')

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

// Dashboard Stats Logic
document.addEventListener("DOMContentLoaded", async function () {

    const API_URL = `${apiBaseUrl}/api/librarian/issued-books/stats`;

    const token = localStorage.getItem("access_token");

    // 🚨 If no token → redirect to login
    if (!token) {
        window.location.href = "librarian_login.html";
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            }
        });

        // If unauthorized → token invalid/expired
        if (response.status === 401 || response.status === 403) {
            localStorage.clear();
            window.location.href = "librarian_login.html";
            return;
        }

        const data = await response.json();

        // ✅ Update UI safely
        function setText(id, value) {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        }
        setText("total_overdue", data.total_overdue);
        setText("currently_issued", data.currently_issued);
        setText("total_issued", data.total_issued);
        setText("total_available", data.total_available);
        setText("total_returned", data.total_returned);

        // (Optional if you add them later)
        // setText("total_overdue", data.total_overdue);
        // setText("student_issued", data.student_issued);
        // setText("employee_issued", data.employee_issued);

        loadBookStats(); // Load book stats
        loadUserStats(token); // Load student/employee stats
        loadEmployeeProfile(token); // Load librarian profile info
        loadBookStats(); // Load book stats
        loadPendingRequests(); // Load pending book requests 
        loadDueTodayBooks(); // Load books due today
        loadPenalties(); // Load penalties
        loadIssuedBooks(); // Load issued books
        loadReturnedBooks(); // Load returned books
        loadOverdueBooks(); // Load overdue books with infinite scroll



    } catch (error) {
        console.error("Error fetching stats:", error);
    }

});

async function loadBookStats() {
    try {
        // 🔹 Call API
        const response = await fetch(`${apiBaseUrl}/api/books/stats/count`);

        if (!response.ok) {
            throw new Error("Failed to fetch book stats");
        }

        const data = await response.json();

        // 🔹 Safety Check
        if (!data || typeof data !== "object") {
            console.error("Invalid data received");
            return;
        }

        // 🔹 Update UI
        document.getElementById("total_books").textContent = data.total_books ?? 0;

        // 🔥 OPTIONAL (for future use)
        console.log("Available:", data.available);
        console.log("Issued:", data.issued);
        console.log("By Publisher:", data.by_publisher);

    } catch (error) {
        console.error("Error loading book stats:", error);
        document.getElementById("total_books").textContent = "Error";
    }
}

async function loadUserStats(token) {


    // 🔐 Security Check
    if (!token) {
        localStorage.clear();
        window.location.href = "librarian_login.html";
        return;
    }

    try {

        // 🔹 Call both APIs in parallel
        const [studentRes, employeeRes] = await Promise.all([
            fetch(`${apiBaseUrl}/api/students/stats/count`, {
                headers: {
                    "Authorization": "Bearer " + token
                }
            }),
            fetch(`${apiBaseUrl}/api/employees/stats/count`, {
                headers: {
                    "Authorization": "Bearer " + token
                }
            })
        ]);

        // 🚨 If unauthorized
        if (studentRes.status === 401 || employeeRes.status === 401 ||
            studentRes.status === 403 || employeeRes.status === 403) {

            localStorage.clear();
            window.location.href = "librarian_login.html";
            return;
        }

        const studentData = await studentRes.json();
        const employeeData = await employeeRes.json();
        // Safe DOM update function
        function setText(id, value) {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        }
        //  Update Student Count
        setText("total_student", studentData.total_students);

        //  Update Employee Count
        setText("total_employee", employeeData.total_employees);

        //  Extract Librarian Count from by_post
        const librarianCount = employeeData.by_post["Librarian"] || 0;
        setText("total_librarian", librarianCount);

    } catch (error) {
        console.error("Error loading user stats:", error);
    }
}


async function loadEmployeeProfile(token) {


    // 🔐 Security check
    if (!token) {
        localStorage.clear();
        window.location.href = "librarian_login.html";
        return;
    }

    try {
        const response = await fetch(`${apiBaseUrl}/api/employees/my-profile`, {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        // 🚨 Token invalid or expired
        if (response.status === 401 || response.status === 403) {
            localStorage.clear();
            window.location.href = "librarian_login.html";
            return;
        }

        const data = await response.json();

        // ✅ Safe DOM Update Function
        function setText(id, value) {
            const el = document.getElementById(id);
            if (el) el.textContent = value ?? "N/A";
        }

        // 🔹 Personal Info
        // setText("emp_id", data.Emp_Id);
        setText("first_name", data.First_name);
        setText("short_name", data.First_name + " " + data.Last_name);
        // setText("last_name", data.Last_name);
        // setText("email", data.Gmail);
        // setText("phone", data.Phone_no);
        setText("department", data.department_name + " Department");
        // setText("post", data.post_name);

        // 🔹 Borrowing Stats
        // setText("total_books_borrowed", data.total_books_borrowed);
        // setText("currently_borrowed", data.currently_borrowed);

        // 🔹 Penalty Info
        // setText("total_penalties", data.total_penalties);
        // setText("unpaid_penalties", data.unpaid_penalties);

        // 💰 Format currency properly
        // const unpaidAmountEl = document.getElementById("total_unpaid_amount");
        // if (unpaidAmountEl) {
        //     unpaidAmountEl.textContent = 
        //         "₹ " + Number(data.total_unpaid_amount).toFixed(2);
        // }

    } catch (error) {
        console.error("Error loading profile:", error);
    }
}



let lastId = null;
let isLoading = false;
let hasMore = true;

const tableBody = document.getElementById("requestTableBody");
const dayLimitInput = document.getElementById("day_limit");

document.getElementById("typeFilter")
    .addEventListener("change", () => {
        loadPendingRequests(true); // TRUE = RESET
    });

/* ================================
   LOAD PENDING REQUESTS
================================ */
async function loadPendingRequests(reset = false) {

    if (reset) {
        lastId = null;
        hasMore = true;
        tableBody.innerHTML = "";
    }

    if (isLoading || !hasMore) return;

    isLoading = true;

    const selectedType = document.getElementById("typeFilter").value;

    let url = `${apiBaseUrl}/api/book-requests/all/pending?limit=10`;

    if (selectedType) {
        url += `&requester_type=${selectedType}`;
    }

    if (lastId) {
        url += `&last_id=${lastId}`;
    }

    try {
        const response = await fetch(url, {
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("access_token")
            }
        });

        const data = await response.json();

        tableBody.innerHTML = ""; // clear old rows

        if (data.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align:center;">
                        No pending requests
                    </td>
                </tr>
            `;
            return;
        }


        data.forEach(request => {

            const row = document.createElement("tr");
            row.setAttribute("data-id", request.request_id);

            row.innerHTML = `
                <td>${request.request_id}</td>
                <td>${request.Books_Accession_number}</td>
                <td>${request.Title || "-"}</td>
                <td>${request.requester_id}</td>
                <td>${request.requester_name || "-"}</td>
                <td>${request.requester_type}</td>
                <td>${new Date(request.book_request_time).toLocaleString()}</td>
                <td>
                    <button class="approve-btn" onclick="approveRequest(${request.request_id})">
                        Approve
                    </button>
                </td>
                <td>
                    <button class="reject-btn" onclick="rejectRequest(${request.request_id})">
                        Reject
                    </button>
                </td>
            `;

            tableBody.appendChild(row);
        });

        lastId = data[data.length - 1].request_id;

    } catch (error) {
        console.error(error);
    }

    isLoading = false;
}

/* ================================
   APPROVE REQUEST
================================ */

async function approveRequest(requestId) {

    const dayLimit = dayLimitInput.value;

    if (!dayLimit) {
        alert("Please enter day limit before approving.");
        return;
    }

    try {
        const response = await fetch(
            `${apiBaseUrl}/api/book-requests/${requestId}/process`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + localStorage.getItem("access_token")
                },
                body: JSON.stringify({
                    action: "issue",
                    days_limit: parseInt(dayLimit)
                })
            }
        );

        const result = await response.json();

        if (!response.ok) {
            alert(result.detail || "Error issuing book");
            return;
        }

        alert("Book Issued Successfully");

        removeRow(requestId);

    } catch (error) {
        console.error("Error approving:", error);
    }
}

/* ================================
   REJECT REQUEST
================================ */

async function rejectRequest(requestId) {

    try {
        const response = await fetch(
            `${apiBaseUrl}/api/book-requests/${requestId}/reject`,
            {
                method: "PUT",
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem("access_token")
                }
            }
        );

        const result = await response.json();

        if (!response.ok) {
            alert(result.detail || "Error rejecting request");
            return;
        }

        alert("Request Rejected");

        removeRow(requestId);

    } catch (error) {
        console.error("Error rejecting:", error);
    }
}

/* ================================
   REMOVE ROW FROM TABLE
================================ */

function removeRow(requestId) {
    const row = document.querySelector(`tr[data-id="${requestId}"]`);
    if (row) {
        row.remove();
    }
}

/* ================================
   INFINITE SCROLL
================================ */
const scrollRequestContainer = document.getElementById("RequestScrollContainer");

scrollRequestContainer.addEventListener("scroll", () => {

    if (
        scrollRequestContainer.scrollTop + scrollRequestContainer.clientHeight >=
        scrollRequestContainer.scrollHeight - 50
    ) {
        loadPenalties();
    }

});




const dueTodayTableBody = document.getElementById("dueTodayTableBody");

async function loadDueTodayBooks() {

    try {
        const response = await fetch(
            `${apiBaseUrl}/api/librarian/books/due-today`,
            {
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem("access_token")
                }
            }
        );

        if (!response.ok) {
            console.error("Failed to fetch due books");
            return;
        }

        const data = await response.json();

        dueTodayTableBody.innerHTML = ""; // clear old rows

        if (data.length === 0) {
            dueTodayTableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center;">
                        No books due today
                    </td>
                </tr>
            `;
            return;
        }

        data.forEach(record => {

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${record.book.Accession_number}</td>
                <td>${record.book.title}</td>
                <td>${record.borrower.name}</td>
                <td>${record.borrower.Prn_id || record.borrower.Emp_Id}</td>
                <td>${new Date(record.issue_time).toLocaleDateString()}</td>
                <td>${new Date(record.due_date).toLocaleDateString()}</td>
            `;

            dueTodayTableBody.appendChild(row);
        });

    } catch (error) {
        console.error("Error loading due today books:", error);
    }
}




let lastPenaltyId = null;
let isPenaltyLoading = false;
let hasPenaltyMore = true;

const PenaltytableBody = document.getElementById("penaltyInfoBody");
const statusFilter = document.getElementById("statusFilter");
const borrowerFilter = document.getElementById("borrowerFilter");


async function loadPenalties(reset = false) {

    if (reset) {
        lastPenaltyId = null;
        hasPenaltyMore = true;
        PenaltytableBody.innerHTML = "";
    }

    if (isPenaltyLoading || !hasPenaltyMore) return;

    isPenaltyLoading = true;

    let url = `${apiBaseUrl}/api/penalties/all?limit=10`;

    // ✅ Add status filter
    if (statusFilter.value) {
        url += `&status=${encodeURIComponent(statusFilter.value)}`;
    }

    // ✅ Add borrower type filter
    if (borrowerFilter.value) {
        url += `&borrower_type=${encodeURIComponent(borrowerFilter.value)}`;
    }

    // ✅ Cursor pagination
    if (lastPenaltyId) {
        url += `&last_id=${lastPenaltyId}`;
    }

    try {
        const response = await fetch(url, {
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("access_token")
            }
        });

        if (!response.ok) {
            console.error("Failed to fetch penalties");
            isPenaltyLoading = false;
            return;
        }

        const result = await response.json();
        const penalties = result.penalties;

        if (penalties.length === 0) {
            hasPenaltyMore = false;

            if (reset) {
                PenaltytableBody.innerHTML = `
                    <tr>
                        <td colspan="8" style="text-align:center;">
                            No penalties found
                        </td>
                    </tr>
                `;
            }

            isPenaltyLoading = false;
            return;
        }

        penalties.forEach(penalty => {

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${penalty.penalty_id}</td>
                <td>${penalty.book_accession_number}</td>
                <td>${penalty.book_title}</td>
                <td>${penalty.borrower_id}</td>
                <td>${penalty.borrower_name}</td>
                <td>${penalty.borrower_type}</td>
                <td style="color: ${penalty.status.toLowerCase() === "not paid" ? "red" : "green"
                }; font-weight: bold;">₹ ${penalty.amount}</td>
                <td style="color: ${penalty.status.toLowerCase() === "not paid" ? "red" : "green"
                }; font-weight: bold;">${penalty.status}</td>
                <td>${new Date(penalty.issued_date).toLocaleDateString()}</td>
                <td>${new Date(penalty.due_date).toLocaleDateString()}</td>
            `;

            PenaltytableBody.appendChild(row);
        });

        // ✅ Set last ID for next scroll
        lastPenaltyId = penalties[penalties.length - 1].penalty_id;

    } catch (error) {
        console.error("Error loading penalties:", error);
    }

    isPenaltyLoading = false;
}


// ✅ Infinite Scroll
const scrollPenaltyContainer = document.getElementById("penaltyScrollContainer");

scrollPenaltyContainer.addEventListener("scroll", async () => {

    if (
        scrollPenaltyContainer.scrollTop + scrollPenaltyContainer.clientHeight >=
        scrollPenaltyContainer.scrollHeight - 50
    ) {
        console.log("Reached bottom - load more");
        await loadPenalties();
    }

});


// ✅ Filter Change (RESET DATA)
statusFilter.addEventListener("change", () => {
    loadPenalties(true);
});

borrowerFilter.addEventListener("change", () => {
    loadPenalties(true);
});


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


//  Attach scroll to DIV (NOT window)
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



let lastOverdueId = null;
let isOverdueLoading = false;
let hasOverdueData = true;

const tableOverdueBody = document.getElementById("OverdueBookInfo");
const scrollOverdueContainer = document.getElementById("OverdueScrollContainer");
const borrowerOverdueFilter = document.getElementById("borrowerOverdueFilter");

async function loadOverdueBooks(reset = false) {

    if (isOverdueLoading) return;
    if (!hasOverdueData && !reset) return;

    isOverdueLoading = true;

    if (reset) {
        tableOverdueBody.innerHTML = "";
        lastOverdueId = null;
        hasOverdueData = true;
    }

    let url = `${apiBaseUrl}/api/librarian/overdue-books/all?limit=10`;

    if (lastOverdueId) {
        url += `&last_id=${lastOverdueId}`;
    }

    if (borrowerOverdueFilter.value) {
        url += `&borrower_type=${borrowerOverdueFilter.value}`;
    }

    const token = localStorage.getItem("access_token");

    const response = await fetch(url, {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    if (!response.ok) {
        console.error("HTTP Error:", response.status);
        return;
    }

    const data = await response.json();
    const books = data.books;

    if (books.length < 10) {
        hasOverdueData = false;
    }

    books.forEach(book => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${book.book_accession_number || ""}</td>
            <td>${book.book_title || ""}</td>
            <td>${book.borrower_id || ""}</td>
            <td>${book.borrower_name || ""}</td>
            <td>${book.borrower_type || ""}</td>
            <td>${book.borrower_phone || ""}</td>
            <td>${book.borrower_email || ""}</td>
            <td>${new Date(book.issue_time).toLocaleDateString()}</td>
            <td>${new Date(book.due_date).toLocaleDateString()}</td>
        `;
        tableOverdueBody.appendChild(row);
    });

    if (books.length > 0) {
        lastOverdueId = books[books.length - 1].issue_book_id;
    }

    isOverdueLoading = false;
}


// Direct event bindings
scrollOverdueContainer.onscroll = async function () {
    if (scrollOverdueContainer.scrollTop + scrollOverdueContainer.clientHeight
        >= scrollOverdueContainer.scrollHeight - 20) {
        await loadOverdueBooks();
    }
};

borrowerOverdueFilter.onchange = async function () {
    await loadOverdueBooks(true);
};


const searchInput = document.getElementById("searchInput");
const suggestionsBox = document.getElementById("suggestions");

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

        div.textContent = "Copy No:" + book.Copy_Number + " Title:" + book.Title + " Rack:" + book.rack_location + " Self:" + book.self_location;




        suggestionsBox.appendChild(div);
    });

    suggestionsBox.style.display = books.length ? "block" : "none";
});
