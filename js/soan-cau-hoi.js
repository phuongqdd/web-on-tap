// js/soan-cau-hoi.js

// 1. Kiểm tra bảo mật
const userNow = localStorage.getItem("currentUser");
if (!userNow || JSON.parse(userNow).role !== "TEACHER") {
    window.location.href = "login.html";
}

// 2. Lấy ID bài kiểm tra từ thanh địa chỉ (URL)
const urlParams = new URLSearchParams(window.location.search);
const quizId = urlParams.get("quiz_id");

let fileAnhCauHoi = null;
let fileAnhLoiGiai = null;

if (!quizId) {
    alert("Lỗi: Không tìm thấy ID bài kiểm tra!");
    window.location.href = "index.html";
}else {
    taiDanhSachCauHoi(); // THÊM DÒNG NÀY ĐỂ TẢI DANH SÁCH KHI MỞ TRANG
}

// 3. Hàm thay đổi khu vực nhập đáp án tùy theo loại câu hỏi

function doiLoaiCauHoi() {
    const type = document.getElementById("question-type").value;
    const area = document.getElementById("dynamic-answer-area");

    let htmlContent = "";

    if (type === "MCQ") {
        htmlContent = `
            <label>Nhập 4 lựa chọn và tick vào đáp án ĐÚNG:</label>
            <div id="options-container">
                <div class="option-row"><input type="radio" name="correct_mcq" value="0" checked> <input type="text" id="opt-0" placeholder="Lựa chọn A"></div>
                <div class="option-row"><input type="radio" name="correct_mcq" value="1"> <input type="text" id="opt-1" placeholder="Lựa chọn B"></div>
                <div class="option-row"><input type="radio" name="correct_mcq" value="2"> <input type="text" id="opt-2" placeholder="Lựa chọn C"></div>
                <div class="option-row"><input type="radio" name="correct_mcq" value="3"> <input type="text" id="opt-3" placeholder="Lựa chọn D"></div>
            </div>
        `;
    } else if (type === "TRUE_FALSE") {
        htmlContent = `
            <div style="background: #eef2ff; padding: 15px; border-radius: 10px; border-left: 4px solid #4318ff;">
                <label style="color: #4318ff; margin-bottom: 10px;">Cấu trúc Đúng/Sai mới của Bộ GD&ĐT:</label>
                <p style="font-size: 14px; color: #555; margin-bottom: 15px;">Mỗi câu hỏi sẽ bao gồm 4 ý (a, b, c, d). Học sinh chọn Đúng/Sai cho từng ý.</p>
                
                <div class="tf-item" style="margin-bottom: 10px; display: flex; align-items: center; gap: 10px;">
                    <span style="font-weight: bold; width: 20px;">a)</span> 
                    <input type="text" id="tf-text-a" placeholder="Nội dung ý a..." style="flex-grow: 1; padding: 8px;">
                    <select id="tf-ans-a" style="padding: 8px; border-radius: 5px;">
                        <option value="true">Đúng</option>
                        <option value="false">Sai</option>
                    </select>
                </div>
                
                <div class="tf-item" style="margin-bottom: 10px; display: flex; align-items: center; gap: 10px;">
                    <span style="font-weight: bold; width: 20px;">b)</span> 
                    <input type="text" id="tf-text-b" placeholder="Nội dung ý b..." style="flex-grow: 1; padding: 8px;">
                    <select id="tf-ans-b" style="padding: 8px; border-radius: 5px;">
                        <option value="true">Đúng</option>
                        <option value="false">Sai</option>
                    </select>
                </div>
                
                <div class="tf-item" style="margin-bottom: 10px; display: flex; align-items: center; gap: 10px;">
                    <span style="font-weight: bold; width: 20px;">c)</span> 
                    <input type="text" id="tf-text-c" placeholder="Nội dung ý c..." style="flex-grow: 1; padding: 8px;">
                    <select id="tf-ans-c" style="padding: 8px; border-radius: 5px;">
                        <option value="true">Đúng</option>
                        <option value="false">Sai</option>
                    </select>
                </div>
                
                <div class="tf-item" style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-weight: bold; width: 20px;">d)</span> 
                    <input type="text" id="tf-text-d" placeholder="Nội dung ý d..." style="flex-grow: 1; padding: 8px;">
                    <select id="tf-ans-d" style="padding: 8px; border-radius: 5px;">
                        <option value="true">Đúng</option>
                        <option value="false">Sai</option>
                    </select>
                </div>
            </div>
        `;
    } else if (type === "SHORT_ANSWER") {
        // Cấu trúc mới: 4 ô trống đúng chuẩn Bộ GD&ĐT 2025
        htmlContent = `
            <div style="background: #eef2ff; padding: 15px; border-radius: 10px; border-left: 4px solid #d32f2f;">
                <label style="color: #d32f2f; margin-bottom: 10px;">Trắc nghiệm Trả lời ngắn (Chuẩn 2025):</label>
                <p style="font-size: 14px; color: #555; margin-bottom: 15px;">Theo Phiếu TLTN mẫu mới, đáp án tối đa có <b>4 ô</b> (chứa chữ số, dấu âm "-", dấu phẩy "," hoặc phân số "/").</p>
                
                <label style="text-align: center; display: block; font-weight: bold; color: #2b3674;">Nhập đáp án đúng (Mỗi ô 1 ký tự):</label>
                
                <div style="display: flex; gap: 15px; justify-content: center; margin-top: 15px;">
                    <!-- Ô 1 -->
                    <input type="text" id="short-box-1" maxlength="1" placeholder="-" style="width: 55px; height: 55px; text-align: center; font-size: 24px; font-weight: bold; border: 2px dashed #d32f2f; border-radius: 8px; background: white;">
                    <!-- Ô 2 -->
                    <input type="text" id="short-box-2" maxlength="1" placeholder="1" style="width: 55px; height: 55px; text-align: center; font-size: 24px; font-weight: bold; border: 2px dashed #d32f2f; border-radius: 8px; background: white;">
                    <!-- Ô 3 -->
                    <input type="text" id="short-box-3" maxlength="1" placeholder="," style="width: 55px; height: 55px; text-align: center; font-size: 24px; font-weight: bold; border: 2px dashed #d32f2f; border-radius: 8px; background: white;">
                    <!-- Ô 4 -->
                    <input type="text" id="short-box-4" maxlength="1" placeholder="5" style="width: 55px; height: 55px; text-align: center; font-size: 24px; font-weight: bold; border: 2px dashed #d32f2f; border-radius: 8px; background: white;">
                </div>
                
                <p style="font-size: 13px; color: #707eae; text-align: center; margin-top: 15px;"><i>Mẹo: Nếu đáp án là <b>5</b>, thầy chỉ cần điền số 5 vào ô đầu tiên, 3 ô sau để trống.</i></p>
            </div>
        `;
    } else if (type === "ESSAY") {
        htmlContent = `
            <label>Thiết lập Tự luận:</label>
            <div style="margin-top: 10px; padding: 15px; background: #fff3cd; border: 1px solid #ffeeba; border-radius: 10px; color: #856404;">
                <i>ℹ️ Hệ thống sẽ cung cấp khung soạn thảo rộng để học sinh tự trình bày lời giải. Thầy sẽ chấm điểm thủ công sau.</i>
            </div>
        `;
    }

    area.innerHTML = htmlContent;

    // Tự động nhảy sang ô tiếp theo khi nhập xong 1 ký tự (Giúp gõ nhanh hơn)
    if (type === "SHORT_ANSWER") {
        setTimeout(() => {
            for (let i = 1; i <= 3; i++) {
                let current = document.getElementById("short-box-" + i);
                let next = document.getElementById("short-box-" + (i + 1));
                if (current && next) {
                    current.addEventListener("input", function () {
                        if (this.value.length === 1) next.focus();
                    });
                }
            }
        }, 100);
    }
}

