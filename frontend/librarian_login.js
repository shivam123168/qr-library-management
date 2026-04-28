 const apiBaseUrl = `https://qr-library-management-production.up.railway.app`;
(function() {
    'use strict';

    const form = document.getElementById('loginForm');
    const employeeIdInput = document.getElementById('employeeId');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('togglePassword');

    // ⚠️ Make sure you ADD this div in HTML if not present
    // <div id="message" class="msg"></div>
    const msgDiv = document.getElementById('message');

   

    function showMessage(message, type = "error") {
        if (!msgDiv) return;

        msgDiv.className = `msg ${type}`;
        msgDiv.innerHTML = message;
        msgDiv.style.display = "flex";
    }

    function clearMessage() {
        if (!msgDiv) return;
        msgDiv.style.display = 'none';
        msgDiv.innerHTML = '';
        msgDiv.classList.remove('error', 'success');
    }

    // 👁 Toggle password
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;

            const icon = togglePassword.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-eye');
                icon.classList.toggle('fa-eye-slash');
            }
        });
    }

    // Clear error on typing
    employeeIdInput.addEventListener('input', clearMessage);
    passwordInput.addEventListener('input', clearMessage);

    // 🚀 Form Submit
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        clearMessage();

        const emp_id = employeeIdInput.value.trim();
        const password = passwordInput.value;

        if (!emp_id || !password) {
            showMessage('<i class="fas fa-circle-exclamation"></i> Please fill all fields.');
            return;
        }

        try {
            const response = await fetch(`${apiBaseUrl}/api/auth/login/librarian`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    emp_id: emp_id,
                    password: password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || "Login failed");
            }

            // ✅ STORE TOKEN + USER INFO IN LOCALSTORAGE
            localStorage.setItem("access_token", data.access_token);
            localStorage.setItem("token_type", data.token_type);
            localStorage.setItem("name", data.name);

            showMessage(
                `<i class="fas fa-check-circle"></i> Welcome ${data.name}!`,
                "success"
            );

            // 🔁 Redirect after success
            setTimeout(() => {
                window.location.href = "librarian_dashboard.html";
            }, 1500);

        } catch (error) {
            showMessage(
                `<i class="fas fa-circle-exclamation"></i> ${error.message}`,
                "error"
            );
        }
    });

})();
