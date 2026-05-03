const apiBaseUrl = `http://${window.location.hostname}:8000`;
const toggleBtn = document.querySelector(".toggle_btn");
const toggleBtnIcon = document.querySelector(".toggle_btn i");
const dropDownManue = document.querySelector(".dropdown_manue");
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


// logout function
function logout() {
    // Remove token
    localStorage.removeItem("access_token");

    // (Optional) Remove other user data
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_type");

    // Redirect to login page
    window.location.href = "employee_login.html";
}


toggleBtn.onclick = function () {
    dropDownManue.classList.toggle("open");
    const isOpen = dropDownManue.classList.contains("open");

    toggleBtnIcon.classList = isOpen
        ? "fa-solid fa-xmark"
        : "fa-solid fa-bars";
};


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
    link.download = "employee_qrcode.png";
    link.click();
}


// Employee Page info get JS
document.addEventListener("DOMContentLoaded", async function () {

    const token = localStorage.getItem("access_token");

    // 🚨 If not logged in → redirect
    if (!token) {
        window.location.href = "employee_login.html";
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
            window.location.href = "employee_login.html";
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

      
        // ✅ Fill Personal Info
        setText("emp_id", data.Emp_Id);
        setText("employee_creation_time", new Date(data.employee_creation_time).toLocaleString());

        setText("full_name", data.First_name + " " + data.Middel_name + " " + data.Last_name);

        setText("first_name", data.First_name);

        setText("short_name", data.First_name);

        setText("dob", data.DOB);

        setText("age", calculateAge(data.DOB) + " years");

        setText("department", data.department_name || "N/A");

        setText("gmail", data.Gmail);
        setText("phone_no", data.Phone_no);
        setText("post_name", data.post_name || "N/A");

        // ✅ Department Info
        setText("dept_id", data.department_name || "N/A");
        setText("post_id", data.post_name || "N/A");

        // ✅ Transaction Info
        setText("total_books_borrowed", data.total_books_borrowed);

        setText("currently_borrowed", data.currently_borrowed);

        setText("total_penalties", data.total_penalties);

        setText("unpaid_penalties", data.unpaid_penalties);

        setText("currently_overdue", data.currently_overdue);

        setText("total_unpaid_amount", "₹ " + data.total_unpaid_amount.toFixed(2));


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

        generateQR(data.Emp_Id) // Generate QR code for employee ID

        loadIssuedBooks(); // Load issued books on page load

        loadReturnedBooks(); // Load returned books on page load

        loadOverdueBooks(); // Load overdue books on page load

        loadPenalties(); // Load penalties on page load

        loadPendingRequests(); // Load pending requests on page load

        loadApprovedRequests(); // Load approved requests on page load

        loadRejectedRequests(); // Load rejected requests on page load


    } catch (error) {
        console.error("Error:", error);

        // If token expired or invalid → logout
        localStorage.removeItem("access_token");
        window.location.href = "employee_login.html";
    }

});



async function loadIssuedBooks() {

    const token = localStorage.getItem("access_token");

    if (!token) {
        window.location.href = "employee_login.html";
        return;
    }

    try {
        const response = await fetch(
            `${apiBaseUrl}/api/employees/my-borrowed-books`,
            {
                method: "GET",
                headers: {
                    "Authorization": "Bearer " + token,
                    "Content-Type": "application/json"
                }
            }
        );

        if (response.status === 401) {
            alert("Session expired. Please login again.");
            localStorage.clear();
            window.location.href = "employee_login.html";
            return;
        }

        const data = await response.json();

        if (!response.ok) {
            console.error(data);
            alert("Failed to load issued books.");
            return;
        }

        const tbody = document.getElementById("issuedBooksBody");
        tbody.innerHTML = "";

        // 📭 No books
        if (data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align:center;">
                        No books currently issued.
                    </td>
                </tr>
            `;
            return;
        }

        data.forEach(record => {

            const issuedDate = new Date(record.issue_time).toLocaleDateString();
            const deadline = new Date(record.due_date).toLocaleDateString();

            const row = `
                <tr>
                    <td>${record.book.Accession_number}</td>
                    <td>${record.book.title}</td>
                    <td>${issuedDate}</td>
                    <td style="color:${record.status === "Overdue" ? "red" : "green"}">${deadline}</td>
                </tr>
            `;

            tbody.innerHTML += row;
        });

    } catch (error) {
        console.error("Error:", error);
        // alert("Server error. Please try again.");
    }
}



async function loadReturnedBooks() {

    const token = localStorage.getItem("access_token");

    if (!token) {
        window.location.href = "employee_login.html";
        return;
    }

    try {
        const response = await fetch(
            `${apiBaseUrl}/api/employees/my-returned-books`,
            {
                method: "GET",
                headers: {
                    "Authorization": "Bearer " + token,
                    "Content-Type": "application/json"
                }
            }
        );

        if (response.status === 401) {
            alert("Session expired. Please login again.");
            localStorage.clear();
            window.location.href = "employee_login.html";
            return;
        }

        const data = await response.json();

        if (!response.ok) {
            console.error(data);
            alert("Failed to load returned books.");
            return;
        }

        const tbody = document.getElementById("returnedBooksBody");
        tbody.innerHTML = "";

        // 📭 No returned books
        if (data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="3" style="text-align:center;">
                        No returned books found.
                    </td>
                </tr>
            `;
            return;
        }

        data.forEach(record => {

            const issuedDate = new Date(record.issue_time).toLocaleDateString();
            const returnedDate = record.returned_date
                ? new Date(record.returned_date).toLocaleDateString()
                : "N/A";

            const row = `
                <tr>
                     <td>${record.book.Accession_number}</td>
                    <td>${record.book.title}</td>
                    <td>${issuedDate}</td>
                    <td>${returnedDate}</td>
                </tr>
            `;

            tbody.innerHTML += row;
        });

    } catch (error) {
        console.error("Error:", error);
        // alert("Server error. Please try again.");
    }
}