// Khởi tạo giao diện lần đầu tiên chạy
doiLoaiCauHoi();

// ==========================================
// CHỨC NĂNG XEM TRƯỚC (PREVIEW) - BẢN CHỐNG LỖI
// ==========================================
function xemTruoc() {
    const questionTextElem = document.getElementById('question-text');
    const typeElem = document.getElementById('question-type');
    const previewContent = document.getElementById('preview-content');
    const modal = document.getElementById('preview-modal');

    // Kiểm tra an toàn: Báo lỗi trong Console thay vì crash trang
    if (!questionTextElem || !typeElem || !previewContent || !modal) {
        console.error("Thiếu phần tử HTML cốt lõi, không thể mở khung xem trước!");
        return;
    }

    const questionText = questionTextElem.value;
    const type = typeElem.value;
    
    if (!questionText.trim()) {
        alert("Thầy vui lòng nhập nội dung câu hỏi trước khi xem!");
        return;
    }

    // LẤY ẢNH ĐỀ BÀI (Rút trích an toàn)
    const imgCauHoiElem = document.getElementById('preview-img-question');
    const containerCauHoiElem = document.getElementById('preview-container-question');
    
    const imgCauHoi = imgCauHoiElem ? imgCauHoiElem.src : "";
    const hienThiImgCauHoi = containerCauHoiElem ? containerCauHoiElem.style.display === 'block' : false;

    let html = `<div style="margin-bottom: 20px;"><strong>Câu hỏi:</strong> <br>${questionText}</div>`;

    // Chỉ hiển thị ảnh nếu đường link hợp lệ
    if (hienThiImgCauHoi && imgCauHoi && !imgCauHoi.endsWith(window.location.pathname)) {
        html += `<div style="text-align: center; margin-bottom: 20px;">
                    <img src="${imgCauHoi}" style="max-width: 100%; border-radius: 8px; border: 1px solid #ccc;">
                 </div>`;
    }

    html += `<div><strong>Phần Trả lời:</strong><br>`;

    // GHÉP GIAO DIỆN ĐÁP ÁN THEO TỪNG LOẠI BÀI (Trích xuất an toàn)
    if (type === 'MCQ') {
        const optA = document.getElementById('opt-0') ? document.getElementById('opt-0').value : "...";
        const optB = document.getElementById('opt-1') ? document.getElementById('opt-1').value : "...";
        const optC = document.getElementById('opt-2') ? document.getElementById('opt-2').value : "...";
        const optD = document.getElementById('opt-3') ? document.getElementById('opt-3').value : "...";
        
        html += `<div style="margin-top: 10px;">
                    <p>A. ${optA}</p>
                    <p>B. ${optB}</p>
                    <p>C. ${optC}</p>
                    <p>D. ${optD}</p>
                 </div>`;
    } 
    else if (type === 'TRUE_FALSE') {
        const a = document.getElementById('tf-text-a') ? document.getElementById('tf-text-a').value : "...";
        const b = document.getElementById('tf-text-b') ? document.getElementById('tf-text-b').value : "...";
        const c = document.getElementById('tf-text-c') ? document.getElementById('tf-text-c').value : "...";
        const d = document.getElementById('tf-text-d') ? document.getElementById('tf-text-d').value : "...";
        
        html += `
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px; border: 1px solid #ccc;">
                <tr style="background: #f4f7fe;"><th style="border: 1px solid #ccc; padding: 8px;">Nội dung</th><th style="border: 1px solid #ccc; padding: 8px; width: 60px;">Đúng</th><th style="border: 1px solid #ccc; padding: 8px; width: 60px;">Sai</th></tr>
                <tr><td style="border: 1px solid #ccc; padding: 8px;">a) ${a}</td><td style="border: 1px solid #ccc; text-align:center;">⭕</td><td style="border: 1px solid #ccc; text-align:center;">⭕</td></tr>
                <tr><td style="border: 1px solid #ccc; padding: 8px;">b) ${b}</td><td style="border: 1px solid #ccc; text-align:center;">⭕</td><td style="border: 1px solid #ccc; text-align:center;">⭕</td></tr>
                <tr><td style="border: 1px solid #ccc; padding: 8px;">c) ${c}</td><td style="border: 1px solid #ccc; text-align:center;">⭕</td><td style="border: 1px solid #ccc; text-align:center;">⭕</td></tr>
                <tr><td style="border: 1px solid #ccc; padding: 8px;">d) ${d}</td><td style="border: 1px solid #ccc; text-align:center;">⭕</td><td style="border: 1px solid #ccc; text-align:center;">⭕</td></tr>
            </table>`;
    }
    else if (type === 'SHORT_ANSWER') {
        html += `
            <div style="margin-top: 15px; display: flex; justify-content: flex-start; gap: 10px;">
                <div style="width: 45px; height: 45px; border: 2px dashed #d32f2f; border-radius: 5px;"></div>
                <div style="width: 45px; height: 45px; border: 2px dashed #d32f2f; border-radius: 5px;"></div>
                <div style="width: 45px; height: 45px; border: 2px dashed #d32f2f; border-radius: 5px;"></div>
                <div style="width: 45px; height: 45px; border: 2px dashed #d32f2f; border-radius: 5px;"></div>
            </div>`;
    }
    else if (type === 'ESSAY') {
        html += `<div style="margin-top: 10px; width: 100%; height: 100px; border: 1px solid #ccc; border-radius: 5px; background: #fafbfc; padding: 10px; color: #aaa;">Học sinh trình bày tự luận vào khung này...</div>`;
    }

    html += `</div>`;
    
    // LẤY LỜI GIẢI VÀ ẢNH LỜI GIẢI (Rút trích an toàn)
    const expElem = document.getElementById('explanation');
    const explanation = expElem ? expElem.value.trim() : "";
    
    const imgLoiGiaiElem = document.getElementById('preview-img-solution');
    const containerLoiGiaiElem = document.getElementById('preview-container-solution');
    
    const imgLoiGiai = imgLoiGiaiElem ? imgLoiGiaiElem.src : "";
    const hienThiImgLoiGiai = containerLoiGiaiElem ? containerLoiGiaiElem.style.display === 'block' : false;

    if (explanation || hienThiImgLoiGiai) {
        html += `<div style="margin-top: 20px; padding-top: 15px; border-top: 1px dashed #ccc; color: #047857;">
                    <strong>💡 Lời giải chi tiết:</strong><br>
                    ${explanation}
                 </div>`;
        if (hienThiImgLoiGiai && imgLoiGiai && !imgLoiGiai.endsWith(window.location.pathname)) {
            html += `<div style="text-align: center; margin-top: 15px;">
                        <img src="${imgLoiGiai}" style="max-width: 100%; border-radius: 8px; border: 1px solid #047857;">
                     </div>`;
        }
    }
    
    // MỞ POPUP XEM TRƯỚC
    previewContent.innerHTML = html;
    modal.style.display = 'flex';

    // Gọi MathJax render công thức Toán
    if (window.MathJax) {
        MathJax.typesetPromise([previewContent]).catch((err) => console.log('MathJax error: ', err.message));
    }
}

