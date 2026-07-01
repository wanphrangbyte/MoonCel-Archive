document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("token");
    
    // Kick them out if they aren't logged in
    if (!token) {
        window.location.href = "login.html";
        return;
    }

    const historyContainer = document.getElementById("order-history-container");

    try {
        // Fetch the user's history from your backend
        const response = await fetch("http://localhost:5000/user-history", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error("Failed to load records");

        const orders = await response.json();

        // If they haven't bought anything yet
        if (orders.length === 0) {
            historyContainer.innerHTML = "<p class='text-gray-400 text-center py-6'>No past summons found in the archive.</p>";
            return;
        }

        // Build the HTML for each order
        let historyHtml = "";
        orders.forEach(order => {
            const orderDate = new Date(order.created_at).toLocaleDateString();
            
            historyHtml += `
                <div class="bg-black/60 p-5 rounded-xl border border-gray-700 flex justify-between items-center hover:border-[#ff4d6d] transition-colors">
                    <div>
                        <p class="text-sm text-gray-400 mb-1">Receipt ID: <span class="text-white font-mono">${order.razorpay_order_id}</span></p>
                        <p class="text-xs text-gray-500"><i class="far fa-calendar-alt mr-1"></i> ${orderDate}</p>
                    </div>
                    <div>
                        <span class="bg-green-900/50 text-green-400 text-xs font-bold px-3 py-1.5 rounded border border-green-500 uppercase tracking-wider shadow-[0_0_10px_rgba(34,197,94,0.2)]">
                            ${order.status}
                        </span>
                    </div>
                </div>
            `;
        });

        historyContainer.innerHTML = historyHtml;

    } catch (error) {
        console.error("Dashboard Error:", error);
        historyContainer.innerHTML = "<p class='text-red-500 text-center py-6'>Error connecting to Chaldea servers.</p>";
    }
});

// Simple logout function
function logout() {
    localStorage.removeItem("token");
    window.location.href = "login.html";
}