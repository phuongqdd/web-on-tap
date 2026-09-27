// js/ket-qua.js

const urlParams = new URLSearchParams(window.location.search);
const resultId = urlParams.get('result_id');

if (!resultId) {
    window.location.href = 'index.html';
}

async function taiBaoCaoKetQua() {
    try {
        // 1. Tải thông tin lần nộp bài hiện tại
        const { data: resultInfo, error: rErr } = await supabaseClient
            .from('quiz_results')
            .select('*, quizzes(title)')
            .eq('id', resultId)
            .single();
        if (rErr) throw rErr;

        // 2. Tính toán "Lần làm bài thứ mấy" bằng cách đếm lịch sử nộp bài
        const { data: history } = await supabaseClient
            .from('quiz_results')
            .select('id')
            .eq('quiz_id', resultInfo.quiz_id)
            .eq('student_id', resultInfo.student_id)
            .order('submitted_at', { ascending: true });

        let lanLam = 1;
        if (history) {
            const index = history.findIndex(h => h.id === resultId);
            if (index !== -1) lanLam = index + 1;
        }

        // 3. Hiển thị thông số tổng quan
        document.getElementById('score-display').innerText = `${resultInfo.score}/10`;
        document.getElementById('quiz-title-display').innerText = resultInfo.quizzes.title;
        document.getElementById('attempt-number').innerText = `Lần ${lanLam}`;

        const start = new Date(resultInfo.started_at);
        const end = new Date(resultInfo.submitted_at);

        document.getElementById('start-time').innerText = start.toLocaleString('vi-VN');
        document.getElementById('end-time').innerText = end.toLocaleString('vi-VN');

        const phut = Math.floor(resultInfo.time_taken / 60);
        const giay = resultInfo.time_taken % 60;
        document.getElementById('total-time').innerText = `${phut} phút ${giay} giây`;

        // Gắn sự kiện chuyển hướng về Sảnh chờ cho nút bấm
        document.getElementById('btn-back-detail').onclick = function() {
            window.location.href = `chi-tiet-bai-thi.html?quiz_id=${resultInfo.quiz_id}`;
        };

        // 4. Lấy Đề bài và Bài làm chi tiết
        const { data: questionsData, error: qErr } = await supabaseClient
            .from('questions').select('*').eq('quiz_id', resultInfo.quiz_id);
            
        const { data: answers, error: aErr } = await supabaseClient
            .from('student_answers').select('*').eq('result_id', resultId);

        if (qErr || aErr) throw qErr;

        // ÉP KIỂU SẮP XẾP LẠI THEO TỪNG PHẦN ĐỂ IN TIÊU ĐỀ KHÔNG BỊ LỖI LỘN XỘN
        const mcq = questionsData.filter(c => c.type === 'MCQ');
        const tf = questionsData.filter(c => c.type === 'TRUE_FALSE');
        const sa = questionsData.filter(c => c.type === 'SHORT_ANSWER');
        const essay = questionsData.filter(c => c.type === 'ESSAY');
        const questions = [...mcq, ...tf, ...sa, ...essay];

        // 5. Kết xuất Chi tiết từng câu và Lời giải
        const reviewArea = document.getElementById('review-area');
        reviewArea.innerHTML = '';

        let currentType = '';
        let phanCount = 1;
        let sttCau = 1;

        questions.forEach((cau) => {
            let html = '';

            // NẾU SANG LOẠI CÂU HỎI MỚI -> IN TIÊU ĐỀ PHẦN VÀ HƯỚNG DẪN
            if (cau.type !== currentType) {
                let tenPhan = "";
                let huongDan = "";
                
                if (cau.type === 'MCQ') {
                    tenPhan = `PHẦN ${phanCount++}. TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN LỰA CHỌN`;
                    huongDan = "Thí sinh chọn phương án đúng nhất cho mỗi câu hỏi.";
                } else if (cau.type === 'TRUE_FALSE') {
                    tenPhan = `PHẦN ${phanCount++}. TRẮC NGHIỆM ĐÚNG/SAI`;
                    huongDan = "Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn ĐÚNG hoặc SAI.";
                } else if (cau.type === 'SHORT_ANSWER') {
                    tenPhan = `PHẦN ${phanCount++}. TRẢ LỜI NGẮN`;
                    huongDan = "Thí sinh điền đáp án cuối cùng vào ô trống.";
                } else if (cau.type === 'ESSAY') {
                    tenPhan = `PHẦN ${phanCount++}. TỰ LUẬN`;
                    huongDan = "Thí sinh trình bày bài giải chi tiết.";
                }

                html += `
                    <h3 style="color: #2b3674; margin: 40px 0 10px 0; padding-bottom: 10px; border-bottom: 3px solid #4318ff; text-transform: uppercase; font-size: 18px;">
                        📝 ${tenPhan}
                    </h3>
                    <p style="color: #047857; font-style: italic; margin-bottom: 25px; font-size: 15px; background: #ecfdf5; padding: 10px 15px; border-radius: 8px;">
                        👉 <strong>Hướng dẫn:</strong> ${huongDan}
                    </p>`;
                
                currentType = cau.type;
            }

            // XỬ LÝ NỘI DUNG CÂU HỎI
            const ansObj = answers.find(a => a.question_id === cau.id);
            const hsChon = ansObj ? ansObj.student_text : "";
            const isCorrect = ansObj ? ansObj.is_correct : false;

            const boxColor = isCorrect ? '#ecfdf5' : '#fef2f2';
            const borderColor = isCorrect ? '#05cd99' : '#f87171';
            const icon = isCorrect ? '✅ ĐÚNG' : '❌ SAI';

            html += `<div class="question-card" style="background: ${boxColor}; border-left: 5px solid ${borderColor}; margin-bottom: 25px; padding: 20px;">
                            <div style="font-weight: bold; color: ${borderColor}; margin-bottom: 10px; font-size: 16px;">${icon}</div>
                            <div class="question-title" style="margin-bottom: 15px;"><strong>Câu ${sttCau++}:</strong> ${cau.content}</div>`;
            
            if (cau.image_url) {
                html += `<img src="${cau.image_url}" style="max-height: 250px; display: block; margin-bottom: 15px; border-radius: 8px;">`;
            }

            // DỰNG LẠI GIAO DIỆN LÀM BÀI THEO TỪNG LOẠI
            if (cau.type === 'MCQ') {
                const dapAnDungChu = String.fromCharCode(65 + parseInt(cau.correct_answer));
                html += `<div style="margin-bottom: 15px;">`;
                cau.options.forEach((opt, i) => {
                    const isChecked = (hsChon === String(i)) ? "checked" : "";
                    const labelStyle = isChecked ? "color: #4318ff; font-weight: bold;" : "color: #2b3674;";
                    html += `<label class="mcq-option" style="${labelStyle}">
                                <input type="radio" disabled ${isChecked}> ${String.fromCharCode(65 + i)}. ${opt}
                             </label>`;
                });
                html += `</div>
                         <div style="color: #047857; font-weight: bold; font-size: 15px;">🎯 Đáp án chuẩn: ${dapAnDungChu}</div>`;
            } 
            else if (cau.type === 'TRUE_FALSE') {
                let hsChonParsed = {};
                try { hsChonParsed = hsChon ? JSON.parse(hsChon) : {}; } catch(e) {}
                
                let chuoiDapAnDung = [];
                
                html += `<table class="tf-table" style="background: white; margin-bottom: 15px;">
                            <tr><th>Nội dung</th><th>Đúng</th><th>Sai</th></tr>`;
                ['a', 'b', 'c', 'd'].forEach(id => {
                    const isTrue = hsChonParsed[id] === 'true' ? 'checked' : '';
                    const isFalse = hsChonParsed[id] === 'false' ? 'checked' : '';
                    html += `<tr>
                                <td class="tf-content" style="text-align: left;">${id}) ${cau.options[id].text}</td>
                                <td><input type="radio" disabled ${isTrue}></td>
                                <td><input type="radio" disabled ${isFalse}></td>
                             </tr>`;
                    chuoiDapAnDung.push(cau.options[id].ans === 'true' ? 'T' : 'F');
                });
                html += `</table>
                         <div style="color: #047857; font-weight: bold; font-size: 15px;">🎯 Đáp án chuẩn: ${chuoiDapAnDung.join('-')}</div>`;
            }
            else if (cau.type === 'SHORT_ANSWER') {
                html += `<div style="margin-bottom: 15px; font-size: 15px;">
                            <strong>Em điền:</strong> <span style="background: white; padding: 5px 15px; border-radius: 5px; border: 1px solid #ccc;">${hsChon || "Bỏ trống"}</span>
                         </div>
                         <div style="color: #047857; font-weight: bold; font-size: 15px;">🎯 Đáp án chuẩn: ${cau.correct_answer}</div>`;
            }
            else if (cau.type === 'ESSAY') {
                html += `<textarea class="essay-box" disabled style="background: #f8fafc; color: #334155;">${hsChon || ""}</textarea>
                         <div style="color: #d32f2f; margin-top: 10px; font-weight: bold; font-size: 15px;">⏳ Đang chờ Giáo viên chấm điểm</div>`;
            }

            // LỜI GIẢI CHI TIẾT
            if (cau.detailed_solution || cau.solution_image_url) {
                html += `<div style="margin-top: 20px; padding: 15px; background: #ffffff; border: 1px dashed #047857; border-radius: 8px;">
                            <strong style="color: #047857;">💡 Lời giải chi tiết:</strong><br>
                            <div style="margin-top: 10px; color: #333;">${cau.detailed_solution || ""}</div>`;
                if (cau.solution_image_url) {
                    html += `<img src="${cau.solution_image_url}" style="max-height: 250px; display: block; margin-top: 15px; border-radius: 8px; border: 1px solid #ccc;">`;
                }
                html += `</div>`;
            }

            html += `</div>`;
            reviewArea.innerHTML += html;
        });


        if (window.MathJax) {
            MathJax.typesetPromise([reviewArea]).catch(err => console.log(err));
        }

    } catch (err) {
        console.error(err);
        document.getElementById('review-area').innerHTML = "<p style='color:red; text-align:center;'>Lỗi tải kết quả từ hệ thống!</p>";
    }
}

taiBaoCaoKetQua();