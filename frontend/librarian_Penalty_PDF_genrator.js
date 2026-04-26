
function formatDate(dateString) {
    if (!dateString) return "-";
    const d = new Date(dateString);
    return d.toLocaleDateString();
}

async function GenrateStudentPenaltyPDF() {
    try {
        const prn = document.getElementById("studentPrnInput").value.trim();

        if (!prn) {
            alert("Please enter Student PRN");
            return;
        }

        // 🔹 Get token (wherever you stored it after login)
        const token = localStorage.getItem("access_token"); 
        // ⚠️ make sure your key name is correct

        if (!token) {
            alert("User not authenticated. Please login again.");
            return;
        }

        // 🔹 API Call with Bearer Token
        const response = await fetch(`${apiBaseUrl}/api/penalties/student/${prn}`, {
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

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // 🔹 Title
        doc.setFontSize(16);
        doc.text("Student Penalty Report", 105, 15, { align: "center" });

        // 🔹 Date
        const date = new Date().toLocaleString();
        doc.setFontSize(10);
        doc.text(`Generated on: ${date}`, 14, 22);

        // 🔹 Student Info
        doc.text(`Name: ${data.borrower_name}`, 14, 30);
        doc.text(`PRN: ${data.borrower_id}`, 14, 36);
        doc.text(`Email: ${data.borrower_email}`, 14, 42);
        doc.text(`Phone: ${data.borrower_phone}`, 14, 48);

        // 🔹 Summary
        doc.text(`Total Penalties: ${data.total_penalties}`, 14, 56);
        doc.text(`Total Unpaid Amount: ₹${data.total_unpaid_amount}`, 14, 62);

        // 🔹 Table
        const tableColumn = [
            "Penalty ID",
            "Book",
            "Amount",
            "Status",
            "Issue Date",
            "Due Date",
            "Returned",
            "Excuse"
        ];

        const tableRows = [];

        if (data.penalties.length === 0) {
            tableRows.push(["-", "No Records Found", "-", "-", "-", "-", "-", "-"]);
        } else {
            data.penalties.forEach(item => {
                tableRows.push([
                    item.penalty_id,
                    item.book_title,
                    item.amount,
                    item.status,
                    formatDate(item.issue_date),
                    formatDate(item.due_date),
                    formatDate(item.returned_date),
                    item.excuse || "-"
                ]);
            });
        }

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 70,
            theme: 'grid',
            headStyles: { fillColor: [0, 102, 204] }
        });

        // 🔹 Page Numbers
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.text(`Page ${i} of ${pageCount}`, 180, 290);
        }

        doc.save(`Student_${prn}_Penalty_Report.pdf`);

    } catch (error) {
        console.error("Error generating PDF:", error);
        alert("Something went wrong");
    }
}


