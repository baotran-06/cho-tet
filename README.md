# HỶ SỰ ONLINE · Đám cưới tương tác 3D

Thay toàn bộ ứng dụng Văn phòng Tổng tài bằng một tiệc cưới 3D WebGL, khung dọc 9:16. Repository và lịch sử Git được giữ để theo dõi thay đổi; mã ứng dụng cũ không nằm trong cây nguồn hiện tại.

## Chạy trên Windows — không viết code

1. Trên GitHub, bấm **Code → Download ZIP**, giải nén toàn bộ thành thư mục riêng, ví dụ `Hy-Su-Online`. Không mở BAT bên trong cửa sổ ZIP, không trộn vào bản game cũ.
2. Cài Node.js **22 LTS trở lên** kèm npm (nếu đã có thì bỏ qua).
3. Nhấp đúp **START-DAM-CUOI.bat**. Lần đầu cần Internet để tự cài thư viện và chuẩn bị tài nguyên. Giữ cửa sổ START mở.
4. Hai trang tự mở: điều khiển `http://127.0.0.1:3210/admin` và sân khấu `http://127.0.0.1:3210/`.
5. Ở cửa sổ sân khấu, bấm **Bật âm thanh** một lần. Đây là yêu cầu của trình duyệt, không thể đảm bảo tự phát trước thao tác người dùng.
6. Khi dùng xong, nhấp **STOP-DAM-CUOI.bat** trong cùng thư mục. Script chỉ dừng phiên do thư mục này mở; không dùng `taskkill` để tắt mọi Node.

Bấm START lần nữa không tạo server trùng. Lỗi cổng bận, thiếu Node, cài thư viện, HTTP/WebSocket đều có thông báo; nhật ký ở `.runtime/logs/latest.log`. Nút “Khởi động lại cầu nối” ngắt và khởi tạo lại phiên ứng dụng; STOP/START dùng khi cần khởi động lại tiến trình.

## Xem web và kết nối LIVE

GitHub Pages phục vụ frontend tĩnh và DEMO; **không chạy Node.js, không tự nhận quà TikTok**. Muốn dùng LIVE trên laptop, chạy BAT và dùng hai trang localhost ở trên. Không dán địa chỉ localhost vào nguồn Liên kết nếu TikTok LIVE Studio từ chối địa chỉ này.

Ở admin nhập **username của tài khoản đang phát LIVE**, bấm Kết nối. Không nhập mật khẩu TikTok. Trạng thái “đã nhận sự kiện thật” chỉ xuất hiện khi bridge nhận payload có ID/tên người dùng hợp lệ từ nguồn TikTok. Socket mở hoặc hình lên livestream chưa chứng minh nhận được quà. Chưa có kiểm thử LIVE thật trên tài khoản của người dùng trong lần xây dựng này.

Nguồn `tiktok-live-connector` được ghim 2.5.0, là thư viện **không chính thức**, có thể bị TikTok/dịch vụ ký giới hạn hoặc thay đổi. Không đảm bảo mọi người xem được nhận diện: bridge chỉ tạo khách từ sự kiện nguồn thực sự cung cấp. Nguồn này không bảo đảm có sự kiện rời LIVE; không suy đoán rời chỉ vì im lặng. Có dedupe, streak kết thúc, giới hạn hàng đợi, reconnect, xử lý stream kết thúc. Kiểm tra `bridge/tiktok.js`, `bridge/diagnostics.js` và các test về payload.

## Quà và vai diễn

Bảng dưới là cấu hình mẫu nhận theo tên. **Gift ID cần đối chiếu với sự kiện thật của tài khoản/khu vực**, chỉnh ở admin; ID ưu tiên hơn tên, lưu trên laptop trong `.runtime/wedding-rules.json`. Quà không khớp không kích hoạt cảnh. Không ghi số xu chưa xác minh.

| Quà | Hành động |
| --- | --- |
| Hoa hồng / Rose | Nụ hôn hạnh phúc |
| Tim ngón tay / Finger Heart | Làm cô dâu |
| Đồng ý / Okay | Làm chú rể |
| Heo may mắn / Lucky Pig | Đổi cô dâu |
| Cỏ bốn lá / Shamrock | Đổi chú rể |
| Bó hoa / Bouquet Flower | Lễ thành hôn |
| Hạc giấy / Paper Crane | Tung hoa cưới |
| Hoan hô / Bravo! | Cả tiệc cùng nhảy |
| Donut / Doughnut | Phòng tân hôn, cảnh vui nhẹ nhàng |

Vai mặc định là nhân vật sân khấu, không phải tài khoản TikTok giả. Người nhận vai hiển thị đúng tên payload trên đầu nhân vật; người đó không xuất hiện trùng ở hàng khách. Vai giữ 3 phút, tạm giữ trong lễ cưới/phòng tân hôn. Quà “làm” bị từ chối khi ghế đã có người; quà “đổi” thay người ngay cả giữa cảnh, giữ cảnh cưới đang diễn ra. Một tài khoản chỉ giữ một vai. Đơn quà liên tiếp được xếp hàng, không chồng cảnh; số lượng streak được ghi vào sự kiện, mỗi streak hoàn tất kích hoạt một tiết mục để không gây lặp hàng nghìn lần.

Khách đi vào lối giữa rồi về bàn; sự kiện rời theo đúng ID làm khách đi ra khỏi cảnh trước khi xóa. DEMO có nút thêm khách, quà và rời tiệc. Nhân viên/khách nền trang trí không gắn tên tài khoản, không tính vào số người xem thật.

## Âm thanh và playlist

