function formatDate(dateString) {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString();
}

function formatDateTime(dateString) {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString();
}

async function GenerateBooksInfoPDFByFilters() {
    try {
        // 🔹 1. Get Filters
        const status = document.getElementById("StatusFilter").value;
        const title = document.getElementById("Book_Title").value.trim();

        // 🔹 2. Build URL
        let url = `${apiBaseUrl}/api/books_for_PDF?`;

        if (status) {
            url += `status=${encodeURIComponent(status)}&`;
        }

        if (title) {
            url += `book_title=${encodeURIComponent(title)}&`;
        }

        // 🔹 3. Fetch Data
        const response = await fetch(url);

        if (!response.ok) {
            const err = await response.json();
            alert(err.detail || "Error fetching books");
            return;
        }

        const data = await response.json();

        // 🔴 SAFETY CHECK (VERY IMPORTANT)
        if (!Array.isArray(data)) {
            alert("Invalid data received from server");
            return;
        }

        // 🔹 4. Init PDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: "landscape" }); // better for many columns

        // 🔹 Title
        doc.setFontSize(16);
        doc.text("Books Report", 148, 15, { align: "center" });

        // 🔹 Date
        const date = new Date().toLocaleString();
        doc.setFontSize(10);
        doc.text(`Generated on: ${date}`, 14, 22);

        // 🔹 Filters
        doc.text(`Status: ${status || "All"}`, 14, 30);
        doc.text(`Title Search: ${title || "All"}`, 14, 36);

        // 🔹 Total Records
        doc.text(`Total Records: ${data.length}`, 14, 42);

        // 🔹 Table Columns
        const tableColumn = [
            "Acc No",
            "Title",
            "Authors",
            "Copies",
            "Cost",
            "Status",
            "Rack",
            "Shelf",
            "Publisher"
        ];

        const tableRows = [];

        // 🔹 Empty Case
        if (data.length === 0) {
            tableRows.push(["-", "No Records Found", "-", "-", "-", "-", "-", "-", "-"]);
        } else {
            data.forEach(item => {
                tableRows.push([
                    item.Accession_number,
                    item.Title,
                    (item.author_names || []).join(", "),
                    `${item.Copy_Number}/${item.Total_Copy}`,
                    item.Book_Cost,
                    item.Status,
                    item.rack_location || "-",
                    item.self_location || "-",
                    item.publisher_name || "-"
                ]);
            });
        }

        // 🔹 Table (OPTIMIZED)
        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 50,
            theme: "grid",
            styles: {
                fontSize: 7,
                cellWidth: "wrap"
            },
            headStyles: {
                fillColor: [0, 102, 204]
            },
            columnStyles: {
                1: { cellWidth: 50 }, // Title column wider
                2: { cellWidth: 60 }  // Authors column wider
            }
        });

        // 🔹 Page Numbers
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(9);
            doc.text(`Page ${i} of ${pageCount}`, 270, 200);
        }

        // 🔹 Save
        doc.save("Books_Report.pdf");

    } catch (error) {
        console.error("Error generating Books PDF:", error);
        alert("Something went wrong while generating PDF");
    }
}


