const apiBaseUrl = `http://${window.location.hostname}:8000`;
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

    loadBranches();
    loadEmployeePosts();
    loadDepartments();


  } catch (error) {
    console.error("Error:", error);

    // If token expired or invalid → logout
    localStorage.removeItem("access_token");
    window.location.href = "librarian_login.html";
  }

});



// ===============================
// LOAD BRANCHES INTO DROPDOWN
// ===============================

async function loadBranches() {

  try {
    const response = await fetch(`${apiBaseUrl}/api/reference/branches`);

    if (!response.ok) {
      throw new Error("Failed to fetch branches");
    }

    const branches = await response.json();


    const branchSelect2 = document.getElementById("branch2");

    // Clear existing options except first one

    branchSelect2.innerHTML = '<option value="">All (Select Branch)</option>';


    branches.forEach(branch => {
      const option = document.createElement("option");
      option.value = branch.Branch_id;        // send ID to backend
      option.textContent = branch.Branch_name; // show name to user

      branchSelect2.appendChild(option);
    });

    console.log("Branches loaded successfully");

  } catch (error) {
    console.error("Error loading branches:", error);
    alert("Unable to load branches");
  }
}


async function loadEmployeePosts() {


  const postFilter = document.getElementById("PostFilter");

  try {
    const response = await fetch(`${apiBaseUrl}/api/reference/employee-posts`, {
      method: "GET",
      headers: {
        "Authorization": "Bearer " + localStorage.getItem("access_token")
      }
    });

    const posts = await response.json();

    // Remove old options except the first one
    // select.innerHTML = `<option value="">Select Role</option>`;

    // posts.forEach(post => {

    //     const option = document.createElement("option");

    //     option.value = post.Employee_post_id;
    //     option.textContent = post.post_name;

    //     select.appendChild(option);

    // });


    // Remove old options except the first one
    postFilter.innerHTML = `<option value="">All (Select Post)</option>`;

    posts.forEach(post => {

      const option = document.createElement("option");

      option.value = post.Employee_post_id;
      option.textContent = post.post_name;

      postFilter.appendChild(option);

    });

  } catch (error) {
    console.error("Error loading employee posts:", error);
  }

}


async function loadDepartments() {

  const departmentfilter = document.getElementById("departmentFilter");

  try {
    const response = await fetch(`${apiBaseUrl}/api/reference/departments`, {
      method: "GET",
      headers: {
        "Authorization": "Bearer " + localStorage.getItem("access_token")
      }
    });

    const departments = await response.json();

    // reset dropdown
    // select.innerHTML = `<option value="">Select Department</option>`;

    // departments.forEach(dept => {

    //     const option = document.createElement("option");

    //     option.value = dept.Department_id;
    //     option.textContent = dept.department_name;

    //     select.appendChild(option);

    // });

    // reset dropdown
    departmentfilter.innerHTML = `<option value="">All (Select Department)</option>`;

    departments.forEach(dept => {

      const option = document.createElement("option");

      option.value = dept.Department_id;
      option.textContent = dept.department_name;

      departmentfilter.appendChild(option);

    });

  } catch (error) {
    console.error("Error loading departments:", error);
  }

}

