export interface CurriculumTopicItem {
  name: string;
  category: string;
  semester: 1 | 2;
  isHot?: boolean;
}

export interface SubjectMeta {
  id: string;
  label: string;
  shortName: string;
  icon: string;
  color: string;
  grades: string[];
}

export const PRIMARY_GRADES = [
  { id: "Lớp 1", label: "Lớp 1 🎒", desc: "Trực quan & Làm quen" },
  { id: "Lớp 2", label: "Lớp 2 ✏️", desc: "Đọc hiểu & Tính toán cơ bản" },
  { id: "Lớp 3", label: "Lớp 3 📚", desc: "Tư duy logic & Vận dụng" },
  { id: "Lớp 4", label: "Lớp 4 📐", desc: "Quy tắc, Phân số & Khám phá" },
  { id: "Lớp 5", label: "Lớp 5 🎓", desc: "Tổng hợp, Số thập phân & Nâng cao" },
];

export const PRIMARY_SUBJECTS: SubjectMeta[] = [
  { id: "Toán", label: "Toán 📐", shortName: "Toán", icon: "📐", color: "from-blue-500 to-indigo-600", grades: ["Lớp 1", "Lớp 2", "Lớp 3", "Lớp 4", "Lớp 5"] },
  { id: "Tiếng Việt", label: "Tiếng Việt 📖", shortName: "Tiếng Việt", icon: "📖", color: "from-rose-500 to-pink-600", grades: ["Lớp 1", "Lớp 2", "Lớp 3", "Lớp 4", "Lớp 5"] },
  { id: "Khoa học", label: "Tự nhiên & Xã hội / Khoa học 🔬", shortName: "Khoa học", icon: "🔬", color: "from-emerald-500 to-teal-600", grades: ["Lớp 1", "Lớp 2", "Lớp 3", "Lớp 4", "Lớp 5"] },
  { id: "Lịch sử & Địa lý", label: "Lịch sử & Địa lý 🌍", shortName: "Lịch sử - Địa lý", icon: "🌍", color: "from-amber-500 to-orange-600", grades: ["Lớp 1", "Lớp 2", "Lớp 3", "Lớp 4", "Lớp 5"] },
  { id: "Tiếng Anh", label: "Tiếng Anh 🇬🇧", shortName: "Tiếng Anh", icon: "🇬🇧", color: "from-violet-500 to-purple-600", grades: ["Lớp 1", "Lớp 2", "Lớp 3", "Lớp 4", "Lớp 5"] },
  { id: "Tin học", label: "Tin học & Công nghệ 💻", shortName: "Tin học", icon: "💻", color: "from-cyan-500 to-blue-600", grades: ["Lớp 1", "Lớp 2", "Lớp 3", "Lớp 4", "Lớp 5"] },
  { id: "Đạo đức", label: "Đạo đức 💖", shortName: "Đạo đức", icon: "💖", color: "from-red-500 to-rose-600", grades: ["Lớp 1", "Lớp 2", "Lớp 3", "Lớp 4", "Lớp 5"] },
  { id: "Hoạt động trải nghiệm", label: "Hoạt động trải nghiệm 🎈", shortName: "Trải nghiệm", icon: "🎈", color: "from-teal-500 to-green-600", grades: ["Lớp 1", "Lớp 2", "Lớp 3", "Lớp 4", "Lớp 5"] },
];

export const CURRICULUM_BOOKS = [
  "Chuẩn Bộ GD&ĐT (Chung)",
  "Kết nối tri thức với cuộc sống",
  "Cánh Diều",
  "Chân trời sáng tạo",
];