// Hàm tắt Popup
function dongXemTruoc() {
    document.getElementById("preview-modal").style.display = "none";
}

// ==========================================
// CHỨC NĂNG CHỌN ẢNH VÀ XEM TRƯỚC CỤC BỘ
// ==========================================
function taiAnhLen(event, loai) {
    const file = event.target.files[0];
    
    // Tự động trỏ đúng vào các ID của đề bài hoặc lời giải
    const idPrefix = loai === 'cau_hoi' ? 'question' : 'solution';
    const statusText = document.getElementById(`upload-status-${idPrefix}`);
    const previewContainer = document.getElementById(`preview-container-${idPrefix}`);
    const previewImg = document.getElementById(`preview-img-${idPrefix}`);

    if (!file) {
        if (loai === 'cau_hoi') fileAnhCauHoi = null;
        else fileAnhLoiGiai = null;
        previewContainer.style.display = 'none';
        return;
    }

    // Lưu vào biến toàn cục tương ứng
    if (loai === 'cau_hoi') fileAnhCauHoi = file;
    else fileAnhLoiGiai = file;

    // Xem trước cục bộ
    const localUrl = URL.createObjectURL(file);
    previewImg.src = localUrl;
    previewContainer.style.display = 'block';
    
    statusText.style.color = '#05cd99';
    statusText.innerText = '✅ Đã nháp ảnh!';
}

