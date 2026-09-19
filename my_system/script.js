// --- 0. EMERGENCY RESET FUNCTION ---
window.clearSystemData = function() {
    localStorage.clear(); 
    alert("✅ Na-clear na ang database! Magre-reload ang page para bumalik sa simula.");
    window.location.reload();
};

// --- 1. LOCAL DATA STORAGE MANAGEMENT ---
let users = JSON.parse(localStorage.getItem('system_users'));

// Kung walang makitang users sa localstorage, i-set up ang default admin account
if (!users || users.length === 0) {
    users = [
        { email: 'admin@system.com', password: 'password123', name: 'System Administrator', role: 'admin' }
    ];
    localStorage.setItem('system_users', JSON.stringify(users));
}

let inventory = JSON.parse(localStorage.getItem('system_inventory')) || [];
let loggedInUser = JSON.parse(localStorage.getItem('active_session')) || null;

// --- 2. DOM INTERFACE ELEMENTS ---
const authSection = document.getElementById('authSection');
const loginBox = document.getElementById('loginBox');
const registerBox = document.getElementById('registerBox');
const dashboardSection = document.getElementById('dashboardSection');

const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const inventoryForm = document.getElementById('inventoryForm');

// Navigation Switches
document.getElementById('toRegister').addEventListener('click', () => { 
    loginBox.classList.add('hidden'); 
    registerBox.classList.remove('hidden'); 
});
document.getElementById('toLogin').addEventListener('click', () => { 
    registerBox.classList.add('hidden'); 
    loginBox.classList.remove('hidden'); 
});

// --- 3. REGISTRATION LOGIC ---
registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim().toLowerCase();
    const password = document.getElementById('regPassword').value; 
    const role = document.getElementById('regRole').value;

    if (users.find(u => u.email === email)) {
        alert('⚠️ Ang email na ito ay may account na!');
        return;
    }

    const newUser = { name, email, password, role };
    users.push(newUser);
    localStorage.setItem('system_users', JSON.stringify(users));
    
    alert('✅ Account created! Puwede ka nang mag-login.');
    registerForm.reset();
    
    registerBox.classList.add('hidden');
    loginBox.classList.remove('hidden');
});

// --- 4. LOGIN / LOGOUT LOGIC ---
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;

    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        loggedInUser = user;
        localStorage.setItem('active_session', JSON.stringify(loggedInUser));
        loginForm.reset();
        checkSession();
    } else {
        alert('❌ Mali ang Email o Password! Siguraduhing tama ang pagkaka-type.');
    }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
    loggedInUser = null;
    localStorage.removeItem('active_session');
    checkSession();
});

// --- 5. INVENTORY OPERATION LOGIC ---
inventoryForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (loggedInUser.role !== 'admin') return; 

    const name = document.getElementById('itemName').value;
    const qty = parseInt(document.getElementById('itemQty').value);
    const price = parseFloat(document.getElementById('itemPrice').value);

    inventory.push({ id: Date.now(), name, qty, price });
    localStorage.setItem('system_inventory', JSON.stringify(inventory));
    
    inventoryForm.reset();
    renderDashboard();
});

window.deleteItem = function(id) {
    if (loggedInUser.role !== 'admin') return;
    inventory = inventory.filter(item => item.id !== id);
    localStorage.setItem('system_inventory', JSON.stringify(inventory));
    renderDashboard();
};

// --- 6. INTERFACE VIEW RENDER & PERMISSION ENGINE ---
function checkSession() {
    if (loggedInUser) {
        authSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
        
        document.getElementById('currentUserDisplay').textContent = loggedInUser.name;
        document.getElementById('currentUserRole').textContent = loggedInUser.role;

        const inputFields = inventoryForm.querySelectorAll('input, button');
        const warningEl = document.getElementById('adminWarning');
        const actionHeader = document.getElementById('actionHeader');

        if (loggedInUser.role === 'admin') {
            inputFields.forEach(el => el.removeAttribute('disabled'));
            warningEl.classList.add('hidden');
            actionHeader.classList.remove('hidden');
        } else {
            inputFields.forEach(el => el.setAttribute('disabled', 'true'));
            warningEl.classList.remove('hidden');
            actionHeader.classList.add('hidden');
        }

        renderDashboard();
    } else {
        dashboardSection.classList.add('hidden');
        authSection.classList.remove('hidden');
    }
}

function renderDashboard() {
    const tableBody = document.getElementById('inventoryTableBody');
    tableBody.innerHTML = '';

    let totalQty = 0;
    let combinedValue = 0;

    inventory.forEach(item => {
        const itemTotalValue = item.qty * item.price;
        totalQty += item.qty;
        combinedValue += itemTotalValue;

        const row = document.createElement('tr');
        
        // Dito inayos ang text insertion para hindi magkaroon ng code crash
        let actionTd = '';
        if (loggedInUser.role === 'admin') {
            actionTd = `<td><button class="btn-danger" onclick="deleteItem(${item.id})">Delete</button></td>`;
        }

        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.qty}</td>
            <td>₱${item.price.toFixed(2)}</td>
            <td>₱${itemTotalValue.toFixed(2)}</td>
            ${actionTd}
        `;
        tableBody.appendChild(row);
    });

    document.getElementById('totalItems').textContent = totalQty;
    document.getElementById('totalValue').textContent = `₱${combinedValue.toFixed(2)}`;
}

// Patakbuhin ang system check sa umpisa
checkSession();
    