# Candy Blast — loyiha auditi

> 2026-09-11: ikkinchi bosqichda original SVG konfetlar, yangi maydon, silliq
> almashtirish/tushish, konfet yig‘ish va muz vazifalari, Hint va avtomatik
> aralashtirish qo‘shildi. Eski xarita progressi saqlanadi. Joriy holat [README.md](README.md) da.

> Yangilanish: 2026-09-10 kuni birinchi tuzatishlar bajarildi. Quyidagi matn
> dastlabki auditni qayd etadi; amaldagi tuzatishlar va tekshirish ko‘rsatmalari
> [README.md](README.md) da. Mobil joylashuv, taymer/retry/quit, saqlash/reset,
> natijani bir martalik yakunlash va asosiy booster/mukofot xatolari tuzatildi.
> Vizual yangilash va yangi bosqich mexanikalari hali bajarilmagan.

Sana: 2026-09-10. Tekshirilgan Git commit: `028899d`.

## Qamrov va tekshirish usuli

- HTML, 8 ta JavaScript fayli, 5 ta CSS fayli, manifest va service worker ko‘rib chiqildi.
- 9 ta JavaScript faylining (service worker bilan) sintaksisi tekshirildi: xato topilmadi.
- Mahalliy brauzerda tutorial → xarita → bosqich → o‘yin → vaqt tugashi → retry oqimi tekshirildi. To‘rtta konfetli moslik 120 ball berdi, yurishlar 34 dan 33 ga tushdi.
- 1280×720, 375×667 va 390×844 o‘lchamlarda ko‘rinish tekshirildi. Bu brauzer o‘lchami tekshiruvi; haqiqiy Android/iOS qurilmalaridagi sinov emas.
- Muhim funksiyalar asl fayllardan Node VM ichida, DOM va taymerlar uchun sun’iy muhit bilan alohida ishga tushirildi. Quyida bunday tekshiruvlar “funksiya sinovi” deb ko‘rsatilgan.
- O‘yin kodi o‘zgartirilmadi. `images/` avvaldan Git kuzatuvida bo‘lmagan; undagi fayllar saqlandi. Ushbu hisobot qo‘shildi.
- Barcha 100 bosqich qo‘lda o‘ynab chiqilmadi; offline o‘rnatish, real sensorli boshqaruv va barcha maxsus kombinatsiyalar brauzerda to‘liq sinovdan o‘tkazilmadi.

## Loyiha qanday ishlaydi

Bu oddiy HTML/CSS/JavaScript bilan yozilgan, server talab qilmaydigan match-3 o‘yin. Paketlar ro‘yxati, build tizimi, avtomatik testlar va README yo‘q. Foydalanuvchi ma’lumotlari `localStorage` ichida saqlanadi. Account, bulutli saqlash va haqiqiy onlayn reyting yo‘q.

| Fayl | Vazifasi |
| --- | --- |
| `index.html` | Ekranlar, dialoglar, tugmalar va skriptlar ulanishi |
| `js/game.js` | Umumiy holat, navigatsiya, o‘yin sikli, ball, taymer, ovoz va saqlash |
| `js/specials.js` | Moslik topish, striped/wrapped/color bomb va kombinatsiyalar |
| `js/map.js` | 5 hudud, 100 bosqich formulasi, ochilish va yulduzlar |
| `js/lives.js` | 5 jon, 30 daqiqalik tiklanish, boosterlar |
| `js/daily.js`, `js/spin.js` | Kundalik/haftalik/soatlik sovg‘alar va spin |
| `js/tutorial.js`, `js/backgrounds.js` | O‘rgatuvchi slaydlar va SVG fonlar |
| `css/` | Umumiy va ekranlarga tegishli ko‘rinish |
| `manifest.json`, `sw.js` | PWA tavsifi va offline kesh |

## Birinchi tuzatiladigan xatolar