async function loadOverdueBooks() {

    const token = localStorage.getItem("access_token");

    if (!token) {
        window.location.href = "employee_login.html";
        return;
    }

    try {
        const response = await fetch(
            `${apiBaseUrl}/api/employees/my-overdue-books`,
            {
                method: "GET",
                headers: {
                    "Authorization": "Bearer " + token,
                    "Content-Type": "application/json"
                }
            }
        );

        if (response.status === 401) {
            alert("Session expired. Please login again.");
            localStorage.clear();
            window.location.href = "employee_login.html";
            return;
        }

        const data = await response.json();

        if (!response.ok) {
            console.error(data);
            alert("Failed to load overdue books.");
            return;
        }

        const tbody = document.getElementById("overdueBooksBody");
        tbody.innerHTML = "";

        // 📭 No overdue books
        if (data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="3" style="text-align:center;">
                        No overdue books 🎉
                    </td>
                </tr>
            `;
            return;
        }

        data.forEach(record => {

            const dueDate = new Date(record.due_date).toLocaleDateString();
            const overdueDays = record.days_overdue ?? 0;

            const row = `
                <tr>
                     <td>${record.book.Accession_number}</td>
                    <td>${record.book.title}</td>
                    <td>${dueDate}</td>
                    <td style="color: red; font-weight: bold;">${overdueDays} days</td>
                </tr>
            `;

            tbody.innerHTML += row;
        });

    } catch (error) {
        console.error("Error:", error);
        // alert("Server error. Please try again.");
    }
}



async function loadPenalties() {

    const token = localStorage.getItem("access_token");

    if (!token) {
        window.location.href = "employee_login.html";
        return;
    }

    try {
        const response = await fetch(
            `${apiBaseUrl}/api/penalties/employee/my-penalties`,
            {
                method: "GET",
                headers: {
                    "Authorization": "Bearer " + token,
                    "Content-Type": "application/json"
                }
            }
        );

        if (response.status === 401) {
            alert("Session expired. Please login again.");
            localStorage.clear();
            window.location.href = "employee_login.html";
            return;
        }

        const data = await response.json();

        if (!response.ok) {
            console.error(data);
            alert("Failed to load penalties.");
            return;
        }

        const tbody = document.getElementById("penaltyBooksBody");
        tbody.innerHTML = "";

        const penalties = data.penalties;

        // 📭 No penalties
        if (!penalties || penalties.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align:center;">
                        No penalties found 🎉
                    </td>
                </tr>
            `;
            return;
        }

        penalties.forEach(penalty => {

            const amount = "₹ " + penalty.amount.toFixed(2);
            const statusColor = penalty.status === "not paid" ? "red" : "green";
            const excuseText = penalty.excuse ? penalty.excuse : "—";

            const row = `
                <tr>
                    <td>${penalty.book_accession_number}</td>
                    <td>${penalty.book_title}</td>
                    <td>${amount}</td>
                    <td style="color:${statusColor}; font-weight:600;">
                        ${penalty.status}
                    </td>
                    <td>${excuseText}</td>
                </tr>
            `;

            tbody.innerHTML += row;
        });

    } catch (error) {
        console.error("Error:", error);
        // alert("Server error. Please try again.");
    }
}



