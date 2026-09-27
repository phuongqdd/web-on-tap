const userNow = localStorage.getItem('currentUser');
if (!userNow) window.location.href = 'login.html';

const urlParams = new URLSearchParams(window.location.search);
const quizId = urlParams.get('quiz_id');

if (!quizId) window.location.href = 'index.html';

async function taiDanhSachNopBai() {
    try {
        // 1. Lấy tên bài kiểm tra
        const { data: quizData } = await supabaseClient
            .from('quizzes').select('title').eq('id', quizId).single();
        if (quizData) {
            document.getElementById('quiz-title-display').innerText = `📊 Bài thi: ${quizData.title}`;
        }

        // 2. Lấy danh sách kết quả, kết nối với bảng users_custom để lấy tên
        const { data: results, error } = await supabaseClient
            .from('quiz_results')
            .select(`
                *,
                users_custom ( full_name )
            `)
            .eq('quiz_id', quizId)
            .order('submitted_at', { ascending: false });

        if (error) throw error;

        const tbody = document.getElementById('student-list-body');
        tbody.innerHTML = '';

        if (results.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="color: #888;">Chưa có học sinh nào nộp bài.</td></tr>';
            return;
        }

        results.forEach((res, index) => {
            const tenHS = res.users_custom?.full_name || "Học sinh ẩn danh";
            const diemSo = res.score;
            
            // Tính toán định dạng thời gian làm bài
            const phut = Math.floor(res.time_taken / 60);
            const giay = res.time_taken % 60;
            const thoiGianLam = `${phut}p ${giay}s`;
            
            const ngayNop = new Date(res.submitted_at).toLocaleString('vi-VN');

            tbody.innerHTML += `
                <tr>
                    <td>${index + 1}</td>
                    <td style="text-align: left; font-weight: bold; color: #2b3674;">${tenHS}</td>
                    <td style="color: #05cd99; font-weight: bold; font-size: 16px;">${diemSo}/10</td>
                    <td>${thoiGianLam}</td>
                    <td>${ngayNop}</td>
                    <td>
                        <a href="ket-qua.html?result_id=${res.id}" target="_blank" style="background: #4318ff; color: white; padding: 6px 12px; border-radius: 5px; text-decoration: none; font-size: 13px;">👁️ Xem chi tiết</a>
                    </td>
                </tr>
            `;
        });

    } catch (err) {
        console.error(err);
        document.getElementById('student-list-body').innerHTML = `<tr><td colspan="6" style="color: red;">Lỗi tải dữ liệu. Vui lòng kiểm tra lại.</td></tr>`;
    }
}

taiDanhSachNopBai();