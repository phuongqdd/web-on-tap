// js/header.js
function taoThanhHeader() {
    const headerHTML = `
        <header class="site-header">
            <a href="index.html" class="logo">📐 Toán Học Vui</a>
            <div id="user-info">
                <a href="login.html" class="btn-login-header">Đăng nhập</a>
            </div>
        </header>
    `;
    
    // Chèn menu vào đầu trang web
    document.body.insertAdjacentHTML('afterbegin', headerHTML);

    // Kiểm tra đăng nhập
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        const user = JSON.parse(savedUser);
        document.getElementById('user-info').innerHTML = `
            <span class="user-greeting">👤 Chào, ${user.full_name}</span> 
            <button onclick="dangXuat()" class="btn-logout">Thoát</button>
        `;
    }
}

function dangXuat() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html'; 
}

// Chạy hàm ngay lập tức
taoThanhHeader();