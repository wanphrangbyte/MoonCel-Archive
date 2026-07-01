document.addEventListener("DOMContentLoaded", () => {
            const form = document.getElementById('registrationForm');
            const phoneInput = document.getElementById('phone');
            const countrySelect = document.getElementById('countryCode');
            
            // Input Elements mapping
            const inputs = {
                name: { el: document.getElementById('username'), warning: document.getElementById('nameWarning') },
                email: { el: document.getElementById('email'), warning: document.getElementById('emailWarning') },
                phone: { el: phoneInput, warning: document.getElementById('phoneWarning') },
                password: { el: document.getElementById('password'), warning: document.getElementById('passwordWarning') }
            };

            // Common Domains for Typo Checking
            const commonDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com'];

            // Calculate Levenshtein distance for string typo detection
            function getEditDistance(a, b) {
                if(a.length === 0) return b.length; 
                if(b.length === 0) return a.length; 
                let matrix = [];
                for(let i = 0; i <= b.length; i++) { matrix[i] = [i]; }
                for(let j = 0; j <= a.length; j++) { matrix[0][j] = j; }
                for(let i = 1; i <= b.length; i++) {
                    for(let j = 1; j <= a.length; j++) {
                        if(b.charAt(i-1) == a.charAt(j-1)) {
                            matrix[i][j] = matrix[i-1][j-1];
                        } else {
                            matrix[i][j] = Math.min(matrix[i-1][j-1] + 1, Math.min(matrix[i][j-1] + 1, matrix[i-1][j] + 1));
                        }
                    }
                }
                return matrix[b.length][a.length];
            }

            /* */
            const showWarning = (inputKey, message, isSuggestion = false, suggestedValue = "") => {
                const obj = inputs[inputKey];
                obj.el.classList.add('error');
                obj.warning.textContent = message;
                
                if (isSuggestion) {
                    obj.warning.classList.add('suggestion');
                    // Setup click to autocorrect
                    obj.warning.onclick = function() {
                        obj.el.value = suggestedValue;
                        hideWarning(inputKey);
                        obj.warning.onclick = null; // remove listener
                    };
                } else {
                    obj.warning.classList.remove('suggestion');
                    obj.warning.onclick = null;
                }
                
                obj.warning.classList.add('show');
            };

            const hideWarning = (inputKey) => {
                const obj = inputs[inputKey];
                obj.el.classList.remove('error');
                obj.warning.classList.remove('show');
                obj.warning.classList.remove('suggestion');
            };

            /* */
            
            // 1. Phone Input specific logic (Restrict length and numbers only)
            const updatePhonePlaceholder = () => {
                const maxLen = parseInt(countrySelect.options[countrySelect.selectedIndex].dataset.len);
                phoneInput.placeholder = `PHONE: (${maxLen} Digits)`;
            };
            
            countrySelect.addEventListener('change', () => {
                updatePhonePlaceholder();
                phoneInput.value = ""; // Clear on country change to prevent invalid states
                hideWarning('phone');
            });

            phoneInput.addEventListener('input', function() {
                // Remove non-digits immediately
                this.value = this.value.replace(/\D/g, '');
                
                // Enforce max length dynamically based on country selection
                const maxLen = parseInt(countrySelect.options[countrySelect.selectedIndex].dataset.len);
                if (this.value.length > maxLen) {
                    this.value = this.value.slice(0, maxLen);
                }
                hideWarning('phone');
            });

            // 2. Blur Events for all inputs (Advanced warnings on leaving field)
            Object.keys(inputs).forEach(key => {
                inputs[key].el.addEventListener('input', () => hideWarning(key));

                inputs[key].el.addEventListener('blur', () => {
                    const val = inputs[key].el.value.trim();
                    
                    if (val === '') {
                        showWarning(key, `${key.charAt(0).toUpperCase() + key.slice(1)} is required`);
                        return;
                    }

                    // Format Specific Checks
                    if (key === 'name' && val.length < 3) {
                        showWarning('name', 'Name must be at least 3 letters');
                    }
                    
                    if (key === 'email') {
                        const parts = val.split('@');
                        if (parts.length !== 2 || parts[1] === '') {
                            showWarning('email', 'Invalid email format (needs @)');
                        } else {
                            // Check for typos in domain (e.g. gmai.com -> gmail.com)
                            const domain = parts[1].toLowerCase();
                            let foundTypo = false;
                            
                            if (!commonDomains.includes(domain)) {
                                for(let d of commonDomains) {
                                    // If distance is 1 or 2, it's likely a typo
                                    if(getEditDistance(domain, d) <= 2) {
                                        const suggestion = `${parts[0]}@${d}`;
                                        showWarning('email', `Did you mean ${suggestion}? Click to fix.`, true, suggestion);
                                        foundTypo = true;
                                        break;
                                    }
                                }
                            }
                            if (!foundTypo && !domain.includes('.')) {
                                showWarning('email', 'Email domain is incomplete');
                            }
                        }
                    }

                    if (key === 'phone') {
                        const reqLen = parseInt(countrySelect.options[countrySelect.selectedIndex].dataset.len);
                        if (val.length < reqLen) {
                            showWarning('phone', `Requires exactly ${reqLen} digits`);
                        }
                    }

                    if (key === 'password') {
                        // Regex: At least 8 chars, 1 uppercase, 1 number
                        const passValid = /^(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\W_]{8,}$/.test(val);
                        if (!passValid) {
                            showWarning('password', 'Needs 8+ chars, 1 Uppercase, 1 Number');
                        }
                    }
                });
            });

            /* */
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                let isValid = true;

                // Force blur to trigger format validations
                Object.keys(inputs).forEach(key => {
                    inputs[key].el.focus();
                    inputs[key].el.blur();
                    // If any warning is showing and it's NOT a suggestion, it's invalid
                    if (inputs[key].warning.classList.contains('show') && !inputs[key].warning.classList.contains('suggestion')) {
                        isValid = false;
                    }
                });

                if (isValid) {
                    const btn = document.getElementById('registerBtn');
                    btn.textContent = "INITIALIZING...";
                    btn.style.background = "linear-gradient(135deg, #166534 0%, #14532d 100%)";
                    btn.style.borderColor = "#4ade80";
                    btn.style.boxShadow = "0 6px 20px rgba(74, 222, 128, 0.4)";
                    
                    // Grab the actual values from your form inputs
                    const username = document.getElementById('username').value;
                    const email = document.getElementById('email').value;
                    const phone = document.getElementById('phone').value;
                    const password = document.getElementById('password').value;

                    try {
                        // Send the request to your backend register route
                        const response = await fetch("http://localhost:5000/register", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                username,
                                email,
                                phone,
                                password
                            })
                        });

                        const data = await response.json();

                        if (response.ok) {
                            btn.textContent = "SUCCESS";
                            
                            // Redirect the user to the login page after a short delay
                            setTimeout(() => {
                                window.location.href = "../html/login.html";
                            }, 500); 
                            
                        } else {
                            alert("Registration failed: " + (data.message || "Unknown error"));
                            // Reset button so they can try again
                            btn.textContent = "INITIALIZE ACCOUNT"; 
                            btn.style.background = ""; 
                            btn.style.borderColor = "";
                            btn.style.boxShadow = "";
                        }
                        
                    } catch (error) {
                        console.error("Error during registration:", error);
                        alert("Server connection failed. Please try again.");
                        btn.textContent = "INITIALIZE ACCOUNT";
                        btn.style.background = ""; 
                        btn.style.borderColor = "";
                        btn.style.boxShadow = "";
                    }
                }
            });
});