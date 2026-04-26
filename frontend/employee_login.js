 const apiBaseUrl = `http://${window.location.hostname}:8000`;

(function () {
    'use strict';

    const form = document.getElementById('loginForm');
    const employeeIdInput = document.getElementById('employeeId');
    const passwordInput = document.getElementById('password');
    const msgDiv = document.getElementById('message');
    const togglePassword = document.getElementById('togglePassword');

    function showMessage(type, message) {
        msgDiv.className = 'msg ' + type;
        msgDiv.innerHTML = message;
        msgDiv.style.display = 'flex';
    }

    function clearMessage() {
        msgDiv.style.display = 'none';
        msgDiv.innerHTML = '';
        msgDiv.classList.remove('error', 'success');
    }

    // 👁 Toggle password visibility
    togglePassword.addEventListener('click', function () {
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;

        const icon = togglePassword.querySelector('i');
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
    });

    // Clear message on typing
    employeeIdInput.addEventListener('input', clearMessage);
    passwordInput.addEventListener('input', clearMessage);

    // 🚀 Form Submit
    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        clearMessage();

        const employeeId = employeeIdInput.value.trim();
        const password = passwordInput.value;

        let errors = [];

        // ✅ Employee ID validation
        if (!employeeId) {
            errors.push("Employee ID is required.");
        } 
        else if (!/^[A-Za-z0-9]+$/.test(employeeId)) {
            errors.push("Employee ID must be alphanumeric only.");
        } 
        else if (employeeId.length < 3) {
            errors.push("Employee ID must be at least 3 characters.");
        }

        // ✅ Password validation
        if (!password) {
            errors.push("Password is required.");
        } 
        else if (password.length < 4) {
            errors.push("Password must be at least 4 characters.");
        }

        // If validation fails
        if (errors.length > 0) {
            let html = '';
            errors.forEach(err => {
                html += `<i class="fas fa-circle-exclamation"></i> ${err}<br>`;
            });
            showMessage('error', html);
            return;
        }

        try {
            const response = await fetch(`${apiBaseUrl}/api/auth/login/employee`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    emp_id: employeeId,
                    password: password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                showMessage(
                    'error',
                    `<i class="fas fa-circle-exclamation"></i> 
                     ${data.detail || "Invalid Employee ID or password"}`
                );
                return;
            }

            // ✅ Store token & user info (NOT password)
            localStorage.setItem("access_token", data.access_token);
            localStorage.setItem("token_type", data.token_type);
            localStorage.setItem("user_type", data.user_type);
            localStorage.setItem("user_id", data.user_id);
            localStorage.setItem("name", data.name);

            showMessage(
                'success',
                `<i class="fas fa-check-circle"></i> Login successful! Redirecting...`
            );

            // ✅ Redirect after login
            setTimeout(() => {
                window.location.href = "employee-page.html";
            }, 1500);

        } catch (error) {
            console.error("Login error:", error);
            showMessage(
                'error',
                `<i class="fas fa-circle-exclamation"></i> 
                 Server error. Please try again.`
            );
        }
    });

})();