
(function () {
    "use strict";

    const SENTENCE_KEY = "liman-english-sentences-v1";
    const STATS_KEY = "liman-english-stats-v1";
    const MISS_LIMIT = 5;

    const STARTER_SENTENCES = [
        // 1–10: Dəniz limanı və gəmilər
        { id: "starter-01", en: "The vessel arrived at the port today.", az: "Gəmi bu gün limana çatdı.", level: "A1" },
        { id: "starter-02", en: "The ship will leave tomorrow.", az: "Gəmi sabah yola düşəcək.", level: "A1" },
        { id: "starter-03", en: "The captain is on the ship.", az: "Kapitan gəmidədir.", level: "A1" },
        { id: "starter-04", en: "The vessel is waiting at the port.", az: "Gəmi limanda gözləyir.", level: "A1" },
        { id: "starter-05", en: "When will the ship arrive?", az: "Gəmi nə vaxt çatacaq?", level: "A1" },
        { id: "starter-06", en: "The port is busy today.", az: "Liman bu gün işləkdir.", level: "A1" },
        { id: "starter-07", en: "The ship arrived two hours late.", az: "Gəmi iki saat gec çatdı.", level: "A2" },
        { id: "starter-08", en: "The captain spoke to the port officer.", az: "Kapitan liman əməkdaşı ilə danışdı.", level: "A2" },
        { id: "starter-09", en: "The vessel is ready to depart.", az: "Gəmi yola düşməyə hazırdır.", level: "A2" },
        { id: "starter-10", en: "The port is closed because of bad weather.", az: "Pis hava şəraitinə görə liman bağlıdır.", level: "A2" },

        // 11–20: Yüklər və konteynerlər
        { id: "starter-11", en: "The crane is loading the container.", az: "Kran konteyneri yükləyir.", level: "A2" },
        { id: "starter-12", en: "The workers unloaded the cargo.", az: "İşçilər yükü boşaltdılar.", level: "A2" },
        { id: "starter-13", en: "The cargo is ready for inspection.", az: "Yük yoxlama üçün hazırdır.", level: "A2" },
        { id: "starter-14", en: "We counted all the containers.", az: "Bütün konteynerləri saydıq.", level: "A2" },
        { id: "starter-15", en: "The container arrived by sea.", az: "Konteyner dəniz yolu ilə çatdı.", level: "A2" },
        { id: "starter-16", en: "Please check the cargo documents.", az: "Zəhmət olmasa, yük sənədlərini yoxlayın.", level: "A2" },
        { id: "starter-17", en: "The cargo ship is near the pier.", az: "Yük gəmisi körpünün yaxınlığındadır.", level: "A2" },
        { id: "starter-18", en: "The customs officer checked the cargo.", az: "Gömrük əməkdaşı yükü yoxladı.", level: "A2" },
        { id: "starter-19", en: "The cargo has passed customs.", az: "Yük gömrük yoxlamasından keçib.", level: "A2" },
        { id: "starter-20", en: "We sent the shipping documents.", az: "Gəmiçilik sənədlərini göndərdik.", level: "A2" },

        // 21–30: Liman əməliyyatları
        { id: "starter-21", en: "The pilot boarded the ship.", az: "Liman bələdçisi gəmiyə mindi.", level: "A2" },
        { id: "starter-22", en: "The tugboat helped the vessel.", az: "Yedək gəmisi əsas gəmiyə kömək etdi.", level: "A2" },
        { id: "starter-23", en: "The vessel is waiting for a berth.", az: "Gəmi yanalma yeri gözləyir.", level: "A2" },
        { id: "starter-24", en: "The crew is preparing the ship.", az: "Heyət gəmini hazırlayır.", level: "A2" },
        { id: "starter-25", en: "The ship is approaching the port.", az: "Gəmi limana yaxınlaşır.", level: "A2" },
        { id: "starter-26", en: "The ship departed this morning.", az: "Gəmi bu səhər yola düşdü.", level: "A2" },
        { id: "starter-27", en: "The port officer checked the documents.", az: "Liman əməkdaşı sənədləri yoxladı.", level: "A2" },
        { id: "starter-28", en: "The cargo operation has started.", az: "Yük əməliyyatı başlayıb.", level: "A2" },
        { id: "starter-29", en: "The crane stopped working.", az: "Kran işləməyi dayandırdı.", level: "A2" },
        { id: "starter-30", en: "The vessel will depart at six o'clock.", az: "Gəmi saat altıda yola düşəcək.", level: "A2" },

        // 31–40: Daşınma və sənədlər
        { id: "starter-31", en: "The driver delivered the documents.", az: "Sürücü sənədləri çatdırdı.", level: "A2" },
        { id: "starter-32", en: "We received the cargo yesterday.", az: "Yükü dünən qəbul etdik.", level: "A2" },
        { id: "starter-33", en: "The shipment is delayed.", az: "Yükün daşınması gecikir.", level: "A2" },
        { id: "starter-34", en: "Where is the cargo from?", az: "Yük haradandır?", level: "A2" },
        { id: "starter-35", en: "The cargo will arrive next week.", az: "Yük gələn həftə çatacaq.", level: "A2" },
        { id: "starter-36", en: "Please sign the delivery document.", az: "Zəhmət olmasa, təhvil sənədini imzalayın.", level: "A2" },
        { id: "starter-37", en: "The shipping company sent us an email.", az: "Gəmiçilik şirkəti bizə elektron məktub göndərdi.", level: "A2" },
        { id: "starter-38", en: "We need the bill of lading.", az: "Bizə konosament lazımdır.", level: "A2" },
        { id: "starter-39", en: "The cargo arrived without damage.", az: "Yük zədəsiz çatdı.", level: "A2" },
        { id: "starter-40", en: "Did the vessel arrive on time?", az: "Gəmi vaxtında çatdı?", level: "A2" },

        // 41–50: Limanla bağlı gündəlik cümlələr
        { id: "starter-41", en: "Do you work at the port?", az: "Sən limanda işləyirsən?", level: "A1" },
        { id: "starter-42", en: "The ship is not ready yet.", az: "Gəmi hələ hazır deyil.", level: "A1" },
        { id: "starter-43", en: "How many containers arrived today?", az: "Bu gün neçə konteyner çatdı?", level: "A2" },
        { id: "starter-44", en: "We need to check the cargo quantity.", az: "Yükün miqdarını yoxlamalıyıq.", level: "A2" },
        { id: "starter-45", en: "The sea is rough today.", az: "Bu gün dəniz dalğalıdır.", level: "A2" },
        { id: "starter-46", en: "The ship cannot leave the port.", az: "Gəmi limandan çıxa bilmir.", level: "A2" },
        { id: "starter-47", en: "The crew finished the work.", az: "Heyət işi bitirdi.", level: "A2" },
        { id: "starter-48", en: "We are waiting for the vessel.", az: "Gəmini gözləyirik.", level: "A1" },
        { id: "starter-49", en: "The port authority approved the operation.", az: "Liman rəhbərliyi əməliyyatı təsdiqlədi.", level: "A2" },
        { id: "starter-50", en: "The ship will arrive at midnight.", az: "Gəmi gecəyarısı çatacaq.", level: "A2" },

        // 51–60: Ödəniş və hesab-fakturalar
        { id: "starter-51", en: "The invoice is ready.", az: "Hesab-faktura hazırdır.", level: "A1" },
        { id: "starter-52", en: "We received the payment today.", az: "Ödənişi bu gün aldıq.", level: "A2" },
        { id: "starter-53", en: "The customer paid the bill yesterday.", az: "Müştəri hesabı dünən ödədi.", level: "A2" },
        { id: "starter-54", en: "How much does the service cost?", az: "Xidmətin qiyməti nə qədərdir?", level: "A2" },
        { id: "starter-55", en: "The total cost is five hundred dollars.", az: "Ümumi xərc beş yüz dollardır.", level: "A2" },
        { id: "starter-56", en: "We need to pay the port charges.", az: "Liman rüsumlarını ödəməliyik.", level: "A2" },
        { id: "starter-57", en: "The company received a large payment.", az: "Şirkət böyük məbləğdə ödəniş aldı.", level: "A2" },
        { id: "starter-58", en: "Please send me the invoice.", az: "Zəhmət olmasa, mənə hesab-fakturanı göndərin.", level: "A1" },
        { id: "starter-59", en: "The payment is still pending.", az: "Ödəniş hələ tamamlanmayıb.", level: "A2" },
        { id: "starter-60", en: "We paid the fee by bank transfer.", az: "Rüsumu bank köçürməsi ilə ödədik.", level: "A2" },

        // 61–70: Maliyyə və mühasibat
        { id: "starter-61", en: "The shipping cost has increased.", az: "Daşınma xərci artıb.", level: "A2" },
        { id: "starter-62", en: "The freight rate is too high.", az: "Yükdaşıma tarifi çox yüksəkdir.", level: "A2" },
        { id: "starter-63", en: "The company prepared its budget.", az: "Şirkət büdcəsini hazırladı.", level: "A2" },
        { id: "starter-64", en: "We must reduce our expenses.", az: "Xərclərimizi azaltmalıyıq.", level: "A2" },
        { id: "starter-65", en: "The company made a profit this month.", az: "Şirkət bu ay mənfəət əldə etdi.", level: "A2" },
        { id: "starter-66", en: "The business lost money last year.", az: "Biznes keçən il pul itirdi.", level: "A2" },
        { id: "starter-67", en: "The manager approved the payment.", az: "Menecer ödənişi təsdiqlədi.", level: "A2" },
        { id: "starter-68", en: "We have not paid the invoice yet.", az: "Hesab-fakturanı hələ ödəməmişik.", level: "A2" },
        { id: "starter-69", en: "The payment is due tomorrow.", az: "Ödəniş sabah edilməlidir.", level: "A2" },
        { id: "starter-70", en: "The accountant checked the figures.", az: "Mühasib rəqəmləri yoxladı.", level: "A2" },

        // 71–80: Gəlir, xərclər və borclar
        { id: "starter-71", en: "The customer owes us money.", az: "Müştərinin bizə borcu var.", level: "A2" },
        { id: "starter-72", en: "We need to check the exchange rate.", az: "Valyuta məzənnəsini yoxlamalıyıq.", level: "A2" },
        { id: "starter-73", en: "The company paid the fuel bill.", az: "Şirkət yanacaq hesabını ödədi.", level: "A2" },
        { id: "starter-74", en: "The freight payment arrived late.", az: "Yükdaşıma ödənişi gec gəldi.", level: "A2" },
        { id: "starter-75", en: "How much did the port service cost?", az: "Liman xidməti neçəyə başa gəldi?", level: "A2" },
        { id: "starter-76", en: "We calculated the total shipping expenses.", az: "Ümumi daşınma xərclərini hesabladıq.", level: "A2" },
        { id: "starter-77", en: "The company will pay the fee next week.", az: "Şirkət rüsumu gələn həftə ödəyəcək.", level: "A2" },
        { id: "starter-78", en: "We received the invoice for the port services.", az: "Liman xidmətləri üçün hesab-fakturanı aldıq.", level: "A2" },
        { id: "starter-79", en: "The company has enough money.", az: "Şirkətin kifayət qədər pulu var.", level: "A1" },
        { id: "starter-80", en: "Our expenses were higher last month.", az: "Keçən ay xərclərimiz daha yüksək idi.", level: "A2" },

        // 81–90: Maliyyə sualları və işgüzar danışıq
        { id: "starter-81", en: "When will we receive the payment?", az: "Ödənişi nə vaxt alacağıq?", level: "A2" },
        { id: "starter-82", en: "Did you send the invoice?", az: "Hesab-fakturanı göndərdin?", level: "A2" },
        { id: "starter-83", en: "The customer has not paid yet.", az: "Müştəri hələ ödəməyib.", level: "A2" },
        { id: "starter-84", en: "Please check the bank statement.", az: "Zəhmət olmasa, bank çıxarışını yoxlayın.", level: "A2" },
        { id: "starter-85", en: "The payment was made yesterday.", az: "Ödəniş dünən həyata keçirildi.", level: "A2" },
        { id: "starter-86", en: "We need approval for this expense.", az: "Bu xərc üçün təsdiq almalıyıq.", level: "A2" },
        { id: "starter-87", en: "The budget is limited.", az: "Büdcə məhduddur.", level: "A1" },
        { id: "starter-88", en: "The company earns money from shipping.", az: "Şirkət yükdaşımadan pul qazanır.", level: "A2" },
        { id: "starter-89", en: "The invoice includes port charges.", az: "Hesab-fakturaya liman rüsumları daxildir.", level: "A2" },
        { id: "starter-90", en: "Can we pay by bank transfer?", az: "Bank köçürməsi ilə ödəyə bilərik?", level: "A2" },

        // 91–100: Liman və maliyyənin qarışığı
        { id: "starter-91", en: "The shipping company sent us a bill.", az: "Gəmiçilik şirkəti bizə hesab göndərdi.", level: "A2" },
        { id: "starter-92", en: "The port charges are included in the invoice.", az: "Liman rüsumları hesab-fakturaya daxildir.", level: "A2" },
        { id: "starter-93", en: "The company paid for the vessel's fuel.", az: "Şirkət gəminin yanacağı üçün ödəniş etdi.", level: "A2" },
        { id: "starter-94", en: "The customer asked for a lower price.", az: "Müştəri daha aşağı qiymət istədi.", level: "A2" },
        { id: "starter-95", en: "We must calculate the port fees.", az: "Liman rüsumlarını hesablamalıyıq.", level: "A2" },
        { id: "starter-96", en: "The cargo arrived, but the payment is late.", az: "Yük çatdı, amma ödəniş gecikir.", level: "A2" },
        { id: "starter-97", en: "The company paid the shipping costs.", az: "Şirkət daşınma xərclərini ödədi.", level: "A2" },
        { id: "starter-98", en: "We need the final invoice before departure.", az: "Yola düşməzdən əvvəl bizə yekun hesab-faktura lazımdır.", level: "A2" },
        { id: "starter-99", en: "The vessel's delay increased the costs.", az: "Gəminin gecikməsi xərcləri artırdı.", level: "A2" },
        { id: "starter-100", en: "We received the payment for the cargo today.", az: "Yük üçün ödənişi bu gün aldıq.", level: "A2" }
    ];

    const $ = id => document.getElementById(id);
    const view = $("english-practice-view");
    if (!view) return;

    function readStorage(key, fallback) {
        try {
            const value = localStorage.getItem(key);
            return value === null ? fallback : JSON.parse(value);
        } catch (_) {
            return fallback;
        }
    }

    function save(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (_) {
            // Məşqin işləməsinə mane olmasın.
        }
    }

    function normalize(value) {
        return String(value || "")
            .toLocaleLowerCase("en-US")
            .replace(/[.!?]+$/, "")
            .replace(/\s+/g, " ")
            .trim();
    }

    // Yeni standart cümlələri yaddaşdakı köhnə siyahı ilə birləşdir.
    // İstifadəçinin öz əlavə etdiyi cümlələri saxla.
    const savedSentences = readStorage(SENTENCE_KEY, null);
    const customSentences = Array.isArray(savedSentences)
        ? savedSentences.filter(item =>
            item &&
            item.id &&
            item.en &&
            item.az &&
            !String(item.id).startsWith("starter-")
        )
        : [];

    const starterTexts = new Set(
        STARTER_SENTENCES.map(item => normalize(item.en))
    );

    const preservedCustomSentences = customSentences.filter(
        item => !starterTexts.has(normalize(item.en))
    );

    let sentences = [
        ...STARTER_SENTENCES.map(item => ({ ...item })),
        ...preservedCustomSentences
    ];

    let totals = readStorage(STATS_KEY, { correct: 0, wrong: 0 });

    if (!totals || typeof totals !== "object") {
        totals = { correct: 0, wrong: 0 };
    }

    totals.correct = Number.isFinite(Number(totals.correct))
        ? Number(totals.correct)
        : 0;

    totals.wrong = Number.isFinite(Number(totals.wrong))
        ? Number(totals.wrong)
        : 0;

    let deck = [];
    let current = null;
    let bank = [];
    let answer = [];
    let roundWrong = 0;
    let solved = false;
    let roundLocked = false;
    let roundTimer = null;

    const answerArea = $("english-answer");
    const wordBank = $("english-word-bank");
    const checkButton = $("english-check");
    const hintButton = $("english-hint");
    const clearButton = $("english-clear");
    const feedback = $("english-feedback");
    const customForm = $("english-add-form");
    const customList = $("english-custom-list");
    const backButton = $("english-back");

    function shuffle(items) {
        const result = [...items];

        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }

        return result;
    }

    function levelName(level) {
        return ({
            A1: "Başlanğıc",
            A2: "Əsas",
            B1: "Orta"
        })[level] || "Məşq";
    }

    function setFeedback(message, kind = "") {
        feedback.textContent = message;
        feedback.className =
            `english-feedback${kind ? ` ${kind}` : ""}`;
    }

    function updateStats() {
        $("english-score").textContent = totals.correct;
        $("english-wrong").textContent = totals.wrong;
        $("english-sentence-count").textContent = sentences.length;

        const customCount = sentences.filter(
            item => item.custom ||
                !String(item.id).startsWith("starter-")
        ).length;

        $("english-custom-count").textContent = customCount;

        save(STATS_KEY, totals);
        save(SENTENCE_KEY, sentences);

        renderCustomSentences();
    }

    function updateMistakeMeter() {
        $("english-run-error-label").textContent =
            `BU RAUNDA SƏHV: ${roundWrong} / ${MISS_LIMIT}`;

        $("english-mistake-pips")
            .querySelectorAll("i")
            .forEach((pip, index) => {
                pip.classList.toggle(
                    "is-filled",
                    index < roundWrong
                );
            });
    }

    function updateProgress() {
        const total = sentences.length;
        const position = current
            ? Math.max(1, total - deck.length)
            : 0;

        $("english-counter").textContent =
            total ? `${position} / ${total}` : "0 / 0";

        $("english-progress-bar").style.width =
            total ? `${position / total * 100}%` : "0%";
    }

    function drawWords() {
        answerArea.replaceChildren();
        answerArea.classList.toggle("empty", answer.length === 0);

        answer.forEach((word, index) => {
            const button = document.createElement("button");

            button.type = "button";
            button.className = "english-word answer-word";
            button.textContent = word.text;
            button.disabled = solved || roundLocked;

            button.addEventListener("click", () => {
                if (solved || roundLocked) return;

                bank.push(answer.splice(index, 1)[0]);
                drawWords();
            });

            answerArea.append(button);
        });

        wordBank.replaceChildren();

        bank.forEach((word, index) => {
            const button = document.createElement("button");

            button.type = "button";
            button.className = "english-word";
            button.textContent = word.text;
            button.disabled = solved || roundLocked;

            button.addEventListener("click", () => {
                if (solved || roundLocked) return;

                answer.push(bank.splice(index, 1)[0]);
                drawWords();
            });

            wordBank.append(button);
        });
    }

    function pickQuestion() {
        if (!sentences.length) {
            current = null;
            $("english-meaning").textContent =
                "Yeni cümlə əlavə et və məşqə başla.";

            bank = [];
            answer = [];
            drawWords();
            updateProgress();
            return;
        }

        if (!deck.length) {
            deck = shuffle(sentences.map(item => item.id));
        }

        const id = deck.pop();

        current = sentences.find(item => item.id === id) || sentences[0];

        const words = current.en.trim().split(/\s+/).map(
            (text, index) => ({
                id: `${index}-${Math.random().toString(36).slice(2, 7)}`,
                text
            })
        );

        bank = shuffle(words);

        if (
            words.length > 1 &&
            bank.every((word, index) => word.text === words[index].text)
        ) {
            bank = shuffle(words);
        }

        answer = [];
        solved = false;
        roundLocked = false;

        $("english-level").textContent =
            `${current.level || "A1"} · ${levelName(current.level || "A1")}`;

        $("english-meaning").textContent = current.az;

        checkButton.innerHTML =
            'Yoxla <span aria-hidden="true">→</span>';

        checkButton.disabled = false;
        hintButton.disabled = false;
        clearButton.disabled = false;

        setFeedback("");
        updateProgress();
        updateMistakeMeter();
        drawWords();
    }

    function beginRound(message = "") {
        if (roundTimer) {
            window.clearTimeout(roundTimer);
        }

        roundTimer = null;
        deck = shuffle(sentences.map(item => item.id));
        roundWrong = 0;
        solved = false;
        roundLocked = false;

        updateMistakeMeter();
        pickQuestion();

        if (message) {
            setFeedback(message, "good");
        }
    }

    function advanceQuestion() {
        if (!deck.length) {
            beginRound("Afərin! Bütün cümlələr bitdi, yeni raund başladı.");
            return;
        }

        pickQuestion();
    }

    function checkAnswer() {
        if (roundLocked || !current) return;

        if (solved) {
            advanceQuestion();
            return;
        }

        const response = answer
            .map(word => word.text)
            .join(" ");

        if (normalize(response) === normalize(current.en)) {
            totals.correct += 1;
            solved = true;

            updateStats();
            drawWords();

            checkButton.innerHTML =
                'Növbəti <span aria-hidden="true">→</span>';

            setFeedback("Düz tapdın! Əla gedirsən. ✓", "good");
            return;
        }

        if (!answer.length) {
            setFeedback("Əvvəl sözləri seç, sonra yoxla.");
            return;
        }

        totals.wrong += 1;
        roundWrong += 1;

        updateStats();
        updateMistakeMeter();

        if (roundWrong >= MISS_LIMIT) {
            roundLocked = true;

            drawWords();

            checkButton.disabled = true;
            hintButton.disabled = true;
            clearButton.disabled = true;

            setFeedback(
                "5 səhv oldu — raund uduzuldu. Yenidən başlayırsan…",
                "bad"
            );

            roundTimer = window.setTimeout(
                () => beginRound("Yeni raund başladı. Bu dəfə diqqətlə!"),
                1800
            );

            return;
        }

        setFeedback(
            `Cümlə düz deyil. ${MISS_LIMIT - roundWrong} səhv haqqın qaldı.`,
            "bad"
        );
    }

    function showHint() {
        if (!current || solved || roundLocked) return;

        const targetWord = current.en.trim().split(/\s+/)[answer.length];

        const matchIndex = bank.findIndex(
            word => word.text === targetWord
        );

        if (matchIndex < 0) {
            setFeedback("Bütün sözlər seçilib. Sırasını dəyişib yoxla.");
            return;
        }

        answer.push(bank.splice(matchIndex, 1)[0]);

        drawWords();
        setFeedback("İpucu: növbəti söz əlavə olundu.");
    }

    function clearAnswer() {
        if (!current || solved || roundLocked) return;

        bank = shuffle([...bank, ...answer]);
        answer = [];

        drawWords();
        setFeedback("Seçimlər təmizləndi.");
    }

    function renderCustomSentences() {
        if (!customList) return;

        const customItems = sentences.filter(
            item => item.custom ||
                !String(item.id).startsWith("starter-")
        );

        customList.replaceChildren();

        if (!customItems.length) {
            const empty = document.createElement("li");

            empty.className = "english-custom-empty";
            empty.textContent = "Hələ cümlə əlavə edilməyib.";

            customList.append(empty);
            return;
        }

        customItems.slice(-8).reverse().forEach(item => {
            const row = document.createElement("li");
            const label = document.createElement("span");
            const remove = document.createElement("button");

            label.textContent = item.en;
            label.title = item.en;

            remove.type = "button";
            remove.textContent = "Sil";
            remove.setAttribute(
                "aria-label",
                `${item.en} cümləsini sil`
            );

            remove.addEventListener("click", () => {
                sentences = sentences.filter(
                    sentence => sentence.id !== item.id
                );

                deck = deck.filter(
                    sentenceId => sentenceId !== item.id
                );

                if (current?.id === item.id) {
                    pickQuestion();
                }

                updateStats();
                updateProgress();
            });

            row.append(label, remove);
            customList.append(row);
        });
    }

    customForm.addEventListener("submit", event => {
        event.preventDefault();

        const en = $("english-new-sentence")
            .value.trim().replace(/\s+/g, " ");

        const az = $("english-new-meaning")
            .value.trim().replace(/\s+/g, " ");

        const level = $("english-new-level").value;

        if (!en || !az) return;

        if (
            sentences.some(
                item => normalize(item.en) === normalize(en)
            )
        ) {
            setFeedback("Bu cümlə artıq siyahıdadır.", "bad");
            return;
        }

        const item = {
            id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            en,
            az,
            level,
            custom: true
        };

        sentences.push(item);

        if (!deck.includes(item.id) && current?.id !== item.id) {
            deck.push(item.id);
        }

        customForm.reset();

        updateStats();
        updateProgress();

        setFeedback(
            "Cümlən yadda saxlandı və məşq siyahısına əlavə edildi.",
            "good"
        );
    });

    checkButton.addEventListener("click", checkAnswer);
    hintButton.addEventListener("click", showHint);
    clearButton.addEventListener("click", clearAnswer);

    backButton.addEventListener("click", () => {
        if (typeof window.showView === "function") {
            window.showView("home");
        }
    });

    // İlk açılışda 100 cümləni və şəxsi cümlələri yadda saxla.
    save(SENTENCE_KEY, sentences);

    beginRound();
    updateStats();
})();
