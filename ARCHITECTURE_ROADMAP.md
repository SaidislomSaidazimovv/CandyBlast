# Candy Blast: 3D, arxitektura va unumdorlik rejasi

Yangilanish: 3D renderer endi asosiy `/` o‘yiniga ulandi. Eski progress,
vazifalar va maxsus konfet qoidalari saqlandi. Alohida namuna URLi asosiy
o‘yinga yo‘naltiradi. Quyidagi dastlabki reja tarixiy; o‘yin qoidalarini
global holatdan to‘liq ajratish va real qurilmalar sinovi hali oldinda.

Sana: 2026-09-11. Yangilanish: 64 konfetli alohida haqiqiy 3D namuna va
boshlang‘ich o‘lchovlar tayyor. Natijalar PERFORMANCE_BASELINE.md da.
Quyidagi rejaning birinchi bandi mahalliy namuna darajasida bajarildi;
maqsad real qurilmalar matritsasi hali tanlanishi va sinalishi kerak.
Asosiy o‘yin hali 3D rendererga ko‘chirilmagan.

## Hozirgi holat

Ikki dastlabki bosqich bajarilgan: asosiy o‘yin xatolari tuzatildi; yangi
konfetlar, vazifalar, muz, Hint va animatsiyalar qo‘shildi. Oldingi tekshiruvda
36 funksional test o‘tgan. Bu tayyor mahsulot yoki FPS sertifikati emas.
Hozirgi konfetlar hajmni tasvirlovchi SVG rasmlar; maydon HTML elementlari,
fon SVG va CSS. Haqiqiy 3D kamera, geometrik modellar va yoritish yo‘q.

## Kodda aniqlangan muammolar

| Joy | Dalil va oqibat | Yo‘nalish |
| --- | --- | --- |
| js/adventure.js: findAvailableMove | Har nomzod almashuvda butun maydon uchun findMatchesNew va yangi to‘plamlar yaratiladi | Almashgan ikki nuqta atrofidagi moslikni tekshiruvchi alohida tezkor funksiya |
| js/adventure.js: ensurePlayableBoard | 200 tagacha aralashtirish sinxron bajarilishi mumkin | Cheklangan ish budjeti, boshqaruvni brauzerga qaytarish, kafolatlangan tiklash yo‘li |
| js/game.js: renderBoard | 64 katakning xususiyatlari yangilanadi; drops.find takrorlanadi; yozishlar orasida clientHeight o‘qiladi | Faqat o‘zgargan holatni uzatish; o‘lchamni bir marta olish; indekslangan animatsiya ma’lumoti |
| js/adventure.js: updateObjectiveUI | Har yangilanishda ichki HTML qayta yaratiladi | Mavjud elementlarning faqat o‘zgargan qiymatini yangilash |
| js/lives.js: startLifeTimer, regenLives, updateLivesUI | Har soniyada yurak elementlari qayta yaratiladi; to‘la jonlarda ham saqlash bajariladi | Holat o‘zgargandagina UI va saqlashni yangilash |
| js/game.js | Qoidalar, umumiy o‘zgaruvchilar, ekran, vaqt, saqlash va animatsiya birga; TC_LEGACY ham qolgan | Qoidalar, sessiya, render, UI va saqlashni ajratish |
| js/game.js: processMatches | Kaskadlar uchun aniq tiklanish chegarasi yo‘q | Bekor qilish signali, qadam nazorati va xavfsiz tiklanish |
| css va js/backgrounds.js | Aralash uslublar, ko‘p soya/filtr va ustma-ust CSS qoidalari | Yagona vizual tizim; effektlarni o‘lchab cheklash |

Bular kod orqali aniqlangan xarajat va xavflar. Qaysi biri haqiqiy qurilmada
asosiy qotish sababchisi ekanini hali profil bilan o‘lchamadik.

## Qolgan 6 yirik bosqich

1. **O‘lchov va 3D namuna.** Hozirgi o‘yinning kadr vaqti, uzoq vazifalari,
   xotirasi va yuklanishini qayd etish. 64 konfetli kichik haqiqiy 3D sahna:
   kamera, material, yoritish, maydon va fon uslubi. Maqsad qurilmalarni belgilash.
   Chiqish mezoni: bir xil sharoitda o‘lchangan boshlang‘ich va namuna natijalari.
2. **O‘yin yadrosi va algoritm.** DOMdan mustaqil qoidalar, qayta takrorlanadigan
   tasodifiylik, aniq sessiya holatlari, markaziy vaqt va animatsiyani bekor qilish.
   Eski saqlovlarni ko‘chirish. Chiqish mezoni: amaldagi xatti-harakat testlari
   saqlanadi, qoidalar ekransiz tekshiriladi, tezkor yurish qidiruvi to‘g‘ri ishlaydi.