async function GenerateReturnedBooksPDF() {
    try {
        // 🔹 1. Get Filter
        const borrowerType = document.getElementById("borrowerReturnedFilter").value;

        // 🔹 2. Get Token
        const token = localStorage.getItem("access_token");

        if (!token) {
            alert("User not authenticated. Please login again.");
            return;
        }

        // 🔹 3. Build URL
        let url = `${apiBaseUrl}/api/librarian/returned-books-gnererate-pdf/all?`;

        if (borrowerType) {
            url += `borrower_type=${encodeURIComponent(borrowerType)}&`;
        }

        // 🔹 4. Fetch Data
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            const err = await response.json();
            alert(err.detail || "Error fetching data");
            return;
        }

        const data = await response.json();

        //  SAFETY CHECK
        if (!Array.isArray(data)) {
            alert("Invalid data received from server");
            return;
        }

        // 🔹 5. Init PDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: "landscape" });

        // 🔹 Title
        doc.setFontSize(16);
        doc.text("Returned Books Report", 148, 15, { align: "center" });

        // 🔹 Date
        const date = new Date().toLocaleString();
        doc.setFontSize(10);
        doc.text(`Generated on: ${date}`, 14, 22);

        // 🔹 Filter Info
        doc.text(`Borrower Type: ${borrowerType || "All"}`, 14, 30);

        // 🔹 Total Records
        doc.text(`Total Records: ${data.length}`, 14, 36);

        // 🔹 Table Columns
        const tableColumn = [
            "Issue ID",
            "Borrower ID",
            "Borrower Name",
            "Type",
            "Book Title",
            "Acc No",
            "Issue Date",
            "Due Date",
            "Returned Date",
            "Penalty",
            "Amount"
        ];

        const tableRows = [];

        // 🔹 Empty Case
        if (data.length === 0) {
            tableRows.push(["-", "No Records Found", "-", "-", "-", "-", "-", "-", "-", "-"]);
        } else {
            data.forEach(item => {
                const borrower = item.borrower || {};
                const book = item.book || {};

                tableRows.push([
                    item.issue_book_id,
                    borrower.Prn_id || borrower.Emp_Id || "-",
                    borrower.name || "-",
                    borrower.type || "-",
                    book.title || "-",
                    book.Accession_number || "-",
                    formatDate(item.issue_time),
                    formatDate(item.due_date),
                    formatDate(item.returned_date),
                    item.has_penalty ? "Yes" : "No",
                    item.penalty_amount || "-"
                ]);
            });
        }

        // 🔹 Table
        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 45,
            theme: "grid",
            styles: {
                fontSize: 7,
                cellWidth: "wrap"
            },
            headStyles: {
                fillColor: [0, 102, 204]
            },
            columnStyles: {
                1: { cellWidth: 40 }, // borrower name
                3: { cellWidth: 60 }  // book title
            }
        });

        // 🔹 Page Numbers
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(9);
            doc.text(`Page ${i} of ${pageCount}`, 270, 200);
        }

        // 🔹 Save
        doc.save("Returned_Books_Report.pdf");

    } catch (error) {
        console.error("Error generating Returned Books PDF:", error);
        alert("Something went wrong while generating PDF");
    }
}

async function GenerateBookInfoPDFByAccesstionNumber() {
    try {
        // 🔹 1. Get Accession Number
        const accNo = document.getElementById("Accesstion_number").value.trim();

        if (!accNo) {
            alert("Please enter Accession Number");
            return;
        }

        // 🔹 2. Call API
        const response = await fetch(`${apiBaseUrl}/api/books/${accNo}`);

        if (!response.ok) {
            const err = await response.json();
            alert(err.detail || "Book not found");
            return;
        }

        const data = await response.json();

        // 🔹 3. Init PDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: "landscape" });

        // 🔹 Title
        doc.setFontSize(16);
        doc.text("Book Detail Report", 148, 15, { align: "center" });

        // 🔹 Date
        const date = new Date().toLocaleString();
        doc.setFontSize(10);
        doc.text(`Generated on: ${date}`, 14, 22);

        // 🔹 Total Records
        doc.text(`Total Records: 1`, 14, 30);

        // 🔹 Table Columns
        const tableColumn = [
            "Acc No",
            "Title",
            "Authors",
            "Copies",
            "Pages",
            "Cost",
            "Status",
            "Rack",
            "Shelf",
            "Publisher",
            "Publisher Place",
            "Upload Time"
        ];

        // 🔹 Prepare Data Row
        const tableRows = [[
            data.Accession_number,
            data.Title,
            (data.authors || []).join(", "),
            `${data.Copy_Number}/${data.Total_Copy}`,
            data.total_pages,
            data.Book_Cost,
            data.Status,
            data.rack_location || "-",
            data.self_location || "-",
            data.publisher_name || "-",
            data.Publisher_place || "-",
            formatDateTime(data.book_upload_time)
        ]];

        // 🔹 Table
        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 40,
            theme: "grid",
            styles: {
                fontSize: 7,
                cellWidth: "wrap"
            },
            headStyles: {
                fillColor: [0, 102, 204]
            },
            columnStyles: {
                1: { cellWidth: 60 }, // Title
                2: { cellWidth: 60 }  // Authors
            }
        });

        // 🔹 Page Number
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(9);
            doc.text(`Page ${i} of ${pageCount}`, 270, 200);
        }

        // 🔹 Save
        doc.save(`Book_${accNo}_Report.pdf`);

    } catch (error) {
        console.error("Error generating Book PDF:", error);
        alert("Something went wrong");
    }
}