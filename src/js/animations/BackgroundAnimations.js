const preloadColors = ['#FF0000', '#FFCF03', '#00C907', '#9A00EB', '#F2059F'];

export class BackgroundAnimations {
    constructor() {
        this.kannadaCtx = null;
        this.kannadaRings = [];
        this.kannadaCanvasWidth = 0;
        this.kannadaCanvasHeight = 0;
        this.isTickerRunning = false;
        this.textSprite = null;
        this.textSpriteWidth = 0;
        this.textSpriteHeight = 0;
        this.lastColorIndex = 0;
    }

    initBackgroundText() {
        const container = document.getElementById('bg-text-container');
        if (!container) return;
        container.innerHTML = '';
        const textToRepeat = "ಸುಸ್ವಾಗತ";
        const reps = 20;
        const fontSize = 128;
        const lineHeight = 1.4;
        const rowHeightPx = fontSize * lineHeight;
        const vh = window.innerHeight;
        let rowCount = Math.ceil(vh / rowHeightPx);
        if (rowCount < 3) rowCount = 3;

        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.justifyContent = 'center';
        container.style.alignItems = 'center';
        container.style.overflow = 'hidden';
        container.style.gap = '0px';

        for (let i = 0; i < rowCount; i++) {
            const row = document.createElement('div');
            row.classList.add('bg-text-row');
            row.style.fontSize = `${fontSize}px`;
            row.style.lineHeight = `${lineHeight}`;
            row.style.height = `${rowHeightPx}px`;
            row.style.display = 'flex';
            row.style.alignItems = 'center';
            row.style.whiteSpace = 'nowrap';
            row.style.flexShrink = '0';
            const isLeftToRight = (i % 2 === 0);

            if (isLeftToRight) { row.classList.add('row-ltr'); }
            else { row.classList.add('row-rtl'); }

            let html = '';
            for (let j = 0; j < reps; j++) {
                html += `<span class="bg-text-item" style="padding-right: 80px; display: inline-block;">${textToRepeat}</span>`;
            }
            row.innerHTML = html;
            container.appendChild(row);

            if (isLeftToRight) {
                gsap.fromTo(row, { xPercent: -25 }, { xPercent: 0, ease: "none", duration: 40, repeat: -1 });
            } else {
                gsap.fromTo(row, { xPercent: 0 }, { xPercent: -25, ease: "none", duration: 40, repeat: -1 });
            }
        }
    }

    createTextSprite(text, fontSize, dotColor) {
        const spriteCanvas = document.createElement('canvas');
        const ctx = spriteCanvas.getContext('2d');
        const fontSpec = `600 ${fontSize}px 'Noto Sans Kannada UI', sans-serif`;
        ctx.font = fontSpec;
        const metrics = ctx.measureText(text);
        const width = Math.ceil(metrics.width);
        const height = Math.ceil(fontSize * 1.5);
        spriteCanvas.width = width;
        spriteCanvas.height = height;
        ctx.font = fontSpec;
        ctx.textBaseline = "middle";
        ctx.textAlign = "left";
        const parts = text.split("•");
        ctx.globalAlpha = 0.05;
        ctx.fillStyle = "#000000";
        const mainText = parts[0];
        ctx.fillText(mainText, 0, height / 2);
        if (parts.length > 1) {
            const mainWidth = ctx.measureText(mainText).width;
            ctx.fillStyle = dotColor || "#000000";
            ctx.fillText("•", mainWidth, height / 2);
        }
        return { canvas: spriteCanvas, width, height };
    }

