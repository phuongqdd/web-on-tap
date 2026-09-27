// js/chi-tiet-bai-thi.js

const userNow = localStorage.getItem('currentUser');
if (!userNow) window.location.href = 'login.html';
const user = JSON.parse(userNow);

const urlParams = new URLSearchParams(window.location.search);
const quizId = urlParams.get('quiz_id');
if (!quizId) window.location.href = 'index.html';

async function taiThongTinChiTiet() {
    try {
        // 1. Tải thông tin cài đặt của bài thi
        const { data: quizData, error: qErr } = await supabaseClient
            .from('quizzes').select('*').eq('id', quizId).single();
        if (qErr) throw qErr;

        // 2. Tải lịch sử làm bài của học sinh này
        const { data: historyData, error: hErr } = await supabaseClient
            .from('quiz_results').select('*')
            .eq('quiz_id', quizId).eq('student_id', user.id)
            .order('submitted_at', { ascending: true });
        if (hErr) throw hErr;

        // HIỂN THỊ THÔNG TIN QUY CHẾ
        document.getElementById('quiz-title').innerText = quizData.title;
        document.getElementById('time-limit').innerText = `${quizData.time_limit} phút`;
        document.getElementById('max-attempts').innerText = `${quizData.max_attempts} lượt (Đã làm: ${historyData.length})`;
        
        const startTime = quizData.start_time ? new Date(quizData.start_time) : null;
        const endTime = quizData.end_time ? new Date(quizData.end_time) : null;
        
        document.getElementById('start-time').innerText = startTime ? startTime.toLocaleString('vi-VN') : "Không giới hạn";
        document.getElementById('end-time').innerText = endTime ? endTime.toLocaleString('vi-VN') : "Không giới hạn";

        // KIỂM TRA ĐIỀU KIỆN ĐỂ HIỆN NÚT "LÀM BÀI"
        const now = new Date();
        const pastAttempts = historyData.length;
        let canTake = true;
        let msg = "";
        let msgColor = "#d32f2f"; // Đỏ (Lỗi)

        if (startTime && now < startTime) {
            canTake = false;
            msg = "⏳ Đề thi chưa mở. Xin vui lòng quay lại sau!";
        } else if (endTime && now > endTime) {
            canTake = false;
            msg = "❌ Đề thi đã đóng. Đã hết hạn làm bài!";
        } else if (pastAttempts >= quizData.max_attempts) {
            canTake = false;
            msg = "🛑 Em đã sử dụng hết số lượt làm bài cho phép!";
        } else {
            msg = `✅ Trạng thái hợp lệ. Em còn ${quizData.max_attempts - pastAttempts} lượt làm bài.`;
            msgColor = "#05cd99"; // Xanh (Ok)
        }

        document.getElementById('status-message').innerText = msg;
        document.getElementById('status-message').style.color = msgColor;

        const actionArea = document.getElementById('action-area');
        if (canTake) {
            actionArea.innerHTML = `<button onclick="window.location.href='lam-bai.html?quiz_id=${quizId}'" 
                                    style="background: #05cd99; color: white; padding: 15px 40px; border: none; border-radius: 10px; font-weight: bold; font-size: 18px; cursor: pointer; box-shadow: 0 4px 10px rgba(5,205,153,0.3);">
                                    🚀 VÀO PHÒNG THI NGAY
                                    </button>`;
        }

        // HIỂN THỊ LỊCH SỬ BÊN DƯỚI ĐỂ XEM LẠI
        const tbody = document.getElementById('history-body');
        tbody.innerHTML = '';
        if (historyData.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="color: #888;">Em chưa làm bài thi này lần nào.</td></tr>`;
        } else {
            historyData.forEach((result, index) => {
                const nopLuc = new Date(result.submitted_at).toLocaleString('vi-VN');
                tbody.innerHTML += `
                    <tr>
                        <td><strong>Lần ${index + 1}</strong></td>
                        <td>${nopLuc}</td>
                        <td style="color: #05cd99; font-weight: bold;">${result.score}/10</td>
                        <td>
                            <a href="ket-qua.html?result_id=${result.id}" style="background: #4318ff; color: white; padding: 5px 10px; border-radius: 5px; text-decoration: none; font-size: 13px;">👁️ Xem lại</a>
                        </td>
                    </tr>
                `;
            });
        }

    } catch (err) {
        console.error(err);
        document.getElementById('quiz-title').innerText = "Lỗi tải dữ liệu. Vui lòng thử lại!";
    }
}

taiThongTinChiTiet();