1. **Mobil maydon ekranga sig‘maydi.** `css/style.css:1029` maydonni 390×390 qiladi, `:1037` esa barcha tomoniga 100px margin beradi. 375×667 brauzerda maydon x≈−7.4, y=263; boosterlar y=757 bo‘lib, ekran tashqarisida qoladi. Sahifa scrolli ham berkitilgan. 390×844 da tugmalar sig‘adi, ammo ortiqcha katta bo‘shliqlar qoladi. **Brauzer va DOM o‘lchovlari bilan tasdiqlandi.** Maydon kengligini mavjud kenglik va balandlikdan hisoblash kerak.

2. **Retry taymer va qiyinlikni tiklamaydi.** `js/game.js:768` boshlashning yagona yo‘lidan foydalanmaydi; bazaviy moves/targetni oladi, yangi taymer tayyorlamaydi. Hard darajadagi sinovda retry 34 yurish, 1298 maqsad va o‘chiq taymer berdi. Brauzerda vaqt tugagach retry oynasida taymer 0:00 bo‘lib qoldi. **Brauzer + funksiya sinovi.** Retry ham `startMapLevel` bilan bir xil sozlamalardan boshlanishi kerak.

3. **Xaritaga chiqilganda eski taymer ishlashda davom etadi.** `js/game.js:788` dagi `confirmQuit()` o‘yin taymerini to‘xtatmaydi. Pregame Back esa avval `hidePreGame()` orqali taymerni yoqib, keyin boshqa ekranga o‘tadi (`index.html`, `js/lives.js:164`). Ikkala funksiya sinovida ham `currentScreen='map'`, `timerActive=true` chiqdi. Eski taymer boshqa ekranda mag‘lubiyat oynasi va qo‘shimcha jon yo‘qotishini chaqirishi mumkin. Ekrandan chiqishda o‘yin sessiyasini yakunlash va kechiktirilgan callbacklarni bekor qilish kerak.

4. **Ba’zi maxsus kombinatsiyalar ishlamaydi.** `js/specials.js:168` oxirgi `else` tarmog‘ida ikkala katak avval −1 qilinib, keyin `activateSpecial()` chaqiriladi. Natijada maxsus tur allaqachon yo‘q. Wrapped + striped sinovida atigi 2 katak o‘chirildi. **Funksiya sinovi.** Effektni katak ma’lumotlari o‘chirilishidan oldin hisoblash zarur. Bomb + wrapped ham shu tarmoqqa tushadi.

5. **Saqlangan o‘yin tiklangach uning nusxasi o‘chiriladi.** `js/game.js:824` dagi restore oxirida `clearGameState()` bor. Yangi yurish qilmasdan yana qayta ochilsa, saqlangan o‘yin yo‘q. Funksiya sinovida birinchi restore `true`, ikkinchisi `false`. Booster ishlatish yo‘llari ham har doim o‘yin holatini saqlamaydi. Barqaror maydon nusxasini yangi nusxa yozilguncha saqlab turish kerak.

6. **Bonusni qayta-qayta olish mumkin.** `js/daily.js:219` faqat bosilgan tugmani o‘chiradi; haftalik bonus olingani ma’lumotlarda saqlanmaydi. Haftalik sahifa qayta chizilganda tugma yana chiqadi. Ikki chaqiriq hammer miqdorini 6 taga oshirdi. **Funksiya sinovi + render kodidan tasdiq.** Hafta bo‘yicha bir martalik claim holati kerak.

7. **Bomb boosteri yutuqni yakunlamaydi.** `js/lives.js:145` va `:207` dagi jarayonlar `processMatches()` dan so‘ng `checkEnd()` chaqirmaydi. Maqsadga yetgan bo‘lsa ham natija keyingi harakat yoki taymergacha kechikishi mumkin. **Koddan aniqlangan; brauzerda alohida qaytarilmagan.** Barcha yurish va boosterlar bir xil yakunlash tekshiruvidan o‘tishi kerak.

## Boshqa tasdiqlangan va koddan topilgan muammolar

