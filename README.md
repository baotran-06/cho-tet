# Văn phòng Tổng tài

Game tương tác TikTok LIVE khung dọc 9:16. Tổng tài ngồi sau bàn, thư ký đứng sau vai, Liễu Như Yên vào từ cửa. Có 9 quà, tên người tặng trên đầu, camera theo cảnh, lời thoại tiếng Việt và nhạc theo trạng thái.

## Mở trên Windows

1. Cài Node.js 22 LTS trở lên. Giải nén toàn bộ Van-Phong-Tong-Tai.zip vào thư mục riêng.
2. Nếu bản trước đang chạy, dùng file STOP trong thư mục bản đó trước.
3. Bấm đúp START-TONG-TAI.bat. Lần đầu cần Internet để cài thư viện. Giữ cửa sổ cầu nối mở.
4. Game mở tại http://127.0.0.1:3210/, điều khiển tại http://127.0.0.1:3210/admin.
5. Bấm Bật âm thanh trên game. Mở Điều khiển, bật DEMO, chọn tên mô phỏng rồi thử từng quà.
6. Kết thúc bằng STOP-TONG-TAI.bat. Bộ khởi động chỉ dừng dịch vụ thuộc thư mục này.

Bộ khởi động cũ START-XOM/STOP-XOM vẫn gọi cùng chương trình để hỗ trợ người đã quen dùng. Đổi tên sản phẩm không thay giao thức nhận diện tiến trình nội bộ.

## Quà đã cấu hình

| Quà | Hành động |
|---|---|
| Paper Crane / Hạc giấy | Sa thải thư ký, tổng tài chỉ nói “Cô bị sa thải.” |
| Bouquet Flower / Bó hoa | Kết hôn, nhạc cưới, nhẫn và vỗ tay |
| Doughnut / Donut | Phòng tân hôn, cửa khép, tối đa 3 phút |
| Bravo! / Hoan hô | Liễu Như Yên mang tên người tặng, va chạm hoạt hình và tiếng BỐP |
| Shamrock / Cỏ bốn lá | Người tặng thay tổng tài 3 phút; đang cưới thì đổi chú rể và bắt đầu lại lễ cưới |
| Lucky Pig / Heo may mắn | Đổi diện mạo thư ký, đưa thư ký trở lại nếu đang vắng |
| Okay / Đồng ý | Nhận vai tổng tài 3 phút khi ghế trống; ghế có người thì không nhận và không phát hiệu ứng |
| Finger Heart / Tim ngón tay | Người tặng nhận vai thư ký 3 phút |
| Rose / Hoa hồng | Tổng tài hôn má thư ký |

Vai được cấp từ thời điểm quà được xử lý. Vai tổng tài đã có người chỉ được thay bằng quà Đổi tổng tài; quà Làm tổng tài bị bỏ qua, không gia hạn thời gian. Vai trống sau 3 phút mới nhận quà Làm tổng tài trở lại. Đồng hồ chạy ngầm. Hết giờ trả tên về mặc định. Quà Đổi thư ký đổi diện mạo và giữ tên, thời hạn hiện tại; quà Đổi tổng tài nhận người tặng làm chủ vai mới trong 3 phút. Sau sa thải, thư ký vắng mặt đến khi có quà nhận/đổi thư ký. Cảnh cần thư ký sẽ chờ, quà đưa thư ký trở lại có thể đi trước các cảnh bị chặn.

Quà combo nhận một cảnh với tổng số lượng hiển thị. Bộ TikTok bridge chỉ gửi tổng streak khi nguồn báo kết thúc streak, loại trùng bằng ID. Hàng đợi giới hạn 120 cảnh, sự kiện và nhật ký được giới hạn bộ nhớ.

Chỉnh Gift ID ở bảng điều khiển. ID được ưu tiên hơn tên, lưu trong phiên cầu nối và giữ qua đổi chế độ/kết nối lại. Muốn mặc định lâu dài, sửa frontend/config/office.json. Tên trên là tên quy đổi cấu hình, danh mục TikTok thực tế có thể khác theo tài khoản. Xem sự kiện thật và Gift ID ở nhật ký để đối chiếu.

