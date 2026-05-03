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

        fetchBranches();
        fetchDepartments();
        fetchEmployeePosts();
        fetchPublishers();
        fetchAuthors();
        fetchPenaltyAmounts();
        fetchPenaltyExcuses();



    } catch (error) {
        console.error("Error:", error);

        // If token expired or invalid → logout
        localStorage.removeItem("access_token");
        window.location.href = "librarian_login.html";
    }

});


// Select table body
const requestBranchBody = document.getElementById("requestBranchBody");

// Fetch and display branches
async function fetchBranches() {
    try {
        const response = await fetch(`${apiBaseUrl}/api/reference/branches`); // your API
        const branches = await response.json();

        // Clear existing rows
        requestBranchBody.innerHTML = "";

        // Loop through data and create rows
        branches.forEach(branch => {
            const tr = document.createElement("tr");

            const tdId = document.createElement("td");
            tdId.textContent = branch.Branch_id;

            const tdName = document.createElement("td");
            tdName.textContent = branch.Branch_name;

            tr.appendChild(tdId);
            tr.appendChild(tdName);

            requestBranchBody.appendChild(tr);
        });

    } catch (error) {
        console.error("Error fetching branches:", error);
    }
}


// Select table body
const requestDepartmentBody = document.getElementById("requestDepartmentBody");

// Fetch and display departments
async function fetchDepartments() {
    try {
        const response = await fetch(`${apiBaseUrl}/api/reference/departments`); // your API
        const departments = await response.json();

        // Clear existing rows
        requestDepartmentBody.innerHTML = "";

        // Loop through data
        departments.forEach(dept => {
            const tr = document.createElement("tr");

            const tdId = document.createElement("td");
            tdId.textContent = dept.Department_id;

            const tdName = document.createElement("td");
            tdName.textContent = dept.department_name;

            tr.appendChild(tdId);
            tr.appendChild(tdName);

            requestDepartmentBody.appendChild(tr);
        });

    } catch (error) {
        console.error("Error fetching departments:", error);
    }
}

// Select table body
const requestPostBody = document.getElementById("requestPostBody");

// Fetch and display posts
async function fetchEmployeePosts() {
    try {
        const response = await fetch(`${apiBaseUrl}/api/reference/employee-posts`); // your API
        const posts = await response.json();

        // Clear existing rows
        requestPostBody.innerHTML = "";

        // Loop through data
        posts.forEach(post => {
            const tr = document.createElement("tr");

            const tdId = document.createElement("td");
            tdId.textContent = post.Employee_post_id;

            const tdName = document.createElement("td");
            tdName.textContent = post.post_name;

            tr.appendChild(tdId);
            tr.appendChild(tdName);

            requestPostBody.appendChild(tr);
        });

    } catch (error) {
        console.error("Error fetching employee posts:", error);
    }
}

// Select table body
const requestPublisherBody = document.getElementById("requestPublisherBody");

// Fetch and display publishers
async function fetchPublishers() {
    try {
        const response = await fetch(`${apiBaseUrl}/api/reference/publishers`); // your API
        const publishers = await response.json();

        // Clear existing rows
        requestPublisherBody.innerHTML = "";

        // Loop through data
        publishers.forEach(pub => {
            const tr = document.createElement("tr");

            const tdId = document.createElement("td");
            tdId.textContent = pub.publisher_id;

            const tdName = document.createElement("td");
            tdName.textContent = pub.publisher_name;

            tr.appendChild(tdId);
            tr.appendChild(tdName);

            requestPublisherBody.appendChild(tr);
        });

    } catch (error) {
        console.error("Error fetching publishers:", error);
    }
}


// Select table body
const requestAuthorBody = document.getElementById("requestAuthorBody");

// Fetch and display authors
async function fetchAuthors() {
    try {
        const response = await fetch(`${apiBaseUrl}/api/reference/authors`); // your API
        const authors = await response.json();

        // Clear existing rows
        requestAuthorBody.innerHTML = "";

        // Loop through data
        authors.forEach(author => {
            const tr = document.createElement("tr");

            const tdId = document.createElement("td");
            tdId.textContent = author.Author_id;

            const tdName = document.createElement("td");
            tdName.textContent = author.Author_name;

            tr.appendChild(tdId);
            tr.appendChild(tdName);

            requestAuthorBody.appendChild(tr);
        });

    } catch (error) {
        console.error("Error fetching authors:", error);
    }
}


// Select table body
const requestPenaltyBody = document.getElementById("requestPenaltyBody");