async function MakeQrByStudentPrn() {
  const prn = document.getElementById("studentPrnInput").value.trim();

  if (!prn) return alert("Please enter a PRN.");

  const token = localStorage.getItem("access_token");
  if (!token) return alert("Not authenticated. Please log in again.");

  try {
    const response = await fetch(`${apiBaseUrl}/api/students/${prn}`, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (response.status === 401) return alert("Session expired. Please log in again.");
    if (!response.ok) throw new Error(`Failed to fetch student (${response.status})`);

    const student = await response.json();

    await generatePdfDirectly([student]);


  } catch (err) {
    console.error("[QR Generation]", err);
    alert("Could not generate QR card. Please try again.");
  }
}

// async function generateStudentCard(prn, student) {
//   // — QR code
//   const qrCanvas = document.createElement("canvas");
//   await QRCode.toCanvas(qrCanvas, prn, { width: 200, margin: 1 });
//   const qrImage = qrCanvas.toDataURL("image/png");

//   // — Student details
//   const fullName = [student.first_name, student.Middle_name, student.last_name]
//     .filter(Boolean).join(" ");
//   const branch = student.branch_name || "N/A";
//   const sem = student.sem || "N/A";

//   // — PDF setup
//   const { jsPDF } = window.jspdf;
//   const doc = new jsPDF({ unit: "mm", format: "a4" });

//   // Card dimensions
//   const CX = 12, CY = 20, CW = 185, CH = 72;
//   const RADIUS = 4;
//   const ACCENT_W = 4;
//   const QR_X = CX + ACCENT_W + 6, QR_Y = CY + 10, QR_SIZE = 52;

//   // Card background
//   doc.setFillColor(250, 249, 247);
//   doc.roundedRect(CX, CY, CW, CH, RADIUS, RADIUS, "F");

//   // Left accent bar (purple)
//   doc.setFillColor(108, 99, 245);
//   doc.roundedRect(CX, CY, ACCENT_W, CH, RADIUS, 0, "F");
//   doc.setFillColor(108, 99, 245);
//   doc.rect(CX + RADIUS, CY, ACCENT_W - RADIUS, CH, "F"); // square right edge

//   // QR background bubble
//   doc.setFillColor(255, 255, 255);
//   doc.roundedRect(QR_X - 2, QR_Y - 2, QR_SIZE + 4, QR_SIZE + 4, 3, 3, "F");

//   // QR image
//   doc.addImage(qrImage, "PNG", QR_X, QR_Y, QR_SIZE, QR_SIZE);

//   // PRN tag below QR
//   const tagW = 32, tagH = 6;
//   const tagX = QR_X + (QR_SIZE - tagW) / 2, tagY = QR_Y + QR_SIZE + 4;
//   doc.setFillColor(232, 230, 224);
//   doc.roundedRect(tagX, tagY, tagW, tagH, 3, 3, "F");
//   doc.setFontSize(7);
//   doc.setTextColor(80, 78, 74);
//   doc.setFont("helvetica", "bold");
//   doc.text(prn, tagX + tagW / 2, tagY + 4.2, { align: "center" });

//   // Info column X
//   const IX = QR_X + QR_SIZE + 10;
//   let iy = CY + 12;

//   // Eyebrow label
//   doc.setFontSize(7.5);
//   doc.setFont("helvetica", "normal");
//   doc.setTextColor(160, 158, 148);
//   doc.text("STUDENT ID CARD", IX, iy);
//   iy += 7;

//   // Full name
//   doc.setFontSize(14);
//   doc.setFont("helvetica", "bold");
//   doc.setTextColor(26, 26, 24);
//   doc.text(fullName, IX, iy);
//   iy += 10;

//   // Metadata grid (2 columns)
//   const fields = [
//     ["PRN", prn],
//     ["Branch", branch],
//     ["Semester", sem],
//     ["Academic Year", "2025–26"],
//   ];
//   const COL2_X = IX + 52;

//   doc.setFontSize(7.5);
//   fields.forEach(([key, val], i) => {
//     const x = i % 2 === 0 ? IX : COL2_X;
//     const y = iy + Math.floor(i / 2) * 13;

//     doc.setFont("helvetica", "normal");
//     doc.setTextColor(154, 152, 144);
//     doc.text(key.toUpperCase(), x, y);

//     doc.setFont("helvetica", "bold");
//     doc.setTextColor(46, 46, 43);
//     doc.text(val, x, y + 5);
//   });

//   // Footer divider
//   const footerY = CY + CH - 10;
//   doc.setDrawColor(235, 235, 234);
//   doc.setLineWidth(0.3);
//   doc.line(IX, footerY, CX + CW - 6, footerY);

//   doc.setFontSize(7);
//   doc.setFont("helvetica", "normal");
//   doc.setTextColor(176, 174, 166);
//   doc.text("Library Management System", IX, footerY + 6);
//   doc.text("lms.college.edu", CX + CW - 8, footerY + 6, { align: "right" });

//   // Card border
//   doc.setDrawColor(200, 198, 192);
//   doc.setLineWidth(0.3);
//   doc.roundedRect(CX, CY, CW, CH, RADIUS, RADIUS);

//   // Save
//   doc.save(`${prn}_${student.first_name}_QR.pdf`);
// }

// ─── Accent colours cycling per card ────────────────────────────────────────
const ACCENT_COLORS = [
  { bar: "#6c63f5", prnBg: "#eeedfe", prnTxt: "#534ab7" },
  { bar: "#1d9e75", prnBg: "#e1f5ee", prnTxt: "#0f6e56" },
  { bar: "#d85a30", prnBg: "#faece7", prnTxt: "#993c1d" },
  { bar: "#378add", prnBg: "#e6f1fb", prnTxt: "#185fa5" },
];

// ─── Entry point ─────────────────────────────────────────────────────────────
async function MakeQrByStudentName() {
  const name = document.getElementById("studentNameInput").value.trim();
  if (!name) return alert("Please enter a student name.");
  if (name.length < 2) return alert("Name must be at least 2 characters.");

  const token = localStorage.getItem("access_token");
  if (!token) return alert("Not authenticated. Please log in again.");

  try {
    const res = await fetch(
      `${apiBaseUrl}/api/students/search/by-name?name=${encodeURIComponent(name)}`,
      { headers: { "Authorization": `Bearer ${token}` } }
    );

    if (res.status === 401) return alert("Session expired. Please log in again.");
    if (!res.ok) throw new Error(`Server error (${res.status})`);

    const students = await res.json();

    if (!students.length) {
      alert(`No students found for "${name}"`);
      return;
    }

    await generatePdfDirectly(students);

  } catch (err) {
    console.error("[QR by Name]", err);
    alert("Failed to search students. Please try again.");
  }
}


// ─── Bulk QR generation by branch & semester ───────────────────────────────
async function MakeQrByStudentBranchAndSemester() {
  const branchId = document.getElementById("branch2").value;
  const sem = document.getElementById("semFilter").value;

  const token = localStorage.getItem("access_token");
  if (!token) return alert("Not authenticated. Please log in again.");

  try {
    // 🔥 Build query params dynamically
    let url = `${apiBaseUrl}/api/qr_generator_students?`;

    if (branchId) {
      url += `branch_id=${branchId}&`;
    }

    if (sem) {
      url += `sem=${sem}&`;
    }

    // Remove last '&' if exists
    url = url.endsWith("&") ? url.slice(0, -1) : url;

    // 🔥 API CALL
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      return alert("Session expired. Please log in again.");
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch students (${response.status})`);
    }

    const students = await response.json();

    if (!students.length) {
      return alert("No students found for selected filters.");
    }

    // 🔥 GENERATE PDF (your existing function)
    await generatePdfDirectly(students);

  } catch (err) {
    console.error("[Bulk QR Generation]", err);
    alert("Could not generate QR cards.");
  }
}


// ─── QR generation helper ─────────────────────────────────────────────────────
async function generateQrDataUrl(text) {
  const canvas = document.createElement("canvas");
  await QRCode.toCanvas(canvas, text, { width: 160, margin: 1 });
  return canvas.toDataURL("image/png");
}

// ─── Main PDF generator ───────────────────────────────────────────────────────
async function generatePdfDirectly(students) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

  // Generate all QR images in parallel
  const qrDataUrls = await Promise.all(
    students.map(s => generateQrDataUrl(String(s.Prn_id)))
  );

  // ── ID Card dimensions (CR80 standard) ──────────────────────────────────────
  const CARD_W = 85.6;   // mm — standard ID card width
  const CARD_H = 54.0;   // mm — standard ID card height

  // ── Page layout: 2 columns × 5 rows = 10 cards per A4 page ─────────────────
  const PAGE_W = 210;
  const PAGE_H = 297;
  const COLS = 2;
  const ROWS = 5;
  const CARDS_PER_PAGE = COLS * ROWS;   // 10

  const GAP_X = 5;   // mm — horizontal gap between columns
  const GAP_Y = 4;   // mm — vertical gap between rows

  // Auto-center the grid on the page
  const TOTAL_GRID_W = COLS * CARD_W + (COLS - 1) * GAP_X;
  const TOTAL_GRID_H = ROWS * CARD_H + (ROWS - 1) * GAP_Y;
  const MARGIN_X = (PAGE_W - TOTAL_GRID_W) / 2;   // ~19.2 mm
  const MARGIN_Y = (PAGE_H - TOTAL_GRID_H) / 2;   // ~13.5 mm

  for (let i = 0; i < students.length; i++) {
    if (i > 0 && i % CARDS_PER_PAGE === 0) doc.addPage();

    const posOnPage = i % CARDS_PER_PAGE;
    const col = posOnPage % COLS;
    const row = Math.floor(posOnPage / COLS);

    const CX = MARGIN_X + col * (CARD_W + GAP_X);
    const CY = MARGIN_Y + row * (CARD_H + GAP_Y);

    const student = students[i];
    const fullName = [student.first_name, student.Middle_name, student.last_name]
      .filter(Boolean).join(" ");

    drawIdCard(doc, {
      CX, CY,
      CW: CARD_W,
      CH: CARD_H,
      qrImg: qrDataUrls[i],
      prn: String(student.Prn_id),
      name: fullName,
      branch: student.Branch_name || student.branch_name || "N/A",
      sem: student.sem || "N/A",
      colorIndex: i,
    });
  }

  doc.save(`students_qr_${Date.now()}.pdf`);
}

// ─── Draw a single ID card ────────────────────────────────────────────────────
function drawIdCard(doc, { CX, CY, CW, CH, qrImg, prn, name, branch, sem, colorIndex }) {
  const color = ACCENT_COLORS[colorIndex % ACCENT_COLORS.length];
  const ACCENT_W = 3.5;

  // Internal layout
  const QR_SIZE = 28;
  const QR_BOX_W = QR_SIZE + 6;
  const QR_BOX_H = QR_SIZE + 6;
  const QR_BOX_X = CX + ACCENT_W + 3;
  const QR_BOX_Y = CY + (CH - QR_BOX_H) / 2;   // vertically centered
  const QR_X = QR_BOX_X + 3;
  const QR_Y = QR_BOX_Y + 3;

  const IX = QR_BOX_X + QR_BOX_W + 5;           // info column X
  const INFO_W = CX + CW - IX - 3;              // available width for text

  // ── Card background ──
  doc.setFillColor(252, 251, 249);
  doc.roundedRect(CX, CY, CW, CH, 3, 3, "F");

  // ── Accent bar ──
  const [r, g, b] = hexToRgb(color.bar);
  doc.setFillColor(r, g, b);
  doc.roundedRect(CX, CY, ACCENT_W, CH, 3, 0, "F");
  // Square off the right edge of the rounded rect
  doc.rect(CX + 2, CY, ACCENT_W - 2, CH, "F");

  // ── QR box ──
  doc.setFillColor(243, 242, 238);
  doc.roundedRect(QR_BOX_X, QR_BOX_Y, QR_BOX_W, QR_BOX_H, 3, 3, "F");

  if (qrImg) {
    doc.addImage(qrImg, "PNG", QR_X, QR_Y, QR_SIZE, QR_SIZE);
  }

  // ── PRN badge below QR ──
  const TAG_W = QR_BOX_W - 4;
  const TAG_H = 5;
  const TAG_X = QR_BOX_X + 2;
  const TAG_Y = QR_BOX_Y + QR_BOX_H + 1.5;

  if (TAG_Y + TAG_H < CY + CH - 2) {            // only draw if it fits
    const [bgR, bgG, bgB] = hexToRgb(color.prnBg);
    doc.setFillColor(bgR, bgG, bgB);
    doc.roundedRect(TAG_X, TAG_Y, TAG_W, TAG_H, 2, 2, "F");

    const [tR, tG, tB] = hexToRgb(color.prnTxt);
    doc.setTextColor(tR, tG, tB);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.text(prn, TAG_X + TAG_W / 2, TAG_Y + 3.3, { align: "center" });
  }

  // ── Eyebrow ──
  let iy = CY + 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(160, 158, 150);
  doc.text("STUDENT ID CARD", IX, iy);
  iy += 5.5;

  // ── Name ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(28, 28, 26);

  // Truncate long names to 2 lines max
  const nameLine = doc.splitTextToSize(name, INFO_W);
  doc.text(nameLine.slice(0, 2), IX, iy);
  iy += nameLine.length === 1 ? 7 : 12;

  // ── Meta fields ──
  const fields = [
    ["PRN", prn],
    ["SEM", String(sem)],
    ["BRANCH", branch],

  ];

  const COL2_X = IX + INFO_W / 2;

  doc.setFontSize(6.5);
  fields.forEach(([k, v], fi) => {
    const fx = fi % 2 === 0 ? IX : COL2_X;
    const fy = iy + Math.floor(fi / 2) * 10;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(155, 153, 145);
    doc.text(k, fx, fy);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(48, 48, 44);
    doc.text(v, fx, fy + 4.5);
  });

  // ── Footer divider ──
  const lineY = CY + CH - 8;
  doc.setDrawColor(225, 223, 218);
  doc.setLineWidth(0.25);
  doc.line(IX, lineY, CX + CW - 3, lineY);

  // ── Footer text ──
  doc.setFontSize(5.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(175, 173, 165);
  doc.text("Library Management System", IX, lineY + 4);

  // ── Cut guides (corner crop marks) ──
  doc.setDrawColor(200, 198, 194);
  doc.setLineWidth(0.2);
  const CK = 2;  // crop mark length in mm
  // top-left
  doc.line(CX, CY, CX + CK, CY);
  doc.line(CX, CY, CX, CY + CK);
  // top-right
  doc.line(CX + CW - CK, CY, CX + CW, CY);
  doc.line(CX + CW, CY, CX + CW, CY + CK);
  // bottom-left
  doc.line(CX, CY + CH - CK, CX, CY + CH);
  doc.line(CX, CY + CH, CX + CK, CY + CH);
  // bottom-right
  doc.line(CX + CW - CK, CY + CH, CX + CW, CY + CH);
  doc.line(CX + CW, CY + CH - CK, CX + CW, CY + CH);

  // ── Card border ──
  doc.setDrawColor(215, 213, 208);
  doc.setLineWidth(0.25);
  doc.roundedRect(CX, CY, CW, CH, 3, 3);
}

// ─── Utility ──────────────────────────────────────────────────────────────────
function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}


// ─── Accent colours cycling per card ────────────────────────────────────────
const EMPLOYEE_ACCENT_COLORS = [
  { bar: "#6c63f5", prnBg: "#eeedfe", prnTxt: "#534ab7" },
  { bar: "#1d9e75", prnBg: "#e1f5ee", prnTxt: "#0f6e56" },
  { bar: "#d85a30", prnBg: "#faece7", prnTxt: "#993c1d" },
  { bar: "#378add", prnBg: "#e6f1fb", prnTxt: "#185fa5" },
];

// ─── 1. By Employee ID ────────────────────────────────────────────────────────
async function MakeQRByEmployeeId() {
  const empId = document.getElementById("employeeIDInput").value.trim();
  if (!empId) return alert("Please enter an Employee ID.");

  const token = localStorage.getItem("access_token");
  if (!token) return alert("Not authenticated. Please log in again.");

  try {
    const response = await fetch(`${apiBaseUrl}/api/employees/${empId}`, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (response.status === 401) return alert("Session expired. Please log in again.");
    if (!response.ok) throw new Error(`Failed to fetch employee (${response.status})`);

    const employee = await response.json();

    // Normalize field names to match generateEmployeePdfDirectly expectations
    const normalized = {
      Emp_Id: employee.Emp_Id,
      First_name: employee.First_name,
      Middle_name: employee.Middle_name,
      Last_name: employee.Last_name,
      post_name: employee.post_name,
      department_name: employee.department_name,
    };

    await generateEmployeePdfDirectly([normalized]);

  } catch (err) {
    console.error("[Employee QR by ID]", err);
    alert("Could not generate QR card. Please try again.");
  }
}

// ─── 2. By Employee Name ──────────────────────────────────────────────────────
async function MakeQRByEmployeeName() {
  const name = document.getElementById("employeeNameInput").value.trim();
  if (!name) return alert("Please enter an employee name.");
  if (name.length < 2) return alert("Name must be at least 2 characters.");

  const token = localStorage.getItem("access_token");
  if (!token) return alert("Not authenticated. Please log in again.");

  try {
    const res = await fetch(
      `${apiBaseUrl}/api/employees/search/by-name?name=${encodeURIComponent(name)}`,
      { headers: { "Authorization": `Bearer ${token}` } }
    );

    if (res.status === 401) return alert("Session expired. Please log in again.");
    if (!res.ok) throw new Error(`Server error (${res.status})`);

    const employees = await res.json();
    if (!employees.length) return alert(`No employees found for "${name}"`);

    // Normalize: by-name API returns "Employee_post" and "Department"
    const normalized = employees.map(e => ({
      Emp_Id: e.Emp_Id,
      First_name: e.First_name,
      Middle_name: e.Middle_name,
      Last_name: e.Last_name,
      post_name: e.Employee_post,
      department_name: e.Department,
    }));

    await generateEmployeePdfDirectly(normalized);

  } catch (err) {
    console.error("[Employee QR by Name]", err);
    alert("Failed to search employees. Please try again.");
  }
}

// ─── 3. By Department & Post ──────────────────────────────────────────────────
async function MakeQRByEmployeeDepartmentAndPost() {
  const departmentId = document.getElementById("departmentFilter").value;
  const postId = document.getElementById("PostFilter").value;

  const token = localStorage.getItem("access_token");
  if (!token) return alert("Not authenticated. Please log in again.");

  try {
    let url = `${apiBaseUrl}/api/employees_for_QR?`;
    if (departmentId) url += `department_id=${departmentId}&`;
    if (postId) url += `post_id=${postId}&`;
    url = url.endsWith("&") ? url.slice(0, -1) : url;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (response.status === 401) return alert("Session expired. Please log in again.");
    if (!response.ok) throw new Error(`Failed to fetch employees (${response.status})`);

    const employees = await response.json();
    if (!employees.length) return alert("No employees found for selected filters.");

    // Normalize: employees_for_QR returns "post_name" and "department_name" directly
    const normalized = employees.map(e => ({
      Emp_Id: e.Emp_Id,
      First_name: e.First_name,
      Middle_name: e.Middle_name,
      Last_name: e.Last_name,
      post_name: e.post_name,
      department_name: e.department_name,
    }));

    await generateEmployeePdfDirectly(normalized);

  } catch (err) {
    console.error("[Employee QR by Dept & Post]", err);
    alert("Could not generate QR cards.");
  }
}

// ─── Text truncation helper ─────────────────────────────────────────────────
function truncateText(doc, text, maxWidth) {
  const lines = doc.splitTextToSize(text, maxWidth);
  if (lines.length <= 1 && doc.getTextWidth(text) <= maxWidth) return text;
  // Trim characters until it fits with "…"
  let trimmed = text;
  while (doc.getTextWidth(trimmed + "…") > maxWidth && trimmed.length > 0) {
    trimmed = trimmed.slice(0, -1);
  }
  return trimmed + "…";
}

// ─── QR data URL helper ───────────────────────────────────────────────────────
async function generateEmployeeQrDataUrl(text) {
  const canvas = document.createElement("canvas");
  await QRCode.toCanvas(canvas, text, { width: 160, margin: 1 });
  return canvas.toDataURL("image/png");
}

// ─── Main PDF generator ───────────────────────────────────────────────────────
async function generateEmployeePdfDirectly(employees) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

  // Generate all QR images in parallel
  const qrDataUrls = await Promise.all(
    employees.map(e => generateEmployeeQrDataUrl(String(e.Emp_Id)))
  );

  // ── ID Card dimensions (CR80 standard) ──────────────────────────────────────
  const CARD_W = 85.6;
  const CARD_H = 54.0;

  // ── Page layout: 2 columns × 5 rows = 10 cards per A4 page ─────────────────
  const PAGE_W = 210;
  const PAGE_H = 297;
  const COLS = 2;
  const ROWS = 5;
  const CARDS_PER_PAGE = COLS * ROWS;

  const GAP_X = 5;
  const GAP_Y = 4;

  const TOTAL_GRID_W = COLS * CARD_W + (COLS - 1) * GAP_X;
  const TOTAL_GRID_H = ROWS * CARD_H + (ROWS - 1) * GAP_Y;
  const MARGIN_X = (PAGE_W - TOTAL_GRID_W) / 2;
  const MARGIN_Y = (PAGE_H - TOTAL_GRID_H) / 2;

  for (let i = 0; i < employees.length; i++) {
    if (i > 0 && i % CARDS_PER_PAGE === 0) doc.addPage();

    const posOnPage = i % CARDS_PER_PAGE;
    const col = posOnPage % COLS;
    const row = Math.floor(posOnPage / COLS);

    const CX = MARGIN_X + col * (CARD_W + GAP_X);
    const CY = MARGIN_Y + row * (CARD_H + GAP_Y);

    const emp = employees[i];
    const fullName = [emp.First_name, emp.Middle_name, emp.Last_name]
      .filter(Boolean).join(" ");

    drawEmployeeIdCard(doc, {
      CX, CY,
      CW: CARD_W,
      CH: CARD_H,
      qrImg: qrDataUrls[i],
      empId: String(emp.Emp_Id),
      name: fullName,
      post: emp.post_name || "N/A",
      department: emp.department_name || "N/A",
      colorIndex: i,
    });
  }

  doc.save(`employees_qr_${Date.now()}.pdf`);
}

// ─── Draw a single Employee ID card ──────────────────────────────────────────
function drawEmployeeIdCard(doc, { CX, CY, CW, CH, qrImg, empId, name, post, department, colorIndex }) {
  const color = EMPLOYEE_ACCENT_COLORS[colorIndex % EMPLOYEE_ACCENT_COLORS.length];
  const ACCENT_W = 3.5;

  const QR_SIZE = 28;
  const QR_BOX_W = QR_SIZE + 6;
  const QR_BOX_H = QR_SIZE + 6;
  const QR_BOX_X = CX + ACCENT_W + 3;
  const QR_BOX_Y = CY + (CH - QR_BOX_H) / 2;
  const QR_X = QR_BOX_X + 3;
  const QR_Y = QR_BOX_Y + 3;

  const IX = QR_BOX_X + QR_BOX_W + 5;
  const INFO_W = CX + CW - IX - 3;

  // ── Card background ──
  doc.setFillColor(252, 251, 249);
  doc.roundedRect(CX, CY, CW, CH, 3, 3, "F");

  // ── Accent bar ──
  const [r, g, b] = hexToRgb(color.bar);
  doc.setFillColor(r, g, b);
  doc.roundedRect(CX, CY, ACCENT_W, CH, 3, 0, "F");
  doc.rect(CX + 2, CY, ACCENT_W - 2, CH, "F");

  // ── QR box ──
  doc.setFillColor(243, 242, 238);
  doc.roundedRect(QR_BOX_X, QR_BOX_Y, QR_BOX_W, QR_BOX_H, 3, 3, "F");
  if (qrImg) doc.addImage(qrImg, "PNG", QR_X, QR_Y, QR_SIZE, QR_SIZE);

  // ── Emp ID badge below QR ──
  const TAG_W = QR_BOX_W - 4;
  const TAG_H = 5;
  const TAG_X = QR_BOX_X + 2;
  const TAG_Y = QR_BOX_Y + QR_BOX_H + 1.5;

  if (TAG_Y + TAG_H < CY + CH - 2) {
    const [bgR, bgG, bgB] = hexToRgb(color.prnBg);
    doc.setFillColor(bgR, bgG, bgB);
    doc.roundedRect(TAG_X, TAG_Y, TAG_W, TAG_H, 2, 2, "F");

    const [tR, tG, tB] = hexToRgb(color.prnTxt);
    doc.setTextColor(tR, tG, tB);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.text(empId, TAG_X + TAG_W / 2, TAG_Y + 3.3, { align: "center" });
  }

  // ── Eyebrow ──
  let iy = CY + 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(160, 158, 150);
  doc.text("EMPLOYEE ID CARD", IX, iy);
  iy += 5.5;

  // ── Name ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(28, 28, 26);
  const nameLine = doc.splitTextToSize(name, INFO_W);
  doc.text(nameLine.slice(0, 2), IX, iy);
  iy += nameLine.length === 1 ? 7 : 12;

  // ── Meta fields ──
  const fields = [
    ["EMP ID", empId],
    ["POST", post],
    ["DEPARTMENT", department],
  ];

  const COL2_X = IX + INFO_W / 2;

  doc.setFontSize(6.5);
  fields.forEach(([k, v], fi) => {
    const fx = fi % 2 === 0 ? IX : COL2_X;
    const fy = iy + Math.floor(fi / 2) * 10;
   

    doc.setFont("helvetica", "normal");
    doc.setTextColor(155, 153, 145);
    doc.text(k, fx, fy);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(48, 48, 44);
    // Truncate long values so they don't overflow the card
    const colW = INFO_W / 2 - 3;
    doc.text(truncateText(doc, v, colW), fx, fy + 4.5);
  });

  // ── Footer divider ──
  const lineY = CY + CH - 8;
  doc.setDrawColor(225, 223, 218);
  doc.setLineWidth(0.25);
  doc.line(IX, lineY, CX + CW - 3, lineY);

  // ── Footer text ──
  doc.setFontSize(5.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(175, 173, 165);
  doc.text("Library Management System", IX, lineY + 4);

  // ── Cut guides ──
  doc.setDrawColor(200, 198, 194);
  doc.setLineWidth(0.2);
  const CK = 2;
  doc.line(CX, CY, CX + CK, CY);
  doc.line(CX, CY, CX, CY + CK);
  doc.line(CX + CW - CK, CY, CX + CW, CY);
  doc.line(CX + CW, CY, CX + CW, CY + CK);
  doc.line(CX, CY + CH - CK, CX, CY + CH);
  doc.line(CX, CY + CH, CX + CK, CY + CH);
  doc.line(CX + CW - CK, CY + CH, CX + CW, CY + CH);
  doc.line(CX + CW, CY + CH - CK, CX + CW, CY + CH);

  // ── Card border ──
  doc.setDrawColor(215, 213, 208);
  doc.setLineWidth(0.25);
  doc.roundedRect(CX, CY, CW, CH, 3, 3);
}

// ─── Book QR by Accession Number ─────────────────────────────────────────────
async function MakeQRByBookAccesstionNumber() {
  const accession = document.getElementById("bookAccessionInput").value.trim();
  if (!accession) return alert("Please enter an Accession Number.");

  const token = localStorage.getItem("access_token");
  if (!token) return alert("Not authenticated. Please log in again.");

  try {
    const response = await fetch(`${apiBaseUrl}/api/books/${accession}`, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (response.status === 401) return alert("Session expired. Please log in again.");
    if (response.status === 404) return alert("Book not found. Please check the accession number.");
    if (!response.ok) throw new Error(`Failed to fetch book (${response.status})`);

    const book = await response.json();
    await generateBookPdfDirectly([book]);

  } catch (err) {
    console.error("[Book QR by Accession]", err);
    alert("Could not generate QR card. Please try again.");
  }
}

async function MakeQRByBookName() {
  const title = document.getElementById("BookNameInput").value.trim();
  if (!title) return alert("Please enter a book name.");
  if (title.length < 2) return alert("Book name must be at least 2 characters.");

  const token = localStorage.getItem("access_token");
  if (!token) return alert("Not authenticated. Please log in again.");

  try {
    const res = await fetch(
      `${apiBaseUrl}/api/books/search/by-title?title=${encodeURIComponent(title)}`,
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      }
    );

    if (res.status === 401) return alert("Session expired. Please log in again.");
    if (!res.ok) throw new Error(`Server error (${res.status})`);

    const books = await res.json();
    if (!books.length) return alert(`No available books found for "${title}".`);

    await generateBookPdfDirectly(books);

  } catch (err) {
    console.error("[Book QR by Name]", err);
    alert("Failed to search books. Please try again.");
  }
}

async function MakeQRByBooksAll() {
  const token = localStorage.getItem("access_token");
  if (!token) return alert("Not authenticated. Please log in again.");

  try {
    const res = await fetch(`${apiBaseUrl}/api/books_QR_generation`, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (res.status === 401) return alert("Session expired. Please log in again.");
    if (!res.ok) throw new Error(`Server error (${res.status})`);

    const books = await res.json();
    if (!books.length) return alert("No books found.");

    await generateBookPdfDirectly(books);

  } catch (err) {
    console.error("[Book QR All]", err);
    alert("Could not generate QR cards. Please try again.");
  }
}

// ─── Accent colours ───────────────────────────────────────────────────────────
const BOOK_ACCENT_COLORS = [
  { bar: "#6c63f5", prnBg: "#eeedfe", prnTxt: "#534ab7" },
  { bar: "#1d9e75", prnBg: "#e1f5ee", prnTxt: "#0f6e56" },
  { bar: "#d85a30", prnBg: "#faece7", prnTxt: "#993c1d" },
  { bar: "#378add", prnBg: "#e6f1fb", prnTxt: "#185fa5" },
];

// ─── QR data URL helper ───────────────────────────────────────────────────────
async function generateBookQrDataUrl(text) {
  const canvas = document.createElement("canvas");
  await QRCode.toCanvas(canvas, text, { width: 160, margin: 1 });
  return canvas.toDataURL("image/png");
}

// ─── Main PDF generator ───────────────────────────────────────────────────────
async function generateBookPdfDirectly(books) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

  const qrDataUrls = await Promise.all(
    books.map(b => generateBookQrDataUrl(String(b.Accession_number)))
  );

  const CARD_W = 85.6;
  const CARD_H = 54.0;

  const PAGE_W = 210;
  const PAGE_H = 297;
  const COLS = 2;
  const ROWS = 5;
  const CARDS_PER_PAGE = COLS * ROWS;

  const GAP_X = 5;
  const GAP_Y = 4;

  const TOTAL_GRID_W = COLS * CARD_W + (COLS - 1) * GAP_X;
  const TOTAL_GRID_H = ROWS * CARD_H + (ROWS - 1) * GAP_Y;
  const MARGIN_X = (PAGE_W - TOTAL_GRID_W) / 2;
  const MARGIN_Y = (PAGE_H - TOTAL_GRID_H) / 2;

  for (let i = 0; i < books.length; i++) {
    if (i > 0 && i % CARDS_PER_PAGE === 0) doc.addPage();

    const posOnPage = i % CARDS_PER_PAGE;
    const col = posOnPage % COLS;
    const row = Math.floor(posOnPage / COLS);

    const CX = MARGIN_X + col * (CARD_W + GAP_X);
    const CY = MARGIN_Y + row * (CARD_H + GAP_Y);

    const book = books[i];

    drawBookIdCard(doc, {
      CX, CY,
      CW: CARD_W,
      CH: CARD_H,
      qrImg: qrDataUrls[i],
      accession: String(book.Accession_number),
      title: book.Title || "N/A",
      rackLocation: book.rack_location || "N/A",
      selfLocation: book.self_location || "N/A",
      copyNumber: String(book.Copy_Number ?? "N/A"),
      totalCopy: String(book.Total_Copy ?? "N/A"),
      colorIndex: i,
    });
  }

  doc.save(`books_qr_${Date.now()}.pdf`);
}

// ─── Draw a single Book ID card ───────────────────────────────────────────────
function drawBookIdCard(doc, { CX, CY, CW, CH, qrImg, accession, title, rackLocation, selfLocation, copyNumber, totalCopy, colorIndex }) {
  const color = BOOK_ACCENT_COLORS[colorIndex % BOOK_ACCENT_COLORS.length];
  const ACCENT_W = 3.5;

  const QR_SIZE = 28;
  const QR_BOX_W = QR_SIZE + 6;
  const QR_BOX_H = QR_SIZE + 6;
  const QR_BOX_X = CX + ACCENT_W + 3;
  const QR_BOX_Y = CY + (CH - QR_BOX_H) / 2;
  const QR_X = QR_BOX_X + 3;
  const QR_Y = QR_BOX_Y + 3;

  const IX = QR_BOX_X + QR_BOX_W + 5;
  const INFO_W = CX + CW - IX - 3;

  // ── Card background ──
  doc.setFillColor(252, 251, 249);
  doc.roundedRect(CX, CY, CW, CH, 3, 3, "F");

  // ── Accent bar ──
  const [r, g, b] = hexToRgb(color.bar);
  doc.setFillColor(r, g, b);
  doc.roundedRect(CX, CY, ACCENT_W, CH, 3, 0, "F");
  doc.rect(CX + 2, CY, ACCENT_W - 2, CH, "F");

  // ── QR box ──
  doc.setFillColor(243, 242, 238);
  doc.roundedRect(QR_BOX_X, QR_BOX_Y, QR_BOX_W, QR_BOX_H, 3, 3, "F");
  if (qrImg) doc.addImage(qrImg, "PNG", QR_X, QR_Y, QR_SIZE, QR_SIZE);

  // ── Accession badge below QR ──
  const TAG_W = QR_BOX_W - 4;
  const TAG_H = 5;
  const TAG_X = QR_BOX_X + 2;
  const TAG_Y = QR_BOX_Y + QR_BOX_H + 1.5;

  if (TAG_Y + TAG_H < CY + CH - 2) {
    const [bgR, bgG, bgB] = hexToRgb(color.prnBg);
    doc.setFillColor(bgR, bgG, bgB);
    doc.roundedRect(TAG_X, TAG_Y, TAG_W, TAG_H, 2, 2, "F");

    const [tR, tG, tB] = hexToRgb(color.prnTxt);
    doc.setTextColor(tR, tG, tB);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.text(`${accession}`, TAG_X + TAG_W / 2, TAG_Y + 3.3, { align: "center" });
  }

  // ── Eyebrow ──
  let iy = CY + 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(160, 158, 150);
  doc.text("BOOK ID CARD", IX, iy);
  iy += 5.5;

  // ── Title (2 lines max) ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(28, 28, 26);
  const titleLines = doc.splitTextToSize(title, INFO_W);
  doc.text(titleLines.slice(0, 2), IX, iy);
  iy += titleLines.length === 1 ? 7 : 12;

  // ── Meta fields: 2-column grid ──
  // Row 0: RACK LOC | SHELF LOC
  // Row 1: COPY NO  | TOTAL COPIES
  const fields = [
    ["RACK LOC",      rackLocation],
    ["SHELF LOC",     selfLocation],
    ["COPY NO",       copyNumber],
    ["TOTAL COPIES",  totalCopy],
  ];

  const COL2_X = IX + INFO_W / 2;
  const colW = INFO_W / 2 - 3;

  doc.setFontSize(6.5);
  fields.forEach(([k, v], fi) => {
    const fx = fi % 2 === 0 ? IX : COL2_X;
    const fy = iy + Math.floor(fi / 2) * 10;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(155, 153, 145);
    doc.text(k, fx, fy);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(48, 48, 44);
    const valLines = doc.splitTextToSize(String(v), colW);
    doc.text(valLines[0], fx, fy + 4.5);
  });

  // ── Footer divider ──
  const lineY = CY + CH - 8;
  doc.setDrawColor(225, 223, 218);
  doc.setLineWidth(0.25);
  doc.line(IX, lineY, CX + CW - 3, lineY);

  // ── Footer text ──
  doc.setFontSize(5.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(175, 173, 165);
  doc.text("Library Management System", IX, lineY + 4);

  // ── Cut guides ──
  doc.setDrawColor(200, 198, 194);
  doc.setLineWidth(0.2);
  const CK = 2;
  doc.line(CX,          CY,          CX + CK,      CY         );
  doc.line(CX,          CY,          CX,            CY + CK    );
  doc.line(CX + CW - CK, CY,         CX + CW,       CY         );
  doc.line(CX + CW,     CY,          CX + CW,       CY + CK    );
  doc.line(CX,          CY + CH - CK, CX,           CY + CH    );
  doc.line(CX,          CY + CH,     CX + CK,       CY + CH    );
  doc.line(CX + CW - CK, CY + CH,    CX + CW,       CY + CH    );
  doc.line(CX + CW,     CY + CH - CK, CX + CW,      CY + CH    );

  // ── Card border ──
  doc.setDrawColor(215, 213, 208);
  doc.setLineWidth(0.25);
  doc.roundedRect(CX, CY, CW, CH, 3, 3);
}