const SUPABASE_URL = 'https://uegakipjmyclfmbwouny.supabase.co';

const SUPABASE_ANON_KEY = 'sb_publishable_TyIY5alerxcalauoMQR5bQ_S0LkyWHg';

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

async function testConnection() {
    try {
        console.log("Đang thử kết nối tới Supabase...");

        const { data, error } = await supabaseClient
            .from('quizzes')
            .select('*');

        if (error) {
            console.error("❌ Lỗi kết nối Supabase:", error.message);
            return;
        }

        console.log("✅ Kết nối Supabase thành công!");
        console.log("Dữ liệu bảng quizzes hiện tại:", data);

    } catch (err) {
        console.error("Đã xảy ra lỗi không xác định:", err);
    }
}

testConnection();