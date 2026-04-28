const apiBaseUrl = `qr-library-management-production.up.railway.app`;
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

        loadPublishers();
        loadAuthors();
        
        loadBooks();
    
        loadReturnedBooks();

    } catch (error) {
        console.error("Error:", error);

        // If token expired or invalid → logout
        localStorage.removeItem("access_token");
        window.location.href = "librarian_login.html";
    }

});

async function loadPublishers() {
    try {
        const response = await fetch(`${apiBaseUrl}/api/reference/publishers`);
        const publishers = await response.json();

        const publisherSelect = document.getElementById("publisher-name");

        // Clear existing options except first one
        publisherSelect.innerHTML = '<option value="">Select Publisher</option>';

        publishers.forEach(publisher => {
            const option = document.createElement("option");
            option.value = publisher.publisher_id;
            option.textContent = publisher.publisher_name;
            publisherSelect.appendChild(option);
        });

    } catch (error) {
        console.error("Error fetching publishers:", error);
    }
}


async function loadAuthors() {

    try {

        const response = await fetch(`${apiBaseUrl}/api/reference/authors`);

        const authors = await response.json();

        const authorSelect = document.getElementById("author-name");

        authorSelect.innerHTML = '<option value="">Select Author</option>';

        authors.forEach(author => {

            const option = document.createElement("option");

            option.value = author.Author_id;
            option.textContent = author.Author_name;

            authorSelect.appendChild(option);

        });

    } catch (error) {

        console.error("Error loading authors:", error);

    }

}


async function GetBook() {
    try {

        // 1️⃣ Get accession number from input
        const accessionNumber = document.getElementById("accesstion_number").value;

        if (!accessionNumber) {
            alert("Please enter accession number");
            return;
        }

        // 2️⃣ Call API
        const response = await fetch(`${apiBaseUrl}/api/books/${accessionNumber}`);

        if (!response.ok) {
            throw new Error("Book not found");
        }

        const book = await response.json();

        console.log(book); // helpful for debugging

        // 3️⃣ Fill form fields with API data
        document.getElementById("fname").value = book.Title || "";
        document.getElementById("total_copy").value = book.Total_Copy || "";
        document.getElementById("copy_number").value = book.Copy_Number || "";
        document.getElementById("total_pages").value = book.total_pages || "";
        document.getElementById("book_cost").value = book.Book_Cost || "";
        document.getElementById("publish_place").value = book.Publisher_place || "";
        document.getElementById("rack_location").value = book.rack_location || "";
        document.getElementById("self_location").value = book.self_location || "";

        // 4️⃣ Set publisher dropdown
        if (book.publisher_id) {
            document.getElementById("publisher-name").value = book.publisher_id;
        }

        // 🔹 Handle multiple authors
        const authorSelect = document.getElementById("author-name");

        // First clear previous selections
        for (let option of authorSelect.options) {
            option.selected = false;
        }

        // Select authors returned from API
        book.authors.forEach(authorName => {

            for (let option of authorSelect.options) {

                if (option.text === authorName) {
                    option.selected = true;
                }

            }

        });


    } catch (error) {

        console.error("Error fetching book:", error);
        alert("Book not found with this accession number");

    }
}


function getSelectedAuthors() {

    const select = document.getElementById("author-name");

    const author_ids = [];

    for (let option of select.selectedOptions) {
        author_ids.push(parseInt(option.value));
    }

    return author_ids;
}


async function AddBook() {

    try {

        const bookData = {

            Accession_number: parseInt(document.getElementById("accesstion_number").value),
            Title: document.getElementById("fname").value,
            Total_Copy: parseInt(document.getElementById("total_copy").value),
            Copy_Number: parseInt(document.getElementById("copy_number").value),
            total_pages: parseInt(document.getElementById("total_pages").value),
            Book_Cost: parseFloat(document.getElementById("book_cost").value),
            Publisher_place: document.getElementById("publish_place").value,
            rack_location: document.getElementById("rack_location").value,
            self_location: document.getElementById("self_location").value,
            publisher_id: parseInt(document.getElementById("publisher-name").value),

            // default status
            Status: "Available",

            // many-to-many authors
            author_ids: getSelectedAuthors()

        };


        const response = await fetch(`${apiBaseUrl}/api/books`, {

            method: "POST",

            headers: {
                "Content-Type": "application/json",

                // if authentication is used
                "Authorization": "Bearer " + localStorage.getItem("access_token")
            },

            body: JSON.stringify(bookData)

        });


        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.detail || "Failed to add book");
        }

        alert("Book added successfully!");

        console.log(result);

        document.querySelector("form").reset();

    } catch (error) {

        console.error("Error:", error);

        alert(error.message);

    }
}


