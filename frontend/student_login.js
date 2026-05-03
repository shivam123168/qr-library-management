   const apiBaseUrl = `http://${window.location.hostname}:8000`;
   
   (function () {
            'use strict';

            const form = document.getElementById('loginForm');
            const prnInput = document.getElementById('prn');
            const passwordInput = document.getElementById('password');
            const msgDiv = document.getElementById('message');
            const prnCounter = document.getElementById('prnCounter');
            const togglePassword = document.getElementById('togglePassword');

            function clearMessage() {
                if (!msgDiv) return;
                msgDiv.style.display = 'none';
                msgDiv.innerHTML = '';
                msgDiv.className = 'msg';
            }

            function updatePRN() {
                if (!prnInput || !prnCounter) return;
                prnInput.value = prnInput.value.replace(/\D/g, '').slice(0, 13);
                const len = prnInput.value.length;
                prnCounter.textContent = `${len}/13`;
                if (len === 13) {
                    prnCounter.classList.add('valid');
                } else {
                    prnCounter.classList.remove('valid');
                }
            }

            if (togglePassword && passwordInput) {
                togglePassword.addEventListener('click', function () {
                    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                    passwordInput.setAttribute('type', type);
                    const icon = togglePassword.querySelector('i');
                    if (icon) {
                        icon.classList.toggle('fa-eye');
                        icon.classList.toggle('fa-eye-slash');
                    }
                });
            }

            if (prnInput) {
                prnInput.addEventListener('input', function () {
                    updatePRN();
                    clearMessage();
                });

                prnInput.addEventListener('keypress', function (e) {
                    const charCode = e.which ? e.which : e.keyCode;
                    if (charCode < 48 || charCode > 57) e.preventDefault();
                });

                prnInput.addEventListener('paste', function (e) {
                    e.preventDefault();
                    const pasted = (e.clipboardData || window.clipboardData).getData('text');
                    const digits = pasted.replace(/\D/g, '').slice(0, 13);
                    prnInput.value = digits;
                    updatePRN();
                    clearMessage();
                });
            }

            if (passwordInput) {
                passwordInput.addEventListener('input', clearMessage);
            }

            window.addEventListener('DOMContentLoaded', updatePRN);

            if (form) {
                form.addEventListener('submit', async function (e) {
                    e.preventDefault();
                    clearMessage();

                    const prn = prnInput.value.trim();
                    const password = passwordInput.value.trim();

                    let errors = [];

                    if (!/^\d{13}$/.test(prn)) {
                        errors.push("PRN must be exactly 13 digits.");
                    }

                    if (password.length < 6) {
                        errors.push("Password must be at least 6 characters.");
                    }

                    if (errors.length > 0) {
                        msgDiv.className = "msg error";
                        msgDiv.innerHTML = errors.join("<br>");
                        msgDiv.style.display = "flex";
                        msgDiv.style.marginTop = "10px";
                        return;
                    }

                    try {
                        const response = await fetch(`${apiBaseUrl}/api/auth/login/student`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                prn: prn,
                                password: password
                            })
                        });

                        const data = await response.json();

                        if (response.ok) {

                            // ✅ Store token
                            localStorage.setItem("access_token", data.access_token);
                            localStorage.setItem("user_type", data.user_type);
                            localStorage.setItem("user_name", data.name);

                            msgDiv.className = "msg success";
                            msgDiv.innerHTML = "Login successful!";
                            msgDiv.style.display = "flex";

                            // ✅ Redirect after 1 second
                            setTimeout(() => {
                                window.location.href = "student-page.html";
                            }, 1000);

                        } else {
                            msgDiv.className = "msg error";
                            msgDiv.innerHTML = data.detail || "Login failed";
                            msgDiv.style.display = "flex";
                        }

                    } catch (error) {
                        msgDiv.className = "msg error";
                        msgDiv.innerHTML = "Server error. Try again.";
                        msgDiv.style.display = "flex";
                    }
                });

            }
        })();