async function loadPendingRequests() {

    const token = localStorage.getItem("access_token");

    if (!token) {
        window.location.href = "employee_login.html";
        return;
    }

    try {
        const response = await fetch(
            `${apiBaseUrl}/api/book-requests/employee/my-requests/pending`,
            {
                method: "GET",
                headers: {
                    "Authorization": "Bearer " + token,
                    "Content-Type": "application/json"
                }
            }
        );

        if (response.status === 401) {
            alert("Session expired. Please login again.");
            localStorage.clear();
            window.location.href = "employee_login.html";
            return;
        }

        const data = await response.json();

        if (!response.ok) {
            console.error(data);
            alert("Failed to load pending requests.");
            return;
        }

        const tbody = document.getElementById("pendingBooksBody");
        tbody.innerHTML = "";

        // 📭 No pending requests
        if (data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align:center;">
                        No pending requests found.
                    </td>
                </tr>
            `;
            return;
        }

        data.forEach(request => {

            const requestDate = new Date(request.request_time).toLocaleDateString();

            const row = `
                <tr>
                    <td>${request.request_id}</td>
                    <td>${request.book_accession_number}</td>
                    <td>${request.book_title}</td>
                    <td>${requestDate}</td>
                </tr>
            `;

            tbody.innerHTML += row;
        });

    } catch (error) {
        console.error("Error:", error);
        // alert("Server error. Please try again.");
    }
}



async function loadApprovedRequests() {

    const token = localStorage.getItem("access_token");

    if (!token) {
        window.location.href = "employee_login.html";
        return;
    }

    try {
        const response = await fetch(
            `${apiBaseUrl}/api/book-requests/employee/my-requests/approved`,
            {
                method: "GET",
                headers: {
                    "Authorization": "Bearer " + token,
                    "Content-Type": "application/json"
                }
            }
        );

        if (response.status === 401) {
            alert("Session expired. Please login again.");
            localStorage.clear();
            window.location.href = "employee_login.html";
            return;
        }

        const data = await response.json();

        if (!response.ok) {
            console.error(data);
            alert("Failed to load approved requests.");
            return;
        }

        const tbody = document.getElementById("approvedBooksBody");
        tbody.innerHTML = "";

        // 📭 No approved requests
        if (data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align:center;">
                        No approved requests found.
                    </td>
                </tr>
            `;
            return;
        }

        data.forEach(request => {

            const requestDate = new Date(request.request_time).toLocaleDateString();

            const row = `
                <tr>
                    <td>${request.request_id}</td>
                    <td>${request.book_accession_number}</td>
                    <td style="color: green; font-weight: bold;">${request.book_title}</td>
                    <td>${requestDate}</td>
                </tr>
            `;

            tbody.innerHTML += row;
        });

    } catch (error) {
        console.error("Error:", error);
        // alert("Server error. Please try again.");
    }
}


async function loadRejectedRequests() {

    const token = localStorage.getItem("access_token");

    if (!token) {
        window.location.href = "employee_login.html";
        return;
    }

    try {
        const response = await fetch(
            `${apiBaseUrl}/api/book-requests/employee/my-requests/rejected`,
            {
                method: "GET",
                headers: {
                    "Authorization": "Bearer " + token,
                    "Content-Type": "application/json"
                }
            }
        );

        if (response.status === 401) {
            alert("Session expired. Please login again.");
            localStorage.clear();
            window.location.href = "employee_login.html";
            return;
        }

        const data = await response.json();

        if (!response.ok) {
            console.error(data);
            alert("Failed to load rejected requests.");
            return;
        }

        const tbody = document.getElementById("rejectedBooksBody");
        tbody.innerHTML = "";

        // 📭 No rejected requests
        if (data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align:center;">
                        No rejected requests found.
                    </td>
                </tr>
            `;
            return;
        }

        data.forEach(request => {

            const requestDate = new Date(request.request_time).toLocaleDateString();

            const row = `
                <tr>
                    <td>${request.request_id}</td>
                    <td>${request.book_accession_number}</td>
                    <td style="color: red; font-weight: 500;">${request.book_title}</td>
                    <td>${requestDate}</td>
                </tr>
            `;

            tbody.innerHTML += row;
        });

    } catch (error) {
        console.error("Error:", error);
        // alert("Server error. Please try again.");
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


    const response = await fetch(`${apiBaseUrl}/api/book-requests/employee/create`, {
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

