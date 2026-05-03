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

      
        // ✅ Fill Personal Info
        setText("emp_id", data.Emp_Id);
        setText("employee_creation_time", new Date(data.employee_creation_time).toLocaleString());

        setText("full_name", data.First_name + " " + data.Middel_name + " " + data.Last_name);

        setText("first_name", data.First_name);

        setText("short_name", data.First_name + " " + data.Last_name);

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
        // setText("total_books_borrowed", data.total_books_borrowed);

        // setText("currently_borrowed", data.currently_borrowed);

        // setText("total_penalties", data.total_penalties);

        // setText("unpaid_penalties", data.unpaid_penalties);

        // setText("currently_overdue", data.currently_overdue);

        // setText("total_unpaid_amount", "₹ " + data.total_unpaid_amount.toFixed(2));


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



    } catch (error) {
        console.error("Error:", error);

        // If token expired or invalid → logout
        localStorage.removeItem("access_token");
        window.location.href = "librarian_login.html";
    }

});
