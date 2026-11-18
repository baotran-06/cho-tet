# Chợ Tết Online

Chợ Tết 3D dùng với TikTok LIVE Studio. Chợ có sạp hoa, bánh, trái cây và đồ Tết quanh lối đi chính. NPC nền đi mua hàng ngay cả khi chưa có quà. Đơn từ quà được chuẩn bị tại sạp, đi theo người giao và xuất hiện ở điểm nhận hàng.

## Chạy trên Windows

1. Giải nén ZIP nhánh `cho-tet-online` vào thư mục riêng. Dừng bản Xóm Online bằng `STOP-XOM.bat` nếu đang dùng cổng 3210.
2. Nhấp đúp `START-XOM.bat`. Lần đầu cần Node.js 22 trở lên và Internet để cài thư viện.
3. Mở màn hình chợ tại http://127.0.0.1:3210/ và điều khiển tại http://127.0.0.1:3210/admin.
4. Thử trước bằng **Bật DEMO → Quà DEMO → Gửi quà**. Ví dụ số lượng 10 Hoa sẽ giao 10 chậu mai và mở mốc đầu tiên. NPC nền không cộng vào giao dịch TikTok.
5. Khi phát thật, nhập tên kênh đang LIVE tại trang điều khiển. Chọn cửa sổ chợ làm nguồn hình trong LIVE Studio. Muốn có tiếng, mở **Âm thanh → Bắt đầu âm thanh** và chọn thu âm hệ thống hoặc ứng dụng phù hợp trong LIVE Studio.
6. Nhấp đúp `STOP-XOM.bat` khi kết thúc.

## Quy đổi quà

Sửa `frontend/config/market.json` bằng Notepad hoặc trình soạn thảo rồi khởi động lại. Mỗi giá trị phải là một mã trong `products`. Mục `byId` ưu tiên hơn `byName`. Tên dùng chữ thường. Ví dụ `"byId": {"12345":"mai"}`, trong đó `12345` chỉ minh họa. Đối chiếu Gift ID và tên thực ở nhật ký sự kiện ở trang điều khiển. Quà không khớp được đếm riêng; lượt thả tim không tạo đơn, còn quà có tên Heart có thể tạo đơn.

Quà chuỗi dùng số lượng từ sự kiện kết thúc chuỗi. Một chuyến giao đại diện cho cả lô; số món giao tăng theo số lượng thật trong lô. Từng sạp xử lý lần lượt, bốn sạp có thể giao song song. Khi hoàn tất giao hàng, người xem thấy tên tài khoản và món đã mua. Mốc mặc định 10/30/60 món mở thêm đèn lồng, tăng người mua nền và chạy pháo hoa. Đèn hội đặc biệt cũng kích hoạt lễ hội sau khi giao xong. Thống kê lưu trong phiên server và được đặt lại khi chuyển phiên hoặc khởi động lại.

Ghép quà thật và đầu ra LIVE Studio phải thử trên một buổi LIVE thực tế. Giới hạn của nguồn TikTok hiện tại gồm việc chưa có sự kiện người xem rời theo từng tài khoản. Chợ dùng dữ liệu DEMO chỉ khi đang bật DEMO.

## Kiểm thử

Dùng `npm ci`, `npm ci --prefix bridge`, `npm run check`, `npm test`, `npm run build`. Sau khi cài Chromium Playwright, chạy `node scripts/browser-check.mjs` để kiểm tra NPC nền, đơn DEMO qua server, giao hàng 3D và mốc phát triển. Workflow GitHub chạy kiểm thử nhánh Chợ Tết; deploy Pages chỉ chạy cho main.