// Fetch and display penalty amounts
async function fetchPenaltyAmounts() {
    try {
        const response = await fetch(`${apiBaseUrl}/api/reference/penalty-amounts`); // your API
        const penalties = await response.json();

        // Clear existing rows
        requestPenaltyBody.innerHTML = "";

        // Loop through data
        penalties.forEach(penalty => {
            const tr = document.createElement("tr");

            const tdId = document.createElement("td");
            tdId.textContent = penalty.id;

            const tdAmount = document.createElement("td");
            tdAmount.textContent = penalty.penalty_amount;

            tr.appendChild(tdId);
            tr.appendChild(tdAmount);

            requestPenaltyBody.appendChild(tr);
        });

    } catch (error) {
        console.error("Error fetching penalty amounts:", error);
    }
}


// Select table body
const requestPenaltyExcuseBody = document.getElementById("requestPenaltyExcuseBody");

// Fetch and display penalty excuses
async function fetchPenaltyExcuses() {
    try {
        const response = await fetch(`${apiBaseUrl}/api/reference/penalty-excuses`); // your API
        const excuses = await response.json();

        // Clear existing rows
        requestPenaltyExcuseBody.innerHTML = "";

        // Loop through data
        excuses.forEach(item => {
            const tr = document.createElement("tr");

            const tdId = document.createElement("td");
            tdId.textContent = item.penalty_excuse_id;

            const tdExcuse = document.createElement("td");
            tdExcuse.textContent = item.excuse;

            tr.appendChild(tdId);
            tr.appendChild(tdExcuse);

            requestPenaltyExcuseBody.appendChild(tr);
        });

    } catch (error) {
        console.error("Error fetching penalty excuses:", error);
    }
}


// Function to add new penalty excuse
async function addexcuse() {
    const input = document.getElementById("addexcuse");
    const excuseText = input.value.trim();

    // Validation
    if (!excuseText) {
        alert("Please enter a penalty excuse");
        return;
    }

    try {
        const token = localStorage.getItem("access_token");
        const response = await fetch(`${apiBaseUrl}/api/reference/penalty-excuses`, {
            method: "POST",
            headers: {
                // Add token if your API requires authentication
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                excuse: excuseText
            })
        });

        if (!response.ok) {
            throw new Error("Failed to add excuse");
        }

        const data = await response.json();

        console.log("Excuse added:", data);

        // Clear input
        input.value = "";

        // Reload table (important 🔥)
        fetchPenaltyExcuses();

        alert("Penalty excuse added successfully!");

    } catch (error) {
        console.error("Error adding excuse:", error);
        alert("Error adding excuse");
    }
}


// Function to delete penalty excuse
async function DeleteExcuse() {
    const input = document.getElementById("excuseId");
    const excuseId = input.value.trim();

    // Validation
    if (!excuseId) {
        alert("Please enter Penalty Excuse ID");
        return;
    }

    try {
        const token = localStorage.getItem("access_token");
        const response = await fetch(`${apiBaseUrl}/api/reference/penalty-excuses/${excuseId}`, {
            method: "DELETE",
            headers: {
                // Add token if required
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            }
        });

        if (response.status === 404) {
            alert("Excuse not found");
            return;
        }

        if (!response.ok) {
            throw new Error("Failed to delete excuse");
        }

        console.log("Excuse deleted");

        // Clear input
        input.value = "";

        // Refresh table 🔥
        fetchPenaltyExcuses();

        alert("Penalty excuse deleted successfully!");

    } catch (error) {
        console.error("Error deleting excuse:", error);
        alert("Error deleting excuse");
    }
}


// Function to add penalty amount
async function addpenalty() {
    const input = document.getElementById("addpenalty");
    const amountValue = input.value.trim();

    // Validation
    if (!amountValue) {
        alert("Please enter penalty amount");
        return;
    }

    const amountNumber = parseInt(amountValue);

    if (isNaN(amountNumber) || amountNumber < 0) {
        alert("Enter a valid penalty amount");
        return;
    }

    try {
        const token = localStorage.getItem("access_token");
        const response = await fetch(`${apiBaseUrl}/api/reference/penalty-amounts`, {
            method: "POST",
            headers: {

                // Add token if required
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                penalty_amount: amountNumber
            })
        });

        if (!response.ok) {
            throw new Error("Failed to add penalty amount");
        }

        const data = await response.json();
        console.log("Penalty added:", data);

        // Clear input
        input.value = "";

        // Refresh table 🔥
        fetchPenaltyAmounts();

        alert("Penalty amount added successfully!");

    } catch (error) {
        console.error("Error adding penalty:", error);
        alert("Error adding penalty amount");
    }
}


