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


        loadEmployeePosts();
        loadDepartments();
        loadEmployees(true);

    } catch (error) {
        console.error("Error:", error);

        // If token expired or invalid → logout
        localStorage.removeItem("access_token");
        window.location.href = "librarian_login.html";
    }

});




async function loadEmployeePosts() {

    const select = document.getElementById("employee_post");
    const postFilter = document.getElementById("PostFilter");

    try {
        const response = await fetch(`${apiBaseUrl}/api/reference/employee-posts`, {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("access_token")
            }
        });

        const posts = await response.json();

        // Remove old options except the first one
        select.innerHTML = `<option value="">Select Role</option>`;

        posts.forEach(post => {

            const option = document.createElement("option");

            option.value = post.Employee_post_id;
            option.textContent = post.post_name;

            select.appendChild(option);

        });


        // Remove old options except the first one
        postFilter.innerHTML = `<option value="">All (Select Post)</option>`;

        posts.forEach(post => {

            const option = document.createElement("option");

            option.value = post.Employee_post_id;
            option.textContent = post.post_name;

            postFilter.appendChild(option);

        });

    } catch (error) {
        console.error("Error loading employee posts:", error);
    }

}


async function loadDepartments() {

    const select = document.getElementById("employee_department");
    const departmentfilter = document.getElementById("departmentFilter");

    try {
        const response = await fetch(`${apiBaseUrl}/api/reference/departments`, {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("access_token")
            }
        });

        const departments = await response.json();

        // reset dropdown
        select.innerHTML = `<option value="">Select Department</option>`;

        departments.forEach(dept => {

            const option = document.createElement("option");

            option.value = dept.Department_id;
            option.textContent = dept.department_name;

            select.appendChild(option);

        });

        // reset dropdown
        departmentfilter.innerHTML = `<option value="">All (Select Department)</option>`;

        departments.forEach(dept => {

            const option = document.createElement("option");

            option.value = dept.Department_id;
            option.textContent = dept.department_name;

            departmentfilter.appendChild(option);

        });

    } catch (error) {
        console.error("Error loading departments:", error);
    }

}



async function GetEmployee() {

    const empId = document.getElementById("Empid").value;

    if (!empId) {
        alert("Please enter Employee ID");
        return;
    }

    try {

        const response = await fetch(`${apiBaseUrl}/api/employees/${empId}`, {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("access_token")
            }
        });

        const employee = await response.json();

        if (!response.ok) {
            alert(employee.detail || "Employee not found");
            return;
        }

        // Fill form fields
        document.getElementById("fname").value = employee.First_name || "";
        document.getElementById("mname").value = employee.Middle_name || "";
        document.getElementById("lname").value = employee.Last_name || "";
        document.getElementById("dob").value = employee.DOB || "";
        document.getElementById("email").value = employee.Gmail || "";
        document.getElementById("phone").value = employee.Phone_no || "";

        // Set dropdown values (IDs)
        document.getElementById("employee_post").value = employee.Employee_post_id || "";
        document.getElementById("employee_department").value = employee.Department_id || "";

    }
    catch (error) {

        console.error("Error:", error);
        alert("Something went wrong while fetching employee data");

    }

}


async function AddEmployee() {
    console.log("AddEmployee called");
    // event.preventDefault(); // stop form reload
    console.log("Form submission prevented");
    const employeeData = {
        Emp_Id: parseInt(document.getElementById("Empid").value),
        First_name: document.getElementById("fname").value,
        Middle_name: document.getElementById("mname").value,
        Last_name: document.getElementById("lname").value,
        DOB: document.getElementById("dob").value,
        Employee_post_id: parseInt(document.getElementById("employee_post").value),
        Department_id: parseInt(document.getElementById("employee_department").value),
        Gmail: document.getElementById("email").value,
        Phone_no: document.getElementById("phone").value,
        Password: document.getElementById("password").value
    };
    console.log("Employee data collected:", employeeData);
    try {

        const response = await fetch(`${apiBaseUrl}/api/employees`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem("access_token")
            },

            body: JSON.stringify(employeeData)
        });

        const result = await response.json();

        if (response.ok) {

            alert("Employee added successfully ✅");

            // reset form
            document.querySelector("form").reset();

            console.log(result);

        } else {

            alert(result.detail || "Failed to add employee");

        }

    } catch (error) {

        console.error("Error:", error);
        alert("Something went wrong!");

    }
}


