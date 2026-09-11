# 3D namuna va boshlang‘ich unumdorlik hisoboti

Sana: 2026-09-11. Bu qisqa mahalliy o‘lchov; real telefon sertifikati emas.

Keyingi mobil UI yangilanishida scroll qilinadigan namuna maketi o‘rniga
bitta ekranli HUD, pauza dialogi va aniq konfet tanlovi qo‘shildi. Quyidagi
FPS raqamlari avvalgi maketga tegishli; yangi kamera/tanlov uchun qayta
unumdorlik sinovi hali bu jadvalga qo‘shilmagan. Yangilangan maket 320×568,
390×844 va 844×390 da sig‘di; surib yurish 0→90 ochko, 30→29 yurish berdi.

## Tayyor natija

`http://127.0.0.1:4174/prototype/index.html` — alohida o‘ynaladigan 3D namuna.
64 konfet olti umumiy model/material guruhida chiziladi. Maydon, tepaliklar,
shirinlik daraxtlari va bulutlar ham geometrik obyektlar. Kamera va yoritish
haqiqiy 3D. Matn va boshqaruv o‘qilishi uchun HTML qatlamida qoladi.

Tanlash, qo‘shni konfetlarni bosish/surish, yaroqsiz yurishni qaytarish,
moslik, kaskad, ochko, 30 yurish, 1000 ochkolik maqsad, Hint, reset va avtomatik
namoyish ishlaydi. Namuna localStoragega tegmaydi. Ishlab turgan asosiy o‘yin
hali ushbu rendererga ko‘chirilmagan; maxsus konfetlar va barcha bosqichlar
namunaga ulanmagan.

Sahna tinch turganda render sikli to‘xtaydi. Animatsiya bitta requestAnimationFrame
sikli orqali ishlaydi; tab yashirilsa sikl to‘xtaydi. Model/materiallar va
zarrachalar uchun cheklangan instansiyalar ishlatiladi. Sifat tanlovi render
aniqligini cheklaydi; avtomatik rejim uzoq sekinlashishda aniqlikni pasaytiradi.
Kontekstni yo‘qotish/tiklash va resurslarni bo‘shatish yo‘llari yozilgan,
lekin kontekst yo‘qotish bu sinovda majburan chaqirilmadi.

## Brauzer o‘lchovlari

Usul: ?profile=1 panelida 12 soniya; rAF intervallari, p95/p99, maksimal
interval va Long Tasks API. Bu CPU/GPU profiler trace yoki GPU vaqtining
to‘g‘ridan-to‘g‘ri o‘lchovi emas. FPS rAF chastotasidir; tinch 3D sahnada
renderer ataylab har kadrni qayta chizmaydi. Yuklanish/shader qizishi bu
o‘lchovlardan oldin tugagan. Qurilma: shu kompyuterdagi Codex in-app brauzeri.

| Holat | Oyna / DPR | FPS | p95 / p99 (ms) | Eng uzun kadr (ms) | Uzoq vazifalar |
| --- | --- | --- | --- | --- | --- |
| 2D, 3-bosqich, tinch holat | 1280×720 / 1.25 | 60.0 | 17.0 / 17.2 | 17.4 | 0 |
| 2D, Hint va bitta yurish | 1280×720 / 1.25 | 57.3 | 16.8 / 33.4 | 100.4 | 1; 117 ms |
| 2D, Hint va bitta yurish, teng oyna | 1280×800 / ≈1 | 58.7 | 16.8 / 33.3 | 67.0 | 0 |
| 3D, avtomatik yurishlar, yakuniy yoritish | 1280×800 / ≈1 | 60.0 | 16.8 / 17.0 | 17.2 | 0 |

Oxirgi 3D namunada 12 010 ms davomida 721 rAF kadr kuzatildi; natija vaqtida
720 ochko, 22 yurish qolgandi. O‘sha kadr renderer hisobida 41 draw call,
101 570 uchburchak, 21 geometriya va 3 tekstura bor edi. Bular pik qiymatlar
emas. 2D va 3D yurish ketma-ketligi va qoidalari bir xil emas: jadval
boshlang‘ich yo‘nalishni ko‘rsatadi, qat’iy A/B tezlik g‘alabasi emas.

2Ddagi 117 ms hodisa kuzatildi, lekin uning aynan qaysi funksiya sababli
chiqqani call-stack profili bilan aniqlanmagan. Takroriy teng oyna sinovida
bu hodisa qaytmadi; uni doimiy xato deb talqin qilish mumkin emas.

## Asl algoritmning CPU sinovi

Takrorlash: `node scripts/benchmark-rules.mjs`. Node v22.19.0, 250 ta
takrorlanadigan maydon (seed 0..249), olti rang, 30 ta qizdirish namunasi.
Asl js/specials.js va js/adventure.js funksiyalari VMda chaqiriladi.
DOM, GPU, saqlash va aralashtirish sikli bu o‘lchovga kirmaydi.

| Funksiya | p50 (ms) | p95 (ms) | max (ms) |
| --- | --- | --- | --- |
| findMatchesNew | 0.098 | 0.141 | 0.329 |
| findAvailableMove | 0.825 | 3.726 | 5.695 |

Yurishsiz maxsus maydonni to‘liq qidirish bir martalik sinovda 9.927 ms oldi.
Natijalar ishga tushirishlar orasida o‘zgaradi. Keyingi bosqichda qo‘shni
kataklar atrofidagi lokal tekshiruv va cheklangan aralashtirish ishlari ustuvor.

## Tekshirilgan va qolgan ishlar

- Asosiy o‘yinning 36 funksional testi o‘tdi.
- 3D namuna uchun 4 test: 500 seedda takrorlanadigan/yaroqli maydonlar,
  gravitatsiyada tartibni saqlash, kesishuvchi mosliklar va doimiy RNGda tugash.
- Sichqoncha orqali 3D raycast bilan yurish: 0→90 ochko, 30→29 yurish.
- Klaviaturada yaroqsiz qo‘shni almashuv qaytarildi: 0 ochko va 30 yurish
  saqlandi. Qayta boshlash va Yengil sifat tanlovi ham tekshirildi.
- Konsolda bajarilishni to‘xtatuvchi xato topilmadi. Grafik drayver shader
  hisobida juda kichik sonlar aniqligi haqida bitta ogohlantirish chiqardi;
  sahna chizilishi davom etdi. Turli qurilmalardagi grafik sinovda kuzatiladi.
- Kompyuter va 375×667 mobil maket ko‘rildi: 64 konfet mavjud, gorizontal
  toshib ketish yo‘q. Mobil namuna vertikal aylantiriladi; bu hali to‘liq
  ekranga sig‘adigan yakuniy o‘yin HUDi emas.
- Namuna rasmiy Three.js r186ning mahalliy nusxasidan foydalanadi; CDN
  so‘rovi sahifa ochilganda bajarilmaydi. Manba/hashlar vendor/three/README.md da.

Hali kerak: real Android/iPhone sinovi, yuklanish budjeti, GPU va heap profili,
30 daqiqalik barqarorlik, grafik kontekst tiklanishini amalda sinash va
asosiy o‘yin qoidalarini rendererga ulash. Namuna 60 FPS natijasi butun
tayyor o‘yin uchun kafolat emas.