// 4. Các hàm Lưu lên Supabase (Chúng ta sẽ viết tiếp sau khi thầy thiết lập xong giao diện)
async function luuCauHoi() {
    const statusMsg = document.getElementById('msg');
    const questionText = document.getElementById('question-text').value.trim();
    const type = document.getElementById('question-type').value;
    const explanation = document.getElementById('explanation').value.trim();
    
    if (!questionText) {
        alert("Vui lòng nhập nội dung câu hỏi!");
        return;
    }

    statusMsg.style.color = "blue";
    statusMsg.innerText = "Đang xử lý...";

    let finalImageUrl = null;
    let finalSolutionImageUrl = null;

    // 1. XỬ LÝ TẢI 2 ẢNH LÊN SUPABASE (Nếu có)
    statusMsg.innerText = "Đang kiểm tra và tải ảnh...";
    
    // Hàm phụ để tải ảnh lên Supabase
    async function uploadToSupabase(fileObj) {
        const fileExt = fileObj.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.floor(Math.random()*1000)}.${fileExt}`;
        const filePath = `questions/${fileName}`;
        
        const { error } = await supabaseClient.storage.from('images').upload(filePath, fileObj);
        if (error) throw error;
        
        const { data } = supabaseClient.storage.from('images').getPublicUrl(filePath);
        return data.publicUrl;
    }

    try {
        if (fileAnhCauHoi) finalImageUrl = await uploadToSupabase(fileAnhCauHoi);
        if (fileAnhLoiGiai) finalSolutionImageUrl = await uploadToSupabase(fileAnhLoiGiai);
    } catch (err) {
        statusMsg.style.color = "red";
        statusMsg.innerText = "Lỗi tải ảnh lên máy chủ!";
        console.error(err);
        return;
    }

    // 2. THU THẬP ĐÁP ÁN THEO TỪNG LOẠI CÂU HỎI
    let optionsJson = null;
    let correctAnswer = null;

    if (type === 'MCQ') {
        const opt0 = document.getElementById('opt-0').value.trim();
        const opt1 = document.getElementById('opt-1').value.trim();
        const opt2 = document.getElementById('opt-2').value.trim();
        const opt3 = document.getElementById('opt-3').value.trim();
        
        if (!opt0 || !opt1 || !opt2 || !opt3) {
            statusMsg.style.color = "red";
            statusMsg.innerText = "Vui lòng nhập đủ 4 lựa chọn!";
            return;
        }
        
        optionsJson = [opt0, opt1, opt2, opt3];
        
        const radios = document.getElementsByName('correct_mcq');
        for (let radio of radios) {
            if (radio.checked) {
                correctAnswer = radio.value;
                break;
            }
        }
    } else if (type === 'TRUE_FALSE') {
        optionsJson = {
            a: { text: document.getElementById('tf-text-a').value.trim(), ans: document.getElementById('tf-ans-a').value },
            b: { text: document.getElementById('tf-text-b').value.trim(), ans: document.getElementById('tf-ans-b').value },
            c: { text: document.getElementById('tf-text-c').value.trim(), ans: document.getElementById('tf-ans-c').value },
            d: { text: document.getElementById('tf-text-d').value.trim(), ans: document.getElementById('tf-ans-d').value }
        };
        correctAnswer = "complex_tf"; 
    } else if (type === 'SHORT_ANSWER') {
        const b1 = document.getElementById('short-box-1').value || "";
        const b2 = document.getElementById('short-box-2').value || "";
        const b3 = document.getElementById('short-box-3').value || "";
        const b4 = document.getElementById('short-box-4').value || "";
        correctAnswer = (b1 + b2 + b3 + b4).trim();
        
        if(!correctAnswer) {
            statusMsg.style.color = "red";
            statusMsg.innerText = "Vui lòng nhập đáp án ngắn!";
            return;
        }
    } else if (type === 'ESSAY') {
        correctAnswer = "essay";
    }

    // 3. LƯU DỮ LIỆU VÀO DATABASE
    statusMsg.innerText = "Đang lưu câu hỏi...";
    
    try {
        const { error } = await supabaseClient
            .from('questions')
            .insert([
                { 
                    quiz_id: quizId, 
                    type: type, 
                    content: questionText, 
                    options: optionsJson,
                    correct_answer: correctAnswer,
                    detailed_solution: explanation, 
                    image_url: finalImageUrl,
                    solution_image_url: finalSolutionImageUrl
                }
            ]);

        if (error) throw error;

        statusMsg.style.color = "green";
        statusMsg.innerText = "✅ Lưu câu hỏi thành công!";
        
        // 4. RESET KHUNG NHẬP LIỆU ĐỂ SOẠN CÂU MỚI
        document.getElementById('question-text').value = '';
        document.getElementById('explanation').value = '';
        
        if (type === 'MCQ') {
            document.getElementById('opt-0').value = '';
            document.getElementById('opt-1').value = '';
            document.getElementById('opt-2').value = '';
            document.getElementById('opt-3').value = '';
            document.getElementsByName('correct_mcq')[0].checked = true;
        } else if (type === 'TRUE_FALSE') {
            ['a', 'b', 'c', 'd'].forEach(id => document.getElementById(`tf-text-${id}`).value = '');
            ['a', 'b', 'c', 'd'].forEach(id => document.getElementById(`tf-ans-${id}`).value = 'true');
        } else if (type === 'SHORT_ANSWER') {
            ['1', '2', '3', '4'].forEach(id => document.getElementById(`short-box-${id}`).value = '');
        }
        
        // Reset toàn bộ khu vực ảnh đính kèm
        fileAnhCauHoi = null;
        fileAnhLoiGiai = null;
        document.getElementById('image-upload-question').value = '';
        document.getElementById('image-upload-solution').value = '';
        document.getElementById('preview-container-question').style.display = 'none';
        document.getElementById('preview-container-solution').style.display = 'none';
        document.getElementById('upload-status-question').innerText = '';
        document.getElementById('upload-status-solution').innerText = '';

        document.getElementById('upload-status-question').innerText = '';
        document.getElementById('upload-status-solution').innerText = '';

        taiDanhSachCauHoi();
        
    } catch (err) {
        statusMsg.style.color = "red";
        statusMsg.innerText = "Lỗi mạng khi lưu câu hỏi!";
        console.error(err);
    }
}

// ==========================================
// QUẢN LÝ DANH SÁCH CÂU HỎI BÊN CỘT PHẢI
// ==========================================

// 1. Tải danh sách từ Database
async function taiDanhSachCauHoi() {
    try {
        const { data, error } = await supabaseClient
            .from('questions')
            .select('*')
            .eq('quiz_id', quizId)
            .order('created_at', { ascending: true }); // Xếp theo thứ tự tạo: cũ đến mới

        if (error) throw error;
        hienThiDanhSachCauHoi(data);
    } catch (err) {
        console.error("Lỗi tải danh sách câu hỏi:", err);
    }
}

// 2. Vẽ giao diện danh sách ra màn hình
function hienThiDanhSachCauHoi(danhSach) {
    const container = document.getElementById('question-list-container');
    const header = document.getElementById('question-count-header');
    
    if(!container || !header) return;

    // Cập nhật số lượng trên tiêu đề
    header.innerHTML = `📋 Danh sách câu hỏi (${danhSach.length})`;
    container.innerHTML = '';

    if (danhSach.length === 0) {
        container.innerHTML = '<p style="color: #888; font-style: italic; text-align: center;">Chưa có câu hỏi nào trong bài kiểm tra này.</p>';
        return;
    }

    // Duyệt qua từng câu và vẽ HTML
    danhSach.forEach((cau, index) => {
        // Cắt ngắn nội dung nếu quá dài để giao diện gọn gàng
        let noiDungNgan = cau.content.length > 50 ? cau.content.substring(0, 50) + '...' : cau.content;
        let loaiCau = cau.type === 'MCQ' ? 'Trắc nghiệm' : 
                     (cau.type === 'TRUE_FALSE' ? 'Đúng/Sai' : 
                     (cau.type === 'SHORT_ANSWER' ? 'Trả lời ngắn' : 'Tự luận'));

        container.innerHTML += `
            <div style="background: #f4f7fe; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 12px;">
                <div style="font-weight: bold; color: #2b3674; margin-bottom: 5px;">
                    Câu ${index + 1}: <span style="font-weight: normal;">${noiDungNgan}</span>
                </div>
                <div style="font-size: 12px; color: #4318ff; margin-bottom: 10px; font-weight: bold;">
                    [${loaiCau}]
                </div>
                <div style="display: flex; gap: 8px;">
                    <button onclick="alert('Chức năng Xem lại đang hoàn thiện')" style="background: #e2e8f0; color: #2b3674; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; font-size: 13px; font-weight: bold; flex: 1;">👀 Xem</button>
                    <button onclick="alert('Chức năng Sửa đang hoàn thiện')" style="background: #fef08a; color: #854d0e; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; font-size: 13px; font-weight: bold; flex: 1;">✏️ Sửa</button>
                    <button onclick="xoaCauHoi('${cau.id}')" style="background: #fecaca; color: #991b1b; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; font-size: 13px; font-weight: bold; flex: 1;">🗑️ Xóa</button>
                </div>
            </div>
        `;
    });
    
    // Yêu cầu MathJax dịch lại các công thức Toán học trong phần danh sách
    if (window.MathJax) {
        MathJax.typesetPromise([container]).catch((err) => console.log('MathJax error:', err));
    }
}

// 3. Hàm Xóa câu hỏi trực tiếp
async function xoaCauHoi(idCauHoi) {
    if(!confirm("Thầy có chắc chắn muốn xóa câu hỏi này không?")) return;
    
    try {
        const { error } = await supabaseClient.from('questions').delete().eq('id', idCauHoi);
        if (error) throw error;
        
        // Tải lại danh sách sau khi xóa thành công
        taiDanhSachCauHoi(); 
    } catch (err) {
        console.error(err);
        alert("Lỗi khi xóa câu hỏi. Vui lòng kiểm tra kết nối mạng!");
    }
}


// ==========================================
// HÀM HOÀN TẤT VÀ QUAY VỀ TRANG CHỦ
// ==========================================
function hoanTatBai() {
    window.location.href = 'index.html';
}
