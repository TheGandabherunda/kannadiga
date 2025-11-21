/* =========================================
   CUSTOM CURSOR LOGIC (Runs Immediately)
   ========================================= */

const cursor = document.getElementById('custom-cursor');
const container = document.querySelector('.container');
const logoWrapper = document.getElementById('logoWrapper');

// --- 1. MOVEMENT ---
gsap.set(cursor, { xPercent: -50, yPercent: -50 });

const xTo = gsap.quickTo(cursor, "x", { duration: 0.2, ease: "power3.out" });
const yTo = gsap.quickTo(cursor, "y", { duration: 0.2, ease: "power3.out" });

window.addEventListener('mousemove', (e) => {
    xTo(e.clientX);
    yTo(e.clientY);
});

// --- 2. STATE MANAGEMENT ---
let isTextHover = false;
let currentTextHeight = 0;

const textSelectors = '.loading-text-left, .loading-text-right, .bottom-text, .welcome-text, p, h1, h2, h3, h4, h5, h6, span';

const attachHoverListeners = () => {
    document.querySelectorAll(textSelectors).forEach(el => {
        if(el.dataset.cursorAttached) return;
        el.dataset.cursorAttached = "true";

        el.addEventListener('mouseenter', () => {
            isTextHover = true;
            const style = window.getComputedStyle(el);
            const fontSize = parseFloat(style.fontSize);
            currentTextHeight = fontSize;

            gsap.to(cursor, {
                width: 2,
                height: fontSize,
                duration: 0.3,
                ease: "expo.out"
            });
        });

        el.addEventListener('mouseleave', () => {
            isTextHover = false;
            gsap.to(cursor, {
                width: 14,
                height: 14,
                duration: 0.3,
                ease: "expo.out"
            });
        });
    });
};

attachHoverListeners();

// --- 3. CLICK INTERACTION ---
window.addEventListener('mousedown', () => {
    if (isTextHover) {
        gsap.to(cursor, { height: currentTextHeight - 2, duration: 0.15, ease: "power2.out" });
    } else {
        gsap.to(cursor, { width: 12, height: 12, duration: 0.15, ease: "power2.out" });
    }
});

window.addEventListener('mouseup', () => {
    if (isTextHover) {
        gsap.to(cursor, { height: currentTextHeight, duration: 0.15, ease: "power2.out" });
    } else {
        gsap.to(cursor, { width: 14, height: 14, duration: 0.15, ease: "power2.out" });
    }
});


/* =========================================
   SVG LIGHTING LOGIC
   ========================================= */

window.initSVGLights = function() {
    const lightSource = document.getElementById('light-source');
    const diffuseSource = document.getElementById('diffuse-source');
    const shadowFilter = document.getElementById('dynamic-shadow');
    const specularElement = document.getElementById('specular-element');

    const vbWidth = 72;
    const vbHeight = 97;

    window.addEventListener('mousemove', (e) => {
        if (!lightSource || !diffuseSource) return;

        const logoRect = logoWrapper.getBoundingClientRect();
        const logoCenterX = logoRect.left + logoRect.width / 2;
        const logoCenterY = logoRect.top + logoRect.height / 2;

        const localX = e.clientX - logoRect.left;
        const localY = e.clientY - logoRect.top;

        logoWrapper.style.setProperty('--light-x', `${localX}px`);
        logoWrapper.style.setProperty('--light-y', `${localY}px`);

        const distX = e.clientX - logoCenterX;
        const distY = e.clientY - logoCenterY;

        const sensitivityX = (vbWidth * 3) / window.innerWidth;
        const sensitivityY = (vbHeight * 3) / window.innerHeight;

        const svgX = 36 + (distX * sensitivityX);
        const svgY = 48 + (distY * sensitivityY);

        lightSource.setAttribute('x', svgX);
        lightSource.setAttribute('y', svgY);
        diffuseSource.setAttribute('x', svgX);
        diffuseSource.setAttribute('y', svgY);

        const shadowX = ((logoCenterX - e.clientX) / window.innerWidth) * 8;
        const shadowY = ((logoCenterY - e.clientY) / window.innerHeight) * 8;

        shadowFilter.setAttribute('dx', shadowX);
        shadowFilter.setAttribute('dy', shadowY);

        const distance = Math.sqrt(distX * distX + distY * distY);
        const maxDistance = Math.sqrt(window.innerWidth ** 2 + window.innerHeight ** 2) / 1.5;
        let intensity = Math.max(0, 1 - (distance / maxDistance));

        logoWrapper.style.setProperty('--glow-opacity', intensity.toFixed(2));

        const baseSpecular = 0.9;
        const minSpecular = 0.75;
        const currentSpecular = minSpecular + (baseSpecular - minSpecular) * intensity;
        specularElement.setAttribute('specularConstant', currentSpecular.toFixed(2));
    });

    document.addEventListener('mouseleave', () => {
        if (!lightSource || !diffuseSource) return;
        lightSource.setAttribute('x', 36);
        lightSource.setAttribute('y', 48);
        diffuseSource.setAttribute('x', 36);
        diffuseSource.setAttribute('y', 48);
        specularElement.setAttribute('specularConstant', '0.75');
        shadowFilter.setAttribute('dx', 0);
        shadowFilter.setAttribute('dy', 0);
        logoWrapper.style.setProperty('--light-x', '50%');
        logoWrapper.style.setProperty('--light-y', '50%');
        logoWrapper.style.setProperty('--glow-opacity', '0');
    });
};