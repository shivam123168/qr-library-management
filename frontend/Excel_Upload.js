

function UploadBranchExcel() {
    uploadExcel(
        "branchFile",                // input id
        "Branches",                 // Excel column name
        "/api/reference/branches",  // API endpoint
        "Branch_name"               // backend field
    );
}

function UploadDepartmentExcel() {
    uploadExcel(
        "departmentFile",
        "Department",
        "/api/reference/departments",
        "department_name"
    );
}

function UploadPostExcel() {
    uploadExcel(
        "PostFile",                         // file input id
        "Post",                             // Excel column name
        "/api/reference/employee-posts",    // API endpoint
        "post_name"                         // backend field
    );
}

function UploadPublisherExcel() {
    uploadExcel(
        "publisherFile",              // file input id
        "Publisher",                  // Excel column name
        "/api/reference/publishers",  // API endpoint
        "publisher_name"              // backend field
    );
}


function UploadAuthorExcel() {
    uploadExcel(
        "AuthorFile",              // file input id
        "Author",                  // Excel column name
        "/api/reference/authors",  // API endpoint
        "Author_name"              // backend field
    );
}


function UploadPenaltyAmountExcel() {
    uploadExcel(
        "PenaltyAmountFile",              // file input id
        "Penalty Amount",                  // Excel column name
        "/api/reference/penalty-amounts",  // API endpoint
        "penalty_amount"              // backend field
    );
}


function UploadPenaltyExcuseExcel() {
    uploadExcel(
        "PenaltyExcuseFile",              // file input id
        "Penalty Excuse",                  // Excel column name
        "/api/reference/penalty-excuses",  // API endpoint
        "excuse"              // backend field
    );
}


async function uploadExcel(fileId, columnName, apiUrl, fieldName) {
    const fileInput = document.getElementById(fileId);
    const file = fileInput.files[0];

    if (!file) {
        alert("Please select an Excel file");
        return;
    }

    const token = localStorage.getItem("access_token");

    if (!token) {
        alert("You are not logged in!");
        return;
    }

    const reader = new FileReader();

    reader.onload = async function (e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });

        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        console.log("Excel Data:", jsonData);

        for (let i = 0; i < jsonData.length; i++) {
            const value = jsonData[i][columnName];

            if (!value) continue;

            try {
                const response = await fetch(`${apiBaseUrl}${apiUrl}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + token
                    },
                    body: JSON.stringify({
                        [fieldName]: value   // dynamic key
                    })
                });

                const result = await response.json();

                if (!response.ok) {
                    console.warn(`Failed for ${value}:`, result.detail);
                } else {
                    console.log(`Added: ${value}`);
                }

            } catch (error) {
                console.error("Error:", error);
            }
        }

        alert("Upload Completed");
    };

    reader.readAsArrayBuffer(file);
}