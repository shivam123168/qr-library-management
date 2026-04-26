 const apiBaseUrl = `http://${window.location.hostname}:8000`;
const toggleBtn = document.querySelector('.toggle_btn')
const toggleBtnIcon = document.querySelector('.toggle_btn i')
const dropDownManue = document.querySelector('.dropdown_manue')
// <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>

// Smooth scroll to sections function
function navigateTo(sectionId) {
    const section = document.getElementById(sectionId);

    if (section) {
        section.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
}

function navigateToPage(pageName) {
      window.location.href = pageName;

    if (section) {
        section.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
}

let qrCanvas = null; // to store the generated QR canvas

function generateQR(prn) {
    const tempDiv = document.createElement("div");
    console.log("PRN ID:", prn);
    new QRCode(tempDiv, {
        text: String(prn),
        width: 150,
        height: 150
    });

    setTimeout(() => {
        qrCanvas = tempDiv.querySelector("canvas");

        if (qrCanvas) {
            const qrImageURL = qrCanvas.toDataURL("image/png");
            document.getElementById("qrImage").src = qrImageURL;
            console.log("✅ QR generated");
        }
    }, 300);
}


function downloadQR() {
    if (!qrCanvas) {
        alert("⚠️ Please generate the QR code first!");
        return;
    }

    const qrImageURL = qrCanvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = qrImageURL;
    link.download = "student_qrcode.png";
    link.click();
}


toggleBtn.onclick = function () {
    dropDownManue.classList.toggle('open')
    const isOpen = dropDownManue.classList.contains('open')

    toggleBtnIcon.classList = isOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-bars'
}


document.addEventListener("DOMContentLoaded", async function () {

    const token = localStorage.getItem("access_token");

    if (!token) {
        window.location.href = "student_login.html";
        return;
    }

    try {
        const response = await fetch(`${apiBaseUrl}/api/students/my-profile`, {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        if (response.status === 401) {
            localStorage.removeItem("access_token");
            window.location.href = "student_login.html";
            return;
        }

        if (!response.ok) {
            console.error("Server error:", response.status);
            return;
        }

        const data = await response.json();

        // 🔥 Fill HTML with backend data
        setText("prn", data.Prn_id);
        setText("first_name", data.first_name);
        setText("created_at", new Date(data.student_creation_time).toLocaleString());
        setText("dob", data.DOB);
        setText("age", calculateAge(data.DOB) + " years");
        setText("total_books_borrowed", data.total_books_borrowed);
        setText("currently_issued", data.currently_issued);
        setText("currently_overdue", data.currently_overdue);
        setText("total_penalties", data.total_penalties);
        setText("unpaid_penalties", data.unpaid_penalties);
        setText("total_unpaid_amount","₹ " + data.total_unpaid_amount.toFixed(2));
        setText("name", data.first_name + " " + data.middle_name + " " + data.last_name);
        setText("short_name", data.first_name + " " + data.last_name);
        setText("phone", data.Phone_no);
        setText("email", data.gmail);
        setText("branch", data.branch_name);
        setText("sem", data.sem);
        setText("sem1", data.sem);

        function setText(id, value) {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value ?? "";
            } else {
                console.warn("Element not found:", id);
            }
        }

        function calculateAge(dob) {
            // dob format: "YYYY-MM-DD"
            const birthDate = new Date(dob);
            const today = new Date();

            let age = today.getFullYear() - birthDate.getFullYear();

            const monthDifference = today.getMonth() - birthDate.getMonth();

            // If birthday hasn't occurred yet this year
            if (
                monthDifference < 0 ||
                (monthDifference === 0 && today.getDate() < birthDate.getDate())
            ) {
                age--;
            }

            return age;
        }
        generateQR(data.Prn_id); // Generate QR on page load
        loadIssuedBooks(token); // Load issued books on page load
        loadReturnedBooks(token); // Load returned books on page load
        loadOverdueBooks(token); // Load overdue books on page load
        loadPenaltyBooks(token); // Load penalties on page load
        loadPendingRequests(token); // Load pending requests on page load
        loadApprovedRequests(token); // Load approved requests on page load
        loadRejectedRequests(token); // Load rejected requests on page load
    }
    catch (error) {
        console.error("Error:", error);

        // If token expired or invalid → logout
        localStorage.removeItem("access_token");
        window.location.href = "student_login.html";
    }

});


// logout function
function logout() {
    // Remove token
    localStorage.removeItem("access_token");

    // (Optional) Remove other user data
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_type");

    // Redirect to login page
    window.location.href = "student_login.html";
}


function formatDate(dateString) {
    if (!dateString) return "";

    const date = new Date(dateString);

    return date.toLocaleDateString("en-GB");
    // gives DD/MM/YYYY
}

async function loadIssuedBooks(token) {
    try {
        const response = await fetch(`${apiBaseUrl}/api/students/my-issued-books`, {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        if (!response.ok) {
            console.error("Failed to fetch issued books");
            return;
        }

        const books = await response.json();

        const tableBody = document.getElementById("issuedBooksBody");
        tableBody.innerHTML = ""; // clear table

        if (books.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align:center;">
                        No books issued
                    </td>
                </tr>
            `;
            return;
        }

        books.forEach(record => {

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${record.book.Accession_number}</td>
                <td>${record.book.title}</td>
                <td>${formatDate(record.issue_time)}</td>
                <td style="color:${record.status === "Overdue" ? "red" : "green"}">
                    ${formatDate(record.due_date)}
                </td>
            `;

            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error("Error loading issued books:", error);
    }
}

async function loadReturnedBooks(token) {
    try {
        const response = await fetch(`${apiBaseUrl}/api/students/my-returned-books`, {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        if (!response.ok) {
            console.error("Failed to fetch returned books");
            return;
        }

        const books = await response.json();

        const tableBody = document.getElementById("returnedBooksBody");
        tableBody.innerHTML = ""; // clear table

        if (books.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align:center;">
                        No returned books
                    </td>
                </tr>
            `;
            return;
        }

        books.forEach(record => {
            const row = document.createElement("tr");

            row.innerHTML = `
                 <td>${record.book.Accession_number}</td>
                <td>${record.book.title}</td>
                <td>${formatDate(record.issue_time)}</td>
                <td>${formatDate(record.returned_date)}</td>
            `;

            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error("Error loading returned books:", error);
    }
}


async function loadOverdueBooks(token) {
    try {
        const response = await fetch(`${apiBaseUrl}/api/students/my-overdue-books`, {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        if (!response.ok) {
            console.error("Failed to fetch overdue books");
            return;
        }

        const books = await response.json();

        const tableBody = document.getElementById("overdueBooksBody");
        tableBody.innerHTML = ""; // clear old rows

        if (books.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align:center;">
                        No overdue books 🎉
                    </td>
                </tr>
            `;
            return;
        }

        books.forEach(record => {

            const row = document.createElement("tr");

            row.innerHTML = `
                 <td>${record.book.Accession_number}</td>
                <td>${record.book.title}</td>
                <td>${formatDate(record.due_date)}</td>
                <td style="color:red; font-weight:bold;">
                    ${record.days_overdue ?? calculateOverdueDays(record.due_date)} days
                </td>
            `;

            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error("Error loading overdue books:", error);
    }
}


async function loadPenaltyBooks(token) {
    try {
        const response = await fetch(
            `${apiBaseUrl}/api/penalties/student/my-penalties`,
            {
                method: "GET",
                headers: {
                    "Authorization": "Bearer " + token
                }
            }
        );

        if (!response.ok) {
            console.error("Failed to fetch penalties");
            return;
        }

        const data = await response.json();
        const penalties = data.penalties;

        const tableBody = document.getElementById("penaltyBooksBody");
        tableBody.innerHTML = ""; // clear old data

        // If no penalties
        if (!penalties || penalties.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align:center;">
                        No penalties 🎉
                    </td>
                </tr>
            `;
            return;
        }

        penalties.forEach(item => {
            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${item.book_accession_number}</td>
                <td>${item.book_title}</td>
                <td>₹ ${item.amount}</td>
                <td style="color: ${item.status.toLowerCase() === "not paid" ? "red" : "green"
                }; font-weight: bold;">
                    ${item.status}
                </td>
                <td>${item.excuse ? item.excuse : "—"}</td>
            `;

            tableBody.appendChild(row);
        });

        console.log("✅ Penalties loaded successfully");

    } catch (error) {
        console.error("Error loading penalties:", error);
    }
}

async function loadPendingRequests(token) {
    try {
        const response = await fetch(
            `${apiBaseUrl}/api/book-requests/student/my-requests/pending`,
            {
                method: "GET",
                headers: {
                    "Authorization": "Bearer " + token
                }
            }
        );

        if (!response.ok) {
            console.error("Failed to fetch pending requests");
            return;
        }

        const requests = await response.json();

        const tableBody = document.getElementById("pendingBooksBody");
        tableBody.innerHTML = "";

        if (!requests || requests.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align:center;">
                        No pending requests 📚
                    </td>
                </tr>
            `;
            return;
        }

        requests.forEach(req => {
            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${req.request_id}</td>
                <td>${req.book_accession_number}</td>
                <td>${req.book_title}</td>
                <td>${formatDate(req.request_time)}</td>
            `;

            tableBody.appendChild(row);
        });

        console.log("✅ Pending requests loaded");

    } catch (error) {
        console.error("Error loading pending requests:", error);
    }
}

async function loadApprovedRequests(token) {
    try {
        const response = await fetch(
            `${apiBaseUrl}/api/book-requests/student/my-requests/approved`,
            {
                method: "GET",
                headers: {
                    "Authorization": "Bearer " + token
                }
            }
        );

        if (!response.ok) {
            console.error("Failed to fetch approved requests");
            return;
        }

        const requests = await response.json();

        const tableBody = document.getElementById("approvedBooksBody");
        tableBody.innerHTML = "";

        if (!requests || requests.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align:center;">
                        No approved requests ✅
                    </td>
                </tr>
            `;
            return;
        }

        requests.forEach(req => {
            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${req.request_id}</td>
                <td>${req.book_accession_number}</td>
                <td>${req.book_title}</td>
                <td>${formatDate(req.request_time)}</td>
            `;

            tableBody.appendChild(row);
        });

        console.log("✅ Approved requests loaded");

    } catch (error) {
        console.error("Error loading approved requests:", error);
    }
}

async function loadRejectedRequests(token) {
    try {
        const response = await fetch(
            `${apiBaseUrl}/api/book-requests/student/my-requests/rejected`,
            {
                method: "GET",
                headers: {
                    "Authorization": "Bearer " + token
                }
            }
        );

        if (!response.ok) {
            console.error("Failed to fetch rejected requests");
            return;
        }

        const requests = await response.json();

        const tableBody = document.getElementById("rejectedBooksBody");
        tableBody.innerHTML = "";

        if (!requests || requests.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align:center;">
                        No rejected requests ❌
                    </td>
                </tr>
            `;
            return;
        }

        requests.forEach(req => {
            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${req.request_id}</td>
                <td>${req.book_accession_number}</td>
                <td>${req.book_title}</td>
                <td>${formatDate(req.request_time)}</td>
            `;

            tableBody.appendChild(row);
        });

        console.log("✅ Rejected requests loaded");

    } catch (error) {
        console.error("Error loading rejected requests:", error);
    }
}

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
        div.textContent = book.Title;

        div.addEventListener("click", async () => {
            searchInput.value = book.Title;
            suggestionsBox.style.display = "none";

            // 🔥 Trigger request API
            await createBookRequest(book.Accession_number);
        });

        suggestionsBox.appendChild(div);
    });

    suggestionsBox.style.display = books.length ? "block" : "none";
});



async function createBookRequest(AccessionNumber) {

    const token = localStorage.getItem("access_token");

    if (!token) {
        alert("Please login first.");
        return;
    }


    const response = await fetch(`${apiBaseUrl}/api/book-requests/student/create`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
            book_accession_number: AccessionNumber
        })
    });

    const result = await response.json();

    if (response.ok) {
        alert(result.message);
    } else {
        alert(result.detail);
    }
}


