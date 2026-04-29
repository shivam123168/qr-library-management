
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

        //  If token expired or invalid
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


async function manual_backup() {
    try {
        const token = localStorage.getItem("access_token");

        const response = await fetch(`${apiBaseUrl}/api/backup/backup/manual`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error("Backup failed");
        }

        const blob = await response.blob();

        //  Get filename from backend headers
        const contentDisposition = response.headers.get("content-disposition");
        let filename = "backup.sql";

        if (contentDisposition && contentDisposition.includes("filename=")) {
            filename = contentDisposition
                .split("filename=")[1]
                .replace(/"/g, "");
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;

        //  use backend filename
        a.download = filename;

        document.body.appendChild(a);
        a.click();

        a.remove();
        window.URL.revokeObjectURL(url);

    } catch (error) {
        console.error(error);
        alert("Backup failed");
    }
}

async function loadBackups() {
    try {
        const token = localStorage.getItem("access_token");

        const response = await fetch(`${apiBaseUrl}/api/backup/backup/list`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        const table = document.getElementById("backupTable");
        table.innerHTML = "";

        data.files.forEach(file => {
            const row = `
                <tr>
                    <td>${file.filename}</td>
                    <td>${file.size_kb}</td>
                    <td>${new Date(file.created_at * 1000).toLocaleString()}</td>
                    <td>
                        <button class="issue-button" onclick="downloadlocalBackup('${file.filename}')">
                            Download
                        </button>
                    </td>
                </tr>
            `;

            table.innerHTML += row;
        });

    } catch (error) {
        console.error("Error loading backups:", error);
    }
}

async function downloadlocalBackup(filename) {
    try {
        const token = localStorage.getItem("access_token");

        const response = await fetch(`${apiBaseUrl}/api/backup/backup/download/${filename}`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error("Download failed");

        const blob = await response.blob();

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");

        a.href = url;
        a.download = filename;

        document.body.appendChild(a);
        a.click();

        a.remove();
        window.URL.revokeObjectURL(url);

    } catch (error) {
        alert("Download failed");
    }
}
