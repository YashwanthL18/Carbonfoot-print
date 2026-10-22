// Handles register and login forms on the frontend.
// Expects backend endpoints: POST /api/register and POST /api/login

const API_URL = 'http://127.0.0.1:5000';

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                password: document.getElementById('password').value,
            };

            try {
                const res = await fetch(`${API_URL}/api/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                });

                const data = await res.json();
                if (res.ok && data.success) {
                    // Redirect to login after successful registration
                    window.location.href = 'login.html';
                } else {
                    alert(data.message || 'Registration failed');
                }

            } catch (err) {
                console.error('Register error', err);
                alert('Could not register. See console for details.');
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = {
                email: document.getElementById('email').value,
                password: document.getElementById('password').value,
            };

            try {
                const res = await fetch(`${API_URL}/api/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(formData),
                });

                const data = await res.json();
                if (res.ok && data.success) {
                    // A real app would set a secure session cookie or token
                    sessionStorage.setItem('user', JSON.stringify({ email: formData.email }));
                    // Redirect to home (which will show calculator for logged-in users)
                    window.location.href = '/';
                } else {
                    alert(data.message || 'Login failed');
                }

            } catch (err) {
                console.error('Login error', err);
                alert('Could not login. See console for details.');
            }
        });
    }
});