// Function to delete penalty amount
async function DeletePenlatyAmount() {
    const input = document.getElementById("penaltyAmountId");
    const amountId = input.value.trim();

    // Validation
    if (!amountId) {
        alert("Please enter Penalty Amount ID");
        return;
    }

    try {
        const token = localStorage.getItem("access_token");
        const response = await fetch(`${apiBaseUrl}/api/reference/penalty-amounts/${amountId}`, {
            method: "DELETE",
            headers: {
                // Add token if required
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            }
        });

        if (response.status === 404) {
            alert("Penalty amount not found");
            return;
        }

        if (!response.ok) {
            throw new Error("Failed to delete penalty amount");
        }

        console.log("Penalty amount deleted");

        // Clear input
        input.value = "";

        // Refresh table 🔥
        fetchPenaltyAmounts();

        alert("Penalty amount deleted successfully!");

    } catch (error) {
        console.error("Error deleting penalty amount:", error);
        alert("Error deleting penalty amount");
    }
}

async function addAuthor() {
    const authorName = document.getElementById("authorname").value;

    // Validation
    if (!authorName.trim()) {
        alert("Please enter author name");
        return;
    }

    try {
        const response = await fetch(`${apiBaseUrl}/api/reference/authors`, {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("access_token"),
                "Content-Type": "application/json"
                // If you are using authentication, add token here

            },
            body: JSON.stringify({
                Author_name: authorName
            })
        });

        const data = await response.json();

        if (response.ok) {

            

            // Refresh table 🔥
            fetchAuthors();
            alert("Author added successfully!");
            console.log(data);

            // Clear input field
            document.getElementById("authorname").value = "";
        } else {
            alert(data.detail || "Failed to add author");
        }

    } catch (error) {
        console.error("Error:", error);
        alert("Something went wrong!");
    }
}


async function deleteAuthor() {
    const input = document.getElementById("authorid");
    const authorId = input.value.trim();

    // Validation
    if (!authorId) {
        alert("Please enter Author ID");
        return;
    }

    try {
        const token = localStorage.getItem("access_token");
        const response = await fetch(`${apiBaseUrl}/api/reference/authors/${authorId}`, {
            method: "DELETE",
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            }
        });

        if (response.status === 404) {
            alert("Author not found");
            return;
        }

        if (!response.ok) {
            throw new Error("Failed to delete author");
        }

        console.log("Author deleted");

        // Clear input
        input.value = "";

        // Refresh author list (if you have function)
        fetchAuthors();

        alert("Author deleted successfully!");

    } catch (error) {
        console.error("Error deleting author:", error);
        alert("Error deleting author");
    }
}


async function addpublisher() {
    const input = document.getElementById("publisherNamr");
    const publisherName = input.value.trim();

    // Validation
    if (!publisherName) {
        alert("Please enter Publisher Name");
        return;
    }

    try {
        const token = localStorage.getItem("access_token");
        const response = await fetch(`${apiBaseUrl}/api/reference/publishers`, {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                publisher_name: publisherName
            })
        });

        if (response.status === 400) {
            const data = await response.json();
            alert(data.detail || "Publisher already exists");
            return;
        }

        if (!response.ok) {
            throw new Error("Failed to add publisher");
        }

        const data = await response.json();
        console.log("Publisher added:", data);

        // Clear input
        input.value = "";

        // Refresh publisher list (if you have function)
        fetchPublishers();

        alert("Publisher added successfully!");

    } catch (error) {
        console.error("Error adding publisher:", error);
        alert("Error adding publisher");
    }
}

async function deletepublisher() {
    const input = document.getElementById("publisherid");
    const publisherId = input.value.trim();

    // Validation
    if (!publisherId) {
        alert("Please enter Publisher ID");
        return;
    }

    try {
        const token = localStorage.getItem("access_token");
        const response = await fetch(`${apiBaseUrl}/api/reference/publishers/${publisherId}`, {
            method: "DELETE",
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            }
        });

        if (response.status === 404) {
            alert("Publisher not found");
            return;
        }

        if (!response.ok) {
            throw new Error("Failed to delete publisher");
        }

        console.log("Publisher deleted");

        // Clear input
        input.value = "";

        // Refresh publisher list (if you have function)
        fetchPublishers();

        alert("Publisher deleted successfully!");

    } catch (error) {
        console.error("Error deleting publisher:", error);
        alert("Error deleting publisher");
    }
}


async function addPost() {
    const input = document.getElementById("postName");
    const postName = input.value.trim();

    // Validation
    if (!postName) {
        alert("Please enter Post Name");
        return;
    }

    try {
        const token = localStorage.getItem("access_token");
        const response = await fetch(`${apiBaseUrl}/api/reference/employee-posts`, {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                post_name: postName
                // If your API requires Employee_post_id also, add it here:
                // Employee_post_id: someId
            })
        });

        if (response.status === 400) {
            const data = await response.json();
            alert(data.detail || "Post already exists");
            return;
        }

        if (!response.ok) {
            throw new Error("Failed to add post");
        }

        const data = await response.json();
        console.log("Post added:", data);

        // Clear input
        input.value = "";

        // Refresh post list (if you have function)
        fetchEmployeePosts();

        alert("Post added successfully!");

    } catch (error) {
        console.error("Error adding post:", error);
        alert("Error adding post");
    }
}

