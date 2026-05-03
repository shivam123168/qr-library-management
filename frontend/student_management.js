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


function togglePassword() {
    let passField = document.getElementById("password");
    let toggleBtn = document.getElementById("toggletext");


    if (passField.type === "password") {
        passField.type = "text";
        toggleBtn.textContent = "Hide";
    } else {
        passField.type = "password";
        toggleBtn.textContent = "Show";

    }
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

        div.textContent = "Copy No:" + book.Copy_Number + " Title:" + book.Title + " Rack:" + book.rack_location + " Self:" + book.self_location;




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


        loadBranches();

    } catch (error) {
        console.error("Error:", error);

        // If token expired or invalid → logout
        localStorage.removeItem("access_token");
        window.location.href = "librarian_login.html";
    }

});


// ===============================
// LOAD BRANCHES INTO DROPDOWN
// ===============================

async function loadBranches() {

    try {
        const response = await fetch(`${apiBaseUrl}/api/reference/branches`);

        if (!response.ok) {
            throw new Error("Failed to fetch branches");
        }

        const branches = await response.json();

        const branchSelect1 = document.getElementById("branch1");
        const branchSelect2 = document.getElementById("branch2");

        // Clear existing options except first one
        branchSelect1.innerHTML = '<option value="">Select Branch</option>';
        branchSelect2.innerHTML = '<option value="">Select Branch</option>';

        branches.forEach(branch => {
            const option = document.createElement("option");
            option.value = branch.Branch_id;        // send ID to backend
            option.textContent = branch.Branch_name; // show name to user
            branchSelect1.appendChild(option);

        });


        branches.forEach(branch => {
            const option = document.createElement("option");
            option.value = branch.Branch_id;        // send ID to backend
            option.textContent = branch.Branch_name; // show name to user

            branchSelect2.appendChild(option);
        });

        console.log("Branches loaded successfully");

    } catch (error) {
        console.error("Error loading branches:", error);
        alert("Unable to load branches");
    }
}

// ===============================
// GET STUDENT BY PRN
// ===============================

async function GetStudent() {

    const prn = document.getElementById("prn").value.trim();

    if (!prn) {
        alert("Please enter PRN number");
        return;
    }

    const token = localStorage.getItem("access_token");

    if (!token) {
        alert("You are not logged in. Please login again.");
        return;
    }

    try {

        const response = await fetch(
            `${apiBaseUrl}/api/students/${prn}`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || "Failed to fetch student");
        }

        console.log("Student data:", data);

        // ===============================
        // FILL FORM FIELDS
        // ===============================

        document.getElementById("fname").value = data.first_name || "";
        document.getElementById("mname").value = data.Middle_name || "";
        document.getElementById("lname").value = data.last_name || "";
        document.getElementById("sem").value = data.sem || "";
        document.getElementById("email").value = data.gmail || "";
        document.getElementById("phone").value = data.Phone_no || "";

        // Format DOB for input type="date"
        if (data.DOB) {
            document.getElementById("dob").value = data.DOB.split("T")[0];
        }

        // Set branch dropdown
        if (data.Branch_id) {
            document.getElementById("branch1").value = data.Branch_id;
        }

        // Password field usually left empty (security)
        document.getElementById("password").value = "";

        alert("Student details loaded successfully");

    } catch (error) {
        console.error("Get student error:", error);
        alert("Error: " + error.message);
    }
}

// update student details

