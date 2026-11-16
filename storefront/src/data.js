import hero_atelier from '../assets/hero_atelier.jpg';
import hero_object from '../assets/hero_object.jpg';
import hero_bags from '../assets/hero_bags.jpg';
import hero_hangout from '../assets/hero_hangout.jpg';
import c_animals from '../assets/c_animals.jpg';
import c_diamond from '../assets/c_diamond.jpg';
import c_cats from '../assets/c_cats.jpg';
import c_tied from '../assets/c_tied.jpg';
import c_sashiko_set from '../assets/c_sashiko_set.jpg';
import pouch_batik from '../assets/pouch_batik.jpg';
import pouch_button from '../assets/pouch_button.jpg';
import bag_red from '../assets/bag_red.jpg';
import bag_tote from '../assets/bag_tote.jpg';
import bag_catholic from '../assets/bag_catholic.jpg';
import bag_camera from '../assets/bag_camera.jpg';
import bag_messenger from '../assets/bag_messenger.jpg';
import bag_white from '../assets/bag_white.jpg';

/** Photos from the client's catalogue (cropped from the PDF). el/w/h are filled by preloadImages(). */
export const IMG = Object.fromEntries(Object.entries({
  hero_atelier, hero_object, hero_bags, hero_hangout, c_animals, c_diamond, c_cats, c_tied, c_sashiko_set,
  pouch_batik, pouch_button, bag_red, bag_tote, bag_catholic, bag_camera, bag_messenger, bag_white,
}).map(([k, src]) => [k, { src, el: null, w: 1, h: 1 }]));

export function preloadImages(onProgress) {
  const keys = Object.keys(IMG);
  let n = 0;
  return Promise.all(keys.map((k) => new Promise((res) => {
    const el = new Image();
    el.src = IMG[k].src;
    (el.decode ? el.decode() : Promise.resolve()).catch(() => {}).then(() => {
      IMG[k].el = el; IMG[k].w = el.naturalWidth || 1; IMG[k].h = el.naturalHeight || 1;
      n += 1; onProgress && onProgress(n / keys.length); res();
    });
  })));
}

export const BRANDS = {
  atelier: { name: 'Bách Ngộ Atelier', host: 'bachngo.example', wm: 'Bách Ngộ', bg: '#0f1a2a', bg2: '#172840', fg: '#efe9dd', muted: '#9aa7b8', line: 'rgba(239,233,221,.24)', accent: '#d8793a', ink: '#1a0d04', thread: '#f3eee3', dark: true,
    cap: 'Thủ công từ An Giang', box: 'Không xem họ chỉ là người cung cấp vật liệu, mà là những người đồng sáng tạo.',
    lead: 'Bách Ngộ Atelier là xưởng may ở An Giang. Chúng tôi làm túi, đồ dùng trong nhà và nhận gia công OEM / ODM, cùng những người nhuộm chàm, dệt vải và thêu tay.',
    marq: '2026 · Bách Ngộ Atelier · An Giang · Thủ công · Sashiko · Chàm · ', hero: 'hero_atelier', off: 'c_sashiko_set', offCap: 'Lót ly Sashiko · set 6',
    list: ['c_animals', 'bag_red', 'bag_tote', 'pouch_batik', 'oem'] },
  bags: { name: 'Ngộ Crafts', host: 'bags.bachngo.example', wm: 'Ngộ Crafts', bg: '#131315', bg2: '#1f1f23', fg: '#efe9e0', muted: '#a39d95', line: 'rgba(239,233,224,.24)', accent: '#d4442e', ink: '#ffffff', thread: '#efe9e0', dark: true,
    cap: 'Túi và phụ kiện, may từng mũi', box: 'Chế tác 100% thủ công: cắt rập, định hình, đục lỗ, khâu, hoàn thiện, đóng nút, sơn cạnh.',
    lead: 'Ngộ Crafts làm túi và phụ kiện bằng vải dệt tay, denim và da. Mỗi chiếc được cắt rập, khâu và hoàn thiện bằng tay. Nhận thiết kế theo yêu cầu.',
    marq: '2026 · Ngộ Crafts · Túi thủ công · Nhận thiết kế theo yêu cầu · ', hero: 'hero_bags', off: 'bag_messenger', offCap: 'Túi đeo vai cho máy ảnh',
    list: ['bag_red', 'bag_tote', 'bag_catholic', 'bag_camera', 'bag_messenger'] },
  object: { name: 'Bách Ngộ Object', host: 'object.bachngo.example', wm: 'Bách Ngộ Object', bg: '#dfe6e2', bg2: '#cdd6d1', fg: '#14233a', muted: '#4f5d70', line: 'rgba(20,35,58,.26)', accent: '#b4501f', ink: '#fff5ec', thread: '#14233a', dark: false,
    cap: 'Đồ dùng trong nhà, thêu và nhuộm tay', box: 'Thêu tay họa tiết sáng tạo không giới hạn.',
    lead: 'Bách Ngộ Object làm đồ dùng trong nhà: lót ly, ví nhỏ, túi gấp. Vải bông dệt tay, thêu tay họa tiết sáng tạo, chỉ sáp chống xù lông.',
    marq: '2026 · Bách Ngộ Object · Lót ly · Ví nhỏ · Chỉ sáp chống xù · ', hero: 'hero_object', off: 'c_cats', offCap: 'Lót ly nhuộm chàm',
    list: ['c_animals', 'c_diamond', 'pouch_batik', 'c_cats', 'pouch_button', 'c_tied'] },
  hangout: { name: 'Craft Hangout', host: 'hangout.bachngo.example', wm: 'Craft Hangout', bg: '#13231c', bg2: '#1b3026', fg: '#eee9d6', muted: '#9db0a2', line: 'rgba(238,233,214,.24)', accent: '#e3aa2b', ink: '#1d1403', thread: '#eee9d6', dark: true,
    cap: 'Workshop và cộng đồng', box: 'Một buổi sinh hoạt thủ công ngoài trời của Bách Ngộ và những người bạn.',
    lead: 'Craft Hangout là những buổi sinh hoạt thủ công ngoài trời. Bách Ngộ chọn một địa điểm, mang vật liệu, mọi người cùng làm.',
    marq: '2026 · Craft Hangout · Cần Thơ · Cùng làm thủ công · ', hero: 'hero_hangout', off: 'pouch_button', offCap: 'Chỉ, nút và vải',
    list: ['hangout', 'workshop'] },
};

