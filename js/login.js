// js/login.js
async function xuLyDangNhap() {
    const usernameInput = document.getElementById('username').value.trim();
    const passwordInput = document.getElementById('password').value.trim();
    const errorMsg = document.getElementById('error-msg');

    if (!usernameInput || !passwordInput) {
        errorMsg.innerText = "Vui lòng nhập đầy đủ thông tin!";
        return;
    }

    errorMsg.style.color = "blue";
    errorMsg.innerText = "Đang kiểm tra...";

    try {
        // Biến supabaseClient đã được tạo sẵn ở js/config.js
        const { data, error } = await supabaseClient
            .from('users_custom')
            .select('*')
            .eq('username', usernameInput)
            .eq('password', passwordInput)
            .single();

        if (error || !data) {
            errorMsg.style.color = "red";
            errorMsg.innerText = "Sai tên đăng nhập hoặc mật khẩu!";
            return;
        }

        const userInfo = {
            id: data.id,
            username: data.username,
            full_name: data.full_name,
            role: data.role
        };
        localStorage.setItem('currentUser', JSON.stringify(userInfo));

        window.location.href = 'index.html';

    } catch (err) {
        errorMsg.style.color = "red";
        errorMsg.innerText = "Lỗi kết nối mạng!";
    }
}