// auth changes on new page update email function
async function updateEmail() {
    const emailInput = document.getElementById("edit-email");
    const newEmail = emailInput.value.trim();

    if (!newEmail) {
        alert("Please enter a new email.");
        return;
    }

    // Get access token from localStorage
    const token = localStorage.getItem("access_token");

    if (!token) {
        alert("You are not logged in. Please login again.");
        window.location.href = "/login.html"; // change if needed
        return;
    }

    try {
        const response = await fetch(`${apiBaseUrl}/api/students/my-profile`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                gmail: newEmail
            })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.detail || "Failed to update email");
            return;
        }

        alert(data.message);
        emailInput.value = "";

    } catch (error) {
        console.error("Error updating email:", error);
        alert("Something went wrong. Please try again.");
    }
}

// update password function
async function updatePassword() {
    const oldPassword = document.getElementById("old-password").value.trim();
    const newPassword = document.getElementById("new-password").value.trim();

    if (!oldPassword || !newPassword) {
        alert("Please fill in both fields.");
        return;
    }

    if (newPassword.length < 6) {
        alert("New password must be at least 6 characters long.");
        return;
    }

    // Get access token
    const token = localStorage.getItem("access_token");

    if (!token) {
        alert("Session expired. Please login again.");
        window.location.href = "/login.html"; // change path if needed
        return;
    }

    try {
        const response = await fetch(`${apiBaseUrl}/api/students/password/change`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                old_password: oldPassword,
                new_password: newPassword
            })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.detail || "Password change failed");
            return;
        }

        alert(data.message);

        // Clear input fields
        document.getElementById("old-password").value = "";
        document.getElementById("new-password").value = "";

    } catch (error) {
        console.error("Error:", error);
        alert("Something went wrong. Please try again.");
    }
}


