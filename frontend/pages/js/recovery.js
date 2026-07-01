const API_URL = "http://localhost:5000";
let userEmail = "";

// Show custom alert
function showAlert(message, isError = true) {
    const box = document.getElementById('alert-box');
    const msg = document.getElementById('alert-msg');
    
    box.style.borderColor = isError ? '#ff3333' : '#33ff88';
    msg.innerText = message;
    
    box.classList.remove('hidden');
    setTimeout(() => box.classList.remove('translate-x-full'), 10);
    
    setTimeout(() => {
        box.classList.add('translate-x-full');
        setTimeout(() => box.classList.add('hidden'), 300);
    }, 4000);
}

// Phase 1: Send the email
async function requestOTP() {
    const emailInput = document.getElementById('recovery-email').value;
    const btn = document.getElementById('req-btn');
    
    if (!emailInput) return showAlert("Email is required to summon a catalyst.");

    btn.innerText = "SUMMONING...";
    btn.disabled = true;

    try {
        const response = await fetch(`${API_URL}/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailInput })
        });

        const data = await response.json();

        if (response.ok) {
            userEmail = emailInput; // Save email for Phase 2
            showAlert("Catalyst successfully dispatched.", false);
            
            // Swap UI
            document.getElementById('request-phase').classList.add('hidden');
            document.getElementById('verify-phase').classList.remove('hidden');
            document.getElementById('status-text').innerText = `Catalyst sent to ${emailInput}`;
        } else {
            showAlert(data.message);
            btn.innerText = "Summon Catalyst (OTP)";
            btn.disabled = false;
        }
    } catch (error) {
        console.error("Error:", error);
        showAlert("Server connection failed.");
        btn.innerText = "Summon Catalyst (OTP)";
        btn.disabled = false;
    }
}

// Phase 2: Verify and Reset
async function verifyAndReset() {
    const otpInput = document.getElementById('recovery-otp').value;
    const newPassInput = document.getElementById('new-password').value;

    if (!otpInput || !newPassInput) return showAlert("Both Catalyst and New Password are required.");

    try {
        const response = await fetch(`${API_URL}/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                email: userEmail,
                otp: otpInput,
                newPassword: newPassInput
            })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert("Protocol complete. Rerouting to login...", false);
            setTimeout(() => {
                window.location.href = "login.html";
            }, 2000);
        } else {
            showAlert(data.message);
        }
    } catch (error) {
        console.error("Error:", error);
        showAlert("Server connection failed.");
    }
}