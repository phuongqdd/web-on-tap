// js/home.js

const userNow = localStorage.getItem('currentUser');
if (!userNow) {
    window.location.href = 'login.html';
}

const user = JSON.parse(userNow);
document.getElementById('welcome-text').innerText = `Xin chào, ${user.full_name}!`;

let danhSachGoc = [];
let danhSachLoc = [];
let trangHienTai = 1;
const soBaiMotTrang = 5; 

// Phân luồng Giáo viên và Học sinh
if (user.role === 'TEACHER') {
    hienThiKhungGiaoVien();
    taiDuLieuTuSupabase();
} else {
    hienThiKhungHocSinh();
}

// ==========================================
// PHẦN 1: DÀNH CHO GIÁO VIÊN
// ==========================================
function hienThiKhungGiaoVien() {
    const area = document.getElementById('dashboard-area');
    area.innerHTML = `
        <div class="dashboard-header">
            <input type="text" id="search-input" class="search-box" placeholder="🔍 Tìm kiếm tên bài hoặc chủ đề..." onkeyup="xuLyTimKiem()">
            <a href="tao-bai.html" style="background: #4318ff; color: white; padding: 12px 20px; border-radius: 10px; text-decoration: none; font-weight: bold;">+ Tạo Bài Mới</a>
        </div>
        
        <div class="table-responsive">
            <table class="quiz-table">
                <thead>
                    <tr>
                        <th>Tên bài kiểm tra</th>
                        <th>Chủ đề</th>
                        <th>Thời gian</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                    </tr>
                </thead>
                <tbody id="quiz-list-body">
                    <tr><td colspan="5" style="text-align: center;">Đang tải dữ liệu...</td></tr>
                </tbody>
            </table>
        </div>
        <div class="pagination" id="pagination-controls"></div>

        <!-- POPUP CẤU HÌNH GIAO BÀI -->
        <div id="assign-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; justify-content: center; align-items: center;">
            <div style="background: white; padding: 25px; border-radius: 15px; width: 400px; max-width: 90%; box-shadow: 0 5px 20px rgba(0,0,0,0.2);">
                <h3 style="color: #4318ff; margin-top: 0;">🚀 Cấu Hình Giao Bài</h3>
                <p id="assign-quiz-title" style="font-weight: bold; color: #2b3674;"></p>
                
                <div style="margin-top: 15px;">
                    <label style="display: block; font-size: 14px; margin-bottom: 5px; color: #707eae;">Số lần làm bài tối đa / HS:</label>
                    <input type="number" id="assign-max-attempts" value="1" min="1" style="width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px;">
                </div>
                
                <div style="margin-top: 15px;">
                    <label style="display: block; font-size: 14px; margin-bottom: 5px; color: #707eae;">Thời gian mở đề:</label>
                    <input type="datetime-local" id="assign-start-time" style="width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px;">
                </div>
                
                <div style="margin-top: 15px;">
                    <label style="display: block; font-size: 14px; margin-bottom: 5px; color: #707eae;">Thời gian đóng đề:</label>
                    <input type="datetime-local" id="assign-end-time" style="width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px;">
                </div>
                
                <div style="margin-top: 25px; display: flex; justify-content: flex-end; gap: 10px;">
                    <button onclick="dongPopupGiaoBai()" style="padding: 10px 15px; background: #e2e8f0; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; color: #2b3674;">Hủy</button>
                    <button onclick="xacNhanGiaoBai()" style="padding: 10px 15px; background: #05cd99; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">Phát Hành</button>
                </div>
            </div>
        </div>
    `;
}