## Nhạc và lời thoại

- Bấm Bật âm thanh trong chính cửa sổ đang phát game. Nếu game chạy trong OBS, dùng chuột phải nguồn Trình duyệt → Tương tác.
- Điều khiển có âm lượng nhạc, lời thoại, hiệu ứng riêng; bật/tắt độc lập.
- Chờ quà dùng nhạc chill, cưới dùng nhạc lễ cưới, Liễu/sa thải dùng nhạc căng, tân hôn dùng nhạc dịu. Nhạc hạ xuống khi có lời.
- Lời thoại nam và nữ tiếng Việt tổng hợp được tạo sẵn. Mỗi sự kiện có 6 biến thể, luân phiên không lặp liền nhau. Sa thải dùng một câu ngắn mỗi lượt. Dòng phụ đề và tiếng chạy theo cùng mốc cảnh.
- Thêm MP3/WAV trong Điều khiển, tối đa 50 bài, 30 MB/bài. Nhạc được lưu ở .runtime/music trên máy. Chọn bài rồi phát/dừng, chuyển trước/sau hoặc xóa. Kết thúc bài sẽ chuyển tiếp trong playlist. Chỉ dùng bài bạn có quyền phát LIVE.
- Bản GitHub Pages hỗ trợ DEMO và bộ nhạc có sẵn. Lưu playlist và nhận TikTok thật dùng bản Windows.
- Giai điệu nhạc nền và hiệu ứng được tạo riêng cho dự án. Xem docs/OFFICE-ASSETS.md.

## Đưa riêng game lên TikTok LIVE Studio

Nguồn Liên kết của LIVE Studio trên máy người dùng đã từ chối URL 127.0.0.1. Dùng OBS để mở trang local:

1. Chạy START-TONG-TAI.bat.
2. OBS → Nguồn → Trình duyệt → URL http://127.0.0.1:3210/, rộng 1080, cao 1920.
3. OBS → Thiết đặt → Video → Canvas và đầu ra 1080×1920, 30 FPS.
4. Chuột phải nguồn Trình duyệt → Tương tác → Bật âm thanh. Nếu đang bật Chế độ Studio, chuyển cảnh sang Chương trình.
5. Bắt đầu máy quay ảo, LIVE Studio → Camera → OBS Virtual Camera. Kiểm tra chuyển động trước khi lên LIVE.
6. Camera ảo chuyển hình. Để thu riêng tiếng game, trong thuộc tính nguồn Trình duyệt chọn Điều khiển âm thanh qua OBS, định tuyến âm thanh OBS vào đầu vào của LIVE Studio bằng thiết bị âm thanh ảo nếu cần. Xem đồng hồ âm thanh và thử ghi 10 giây. Phần định tuyến này cần cấu hình trên laptop, chưa được xác minh từ xa.
7. Phát LIVE, mở Điều khiển, nhập username và Kết nối. Chỉ khi có sự kiện nguồn thật, giao diện mới ghi đã nhận sự kiện. Thử một quà đã gắn để xác nhận.

Mật khẩu TikTok không được nhập vào ứng dụng. Thư viện TikTok không chính thức có thể bị hạn chế hoặc cần dịch vụ ký bên ngoài. Kết nối quà thật và thu âm lên LIVE của tài khoản người dùng cần được kiểm tra trên laptop.

## Mức độ đồ họa

Màn hình chính hiện là văn phòng WebGL 3D với nhân vật hình học, khớp tay chân và các bàn nhân viên. Không dùng ảnh nhân vật ghép lớp làm màn hình chính; không có hoạt ảnh nhép miệng. Tạo hình vẫn là bản cách điệu dựng bằng code, chưa tinh xảo như ảnh render đã duyệt.

## Phát triển và kiểm thử

