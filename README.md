# Bến Mai · Chợ Tết Online

Chợ 3D ven sông Nam Bộ dành cho khung chợ nổi ngang 16:9. Quà xuất hiện trên bảng chính dưới dạng hình, tên và hành động. Khi nhận quà, ô tương ứng sáng lên và hiện tên người tặng.

## Mở trên Windows

1. Giải nén toàn bộ. Nếu đang chạy bản cũ trên cổng 3210, tắt bằng **STOP-XOM.bat** trong thư mục cũ.
2. Bấm **START-XOM.bat**. Lần đầu cần Node.js 22 trở lên và Internet để cài thư viện.
3. Màn hình chợ mở tại http://127.0.0.1:3210/ và bảng điều khiển tại http://127.0.0.1:3210/admin.
4. Trong **DEMO**, chọn một trong 10 quà rồi bấm gửi. Thử Hoa hồng số lượng 10 để xem một chuyến giao theo lô.
5. Khi tài khoản đang phát TikTok LIVE, nhập tên người dùng và bấm **Kết nối**. Thêm cửa sổ Bến Mai làm nguồn hình trong LIVE Studio. Nếu dùng cửa sổ trình duyệt rộng, thu cửa sổ ở tỷ lệ ngang 16:9.
6. Trong trang điều khiển, dùng **Thêm bài** để chọn MP3/WAV từ máy. Có chọn bài, phát/dừng, chuyển bài, lặp bài và âm lượng riêng. Giữ tab điều khiển mở, chọn nguồn thu âm trình duyệt hoặc âm thanh hệ thống trong LIVE Studio và kiểm tra đồng hồ âm thanh. Playlist file cá nhân chỉ tồn tại trong phiên hiện tại.
7. Kết thúc bằng **STOP-XOM.bat**.

## Quà và đơn hàng

Bảy món mua được chuẩn bị song song ở các sạp. Người bán chuẩn bị hàng, nhân viên mang ra cầu gỗ, ghe cập bến nhận từng lô rồi chèo tiếp. Lì xì, thắp đèn và múa lân được chạy độc lập với hàng đợi giao hàng. Số lượng món đã giao được cộng sau khi hàng ra ghe. Ba mốc 10, 30 và 60 món tăng khách nền và kích hoạt pháo hoa.

Đối chiếu Gift ID thật trong nhật ký từ phiên LIVE của bạn. Sửa quy đổi trong `frontend/config/market.json`, trong đó ID ưu tiên hơn tên. Các ID chưa xác định sẽ khớp bằng tên. Quà không khớp được thống kê riêng. Ảnh tĩnh dùng từ danh mục https://beetgames.com/pt-br/tiktok-gifts/vn/ để người xem nhận diện quà.

Chưa xác minh quà và thu âm từ một phiên LIVE của tài khoản người dùng. GitHub Pages chạy DEMO. Windows chạy cầu nối LIVE cục bộ.