async function DeletePost() {
    const input = document.getElementById("Postid");
    const postId = input.value.trim();

    // Validation
    if (!postId) {
        alert("Please enter Post ID");
        return;
    }

    try {
        const token = localStorage.getItem("access_token");
        const response = await fetch(`${apiBaseUrl}/api/reference/employee-posts/${postId}`, {
            method: "DELETE",
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            }
        });

        if (response.status === 404) {
            alert("Post not found");
            return;
        }

        if (!response.ok) {
            throw new Error("Failed to delete post");
        }

        console.log("Post deleted");

        // Clear input
        input.value = "";

        // Refresh post list (if you have function)
        fetchEmployeePosts();

        alert("Post deleted successfully!");

    } catch (error) {
        console.error("Error deleting post:", error);
        alert("Error deleting post");
    }

}


async function AddDepartment() {
    const input = document.getElementById("departmentName");
    const departmentName = input.value.trim();

    // Validation
    if (!departmentName) {
        alert("Please enter Department Name");
        return;
    }

    try {
        const token = localStorage.getItem("access_token");
        const response = await fetch(`${apiBaseUrl}/api/reference/departments`, {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                department_name: departmentName
            })
        });

        if (response.status === 400) {
            const data = await response.json();
            alert(data.detail || "Department already exists");
            return;
        }

        if (!response.ok) {
            throw new Error("Failed to add department");
        }

        const data = await response.json();
        console.log("Department added:", data);

        // Clear input
        input.value = "";

        // Refresh department list (if you have function)
        fetchDepartments();

        alert("Department added successfully!");

    } catch (error) {
        console.error("Error adding department:", error);
        alert("Error adding department");
    }
}


async function DeleteDepartment() {
    const input = document.getElementById("DepartmentId");
    const departmentId = input.value.trim();

    // Validation
    if (!departmentId) {
        alert("Please enter Department ID");
        return;
    }

    try {
        const token = localStorage.getItem("access_token");
        const response = await fetch(`${apiBaseUrl}/api/reference/departments/${departmentId}`, {
            method: "DELETE",
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            }
        });

        if (response.status === 404) {
            alert("Department not found");
            return;
        }

        if (!response.ok) {
            throw new Error("Failed to delete department");
        }

        console.log("Department deleted");

        // Clear input
        input.value = "";

        // Refresh department list (if you have function)
        fetchDepartments();

        alert("Department deleted successfully!");

    } catch (error) {
        console.error("Error deleting department:", error);
        alert("Error deleting department");
    }
}

async function AddBranch() {
    const input = document.getElementById("BranchName");
    const branchName = input.value.trim();

    // Validation
    if (!branchName) {
        alert("Please enter Branch Name");
        return;
    }

    try {
        const token = localStorage.getItem("access_token");
        const response = await fetch(`${apiBaseUrl}/api/reference/branches`, {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                Branch_name: branchName
            })
        });

        if (response.status === 400) {
            const data = await response.json();
            alert(data.detail || "Branch already exists");
            return;
        }

        if (!response.ok) {
            throw new Error("Failed to add branch");
        }

        const data = await response.json();
        console.log("Branch added:", data);

        // Clear input
        input.value = "";

        // Refresh branch list (if you have function)
        fetchBranches();

        alert("Branch added successfully!");

    } catch (error) {
        console.error("Error adding branch:", error);
        alert("Error adding branch");
    }
}

async function DeleteBranch() {
    const input = document.getElementById("Branchid");
    const branchId = input.value.trim();

    // Validation
    if (!branchId) {
        alert("Please enter Branch ID");
        return;
    }

    try {
        const token = localStorage.getItem("access_token");
        const response = await fetch(`${apiBaseUrl}/api/reference/branches/${branchId}`, {
            method: "DELETE",
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            }
        });

        if (response.status === 404) {
            alert("Branch not found");
            return;
        }

        if (!response.ok) {
            throw new Error("Failed to delete branch");
        }

        console.log("Branch deleted");

        // Clear input
        input.value = "";

        // Refresh branch list (if you have function)
        fetchBranches();

        alert("Branch deleted successfully!");

    } catch (error) {
        console.error("Error deleting branch:", error);
        alert("Error deleting branch");
    }
}
