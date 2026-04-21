/**
 * RUKYA questionnaire — UI and Uzbek (Latin) labels parallel to config.json (Russian).
 */
(function (global) {
  const UI = {
    ru: {
      langRu: 'Рус',
      langUz: "O'zbek",
      sub: 'Анкета для приёма · Ash-Shifa',
      loadFail: 'Не удалось загрузить config.json: ',
      noSections: 'В config.json нет surveySections.',
      stepOf: (n, total) => `Шаг ${n} из ${total}`,
      placeholder: 'Ваш ответ…',
      back: '← Назад',
      next: 'Далее →',
      toFinal: 'К итогу →',
      done: 'Готово',
      doneHint: 'Скопируйте JSON и передайте лекарю. Импорт: RUKYA PRO → Импорт JSON.',
      copyJson: 'Копировать JSON',
      downloadJson: 'Скачать .json',
      restart: 'Сначала',
      checkTitle: 'Проверка',
      fixBtn: '← Исправить',
      errName: 'Укажите ФИО в разделе 1.',
      errState: 'Заполните описание текущего состояния (раздел 2).',
      copied: 'Скопировано в буфер',
      selectManual: 'Выделите текст вручную (Ctrl+C)',
      fileSaved: 'Файл сохранён',
      userMsgIntro: 'Жалобы и описание (анкета, полный текст по разделам):',
      userMsgInstruction: 'Инструкция: первый элемент в types — главный тип для подбора программы в приложении; поля диагноза должны быть согласованы (джинн, дом, сглаз, приоритет).\n\nВыдай JSON-диагноз по схеме.',
      patientLine: (name, g, age) => `Пациент: ${name} (${g}, ${age} лет)`,
      clinicalRefPrefix: 'Источник обращения: ',
      clinicalSchema: (v, id) => `Схема анкеты: schema v${v}, ${id}`,
      systemNote: 'Системный промпт берите из приложения RUKYA PRO (js/engine/deepseek.js), при вызове API подставьте его в role=system.',
    },
    uz: {
      langRu: 'Рус',
      langUz: "O'zbek",
      sub: 'Qabul uchun so‘rovnoma · Ash-Shifa',
      loadFail: 'config.json yuklanmadi: ',
      noSections: 'config.json da surveySections yo‘q.',
      stepOf: (n, total) => `${n}-qadam / ${total} dan`,
      placeholder: 'Javobingiz…',
      back: '← Orqaga',
      next: 'Keyingi →',
      toFinal: 'Yakuniy →',
      done: 'Tayyor',
      doneHint: 'JSON nusxalang va shifokorga yuboring. Import: RUKYA PRO → Import JSON.',
      copyJson: 'JSON nusxalash',
      downloadJson: 'JSON yuklab olish',
      restart: 'Boshidan',
      checkTitle: 'Tekshiruv',
      fixBtn: '← Tuzatish',
      errName: '1-bo‘limda F.I.Sh. kiriting.',
      errState: '2-bo‘limda hozirgi holatni yozing.',
      copied: 'Buferga nusxalandi',
      selectManual: 'Matnni qo‘lda tanlang (Ctrl+C)',
      fileSaved: 'Fayl saqlandi',
      userMsgIntro: 'Shikoyat va tavsif (so‘rovnoma, bo‘limlar bo‘yicha to‘liq matn):',
      userMsgInstruction: "Ko'rsatma: types dagi birinchi element — dasturda dastur tanlash uchun asosiy tur; diagnoz maydonlari mos kelishi kerak (jinn, uy, hasad, ustunlik).\n\nSxema bo'yicha JSON-diagnoz bering.",
      patientLine: (name, g, age) => `Bemor: ${name} (${g}, ${age} yosh)`,
      clinicalRefPrefix: 'Murojaat manbai: ',
      clinicalSchema: (v, id) => `So‘rovnoma sxemasi: schema v${v}, ${id}`,
      systemNote: "Tizim promptini RUKYA PRO (js/engine/deepseek.js) ilovasidan oling, API chaqiruvida role=system ga qo‘ying.",
    },
  };

  /** O‘zbekcha: bo‘lim sarlavhalari va maydon yorliqlari (config.json dagi kalitlar bilan mos) */
  const SECTIONS_UZ = {
    s1: {
      title: '1. Identifikatsiya va aloqa',
      fields: {
        fullName: 'To‘liq ismingiz (ism va otasining ismi; kerak bo‘lsa bint yoki ibn)?',
        age: 'Yoshingiz?',
        gender: 'Jinsingiz?',
        city: 'Yashash shahringiz?',
        phone: 'Aloqa uchun telefon?',
        referral: 'Biz haqimizda qayerdan eshitdingiz yoki kim yo‘naltirdi (ixtiyoriy)?',
      },
    },
    s2: {
      title: '2. Hozirgi holat (bitta matn bilan)',
      fields: {
        current_state: 'O‘z so‘zlaringiz bilan yozing: hozir nima bezovta qilyapti, qachon boshlangan va vaqt o‘tishi bilan qanday o‘zgargan?',
        daily_impact: 'Kundalik hayotda eng ko‘p nima xalaqit beradi: uyqu, ish, oila, namoz, salomatlik?',
      },
    },
    s3: {
      title: '3. Vaqt va dinamika',
      fields: {
        onset: 'Alomatlar birinchi marta qachon sezilgan (taxminiy sana yoki «N yil/oy oldin»)?',
        waves: 'Alomatlar doimiy yoki to‘lqinsimon (yaxshilanish — yana yomonlashish)? Agar to‘lqinsimon bo‘lsa — qanchalik tez-tez?',
        calendar: 'Taqvim bilan bog‘liqlik bormi (yangi oy, juma, tun, ro‘za)?',
      },
    },
    s4: {
      title: '4. Uzilishlar va kontekst',
      fields: {
        life_events: 'Yomonlashish ma‘lum voqea bilan bir vaqtda bo‘ldimi: janjal, ajralish, to‘y, ko‘chish, dafn, sayohat, yangi uy?',
        food_drink: 'Birovning uyida ovqat/ichimlikdan keyin keskin yomonlashish bo‘ldimi?',
        meeting_praise: 'Muayyan inson bilan uchrashgandan yoki maqtov / hasadgo‘y so‘zlardan keyin yomonlashish bo‘ldimi?',
        attachment: 'Insonga majburiy bog‘liqlik, «qo‘ymaydigan» fikrlar bormi?',
        family: 'Oila: «hech nimadan» janjallar, er-xotin oralig‘i sovuq, ajrashish haqidagi fikrlar — bormi?',
      },
    },
    s5: {
      title: "5. Tana va «joy»",
      fields: {
        localization: 'Asosiy og‘irlik yoki og‘riq qayerda: bosh, ko‘krak, qorin, bel, bo‘yin, oyoq-qo‘llar, «butun tana»?',
        sensation: 'Og‘riq/og‘irlikni tasvirlang: doimiy, tutqunlik bilan, uyushish, issiq/sovuq, ko‘krakda bosim?',
        medical_checkups: 'Shifokorlarda tekshiruv bo‘ldimi va nima dedilar (jismoniy va ruhiy alomatni yozuvda ajratish uchun)?',
      },
    },
    s6: {
      title: '6. Psixika, uyqu, namoz',
      fields: {
        fear_darkness: 'Qo‘rqinch, zulmat, sababsiz tushkunlik — qanday namoyon bo‘ladi?',
        waswasa_namaz: 'Majburiy fikrlar, shubhalar, «kalladagi kino» — qachon kuchayadi (namoz vaqtida, tunda)?',
        dreams: 'Tushlar: takrorlanuvchi syujetlar, quvish, ilonlar, suv, tugunlar, begona yuzlar, yiqilish — nimani eslaysiz?',
        faith_focus: 'Imonga qarshi fikrlar yoki «namozda diqqatni jamlay olmayapman» his-tuyg‘usi bormi?',
      },
    },
    s7: {
      title: '7. Uy va atrof-muhit',
      fields: {
        home_room: 'Alomatlar uyda yoki ma‘lum xonada kuchayroqmi?',
        night_signs: 'Tunda: ta‘rillar, qadamlar, soyalar, begona ishtirok hissi, og‘ir eshiklar?',
        tech_smells_kids: 'Texnika sababsiz buziladi, g‘alati hidlar, bolalar tunda yig‘laydimi?',
        objects_presence: 'Buyumlar o‘rnidan qo‘zg‘aladimi, «bir o‘zim emasman» hissi?',
      },
    },
    s8: {
      title: '8. Jinn / mass',
      fields: {
        seizures: 'Tutqunliklar bo‘ldimi: qo‘zgalishlar, nazoratni yo‘qotish, begona ovoz, aggressiya, yiqilishlar?',
        quran_reaction: '«Ichkarida kimdir» hissi, Qurvon o‘qish yoki Allohni zikr qilganda qorin/ko‘krakda bosilishi?',
        voice_aggression: 'Ovoz o‘zgaradimi, xaraktersiz qattiqlik paydo bo‘ladimi?',
      },
    },
    s9: {
      title: "9. Ko'z yumib qolish va hasad",
      fields: {
        after_admiration: 'Hayrat yoki hasadgo‘y qarab qolishdan keyin nimani his qildingiz?',
        source_ayn: 'Ko‘z yumish manbasini bilasizmi (aniq inson) yoki yo‘qmi?',
        barakah_loss: 'Maqtovdan keyin ish, pul, oilada barakatsizlik yo‘qolishimi?',
      },
    },
    s10: {
      title: '10. Sihr «turlari bo‘yicha»',
      fields: {
        knots: '«Tugunlar», kishanlar, ko‘krakda siqilish hissi bormi?',
        place_specific: 'Alomatlar ma‘lum joyda kuchayadimi (hovli, quduq, uy burchagi)?',
        suspicion_items: 'Yashirin buyum/qazish/sehrli narsalar haqidagi gumon bormi (tafsilotlarsiz — faqat holat xaritasi uchun)?',
      },
    },
    s11: {
      title: '11. Ohang va qo‘llab-quvvatlash',
      fields: {
        emotional_tone: 'Hozir hissiyotan o‘zingizni qanday his qilyapsiz: tinch — tushuntirishni xohlaysiz / katta qo‘rqinch / charchash va umidsizlik?',
      },
    },
  };

  function titleFor(lang, secId, cfgTitle) {
    if (lang === 'uz' && SECTIONS_UZ[secId]) return SECTIONS_UZ[secId].title;
    return cfgTitle;
  }

  function labelFor(lang, secId, fieldKey, cfgLabel) {
    if (lang === 'uz' && SECTIONS_UZ[secId] && SECTIONS_UZ[secId].fields && SECTIONS_UZ[secId].fields[fieldKey]) {
      return SECTIONS_UZ[secId].fields[fieldKey];
    }
    return cfgLabel;
  }

  global.RUKYA_Q_LOCALES = { UI, SECTIONS_UZ, titleFor, labelFor };
})(typeof window !== 'undefined' ? window : globalThis);