3. **To‘liq 3D o‘yin sahnasi.** Haqiqiy hajmli konfetlar, muz va maxsus konfetlar;
   chuqurlikli maydon va fon; almashish, tushish, portlash animatsiyalari.
   Bir xil model/materiallarni qayta ishlatish, cheklangan zarrachalar va sifat
   darajalari. Chiqish mezoni: to‘liq bosqich 3D sahnada o‘ynaladi va saqlanadi.
4. **Yagona UI va UX.** Bosh sahifa, xarita, o‘yin paneli, dialoglar, do‘kon va
   sovg‘alar bir uslubga keladi. 3D sahnaga mos rang, shrift va tugmalar;
   sensorli boshqaruv, klaviatura va kichik ekranlar. Matnlar o‘qilishi uchun
   ekran ustidagi interfeys qatlamida qoladi. Chiqish mezoni: barcha ekranlar
   va o‘tishlarda uslub, sig‘ish va boshqaruv tekshiriladi.
5. **Kontent va tizimlarni tugatish.** 100 bosqich qiyinligi, maxsus kombinatsiyalar,
   mukofotlar, soatlik sovg‘a va spin tiklanishi tekshiriladi. Namuna reyting
   haqiqiy onlayn reyting sifatida ko‘rsatilmaydi. Chiqish mezoni: balans jadvali,
   kombinatsiya testlari va mukofotni yo‘qotmasdan/bir martalik berish tekshiruvi.
6. **Yakuniy optimizatsiya va qurilma sinovlari.** Uzun o‘yin, ko‘p qayta boshlash,
   yashirin tabdan qaytish, offline, kesh yangilanishi, grafik kontekst yo‘qolishi
   va tiklanishi. Chiqish mezoni: tanlangan real qurilmalarda quyidagi mezonlar
   bo‘yicha o‘lchov hisoboti va qolgan cheklovlar.

Optimizatsiya har bosqichda bajariladi; oltinchi bosqich yakuniy tekshiruvdir.
Bu yangi 3D talabiga mos reja, oldindan belgilangan muddat yoki foiz emas.
Account, bulutli saqlash va haqiqiy onlayn reyting serveri bu olti bosqichga kirmaydi.

## Arxitektura yo‘nalishi

Input → sessiya boshqaruvi → o‘yin qoidalari → holat o‘zgarishlari → 3D render va UI.
Saqlash sessiyaning barqaror holatini oladi; renderer qoidalarni o‘zgartirmaydi.
Harakatlar tayyor/band/pauza/yakunlangan holatlari orqali boshqariladi.
Kaskad va animatsiyalar sessiya almashganda bekor qilinadi. Bir markaziy
requestAnimationFrame sikli animatsiyalarni vaqt farqi asosida boshqaradi.
8×8 maydon uchun alohida worker zarurligi avval o‘lchanadi.

Three.js + WebGL namuna uchun nomzod. Birlashtirilgan chizish, model/materialni
qayta ishlatish va moslashuvchan render aniqligi ko‘zda tutiladi. Ular rasmiy
[Three.js qo‘llanmasi](https://threejs.org/manual/en/optimize-lots-of-objects.html)
va [MDN WebGL tavsiyalari](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices)
bilan mos. Dvigatelning o‘zi tezlikni kafolatlamaydi; qaror namuna o‘lchoviga bog‘liq.

## Qabul mezonlari — hali erishilgan natija emas

- Kelishilgan odatiy qurilmada 60 FPS maqsadi; sust qurilmada pastroq effekt
  va render aniqligi bilan barqaror 30 FPS rejimi. Kadr vaqti p95/p99 ham qayd etiladi.
- Bosishga ko‘rinadigan javob p95 <100 ms; bu butun animatsiya davomiyligi emas.
- Faol o‘yinda ilova sababli 100 ms dan uzun asosiy oqim to‘xtashlari bo‘lmasligi.
- 30 daqiqalik o‘yin va qayta boshlashlarda xotira uzluksiz o‘sib bormasligi.
- Pauza, retry, offline va qayta ochishda yurish, maqsad va mukofot izchil saqlanishi.

Hamma telefon va brauzerda mutlaq qotmaslikni kafolatlab bo‘lmaydi. Minimal
qo‘llab-quvvatlanadigan qurilmalar tanlanib, natija real o‘lchov bilan tasdiqlanadi.
Hozir real telefon FPS, xotira va qizish sinovlari bajarilmagan.