- **Oxirgi hammerni bekor qilish ishlamaydi.** `useIngameBooster()` zaxirani tekshirishni bekor qilishdan oldin bajaradi. 1 ta hammer bilan yoqib, yana bosilganda `hammerMode=true`, miqdor 0 bo‘lib qoladi. Funksiya sinovida tasdiqlandi.
- **Haftalik sovg‘a va yozuv mos emas.** Dushanba “+1 Booster”, amalda life; payshanba “Hammer”, amalda extraMoves. Payshanba funksiya sinovi bilan tasdiqlandi. Shanba spin qo‘shish o‘rniga spin ekranini ochadi.
- **30 kunlik siklda 31-kun paydo bo‘ladi.** `checkMonthlyLogin()` avval `>30` ni tekshiradi, keyin kunni oshiradi; 30 dan 31 ga o‘tadi, shu kunga sovg‘a yo‘q. Funksiya sinovida tasdiqlandi.
- **Reset to‘liq emas.** `confirmReset()` `cb_gamestate` va `cb_spin_given` ni o‘chirmaydi; lives/daily obyektlari ham boshlang‘ich qiymatga qaytarilmaydi. Storage o‘chirilgach load funksiyalari xotiradagi eski obyektni saqlab qolishi mumkin.
- **Yurish qolmagan maydon uchun yechim yo‘q.** `initGrid()` boshlang‘ich mosliklarni oldini oladi, ammo mumkin bo‘lgan yurishni tekshirmaydi. Hint/avtomatik aralashtirish tizimi yo‘q. O‘yinda yurishsiz maydon paydo bo‘lsa, uni normal o‘yin yo‘li bilan tiklash ko‘zda tutilmagan.
- **Natijani faqat bir marta yakunlash kafolati yo‘q.** Taymer callbacki va davom etayotgan moslik jarayoni alohida ishlaydi; yagona won/lost holati va sessiya identifikatori yo‘q. Bir vaqtdagi yutuq/mag‘lubiyat yoki kechikkan callbacklar uchun maxsus sinov zarur. Bu xavf koddan aniqlangan, to‘liq brauzer reproduksiyasi qilinmagan.
- **Kun/hafta chegaralari turlicha.** Kun UTC orqali, hafta kuni mahalliy vaqt orqali olinadi. Hafta raqami epochdan 7 kunlik bo‘linish bo‘lib, ekrandagi Mon–Sun haftasiga mos emas.
- **Soatlik sovg‘a hisobi noaniq.** Har chiqishda daqiqalar pastga yaxlitlanadi; qisqa sessiyalar yo‘qoladi, pause/pregame/natija ekranida o‘tgan vaqt hisobga tushishi mumkin. Sovg‘a haqiqatan olinmasdan “claimed” soni oshadi.
- **Tutorial asosiy bosqich yo‘lidan ajralgan.** Skip tugmasi xaritadagi 1-bosqich o‘rniga 6 rangli, 30 yurishli, 500 ballik eski rejimni ochadi; map selectedLevel o‘rnatilmaydi. Tutorialdagi “tezroq yakunlasang ko‘proq yulduz” matni `calcStars()` ning faqat ballga qaraydigan hisobiga mos emas.
- **Normal/hard rejimda xato almashtirish yurishni sarflaydi.** Bu kod xatosi deb emas, kelishilishi kerak bo‘lgan o‘yin qoidasi deb qaralishi kerak; tutorial buni tushuntirmaydi.
- **Global/Weekly reytinglar namuna ma’lumotlar.** `js/game.js:363` da ism va ballar qo‘lda yozilgan. Ularni demo deb belgilash yoki haqiqiy natijalar tizimini yaratish kerak.
- **PWA ildiz katalogga bog‘langan.** `/sw.js`, `/index.html`, `start_url: '/'` va cache yo‘llari ichki katalogda joylashtirishni qo‘llamaydi. Activate shu origindagi o‘ziga tegishli bo‘lmagan keshlarni ham o‘chiradi. Kesh nomlari bo‘yicha chegaralash kerak. Amaliy offline/installation sinovi hali kerak.

## Nima uchun o‘yin sodda tuyuladi