const BAG_STEPS = ['Cắt rập', 'Định hình', 'Đục lỗ', 'Khâu', 'Hoàn thiện', 'Đóng nút', 'Sơn cạnh'];
const OBJ_STEPS = ['Dệt tay vải bông', 'Nhuộm hoặc chọn vải', 'Thêu tay họa tiết', 'May thủ công tại Atelier'];

export const ITEMS = {
  c_animals: { img: 'c_animals', kind: 'batch', stock: 6, of: 12, brand: 'Bách Ngộ Object', code: 'LL-06', title: 'Lót ly thêu tay, bộ 6', desc: 'Vải bông dệt tay, thêu tay họa tiết khác nhau trên từng chiếc. Chỉ sáp chống xù lông, may thủ công tại Bách Ngộ Atelier.', mat: 'Vải bông dệt tay, chỉ sáp', maker: 'Bách Ngộ Atelier', size: '10 × 10 cm / chiếc', price: 834000, note: '139.000₫ / chiếc × 6', steps: OBJ_STEPS },
  c_diamond: { img: 'c_diamond', kind: 'enquire', brand: 'Bách Ngộ Object', code: 'LL-SA', title: 'Lót ly Sashiko viền hoa văn', desc: 'Mặt vải chàm thêu sashiko, viền vải họa tiết. Mỗi chiếc một kiểu mũi thêu.', mat: 'Vải chàm, chỉ thêu trắng (theo ảnh)', maker: 'Bách Ngộ Atelier', size: '—', steps: OBJ_STEPS },
  pouch_batik: { img: 'pouch_batik', kind: 'enquire', brand: 'Bách Ngộ Object', code: 'VI-BT', title: 'Ví khóa kéo batik chàm', desc: 'Ví nhỏ có quai cổ tay, họa tiết batik trắng trên nền chàm.', mat: 'Vải nhuộm batik chàm (theo ảnh)', maker: 'Bách Ngộ Atelier', size: '—', steps: OBJ_STEPS },
  c_cats: { img: 'c_cats', kind: 'enquire', brand: 'Bách Ngộ Object', code: 'LL-MC', title: 'Lót ly nhuộm chàm hình mèo', desc: 'Chín họa tiết, mỗi chiếc một hình: mèo, trăng, hoa.', mat: 'Vải nhuộm chàm (theo ảnh)', maker: 'Bách Ngộ Atelier', size: '—', steps: OBJ_STEPS },
  pouch_button: { img: 'pouch_button', kind: 'enquire', brand: 'Bách Ngộ Object', code: 'TN-01', title: 'Túi nhỏ cài nút, thêu sashiko', desc: 'Túi gấp cài nút gỗ, nhiều màu vải, thêu sashiko trên nắp.', mat: 'Vải gai nhuộm, nút gỗ (theo ảnh)', maker: 'Bách Ngộ Atelier', size: '—', steps: OBJ_STEPS },
  c_tied: { img: 'c_tied', kind: 'enquire', brand: 'Bách Ngộ Object', code: 'LL-DD', title: 'Lót ly Sashiko buộc dây da', desc: 'Bộ lót ly viền vải họa tiết, đóng gói buộc dây da.', mat: 'Vải chàm, chỉ thêu trắng (theo ảnh)', maker: 'Bách Ngộ Atelier', size: '—', steps: OBJ_STEPS },
  bag_red: { img: 'bag_red', kind: 'enquire', brand: 'Ngộ Crafts', code: 'RR-01', title: 'RED & RED', desc: 'Túi xách tay thân đỏ, dải thêu họa tiết ở giữa. Nhãn dệt tay đính kèm.', mat: 'Vải bông dệt tay nhuộm gỗ vang (sappanwood)', maker: 'Ngộ Crafts', size: '30 × 15 × 20 cm (D × R × C)', steps: BAG_STEPS },
  bag_tote: { img: 'bag_tote', kind: 'enquire', brand: 'Ngộ Crafts', code: 'UO-01', title: 'Utility Organizer Tote', desc: 'Túi tote có ngăn xếp gập bên trong, viền xanh navy, dải thêu sashiko ở giữa.', mat: 'Vải gai trắng, viền navy (theo ảnh)', maker: 'Ngộ Crafts', size: '35 × 15 × 30 cm (D × R × C)', steps: BAG_STEPS },
  bag_catholic: { img: 'bag_catholic', kind: 'enquire', brand: 'Ngộ Crafts', code: 'CT-02', title: 'CATHOLIC 02', desc: 'Túi đeo chéo đen, thêu họa tiết đỏ và trắng trên mặt.', mat: 'Grey washed denim, red textured linen, cotton embroidery thread, round waxed thread', maker: 'Ngộ Crafts', size: '28 × 14 × 20 cm (D × R × C)', steps: BAG_STEPS },
  bag_camera: { img: 'bag_camera', kind: 'enquire', brand: 'Ngộ Crafts', code: 'CB-01', title: 'Camera Bag', desc: 'Túi máy ảnh vải dệt sọc, quai da, kèm dây đeo rời.', mat: 'Vải dệt, da (theo ảnh)', maker: 'Ngộ Crafts', size: 'Xem nhãn trong catalogue', steps: BAG_STEPS },
  bag_messenger: { img: 'bag_messenger', kind: 'enquire', brand: 'Ngộ Crafts', code: 'MS-01', title: 'Túi đeo vai cho máy ảnh', desc: 'Túi denim đen, nắp có huy hiệu, quai đeo bản rộng.', mat: 'Denim đen (theo ảnh)', maker: 'Ngộ Crafts', size: '—', steps: BAG_STEPS },
  hangout: { art: 'hangout', kind: 'ticket', stock: 7, of: 20, brand: 'Craft Hangout', code: 'CH-02', title: 'Craft Hangout, buổi tiếp theo', desc: 'Buổi sinh hoạt thủ công ngoài trời của Bách Ngộ và những người bạn. Ngày và địa điểm sẽ công bố.', mat: 'Mang theo đôi tay', maker: 'Bách Ngộ và khách mời', size: '—', price: 150000, note: 'giá minh họa', demo: true, img: 'hero_hangout', steps: ['Đăng ký', 'Nhận địa điểm', 'Mang vật liệu', 'Cùng làm'] },
  workshop: { kind: 'ticket', stock: 4, of: 10, brand: 'Craft Hangout', code: 'WS-01', title: 'Workshop nhuộm chàm', desc: 'Mẫu ý tưởng: một buổi học nhuộm chàm lên vải, mang sản phẩm về.', mat: 'Vật liệu do xưởng chuẩn bị', maker: 'Đu Đủ Indigo (dự kiến)', size: '—', price: 450000, note: 'giá minh họa', demo: true, img: 'pouch_button', steps: ['Đăng ký', 'Học nhuộm', 'Thực hành', 'Mang sản phẩm về'] },
  oem: { img: 'bag_white', kind: 'commission', brand: 'Atelier', code: 'OEM', title: 'Gia công OEM / ODM', desc: 'Nhận may theo bản vẽ hoặc cùng phát triển mẫu. Đã làm cho Anna Ye Tea và Đu Đủ Indigo.', mat: 'Theo yêu cầu', maker: 'Xưởng Bách Ngộ, An Giang', size: 'Theo bản vẽ', steps: ['Gửi bản vẽ', 'Báo giá', 'Làm mẫu', 'Sản xuất', 'Giao hàng'] },
};
