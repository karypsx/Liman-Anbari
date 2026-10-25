(function () {
    "use strict";

    const SENTENCE_KEY = "liman-english-sentences-v1";
    const STATS_KEY = "liman-english-stats-v1";
    const MISS_LIMIT = 5;
    const STARTER_SENTENCES = [
    { id: "starter-01", en: "The goods arrived at the port today.", az: "Mallar bu gün limana çatdı.", level: "A1" },
    { id: "starter-02", en: "I need to check the stock.", az: "Anbar qalığını yoxlamalıyam.", level: "A1" },
    { id: "starter-03", en: "How many boxes are in the warehouse?", az: "Anbarda neçə qutu var?", level: "A1" },
    { id: "starter-04", en: "Please write down the quantity.", az: "Zəhmət olmasa, miqdarı qeyd edin.", level: "A1" },
    { id: "starter-05", en: "Put the goods in area A.", az: "Malları A sahəsinə qoyun.", level: "A1" },
    { id: "starter-06", en: "The ship will arrive tomorrow.", az: "Gəmi sabah gələcək.", level: "A1" },
    { id: "starter-07", en: "The delivery is ready.", az: "Təhvil hazırdır.", level: "A1" },
    { id: "starter-08", en: "Where is the shipment?", az: "Yük haradadır?", level: "A1" },
    { id: "starter-09", en: "We received ten bottles of water.", az: "On butulka su qəbul etdik.", level: "A2" },
    { id: "starter-10", en: "The worker took the goods yesterday.", az: "İşçi malları dünən götürdü.", level: "A2" },

    { id: "starter-11", en: "We received five boxes of goods.", az: "Beş qutu mal qəbul etdik.", level: "A2" },
    { id: "starter-12", en: "The driver arrived in the morning.", az: "Sürücü səhər gəldi.", level: "A1" },
    { id: "starter-13", en: "The truck is outside the warehouse.", az: "Yük maşını anbarın çölündədir.", level: "A1" },
    { id: "starter-14", en: "Please count the boxes.", az: "Zəhmət olmasa, qutuları sayın.", level: "A1" },
    { id: "starter-15", en: "The worker checked the goods.", az: "İşçi malları yoxladı.", level: "A2" },
    { id: "starter-16", en: "We need more space.", az: "Bizə daha çox yer lazımdır.", level: "A1" },
    { id: "starter-17", en: "The warehouse is very busy today.", az: "Anbar bu gün çox işləkdir.", level: "A1" },
    { id: "starter-18", en: "Where should I put these boxes?", az: "Bu qutuları hara qoymalıyam?", level: "A2" },
    { id: "starter-19", en: "The goods are ready for delivery.", az: "Mallar təhvil üçün hazırdır.", level: "A1" },
    { id: "starter-20", en: "We loaded the truck yesterday.", az: "Dünən yük maşınına mal yüklədik.", level: "A2" },

    { id: "starter-21", en: "The ship arrived at the port.", az: "Gəmi limana çatdı.", level: "A2" },
    { id: "starter-22", en: "The worker is checking the stock.", az: "İşçi anbar qalığını yoxlayır.", level: "A2" },
    { id: "starter-23", en: "How many bottles did we receive?", az: "Neçə butulka qəbul etdik?", level: "A2" },
    { id: "starter-24", en: "We need ten more boxes.", az: "Bizə daha on qutu lazımdır.", level: "A1" },
    { id: "starter-25", en: "The driver brought the documents.", az: "Sürücü sənədləri gətirdi.", level: "A2" },
    { id: "starter-26", en: "Please check the delivery note.", az: "Zəhmət olmasa, təhvil sənədini yoxlayın.", level: "A1" },
    { id: "starter-27", en: "The goods are inside the warehouse.", az: "Mallar anbarın içindədir.", level: "A1" },
    { id: "starter-28", en: "I counted twenty bags.", az: "İyirmi kisə saydım.", level: "A2" },
    { id: "starter-29", en: "They unloaded the truck this morning.", az: "Onlar bu səhər yük maşınını boşaltdılar.", level: "A2" },
    { id: "starter-30", en: "We will check the goods tomorrow.", az: "Malları sabah yoxlayacağıq.", level: "A2" },

    { id: "starter-31", en: "Do you work at the port?", az: "Sən limanda işləyirsən?", level: "A1" },
    { id: "starter-32", en: "Does the worker need help?", az: "İşçinin köməyə ehtiyacı var?", level: "A1" },
    { id: "starter-33", en: "Did you receive the goods?", az: "Malları qəbul etdin?", level: "A2" },
    { id: "starter-34", en: "Where did the driver go?", az: "Sürücü hara getdi?", level: "A2" },
    { id: "starter-35", en: "The workers are moving the boxes.", az: "İşçilər qutuları daşıyırlar.", level: "A2" },
    { id: "starter-36", en: "I do not know the quantity.", az: "Miqdarı bilmirəm.", level: "A2" },
    { id: "starter-37", en: "The truck did not arrive today.", az: "Yük maşını bu gün gəlmədi.", level: "A2" },
    { id: "starter-38", en: "How many workers are in the warehouse?", az: "Anbarda neçə işçi var?", level: "A1" },
    { id: "starter-39", en: "The manager will check the documents.", az: "Menecer sənədləri yoxlayacaq.", level: "A2" },
    { id: "starter-40", en: "Please bring the goods here.", az: "Zəhmət olmasa, malları bura gətirin.", level: "A1" },

    { id: "starter-41", en: "We sent the documents yesterday.", az: "Sənədləri dünən göndərdik.", level: "A2" },
    { id: "starter-42", en: "The shipment is late.", az: "Yük gecikir.", level: "A1" },
    { id: "starter-43", en: "The goods arrived at eight o'clock.", az: "Mallar saat səkkizdə çatdı.", level: "A2" },
    { id: "starter-44", en: "There are twelve boxes on the truck.", az: "Yük maşınında on iki qutu var.", level: "A2" },
    { id: "starter-45", en: "I wrote down the quantity.", az: "Miqdarı qeyd etdim.", level: "A2" },
    { id: "starter-46", en: "The worker opened the warehouse door.", az: "İşçi anbarın qapısını açdı.", level: "A2" },
    { id: "starter-47", en: "We have enough space for the goods.", az: "Mallar üçün kifayət qədər yerimiz var.", level: "A2" },
    { id: "starter-48", en: "When will the ship arrive?", az: "Gəmi nə vaxt çatacaq?", level: "A2" },
    { id: "starter-49", en: "Please put the boxes near the door.", az: "Zəhmət olmasa, qutuları qapının yanına qoyun.", level: "A2" },
    { id: "starter-50", en: "We received the shipment this morning.", az: "Yükü bu səhər qəbul etdik.", level: "A2" }
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

    let sentences = readStorage(SENTENCE_KEY, null);
    if (!Array.isArray(sentences)) sentences = STARTER_SENTENCES.map(item => ({ ...item }));
    sentences = sentences.filter(item => item && item.id && item.en && item.az);

    let totals = readStorage(STATS_KEY, { correct: 0, wrong: 0 });
    if (!totals || typeof totals !== "object") totals = { correct: 0, wrong: 0 };
    totals.correct = Number.isFinite(Number(totals.correct)) ? Number(totals.correct) : 0;
    totals.wrong = Number.isFinite(Number(totals.wrong)) ? Number(totals.wrong) : 0;

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

    function save(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) { /* İcra davam etsin. */ }
    }

    function shuffle(items) {
        const result = [...items];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }

    function normalize(value) {
        return String(value || "").toLocaleLowerCase("en-US").replace(/[.!?]+$/, "").replace(/\s+/g, " ").trim();
    }

    function levelName(level) {
        return ({ A1: "Başlanğıc", A2: "Əsas", B1: "Orta" })[level] || "Məşq";
    }

    function setFeedback(message, kind = "") {
        feedback.textContent = message;
        feedback.className = `english-feedback${kind ? ` ${kind}` : ""}`;
    }

    function updateStats() {
        $("english-score").textContent = totals.correct;
        $("english-wrong").textContent = totals.wrong;
        $("english-sentence-count").textContent = sentences.length;
        const customCount = sentences.filter(item => item.custom).length;
        $("english-custom-count").textContent = customCount;
        save(STATS_KEY, totals);
        save(SENTENCE_KEY, sentences);
        renderCustomSentences();
    }

    function updateMistakeMeter() {
        $("english-run-error-label").textContent = `BU RAUNDA SƏHV: ${roundWrong} / ${MISS_LIMIT}`;
        $("english-mistake-pips").querySelectorAll("i").forEach((pip, index) => {
            pip.classList.toggle("is-filled", index < roundWrong);
        });
    }

    function updateProgress() {
        const total = sentences.length;
        const position = current ? Math.max(1, total - deck.length) : 0;
        $("english-counter").textContent = total ? `${position} / ${total}` : "0 / 0";
        $("english-progress-bar").style.width = total ? `${position / total * 100}%` : "0%";
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
            $("english-meaning").textContent = "Yeni cümlə əlavə et və məşqə başla.";
            bank = [];
            answer = [];
            drawWords();
            return;
        }
        if (!deck.length) deck = shuffle(sentences.map(item => item.id));
        const id = deck.pop();
        current = sentences.find(item => item.id === id) || sentences[0];
        const words = current.en.trim().split(/\s+/).map((text, index) => ({ id: `${index}-${Math.random().toString(36).slice(2, 7)}`, text }));
        bank = shuffle(words);
        if (words.length > 1 && bank.every((word, index) => word.text === words[index].text)) bank = shuffle(words);
        answer = [];
        solved = false;
        roundLocked = false;
        $("english-level").textContent = `${current.level || "A1"} · ${levelName(current.level || "A1")}`;
        $("english-meaning").textContent = current.az;
        checkButton.innerHTML = 'Yoxla <span aria-hidden="true">→</span>';
        checkButton.disabled = false;
        hintButton.disabled = false;
        clearButton.disabled = false;
        setFeedback("");
        updateProgress();
        updateMistakeMeter();
        drawWords();
    }

    function beginRound(message = "") {
        if (roundTimer) window.clearTimeout(roundTimer);
        roundTimer = null;
        deck = shuffle(sentences.map(item => item.id));
        roundWrong = 0;
        solved = false;
        roundLocked = false;
        updateMistakeMeter();
        pickQuestion();
        if (message) setFeedback(message, "good");
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
        const response = answer.map(word => word.text).join(" ");
        if (normalize(response) === normalize(current.en)) {
            totals.correct += 1;
            solved = true;
            updateStats();
            drawWords();
            checkButton.innerHTML = 'Növbəti <span aria-hidden="true">→</span>';
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
            setFeedback("5 səhv oldu — raund uduzuldu. Yenidən başlayırsan…", "bad");
            roundTimer = window.setTimeout(() => beginRound("Yeni raund başladı. Bu dəfə diqqətlə!"), 1800);
            return;
        }
        setFeedback(`Cümlə düz deyil. ${MISS_LIMIT - roundWrong} səhv haqqın qaldı.`, "bad");
    }

    function showHint() {
        if (!current || solved || roundLocked) return;
        const targetWord = current.en.trim().split(/\s+/)[answer.length];
        const matchIndex = bank.findIndex(word => word.text === targetWord);
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
        const customSentences = sentences.filter(item => item.custom);
        customList.replaceChildren();
        if (!customSentences.length) {
            const empty = document.createElement("li");
            empty.className = "english-custom-empty";
            empty.textContent = "Hələ cümlə əlavə edilməyib.";
            customList.append(empty);
            return;
        }
        customSentences.slice(-8).reverse().forEach(item => {
            const row = document.createElement("li");
            const label = document.createElement("span");
            label.textContent = item.en;
            label.title = item.en;
            const remove = document.createElement("button");
            remove.type = "button";
            remove.textContent = "Sil";
            remove.setAttribute("aria-label", `${item.en} cümləsini sil`);
            remove.addEventListener("click", () => {
                sentences = sentences.filter(sentence => sentence.id !== item.id);
                if (current?.id === item.id) pickQuestion();
                deck = deck.filter(sentenceId => sentenceId !== item.id);
                updateStats();
                updateProgress();
            });
            row.append(label, remove);
            customList.append(row);
        });
    }

    customForm.addEventListener("submit", event => {
        event.preventDefault();
        const en = $("english-new-sentence").value.trim().replace(/\s+/g, " ");
        const az = $("english-new-meaning").value.trim().replace(/\s+/g, " ");
        const level = $("english-new-level").value;
        if (!en || !az) return;
        if (sentences.some(item => normalize(item.en) === normalize(en))) {
            setFeedback("Bu cümlə artıq siyahıdadır.", "bad");
            return;
        }
        const item = { id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, en, az, level, custom: true };
        sentences.push(item);
        if (!deck.includes(item.id) && current?.id !== item.id) deck.push(item.id);
        customForm.reset();
        updateStats();
        updateProgress();
        setFeedback("Cümlən yadda saxlandı və məşq siyahısına əlavə edildi.", "good");
    });

    checkButton.addEventListener("click", checkAnswer);
    hintButton.addEventListener("click", showHint);
    clearButton.addEventListener("click", clearAnswer);
    backButton.addEventListener("click", () => {
        if (typeof window.showView === "function") window.showView("home");
    });
    beginRound();
    updateStats();
})();
