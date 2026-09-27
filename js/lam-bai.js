// js/lam-bai.js

const userNow = localStorage.getItem('currentUser');
if (!userNow) {
    window.location.href = 'login.html';
}

const user = JSON.parse(userNow);
document.getElementById('student-name-display').innerText = user.full_name;

const urlParams = new URLSearchParams(window.location.search);
const quizId = urlParams.get('quiz_id');

if (!quizId) {
    alert("Không tìm thấy bài thi!");
    window.location.href = 'index.html';
}

// HÀM XÁO TRỘN MẢNG NGẪU NHIÊN
function xaoTronMang(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

// Khóa lưu trữ chuyên biệt cho từng học sinh và từng bài thi (Tránh làm đè bài nhau)
const storageKey = `exam_state_${user.id}_${quizId}`;

let danhSachCauHoi = [];
let thoiGianConLai = 0; 
let timerInterval;

// 1. TẢI DỮ LIỆU ĐỀ THI TỪ SUPABASE VÀ ĐẢO ĐỀ
async function khoiDongBaiThi() {
    try {
        const { data: quizData, error: quizError } = await supabaseClient
            .from('quizzes').select('*').eq('id', quizId).single();

        if (quizError) throw quizError;
        
        document.getElementById('quiz-title-display').innerText = quizData.title;

        // KIỂM TRA BỘ NHỚ TẠM
        const savedState = JSON.parse(localStorage.getItem(storageKey) || '{}');
        
        if (!savedState.started_at) {
            savedState.started_at = new Date().toISOString();
            localStorage.setItem(storageKey, JSON.stringify(savedState));
        }

        thoiGianConLai = savedState.thoiGianConLai ? savedState.thoiGianConLai : quizData.time_limit * 60;
        batDauDongHo();

        // NẾU ĐÃ CÓ ĐỀ ĐẢO LƯU TẠM THÌ DÙNG LẠI (Chống xáo trộn lại khi F5)
        if (savedState.danhSachCauHoi) {
            danhSachCauHoi = savedState.danhSachCauHoi;
            veDeThiRaManHinh();
            if (savedState.answers) khoiPhucBaiLam(savedState.answers);
            
            const area = document.getElementById('questions-area');
            area.addEventListener('change', luuTamBaiLam);
            area.addEventListener('input', luuTamBaiLam);
            return; 
        }

        // NẾU LÀ LẦN ĐẦU MỞ ĐỀ: TẢI TỪ SUPABASE
        const { data: questionsData, error: qError } = await supabaseClient
            .from('questions').select('*').eq('quiz_id', quizId);

        if (qError) throw qError;

        // BƯỚC ĐẢO ĐỀ THEO TỪNG PHẦN KIẾN THỨC
        const mcq = xaoTronMang(questionsData.filter(c => c.type === 'MCQ'));
        const tf = xaoTronMang(questionsData.filter(c => c.type === 'TRUE_FALSE'));
        const sa = xaoTronMang(questionsData.filter(c => c.type === 'SHORT_ANSWER'));
        const essay = xaoTronMang(questionsData.filter(c => c.type === 'ESSAY'));

        // Ghép lại theo đúng thứ tự ưu tiên
        danhSachCauHoi = [...mcq, ...tf, ...sa, ...essay];

        // LƯU ĐỀ ĐÃ ĐẢO VÀO BỘ NHỚ TẠM
        savedState.danhSachCauHoi = danhSachCauHoi;
        localStorage.setItem(storageKey, JSON.stringify(savedState));

        veDeThiRaManHinh();

        const area = document.getElementById('questions-area');
        area.addEventListener('change', luuTamBaiLam);
        area.addEventListener('input', luuTamBaiLam);

    } catch (err) {
        console.error(err);
        alert("Lỗi tải đề thi. Vui lòng tải lại trang!");
    }
}

// 2. VẼ GIAO DIỆN ĐỀ THI KÈM TIÊU ĐỀ TỪNG PHẦN
function veDeThiRaManHinh() {
    const area = document.getElementById('questions-area');
    area.innerHTML = '';

    let currentType = '';
    let phanCount = 1;
    let sttCau = 1; // Số thứ tự câu hỏi chạy xuyên suốt

    danhSachCauHoi.forEach((cau) => {
        // Nếu phát hiện loại câu hỏi mới, in ra Tiêu đề Phần
        if (cau.type !== currentType) {
            let tenPhan = "";
            if (cau.type === 'MCQ') tenPhan = `PHẦN ${phanCount++}. TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN LỰA CHỌN`;
            if (cau.type === 'TRUE_FALSE') tenPhan = `PHẦN ${phanCount++}. TRẮC NGHIỆM ĐÚNG/SAI`;
            if (cau.type === 'SHORT_ANSWER') tenPhan = `PHẦN ${phanCount++}. TRẢ LỜI NGẮN`;
            if (cau.type === 'ESSAY') tenPhan = `PHẦN ${phanCount++}. TỰ LUẬN`;

            area.innerHTML += `
                <h3 style="color: #2b3674; margin: 35px 0 20px 0; padding-bottom: 10px; border-bottom: 3px solid #4318ff; text-transform: uppercase; font-size: 18px;">
                    📝 ${tenPhan}
                </h3>`;
            currentType = cau.type;
        }

        let html = `<div class="question-card" id="q-${cau.id}">
                        <div class="question-title"><strong>Câu ${sttCau++}:</strong> ${cau.content}</div>`;
        
        if (cau.image_url) {
            html += `<img src="${cau.image_url}" class="question-image">`;
        }

        if (cau.type === 'MCQ') {
            const opts = cau.options;
            html += `
                <label class="mcq-option"><input type="radio" name="ans_${cau.id}" value="0"> A. ${opts[0]}</label>
                <label class="mcq-option"><input type="radio" name="ans_${cau.id}" value="1"> B. ${opts[1]}</label>
                <label class="mcq-option"><input type="radio" name="ans_${cau.id}" value="2"> C. ${opts[2]}</label>
                <label class="mcq-option"><input type="radio" name="ans_${cau.id}" value="3"> D. ${opts[3]}</label>
            `;
        } else if (cau.type === 'TRUE_FALSE') {
            const opts = cau.options;
            html += `
                <table class="tf-table">
                    <tr><th>Nội dung</th><th>Đúng</th><th>Sai</th></tr>
                    <tr><td class="tf-content">a) ${opts.a.text}</td><td><input type="radio" name="ans_${cau.id}_a" value="true"></td><td><input type="radio" name="ans_${cau.id}_a" value="false"></td></tr>
                    <tr><td class="tf-content">b) ${opts.b.text}</td><td><input type="radio" name="ans_${cau.id}_b" value="true"></td><td><input type="radio" name="ans_${cau.id}_b" value="false"></td></tr>
                    <tr><td class="tf-content">c) ${opts.c.text}</td><td><input type="radio" name="ans_${cau.id}_c" value="true"></td><td><input type="radio" name="ans_${cau.id}_c" value="false"></td></tr>
                    <tr><td class="tf-content">d) ${opts.d.text}</td><td><input type="radio" name="ans_${cau.id}_d" value="true"></td><td><input type="radio" name="ans_${cau.id}_d" value="false"></td></tr>
                </table>
            `;
        } else if (cau.type === 'SHORT_ANSWER') {
            html += `
                <div style="margin-top: 10px;">
                    <input type="text" class="short-answer-box" id="ans_${cau.id}_1" maxlength="1">
                    <input type="text" class="short-answer-box" id="ans_${cau.id}_2" maxlength="1">
                    <input type="text" class="short-answer-box" id="ans_${cau.id}_3" maxlength="1">
                    <input type="text" class="short-answer-box" id="ans_${cau.id}_4" maxlength="1">
                </div>
            `;
        } else if (cau.type === 'ESSAY') {
            html += `<textarea class="essay-box" id="ans_${cau.id}" placeholder="Nhập bài làm của em vào đây..."></textarea>`;
        }

        html += `</div>`;
        area.innerHTML += html;
    });

    if (window.MathJax) {
        MathJax.typesetPromise([area]).catch(err => console.log(err));
    }
}

// ==========================================
// TÍNH NĂNG MỚI: LƯU NHÁP VÀ KHÔI PHỤC ĐÁP ÁN
// ==========================================
function luuTamBaiLam() {
    let answers = {};
    danhSachCauHoi.forEach(cau => {
        if (cau.type === 'MCQ') {
            const checkedOption = document.querySelector(`input[name="ans_${cau.id}"]:checked`);
            if (checkedOption) answers[cau.id] = checkedOption.value;
        } else if (cau.type === 'TRUE_FALSE') {
            let ansObj = {};
            ['a', 'b', 'c', 'd'].forEach(id => {
                const checked = document.querySelector(`input[name="ans_${cau.id}_${id}"]:checked`);
                if (checked) ansObj[id] = checked.value;
            });
            answers[cau.id] = ansObj;
        } else if (cau.type === 'SHORT_ANSWER') {
            let ansArr = [];
            for(let i=1; i<=4; i++) {
                ansArr.push(document.getElementById(`ans_${cau.id}_${i}`).value || "");
            }
            answers[cau.id] = ansArr;
        } else if (cau.type === 'ESSAY') {
            answers[cau.id] = document.getElementById(`ans_${cau.id}`).value;
        }
    });
    
    // Đẩy vào bộ nhớ tạm
    const currentState = JSON.parse(localStorage.getItem(storageKey) || '{}');
    currentState.answers = answers;
    localStorage.setItem(storageKey, JSON.stringify(currentState));
}

function khoiPhucBaiLam(savedAnswers) {
    if (!savedAnswers) return;
    danhSachCauHoi.forEach(cau => {
        const ans = savedAnswers[cau.id];
        if (!ans) return;
        
        if (cau.type === 'MCQ') {
            const r = document.querySelector(`input[name="ans_${cau.id}"][value="${ans}"]`);
            if (r) r.checked = true;
        } else if (cau.type === 'TRUE_FALSE') {
            ['a', 'b', 'c', 'd'].forEach(id => {
                if (ans[id]) {
                    const r = document.querySelector(`input[name="ans_${cau.id}_${id}"][value="${ans[id]}"]`);
                    if (r) r.checked = true;
                }
            });
        } else if (cau.type === 'SHORT_ANSWER') {
            for(let i=1; i<=4; i++) {
                const input = document.getElementById(`ans_${cau.id}_${i}`);
                if (input && ans[i-1]) input.value = ans[i-1];
            }
        } else if (cau.type === 'ESSAY') {
            const input = document.getElementById(`ans_${cau.id}`);
            if (input) input.value = ans;
        }
    });
}

// 3. ĐỒNG HỒ ĐẾM NGƯỢC (Tích hợp tự động lưu giờ)
function batDauDongHo() {
    const timerDisplay = document.getElementById('countdown-timer');
    
    timerInterval = setInterval(() => {
        if (thoiGianConLai <= 0) {
            clearInterval(timerInterval);
            alert("Đã hết thời gian làm bài! Hệ thống tự động nộp bài.");
            nopBai();
            return;
        }
        
        thoiGianConLai--;
        
        // Lưu lại thời gian vào bộ nhớ tạm mỗi giây
        const currentState = JSON.parse(localStorage.getItem(storageKey) || '{}');
        currentState.thoiGianConLai = thoiGianConLai;
        localStorage.setItem(storageKey, JSON.stringify(currentState));

        let phut = Math.floor(thoiGianConLai / 60);
        let giay = thoiGianConLai % 60;
        timerDisplay.innerText = `${phut < 10 ? '0' : ''}${phut}:${giay < 10 ? '0' : ''}${giay}`;
        
        if (thoiGianConLai < 60) {
            timerDisplay.style.color = "red";
        }
    }, 1000);
}

let isSubmitting = false;

// 4. THU THẬP, CHẤM ĐIỂM VÀ NỘP BÀI
async function nopBai() {
    clearInterval(timerInterval);
    if (!confirm("Em có chắc chắn muốn nộp bài ngay bây giờ không?")) {
        batDauDongHo(); 
        return;
    }

    isSubmitting = true;

    const btn = document.querySelector('.btn-submit-exam');
    btn.innerText = "Đang xử lý nộp bài...";
    btn.disabled = true;

    let soCauDung = 0;
    const tongSoCau = danhSachCauHoi.length;
    const chiTietBaiLam = [];

    // Quét đáp án học sinh nhập trên màn hình
    danhSachCauHoi.forEach(cau => {
        let studentText = "";
        let isCorrect = false;

        if (cau.type === 'MCQ') {
            const checkedOption = document.querySelector(`input[name="ans_${cau.id}"]:checked`);
            if (checkedOption) {
                studentText = checkedOption.value; 
                isCorrect = (studentText === cau.correct_answer);
            }
        } 
        else if (cau.type === 'TRUE_FALSE') {
            let ansObj = {};
            let correctCount = 0;
            ['a', 'b', 'c', 'd'].forEach(id => {
                const checked = document.querySelector(`input[name="ans_${cau.id}_${id}"]:checked`);
                ansObj[id] = checked ? checked.value : "";
                if (ansObj[id] === cau.options[id].ans) correctCount++;
            });
            studentText = JSON.stringify(ansObj);
            isCorrect = (correctCount === 4); 
        } 
        else if (cau.type === 'SHORT_ANSWER') {
            let ans = "";
            for(let i=1; i<=4; i++) {
                ans += document.getElementById(`ans_${cau.id}_${i}`).value || "";
            }
            studentText = ans.trim();
            isCorrect = (studentText.toLowerCase() === cau.correct_answer.toLowerCase());
        } 
        else if (cau.type === 'ESSAY') {
            studentText = document.getElementById(`ans_${cau.id}`).value.trim();
            isCorrect = false; 
        }

        if (isCorrect) soCauDung++;

        chiTietBaiLam.push({
            question_id: cau.id,
            student_text: studentText,
            is_correct: isCorrect
        });
    });

    const diemSo = tongSoCau > 0 ? parseFloat(((soCauDung / tongSoCau) * 10).toFixed(2)) : 0;

    // TÍNH TOÁN THỜI GIAN LÀM BÀI
    const savedState = JSON.parse(localStorage.getItem(storageKey) || '{}');
    const startedAt = savedState.started_at || new Date().toISOString();
    const thoiGianLamGiay = Math.floor((new Date() - new Date(startedAt)) / 1000);

    try {
        // Đẩy điểm, ngày bắt đầu và tổng thời gian vào bảng quiz_results
        const { data: resultData, error: resultError } = await supabaseClient
            .from('quiz_results')
            .insert([{ 
                quiz_id: quizId, 
                student_id: user.id, 
                score: diemSo,
                started_at: startedAt,
                time_taken: thoiGianLamGiay
            }])
            .select();

        if (resultError) throw resultError;
        
        const newResultId = resultData[0].id;

        // Đẩy chi tiết đáp án vào bảng student_answers
        const duLieuChiTiet = chiTietBaiLam.map(item => ({
            result_id: newResultId,
            question_id: item.question_id,
            student_text: item.student_text,
            is_correct: item.is_correct
        }));

        const { error: answersError } = await supabaseClient
            .from('student_answers')
            .insert(duLieuChiTiet);

        if (answersError) throw answersError;

        // Xóa bộ nhớ tạm khi nộp bài xong
        localStorage.removeItem(storageKey);

        // ĐIỀU HƯỚNG CHUYỂN SANG TRANG KẾT QUẢ KHÔNG CẦN HIỆN ALERT NỮA
        window.location.href = `ket-qua.html?result_id=${newResultId}`;

    } catch (err) {
        console.error("Lỗi chi tiết:", err);
        alert("Lỗi từ máy chủ: " + (err.message || JSON.stringify(err)));
        
        btn.innerText = "📥 Nộp Bài & Hoàn Thành";
        btn.disabled = false;
    }
}

khoiDongBaiThi();

// ==========================================
// CHẶN NÚT BACK VÀ LÀM MỚI TRANG TRONG PHÒNG THI
// ==========================================

// 1. Chặn việc nhấn nút Back (Quay lại) trên điện thoại / trình duyệt
history.pushState(null, null, location.href);
window.addEventListener('popstate', function(event) {
    if (isSubmitting) return; // Nếu đang nộp bài thì cho qua
    
    const xacNhan = confirm("⚠️ Em đang làm bài. Nếu thoát ra, thời gian vẫn sẽ đếm ngược. Em có chắc chắn muốn thoát về Sảnh chờ không?");
    if (xacNhan) {
        // Đồng ý thoát -> Đưa về trang chi tiết bài thi
        window.location.href = `chi-tiet-bai-thi.html?quiz_id=${quizId}`;
    } else {
        // Hủy thao tác -> Đẩy lại trạng thái để nhốt học sinh ở lại phòng thi
        history.pushState(null, null, location.href);
    }
});

// 2. Chặn thao tác vô tình bấm F5 hoặc đóng ứng dụng/trình duyệt
window.addEventListener('beforeunload', function (e) {
    if (!isSubmitting) {
        e.preventDefault();
        e.returnValue = ''; // Cú pháp bắt buộc để trình duyệt hiện hộp thoại cảnh báo
    }
});