async function UpdateBook() {

    try {

        const accessionNumber = document.getElementById("accesstion_number").value;

        if (!accessionNumber) {
            alert("Please enter accession number");
            return;
        }

        const bookData = {

            Title: document.getElementById("fname").value,
            Total_Copy: parseInt(document.getElementById("total_copy").value),
            Copy_Number: parseInt(document.getElementById("copy_number").value),
            total_pages: parseInt(document.getElementById("total_pages").value),
            Book_Cost: parseFloat(document.getElementById("book_cost").value),
            Publisher_place: document.getElementById("publish_place").value,
            rack_location: document.getElementById("rack_location").value,
            self_location: document.getElementById("self_location").value,
            publisher_id: parseInt(document.getElementById("publisher-name").value),

            author_ids: getSelectedAuthors()

        };

        const response = await fetch(`${apiBaseUrl}/api/books/${accessionNumber}`, {

            method: "PUT",

            headers: {
                "Content-Type": "application/json",

                // If authentication required
                "Authorization": "Bearer " + localStorage.getItem("access_token")
            },

            body: JSON.stringify(bookData)

        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.detail || "Failed to update book");
        }

        alert("Book updated successfully!");

        console.log(result);

    } catch (error) {

        console.error("Update error:", error);

        alert(error.message);

    }

}

async function DeleteBook() {

    try {

        const accessionNumber = document.getElementById("accesstion_number1").value;

        if (!accessionNumber) {
            alert("Please enter Book ID");
            return;
        }

        const confirmDelete = confirm("Are you sure you want to delete this book?");

        if (!confirmDelete) {
            return;
        }

        const response = await fetch(`${apiBaseUrl}/api/books/${accessionNumber}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem("access_token")
            }
        });

        // Success (204 No Content)
        if (response.status === 204) {

            alert("Book deleted successfully");

            document.getElementById("accesstion_number").value = "";

            return;
        }

        // Error response
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to delete book");

    } catch (error) {

        console.error("Delete error:", error);
        alert(error.message);

    }

}

const input = document.getElementById("Accesstion_number");
const tableBody = document.getElementById("BookInfoByAccesstion");

input.addEventListener("keyup", async function (e) {

    if (e.key === "Enter") {

        const accessionNumber = input.value.trim();

        if (!accessionNumber) {
            alert("Please enter accession number");
            return;
        }

        try {

            const response = await fetch(`${apiBaseUrl}/api/books/${accessionNumber}`);

            if (!response.ok) {
                throw new Error("Book not found");
            }

            const book = await response.json();

            // clear previous result
            tableBody.innerHTML = "";

            // convert authors array to string
            const authors = book.authors.join(", ");

            const row = `
                <tr>
                    <td>${book.Accession_number}</td>
                    <td>${book.book_upload_time}</td>
                    <td>${book.rack_location}</td>
                    <td>${book.self_location}</td>
                    <td>${book.Copy_Number}</td>
                    <td>${book.Status}</td>
                    <td>${book.Title}</td>
                    <td>${authors}</td>
                    <td>${book.Publisher_place}</td>
                    <td>${book.publisher_name}</td>
                    <td>${book.total_pages}</td>
                    <td>${book.Total_Copy}</td>
                    <td>${book.Book_Cost}</td>
                    
                </tr>
            `;

            tableBody.innerHTML = row;

        } catch (error) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="15" style="text-align:center;color:red;">
                        Book not found
                    </td>
                </tr>
            `;

            console.error(error);
        }
    }
});




const AllBodyInfo = document.getElementById("AllBookInfo");
const scrollBookInfoContainer = document.getElementById("ScrollBookContaner");
const statusFilter = document.getElementById("StatusFilter");
const bookTitleInput = document.getElementById("Book_Title");

let lastBookId = null;
let Bookloading = false;
let BookInfofinished = false;


