// Generate CSRF token
function generateCSRFToken() {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

// Store CSRF token in session storage
function setCSRFToken() {
    if (!sessionStorage.getItem('csrf_token')) {
        sessionStorage.setItem('csrf_token', generateCSRFToken());
    }
    return sessionStorage.getItem('csrf_token');
}

// Form validation
function validateForm(formData) {
    const name = formData.get('name');
    const email = formData.get('email');
    const subject = formData.get('subject');
    const message = formData.get('message');
    const honeypot = formData.get('website_url');

    // Check honeypot
    if (honeypot) {
        return { valid: false, error: 'Bot detected' };
    }

    // Validate name (letters and spaces only)
    if (!/^[A-Za-z\s]{2,50}$/.test(name)) {
        return { valid: false, error: 'Please enter a valid name (2-50 characters, letters only)' };
    }

    // Validate email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { valid: false, error: 'Please enter a valid email address' };
    }

    // Validate subject
    if (subject.length < 3 || subject.length > 100) {
        return { valid: false, error: 'Subject must be between 3 and 100 characters' };
    }

    // Validate message
    if (message.length < 10 || message.length > 1000) {
        return { valid: false, error: 'Message must be between 10 and 1000 characters' };
    }

    return { valid: true };
}

// Handle form submission
document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('.php-email-form');
    const csrfToken = setCSRFToken();
    
    // Set CSRF token in form
    const csrfInput = document.querySelector('input[name="csrf_token"]');
    if (csrfInput) {
        csrfInput.value = csrfToken;
    }

    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();

            const formData = new FormData(form);
            const loadingDiv = form.querySelector('.loading');
            const errorDiv = form.querySelector('.error-message');
            const sentDiv = form.querySelector('.sent-message');

            // Hide all message divs
            loadingDiv.style.display = 'block';
            errorDiv.style.display = 'none';
            sentDiv.style.display = 'none';

            // Validate form
            const validation = validateForm(formData);
            if (!validation.valid) {
                loadingDiv.style.display = 'none';
                errorDiv.textContent = validation.error;
                errorDiv.style.display = 'block';
                return;
            }

            try {
                // Convert FormData to JSON
                const formJson = Object.fromEntries(formData.entries());

                // Send data to serverless function
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': csrfToken
                    },
                    body: JSON.stringify(formJson),
                    credentials: 'include'
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.error || 'Failed to send message');
                }

                // Show success message
                loadingDiv.style.display = 'none';
                sentDiv.style.display = 'block';
                form.reset();

            } catch (error) {
                console.error('Error:', error);
                loadingDiv.style.display = 'none';
                errorDiv.textContent = error.message || 'An error occurred. Please try again later.';
                errorDiv.style.display = 'block';
            }
        });
    }
});