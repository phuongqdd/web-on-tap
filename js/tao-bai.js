// js/tao-bai.js

// Kiểm tra bảo mật: Ngăn học sinh gõ link tao-bai.html để vào trộm
const userNow = localStorage.getItem('currentUser');
if (!userNow) {
    window.location.href = 'login.html';
} else {
    const user = JSON.parse(userNow);
    if (user.role !== 'TEACHER') {
        alert("Bạn không có quyền truy cập trang này!");
        window.location.href = 'index.html';
    }
}

async function luuBaiKiemTra() {
    const title = document.getElementById('quiz-title').value.trim();
    const topic = document.getElementById('quiz-topic').value.trim();
    const timeLimit = document.getElementById('quiz-time').value;
    const statusMsg = document.getElementById('status-msg');

    if (!title || !topic || !timeLimit) {
        statusMsg.style.color = "red";
        statusMsg.innerText = "Vui lòng điền đủ thông tin!";
        return;
    }

    statusMsg.style.color = "blue";
    statusMsg.innerText = "Đang lưu bài kiểm tra...";

    try {
        // Lấy ID của Giáo viên đang đăng nhập
        const teacher = JSON.parse(localStorage.getItem('currentUser'));

        // Đẩy dữ liệu lên bảng quizzes
        const { data, error } = await supabaseClient
            .from('quizzes')
            .insert([
                { 
                    teacher_id: teacher.id, 
                    title: title, 
                    topic: topic, 
                    time_limit: parseInt(timeLimit) 
                }
            ])
            .select(); // Trả về thông tin vừa lưu để lấy ID bài kiểm tra

        if (error) {
            statusMsg.style.color = "red";
            statusMsg.innerText = "Lỗi khi lưu: " + error.message;
            return;
        }

        statusMsg.style.color = "green";
        statusMsg.innerText = "✅ Tạo bài thành công! Đang chuyển tới trang soạn câu hỏi...";
        
        // Sau khi tạo khung bài xong, ta sẽ chuyển Giáo viên sang trang nhập câu hỏi 
        // (truyền theo ID của bài vừa tạo trên thanh địa chỉ)
        setTimeout(() => {
            window.location.href = `soan-cau-hoi.html?quiz_id=${data[0].id}`;
        }, 1500);

    } catch (err) {
        statusMsg.style.color = "red";
        statusMsg.innerText = "Lỗi mạng!";
    }
}