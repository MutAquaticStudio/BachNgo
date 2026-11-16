# @bachngo/gsap-kit

Bộ chuyển động GSAP cho bốn trang web Bách Ngộ (Atelier, Ngộ Crafts, Object, Craft Hangout). Mỗi component là một hàm nhận phần tử DOM và trả về `{ destroy() }`, dùng được với JS thuần, Next.js và React.

Nguồn cảm hứng bố cục và chuyển động: maisonauge.com (chữ khổng lồ cố định, khung ảnh nở ra toàn màn hình, ảnh bay sang trang chi tiết, dải chữ chạy theo tốc độ cuộn, ảnh lệch tốc độ).

## Cài đặt

```bash
npm i gsap          # >= 3.13 (đã gồm SplitText, Flip, ScrollTrigger)
npm i lenis         # tùy chọn, cho cuộn mượt
```

## Dùng nhanh (JS thuần)

```js
import { registerKit, smoothScroll, heroFrame, fitText, marquee, parallax, productCard, autoInit } from '@bachngo/gsap-kit';
import Lenis from 'lenis';

registerKit();
smoothScroll(Lenis);
fitText(document.querySelector('#wmText'), { container: document.querySelector('#wordmark') });
heroFrame({ root, media, fade: ['#cap'], insetTop: () => wordmark.getBoundingClientRect().height * 0.9 });
marquee(document.querySelector('#ticker'));
autoInit(document);            // gom các phần tử có data-kit="rise stitch-rule line-reveal ..."
```

## Dùng trong React / Next.js

```jsx
'use client';
import { useKit } from '@bachngo/gsap-kit/react';
import { productCard } from '@bachngo/gsap-kit';

export function Card({ item }) {
  const ref = useKit((el) => productCard(el));
  return <article ref={ref}>...</article>;
}
```

`useKit` dọn dẹp khi unmount, nên chạy đúng với StrictMode. Với App Router, đặt component có animation trong file `'use client'`. Gọi `ScrollTrigger.refresh()` sau khi ảnh hoặc dữ liệu từ API đã nạp xong.

## Danh sách component

| Hàm | Làm gì | Markup cần |
|---|---|---|
| `registerKit()` | Đăng ký plugin GSAP một lần | không |
| `smoothScroll(Lenis)` | Cuộn mượt, đồng bộ với ScrollTrigger | không |
| `fitText(el, {container})` | Chữ vừa khít chiều ngang (wordmark) | thẻ chứa chữ |
| `heroFrame({...})` | Khung ảnh đè chân wordmark, cuộn thì nở ra toàn màn hình | `root > media > img` |
| `marquee(el)` | Dải chữ chạy, nhanh lên khi cuộn nhanh | `el > [data-track] > 2 span giống nhau` |
| `emblemSpin(el)` | Huy hiệu xoay theo cuộn | một phần tử cố định |
| `parallax(root)` | Mỗi `[data-speed]` trôi một tốc độ | `data-speed="1.3"` |
| `lineReveal(el)` | Chữ hiện từng dòng từ sau mặt nạ (SplitText) | thẻ chữ |
| `rise(el)` | Trượt lên 26px khi vào khung nhìn | bất kỳ |
| `stitchRule(el)` | Đường khâu vẽ ra từ trái sang phải | thẻ trống, CSS nền gạch |
| `heroThread({path, mask, needle})` | Kim kéo chỉ qua đường SVG | SVG có mask |
| `productCard(el)` | Thẻ nhấc lên, viền chỉ chạy, nhãn 1 OF 1 trượt ra | `[data-art]`, `[data-tag]` |
| `provenance(root)` | Chuỗi người làm sáng dần theo cuộn | `[data-fill]` + `ol > li` |
| `weave({colors})` | Chuyển trang kiểu dệt: `await w.run(swap)` | không (tự tạo lớp phủ) |
| `sharedElement({overlay, slot})` | Ảnh bay sang trang chi tiết và bay về | `.shared-full` CSS |
| `cartDrawer({drawer, scrim, ...})` | Ngăn kéo giỏ hàng, Esc đóng, trả focus | `li` cho từng dòng |
| `needleCursor()` | Con trỏ hình kim, nghiêng theo hướng di chuyển | không |
| `countTo(el, n)` | Số đếm lên hoặc xuống (tồn kho, số chỗ) | thẻ chứa số |
| `autoInit(root)` | Gắn component theo `data-kit` | `data-kit="rise"` |

