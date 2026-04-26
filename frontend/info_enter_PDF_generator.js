
function GenerateBranchPDF() {
    generatePDF(
        "/api/reference/branches",
        ["Branch ID", "Branch Name"],
        ["Branch_id", "Branch_name"],
        "Branch_Report.pdf",
        "Branch Report"
    );
}

function GenerateDepartmentPDF() {
    generatePDF(
        "/api/reference/departments",
        ["Department ID", "Department Name"],
        ["Department_id", "department_name"],
        "Department_Report.pdf",
        "Department Report"
    );
}

function GeneratePostPDF() {
    generatePDF(
        "/api/reference/employee-posts",
        ["Employee Post Id", "Post Name"],
        ["Employee_post_id", "post_name"],
        "Post_Report.pdf",
        "Employee Post Report"
    );
}


function GeneratePublisherPDF() {
    generatePDF(
        "/api/reference/publishers",
        ["Publisher ID", "Publisher Name"],
        ["publisher_id", "publisher_name"],
        "Books_Publisher_Report.pdf",
        "Books Publisher Report"
    );
}

function GenerateAuthorPDF() {
    generatePDF(
        "/api/reference/authors",
        ["Author ID", "Author Name"],
        ["Author_id", "Author_name"],
        "Books_Author_Report.pdf",
        "Books Author Report"
    );
}

function GeneratePenaltyAmountPDF() {
    generatePDF(
        "/api/reference/penalty-amounts",
        ["Penalty Amount ID", "Amount"],
        ["id", "penalty_amount"],
        "Penalty_Amount_Report.pdf",
        "Penalty Amount Report"
    );
}

function GeneratePenaltyExcusePDF() {
    generatePDF(
        "/api/reference/penalty-excuses",
        ["Penalty Excuse ID", "Excuse"],
        ["penalty_excuse_id", "excuse"],
        "Penalty_Excuse_Report.pdf",
        "Penalty Excuse Report"
    );
}


async function generatePDF(apiUrl, columns, fields, filename, title) {
    try {
        const response = await fetch(`${apiBaseUrl}${apiUrl}`);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            console.error("API did not return array:", data);
            alert("API Error: Data is not in expected format");
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // 🔹 Title
        doc.setFontSize(16);
        doc.text(title, 105, 15, { align: "center" });

        // 🔹 Date
        const date = new Date().toLocaleString();
        doc.setFontSize(10);
        doc.text(`Generated on: ${date}`, 14, 22);

        // 🔹 Total Records
        const totalRecords = data.length;
        doc.text(`Total Records: ${totalRecords}`, 14, 28);

        // 🔹 Prepare Table
        const tableRows = [];

        data.forEach(item => {
            const row = [];
            fields.forEach(field => {
                row.push(item[field]);
            });
            tableRows.push(row);
        });

        // 🔹 Table
        doc.autoTable({
            head: [columns],
            body: tableRows,
            startY: 35, // ⬅️ moved down to make space for total
            theme: 'grid',
            headStyles: { fillColor: [0, 102, 204] }
        });

        // 🔹 Page Numbers
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.text(`Page ${i} of ${pageCount}`, 180, 290);
        }

        // 🔹 Save
        doc.save(filename);

    } catch (error) {
        console.error("PDF Generation Error:", error);
        alert("Something went wrong. Check console.");
    }
}