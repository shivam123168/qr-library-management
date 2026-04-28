async function UploadAllBookExcel() {

    const fileInput = document.getElementById("BookExcelFile");
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

    uploadBtn.disabled = true;
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

        // 🔥 IMPORTANT: SMALL BATCH for 8000+
        const batchSize = 10;

        function clean(val) {
            return val !== undefined && val !== null ? String(val).trim() : "";
        }

        function parseAuthors(authors) {
            if (!authors) return [];
            return authors.split(",").map(a => a.trim());
        }

        for (let i = 0; i < total; i += batchSize) {

            const batch = jsonData.slice(i, i + batchSize);

            const promises = batch.map(async (row) => {

                const bookData = {
                    Accession_number: row["Accession_number"] ? Number(row["Accession_number"]) : null,
                    Title: clean(row["Title"]),
                    Book_Cost: row["Book_Cost"] ? Number(row["Book_Cost"]) : 0,
                    Copy_Number: row["Copy_Number"] ? Number(row["Copy_Number"]) : 1,
                    Total_Copy: row["Total_Copy"] ? Number(row["Total_Copy"]) : 1,
                    Status: clean(row["Status"]),
                    publisher_name: clean(row["publisher_name"]),
                    Publisher_place: clean(row["Publisher_place"]),
                    rack_location: clean(row["rack_location"]),
                    self_location: clean(row["self_location"]),
                    total_pages: row["total_pages"] ? Number(row["total_pages"]) : 0,

                    // 🔥 IMPORTANT PART
                    author_names: parseAuthors(row["author_names"])
                };

                // Skip invalid rows
                if (!bookData.Accession_number || !bookData.Title) {
                    failed++;
                    return;
                }

                try {
                    const response = await fetch(`${apiBaseUrl}/api/books_through_excel`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": "Bearer " + token
                        },
                        body: JSON.stringify(bookData)
                    });

                    if (response.ok) {
                        success++;
                    } else {
                        failed++;
                        try {
                            const err = await response.json();
                            console.warn("Error:", err.detail);
                        } catch {
                            console.warn("Server error");
                        }
                    }

                } catch (error) {
                    failed++;
                    console.error(error);
                }

                // Progress update
                completed++;
                let percent = Math.round((completed / total) * 100);
                progressBar.style.width = percent + "%";
                uploadText.innerText = `Uploading... ${percent}%`;
            });

            await Promise.all(promises);

            //  SMALL DELAY (VERY IMPORTANT FOR 8000)
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        uploadText.innerText = `Completed | Success: ${success} | Failed: ${failed}`;
        uploadBtn.disabled = false;

        alert(`Upload Done\nSuccess: ${success}\nFailed: ${failed}`);
    };

    reader.readAsArrayBuffer(file);
}