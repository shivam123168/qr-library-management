async function UploadAllEmployeeExcel() {

    const fileInput = document.getElementById("EmployeeExcelFile");
    const file = fileInput.files[0];
    const token = localStorage.getItem("access_token");

    const statusDiv = document.getElementById("uploadStatus");
    const progressBar = document.getElementById("progressBar");
    const uploadText = document.getElementById("uploadText");
    const uploadBtn = document.getElementById("uploadBtn");

    if (!file) {
        alert("Please select an Excel file");
        return;
    }

    if (!token) {
        alert("You are not logged in!");
        return;
    }

    // 🔹 Disable button
    uploadBtn.disabled = true;

    // 🔹 Show UI
    statusDiv.style.display = "block";
    progressBar.style.width = "0%";
    uploadText.innerText = "Reading Excel...";

    const reader = new FileReader();

    reader.onload = async function (e) {

        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });

        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        const total = jsonData.length;
        let completed = 0;
        let success = 0;
        let failed = 0;

        uploadText.innerText = "Uploading...";

        // 🔥 Batch size (important for 500+)
        const batchSize = 20;

        function safeString(val) {
            return val !== undefined && val !== null ? String(val).trim() : "";
        }

        for (let i = 0; i < total; i += batchSize) {

            const batch = jsonData.slice(i, i + batchSize);

            const promises = batch.map(async (row) => {

                const employeeData = {
                    Emp_Id: row["Emp_Id"] ? Number(row["Emp_Id"]) : null,

                    First_name: safeString(row["First_name"]),
                    Middle_name: safeString(row["Middle_name"]),
                    Last_name: safeString(row["Last_name"]),
                    Gmail: safeString(row["Gmail"]),
                    Phone_no: safeString(row["Phone_no"]),
                    Password: safeString(row["Password"]),

                    Department_name: safeString(row["Department_name"]),
                    Post_name: safeString(row["Post_name"]),
                    DOB: safeString(row["DOB"])
                };

                // 🔹 Skip invalid rows
                if (!employeeData.Gmail || !employeeData.Emp_Id) {
                    failed++;
                    console.warn("Skipping invalid row:", row);
                    return;
                }

                try {
                    const response = await fetch(`${apiBaseUrl}/api/employees_through_excel`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": "Bearer " + token
                        },
                        body: JSON.stringify(employeeData)
                    });

                    if (response.ok) {
                        success++;
                    } else {
                        failed++;
                        const err = await response.json();
                        console.warn("Error:", err.detail);
                    }

                } catch (error) {
                    failed++;
                    console.error(error);
                }

                // 🔹 Update progress
                completed++;
                let percent = Math.round((completed / total) * 100);
                progressBar.style.width = percent + "%";
                uploadText.innerText = `Uploading... ${percent}%`;
            });

            await Promise.all(promises); // wait for batch
        }

        // 🔹 Final result
        uploadText.innerText = `Completed | Success: ${success} | Failed: ${failed}`;
        uploadBtn.disabled = false;

        alert(`Upload Done\nSuccess: ${success}\nFailed: ${failed}`);
    };

    reader.readAsArrayBuffer(file);
}