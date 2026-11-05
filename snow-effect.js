(() => {
    "use strict";

    const STORAGE_KEY = "liman-snow-effect-enabled";
    const toggle = document.getElementById("snow-effect-toggle");
    if (!toggle || window.__limanSnowEffectInitialized) return;
    window.__limanSnowEffectInitialized = true;

    let enabled = true;
    try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        enabled = saved === null ? true : saved === "true";
    } catch (_) {
        enabled = true;
    }

    const canvas = document.createElement("canvas");
    canvas.className = "snow-effect-canvas";
    canvas.setAttribute("aria-hidden", "true");
    canvas.hidden = true;
    document.body.prepend(canvas);

    const context = canvas.getContext("2d", { alpha: true });
    const status = toggle.querySelector("[data-snow-effect-label]");
    const state = toggle.querySelector(".snow-toggle-state");
    const menuToggle = document.getElementById("menu-toggle");
    let flakes = [];
    let frameId = 0;
    let previousTime = 0;
    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let lastDrawTime = 0;
    const frameInterval = 1000 / 30;

    function makeFlake(randomY = false) {
        return {
            x: Math.random() * width,
            y: randomY ? Math.random() * height : -8,
            radius: 2.4 + Math.random() * 3.4,
            speed: 38 + Math.random() * 58,
            drift: 8 + Math.random() * 24,
            phase: Math.random() * Math.PI * 2,
            opacity: 0.58 + Math.random() * 0.4
        };
    }

    function resize() {
        pixelRatio = Math.min(window.devicePixelRatio || 1, 1.15);
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = Math.round(width * pixelRatio);
        canvas.height = Math.round(height * pixelRatio);
        context?.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        const targetCount = Math.min(130, Math.max(60, Math.round(width / 12)));
        flakes = Array.from({ length: targetCount }, () => makeFlake(true));
    }

    function draw(time) {
        frameId = 0;
        if (!enabled || document.hidden || !context) return;
        if (time - lastDrawTime < frameInterval) {
            frameId = window.requestAnimationFrame(draw);
            return;
        }
        lastDrawTime = time;
        const elapsed = previousTime ? Math.min((time - previousTime) / 1000, 0.05) : 0;
        previousTime = time;
        context.clearRect(0, 0, width, height);
        const isDarkView = document.body.classList.contains("english-practice-screen");
        const color = isDarkView ? "237, 248, 255" : "83, 111, 157";

        for (const flake of flakes) {
            flake.phase += elapsed * 0.75;
            flake.y += flake.speed * elapsed;
            flake.x += Math.sin(flake.phase) * flake.drift * elapsed;
            if (flake.y > height + 6) {
                flake.y = -6;
                flake.x = Math.random() * width;
            }
            if (flake.x < -5) flake.x = width + 4;
            if (flake.x > width + 5) flake.x = -4;

            context.strokeStyle = `rgba(${color}, 1)`;
            context.lineWidth = flake.radius > 4 ? 1.35 : 1.05;
            context.lineCap = "round";
            context.globalAlpha = flake.opacity;
            context.beginPath();
            for (let arm = 0; arm < 6; arm += 1) {
                const angle = arm * Math.PI / 3 + flake.phase * .08;
                const endX = flake.x + Math.cos(angle) * flake.radius;
                const endY = flake.y + Math.sin(angle) * flake.radius;
                context.moveTo(flake.x, flake.y);
                context.lineTo(endX, endY);
            }
            context.stroke();
        }
        context.globalAlpha = 1;
        context.shadowBlur = 0;
        frameId = window.requestAnimationFrame(draw);
    }

    function stopAnimation() {
        if (frameId) window.cancelAnimationFrame(frameId);
        frameId = 0;
        previousTime = 0;
        lastDrawTime = 0;
        context?.clearRect(0, 0, width, height);
    }

    function syncToggle() {
        toggle.setAttribute("aria-pressed", String(enabled));
        toggle.setAttribute("aria-label", `Qar effektini ${enabled ? "söndür" : "aktiv et"}`);
        if (status) status.textContent = enabled ? "Aktivdir · söndür" : "Söndürülüb · aktiv et";
        if (state) state.textContent = enabled ? "ON" : "OFF";
        canvas.hidden = !enabled;
        if (enabled && !document.hidden) {
            if (!width || !height) resize();
            if (!frameId) frameId = window.requestAnimationFrame(draw);
        } else {
            stopAnimation();
        }
    }

    toggle.addEventListener("click", () => {
        enabled = !enabled;
        try { window.localStorage.setItem(STORAGE_KEY, String(enabled)); } catch (_) { /* Keep this session's choice. */ }
        syncToggle();
        if (menuToggle?.getAttribute("aria-expanded") === "true") menuToggle.click();
    });

    window.addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", syncToggle);
    window.addEventListener("storage", event => {
        if (event.key !== STORAGE_KEY) return;
        enabled = event.newValue === "true";
        syncToggle();
    });

    resize();
    syncToggle();
})();