async function UpdateEmployee() {

    const empId = document.getElementById("Empid").value;

    if (!empId) {
        alert("Please enter Employee ID");
        return;
    }

    const employeeData = {
        Emp_Id: parseInt(empId),
        First_name: document.getElementById("fname").value,
        Middle_name: document.getElementById("mname").value,
        Last_name: document.getElementById("lname").value,
        DOB: document.getElementById("dob").value,
        Phone_no: document.getElementById("phone").value,
        Gmail: document.getElementById("email").value,
        Employee_post_id: parseInt(document.getElementById("employee_post").value) || null,
        Department_id: parseInt(document.getElementById("employee_department").value) || null
    };

    try {

        const response = await fetch(`${apiBaseUrl}/api/employees/${empId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem("access_token")
            },
            body: JSON.stringify(employeeData)
        });

        const data = await response.json();

        if (response.ok) {
            alert("Employee updated successfully!");
            console.log(data);
        } else {
            alert("Error: " + data.detail);
            console.log(data);
        }

    } catch (error) {
        console.error("Error:", error);
        alert("Failed to connect to API");
    }
}


async function DeleteEmployee() {

    const empId = document.getElementById("EmployeeId").value;

    if (!empId) {
        alert("Please enter Employee ID");
        return;
    }

    const confirmDelete = confirm("Are you sure you want to delete this employee?");
    if (!confirmDelete) {
        return;
    }

    try {



        const response = await fetch(`${apiBaseUrl}/api/employees/${empId}`, {
            method: "DELETE",
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("access_token")
            }
        });

        if (response.status === 204) {
            alert("Employee deleted successfully");
            document.getElementById("EmployeeId").value = "";
        }
        else {
            const data = await response.json();
            alert("Error: " + data.detail);
            console.log(data);
        }

    } catch (error) {
        console.error("Error:", error);
        alert("Failed to connect to API");
    }
}


const input = document.getElementById("Employee_Name");
const tableNameBody = document.getElementById("EmployeeInfoByName");

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
            `${apiBaseUrl}/api/employees/search/by-name?name=${name}`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`, // remove if not needed
                    "Content-Type": "application/json"
                }
            }
        );

        if (!response.ok) {
            throw new Error("Failed to fetch employees");
        }

        const employees = await response.json();

        // Clear previous results
        tableNameBody.innerHTML = "";

        employees.forEach(employee => {

            const row = `
                <tr>
                    <td>${employee.employee_creation_time || ""}</td>
                    <td>${employee.Emp_Id || ""}</td>
                    <td>
                        ${employee.First_name || ""} 
                        ${employee.Middle_name || ""} 
                        ${employee.Last_name || ""}
                    </td>
                    <td>${employee.DOB || ""}</td>
                    <td>${employee.age || ""}</td>
                    <td>${employee.Employee_post || ""}</td>
                    <td>${employee.Department || ""}</td>
                    <td>${employee.Gmail || ""}</td>
                    <td>${employee.Phone_no || ""}</td>
                </tr>
            `;

            tableNameBody.innerHTML += row;
        });

    } catch (error) {
        console.error("Error:", error);
    }
});


const employeeInput = document.getElementById("Employee_Id");
const employeeTableBody = document.getElementById("EmployeeInfoByPRN");

