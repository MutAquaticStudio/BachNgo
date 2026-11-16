# BÀN GIAO — Web bán hàng thủ công Bách Ngộ (concept, GSAP kit, storefront, admin/ERP) — 16/11/2026

## Mục tiêu
Dựng web bán hàng kiêm trưng bày cho khách Bách Ngộ Atelier (đồ thủ công, nghệ thuật), dùng GSAP + Three.js ở frontend, ERPNext (Webshop, Retail/POS, HR) ở backend. Hiện có concept, prototype frontend chạy được và concept admin/ERP. Chưa có backend thật.

## Bối cảnh
- Người dùng là bên làm web (nói tiếng Việt) làm cho khách Bách Ngộ Atelier ở An Giang: xưởng may túi, đồ dùng trong nhà, nhận gia công OEM/ODM.
- Instagram của khách: @bachngo.atelier (hub), @ngo.crafts (túi, thương hiệu Ngộ Crafts), @bachngo.object (đồ dùng trong nhà), @crafthangout.bachngo (workshop). Bài viết nhấn mạnh người làm ra vật liệu (Đu Đủ Indigo, Nùng Indigo ở Cao Bằng) là "người đồng sáng tạo".
- Ảnh sản phẩm lấy từ catalogue PDF khách gửi (Google Drive, 5 trang, `Untitled_Artwork.pdf`). Không lấy được ảnh từ Instagram (công cụ chỉ đọc được chữ). Ảnh trong PDF độ phân giải thấp.
- Repo: https://github.com/MutAquaticStudio/BachNgo — toàn bộ mã nguồn và concept đã được nhập vào nhánh `main` qua pull request đầu tiên (`feat/initial-import`). Repo là public và chứa ảnh sản phẩm của khách (cắt từ catalogue) trong `storefront/assets` và `demo/assets`; cân nhắc chuyển repo sang private.

## Đã làm xong
- Concept web v1 (chủ đề "Sợi chỉ nối những đôi tay": nối người trồng chàm, người dệt, người may). Artifact: https://claude.ai/artifact/DGpLC9YQhuX2F6vGh1jCBG
- Concept UX/UI (phòng trưng bày có quầy, 4 thương hiệu, bảng Three.js/GSAP làm được gì): https://claude.ai/artifact/MjfWqh9vpfrWSkTJ4mu7yw
- Concept admin + ERP (hai lớp giao diện, vai trò, 5 màn hình mẫu dùng ảnh thật, luồng đơn, mô hình dữ liệu, API nối storefront): https://claude.ai/artifact/V8p9HQE1UjeAJBtpCH9smg
- Demo bộ GSAP kit: https://claude.ai/artifact/EgC6v3rHpVpBj7ZkmcAJEm
- Storefront mới nhất (màn hình tải, cuộn mượt, chuyển trang, trang chi tiết, hành lang 3D, 4 thương hiệu): https://claude.ai/artifact/QD73RnuNLpkY2vC7eUs2yU
  - Các link artifact là riêng tư và một số bản cũ đã bị xóa. Nếu link không mở được thì build lại từ mã nguồn.
- Mã nguồn nằm ở gốc repo (trước đó ở thư mục `bachngo-gsap-kit` của một container tạm). Ba trang concept HTML nằm trong `docs/concepts/`. Cấu trúc:
  - `src/` bộ kit GSAP (17 component: heroFrame, fitText, marquee, parallax, lineReveal, sharedElement, weave, productCard, provenance, cartDrawer, needleCursor, countTo, emblemSpin, smoothScroll, autoInit...), `src/react/useKit`, `types/` (sinh từ JSDoc), `README.md`.
  - `demo/` demo kit; `storefront/` trang đầy đủ (esbuild, Three.js r128, Lenis): `src/{main,hall,loader,data}.js`, `index.html`, `style.css`, `assets/` (17 ảnh cắt từ PDF).
  - `test/` bốn bộ kiểm tra Playwright (`smoke`, `storefront`, `storefront-reduced`, `layout`), đều đạt lúc bàn giao. Chạy: `npm test` hoặc `node test/layout.mjs`.
  - Build: `node build.mjs` (demo), `node storefront/build.mjs` (storefront; ra `storefront/dist/storefront.single.html` và `.artifact.html`).

