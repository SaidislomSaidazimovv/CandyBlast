# Candy Blast

The first public release is focused on 20 handcrafted levels, stable play, consistent mobile UI, and account-based cloud progress.

- The playable client lives at the repository root.
- The official download website lives in `site/`.
- Mobile packaging and release environments are documented in [MOBILE_RELEASE_ARCHITECTURE.md](MOBILE_RELEASE_ARCHITECTURE.md).

Hozirgi reliz maqsadi: 20 ta alohida sozlangan, taymersiz bosqich.
Joriy ishlar va tashqi bog‘liqliklar: [RELEASE_PLAN.md](RELEASE_PLAN.md).
Balans: [BALANCE_REPORT.json](BALANCE_REPORT.json), qayta ishga tushirish: `node scripts/balance.cjs 30`.
Quyidagi 100 bosqich haqidagi yozuvlar oldingi versiyaga tegishli.

## Yagona mobil interfeys

Bosh menyu, sozlamalar, xarita, mukofotlar, Lucky Spin, reyting va qo‘llanma
3D o‘yin ranglari va yumaloq boshqaruvlariga moslashtirilgan. Mahalliy SVG
ikonlar bir xil uslubda ishlaydi; tashqi ikon xizmatlari kerak emas.
Kichik ekranlarda uzun panellar aylantiriladi va xavfsiz ekran chetlari hisobga olinadi.
Jonlar indikatori faqat qiymat o‘zgarganda qayta chiziladi.

## Amaldagi o‘yin — 3D

Asosiy manzil `/` endi haqiqiy 3D maydonni ishlatadi. Alohida namuna ochish
kerak emas: eski `/prototype/index.html` ham asosiy o‘yinga yo‘naltiradi.
Xarita, 100 bosqich, muz/yig‘ish vazifalari, maxsus konfetlar, boosterlar,
taymer, pauza va localStorage progressi amaldagi o‘yin yadrosida saqlangan.
`js/render-bridge.js` modelni rendererga uzatadi; `js/renderer3d.mjs` faqat
tasvir va kiritishni boshqaradi. 3D ochilmasa, mavjud 2D maydon ishlaydi.

`node scripts/serve.cjs` → http://127.0.0.1:4174/

Tekshiruv: `node --test tests/regression.cjs tests/prototype.test.mjs`.
Three.js fayllari mahalliy saqlanadi va ishlab chiqarish offline keshiga
kiritilgan. Mahalliy serverda service worker keshdan javob bermaydi, shuning
uchun tahrirlar reload bilan ko‘rinadi. Quyidagi namuna hisobotlari tarixiy.

HTML, CSS va JavaScript bilan yozilgan match-3 o‘yin. 5 hudud, 100 bosqich,
maxsus konfetlar, jonlar, boosterlar va kundalik sovg‘alar mavjud.

## Tarix: 2026-09-11 haqiqiy 3D namuna

Mobil yangilanish: namuna endi bitta ekranga sig‘adigan o‘yin HUDiga ega.
Maqsad/yurishlar tepada, maydon o‘rtada, Yordam/Qayta pastda. Sozlamalar
pauza dialogida; dialog ochilganda animatsiya ham to‘xtaydi. Tanlangan konfet
ko‘tariladi va kattalashadi, oq ramka/ko‘rsatkich hamda aria-pressed holati bilan
belgilanadi. Butun katak bosish sohasi, pointer capture va yo‘nalishli surish
ishlatiladi. 320×568, 390×844 va 844×390 brauzer maketlari scrollsiz tekshirildi.
Bu real iOS/Android qurilma sinovi yoki native ilova tayyor degani emas.

Mahalliy server yoqilganda `/prototype/index.html` ni oching. 64 ta haqiqiy
3D konfet, hajmli maydon/fon, tanlash va surish, mosliklar, kaskadlar, Yordam,
qayta boshlash, avtomatik namoyish va sifat tanlovi mavjud. Bu alohida namuna:
asosiy o‘yinning maxsus konfetlari, xaritasi va saqlash tizimi hali ulanmagan.
Namuna localStoragega yozmaydi. Three.js r186 fayllari loyiha ichida saqlanadi.

Tezlik paneli: `/index.html?profile=1` va `/prototype/index.html?profile=1`.
Paneldagi O‘lchash 12 soniyalik rAF intervali va Long Tasks o‘lchovini oladi.
3D avtomatik namoyishini yoqib faol animatsiyalarni tekshiring. Oddiy sahifada
profil sikli yoqilmaydi. 3D sahna tinch turganda qayta chizish to‘xtaydi.
Bu laboratoriya boshlang‘ich o‘lchovi, real telefon sinovining o‘rnini bosmaydi.

Namuna qoidalari sinovi: `node --test tests/prototype.test.mjs`.
Asl algoritm o‘lchovi: `node scripts/benchmark-rules.mjs`.
O‘lchovlar va chegaralari: [PERFORMANCE_BASELINE.md](PERFORMANCE_BASELINE.md).
3D hali PWA offline keshiga qo‘shilmagan; birinchi yuklanishda server kerak.

## Ishga tushirish

Node.js bilan mahalliy ko‘rish serverini ishga tushiring:

```sh
node scripts/serve.cjs
```

Brauzerda `http://127.0.0.1:4174` ni oching. Build va paket o‘rnatish talab qilinmaydi.
PWA hozircha sayt ildizida joylashtirishga mo‘ljallangan. `file://` orqali ochish
service worker sinovi uchun mos emas.

