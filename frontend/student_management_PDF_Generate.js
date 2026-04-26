function formatDate(dateString) {
    if (!dateString) return "-";
    const d = new Date(dateString);
    return d.toLocaleDateString();
}

function formatDateTime(dateString) {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString();
}

async function GenerateStudentPDFByName() {
    try {
        // 🔹 1. Get Name Input
        const name = document.getElementById("Student_Name").value.trim();

        if (!name) {
            alert("Please enter student name");
            return;
        }

        // 🔹 2. Get Token
        const token = localStorage.getItem("access_token");

        if (!token) {
            alert("User not authenticated. Please login again.");
            return;
        }

        // 🔹 3. Call API
        const response = await fetch(
            `${apiBaseUrl}/api/students/search/by-name?name=${encodeURIComponent(name)}`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            }
        );

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
        doc.text("Student Report (Search by Name)", 105, 15, { align: "center" });

        //  Date
        const date = new Date().toLocaleString();
        doc.setFontSize(10);
        doc.text(`Generated on: ${date}`, 14, 22);

        //  Search Info
        doc.text(`Search Name: ${name}`, 14, 30);

        //  Total Records
        doc.text(`Total Records: ${data.length}`, 14, 36);

        // Table Columns
        const tableColumn = [
            "PRN",
            "Full Name",
            "Branch",
            "Sem",
            "Phone",
            "Email",
            "Age"
        ];

        const tableRows = [];

        //  Empty Case
        if (data.length === 0) {
            tableRows.push(["-", "No Records Found", "-", "-", "-", "-", "-"]);
        } else {
            data.forEach(item => {
                tableRows.push([
                    item.Prn_id,
                    `${item.first_name} ${item.Middle_name || ""} ${item.last_name}`,
                    item.Branch_name || "-",
                    item.sem,
                    item.Phone_no,
                    item.gmail,
                    item.age
                ]);
            });
        }

        //  Table
        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 45,
            theme: 'grid',
            headStyles: { fillColor: [0, 102, 204] },
            styles: { fontSize: 8 }
        });

        //  Page Numbers
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.text(`Page ${i} of ${pageCount}`, 180, 290);
        }

        //  Save PDF
        doc.save(`Student_Search_${name}.pdf`);

    } catch (error) {
        console.error("Error generating Student PDF:", error);
        alert("Something went wrong");
    }
}


async function GenerateStudentPDFByPRN() {
    try {
        // 🔹 1. Get PRN
        const prn = document.getElementById("Student_Prn").value.trim();

        if (!prn) {
            alert("Please enter Student PRN");
            return;
        }

        // 🔹 2. Get Token
        const token = localStorage.getItem("access_token");

        if (!token) {
            alert("User not authenticated. Please login again.");
            return;
        }

        // 🔹 3. Call API
        const response = await fetch(`${apiBaseUrl}/api/students/${prn}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            const err = await response.json();
            alert(err.detail || "Student not found");
            return;
        }

        const data = await response.json();

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // 🔹 Title
        doc.setFontSize(16);
        doc.text("Student Report (By PRN)", 105, 15, { align: "center" });

        // 🔹 Date
        const date = new Date().toLocaleString();
        doc.setFontSize(10);
        doc.text(`Generated on: ${date}`, 14, 22);

        // 🔹 Total Records
        doc.text(`Total Records: 1`, 14, 28);

        // 🔹 Table Columns
        const tableColumn = [
            "PRN",
            "Full Name",
            "Branch",
            "Sem",
            "Phone",
            "Email",
            "DOB",
            "Created At"
        ];

        // 🔹 Table Row (Single Record)
        const fullName = `${data.first_name} ${data.Middle_name || ""} ${data.last_name}`;

        const tableRows = [[
            data.Prn_id,
            fullName,
            data.branch_name || "-",
            data.sem,
            data.Phone_no,
            data.gmail,
            formatDate(data.DOB),
            formatDateTime(data.student_creation_time)
        ]];

        // 🔹 Table
        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 35,
            theme: 'grid',
            headStyles: { fillColor: [0, 102, 204] },
            styles: { fontSize: 8 }
        });

        // 🔹 Page Numbers
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.text(`Page ${i} of ${pageCount}`, 180, 290);
        }

        // 🔹 Save PDF
        doc.save(`Student_${prn}_Report.pdf`);

    } catch (error) {
        console.error("Error generating Student PDF:", error);
        alert("Something went wrong");
    }
}

async function GenerateAllStudentPDF() {
    try {
        // 🔹 1. Get Filters
        const branchId = document.getElementById("branch2").value;
        const branchName = document.getElementById("branch2").options[document.getElementById("branch2").selectedIndex].text;
        const sem = document.getElementById("semFilter").value;
        const semName = document.getElementById("semFilter").options[document.getElementById("semFilter").selectedIndex].text;

        // 🔹 2. Get Token
        const token = localStorage.getItem("access_token");

        if (!token) {
            alert("User not authenticated. Please login again.");
            return;
        }

        // 🔹 3. Build URL with Query Params
        let url = `${apiBaseUrl}/api/qr_generator_students?`;

        if (branchId) {
            url += `branch_id=${encodeURIComponent(branchId)}&`;
        }

        if (sem) {
            url += `sem=${encodeURIComponent(sem)}&`;
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
        doc.text("Student Report", 105, 15, { align: "center" });

        //  Date
        const date = new Date().toLocaleString();
        doc.setFontSize(10);
        doc.text(`Generated on: ${date}`, 14, 22);

        //  Filters Info
        doc.text(`Branch: ${branchName || "All"}`, 14, 30);
        doc.text(`Semester: ${semName || "All"}`, 14, 36);

        //  Total Records
        doc.text(`Total Records: ${data.length}`, 14, 42);

        //  Table Columns
        const tableColumn = [
            "PRN",
            "Full Name",
            "Branch",
            "Sem",
            "Phone",
            "Email",
            "DOB"
        ];

        const tableRows = [];

        // 🔹 Empty Case
        if (data.length === 0) {
            tableRows.push(["-", "No Records Found", "-", "-", "-", "-", "-"]);
        } else {
            data.forEach(item => {
                tableRows.push([
                    item.Prn_id,
                    `${item.first_name} ${item.Middle_name || ""} ${item.last_name}`,
                    item.branch_name || "-",
                    item.sem,
                    item.Phone_no,
                    item.gmail,
                    formatDate(item.DOB)
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
            styles: { fontSize: 8 }
        });

        //  Page Numbers
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.text(`Page ${i} of ${pageCount}`, 180, 290);
        }

        //  Save PDF
        doc.save("Filtered_Student_Report.pdf");

    } catch (error) {
        console.error("Error generating Student PDF:", error);
        alert("Something went wrong");
    }
}