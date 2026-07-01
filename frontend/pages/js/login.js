// Wait for the HTML document to be fully loaded and parsed before running the script
document.addEventListener("DOMContentLoaded", () => {

    // Select the login button element from the DOM using its ID
    const loginBtn =
        document.getElementById("loginBtn");

    // Add a click event listener to the login button, making the callback function asynchronous
    loginBtn.addEventListener("click", async (e) => {

        // Prevent the default form submission behavior (which would reload the page)
        e.preventDefault();

        // Get the value typed into the Email or Phone input field and remove extra whitespace
        const emailOrPhone =
            document.getElementById("emailOrPhone").value.trim();

        // Get the value typed into the password input field and remove extra whitespace
        const password =
            document.getElementById("password").value.trim();

        // --- VALIDATION START ---

        // Define a regular expression pattern for standard email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        // Define a regular expression pattern for a standard 10-digit phone number
        const phoneRegex = /^\d{10}$/;

        // Check if either the email/phone field or the password field is left completely empty
        if (!emailOrPhone || !password) {
            // Alert the user that all fields are mandatory
            alert("Please fill in all fields before submitting.");
            // Stop further execution of the function so the fetch request doesn't run
            return;
            // Close the empty field check
        }

        // Test the user input against the email regular expression, returning true or false
        const isValidEmail = emailRegex.test(emailOrPhone);

        // Test the user input against the phone regular expression, returning true or false
        const isValidPhone = phoneRegex.test(emailOrPhone);

        // Check if the input failed both the email format check and the phone format check
        if (!isValidEmail && !isValidPhone) {
            // Alert the user to enter a correctly formatted email or a 10-digit number
            alert("Please enter a valid email address or a 10-digit phone number.");
            // Stop further execution of the function
            return;
            // Close the email/phone format check
        }

        // Check if the provided password is shorter than 6 characters
        if (password.length < 6) {
            // Alert the user that the password does not meet the minimum length requirement
            alert("Password must be at least 6 characters long.");
            // Stop further execution of the function
            return;
            // Close the password length check
        }

        // --- VALIDATION END ---

        // Add visual feedback to the button during the server request
        const originalText = loginBtn.innerText;
        // Change button text to show loading state
        loginBtn.innerText = "Processing...";
        // Temporarily disable the button to prevent multiple rapid clicks
        loginBtn.disabled = true;

        // Start a try block to handle potential network or server errors gracefully
     // Start a try block to handle potential network or server errors gracefully
        try {
            const response = await fetch("http://localhost:5000/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                // FIX 1: Map your variable (emailOrPhone) to the key the backend wants (identifier)
                body: JSON.stringify({ identifier: emailOrPhone, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Save the token to local storage
                localStorage.setItem("token", data.token);

                // THE NEW TRAFFIC COP LOGIC:
                if (data.role === 'admin') {
                    window.location.href = "admin.html"; // Send admins to the control room
                } else {
                    window.location.href = "index.html"; // Send regular users to the storefront
                }
            } else {
                alert(data.message); // Show error (e.g., wrong password)
            }
        } catch (error) {
            console.error("Error:", error);
        }

        // Use a finally block to ensure the button is always restored regardless of success or failure
        finally {
            // Restore the original text to the button
            loginBtn.innerText = originalText;
            // Re-enable the button so the user can try again if needed
            loginBtn.disabled = false;
            // Close the finally block
        }

        // Close the click event listener callback function
    });

    // Close the DOMContentLoaded event listener callback function
});