// Rich curriculum topics mapped by "Subject-Grade"
export const COMPREHENSIVE_TOPICS: Record<string, CurriculumTopicItem[]> = {
  // TOÁN LỚP 1
  "Toán-Lớp 1": [
    { name: "Các số từ 0 đến 10", category: "Số học", semester: 1, isHot: true },
    { name: "Phép cộng trong phạm vi 10", category: "Phép tính", semester: 1, isHot: true },
    { name: "Phép trừ trong phạm vi 10", category: "Phép tính", semester: 1, isHot: true },
    { name: "Hình vuông, hình tròn, hình tam giác, chữ nhật", category: "Hình học", semester: 1, isHot: true },
    { name: "So sánh nhiều hơn, ít hơn, bằng nhau", category: "So sánh", semester: 1 },
    { name: "Vị trí: Trên - dưới, trước - sau, trái - phải", category: "Không gian", semester: 1 },
    { name: "Các số từ 11 đến 20", category: "Số học", semester: 2, isHot: true },
    { name: "Các số tròn chục và số đến 100", category: "Số học", semester: 2 },
    { name: "Phép cộng dạng 14 + 3 và 20 + 30", category: "Phép tính", semester: 2 },
    { name: "Phép trừ dạng 17 - 3 và 50 - 20", category: "Phép tính", semester: 2 },
    { name: "Cộng, trừ không nhớ trong phạm vi 100", category: "Phép tính", semester: 2, isHot: true },
    { name: "Đo độ dài: Xăng-ti-mét (cm)", category: "Đo lường", semester: 2 },
    { name: "Xem giờ đúng trên đồng hồ", category: "Thời gian", semester: 2, isHot: true },
    { name: "Các ngày trong tuần lễ", category: "Thời gian", semester: 2 },
    { name: "Giải bài toán có lời văn đơn giản", category: "Toán có lời văn", semester: 2, isHot: true },
  ],

  // TOÁN LỚP 2
  "Toán-Lớp 2": [
    { name: "Phép cộng có nhớ trong phạm vi 20", category: "Phép tính", semester: 1, isHot: true },
    { name: "Phép trừ có nhớ trong phạm vi 20", category: "Phép tính", semester: 1, isHot: true },
    { name: "Phép cộng có nhớ trong phạm vi 100", category: "Phép tính", semester: 1, isHot: true },
    { name: "Phép trừ có nhớ trong phạm vi 100", category: "Phép tính", semester: 1, isHot: true },
    { name: "Điểm, đoạn thẳng, đường thẳng, đường cong", category: "Hình học", semester: 1 },
    { name: "Đường gấp khúc và độ dài đường gấp khúc", category: "Hình học", semester: 1 },
    { name: "Đơn vị đo độ dài: Đề-xi-mét (dm), Mét (m)", category: "Đo lường", semester: 1 },
    { name: "Đơn vị đo khối lượng: Ki-lô-gam (kg)", category: "Đo lường", semester: 1 },
    { name: "Đơn vị đo dung tích: Lít (l)", category: "Đo lường", semester: 1 },
    { name: "Ngày - giờ, ngày - tháng", category: "Thời gian", semester: 1, isHot: true },
    { name: "Phép nhân và Bảng nhân 2, nhân 5", category: "Phép nhân chia", semester: 2, isHot: true },
    { name: "Phép chia và Bảng chia 2, chia 5", category: "Phép nhân chia", semester: 2, isHot: true },
    { name: "Các số trong phạm vi 1000", category: "Số học", semester: 2 },
    { name: "Cộng, trừ không nhớ trong phạm vi 1000", category: "Phép tính", semester: 2 },
    { name: "Hình tứ giác, hình trụ, hình cầu", category: "Hình học", semester: 2 },
    { name: "Bài toán về nhiều hơn, ít hơn một số đơn vị", category: "Toán có lời văn", semester: 2, isHot: true },
    { name: "Thu thập, phân loại, kiểm đếm số liệu", category: "Thống kê", semester: 2 },
  ],

  // TOÁN LỚP 3
  "Toán-Lớp 3": [
    { name: "Bảng nhân 6, 7, 8, 9", category: "Phép tính", semester: 1, isHot: true },
    { name: "Bảng chia 6, 7, 8, 9", category: "Phép tính", semester: 1, isHot: true },
    { name: "Góc vuông, góc không vuông & Ê-ke", category: "Hình học", semester: 1, isHot: true },
    { name: "Bảng nhân chia mở rộng và phép chia có dư", category: "Phép tính", semester: 1 },
    { name: "Đơn vị đo: Mi-li-mét (mm), Gam (g), Mi-li-lít (ml)", category: "Đo lường", semester: 1 },
    { name: "Hình tròn, tâm, đường kính, bán kính", category: "Hình học", semester: 1 },
    { name: "Chu vi hình tam giác, hình tứ giác", category: "Hình học", semester: 1 },
    { name: "Chu vi hình chữ nhật và hình vuông", category: "Hình học", semester: 1, isHot: true },
    { name: "Các số trong phạm vi 10 000", category: "Số học", semester: 2 },
    { name: "Các số trong phạm vi 100 000", category: "Số học", semester: 2 },
    { name: "Làm quen với chữ số La Mã", category: "Số học", semester: 2, isHot: true },
    { name: "Diện tích hình chữ nhật và hình vuông", category: "Hình học", semester: 2, isHot: true },
    { name: "Đơn vị đo diện tích: Xăng-ti-mét vuông (cm²)", category: "Đo lường", semester: 2 },
    { name: "Tiền Việt Nam và bài toán tính tiền", category: "Ứng dụng thực tế", semester: 2, isHot: true },
    { name: "Bài toán giải bằng hai bước tính", category: "Toán có lời văn", semester: 2, isHot: true },
    { name: "Bảng số liệu và biểu đồ tranh", category: "Thống kê", semester: 2 },
  ],

  // TOÁN LỚP 4
  "Toán-Lớp 4": [
    { name: "Số có nhiều chữ số - Lớp triệu và lớp triệu", category: "Số học", semester: 1, isHot: true },
    { name: "Tìm số trung bình cộng", category: "Toán có lời văn", semester: 1, isHot: true },
    { name: "Tìm hai số khi biết tổng và hiệu của hai số đó", category: "Toán có lời văn", semester: 1, isHot: true },
    { name: "Góc nhọn, góc tù, góc bẹt", category: "Hình học", semester: 1 },
    { name: "Hai đường thẳng vuông góc, song song", category: "Hình học", semester: 1, isHot: true },
    { name: "Đơn vị đo khối lượng: Yến, tạ, tấn", category: "Đo lường", semester: 1 },
    { name: "Đơn vị đo thời gian: Giây, thế kỉ", category: "Thời gian", semester: 1 },
    { name: "Nhân với số có một, hai, ba chữ số", category: "Phép tính", semester: 1 },
    { name: "Chia cho số có hai, ba chữ số", category: "Phép tính", semester: 1 },
    { name: "Dấu hiệu chia hết cho 2, 5, 9, 3", category: "Số học", semester: 1, isHot: true },
    { name: "Phân số và tính chất cơ bản của phân số", category: "Phân số", semester: 2, isHot: true },
    { name: "Rút gọn và quy đồng mẫu số các phân số", category: "Phân số", semester: 2, isHot: true },
    { name: "Phép cộng và phép trừ phân số", category: "Phân số", semester: 2, isHot: true },
    { name: "Phép nhân và phép chia phân số", category: "Phân số", semester: 2, isHot: true },
    { name: "Hình bình hành và diện tích hình bình hành", category: "Hình học", semester: 2, isHot: true },
    { name: "Hình thoi và diện tích hình thoi", category: "Hình học", semester: 2, isHot: true },
    { name: "Tỉ số và bài toán Tìm hai số khi biết tổng (hiệu) và tỉ số", category: "Toán có lời văn", semester: 2, isHot: true },
    { name: "Tỉ lệ bản đồ và ứng dụng", category: "Ứng dụng thực tế", semester: 2 },
  ],

  // TOÁN LỚP 5
  "Toán-Lớp 5": [
    { name: "Ôn tập và bổ sung về phân số, hỗn số", category: "Phân số", semester: 1 },
    { name: "Khái niệm số thập phân & Hàng của số thập phân", category: "Số thập phân", semester: 1, isHot: true },
    { name: "So sánh và xếp thứ tự các số thập phân", category: "Số thập phân", semester: 1 },
    { name: "Cộng, trừ số thập phân", category: "Số thập phân", semester: 1, isHot: true },
    { name: "Nhân số thập phân với số tự nhiên, số thập phân", category: "Số thập phân", semester: 1, isHot: true },
    { name: "Chia số thập phân (chia cho tự nhiên, chia cho thập phân)", category: "Số thập phân", semester: 1, isHot: true },
    { name: "Tam giác & Diện tích hình tam giác", category: "Hình học", semester: 1, isHot: true },
    { name: "Hình thang & Diện tích hình thang", category: "Hình học", semester: 1, isHot: true },
    { name: "Hình tròn: Chu vi và diện tích hình tròn", category: "Hình học", semester: 2, isHot: true },
    { name: "Tỉ số phần trăm & 3 bài toán cơ bản về tỉ số phần trăm", category: "Toán có lời văn", semester: 1, isHot: true },
    { name: "Hình hộp chữ nhật, hình lập phương", category: "Hình học không gian", semester: 2 },
    { name: "Diện tích xung quanh và toàn phần hình lập phương", category: "Hình học không gian", semester: 2, isHot: true },
    { name: "Thể tích hình hộp chữ nhật & hình lập phương", category: "Hình học không gian", semester: 2, isHot: true },
    { name: "Đơn vị đo thể tích: cm³, dm³, m³", category: "Đo lường", semester: 2 },
    { name: "Cộng, trừ, nhân, chia số đo thời gian", category: "Thời gian", semester: 2 },
    { name: "Toán chuyển động đều: Vận tốc, quãng đường, thời gian", category: "Chuyển động", semester: 2, isHot: true },
    { name: "Bài toán chuyển động cùng chiều, ngược chiều", category: "Chuyển động", semester: 2, isHot: true },
  ],

  // TIẾNG VIỆT LỚP 1
  "Tiếng Việt-Lớp 1": [
    { name: "Làm quen các chữ cái và dấu thanh", category: "Chữ cái & Âm", semester: 1, isHot: true },
    { name: "Phân biệt phụ âm đầu: c/k, g/gh, ng/ngh", category: "Chính tả", semester: 1, isHot: true },
    { name: "Ghép âm tạo tiếng và ghép tiếng tạo từ", category: "Vần & Tiếng", semester: 1 },
    { name: "Các vần có âm cuối n, t, c, ch", category: "Vần", semester: 1 },
    { name: "Các vần có âm đệm: oa, oe, uê, uy", category: "Vần", semester: 1 },
    { name: "Tập đọc và trả lời câu hỏi bài đọc ngắn", category: "Đọc hiểu", semester: 2, isHot: true },
    { name: "Từ ngữ chỉ người, con vật, đồ vật xung quanh", category: "Mở rộng vốn từ", semester: 2, isHot: true },
    { name: "Từ ngữ chỉ hoạt động, màu sắc", category: "Mở rộng vốn từ", semester: 2 },
    { name: "Quy tắc viết hoa đầu câu và dấu chấm câu", category: "Chính tả & Ngữ pháp", semester: 2, isHot: true },
    { name: "Điền chữ hoặc vần còn thiếu vào chỗ trống", category: "Luyện tập", semester: 2, isHot: true },
    { name: "Sắp xếp từ ngữ thành câu hoàn chỉnh", category: "Luyện câu", semester: 2, isHot: true },
  ],

  // TIẾNG VIỆT LỚP 2
  "Tiếng Việt-Lớp 2": [
    { name: "Từ chỉ sự vật, hoạt động, đặc điểm", category: "Từ loại", semester: 1, isHot: true },
    { name: "Câu kiểu Ai là gì? (Giới thiệu, nhận định)", category: "Kiểu câu", semester: 1, isHot: true },
    { name: "Câu kiểu Ai làm gì? (Kể về hoạt động)", category: "Kiểu câu", semester: 1, isHot: true },
    { name: "Câu kiểu Ai thế nào? (Miêu tả đặc điểm)", category: "Kiểu câu", semester: 1, isHot: true },
    { name: "Dấu chấm, dấu chấm hỏi, dấu chấm than, dấu phẩy", category: "Dấu câu", semester: 1, isHot: true },
    { name: "Mở rộng vốn từ: Em là học sinh & Trường học", category: "Mở rộng vốn từ", semester: 1 },
    { name: "Mở rộng vốn từ: Bạn bè và thầy cô giáo", category: "Mở rộng vốn từ", semester: 1, isHot: true },
    { name: "Mở rộng vốn từ: Gia đình và tình cảm yêu thương", category: "Mở rộng vốn từ", semester: 1 },
    { name: "Phân biệt chính tả: c/k, s/x, tr/ch, d/gi/r, l/n", category: "Chính tả", semester: 1, isHot: true },
    { name: "Mở rộng vốn từ: Muông thú và bảo vệ loài vật", category: "Mở rộng vốn từ", semester: 2 },
    { name: "Mở rộng vốn từ: Cây cối, bốn mùa trong năm", category: "Mở rộng vốn từ", semester: 2 },
    { name: "Từ ngữ chỉ nghề nghiệp trong xã hội", category: "Mở rộng vốn từ", semester: 2 },
    { name: "Câu hỏi: Ở đâu? Khi nào? Để làm gì? Vì sao?", category: "Luyện câu", semester: 2, isHot: true },
    { name: "Đọc hiểu truyện kể và tìm bài học ý nghĩa", category: "Đọc hiểu", semester: 2, isHot: true },
  ],

  // TIẾNG VIỆT LỚP 3
  "Tiếng Việt-Lớp 3": [
    { name: "Biện pháp tu từ: So sánh (Các kiểu so sánh)", category: "Biện pháp tu từ", semester: 1, isHot: true },
    { name: "Biện pháp tu từ: Nhân hóa (3 cách nhân hóa)", category: "Biện pháp tu từ", semester: 1, isHot: true },
    { name: "Dấu hai chấm và Dấu ngoặc kép", category: "Dấu câu", semester: 1, isHot: true },
    { name: "Mở rộng vốn từ: Trẻ em và thiếu nhi", category: "Mở rộng vốn từ", semester: 1 },
    { name: "Mở rộng vốn từ: Trường học và Đội Thiếu niên", category: "Mở rộng vốn từ", semester: 1 },
    { name: "Mở rộng vốn từ: Gia đình và Quê hương", category: "Mở rộng vốn từ", semester: 1 },
    { name: "Mở rộng vốn từ: Sáng tạo, trí thức và phát minh", category: "Mở rộng vốn từ", semester: 2, isHot: true },
    { name: "Mở rộng vốn từ: Nghệ thuật và Lễ hội truyền thống", category: "Mở rộng vốn từ", semester: 2, isHot: true },
    { name: "Mở rộng vốn từ: Thể thao và Sức khỏe", category: "Mở rộng vốn từ", semester: 2 },
    { name: "Mở rộng vốn từ: Thiên nhiên và Môi trường", category: "Mở rộng vốn từ", semester: 2 },
    { name: "Phân biệt từ chỉ đặc điểm với từ chỉ hoạt động", category: "Từ loại", semester: 2 },
    { name: "Bộ phận câu trả lời cho câu hỏi: Bằng gì? Như thế nào?", category: "Luyện câu", semester: 2 },
    { name: "Đọc hiểu cảm thụ thơ ca và văn xuôi tiểu học", category: "Cảm thụ văn học", semester: 2, isHot: true },
  ],

  // TIẾNG VIỆT LỚP 4
  "Tiếng Việt-Lớp 4": [
    { name: "Danh từ (Danh từ chung & Danh từ riêng)", category: "Từ loại", semester: 1, isHot: true },
    { name: "Quy tắc viết hoa tên người, tên địa lí Việt Nam & nước ngoài", category: "Chính tả", semester: 1, isHot: true },
    { name: "Động từ và các từ bổ nghĩa cho động từ", category: "Từ loại", semester: 1, isHot: true },
    { name: "Tính từ và các cách thể hiện mức độ đặc điểm", category: "Từ loại", semester: 1, isHot: true },
    { name: "Biện pháp tu từ: Nhân hóa nâng cao", category: "Biện pháp tu từ", semester: 1, isHot: true },
    { name: "Dấu ngoặc đơn, Dấu gạch ngang, Dấu ngoặc kép", category: "Dấu câu", semester: 1 },
    { name: "Mở rộng vốn từ: Nhân hậu - Đoàn kết", category: "Mở rộng vốn từ", semester: 1 },
    { name: "Mở rộng vốn từ: Trung thực - Tự trọng", category: "Mở rộng vốn từ", semester: 1 },
    { name: "Mở rộng vốn từ: Ý chí - Nghị lực", category: "Mở rộng vốn từ", semester: 1, isHot: true },
    { name: "Chủ ngữ và Vị ngữ trong câu kể Ai làm gì?", category: "Cú pháp", semester: 2, isHot: true },
    { name: "Chủ ngữ và Vị ngữ trong câu kể Ai thế nào?", category: "Cú pháp", semester: 2, isHot: true },
    { name: "Chủ ngữ và Vị ngữ trong câu kể Ai là gì?", category: "Cú pháp", semester: 2 },
    { name: "Trạng ngữ trong câu (nơi chốn, thời gian, nguyên nhân)", category: "Cú pháp", semester: 2, isHot: true },
    { name: "Từ đồng nghĩa và Từ trái nghĩa", category: "Ngữ nghĩa từ", semester: 2, isHot: true },
    { name: "Mở rộng vốn từ: Sức khỏe, Du lịch - Thám hiểm", category: "Mở rộng vốn từ", semester: 2 },
    { name: "Mở rộng vốn từ: Lạc quan - Yêu đời", category: "Mở rộng vốn từ", semester: 2 },
  ],

  // TIẾNG VIỆT LỚP 5
  "Tiếng Việt-Lớp 5": [
    { name: "Từ đồng nghĩa (đồng nghĩa hoàn toàn, không hoàn toàn)", category: "Ngữ nghĩa từ", semester: 1, isHot: true },
    { name: "Từ trái nghĩa và tác dụng trong câu đối, thành ngữ", category: "Ngữ nghĩa từ", semester: 1, isHot: true },
    { name: "Từ đồng âm và cách phân biệt với từ nhiều nghĩa", category: "Ngữ nghĩa từ", semester: 1, isHot: true },
    { name: "Từ nhiều nghĩa: Nghĩa gốc và nghĩa chuyển", category: "Ngữ nghĩa từ", semester: 1, isHot: true },
    { name: "Đại từ: Đại từ xưng hô và đại từ thay thế", category: "Từ loại", semester: 1, isHot: true },
    { name: "Quan hệ từ và các cặp quan hệ từ chỉ nguyên nhân, điều kiện, tương phản", category: "Từ loại", semester: 1, isHot: true },
    { name: "Mở rộng vốn từ: Tổ quốc, Nhân dân, Hòa bình", category: "Mở rộng vốn từ", semester: 1 },
    { name: "Mở rộng vốn từ: Hữu nghị - Hợp tác", category: "Mở rộng vốn từ", semester: 1 },
    { name: "Mở rộng vốn từ: Bảo vệ môi trường", category: "Mở rộng vốn từ", semester: 1, isHot: true },
    { name: "Câu ghép và các cách nối các vế câu ghép", category: "Cú pháp", semester: 2, isHot: true },
    { name: "Nối các vế câu ghép bằng quan hệ từ", category: "Cú pháp", semester: 2, isHot: true },
    { name: "Nối các vế câu ghép bằng cặp từ hô ứng", category: "Cú pháp", semester: 2, isHot: true },
    { name: "Liên kết câu bằng cách lặp từ ngữ", category: "Văn bản", semester: 2, isHot: true },
    { name: "Liên kết câu bằng cách thay thế từ ngữ", category: "Văn bản", semester: 2, isHot: true },
    { name: "Liên kết câu bằng từ ngữ nối", category: "Văn bản", semester: 2, isHot: true },
    { name: "Ôn tập về dấu câu: Dấu phẩy, dấu hai chấm, dấu gạch ngang", category: "Dấu câu", semester: 2, isHot: true },
    { name: "Mở rộng vốn từ: Công dân, Trật tự - An ninh, Nam và nữ", category: "Mở rộng vốn từ", semester: 2 },
    { name: "Cảm thụ cái hay, cái đẹp của hình ảnh thơ ca", category: "Cảm thụ văn học", semester: 2, isHot: true },
  ],

  // KHOA HỌC / TỰ NHIÊN & XÃ HỘI LỚP 1
  "Khoa học-Lớp 1": [
    { name: "Cơ thể và các bộ phận của cơ thể em", category: "Con người & Sức khỏe", semester: 1, isHot: true },
    { name: "Năm giác quan và cách bảo vệ các giác quan", category: "Con người & Sức khỏe", semester: 1, isHot: true },
    { name: "Giữ gìn vệ sinh thân thể, đánh răng đúng cách", category: "Con người & Sức khỏe", semester: 1 },
    { name: "Gia đình em: Các thành viên và ngôi nhà yêu thương", category: "Gia đình", semester: 1, isHot: true },
    { name: "Đồ dùng trong nhà và an toàn khi sử dụng", category: "Gia đình", semester: 1 },
    { name: "Lớp học và trường tiểu học của em", category: "Trường học", semester: 1 },
    { name: "Cây xanh xung quanh em (Cây hoa, cây rau, cây bóng mát)", category: "Thực vật & Động vật", semester: 2, isHot: true },
    { name: "Con vật nuôi trong nhà và con vật hoang dã", category: "Thực vật & Động vật", semester: 2, isHot: true },
    { name: "Chăm sóc và yêu thương vật nuôi", category: "Thực vật & Động vật", semester: 2 },
    { name: "Bầu trời ban ngày và ban đêm", category: "Trái Đất & Bầu trời", semester: 2 },
    { name: "Thời tiết: Nắng, mưa, gió, bão và trang phục phù hợp", category: "Trái Đất & Bầu trời", semester: 2, isHot: true },
  ],

  // KHOA HỌC / TỰ NHIÊN & XÃ HỘI LỚP 2
  "Khoa học-Lớp 2": [
    { name: "Các thế hệ trong gia đình và nghề nghiệp của người lớn", category: "Gia đình", semester: 1, isHot: true },
    { name: "Phòng tránh ngộ độc khi ở nhà và an toàn đồ chơi", category: "Gia đình", semester: 1 },
    { name: "Trường học của em và giữ vệ sinh trường lớp", category: "Trường học", semester: 1 },
    { name: "Cộng đồng địa phương: Nghề nghiệp và hoạt động giao thông", category: "Cộng đồng", semester: 1, isHot: true },
    { name: "Thực vật và động vật sống ở đâu? (Trên cạn, dưới nước, trên không)", category: "Thực vật & Động vật", semester: 1, isHot: true },
    { name: "Bảo vệ môi trường sống của thực vật và động vật", category: "Thực vật & Động vật", semester: 1 },
    { name: "Cơ quan vận động: Hệ xương, khớp xương và cơ bắp", category: "Con người & Sức khỏe", semester: 2, isHot: true },
    { name: "Tư thế ngồi học đúng và phòng tránh cong vẹo cột sống", category: "Con người & Sức khỏe", semester: 2, isHot: true },
    { name: "Cơ quan bài tiết nước tiểu và giữ gìn vệ sinh", category: "Con người & Sức khỏe", semester: 2 },
    { name: "Mặt Trời, Trái Đất và Mặt Trăng", category: "Trái Đất & Bầu trời", semester: 2, isHot: true },
    { name: "Các mùa trong năm và đặc điểm thời tiết từng mùa", category: "Trái Đất & Bầu trời", semester: 2, isHot: true },
  ],

  // KHOA HỌC / TỰ NHIÊN & XÃ HỘI LỚP 3
  "Khoa học-Lớp 3": [
    { name: "Họ hàng nội, họ hàng ngoại và truyền thống gia đình", category: "Gia đình", semester: 1 },
    { name: "Hoạt động sản xuất và di tích lịch sử ở địa phương", category: "Cộng đồng", semester: 1, isHot: true },
    { name: "Cơ quan tiêu hóa: Cấu tạo, chức năng và ăn uống lành mạnh", category: "Con người & Sức khỏe", semester: 1, isHot: true },
    { name: "Cơ quan tuần hoàn: Tim, mạch máu và cách chăm sóc tim", category: "Con người & Sức khỏe", semester: 1, isHot: true },
    { name: "Cơ quan thần kinh: Não, tủy sống và giữ tinh thần vui vẻ", category: "Con người & Sức khỏe", semester: 1, isHot: true },
    { name: "Phòng tránh bệnh hô hấp, cảm cúm, tay chân miệng", category: "Con người & Sức khỏe", semester: 1 },
    { name: "Thực vật: Cấu tạo và chức năng của rễ, thân, lá, hoa, quả", category: "Thực vật & Động vật", semester: 2, isHot: true },
    { name: "Động vật: Côn trùng, cá, lưỡng cư, bò sát, chim, thú", category: "Thực vật & Động vật", semester: 2, isHot: true },
    { name: "Sử dụng hợp lý và bảo vệ thực vật, động vật quý hiếm", category: "Thực vật & Động vật", semester: 2 },
    { name: "Bề mặt Trái Đất: Lục địa, biển, đại dương, đới khí hậu", category: "Trái Đất & Bầu trời", semester: 2, isHot: true },
    { name: "Hiện tượng ngày đêm và sự quay của Trái Đất quanh Mặt Trời", category: "Trái Đất & Bầu trời", semester: 2, isHot: true },
  ],

  // KHOA HỌC LỚP 4
  "Khoa học-Lớp 4": [
    { name: "Tính chất của nước và ba thể của nước", category: "Chất", semester: 1, isHot: true },
    { name: "Vòng tuần hoàn của nước trong tự nhiên", category: "Chất", semester: 1, isHot: true },
    { name: "Ô nhiễm và bảo vệ nguồn nước sạch", category: "Môi trường", semester: 1, isHot: true },
    { name: "Không khí: Tính chất, thành phần (ô-xi, ni-tơ, các-bô-níc)", category: "Chất", semester: 1, isHot: true },
    { name: "Vai trò của không khí đối với sự sống và sự cháy", category: "Chất", semester: 1 },
    { name: "Ánh sáng: Nguồn sáng, vai trò và bóng tối", category: "Năng lượng", semester: 1, isHot: true },
    { name: "Âm thanh: Sự lan truyền âm thanh & Chống ô nhiễm tiếng ồn", category: "Năng lượng", semester: 1, isHot: true },
    { name: "Nhiệt độ và sự truyền nhiệt, vật dẫn nhiệt tốt và kém", category: "Năng lượng", semester: 1 },
    { name: "Các nhóm chất dinh dưỡng cần thiết (Đạm, béo, đường, vitamin)", category: "Con người & Sức khỏe", semester: 2, isHot: true },
    { name: "Thực phẩm an toàn và phòng tránh bệnh suy dinh dưỡng / béo phì", category: "Con người & Sức khỏe", semester: 2, isHot: true },
    { name: "Nấm và vai trò của nấm trong tự nhiên và đời sống", category: "Sinh vật", semester: 2, isHot: true },
    { name: "Thực vật cần gì để sống và phát triển? (Quang hợp)", category: "Sinh vật", semester: 2, isHot: true },
    { name: "Động vật cần gì để sống? Chuỗi thức ăn trong tự nhiên", category: "Sinh vật", semester: 2, isHot: true },
  ],

  // KHOA HỌC LỚP 5
  "Khoa học-Lớp 5": [
    { name: "Sự sinh sản và quá trình phát triển của thực vật có hoa", category: "Sinh vật", semester: 1, isHot: true },
    { name: "Sự sinh sản của động vật: Đẻ trứng và đẻ con", category: "Sinh vật", semester: 1, isHot: true },
    { name: "Các giai đoạn phát triển của con người (Tuổi dậy thì)", category: "Con người & Sức khỏe", semester: 1, isHot: true },
    { name: "Vệ sinh tuổi dậy thì và phòng tránh xâm hại cơ thể", category: "Con người & Sức khỏe", semester: 1, isHot: true },
    { name: "Phòng tránh các bệnh truyền nhiễm: Sốt xuất huyết, sốt rét, viêm gan", category: "Con người & Sức khỏe", semester: 1 },
    { name: "Đặc điểm và ứng dụng của vật liệu: Nhôm, sắt, đồng, cao su, nhựa", category: "Vật liệu", semester: 1 },
    { name: "Sự biến đổi hóa học của chất (Biến đổi vật lý vs hóa học)", category: "Chất", semester: 1, isHot: true },
    { name: "Năng lượng mặt trời, gió và nước chảy", category: "Năng lượng", semester: 2, isHot: true },
    { name: "Năng lượng điện: Sử dụng điện an toàn và tiết kiệm", category: "Năng lượng", semester: 2, isHot: true },
    { name: "Môi trường và tài nguyên thiên nhiên (Đất, rừng, khoáng sản)", category: "Môi trường", semester: 2, isHot: true },
    { name: "Tác động của con người đến môi trường và biến đổi khí hậu", category: "Môi trường", semester: 2, isHot: true },
    { name: "Biện pháp bảo vệ môi trường và đa dạng sinh học", category: "Môi trường", semester: 2, isHot: true },
  ],

  // LỊCH SỬ & ĐỊA LÝ LỚP 4
  "Lịch sử & Địa lý-Lớp 4": [
    { name: "Làm quen với phương tiện học tập Lịch sử và Địa lý (Bản đồ, quả Địa cầu)", category: "Địa lý", semester: 1, isHot: true },
    { name: "Vùng Trung du và Miền núi Bắc Bộ: Thiên nhiên và con người", category: "Địa lý", semester: 1, isHot: true },
    { name: "Đền Hùng và Lễ giỗ Tổ Hùng Vương", category: "Lịch sử", semester: 1, isHot: true },
    { name: "Vùng Đồng bằng Bắc Bộ: Sông Hồng và nền văn minh lúa nước", category: "Địa lý", semester: 1, isHot: true },
    { name: "Thăng Long - Hà Nội: Kinh đô ngàn năm văn hiến", category: "Lịch sử", semester: 1, isHot: true },
    { name: "Văn Miếu - Quốc Tử Giám: Trường đại học đầu tiên", category: "Lịch sử", semester: 1, isHot: true },
    { name: "Vùng Duyên hải miền Trung: Thiên nhiên và khí hậu", category: "Địa lý", semester: 2 },
    { name: "Cố đô Huế và Phố cổ Hội An", category: "Lịch sử", semester: 2, isHot: true },
    { name: "Vùng Tây Nguyên: Thiên nhiên, cây công nghiệp và Không gian văn hóa Cồng chiêng", category: "Địa lý & Văn hóa", semester: 2, isHot: true },
    { name: "Vùng Nam Bộ: Đồng bằng sông Cửu Long trù phú", category: "Địa lý", semester: 2, isHot: true },
    { name: "Thành phố Hồ Chí Minh: Trung tâm kinh tế lớn", category: "Địa lý", semester: 2, isHot: true },
    { name: "Địa đạo Củ Chi và truyền thống yêu nước Nam Bộ", category: "Lịch sử", semester: 2 },
  ],

  // LỊCH SỬ & ĐỊA LÝ LỚP 5
  "Lịch sử & Địa lý-Lớp 5": [
    { name: "Địa lý Việt Nam: Vị trí địa lý, hình dáng lãnh thổ, biên giới", category: "Địa lý", semester: 1, isHot: true },
    { name: "Địa hình và khoáng sản nước ta", category: "Địa lý", semester: 1 },
    { name: "Khí hậu nhiệt đới gió mùa và mạng lưới sông ngòi Việt Nam", category: "Địa lý", semester: 1, isHot: true },
    { name: "Biển Đông và chủ quyền biển đảo Tổ quốc (Hoàng Sa, Trường Sa)", category: "Địa lý & Lịch sử", semester: 1, isHot: true },
    { name: "Dân cư và các dân tộc anh em trên đất nước Việt Nam", category: "Địa lý", semester: 1 },
    { name: "Nông nghiệp, công nghiệp và giao thông vận tải Việt Nam", category: "Địa lý", semester: 1 },
    { name: "Bác Hồ ra đi tìm đường cứu nước (Năm 1911 tại Bến Nhà Rồng)", category: "Lịch sử", semester: 1, isHot: true },
    { name: "Đảng Cộng sản Việt Nam ra đời (3/2/1930)", category: "Lịch sử", semester: 1, isHot: true },
    { name: "Cách mạng Tháng Tám năm 1945 và Bác Hồ đọc Tuyên ngôn Độc lập", category: "Lịch sử", semester: 1, isHot: true },
    { name: "Chiến thắng Điện Biên Phủ 'Lừng lẫy năm châu, chấn động địa cầu' (1954)", category: "Lịch sử", semester: 2, isHot: true },
    { name: "Đường Trường Sơn huyền thoại (Đường Hồ Chí Minh)", category: "Lịch sử", semester: 2, isHot: true },
    { name: "Đại thắng mùa Xuân 1975 và Chiến dịch Hồ Chí Minh lịch sử", category: "Lịch sử", semester: 2, isHot: true },
    { name: "Các châu lục trên thế giới: Châu Á, Châu Âu, Châu Phi, Châu Mỹ", category: "Địa lý thế giới", semester: 2, isHot: true },
    { name: "Bốn đại dương lớn trên Trái Đất", category: "Địa lý thế giới", semester: 2 },
  ],

  // LỊCH SỬ & ĐỊA LÝ LỚP 1, 2, 3 (Quê hương & Địa phương)
  "Lịch sử & Địa lý-Lớp 1": [
    { name: "Lá cờ đỏ sao vàng và Quốc ca Việt Nam", category: "Lịch sử & Tổ quốc", semester: 1, isHot: true },
    { name: "Bác Hồ kính yêu với thiếu nhi", category: "Lịch sử", semester: 1, isHot: true },
    { name: "Quê hương nơi em sinh sống", category: "Địa phương", semester: 2, isHot: true },
    { name: "Các ngày lễ lớn của đất nước (Tết Nguyên Đán, 2/9)", category: "Văn hóa", semester: 2, isHot: true },
  ],
  "Lịch sử & Địa lý-Lớp 2": [
    { name: "Truyền thuyết Lạc Long Quân và Âu Cơ (Nguồn gốc con Rồng cháu Tiên)", category: "Lịch sử & Truyền thuyết", semester: 1, isHot: true },
    { name: "Lễ hội truyền thống tại địa phương", category: "Văn hóa", semester: 1, isHot: true },
    { name: "Cảnh đẹp quê hương ba miền Bắc - Trung - Nam", category: "Địa lý", semester: 2, isHot: true },
    { name: "Di tích lịch sử văn hóa gần nơi em ở", category: "Địa phương", semester: 2 },
  ],
  "Lịch sử & Địa lý-Lớp 3": [
    { name: "Kể chuyện lịch sử: Hai Bà Trưng, Ngô Quyền", category: "Lịch sử", semester: 1, isHot: true },
    { name: "Truyền thống uống nước nhớ nguồn", category: "Đạo lý", semester: 1 },
    { name: "Bản đồ Việt Nam: Thủ đô Hà Nội và các tỉnh thành", category: "Địa lý", semester: 2, isHot: true },
    { name: "Biển đảo quê hương và người chiến sĩ hải quân", category: "Địa lý & Quốc phòng", semester: 2, isHot: true },
  ],

  // TIẾNG ANH LỚP 1
  "Tiếng Anh-Lớp 1": [
    { name: "Alphabet Phonics (Sounds A - Z)", category: "Phonics", semester: 1, isHot: true },
    { name: "Numbers from 1 to 10", category: "Numbers", semester: 1, isHot: true },
    { name: "Colors: Red, Blue, Green, Yellow, Pink", category: "Colors", semester: 1, isHot: true },
    { name: "School Things: Book, Pen, Pencil, Ruler, Bag", category: "Classroom", semester: 1, isHot: true },
    { name: "Family: Father, Mother, Brother, Sister, Baby", category: "Family", semester: 2, isHot: true },
    { name: "Body Parts: Eyes, Ears, Nose, Mouth, Hands", category: "Body", semester: 2, isHot: true },
    { name: "Animals: Cat, Dog, Bird, Fish, Duck", category: "Animals", semester: 2, isHot: true },
    { name: "Simple Commands: Stand up, Sit down, Listen", category: "Commands", semester: 2 },
  ],

  // TIẾNG ANH LỚP 2
  "Tiếng Anh-Lớp 2": [
    { name: "Greetings: Hello, Hi, Good morning, Goodbye", category: "Communication", semester: 1, isHot: true },
    { name: "Feelings: Happy, Sad, Tired, Hungry, Thirsty", category: "Feelings", semester: 1, isHot: true },
    { name: "Numbers from 11 to 20", category: "Numbers", semester: 1, isHot: true },
    { name: "Shapes: Circle, Square, Triangle, Rectangle", category: "Shapes", semester: 1 },
    { name: "Toys: Ball, Doll, Robot, Teddy bear, Car, Yo-yo", category: "Toys", semester: 1, isHot: true },
    { name: "Farm Animals: Cow, Pig, Sheep, Horse, Chicken", category: "Animals", semester: 2, isHot: true },
    { name: "Food & Drinks: Apple, Banana, Milk, Bread, Water", category: "Food", semester: 2, isHot: true },
    { name: "My House & Rooms: Living room, Bedroom, Kitchen", category: "House", semester: 2 },
    { name: "Abilities: I can run, jump, swim, sing", category: "Grammar", semester: 2, isHot: true },
  ],

  // TIẾNG ANH LỚP 3
  "Tiếng Anh-Lớp 3": [
    { name: "Unit 1: Hello & What is your name?", category: "Communication", semester: 1, isHot: true },
    { name: "Unit 2: Our Names & Spelling names", category: "Phonics & Spelling", semester: 1 },
    { name: "Unit 3: Our Friends (This is / That is...)", category: "Grammar", semester: 1 },
    { name: "Unit 4: Our School & Classroom activities", category: "School", semester: 1, isHot: true },
    { name: "Unit 5: My School Things (Do you have a...?)", category: "School", semester: 1, isHot: true },
    { name: "Unit 6: Our School Library & Computer room", category: "School", semester: 1 },
    { name: "Unit 7: Classroom Instructions (May I come in?)", category: "Classroom", semester: 1 },
    { name: "Unit 8: Age and Numbers (How old are you?)", category: "Numbers & Age", semester: 1, isHot: true },
    { name: "Unit 11: My Family (Who is that? He is my...)", category: "Family", semester: 2, isHot: true },
    { name: "Unit 13: My House & Rooms (Where is the...?)", category: "House", semester: 2, isHot: true },
    { name: "Unit 15: At the Dining Table (Would you like some...?)", category: "Food & Meals", semester: 2, isHot: true },
    { name: "Unit 16: My Pets (Do you have any cats / dogs?)", category: "Pets", semester: 2, isHot: true },
    { name: "Unit 17: Our Toys (How many cars do you have?)", category: "Toys", semester: 2 },
    { name: "Unit 19: Outdoor Activities (What are you doing?)", category: "Present Continuous", semester: 2, isHot: true },
  ],

  // TIẾNG ANH LỚP 4
  "Tiếng Anh-Lớp 4": [
    { name: "Unit 1: Where are you from? (Countries & Nationalities)", category: "Countries", semester: 1, isHot: true },
    { name: "Unit 2: What day is it today? (Days of the week)", category: "Days & Time", semester: 1, isHot: true },
    { name: "Unit 3: What is the date today? (Months & Birthdays)", category: "Dates", semester: 1, isHot: true },
    { name: "Unit 4: When is your birthday?", category: "Celebrations", semester: 1 },
    { name: "Unit 5: What can you do? (Can / Can't for abilities)", category: "Modal Verbs", semester: 1, isHot: true },
    { name: "Unit 6: Where is your school?", category: "Locations", semester: 1 },
    { name: "Unit 7: What do you like doing? (Hobbies & -ing)", category: "Hobbies", semester: 1, isHot: true },
    { name: "Unit 8: What subjects do you have today?", category: "School Subjects", semester: 1, isHot: true },
    { name: "Unit 11: What time is it? & Daily routines", category: "Time & Routine", semester: 2, isHot: true },
    { name: "Unit 12: What does your father do? (Jobs & Occupations)", category: "Jobs", semester: 2, isHot: true },
    { name: "Unit 13: Would you like some milk? (Food & Drinks)", category: "Food", semester: 2 },
    { name: "Unit 14: What does he look like? (Appearance & Comparatives)", category: "Description", semester: 2, isHot: true },
    { name: "Unit 16: How much is the T-shirt? (Clothes & Prices)", category: "Shopping", semester: 2, isHot: true },
    { name: "Unit 18: What animal do you want to see? (Zoo animals)", category: "Animals", semester: 2 },
  ],

  // TIẾNG ANH LỚP 5
  "Tiếng Anh-Lớp 5": [
    { name: "Unit 1: What's your address? (Street, Lane, Tower, City)", category: "Addresses", semester: 1, isHot: true },
    { name: "Unit 2: I always get up early. How about you? (Adverbs of frequency)", category: "Daily Habits", semester: 1, isHot: true },
    { name: "Unit 3: Where did you go on holiday? (Past Simple tense)", category: "Holidays & Travel", semester: 1, isHot: true },
    { name: "Unit 4: Did you go to the party? (Past Simple Q&A)", category: "Past Simple", semester: 1, isHot: true },
    { name: "Unit 5: Where will you be this weekend? (Future with Will)", category: "Future Tense", semester: 1, isHot: true },
    { name: "Unit 6: How many lessons do you have today?", category: "School", semester: 1 },
    { name: "Unit 7: How do you learn English? (Speaking, Reading, Writing)", category: "Language Skills", semester: 1, isHot: true },
    { name: "Unit 8: What are you reading? (Story characters & adjectives)", category: "Stories & Books", semester: 1, isHot: true },
    { name: "Unit 11: What's the matter with you? (Health problems & Advice: Should / Shouldn't)", category: "Health & Advice", semester: 2, isHot: true },
    { name: "Unit 12: Don't ride your bike too fast! (Safety & Imperatives)", category: "Safety", semester: 2, isHot: true },
    { name: "Unit 13: What do you do in your free time?", category: "Free time", semester: 2 },
    { name: "Unit 14: What happened in the story? (The Story of Mai An Tiem)", category: "Fairy Tales", semester: 2, isHot: true },
    { name: "Unit 16: Where's the post office? (Giving Directions: Turn left, Turn right)", category: "Directions", semester: 2, isHot: true },
    { name: "Unit 18: What will the weather be like tomorrow?", category: "Weather", semester: 2, isHot: true },
    { name: "Unit 20: Which one is more attractive? (Comparatives of long adjectives)", category: "Comparatives", semester: 2, isHot: true },
  ],

  // TIN HỌC LỚP 3
  "Tin học-Lớp 3": [
    { name: "Làm quen với máy tính: Thân máy, màn hình, bàn phím, chuột", category: "Phần cứng", semester: 1, isHot: true },
    { name: "Cách cầm chuột và các thao tác nháy chuột, kéo thả", category: "Kỹ năng thao tác", semester: 1, isHot: true },
    { name: "Bàn phím máy tính và quy tắc gõ 10 ngón trên hàng phím cơ sở", category: "Gõ bàn phím", semester: 1, isHot: true },
    { name: "Thông tin và dữ liệu trong đời sống", category: "Khái niệm số", semester: 1 },
    { name: "Thư mục và tệp tin: Sắp xếp thông tin ngăn nắp", category: "Tổ chức dữ liệu", semester: 1, isHot: true },
    { name: "Làm quen với phần mềm vẽ Paint: Hộp công cụ & Bảng màu", category: "Đồ họa Paint", semester: 2, isHot: true },
    { name: "Vẽ hình khối và tô màu tranh vẽ trong Paint", category: "Đồ họa Paint", semester: 2, isHot: true },
    { name: "An toàn và giữ tư thế ngồi đúng khi dùng máy tính", category: "An toàn số", semester: 2, isHot: true },
    { name: "Thực hiện nhiệm vụ theo từng bước (Tư duy thuật toán)", category: "Tư duy máy tính", semester: 2, isHot: true },
  ],

  // TIN HỌC LỚP 4
  "Tin học-Lớp 4": [
    { name: "Phần cứng và phần mềm máy tính", category: "Kiến thức máy tính", semester: 1 },
    { name: "Mạng máy tính và tìm kiếm thông tin trên Internet an toàn", category: "Internet", semester: 1, isHot: true },
    { name: "Bảo vệ thông tin cá nhân và quy tắc ứng xử trên mạng", category: "Đạo đức số", semester: 1, isHot: true },
    { name: "Soạn thảo văn bản Word: Gõ chữ tiếng Việt kiểu Telex hoặc Vni", category: "Văn bản Word", semester: 1, isHot: true },
    { name: "Định dạng chữ: Phông chữ, cỡ chữ, kiểu chữ (Đậm, Nghiêng, Gạch chân)", category: "Văn bản Word", semester: 1, isHot: true },
    { name: "Chèn hình ảnh và căn chỉnh đoạn văn bản trong Word", category: "Văn bản Word", semester: 1, isHot: true },
    { name: "Làm quen với phần mềm trình chiếu PowerPoint", category: "Trình chiếu", semester: 2, isHot: true },
    { name: "Tạo trang chiếu mới, chèn chữ và hình ảnh trong PowerPoint", category: "Trình chiếu", semester: 2, isHot: true },
    { name: "Làm quen với lập trình trực quan Scratch: Nhân vật và sân khấu", category: "Lập trình Scratch", semester: 2, isHot: true },
    { name: "Lập trình cho nhân vật di chuyển và phát âm thanh trong Scratch", category: "Lập trình Scratch", semester: 2, isHot: true },
  ],

  // TIN HỌC LỚP 5
  "Tin học-Lớp 5": [
    { name: "Tổ chức cây thư mục và lưu trữ dữ liệu khoa học", category: "Quản lý dữ liệu", semester: 1 },
    { name: "Tìm kiếm thông tin chính xác và đánh giá độ tin cậy của thông tin", category: "Kỹ năng số", semester: 1, isHot: true },
    { name: "Sử dụng thư điện tử (Email) an toàn, văn minh và lịch sự", category: "Giao tiếp số", semester: 1, isHot: true },
    { name: "Soạn thảo văn bản Word nâng cao: Chèn bảng, tạo danh sách số", category: "Văn bản Word", semester: 1, isHot: true },
    { name: "Định dạng trang văn bản, căn lề và in ấn tài liệu", category: "Văn bản Word", semester: 1 },
    { name: "Thiết kế bài thuyết trình PowerPoint hoàn chỉnh với hiệu ứng chuyển động", category: "Trình chiếu", semester: 2, isHot: true },
    { name: "Chèn âm thanh, video clip minh họa vào bài trình chiếu", category: "Trình chiếu", semester: 2, isHot: true },
    { name: "Lập trình Scratch: Sử dụng vòng lặp (Lặp lại, Liên tục)", category: "Lập trình Scratch", semester: 2, isHot: true },
    { name: "Lập trình Scratch: Câu lệnh điều kiện (Nếu... thì...)", category: "Lập trình Scratch", semester: 2, isHot: true },
    { name: "Lập trình Scratch: Biến số tính điểm và tạo trò chơi nhỏ", category: "Lập trình Scratch", semester: 2, isHot: true },
  ],

  // TIN HỌC LỚP 1, 2 (Làm quen công nghệ)
  "Tin học-Lớp 1": [
    { name: "Nhận biết các thiết bị công nghệ: Máy tính, tivi, điện thoại thông minh", category: "Thiết bị số", semester: 1, isHot: true },
    { name: "Quy tắc an toàn điện và tư thế ngồi xem màn hình", category: "An toàn", semester: 1, isHot: true },
    { name: "Chơi trò chơi ghép hình và phát triển trí tuệ trên máy tính", category: "Kỹ năng", semester: 2, isHot: true },
  ],
  "Tin học-Lớp 2": [
    { name: "Làm quen với chuột máy tính và bàn phím", category: "Thao tác", semester: 1, isHot: true },
    { name: "Thời gian sử dụng thiết bị số hợp lý, bảo vệ mắt", category: "Sức khỏe số", semester: 1, isHot: true },
    { name: "Tập vẽ các hình đơn giản trên máy tính", category: "Sáng tạo", semester: 2, isHot: true },
  ],

  // ĐẠO ĐỨC LỚP 1
  "Đạo đức-Lớp 1": [
    { name: "Em là học sinh lớp Một chăm ngoan", category: "Bản thân", semester: 1, isHot: true },
    { name: "Kính trọng thầy cô giáo và lễ phép chào hỏi", category: "Lễ phép", semester: 1, isHot: true },
    { name: "Yêu quý bạn bè và chia sẻ đồ chơi cùng bạn", category: "Tình bạn", semester: 1, isHot: true },
    { name: "Đi học đều và đúng giờ", category: "Nề nếp", semester: 1, isHot: true },
    { name: "Giữ gìn sách vở và đồ dùng học tập cẩn thận", category: "Kỹ năng sống", semester: 1 },
    { name: "Thật thà, không nói dối người lớn", category: "Phẩm chất", semester: 2, isHot: true },
    { name: "Tự giác làm việc của mình ở nhà và trường", category: "Tự lập", semester: 2, isHot: true },
    { name: "Chào hỏi và tạm biệt khi gặp gỡ", category: "Giao tiếp", semester: 2 },
    { name: "Bảo vệ hoa và cây xanh nơi công cộng", category: "Môi trường", semester: 2 },
  ],

  // ĐẠO ĐỨC LỚP 2
  "Đạo đức-Lớp 2": [
    { name: "Quý trọng thời gian và sắp xếp thời gian biểu", category: "Kỹ năng sống", semester: 1, isHot: true },
    { name: "Nhận lỗi và sửa lỗi khi làm sai", category: "Phẩm chất", semester: 1, isHot: true },
    { name: "Bảo vệ loài vật có ích và thú cưng", category: "Môi trường", semester: 1 },
    { name: "Quan tâm, chăm sóc ông bà và cha mẹ", category: "Gia đình", semester: 1, isHot: true },
    { name: "Giúp đỡ người khuyết tật và người gặp khó khăn", category: "Lòng nhân ái", semester: 2, isHot: true },
    { name: "Giữ trật tự khi ở nơi công cộng", category: "Văn minh", semester: 2, isHot: true },
    { name: "Tuân thủ quy định an toàn giao thông đường bộ", category: "An toàn", semester: 2, isHot: true },
    { name: "Tiết kiệm tiền của và điện nước trong gia đình", category: "Tiết kiệm", semester: 2 },
  ],

  // ĐẠO ĐỨC LỚP 3
  "Đạo đức-Lớp 3": [
    { name: "Giữ lời hứa với bạn bè và người thân", category: "Phẩm chất", semester: 1, isHot: true },
    { name: "Tự làm lấy việc của mình (Không ỷ lại)", category: "Tự lập", semester: 1, isHot: true },
    { name: "Quan tâm, chăm sóc anh chị em trong nhà", category: "Gia đình", semester: 1 },
    { name: "Chia sẻ niềm vui, nỗi buồn cùng bạn bè", category: "Tình bạn", semester: 1, isHot: true },
    { name: "Tôn trọng thư từ và tài sản của người khác", category: "Tôn trọng", semester: 2, isHot: true },
    { name: "Tiết kiệm và bảo vệ nguồn nước sạch", category: "Bảo vệ thiên nhiên", semester: 2, isHot: true },
    { name: "Chăm sóc cây trồng và vật nuôi ở trường, ở nhà", category: "Môi trường", semester: 2 },
    { name: "Tích cực tham gia các hoạt động nhân đạo, từ thiện", category: "Nhân ái", semester: 2, isHot: true },
    { name: "Tôn trọng truyền thống văn hóa quê hương Lạc Long Quân", category: "Yêu quê hương", semester: 2, isHot: true },
  ],

  // ĐẠO ĐỨC LỚP 4
  "Đạo đức-Lớp 4": [
    { name: "Trung thực trong học tập và thi cử", category: "Trung thực", semester: 1, isHot: true },
    { name: "Vượt khó trong học tập, không nản chí", category: "Ý chí", semester: 1, isHot: true },
    { name: "Biết ơn thầy giáo, cô giáo đã dạy dỗ", category: "Tôn sư trọng đạo", semester: 1, isHot: true },
    { name: "Yêu lao động và quý trọng thành quả lao động", category: "Lao động", semester: 1 },
    { name: "Tôn trọng sự khác biệt của người khác (sở thích, tính cách)", category: "Tôn trọng", semester: 1, isHot: true },
    { name: "Biết ơn các anh hùng liệt sĩ và người có công với đất nước", category: "Biết ơn", semester: 2, isHot: true },
    { name: "Tôn trọng và bảo vệ của công (trường lớp, công viên)", category: "Trách nhiệm", semester: 2, isHot: true },
    { name: "Tình bạn chân thành và biết khuyên bạn điều hay", category: "Tình bạn", semester: 2, isHot: true },
    { name: "Bảo vệ môi trường: Không xả rác và phân loại rác thải", category: "Môi trường", semester: 2, isHot: true },
  ],

  // ĐẠO ĐỨC LỚP 5
  "Đạo đức-Lớp 5": [
    { name: "Em là học sinh lớp Năm gương mẫu", category: "Trách nhiệm", semester: 1, isHot: true },
    { name: "Có trách nhiệm về việc làm của bản thân", category: "Trách nhiệm", semester: 1, isHot: true },
    { name: "Lòng biết ơn tổ tiên và cội nguồn dân tộc", category: "Biết ơn", semester: 1, isHot: true },
    { name: "Tình bạn đẹp và tương trợ nhau cùng tiến bộ", category: "Tình bạn", semester: 1 },
    { name: "Tôn trọng phụ nữ và các bạn gái", category: "Tôn trọng", semester: 1, isHot: true },
    { name: "Kính già, yêu trẻ và nhường nhịn em nhỏ", category: "Lễ phép", semester: 1, isHot: true },
    { name: "Hợp tác hiệu quả với mọi người xung quanh", category: "Kỹ năng sống", semester: 2, isHot: true },
    { name: "Yêu hòa bình, phản đối chiến tranh và bạo lực học đường", category: "Hòa bình", semester: 2, isHot: true },
    { name: "Bảo vệ tài nguyên thiên nhiên và phát triển bền vững", category: "Môi trường", semester: 2, isHot: true },
    { name: "Tự hào và phát huy truyền thống Trường Tiểu học Lạc Long Quân", category: "Tự hào trường lớp", semester: 2, isHot: true },
  ],

  // HOẠT ĐỘNG TRẢI NGHIỆM (Chung cho các lớp)
  "Hoạt động trải nghiệm-Lớp 1": [
    { name: "Khám phá bản thân và nụ cười thân thiện", category: "Bản thân", semester: 1, isHot: true },
    { name: "Ngôi trường thân yêu của em", category: "Trường học", semester: 1, isHot: true },
    { name: "Chào mừng ngày Nhà giáo Việt Nam 20/11", category: "Tri ân", semester: 1, isHot: true },
    { name: "Tết ấm áp bên gia đình", category: "Gia đình", semester: 2, isHot: true },
    { name: "Bảo vệ môi trường xanh - sạch - đẹp", category: "Môi trường", semester: 2, isHot: true },
  ],
  "Hoạt động trải nghiệm-Lớp 2": [
    { name: "Rèn luyện nề nếp và thói quen sinh hoạt tốt", category: "Bản thân", semester: 1, isHot: true },
    { name: "Thầy cô và bạn bè thân thương", category: "Trường học", semester: 1, isHot: true },
    { name: "Bữa cơm gia đình và lòng hiếu thảo", category: "Gia đình", semester: 1, isHot: true },
    { name: "An toàn giao thông đến trường", category: "An toàn", semester: 2, isHot: true },
    { name: "Em yêu quê hương và các nghề truyền thống", category: "Quê hương", semester: 2, isHot: true },
  ],
  "Hoạt động trải nghiệm-Lớp 3": [
    { name: "Tự hào truyền thống trường em", category: "Trường học", semester: 1, isHot: true },
    { name: "Quản lý cảm xúc và giải quyết mâu thuẫn bạn bè", category: "Kỹ năng", semester: 1, isHot: true },
    { name: "Tri ân thầy cô giáo", category: "Tri ân", semester: 1, isHot: true },
    { name: "Hội chợ xuân và phong tục Tết cổ truyền", category: "Văn hóa", semester: 2, isHot: true },
    { name: "Hành động vì môi trường không rác thải nhựa", category: "Môi trường", semester: 2, isHot: true },
  ],
  "Hoạt động trải nghiệm-Lớp 4": [
    { name: "Xây dựng hình ảnh bản thân và mục tiêu học tập", category: "Bản thân", semester: 1, isHot: true },
    { name: "Tinh thần làm việc nhóm và hợp tác", category: "Kỹ năng", semester: 1, isHot: true },
    { name: "Gia đình ấm áp và chia sẻ công việc nhà", category: "Gia đình", semester: 1, isHot: true },
    { name: "Tiêu dùng thông minh và quản lý tiền tiêu vặt", category: "Tài chính", semester: 2, isHot: true },
    { name: "Tìm hiểu các danh lam thắng cảnh quê hương đất nước", category: "Quê hương", semester: 2, isHot: true },
  ],
  "Hoạt động trải nghiệm-Lớp 5": [
    { name: "Tôi là học sinh lớp Năm tự tin và trách nhiệm", category: "Bản thân", semester: 1, isHot: true },
    { name: "Giao tiếp tự tin và lắng nghe tích cực", category: "Kỹ năng", semester: 1, isHot: true },
    { name: "Lòng biết ơn đấng sinh thành và thầy cô giáo", category: "Tri ân", semester: 1, isHot: true },
    { name: "Kế hoạch chi tiêu và thực hành tiết kiệm", category: "Tài chính", semester: 2, isHot: true },
    { name: "Chuẩn bị tâm thế vững vàng bước vào lớp Sáu", category: "Hành trang", semester: 2, isHot: true },
  ],
};