Mỗi hàm có JSDoc đầy đủ; file kiểu TypeScript nằm trong `types/`.

## Công thức tầng lớp kiểu Maison AUGE

Wordmark cố định ở trên cùng, nội dung cuộn qua phía sau, ảnh cuộn qua phía trước:

```css
.text      { z-index: 10 }   /* chữ nằm dưới wordmark */
.wordmark  { position: fixed; z-index: 20; pointer-events: none }
.image     { z-index: 30 }   /* ảnh đè lên wordmark */
.ticker, .emblem { position: fixed; z-index: 40; mix-blend-mode: difference; color: #fff }
```

## Quy ước chuyển động

Mọi thời lượng và easing lấy từ `dur` và `ease` trong `src/core/motion.js` (`fast .24s`, `base .6s`, `slow 1.2s`). Sửa ở đó để đổi cả bộ.

- Chỉ chuyển `transform`, `opacity`, `clip-path`. Không chuyển layout (width, top).
- Nội dung luôn nhìn thấy khi chưa chạy script: các hiệu ứng "hiện ra" chỉ dịch chuyển, không để `opacity: 0`.
- `prefers-reduced-motion: reduce`: component trả về ngay trạng thái cuối, không pin, không chạy tween.
- Thiết bị cảm ứng: `needleCursor` tự tắt.

## Storefront mẫu dùng toàn bộ bộ kit

`storefront/` là một trang đầy đủ dựng bằng bộ kit và Three.js (r128):

- **Màn hình tải:** kim kéo chỉ qua màn hình, số đếm 000 đến 100 chỉ chạm 100 khi font và ảnh đã giải mã xong, rồi các dải vải cuốn lên để lộ trang.
- **Hiệu ứng cuộn:** cuộn mượt (Lenis), khung hero nở ra toàn màn hình, chữ hiện từng dòng, dải chữ nhanh lên khi cuộn nhanh, ảnh bộ sưu tập trôi lệch tốc độ, thanh tiến độ cuộn, huy hiệu xoay theo cuộn, hành lang 3D có điểm dừng.
- **Chuyển trang:** đổi thương hiệu bằng sợi dệt; ảnh bay từ bộ sưu tập hoặc từ tác phẩm 3D sang trang chi tiết và bay về; chuyển món tiếp theo bằng sợi dệt.
- **Trang chi tiết:** ảnh lớn, thông số, giá, nút mua, quy trình sáng dần theo cuộn, món cùng phòng, món tiếp theo. Địa chỉ `#p-<mã món>` mở thẳng trang chi tiết.

```bash
npm run test:store       # build + kiểm tra 35 điểm bằng Playwright (desktop và điện thoại)
open storefront/dist/storefront.single.html
```

## Phát triển

```bash
npm test                 # build demo + chạy smoke test bằng Playwright (desktop và điện thoại)
npm run types            # sinh lại file .d.ts từ JSDoc
open demo/dist/demo.single.html
```

Smoke test kiểm tra: wordmark vừa khít, khung hero mở ra, dải chữ chạy, chuỗi nguồn gốc sáng lên, giỏ hàng mở và đếm, Esc đóng, ảnh bay vào đúng ô chi tiết và bay về, chuyển trang dệt đổi bảng màu, không có lỗi console, không tràn ngang.

## Giới hạn đã biết

- `heroFrame` và `parallax` tính vị trí lúc khởi tạo. Gọi `refresh()` hoặc `ScrollTrigger.refresh()` sau khi font và ảnh nạp xong.
- `sharedElement` dùng bản sao của ảnh. Ảnh trang chi tiết nên cùng nguồn hoặc cùng tỉ lệ với ảnh bấm vào, nếu không sẽ thấy ảnh đổi lúc đáp.
- `weave` mới chạy chuyển cảnh, chưa nối với router. Trong Next.js, gọi `w.run(() => router.push(href))` và chờ route mới render xong trước khi trả Promise.
- GSAP từ 3.13 miễn phí cả plugin. Nên kiểm tra điều khoản hiện hành trước khi phát hành thương mại.