- npm ci và npm ci --prefix bridge
- npm run check, npm test, npm run build
- XOM_TEST_CHROMIUM=/path/to/chrome node scripts/browser-check.mjs
- frontend/js/office-state.js quản lý vai, thời gian, quà, hàng đợi.
- frontend/office-3d/room.js, people.js quản lý diễn cảnh, focus và tên.
- frontend/js/office-audio.js, frontend/config/voices.json quản lý nhạc/thoại.
- bridge/ nhận nguồn TikTok, xác thực lệnh local và phát trạng thái qua WebSocket.

GitHub Actions kiểm tra bản build, browser, Windows START/STOP và triển khai Pages bằng workflow hiện có.

## Bản thử văn phòng 3D có nhân viên

START tự mở /office-3d/index.html. Đường dẫn gốc của máy chủ và Pages cũng tự chuyển sang trang này. Bản này có tổng tài, thư ký, Liễu Như Yên dựng bằng hình học 3D và 16 vị trí nhân viên. Người xem nhận được sự kiện nguồn sẽ có nhân viên theo đúng ID; không thể xác định những tài khoản TikTok không cung cấp sự kiện. Trong DEMO bấm Thêm 12 nhân viên. Tặng Đồng ý hoặc Tim ngón tay để nhân viên đi từ bàn lên vai lãnh đạo; hết thời hạn sẽ đi về bàn. Một tài khoản chỉ giữ một vai cùng lúc. Tên được rút gọn, bảng tên chồng nhau được ẩn bớt. Giới hạn 16 nhân viên nhìn thấy giúp giữ hiệu suất.

Đây là bản hình học cách điệu và đã được đặt làm màn hình chính. Chưa đạt độ chi tiết của hình render đã duyệt và chưa có facial rig/hoạt ảnh tiếp xúc hoàn chỉnh. Nhạc và thoại dùng lại hệ thống đã có; LIVE thật vẫn cần kiểm tra với tài khoản đang phát.

### Thoại hoạt náo và mời nhận vai

Bản thoại mới có 6 kịch bản cho mỗi hiệu ứng, cùng 18 câu chờ chia theo hai vai đang trống, trống tổng tài hoặc trống thư ký. Dùng giọng nam trầm, thư ký nữ nhẹ, Liễu sắc sảo và MC công ty như bản âm thanh thử đã duyệt. Sau khoảng chờ đầu 2,5 giây, các câu chờ nghỉ 3–5 giây sau khi câu trước kết thúc. Các lượt đáp trong cảnh cách nhau khoảng 0,12 giây. Khi cả hai vai đã có người, các lời mời tự dừng. Cảnh quà cắt ngay thoại chờ; nhạc giảm khi nói. Không chạy chồng hai câu thoại. Tắt âm lời thoại ở Điều khiển sẽ tắt cả lời mời.

Cấu hình lời tại frontend/config/dialogue.json. File frontend/config/voices.json giữ thời điểm, thời lượng và vùng phát trong voices-v3.mp3; nhờ vậy trình duyệt tải chung một tệp thay vì hàng trăm tệp nhỏ. Công cụ scripts/generate-office-voices.py chỉ dùng khi biên soạn, cần edge-tts và ffmpeg, không cần chạy trên máy người dùng. Giọng vẫn là tiếng tổng hợp, không sao chép giọng người trong video mẫu.

### Lễ cưới 3D

Quà Bó hoa chuyển hẳn khỏi văn phòng sang lễ đường 3D với cổng hoa, thảm cưới, ghế khách, váy cô dâu, khăn voan và vest chú rể. Lễ cưới kéo dài tối thiểu 26 giây. Trong lễ cưới, quà Cỏ bốn lá chuyển vai chú rể cho người gửi, đặt lại lời thoại, nhạc và thời gian lễ từ đầu; không chèn cảnh văn phòng hay hiệu ứng đổi vest giữa chừng. Chỉ khi lễ cưới hoàn tất mới trở về văn phòng và xử lý cảnh đang chờ. Quà Làm tổng tài gửi lúc ghế có chủ được ghi nhận nhưng không chiếm vai, không gia hạn, không phát lời nhận vai. Nút DEMO bị khóa và thẻ hướng dẫn đánh dấu ghế đã có người; ứng dụng không thể khóa danh mục quà trong TikTok.
