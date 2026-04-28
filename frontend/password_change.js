
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


    } catch (error) {
        console.error("Error:", error);

        // If token expired or invalid → logout
        localStorage.removeItem("access_token");
        window.location.href = "librarian_login.html";
    }

});


// ===============================
// CHANGE STUDENT PASSWORD
// ===============================

async function ChangePassword() {

    const prn = document.getElementById("StudentPRN").value.trim();
    const newPassword = document.getElementById("NewPassword").value.trim();

    if (!prn || !newPassword) {
        alert("Please enter Student PRN and New Password");
        return;
    }

    const token = localStorage.getItem("access_token");

    if (!token) {
        alert("You are not logged in. Please login again.");
        return;
    }

    try {

        const response = await fetch(
            `${apiBaseUrl}/api/students/${prn}/password/reset`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    new_password: newPassword
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || "Failed to reset password");
        }

        // ✅ Success
        alert(data.message);
        console.log("Password reset response:", data);

        // Clear fields
        document.getElementById("StudentPRN").value = "";
        document.getElementById("NewPassword").value = "";

    } catch (error) {
        console.error("Password reset error:", error);
        alert("Error: " + error.message);
    }
}


// ===============================
// CHANGE EMPLOYEE PASSWORD
// ===============================

async function ChangeEmployeePassword() {

    const empId = document.getElementById("EmployeeID").value.trim();
    const newPassword = document.getElementById("EmployeeNewPassword").value.trim();

    if (!empId || !newPassword) {
        alert("Please enter Employee ID and New Password");
        return;
    }

    const token = localStorage.getItem("access_token");

    if (!token) {
        alert("You are not logged in. Please login again.");
        return;
    }

    try {

        const response = await fetch(
            `${apiBaseUrl}/api/employees/${empId}/password/reset`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    new_password: newPassword
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || "Failed to reset password");
        }

        // ✅ Success
        alert(data.message);
        console.log("Employee password reset response:", data);

        // Clear fields
        document.getElementById("EmployeeID").value = "";
        document.getElementById("EmployeeNewPassword").value = "";

    } catch (error) {
        console.error("Employee password reset error:", error);
        alert("Error: " + error.message);
    }
}