employeeInput.addEventListener("keyup", async function () {

    const empId = employeeInput.value.trim();

    if (empId === "") {
        employeeTableBody.innerHTML = "";
        return;
    }

    try {

        const token = localStorage.getItem("access_token"); // your stored token

        const response = await fetch(`${apiBaseUrl}/api/employees/${empId}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error("Employee not found");
        }
        const employee = await response.json();
        const dob = new Date(employee.DOB);
            const today = new Date();

            let age = today.getFullYear() - dob.getFullYear();
            const monthDiff = today.getMonth() - dob.getMonth();

            if (monthDiff < 0 || 
               (monthDiff === 0 && today.getDate() < dob.getDate())) {
                age--;
            }


        employeeTableBody.innerHTML = "";

        const row = `
        <tr>
            <td>${employee.employee_creation_time || ""}</td>
            <td>${employee.Emp_Id || ""}</td>
            <td>
                ${employee.First_name || ""} 
                ${employee.Middle_name || ""} 
                ${employee.Last_name || ""}
            </td>
            <td>${employee.DOB || ""}</td>
            <td>${age || ""}</td>
            <td>${employee.post_name || ""}</td>
            <td>${employee.department_name || ""}</td>
            <td>${employee.Gmail || ""}</td>
            <td>${employee.Phone_no || ""}</td>
        </tr>
        `;

        employeeTableBody.innerHTML = row;

    } catch (error) {

        employeeTableBody.innerHTML = `
        <tr>
            <td colspan="9">Employee not found</td>
        </tr>
        `;

        console.error("Error:", error);
    }

});

function calculateAge(dob) {
    const birthDate = new Date(dob);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();

    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
        age--;
    }

    return age;
}


const tableBody = document.getElementById("AllEmployeeInfo");
const scrollContainer = document.getElementById("ScrollEmployeeContaner");

const departmentFilter = document.getElementById("departmentFilter");
const postFilter = document.getElementById("PostFilter");

let lastEmpId = null;
let loading = false;
let finished = false;
const limit = 10;

async function loadEmployees(reset = false) {

    if (loading) return;

    if (reset) {
        tableBody.innerHTML = "";
        lastEmpId = null;
        finished = false;
    }

    if (finished) return;

    loading = true;

    try {

        const token = localStorage.getItem("access_token");

        let params = new URLSearchParams();
        params.append("limit", limit);

        if (lastEmpId !== null) {
            params.append("last_emp_id", lastEmpId);
        }

        if (departmentFilter.value) {
            params.append("department_id", departmentFilter.value);
        }

        if (postFilter.value) {
            params.append("post_id", postFilter.value);
        }

        const url = `${apiBaseUrl}/api/employees?${params.toString()}`;

        const response = await fetch(url, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const employees = await response.json();

        if (employees.length === 0) {
            finished = true;
            loading = false;
            return;
        }

        employees.forEach(emp => {

            const row = `
            <tr>
                <td>${emp.Emp_Id}</td>
                <td>${emp.First_name} ${emp.Middle_name || ""} ${emp.Last_name}</td>
                <td>${emp.DOB}</td>
                <td>${calculateAge(emp.DOB) || ""}</td>
                <td>${emp.post_name || ""}</td>
                <td>${emp.department_name || ""}</td>
                <td>${emp.Gmail}</td>
                <td>${emp.Phone_no}</td>
            </tr>
            `;

            tableBody.insertAdjacentHTML("beforeend", row);

            lastEmpId = emp.Emp_Id;
        });

    } catch (error) {
        console.error("Error:", error);
    }

    loading = false;
}


departmentFilter.addEventListener("change", () => {
    loadEmployees(true);
});

postFilter.addEventListener("change", () => {
    loadEmployees(true);
});


scrollContainer.addEventListener("scroll", () => {

    if (
        scrollContainer.scrollTop + scrollContainer.clientHeight >=
        scrollContainer.scrollHeight - 20
    ) {
        loadEmployees();
    }

});