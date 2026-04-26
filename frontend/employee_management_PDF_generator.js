function formatDate(dateString) {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString();
}

function formatDateTime(dateString) {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString();
}

async function GeneratePDFFromId() {
    try {
        //  1. Get Employee ID
        const empId = document.getElementById("Employee_Id").value.trim();

        if (!empId) {
            alert("Please enter Employee ID");
            return;
        }

        //  2. Get Token
        const token = localStorage.getItem("access_token");

        if (!token) {
            alert("User not authenticated. Please login again.");
            return;
        }

        //  3. Call API
        const response = await fetch(`${apiBaseUrl}/api/employees/${empId}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            const err = await response.json();
            alert(err.detail || "Employee not found");
            return;
        }

        const data = await response.json();

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        //  Title
        doc.setFontSize(16);
        doc.text("Employee Report", 105, 15, { align: "center" });

        //   Date
        const date = new Date().toLocaleString();
        doc.setFontSize(10);
        doc.text(`Generated on: ${date}`, 14, 22);

        //  Total Records
        doc.text(`Total Records: 1`, 14, 28);

        //  Table Columns
        const tableColumn = [
            "ID",
            "Full Name",
            "Department",
            "Post",
            "Phone",
            "Email",
            "DOB",
            "Created At"
        ];

        //  Prepare Data Row
        const fullName = `${data.First_name} ${data.Middle_name || ""} ${data.Last_name}`;

        const tableRows = [[
            data.Emp_Id,
            fullName,
            data.department_name || "-",
            data.post_name || "-",
            data.Phone_no,
            data.Gmail,
            formatDate(data.DOB),
            formatDateTime(data.employee_creation_time)
        ]];

        //  Table
        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 35,
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
        doc.save(`Employee_${empId}_Report.pdf`);

    } catch (error) {
        console.error("Error generating Employee PDF:", error);
        alert("Something went wrong");
    }
}

async function GeneratePDFFromFilters() {
    try {
        // 🔹 1. Get Filters
        const departmentId = document.getElementById("departmentFilter").value;
        const postId = document.getElementById("PostFilter").value;

        // 🔹 2. Get Token
        const token = localStorage.getItem("access_token");

        if (!token) {
            alert("User not authenticated. Please login again.");
            return;
        }

        // 🔹 3. Build URL
        let url = `${apiBaseUrl}/api/employees_for_QR?`;

        if (departmentId) {
            url += `department_id=${encodeURIComponent(departmentId)}&`;
        }

        if (postId) {
            url += `post_id=${encodeURIComponent(postId)}&`;
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

        // 🔹 Title
        doc.setFontSize(16);
        doc.text("Employee Report", 105, 15, { align: "center" });

        // 🔹 Date
        const date = new Date().toLocaleString();
        doc.setFontSize(10);
        doc.text(`Generated on: ${date}`, 14, 22);

        // 🔹 Filter Text (Show Names, not IDs)
        const deptText = document.getElementById("departmentFilter").selectedOptions[0].text;
        const postText = document.getElementById("PostFilter").selectedOptions[0].text;

        doc.text(`Department: ${departmentId ? deptText : "All"}`, 14, 30);
        doc.text(`Post: ${postId ? postText : "All"}`, 14, 36);

        // 🔹 Total Records
        doc.text(`Total Records: ${data.length}`, 14, 42);

        // 🔹 Table Columns
        const tableColumn = [
            "ID",
            "Full Name",
            "Department",
            "Post",
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
                    item.Emp_Id,
                    `${item.First_name} ${item.Middle_name || ""} ${item.Last_name}`,
                    item.department_name || "-",
                    item.post_name || "-",
                    item.Phone_no,
                    item.Gmail,
                    formatDate(item.DOB)
                ]);
            });
        }

        // 🔹 Table
        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 50,
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
        doc.save("Filtered_Employee_Report.pdf");

    } catch (error) {
        console.error("Error generating Employee PDF:", error);
        alert("Something went wrong");
    }
}