// phone number update function
async function updatePhone() {
    const phoneInput = document.getElementById("edit-phone");
    const newPhone = phoneInput.value.trim();

    if (!newPhone) {
        alert("Please enter a phone number.");
        return;
    }

    // Basic validation (10 digits)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(newPhone)) {
        alert("Please enter a valid 10-digit phone number.");
        return;
    }

    const token = localStorage.getItem("access_token");

    if (!token) {
        alert("Session expired. Please login again.");
        window.location.href = "/login.html"; // change if needed
        return;
    }

    try {
        const response = await fetch(`${apiBaseUrl}/api/students/my-profile`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                Phone_no: newPhone
            })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.detail || "Failed to update phone number");
            return;
        }

        alert(data.message);
        phoneInput.value = "";

    } catch (error) {
        console.error("Error:", error);
        alert("Something went wrong. Please try again.");
    }
}


// branch update function

async function updateSemester() {
    const semesterSelect = document.getElementById("edit-semester");
    const selectedSemester = semesterSelect.value;

    if (!selectedSemester) {
        alert("Please select a semester.");
        return;
    }

    const token = localStorage.getItem("access_token");

    if (!token) {
        alert("Session expired. Please login again.");
        window.location.href = "/login.html";
        return;
    }

    try {
        const response = await fetch(`${apiBaseUrl}/api/students/my-profile`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                sem: parseInt(selectedSemester)  // send as number
            })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.detail || "Failed to update semester");
            return;
        }

        alert(data.message);

        // Reset dropdown
        semesterSelect.value = "";

    } catch (error) {
        console.error("Error:", error);
        alert("Something went wrong. Please try again.");
    }
}
