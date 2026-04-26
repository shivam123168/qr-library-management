const apiBaseUrl = `http://${window.location.hostname}:8000`;
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

        loadPenalties();// Load penalties for the first time
        loadPenaltyExcuses(); //  Load excuses for dropdown

    } catch (error) {
        console.error("Error:", error);

        // If token expired or invalid → logout
        localStorage.removeItem("access_token");
        window.location.href = "librarian_login.html";
    }

});



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

scrollPenaltyContainer.addEventListener("scroll", () => {

    if (
        scrollPenaltyContainer.scrollTop + scrollPenaltyContainer.clientHeight >=
        scrollPenaltyContainer.scrollHeight - 50
    ) {
        loadPenalties();
    }

});


// ✅ Filter Change (RESET DATA)
statusFilter.addEventListener("change", () => {
    loadPenalties(true);
});

borrowerFilter.addEventListener("change", () => {
    loadPenalties(true);
});



const excuseFilter1 = document.getElementById("excuseFilter1")
const excuseFilter2 = document.getElementById("excuseFilter2")

async function loadPenaltyExcuses() {

    const token = localStorage.getItem("access_token");  // Make sure this matches your login storage key

    if (!token) {
        console.error("JWT token not found. Please login again.");
        window.location.href = "librarian_login.html";
        return;
    }

    try {
        const response = await fetch(`${apiBaseUrl}/api/reference/penalty-excuses`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (response.status === 401) {
            alert("Session expired. Please login again.");
            window.location.href = "librarian_login.html";
            return;
        }

        if (!response.ok) {
            console.error("Failed to fetch excuses:", response.status);
            return;
        }

        const excuses = await response.json();

        // Reset dropdown
        excuseFilter1.innerHTML = `
            <option value="">Enter the Excuse</option>
        `;

        // Populate options dynamically
        excuses.forEach(excuse => {
            const option = document.createElement("option");
            option.value = excuse.penalty_excuse_id;  // Better to send ID to backend
            option.textContent = excuse.excuse;
            excuseFilter1.appendChild(option);
        });

         // Reset dropdown
        excuseFilter2.innerHTML = `
            <option value="">Enter the Excuse</option>
        `;

        // Populate options dynamically
        excuses.forEach(excuse => {
            const option = document.createElement("option");
            option.value = excuse.penalty_excuse_id;  // Better to send ID to backend
            option.textContent = excuse.excuse;
            excuseFilter2.appendChild(option);
        });

    } catch (error) {
        console.error("Error loading penalty excuses:", error);
    }
}

const tableBody = document.getElementById("StudentpenaltyInfoBody");
const prnInput = document.getElementById("studentPrnInput");

async function findstudentpenalty() {

    const prnId = prnInput.value.trim();

    if (!prnId) {
        alert("Please enter Student PRN");
        return;
    }

    const token = localStorage.getItem("access_token");

    if (!token) {
        alert("Session expired. Please login again.");
        window.location.href = "librarian_login.html";
        return;
    }

    try {

        const response = await fetch(`${apiBaseUrl}/api/penalties/student/${prnId}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        // 🔥 Handle auth errors
        if (response.status === 401) {
            alert("Session expired. Please login again.");
            window.location.href = "librarian_login.html";
            return;
        }

        if (response.status === 403) {
            alert("You are not authorized to access this data.");
            return;
        }

        if (response.status === 404) {
            alert("Student not found.");
            tableBody.innerHTML = "";
            return;
        }

        if (!response.ok) {
            console.error("HTTP Error:", response.status);
            return;
        }

        const data = await response.json();

        // Clear old table data
        tableBody.innerHTML = "";

        const penalties = data.penalties;

        if (penalties.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="12">No penalties found</td></tr>`;
            return;
        }

        penalties.forEach(penalty => {

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${penalty.penalty_id}</td>
                <td>${penalty.book_accession_number}</td>
                <td>${penalty.book_title}</td>
                <td>${data.borrower_id}</td>
                <td>${data.borrower_name}</td>
                <td>${data.borrower_type}</td>
                <td>₹ ${penalty.amount}</td>
                <td style="color: ${penalty.status.toLowerCase() === "not paid" ? "red" : "green"
                }; font-weight: bold;">${penalty.status}</td>
                <td>${penalty.excuse ? penalty.excuse : "N/A"}</td>
                <td>${formatDate(penalty.issue_date)}</td>
                <td>${formatDate(penalty.due_date)}</td>
                <td>
                    <button class="mark-paid-btn" onclick="markPaid(${penalty.penalty_id}, this)">Mark Paid</button>
                </td>
                <td>
                    <button class="waive-penalty-btn" onclick="waivePenalty(${penalty.penalty_id}, this)">Excuse Penalty</button>
                </td>
            `;

            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error("Error fetching penalties:", error);
    }
}


// Helper for formatting date
function formatDate(dateString) {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString();
}




const tableEmpBody = document.getElementById("EmployeePenaltyInfoBody");
const EmpInput = document.getElementById("employeePrnInput");

async function findEmployepenalty() {

    const EmpId = EmpInput.value.trim();

    if (!EmpId) {
        alert("Please enter Employee PRN");
        return;
    }

    const token = localStorage.getItem("access_token");

    if (!token) {
        alert("Session expired. Please login again.");
        window.location.href = "librarian_login.html";
        return;
    }

    try {

        const response = await fetch(`${apiBaseUrl}/api/penalties/employee/${EmpId}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        // 🔥 Handle auth errors
        if (response.status === 401) {
            alert("Session expired. Please login again.");
            window.location.href = "librarian_login.html";
            return;
        }

        if (response.status === 403) {
            alert("You are not authorized to access this data.");
            return;
        }

        if (response.status === 404) {
            alert("Employee not found.");
            tableEmpBody.innerHTML = "";
            return;
        }

        if (!response.ok) {
            console.error("HTTP Error:", response.status);
            return;
        }

        const data = await response.json();

        // Clear old table data
        tableEmpBody.innerHTML = "";

        const penalties = data.penalties;

        if (penalties.length === 0) {
            tableEmpBody.innerHTML = `<tr><td colspan="12">No penalties found</td></tr>`;
            return;
        }

        penalties.forEach(penalty => {

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${penalty.penalty_id}</td>
                <td>${penalty.book_accession_number}</td>
                <td>${penalty.book_title}</td>
                <td>${data.borrower_id}</td>
                <td>${data.borrower_name}</td>
                <td>${data.borrower_type}</td>
                <td>₹ ${penalty.amount}</td>
                <td style="color: ${penalty.status.toLowerCase() === "not paid" ? "red" : "green"
                }; font-weight: bold;">${penalty.status}</td>
                <td>${penalty.excuse ? penalty.excuse : "N/A"}</td>
                <td>${formatDate(penalty.issue_date)}</td>
                <td>${formatDate(penalty.due_date)}</td>
                <td>
                    <button class="mark-paid-btn" onclick="markPaid(${penalty.penalty_id}, this)">Mark Paid</button>
                </td>
                <td>
                    <button class="waive-penalty-btn" onclick="waivePenalty(${penalty.penalty_id}, this)">Excuse Penalty</button>
                </td>
            `;

            tableEmpBody.appendChild(row);
        });

    } catch (error) {
        console.error("Error fetching penalties:", error);
    }
}


async function markPaid(penaltyId, buttonElement) {

    if (!confirm("Are you sure you want to mark this penalty as paid?")) {
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
            `${apiBaseUrl}/api/penalties/${penaltyId}/mark-paid`,
            {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            }
        );

        if (response.status === 401) {
            alert("Session expired. Please login again.");
            window.location.href = "librarian_login.html";
            return;
        }

        if (response.status === 403) {
            alert("You are not authorized.");
            return;
        }

        if (response.status === 404) {
            alert("Penalty not found.");
            return;
        }

        if (response.status === 400) {
            const errorData = await response.json();
            alert(errorData.detail);
            return;
        }

        if (!response.ok) {
            console.error("HTTP Error:", response.status);
            return;
        }

        const data = await response.json();

        alert(data.message);

        // 🔥 Update status cell in same row
        const row = buttonElement.closest("tr");
        const statusCell = row.children[7]; // 7 = status column index
        statusCell.textContent = "paid";

        // 🔥 Disable button
        buttonElement.disabled = true;
        buttonElement.textContent = "Paid";

    } catch (error) {
        console.error("Error marking penalty as paid:", error);
    }
}



async function waivePenalty(penaltyId, buttonElement) {

    const excuseSelect = document.getElementById("excuseFilter1");
    const excuseValue = excuseSelect.value;

    if (!excuseValue) {
        alert("Please select an excuse before waiving.");
        return;
    }

    if (!confirm("Are you sure you want to waive this penalty?")) {
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
            `${apiBaseUrl}/api/penalties/${penaltyId}/waive`,
            {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    penalty_excuse_id: parseInt(excuseValue) // Send excuse ID to backend
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            alert(data.detail || "Failed to waive penalty");
            return;
        }

        alert(data.message);

        // 🔥 Update table row UI
        const row = buttonElement.closest("tr");

        // Update Status column (index 7 based on your table)
        const statusCell = row.children[7];
        statusCell.textContent = "no penalty";

        // Disable both buttons in that row
        const buttons = row.querySelectorAll("button");
        buttons.forEach(btn => {
            btn.disabled = true;
        });

        // Change clicked button text
        buttonElement.textContent = "Excused";

    } catch (error) {
        console.error("Error waiving penalty:", error);
        alert("Something went wrong");
    }
}