/**
 * Returns dynamic subject display label adapted to grade (e.g. Lớp 1-3 is TN&XH, Lớp 4-5 is Khoa học)
 */
export function getSubjectDisplayName(subjectId: string, gradeId: string): string {
  if (subjectId === "Khoa học") {
    if (gradeId === "Lớp 1" || gradeId === "Lớp 2" || gradeId === "Lớp 3") {
      return "Tự nhiên & Xã hội 🔬";
    }
    return "Khoa học 🔬";
  }
  const s = PRIMARY_SUBJECTS.find(item => item.id === subjectId);
  return s ? s.label : subjectId;
}

/**
 * Retrieves topic list for given Subject + Grade with smart fallback
 */
export function getTopicsForSubjectAndGrade(subject: string, grade: string): CurriculumTopicItem[] {
  const key = `${subject}-${grade}`;
  const list = COMPREHENSIVE_TOPICS[key];
  if (list && list.length > 0) {
    return list;
  }

  // Fallback if not found directly
  if (subject.includes("Khoa học") || subject.includes("Tự nhiên")) {
    const k2 = `Khoa học-${grade}`;
    if (COMPREHENSIVE_TOPICS[k2]) return COMPREHENSIVE_TOPICS[k2];
  }

  return [
    { name: `Kiến thức trọng tâm ${subject} - ${grade}`, category: "Trọng tâm", semester: 1, isHot: true },
    { name: `Bài tập thực hành và luyện tập ${subject}`, category: "Luyện tập", semester: 1, isHot: true },
    { name: `Vận dụng thực tế và liên hệ cuộc sống`, category: "Vận dụng", semester: 2, isHot: true },
    { name: `Ôn tập học kỳ và củng cố kiến thức`, category: "Ôn tập", semester: 2 },
  ];
}