## Quyết định đã chốt (không bàn lại)
- Bốn thương hiệu, mỗi thương hiệu một subdomain, chung giỏ hàng và một backend ERPNext (thương hiệu = Item Group). Tên miền `bachngo.example` chỉ là chỗ giữ chỗ.
- Bán cả món 1 of 1 lẫn lô nhỏ, vé workshop, hỏi giá và đặt làm/OEM; khách trong nước và quốc tế (VND mặc định, USD qua Price List).
- Kiến trúc: frontend headless Next.js + GSAP + Three.js đọc API Frappe; không dùng giao diện Jinja của Webshop (khó làm chuyển trang, pin cuộn).
- Bố cục lấy từ maisonauge.com: chữ thương hiệu khổng lồ, khung ảnh đè chân chữ rồi nở ra toàn màn hình khi cuộn, hộp viền dày chứa câu triết lý, ảnh lệch, dải chữ chạy, ảnh bay toàn màn hình rồi hạ xuống trang chi tiết.
- Màu thương hiệu (suy từ ảnh thật): Atelier nền `#0f1a2a` nhấn `#d8793a`; Ngộ Crafts `#131315` / `#d4442e`; Object `#dfe6e2` / `#b4501f` (nền sáng); Hangout `#13231c` / `#e3aa2b`. Chữ: Be Vietnam Pro 800 (wordmark, tiêu đề), Fraunces, IBM Plex Mono (nhãn).
- Phòng trưng bày 3D: tác phẩm treo trên sợi chỉ, camera đi dọc hành lang theo cuộn, nhãn bảo tàng kiêm bảng mua hàng. Nền: tường vải rủ hai bên, quầng sáng cuối hành lang, vệt sáng dưới sàn. Không làm cửa hàng đi bộ 3D.
- ERP: hai lớp giao diện (Frappe Desk cho kế toán/kho/nhân sự; ứng dụng "Xưởng" cho biên tập, thợ, thu ngân). DocType thêm: Maker, Item Maker (bảng con), Curation Room, Workshop Session; Item thêm trường `is_one_of_one`, `curation_order`, `story`, `size_text`, `materials_text`. Nên bật thêm module Sản xuất (Manufacturing) cho bảng sản xuất và công theo sản phẩm.

## Dữ liệu thật đã có
- Lót ly nhuộm chàm/thêu tay: 139.000₫/chiếc, bộ 6 = 834.000₫, 10 × 10 cm, có giá sỉ, may tại Bách Ngộ (caption Instagram).
- RED & RED 30 × 15 × 20 cm (vải bông dệt tay nhuộm gỗ vang); Utility Organizer Tote 35 × 15 × 30 cm; CATHOLIC 02 28 × 14 × 20 cm (grey washed denim, red textured linen, cotton embroidery thread, round waxed thread).
- Đai máy ảnh Sashiko 1 of 1, mã CS005: nappa + raw selvedge denim + round waxed thread, 7 công đoạn thủ công (cắt rập, định hình, đục lỗ, khâu, hoàn thiện, đóng nút, sơn cạnh). Chưa có ảnh.
- Các giá khác, ngày và địa điểm Craft Hangout: CHƯA có. Trong prototype chúng là số mẫu hoặc "Báo giá".

## Quy tắc / sở thích của người dùng
- Nói tiếng Việt, văn phong thẳng, không khoa trương.
- Muốn thấy kết quả thật: đã nhiều lần phản hồi bằng ảnh chụp khoanh xanh những chỗ lỗi. Luôn kiểm tra bằng Playwright (máy tính và điện thoại, có chụp ảnh) rồi mới báo xong.
- Dùng ảnh thật của khách, không dùng hình minh họa khi đã có ảnh.
- Rất để ý chuyển trang, màn hình tải, hiệu ứng cuộn, và muốn giống Maison AUGE. Không thích nền hành lang phẳng/xám; không thích chữ chạy đổi màu khó đọc; không chấp nhận ảnh bị che.