    createKannadaRings(color) {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const maxRadius = Math.sqrt(width * width + height * height) / 2;
        const fontSize = 16;
        const ringSpacing = 32;
        const textStr = " ಕನ್ನಡಿಗ  •";
        const currentColor = color || preloadColors[this.lastColorIndex] || '#000000';

        this.textSprite = null;
        const spriteData = this.createTextSprite(textStr, fontSize, currentColor);
        this.textSprite = spriteData.canvas;
        this.textSpriteWidth = spriteData.width;
        this.textSpriteHeight = spriteData.height;

        this.kannadaRings = [];
        let currentRadius = 100;
        let index = 0;
        const constantSpeed = 0.0015;

        while (currentRadius < maxRadius + 100) {
            const circumference = 2 * Math.PI * currentRadius;
            const repeats = Math.floor(circumference / this.textSpriteWidth);
            const angleStep = (Math.PI * 2) / repeats;
            const direction = index % 2 === 0 ? 1 : -1;

            this.kannadaRings.push({
                radius: currentRadius,
                repeats: repeats,
                angleStep: angleStep,
                currentAngle: 0,
                speed: direction * constantSpeed,
                opacity: 1
            });
            currentRadius += ringSpacing;
            index++;
        }
    }

    renderKannadaCircles = () => {
        if (!this.kannadaCtx || !this.textSprite) return;
        const container = document.getElementById('kannada-circles-container');
        if (!container || parseFloat(window.getComputedStyle(container).opacity) < 0.01) return;

        this.kannadaCtx.setTransform(1, 0, 0, 1, 0, 0);
        this.kannadaCtx.clearRect(0, 0, this.kannadaCtx.canvas.width, this.kannadaCtx.canvas.height);

        const centerX = this.kannadaCanvasWidth / 2;
        const centerY = this.kannadaCanvasHeight / 2;
        const dpr = window.devicePixelRatio || 1;

        for (let i = 0; i < this.kannadaRings.length; i++) {
            const ring = this.kannadaRings[i];
            if (ring.opacity <= 0.001) continue;
            this.kannadaCtx.globalAlpha = ring.opacity;
            ring.currentAngle += ring.speed;
            const repeats = ring.repeats;
            const radius = ring.radius;
            const baseAngle = ring.currentAngle;
            const angleStep = ring.angleStep;

            for (let j = 0; j < repeats; j++) {
                const angle = baseAngle + (angleStep * j);
                const x = centerX + Math.cos(angle) * radius;
                const y = centerY + Math.sin(angle) * radius;
                const rotation = angle + (Math.PI / 2);
                const cos = Math.cos(rotation);
                const sin = Math.sin(rotation);

                this.kannadaCtx.setTransform(cos * dpr, sin * dpr, -sin * dpr, cos * dpr, x * dpr, y * dpr);
                this.kannadaCtx.drawImage(this.textSprite, -this.textSpriteWidth / 2, -this.textSpriteHeight / 2);
            }
        }

        this.kannadaCtx.setTransform(1, 0, 0, 1, 0, 0);
        this.kannadaCtx.globalAlpha = 1;
        this.kannadaCtx.globalCompositeOperation = 'destination-in';
        const canvasW = this.kannadaCtx.canvas.width;
        const canvasH = this.kannadaCtx.canvas.height;
        const cx = canvasW / 2;
        const cy = canvasH / 2;
        const maxDist = Math.sqrt(cx * cx + cy * cy);
        const gradient = this.kannadaCtx.createRadialGradient(cx, cy, 0, cx, cy, maxDist);
        gradient.addColorStop(0, "rgba(0, 0, 0, 1)");
        gradient.addColorStop(0.2, "rgba(0, 0, 0, 1)");
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
        this.kannadaCtx.fillStyle = gradient;
        this.kannadaCtx.fillRect(0, 0, canvasW, canvasH);
        this.kannadaCtx.globalCompositeOperation = 'source-over';
    }

    initKannadaCircles() {
        const container = document.getElementById('kannada-circles-container');
        if (!container) return;
        let canvas = container.querySelector('canvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            container.appendChild(canvas);
            this.kannadaCtx = canvas.getContext('2d', { alpha: true, desynchronized: true });
            if (!this.isTickerRunning) {
                gsap.ticker.add(this.renderKannadaCircles);
                this.isTickerRunning = true;
            }
        }
        const dpr = window.devicePixelRatio || 1;
        this.kannadaCanvasWidth = window.innerWidth;
        this.kannadaCanvasHeight = window.innerHeight;
        canvas.width = this.kannadaCanvasWidth * dpr;
        canvas.height = this.kannadaCanvasHeight * dpr;
        this.createKannadaRings();
    }
}