async function taiDuLieuTuSupabase() {
    try {
        const { data, error } = await supabaseClient
            .from('quizzes')
            .select('*')
            .eq('teacher_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        danhSachGoc = data;
        danhSachLoc = data; 
        veBangDuLieu();
    } catch (err) {
        console.error(err);
        document.getElementById('quiz-list-body').innerHTML = `<tr><td colspan="5" style="color: red; text-align: center;">Lỗi tải dữ liệu mạng!</td></tr>`;
    }
}

function xuLyTimKiem() {
    const tuKhoa = document.getElementById('search-input').value.toLowerCase().trim();
    danhSachLoc = danhSachGoc.filter(quiz => 
        quiz.title.toLowerCase().includes(tuKhoa) || 
        quiz.topic.toLowerCase().includes(tuKhoa)
    );
    trangHienTai = 1; 
    veBangDuLieu();
}

function veBangDuLieu() {
    const tbody = document.getElementById('quiz-list-body');
    const pagination = document.getElementById('pagination-controls');
    
    tbody.innerHTML = '';
    pagination.innerHTML = '';

    if (danhSachLoc.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #707eae;">Không tìm thấy bài kiểm tra nào.</td></tr>`;
        return;
    }

    const batDau = (trangHienTai - 1) * soBaiMotTrang;
    const ketThuc = batDau + soBaiMotTrang;
    const duLieuHienThi = danhSachLoc.slice(batDau, ketThuc);

    duLieuHienThi.forEach(quiz => {
        // Thay thế khối HTML render các nút bấm ở cột Thao tác thành:
        let nutGiaoHtml = quiz.is_published
            ? `<button class="action-btn btn-assign" style="background: #94a3b8; cursor: not-allowed;" title="Đã phát hành">✔️ Đã Giao</button>`
            : `<button class="action-btn btn-assign" onclick="moPopupGiaoBai('${quiz.id}', '${quiz.title}')">🚀 Giao</button>`;

        // Thêm nút Xem kết quả
        let nutXemHtml = `<a href="danh-sach-nop-bai.html?quiz_id=${quiz.id}" class="action-btn" style="background: #f59e0b; color: white; text-decoration: none; padding: 7px 12px; border-radius: 5px; margin-left: 5px; display: inline-block;">📊 Kết quả</a>`;

        tbody.innerHTML += `
            <tr>
                <td style="font-weight: 800; color: #4318ff;">${quiz.title}</td>
                <td><span style="background: #f4f7fe; padding: 4px 10px; border-radius: 6px; font-size: 13px;">${quiz.topic}</span></td>
                <td><span style="color: #d32f2f; font-weight: bold;">${quiz.time_limit} phút</span></td>
                <td><span style="background: ${quiz.is_published ? '#ecfdf5' : '#fef2f2'}; color: ${quiz.is_published ? '#05cd99' : '#f87171'}; padding: 4px 10px; border-radius: 6px; font-size: 13px; font-weight: bold;">${quiz.is_published ? 'Đã phát hành' : 'Bản Nháp'}</span></td>
                <td>
                    <button class="action-btn btn-edit" onclick="chuyenTrangSua('${quiz.id}')">✏️ Sửa</button>
                    ${nutGiaoHtml}
                    ${nutXemHtml}
                </td>
            </tr>
        `;
    });

    const tongSoTrang = Math.ceil(danhSachLoc.length / soBaiMotTrang);
    if (tongSoTrang > 1) {
        for (let i = 1; i <= tongSoTrang; i++) {
            pagination.innerHTML += `<button class="page-btn ${i === trangHienTai ? 'active' : ''}" onclick="chuyenTrang(${i})">${i}</button>`;
        }
    }
}

function chuyenTrang(soTrang) {
    trangHienTai = soTrang;
    veBangDuLieu();
}

function chuyenTrangSua(id) {
    window.location.href = `soan-cau-hoi.html?quiz_id=${id}`;
}

let quizDangGiaoId = null; // Biến tạm lưu ID bài đang cấu hình

function moPopupGiaoBai(quizId, quizTitle) {
    quizDangGiaoId = quizId;
    document.getElementById('assign-quiz-title').innerText = `Bài: ${quizTitle}`;
    
    // Gợi ý thời gian: Bắt đầu từ hiện tại, kết thúc sau 3 ngày
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    
    const startStr = new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
    document.getElementById('assign-start-time').value = startStr;
    
    const endStr = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000) - tzOffset).toISOString().slice(0, 16);
    document.getElementById('assign-end-time').value = endStr;
    
    document.getElementById('assign-modal').style.display = 'flex';
}

function dongPopupGiaoBai() {
    document.getElementById('assign-modal').style.display = 'none';
    quizDangGiaoId = null;
}