async function GenrateEmployeePenaltyPDF() {
    try {
        // 🔹 1. Get Employee ID
        const empId = document.getElementById("employeePrnInput").value.trim();

        if (!empId) {
            alert("Please enter Employee ID");
            return;
        }

        // 🔹 2. Get Token
        const token = localStorage.getItem("access_token");

        if (!token) {
            alert("User not authenticated. Please login again.");
            return;
        }

        // 🔹 3. Call API with Auth
        const response = await fetch(`${apiBaseUrl}/api/penalties/employee/${empId}`, {
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

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // 🔹 Title
        doc.setFontSize(16);
        doc.text("Employee Penalty Report", 105, 15, { align: "center" });

        // 🔹 Date
        const date = new Date().toLocaleString();
        doc.setFontSize(10);
        doc.text(`Generated on: ${date}`, 14, 22);

        // 🔹 Employee Info
        doc.text(`Name: ${data.borrower_name}`, 14, 30);
        doc.text(`Employee ID: ${data.borrower_id}`, 14, 36);
        doc.text(`Email: ${data.borrower_email}`, 14, 42);
        doc.text(`Phone: ${data.borrower_phone}`, 14, 48);

        // 🔹 Summary
        doc.text(`Total Penalties: ${data.total_penalties}`, 14, 56);
        doc.text(`Total Unpaid Amount: ₹${data.total_unpaid_amount}`, 14, 62);

        // 🔹 Table Columns
        const tableColumn = [
            "Penalty ID",
            "Book",
            "Amount",
            "Status",
            "Issue Date",
            "Due Date",
            "Returned",
            "Excuse"
        ];

        const tableRows = [];

        // 🔹 Handle Empty Case
        if (data.penalties.length === 0) {
            tableRows.push(["-", "No Records Found", "-", "-", "-", "-", "-", "-"]);
        } else {
            data.penalties.forEach(item => {
                tableRows.push([
                    item.penalty_id,
                    item.book_title,
                    item.amount,
                    item.status,
                    formatDate(item.issue_date),
                    formatDate(item.due_date),
                    formatDate(item.returned_date),
                    item.excuse || "-"
                ]);
            });
        }

        // 🔹 Table
        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 70,
            theme: 'grid',
            headStyles: { fillColor: [0, 102, 204] }
        });

        // 🔹 Page Numbers
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.text(`Page ${i} of ${pageCount}`, 180, 290);
        }

        // 🔹 Save PDF
        doc.save(`Employee_${empId}_Penalty_Report.pdf`);

    } catch (error) {
        console.error("Error generating Employee PDF:", error);
        alert("Something went wrong");
    }
}

async function GenrateAllPenaltyPDF() {
    try {
        // 🔹 1. Get Filters
        const status = document.getElementById("statusFilter").value;
        const borrower = document.getElementById("borrowerFilter").value;

        // 🔹 2. Get Token
        const token = localStorage.getItem("access_token");

        if (!token) {
            alert("User not authenticated. Please login again.");
            return;
        }

        // 🔹 3. Build Query Params
        let url = `${apiBaseUrl}/api/penalties_for_PDF/all?`;
        
        if (status) {
            url += `status=${encodeURIComponent(status)}&`;
        }

        if (borrower) {
            url += `borrower_type=${encodeURIComponent(borrower)}&`;
        }

        // 🔹 4. Call API
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

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        //  Title
        doc.setFontSize(16);
        doc.text("All Penalty Report", 105, 15, { align: "center" });

        //  Date
        const date = new Date().toLocaleString();
        doc.setFontSize(10);
        doc.text(`Generated on: ${date}`, 14, 22);

        //  Filters Info
        doc.text(`Status Filter: ${status || "All"}`, 14, 30);
        doc.text(`Borrower Type: ${borrower || "All"}`, 14, 36);

        //  Total Records
        doc.text(`Total Records: ${data.total}`, 14, 42);

        // Table Columns
        const tableColumn = [
            "ID",
            "Borrower",
            "Type",
            "Book",
            "Amount",
            "Status",
            "Issue Date",
            "Due Date",
            "Excuse"
        ];

        const tableRows = [];

        //  Empty Case
        if (data.penalties.length === 0) {
            tableRows.push(["-", "No Records Found", "-", "-", "-", "-", "-", "-", "-"]);
        } else {
            data.penalties.forEach(item => {
                tableRows.push([
                    item.penalty_id,
                    item.borrower_name,
                    item.borrower_type,
                    item.book_title,
                    item.amount,
                    item.status,
                    formatDate(item.issued_date),
                    formatDate(item.due_date),
                    item.excuse || "-"
                ]);
            });
        }

        //  Table
        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 50,
            theme: 'grid',
            headStyles: { fillColor: [0, 102, 204] },
            styles: { fontSize: 8 } // fit more columns
        });

        //  Page Numbers
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.text(`Page ${i} of ${pageCount}`, 180, 290);
        }

        //  Save PDF
        doc.save("All_Penalties_Report.pdf");

    } catch (error) {
        console.error("Error generating PDF:", error);
        alert("Something went wrong");
    }
}