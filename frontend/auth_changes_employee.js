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


    } catch (error) {
        console.error("Error:", error);

        // If token expired or invalid → logout
        localStorage.removeItem("access_token");
        window.location.href = "employee_login.html";
    }

});



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
        const response = await fetch(`${apiBaseUrl}/api/employees/my-profile`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                Gmail: newEmail
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
        const response = await fetch(`${apiBaseUrl}/api/employees/password/change`, {
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
        const response = await fetch(`${apiBaseUrl}/api/employees/my-profile`, {
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