// js/config.js
const SUPABASE_URL = 'https://uegakipjmyclfmbwouny.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_TyIY5alerxcalauoMQR5bQ_S0LkyWHg';

// Khởi tạo biến supabaseClient dùng chung cho toàn bộ web
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================================
// CHỨC NĂNG TỰ ĐỘNG ĐĂNG XUẤT SAU 10 PHÚT (BẢO MẬT)
// ==========================================
const THOI_GIAN_TREO_MAX = 10 * 60 * 1000; // 10 phút (tính bằng mili-giây)

function capNhatThaoTac() {
    // Lưu lại mốc thời gian hiện tại
    localStorage.setItem('thoiGianTuongTacCuoi', Date.now());
}

function kiemTraTreoMay() {
    const userHienTai = localStorage.getItem('currentUser');
    const thoiGianCuoi = localStorage.getItem('thoiGianTuongTacCuoi');
    const path = window.location.pathname;
    
    // ĐƯA TRANG LÀM BÀI VÀ TRANG LOGIN VÀO DIỆN "MIỄN TRỪ"
    if (userHienTai && thoiGianCuoi && !path.includes('login.html') && !path.includes('lam-bai.html')) {
        const thoiGianHienTai = Date.now();
        
        if (thoiGianHienTai - parseInt(thoiGianCuoi) > THOI_GIAN_TREO_MAX) {
            localStorage.removeItem('currentUser');
            alert("⏳ Phiên đăng nhập đã hết hạn do không có thao tác nào trong 10 phút. Vui lòng đăng nhập lại để bảo đảm an toàn!");
            window.location.href = 'login.html';
        }
    }
}

// KHỞI ĐỘNG HỆ THỐNG THEO DÕI
const currentPath = window.location.pathname;
// CHỈ KÍCH HOẠT NẾU ĐÃ ĐĂNG NHẬP VÀ KHÔNG Ở TRONG PHÒNG THI
if (localStorage.getItem('currentUser') && !currentPath.includes('login.html') && !currentPath.includes('lam-bai.html')) {
    capNhatThaoTac(); 

    // Lắng nghe mọi hành động
    window.addEventListener('mousemove', capNhatThaoTac);
    window.addEventListener('keypress', capNhatThaoTac);
    window.addEventListener('click', capNhatThaoTac);
    window.addEventListener('scroll', capNhatThaoTac);
    window.addEventListener('touchmove', capNhatThaoTac); 

    // Tuần tra ngầm mỗi 30 giây
    setInterval(kiemTraTreoMay, 30000);

    // Kiểm tra ngay khi quay lại Tab
    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'visible') {
            kiemTraTreoMay();
        }
    });
}