- 100 ta bosqich bitta formula va bir xil 8×8 maydondan iborat. Vazifa faqat ball yig‘ish; jelly, muz, to‘siqlar, maxsus maydon shakllari va narsalarni pastga tushirish vazifalari yo‘q.
- Bosqich formulasi sinovida maqsad 1-bosqichda 1298, 50-bosqichda 1222, 100-bosqichda 1008 bo‘ldi. Ranglar ko‘payishi va yurishlar kamayishi ta’siri bor, lekin umumiy qiyinlik o‘sishi statistik o‘yin sinovlari bilan isbotlanmagan.
- Konfetlar `.cell::after` orqali emoji sifatida ko‘rsatiladi. `images/candies/` ichida 4 PNG mavjud, lekin o‘yinga ulanmagan. Yagona original konfet va maxsus effektlar uslubi hali shakllanmagan.
- Desktop xarita juda keng yoyilgan kartalardan iborat; bosqichlar orasidagi vertikal chiziqlar chap/o‘rta/o‘ng nuqtalarni uzluksiz yo‘l sifatida bog‘lamaydi.
- Fon kuchli e’tibor tortadi, ayrim ikkinchi darajali yozuvlar juda xira. O‘yin davomida aniq target va yulduz chegaralarini ko‘rsatish yetishmaydi.
- Almashtirish to‘liq maydonni qayta yaratadi; tushish esa haqiqiy masofadan qat’i nazar −50px animatsiya. Harakat og‘irligi va silliqligi cheklangan.
- Interfeys inglizcha, hududlar o‘zbekcha. Tarjima tizimi yo‘q. Ko‘p bosiladigan elementlar `div`; klaviatura, aniq accessible label va dialog fokus boshqaruvi yetishmaydi.

## Kodni rivojlantirishdagi asosiy to‘siqlar

`game.js` navigatsiya, o‘yin, ovoz, tema, saqlash va reytingni birlashtirgan. Fayllar umumiy global o‘zgaruvchilar va skript yuklanish tartibiga bog‘liq. Gravity va yakunlash qoidalari bir necha joyda takrorlangan. `TC_LEGACY` ishlatilmaydigan eski fon kodi hamon asosiy faylda turibdi. Inline CSS va `!important` ko‘pligi mobil o‘lchamlarni boshqarishni qiyinlashtiradi. Saqlangan ma’lumotlarning sxemasi va migratsiyasi cheklangan; map versiyasi o‘zgarsa progress tashlab yuboriladi.

## Tavsiya etilgan ish tartibi

1. **Barqaror asos:** mobil joylashuv, yagona start/retry/quit oqimi, taymerni to‘xtatish, yakunlashni bir martalik qilish, save/restore/reset, booster va bonus xatolari. Muhim holatlar uchun takrorlanuvchi testlar.
2. **O‘yin sifati:** qonuniy yurish aniqlash, hint va shuffle, maxsus kombinatsiyalarning to‘liq qoidalari, silliq almashtirish/tushish, maqsad va yulduz indikatorlari.
3. **Mazmunli bosqichlar:** avval 10–20 puxta tuzilgan bosqich; turli maqsadlar, to‘siqlar, maydon shakllari va bosqichma-bosqich o‘rgatish. Shundan keyin 100 bosqichga kengaytirish va balans o‘lchovlari.
4. **Yagona vizual uslub:** original konfetlar, yaxlit xarita, o‘qilishi oson panellar, bir xil tugmalar va dialoglar, o‘zbekcha/inglizcha matn tizimi.
5. **Tarqatishga tayyorlash:** progress migratsiyasi, offline va qurilma sinovlari, to‘g‘ri PWA ikonkalari, README va ishga tushirish ko‘rsatmalari. Haqiqiy onlayn reyting keyingi alohida yo‘nalish.

Asosiy qabul mezoni: foydalanuvchi bosqichni boshlashi, pause/resume qilishi, yutqazib qayta urinishi, booster ishlatishi va o‘yinni qayta ochishi davomida jon, taymer, mukofot va progress bir-biriga zid holatga kelmasligi; boshqaruvlar kichik telefonda ham ko‘rinishi kerak.
