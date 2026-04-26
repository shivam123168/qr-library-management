async function UploadAllStudentExcel() {

    const fileInput = document.getElementById("StudentExcelFile");
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

    // 🔹 Show progress UI
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

        // 🔥 Parallel with control (batch size)
        const batchSize = 10;

        for (let i = 0; i < total; i += batchSize) {

            const batch = jsonData.slice(i, i + batchSize);

            const promises = batch.map(async (row) => {

                function safeString(val) {
                    return val !== undefined && val !== null ? String(val).trim() : "";
                }

                const studentData = {
                    Prn_id: row["Prn_id"] ? Number(row["Prn_id"]) : null,

                    first_name: safeString(row["first_name"]),
                    Middle_name: safeString(row["Middle_name"]),
                    last_name: safeString(row["last_name"]),
                    gmail: safeString(row["gmail"]),

                    Phone_no: safeString(row["Phone_no"]),
                    password: safeString(row["password"]),

                    Branch_name: safeString(row["Branch_name"]),
                    DOB: safeString(row["DOB"]),

                    // 🔥 IMPORTANT FIX
                    sem: safeString(row["sem"])
                };

                // Skip invalid
                if (!studentData.Prn_id || !studentData.gmail) {
                    failed++;
                    return;
                }

                try {
                    const response = await fetch(`${apiBaseUrl}/api/students_through_excel`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": "Bearer " + token
                        },
                        body: JSON.stringify(studentData)
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

                // 🔹 Progress update
                completed++;
                let percent = Math.round((completed / total) * 100);
                progressBar.style.width = percent + "%";
                uploadText.innerText = `Uploading... ${percent}%`;
            });

            await Promise.all(promises); // batch wait
        }

        // 🔹 Final result
        uploadText.innerText = `Completed | Success: ${success} | Failed: ${failed}`;
        uploadBtn.disabled = false;

        alert(`Upload Done\nSuccess: ${success}\nFailed: ${failed}`);
    };

    reader.readAsArrayBuffer(file);
}