async function loadBooks(reset = false) {

    if (Bookloading) return;

    if (reset) {
        lastBookId = null;
        BookInfofinished = false;
        AllBodyInfo.innerHTML = "";
    }

    if (BookInfofinished) return;

    Bookloading = true;

    let url = `${apiBaseUrl}/api/books?limit=20`;

    if (lastBookId) {
        url += `&last_book_id=${lastBookId}`;
    }

    const status = statusFilter.value;
    const title = bookTitleInput.value.trim();

    if (status) {
        url += `&status=${encodeURIComponent(status)}`;
    }

    if (title) {
        url += `&book_title=${encodeURIComponent(title)}`;
    }

    try {

        const response = await fetch(url, {
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) throw new Error("API error");

        const books = await response.json();

        if (books.length === 0) {
            BookInfofinished = true;
            return;
        }

        books.forEach(book => {

            const authors = book.author_names.join(", ");

            const row = `
            <tr>
                <td>${book.Accession_number}</td>
                <td>${new Date(book.book_upload_time).toLocaleString()}</td>
                <td>${book.rack_location}</td>
                <td>${book.self_location}</td>
                <td>${book.Copy_Number}</td>
                <td>${book.Status}</td>
                <td>${book.Title}</td>
                <td>${authors}</td>
                <td>${book.Publisher_place}</td>
                <td>${book.publisher_name}</td>
                <td>${book.total_pages}</td>
                <td>${book.Total_Copy}</td>
                <td>${book.Book_Cost}</td>
            </tr>
            `;

            AllBodyInfo.insertAdjacentHTML("beforeend", row);

        });

        lastBookId = books[books.length - 1].Accession_number;

        if (scrollBookInfoContainer.scrollHeight <= scrollBookInfoContainer.clientHeight) {
            loadBooks();
        }

    } catch (err) {
        console.error("Error loading books:", err);
    }

    Bookloading = false;
}


scrollBookInfoContainer.addEventListener("scroll", () => {

    if (
        scrollBookInfoContainer.scrollTop + scrollBookInfoContainer.clientHeight >=
        scrollBookInfoContainer.scrollHeight - 10
    ) {
        loadBooks();
    }

});

statusFilter.addEventListener("change", () => {
    loadBooks(true);
});

let searchTimeout;

bookTitleInput.addEventListener("input", () => {

    clearTimeout(searchTimeout);

    searchTimeout = setTimeout(() => {
        loadBooks(true);
    }, 400);

});


let lastReturnedDate = null;
let isReturnedLoading = false;
let hasReturnedMore = true;

const tableReturnedBody = document.getElementById("returnedInfoBody");
const scrollReturnedContainer = document.getElementById("returnedScrollContainer");

// Optional filter dropdown (only if you have it)
const borrowerReturnedFilter = document.getElementById("borrowerReturnedFilter");


async function loadReturnedBooks(reset = false) {

    if (reset) {
        lastReturnedDate = null;
        hasReturnedMore = true;
        tableReturnedBody.innerHTML = "";
    }

    if (isReturnedLoading || !hasReturnedMore) return;

    isReturnedLoading = true;

    let url = `${apiBaseUrl}/api/librarian/returned-books/all?limit=10`;

    // Borrower type filter (optional)
    if (borrowerReturnedFilter && borrowerReturnedFilter.value) {
        url += `&borrower_type=${borrowerReturnedFilter.value}`;
    }

    // Cursor pagination
    if (lastReturnedDate) {
        url += `&last_returned_date=${encodeURIComponent(lastReturnedDate)}`;
    }

    try {
        const response = await fetch(url, {
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("access_token")
            }
        });

        if (!response.ok) {
            console.error("Failed to fetch returned books");
            isReturnedLoading = false;
            return;
        }

        const data = await response.json();

        if (data.length === 0) {
            hasReturnedMore = false;
            isReturnedLoading = false;
            return;
        }

        data.forEach(record => {

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${record.book.Accession_number}</td>
                <td>${record.book.title}</td>
                <td>${record.book.rack_location}</td>
                <td>${record.book.self_location}</td>
                <td>${record.borrower.Emp_Id || record.borrower.Prn_id || "N/A"}</td>
                <td>${record.borrower.name}</td>
                <td>${record.borrower.type}</td>
                <td>${new Date(record.issue_time).toLocaleDateString()}</td>
                <td>${new Date(record.due_date).toLocaleDateString()}</td>
                <td>${new Date(record.returned_date).toLocaleDateString()}</td>
            `;

            tableReturnedBody.appendChild(row);
        });

        // Set cursor for next scroll
        lastReturnedDate = data[data.length - 1].returned_date;

    } catch (error) {
        console.error("Error loading returned books:", error);
    }

    isReturnedLoading = false;
}


//  Attach scroll to DIV (NOT window)
scrollReturnedContainer.addEventListener("scroll", () => {

    if (
        scrollReturnedContainer.scrollTop + scrollReturnedContainer.clientHeight >=
        scrollReturnedContainer.scrollHeight - 50
    ) {
        loadReturnedBooks();
    }

});


// Optional filter reset
if (borrowerReturnedFilter) {
    borrowerReturnedFilter.addEventListener("change", () => {
        loadReturnedBooks(true);
    });
}