## Tekshiruvlar

Node.js mavjud bo‘lsa, tashqi paketlarsiz:

```sh
node --test tests/regression.cjs
```

Testlar asl o‘yin funksiyalarini ajratilgan muhitda tekshiradi: taymer, retry,
pause, natijani bir martalik yakunlash, saqlash, boosterlar va mukofotlar.
DOM va vaqt sun’iy muhitda beriladi; bu haqiqiy telefon sinovining o‘rnini bosmaydi.

## 2026-09-10: birinchi tuzatishlar

- Telefon va planshetda maydon hamda boosterlar mavjud joyga moslashadi.
- Retry tanlangan qiyinlik bilan qayta boshlanadi; taymer Play bosilganda yoqiladi.
- Pregame Back taymerni ishga tushirmaydi; quit eski taymerni to‘xtatadi.
- Vaqt tugaganda davom etayotgan kombinatsiya yakunlanadi; natija va jon sarfi bir marta hisoblanadi.
- Eski o‘yin animatsiyasi/booster callbacki yangi bosqichga ta’sir qilmaydi.
- Saqlangan o‘yin takror qayta ochishda saqlanadi; barqaror holat va booster yurishlari yoziladi.
- Reset xotiradagi holatni ham tozalaydi.
- Wrapped bilan boshqa maxsus konfetlarni birlashtirishdagi aktivatsiya xatosi tuzatildi.
- Bomb boosteridan keyin yutuq tekshiriladi; oxirgi hammerni bekor qilish mumkin.
- Haftalik bonus bir marta beriladi; hafta dushanbadan boshlanadi, sovg‘alar yozuviga mos beriladi.
- Oylik sovg‘a 30-kundan keyin 1-kunga qaytadi.
- Tutorial xaritadagi haqiqiy bosqichga olib boradi.
- Service worker keshi v6 ga yangilandi; boshqa ilovalarning keshi o‘chirilmaydi.

## Keyingi bosqich

Soatlik sovg‘alar hisobi, onlayn reyting, keyingi bosqichlarning statistik balansi,
yangi to‘siq turlari va to‘liq PWA qurilma sinovlari hali alohida ishlar.
Boshlang‘ich tahlil va qolgan yo‘nalishlar [AUDIT.md](AUDIT.md) da.

## 2026-09-11: konfetlar va yangi vazifalar

- 6 ta original SVG konfet va alohida rangli bomba: rangdan tashqari shakl bilan ham ajraladi.
- Tinchroq o‘yin foni, yangi maydon, vazifalar paneli va aniq muz qatlamlari.
- 4 turdagi bosqich: ball, ma’lum konfetlarni yig‘ish, muz tozalash, yig‘ish + muz.
- Dastlabki 12 bosqich alohida ketma-ketlikda tuzildi. Qolgan bosqichlar 4 vazifa va
  5 muz naqshini almashlab foydalanadi. Hammasi qo‘lda balanslangan deb hisoblanmaydi.
- Vaqtli va vaqtsiz bosqichlar. Muz katakda qoladi, ustidagi konfet yo‘qotilganda ochiladi.
- Konfetlar orasidagi almashtirish va haqiqiy masofaga mos tushish animatsiyasi.
- Hint ikki konfetni ko‘rsatadi. Yurish qolmaganda avtomatik aralashtirish bepul;
  yurish, ball, muz va yig‘ilgan konfetlar hisobi saqlanadi.
- Oddiy aralashtirish konfetlar sonini va maxsus konfetlarni saqlaydi. Juda noodatiy,
  yaroqli tartibga keltirib bo‘lmaydigan maydon qayta yaratiladi; maxsus konfetlarning
  kuchi saqlanadi, ularning rangi yangi maydonga moslashtirilishi mumkin.
- V4 xarita progressi bosqich raqami orqali saqlab qolinadi. Eski davom etayotgan
  o‘yin asl ball vazifasi bilan tugatiladi; yangi vazifalar keyingi boshlashda qo‘llanadi.
- Muz va yig‘ilgan konfetlar ham saqlanadi. Konfet kataklari klaviatura orqali bosiladi.
- Offline kesh v8: yangi tasvirlar va vazifa moduli ham keshga kiritilgan.

Tekshiruvlar: 36 ta avtomatik test; brauzerda muzli moslik, Hint va qayta ochish;
telefon, planshet va kompyuter o‘lchamlarida joylashuv tekshiruvi.


## Interface and gameplay follow-up

All legacy region return routes now use the continuous journey map. Hearts and
stars have separate filled and empty symbols. Reward notices share one bounded
status surface. The color-bomb booster waits for a selected candy and consumes
stock only when applied. Hints rank immediate matches by objectives and special
creation; availability checks inspect only the swapped lines on stable boards.

Settings offers three locally synthesized melodies. The entry screen now uses
Supabase Auth for email/password, password recovery, Google and Apple OAuth, while
guest play remains available. Signed-in players synchronize profile, released-level
progress, stars, scores, lives, boosters, rewards, settings and an active game with
an offline-first merge. Run the RLS migration and configure redirect/provider values
by following [supabase/SETUP.md](supabase/SETUP.md). Only the publishable key belongs
in browser code; privileged credentials stay in Supabase and provider dashboards.

Validation: node --test tests/regression.cjs tests/prototype.test.mjs tests/spin.cjs
The suite compares local move checks with full-board checks on 100 generated boards.
No claim of superiority over Candy Crush's private engine or mobile FPS is made.