## Bài học kỹ thuật (đừng lặp lại lỗi)
- Người dùng từng không thấy hiệu ứng vì thiết bị bật "giảm chuyển động". Bộ kit tôn trọng cài đặt đó, nên storefront hiện hộp chọn "Xem đầy đủ / Giữ giảm chuyển động" (`forceMotion`). Giữ nguyên hộp này.
- Không dùng `mix-blend-mode` cho chữ đè lên ảnh (khó đọc); dải chữ hiện là dải nền đặc.
- Collage phải là lưới (grid) nên không chồng; đã có `test/layout.mjs` đo chồng lấn qua cả 4 thương hiệu. Giữ khoảng cách hàng lớn hơn độ trôi parallax.
- Three.js dùng r128 với `outputEncoding = Linear`; để sRGB làm sương mù và sàn sáng lên thành dải xám xanh.
- Lenis xung đột với `snap` của ScrollTrigger: dùng snap tự viết (debounce + `lenis.scrollTo`).
- Artifact: file HTML không được có `<!doctype>/<html>/<head>/<body>`, cần `<title>` và meta `claude:viewport-fit-sides`, script chỉ nạp từ CDN cho phép hoặc gộp inline. Publish vào link đã bị xóa sẽ lỗi: publish file lên link mới và báo người dùng.
- Mermaid trong trang admin chưa xác nhận hiển thị trên link thật.

## Còn bỏ ngỏ / cần hỏi lại
- Khung xem artifact thật của người dùng có cuộn đúng không (họ đã thấy hiệu ứng sau khi có hộp chọn, nhưng chưa xác nhận kỹ). Nền Atelier (nếp vải hơi nhạt) và Object (hơi trắng gắt) đang chờ họ nhận xét.
- Ảnh gốc độ phân giải cao cho từng sản phẩm; ảnh cho Craft Hangout, workshop, đai Sashiko.
- Quy trình từng món trên trang chi tiết là bản mẫu: túi dùng 7 công đoạn của đai máy ảnh, đồ dùng dùng 4 bước (dệt, chọn vải, thêu, may). Khách cần xác nhận.
- Tên miền thật; cổng thanh toán (VietQR/PayOS/VNPay, Stripe/PayPal); đơn vị vận chuyển (GHN/GHTK); hosting ERP (Frappe Cloud hay máy chủ riêng).
- Có bật module Sản xuất không; bảng đơn giá công theo sản phẩm cho thợ; ai nhập sản phẩm hằng ngày và bằng thiết bị nào.
- Tên doctype/quyền ghi theo ERPNext v15, chưa đối chiếu bản cài thật (Webshop và HRMS là app riêng `frappe/webshop`, `frappe/hrms`).
- Điều khoản GSAP (miễn phí cả plugin từ 3.13) cần kiểm tra trước khi phát hành thương mại.

## Bước tiếp theo
1. Clone repo, chạy `npm ci`, rồi `npm test` để xác nhận mọi thứ còn chạy (cần Playwright và Chromium). Quyết định repo public hay private.
2. Lấy ảnh gốc từ khách, thay `storefront/assets/*.jpg`, rồi chạy `npm test`.
3. Ghép storefront vào Next.js (App Router, component `'use client'`, `useKit`), nối `weave` với router, dữ liệu từ API.
4. Dựng ERPNext (Webshop, POS, HRMS, Manufacturing), DocType Maker/Curation Room/Workshop Session, API `/catalog`, `/item/:code`, `/cart`, `/checkout`, `/enquiry`, `/workshop/book`, webhook thanh toán.
5. Làm màn hình biên tập phòng trưng bày (ứng dụng "Xưởng"), vì web phụ thuộc vào nó.
6. Giai đoạn sau: bảng sản xuất, POS ngoại tuyến, công theo sản phẩm, bản tiếng Anh.

## Lời nhắn cho AI tiếp nhận
Đọc hết bản bàn giao này, xác nhận ngắn là đã hiểu, rồi bắt đầu từ "Bước tiếp theo" số 1. Hỏi người dùng trước khi đẩy hay merge thứ gì lên repo của họ.
