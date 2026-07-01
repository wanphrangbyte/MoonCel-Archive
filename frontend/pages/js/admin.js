const API_URL = "http://localhost:5000";

// Global variable to hold archive data for the edit modal
let adminProductData = [];

// --- SECURITY CHECK & INITIALIZE ---
window.onload = () => {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("Unauthorized. Master Command clearance required.");
        window.location.href = "login.html"; // Redirect to login
    } else {
        loadAdminInventory();
        loadUsers();
    }
};

// --- 1. ADD NEW PRODUCT (WITH FRONT & BACK IMAGE UPLOAD) ---
document.getElementById("addProductForm").addEventListener("submit", async (e) => {
    e.preventDefault(); 
    
    const token = localStorage.getItem("token");
    const messageEl = document.getElementById("addMessage");
    
    // Because we added 'name' attributes to all inputs in admin.html, 
    // FormData automatically packages the text, sizes, lore, AND both images for us!
    const form = e.target;
    const formData = new FormData(form);

    try {
        const response = await fetch(`${API_URL}/products`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`
                // CRITICAL: Do NOT set "Content-Type" here. Browser handles multipart/form-data.
            },
            body: formData
        });

        const data = await response.json();

        messageEl.classList.remove("hidden");
        if (response.ok) {
            messageEl.textContent = data.message || "Relic successfully added!";
            messageEl.className = "text-sm mt-3 text-center text-green-400";
            form.reset(); 
            loadAdminInventory(); // Refresh table instantly
        } else {
            messageEl.textContent = data.message || "Failed to add relic.";
            messageEl.className = "text-sm mt-3 text-center text-red-500";
        }
    } catch (error) {
        console.error("Error:", error);
        alert("A critical system error occurred.");
    }
});

// --- 2. LOAD LIVE INVENTORY ---
async function loadAdminInventory() {
    try {
        const response = await fetch(`${API_URL}/products`);
        const products = await response.json();
        
        // Save the data globally so our Edit Modal can read it
        adminProductData = products; 
        
        const tableBody = document.getElementById("adminProductTableBody");
        tableBody.innerHTML = ""; 
        
        products.forEach(item => {
            const row = document.createElement("tr");
            row.className = "border-b border-gray-800 hover:bg-gray-800/50 transition group";
            
            const imageUrl = item.image_url ? `${API_URL}${item.image_url}` : '';

            row.innerHTML = `
                <td class="p-3 text-red-400 font-bold">#${item.id}</td>
                <td class="p-3">
                    ${item.image_url 
                        ? `<img src="${imageUrl}" class="w-12 h-12 object-cover rounded border border-gray-600">` 
                        : `<div class="w-12 h-12 bg-gray-800 rounded border border-gray-600 flex items-center justify-center text-xs text-gray-500">NULL</div>`
                    }
                </td>
                <td class="p-3 font-medium">${item.name}</td>
                <td class="p-3 uppercase text-xs tracking-wider text-gray-400">${item.category}</td>
                <td class="p-3 font-bold">₹${item.price}</td>
                <td class="p-3">${item.stock_quantity}</td>
                <td class="p-3 text-right opacity-50 group-hover:opacity-100 transition-opacity">
                    <button onclick="editProduct(${item.id})" class="text-gray-400 hover:text-blue-400 transition-colors p-2 mr-2">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteProduct(${item.id})" class="text-gray-500 hover:text-red-500 transition-colors p-2">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error("Failed to load inventory:", error);
        document.getElementById("adminProductTableBody").innerHTML = `
            <tr><td colspan="7" class="text-center p-4 text-red-500">Critical Error: Failed to sync with the database.</td></tr>
        `;
    }
}

// --- 3. DELETE PRODUCT ---
async function deleteProduct(productId) {
    if (!confirm("Confirm permanent deletion of relic #" + productId + "?")) return;
    
    const token = localStorage.getItem("token");
    try {
        const res = await fetch(`${API_URL}/products/${productId}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (res.ok) {
            loadAdminInventory();
        } else {
            alert(data.message || "Deletion failed.");
        }
    } catch (err) {
        console.error("Delete failed:", err);
        alert("A critical system error occurred.");
    }
}

// --- 4. FULL EDIT MODAL LOGIC ---
function editProduct(id) {
    const product = adminProductData.find(p => p.id === id);
    if (!product) return alert("Error locating product data.");

    document.getElementById('edit-id').value = product.id;
    document.getElementById('edit-name').value = product.name;
    document.getElementById('edit-price').value = product.price;
    document.getElementById('edit-desc').value = product.description || '';
    
    const sizeInput = document.getElementById('edit-sizes');
    sizeInput.value = product.available_sizes || '';

    // Lock the size input for posters and relics
    if (product.category === 'poster' || product.category === 'relic') {
        sizeInput.value = 'N/A';
        sizeInput.disabled = true;
        sizeInput.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
        sizeInput.disabled = false;
        sizeInput.classList.remove('opacity-50', 'cursor-not-allowed');
    }

    const modal = document.getElementById('admin-edit-modal');
    const content = document.getElementById('admin-edit-content');
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        content.classList.remove('scale-95');
    }, 10);
}

function closeEditModal() {
    const modal = document.getElementById('admin-edit-modal');
    const content = document.getElementById('admin-edit-content');
    modal.classList.add('opacity-0');
    content.classList.add('scale-95');
    setTimeout(() => modal.classList.add('hidden'), 300);
}

document.getElementById('admin-edit-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const token = localStorage.getItem("token");
    const id = document.getElementById('edit-id').value;
    const updatedData = {
        name: document.getElementById('edit-name').value,
        price: document.getElementById('edit-price').value,
        available_sizes: document.getElementById('edit-sizes').value,
        description: document.getElementById('edit-desc').value
    };

    try {
        const response = await fetch(`${API_URL}/products/${id}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(updatedData)
        });

        const data = await response.json();

        if (response.ok) {
            closeEditModal();
            loadAdminInventory(); // Instantly refresh the table!
        } else {
            alert("Error: " + data.message);
        }
    } catch (error) {
        console.error("Failed to save edits:", error);
    }
});