- 61 câu thoại được dựng sẵn bằng giọng tổng hợp tiếng Việt: MC, chú rể, cô dâu. Mỗi loại cảnh có 6 biến thể; cảnh chờ có 7 câu. Phát tốc độ vừa nhanh, không nhép miệng, không bắt chước giọng cá nhân trong clip tham khảo.
- Nhạc chờ, nhạc cưới và nhạc phòng riêng tự đổi theo cảnh. Lễ cưới có các lượt thoại theo tiến trình. Khi nói, nhạc tự hạ còn 25% mức đã chọn; không chồng hai câu thoại.
- Admin chỉnh độc lập nhạc / thoại / hiệu ứng, phát–tạm dừng, trước–sau, chọn bài, thêm/xóa MP3 hoặc WAV (tối đa 30 MB/bài, 50 bài). Hết bài tự sang bài tiếp.
- Chạy laptop: nhạc lưu cục bộ ở `.runtime/music`, không upload GitHub. Bản tĩnh: nhạc lưu IndexedDB trong cùng trình duyệt/cùng origin; cửa sổ admin và game cần mở cùng trình duyệt. Xóa dữ liệu trình duyệt sẽ mất playlist tĩnh.
- Nhạc cưới tích hợp tự ưu tiên khi làm lễ; playlist tự chọn dùng ở cảnh chờ. File nhạc người dùng thêm cần quyền phát livestream. Không kèm bài nhạc thương mại từ video tham khảo.

## Thu hình và âm thanh lên TikTok LIVE Studio

Phương án tách biệt khỏi màn hình desktop: **OBS Browser Source → OBS Virtual Camera → TikTok LIVE Studio**.

1. Chạy BAT. Trong OBS đặt canvas dọc **1080×1920**, 30 FPS.
2. Sources → **Browser**: URL `http://127.0.0.1:3210/`, Width **1080**, Height **1920**. Giữ nguồn hoạt động, không đặt chế độ đóng nguồn khi ẩn nếu muốn duy trì phiên. Đặt vừa khung (Fit to screen), không phóng zoom cắt một góc.
3. Dùng chức năng tương tác nguồn trình duyệt trong OBS để bấm **Bật âm thanh**. Kiểm tra nhân vật chuyển động và cột âm lượng OBS nhảy. Chỉ để **một cửa sổ game phát tiếng** để tránh vọng.
4. Start Virtual Camera; trong TikTok LIVE Studio thêm Camera → **OBS Virtual Camera**. Máy quay ảo truyền hình, **không tự truyền tiếng**.
5. Để lấy tiếng: cấu hình OBS monitoring ra thiết bị âm thanh/virtual cable phù hợp rồi thêm đúng thiết bị đầu vào trong LIVE Studio; hoặc dùng capture âm thanh ứng dụng/desktop mà phiên bản LIVE Studio cung cấp. Nếu dùng virtual cable, phải cài từ nguồn chính thức. Tránh thu cùng một tiếng hai lần. Muốn giữ riêng tư âm thanh thông báo, ưu tiên đường âm thanh riêng thay vì thu mọi âm thanh desktop.
6. **Ghi thử 15–30 giây** và nghe lại đoạn ghi để xác nhận cả giọng, nhạc, hiệu ứng. Xem NPC chuyển động trên preview và bản ghi; không dùng nguồn Hình ảnh hay ảnh chụp màn hình.

Tên mục có thể khác theo phiên bản OBS/LIVE Studio. Chưa thể xác nhận capture âm thanh trên máy người dùng hoặc trên livestream TikTok thật từ môi trường xây dựng này. Việc file MP3 phát được trong kiểm thử không thay thế bước ghi thử trên laptop.

## Kỹ thuật và kiểm thử

- Three.js 0.170.0, mô hình hình học 3D có khớp tay chân; không dùng ảnh screenshot làm thế giới game.
- Node.js HTTP + WebSocket localhost; cookie quản trị HttpOnly/SameSite, kiểm tra Origin/Host, không lưu mật khẩu/token TikTok trong mã nguồn.
- Giới hạn 28 avatar người xem hiển thị, 80 chờ; tối đa 2.000 sự kiện đầu vào, 80 tiết mục, lịch sử có giới hạn. Nhãn luôn hướng về camera và ẩn nhãn khách va chạm.
- `npm run check`, `npm test`, `npm run build`; CI kiểm tra Windows BAT và trình duyệt WebGL + giải mã/phát âm thanh. Ảnh các cảnh nằm trong artifact của Actions, không phải ảnh minh họa giả kết quả.
- Source: `frontend/js/scene.js`, `people.js`, `wedding-state.js`, `audio.js`, `client.js`; config `frontend/config/wedding.json`, `dialogue.json`, `voices.json`; bridge trong `bridge/`.
- `scripts/generate-voices.py` là công cụ biên soạn tùy chọn, không chạy lúc dùng game. Cần `edge-tts`, ffmpeg và Internet nếu tự dựng lại thoại; không kèm khóa API. Runtime dùng MP3 đã đóng gói.

## Giấy phép

Mã nguồn: AGPL-3.0-only, giữ LICENSE gốc. Three.js: MIT (assets/vendor/THREE-LICENSE.txt). Font Be Vietnam Pro: OFL (assets/fonts/OFL.txt). Nhạc nguyên bản: CC0, xem `frontend/sounds/wedding/LICENSE.md`. Icon quà là tài sản nhận diện TikTok, không tuyên bố CC0 hoặc sở hữu độc quyền; cần tuân thủ điều khoản nền tảng. Giọng dựng bằng dịch vụ TTS được ghi nguồn trong giấy phép âm thanh, không lấy giọng người trong video tham khảo.