async function xacNhanGiaoBai() {
    if (!quizDangGiaoId) return;
    
    const maxAttempts = document.getElementById('assign-max-attempts').value;
    const startTime = document.getElementById('assign-start-time').value;
    const endTime = document.getElementById('assign-end-time').value;
    
    if (!startTime || !endTime) {
        alert("Vui lòng chọn đầy đủ thời gian mở và đóng đề!");
        return;
    }
    if (new Date(startTime) >= new Date(endTime)) {
        alert("Thời gian đóng đề phải diễn ra sau thời gian mở đề!");
        return;
    }
    
    try {
        const { error } = await supabaseClient
            .from('quizzes')
            .update({ 
                is_published: true,
                max_attempts: parseInt(maxAttempts),
                start_time: new Date(startTime).toISOString(),
                end_time: new Date(endTime).toISOString()
            })
            .eq('id', quizDangGiaoId);

        if (error) throw error;
        
        alert("✅ Đã phát hành bài kiểm tra thành công với cấu hình mới!");
        dongPopupGiaoBai();
        taiDuLieuTuSupabase(); // Tải lại bảng để cập nhật trạng thái mới
    } catch (err) {
        console.error(err);
        alert("Lỗi khi phát hành bài kiểm tra!");
    }
}

// ==========================================
// PHẦN 2: DÀNH CHO HỌC SINH
// ==========================================
function hienThiKhungHocSinh() {
    const area = document.getElementById('dashboard-area');
    area.innerHTML = `
        <h2 style="color: #2b3674; margin-bottom: 20px;">📚 Bài Tập Được Giao</h2>
        <div class="table-responsive">
            <table class="quiz-table">
                <thead>
                    <tr>
                        <th>Tên bài kiểm tra</th>
                        <th>Chủ đề</th>
                        <th>Thời gian</th>
                        <th>Thao tác</th>
                    </tr>
                </thead>
                <tbody id="student-quiz-list">
                    <tr><td colspan="4" style="text-align: center;">Đang tải dữ liệu...</td></tr>
                </tbody>
            </table>
        </div>
    `;
    taiDuLieuHocSinh();
}

async function taiDuLieuHocSinh() {
    try {
        // Chỉ lấy những bài đã được bật công tắc is_published = true
        const { data, error } = await supabaseClient
            .from('quizzes')
            .select('*')
            .eq('is_published', true)
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        const tbody = document.getElementById('student-quiz-list');
        tbody.innerHTML = '';
        
        if(data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #888;">Hiện chưa có bài tập nào trên hệ thống.</td></tr>';
            return;
        }

        data.forEach(quiz => {
            tbody.innerHTML += `
                <tr>
                    <td style="font-weight: 800; color: #4318ff; font-size: 16px;">${quiz.title}</td>
                    <td><span style="background: #f4f7fe; padding: 4px 10px; border-radius: 6px; font-size: 13px; font-weight: bold;">${quiz.topic}</span></td>
                    <td style="font-weight: bold; color: #d32f2f;">⏱️ ${quiz.time_limit} phút</td>
                    <td>
                        <!-- Đổi từ nút "Làm bài ngay" thành nút "Xem chi tiết" -->
                        <a href="chi-tiet-bai-thi.html?quiz_id=${quiz.id}" class="action-btn" style="background: #4318ff; color: white; text-decoration: none; padding: 8px 15px; border-radius: 8px; display: inline-block;">ℹ️ Xem chi tiết</a>
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        console.error(err);
        document.getElementById('student-quiz-list').innerHTML = `<tr><td colspan="4" style="color: red; text-align: center;">Lỗi tải dữ liệu mạng!</td></tr>`;
    }
}


// ==========================================
// CHẶN NÚT BACK (QUAY LẠI) Ở TRANG CHỦ
// ==========================================
history.pushState(null, null, location.href);
window.addEventListener('popstate', function(event) {
    const xacNhan = confirm("Thầy/Cô và các em có muốn Đăng xuất khỏi hệ thống không?");
    if (xacNhan) {
        // Nếu chọn OK -> Xóa bộ nhớ và về trang Đăng nhập
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    } else {
        // Nếu chọn Hủy -> Giữ nguyên ở Trang chủ
        history.pushState(null, null, location.href);
    }
});