// --- 5. USER MANAGEMENT LOGIC ---
async function loadUsers() {
    try {
        const response = await fetch(`${API_URL}/users`);
        const users = await response.json();
        
        const userList = document.getElementById('admin-user-list');
        userList.innerHTML = '';

        users.forEach(user => {
            const isBlocked = user.status === 'blocked';
            const statusColor = isBlocked ? 'text-red-500' : 'text-green-400';
            const actionText = isBlocked ? 'UNBLOCK' : 'BLOCK (FORCE LOGOUT)';
            const actionColor = isBlocked ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-900/50 hover:bg-red-600 text-red-500 hover:text-white border border-red-700';
            const newStatus = isBlocked ? 'active' : 'blocked';

            userList.innerHTML += `
                <tr class="hover:bg-white/5 transition-colors group border-b border-gray-800">
                    <td class="p-3 text-gray-500">#${user.id}</td>
                    <td class="p-3 font-medium">${user.email}</td>
                    <td class="p-3 font-bold ${statusColor} uppercase text-xs tracking-wider">${user.status || 'active'}</td>
                    <td class="p-3 text-right">
                        <button onclick="toggleUser(${user.id}, '${newStatus}')" class="px-3 py-1 rounded text-xs font-bold transition-colors ${actionColor}">
                            ${actionText}
                        </button>
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        console.error("Failed to load users:", error);
    }
}

async function toggleUser(id, newStatus) {
    // Show confirmation box
    if (!confirm(`Confirm change to ${newStatus.toUpperCase()}?`)) return;

    try {
        // Send status update to server
        const response = await fetch(`${API_URL}/users/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        
        // If server update is success
        if (response.ok) {
            alert("Protocol updated successfully.");
            // Refresh the user list
            loadUsers(); 
        } else {
            const err = await response.json().catch(() => ({}));
            alert(err.message || "Failed to update status.");
        }
    } catch (error) {
        console.error("Failed to update status:", error);
        alert("A network error occurred while updating user status.");
    }
}

// --- 6. UPDATE PRODUCT PRICE (LEGACY OVERRIDE PANEL) ---
document.getElementById("updatePriceForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    const messageEl = document.getElementById("updateMessage");
    const productId = document.getElementById("updateId").value;
    const newPrice = document.getElementById("updateNewPrice").value;

    try {
        const response = await fetch(`${API_URL}/products/${productId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            // Since our backend expects full details, we pass existing details with just the new price
            body: JSON.stringify({ 
                price: newPrice,
                // Passing placeholders for the rest to satisfy the SQL query in the backend if needed
                name: adminProductData.find(p => p.id == productId)?.name || 'Unknown',
                description: adminProductData.find(p => p.id == productId)?.description || '',
                available_sizes: adminProductData.find(p => p.id == productId)?.available_sizes || 'S, M, L, XL'
            })
        });

        const data = await response.json();

        messageEl.classList.remove("hidden");
        if (response.ok) {
            messageEl.textContent = "Price recalibrated!";
            messageEl.className = "text-sm mt-3 text-center text-green-400";
            document.getElementById("updatePriceForm").reset();
            loadAdminInventory();
        } else {
            messageEl.textContent = data.message;
            messageEl.className = "text-sm mt-3 text-center text-red-500";
        }
    } catch (error) {
        console.error("Error:", error);
        alert("A critical system error occurred.");
    }
});


// Force logout function
function forceLogout(message = "Your access has been revoked by the admin.") {
    localStorage.removeItem("token");
    alert(message);
    window.location.href = "login.html";
}