async function UpdateStudent() {

    const prnId = document.getElementById("prn").value;

    if (!prnId) {
        alert("Please enter PRN");
        return;
    }

    const studentData = {
        first_name: document.getElementById("fname").value,
        Middle_name: document.getElementById("mname").value,
        last_name: document.getElementById("lname").value,
        DOB: document.getElementById("dob").value,
        sem: document.getElementById("sem").value,
        Branch_id: parseInt(document.getElementById("branch1").value),
        gmail: document.getElementById("email").value,
        Phone_no: document.getElementById("phone").value,
        password: document.getElementById("password").value
    };

    try {
        const response = await fetch(`${apiBaseUrl}/api/students/${prnId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem("access_token")
            },
            body: JSON.stringify(studentData)
        });

        const result = await response.json();

        if (response.ok) {
            alert("Student Updated Successfully ✅");
            console.log(result);
            // reset form
            document.querySelector("form").reset();
        } else {
            alert(result.detail || "Update Failed ❌");
            console.log(result);
        }

    } catch (error) {
        console.error("Error:", error);
        alert("Something went wrong!");
    }
}


async function AddStudent() {

    const studentData = {
        Prn_id: parseInt(document.getElementById("prn").value),
        first_name: document.getElementById("fname").value,
        Middle_name: document.getElementById("mname").value,
        last_name: document.getElementById("lname").value,
        DOB: document.getElementById("dob").value,
        sem: document.getElementById("sem").value,
        Phone_no: document.getElementById("phone").value,
        password: document.getElementById("password").value,
        gmail: document.getElementById("email").value,
        Branch_id: parseInt(document.getElementById("branch1").value)
    };

    try {
        const response = await fetch(`${apiBaseUrl}/api/students`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem("access_token")
            },
            body: JSON.stringify(studentData)
        });

        const result = await response.json();

        if (response.ok) {
            alert("Student Created Successfully ✅");

            console.log("Created:", result);
            // reset form
            document.querySelector("form").reset();
        } else {
            alert(result.detail || "Creation Failed ❌");
            console.log(result);
        }

    } catch (error) {
        console.error("Error:", error);
        alert("Something went wrong!");
    }
}

async function DeleteStudent() {

    const prnId = document.getElementById("delete-prn").value;

    if (!prnId) {
        alert("Please enter Student PRN");
        return;
    }

    // Confirmation before delete
    const confirmDelete = confirm("Are you sure you want to delete this student?");
    if (!confirmDelete) return;

    try {
        const response = await fetch(`${apiBaseUrl}/api/students/${prnId}`, {
            method: "DELETE",
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("access_token")
            }
        });

        if (response.status === 204) {
            alert("Student Deleted Successfully ✅");
            document.getElementById("delete-prn").value = "";
        }
        else {
            const result = await response.json();
            alert(result.detail || "Delete Failed ❌");
            console.log(result);
        }

    } catch (error) {
        console.error("Error:", error);
        alert("Something went wrong!");
    }
}





let lastPrn = null;
let isLoading = false;
let hasMore = true;
const limit = 10;

const tableBody = document.getElementById("AllStudentInfo");
const scrollContainer = document.getElementById("ScrollContaner");


// 🔹 Load Students
async function loadStudents(reset = false) {

    if (isLoading || (!hasMore && !reset)) return;

    isLoading = true;

    if (reset) {
        lastPrn = null;
        hasMore = true;
        tableBody.innerHTML = "";
    }

    const branch = document.getElementById("branch2").value;
    const sem = document.getElementById("semFilter").value;

    let url = `${apiBaseUrl}/api/students?limit=${limit}`;

    if (lastPrn) url += `&last_prn=${lastPrn}`;
    if (branch) url += `&branch_id=${branch}`;
    if (sem) url += `&sem=${sem}`;

    try {
        const response = await fetch(url, {
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("access_token")
            }
        });

        const students = await response.json();

        if (response.ok) {

            if (students.length < limit) {
                hasMore = false; // No more data
            }

            students.forEach(student => {

                const row = document.createElement("tr");

                const fullName = `${student.first_name} ${student.Middle_name || ""} ${student.last_name}`;

                const dob = new Date(student.DOB);
                const age = new Date().getFullYear() - dob.getFullYear();

                row.innerHTML = `
                    <td>${student.Prn_id}</td>
                    <td>${fullName}</td>
                    <td>${student.DOB}</td>
                    <td>${age}</td>
                    <td>${student.sem}</td>
                    <td>${student.branch_name || ""}</td>
                    <td>${student.gmail}</td>
                    <td>${student.Phone_no}</td>
                `;

                tableBody.appendChild(row);
            });

            if (students.length > 0) {
                lastPrn = students[students.length - 1].Prn_id;
            }

        } else {
            console.log(students);
            alert("Failed to load students");
        }

    } catch (error) {
        console.error("Error:", error);
    }

    isLoading = false;
}


// 🔹 Infinite Scroll Trigger
scrollContainer.addEventListener("scroll", () => {

    if (
        scrollContainer.scrollTop + scrollContainer.clientHeight >=
        scrollContainer.scrollHeight - 10
    ) {
        loadStudents();
    }
});


// 🔹 Filter Change Event
document.getElementById("branch2").addEventListener("change", () => {
    loadStudents(true); // reset data
});

document.getElementById("semFilter").addEventListener("change", () => {
    loadStudents(true);
});


// 🔹 Initial Load
window.addEventListener("DOMContentLoaded", () => {
    loadStudents();
});




const prnInput = document.getElementById("Student_Prn");
const tablePrnBody = document.getElementById("StudentInfoByPRN");

prnInput.addEventListener("change", fetchStudentByPRN);
// You can also use "keyup" if you want instant search


async function fetchStudentByPRN() {

    const prnId = prnInput.value;

    if (!prnId) {
        tablePrnBody.innerHTML = "";
        return;
    }

    try {
        const response = await fetch(`${apiBaseUrl}/api/students/${prnId}`, {
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("access_token")
            }
        });

        const data = await response.json();

        tablePrnBody.innerHTML = "";

        if (response.ok) {

            const dob = new Date(data.DOB);
            const today = new Date();

            let age = today.getFullYear() - dob.getFullYear();
            const monthDiff = today.getMonth() - dob.getMonth();

            if (monthDiff < 0 ||
                (monthDiff === 0 && today.getDate() < dob.getDate())) {
                age--;
            }

            const fullName = `${data.first_name} ${data.Middle_name || ""} ${data.last_name}`;

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${new Date(data.student_creation_time).toLocaleString()}</td>
                <td>${data.Prn_id}</td>
                <td>${fullName}</td>
                <td>${data.DOB}</td>
                <td>${age}</td>
                <td>${data.sem}</td>
                <td>${data.branch_name || ""}</td>
                <td>${data.gmail}</td>
                <td>${data.Phone_no}</td>
            `;

            tablePrnBody.appendChild(row);

        } else {
            tablePrnBody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align:center; color:red;">
                        ${data.detail}
                    </td>
                </tr>
            `;
        }

    } catch (error) {
        console.error("Error:", error);
        tablePrnBody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align:center; color:red;">
                    Something went wrong
                </td>
            </tr>
        `;
    }
}


const input = document.getElementById("Student_Name");
const tableNameBody = document.getElementById("StudentInfoByName");

// Listen when user types
input.addEventListener("input", async function () {

    const name = input.value.trim();

    // Clear table if input is empty
    if (name.length < 2) {
        tableNameBody.innerHTML = "";
        return;
    }

    try {
        const token = localStorage.getItem("access_token"); // if using JWT auth

        const response = await fetch(
            `${apiBaseUrl}/api/students/search/by-name?name=${name}`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`, // remove if not needed
                    "Content-Type": "application/json"
                }
            }
        );

        if (!response.ok) {
            throw new Error("Failed to fetch students");
        }

        const students = await response.json();

        // Clear previous results
        tableNameBody.innerHTML = "";

        students.forEach(student => {

            const row = `
                <tr>
                    <td>${student.created_at || ""}</td>
                    <td>${student.Prn_id || ""}</td>
                    <td>
                        ${student.first_name || ""} 
                        ${student.Middle_name || ""} 
                        ${student.last_name || ""}
                    </td>
                    <td>${student.DOB || ""}</td>
                    <td>${student.age || ""}</td>
                    <td>${student.sem || ""}</td>
                    <td>${student.Branch_name || ""}</td>
                    <td>${student.gmail || ""}</td>
                    <td>${student.Phone_no || ""}</td>
                </tr>
            `;

            tableNameBody.innerHTML += row;
        });

    } catch (error) {
        console.error("Error:", error);
    }
});
