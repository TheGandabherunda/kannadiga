/* =========================================
   CUSTOM CURSOR LOGIC
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
const textSelectors = '.loading-text-left, .loading-text-right, .bottom-text, .welcome-text, p, h1, h2, h3, h4, h5, h6, span, .def-phonetic, .def-noun, .def-desc';

const attachHoverListeners = () => {
    document.querySelectorAll(textSelectors).forEach(el => {
        if(el.dataset.cursorAttached) return;
        el.dataset.cursorAttached = "true";
        el.addEventListener('mouseenter', () => {
            isTextHover = true;
            const style = window.getComputedStyle(el);
            const fontSize = parseFloat(style.fontSize);
            currentTextHeight = fontSize;
            gsap.to(cursor, { width: 2, height: fontSize, duration: 0.3, ease: "expo.out" });
        });
        el.addEventListener('mouseleave', () => {
            isTextHover = false;
            gsap.to(cursor, { width: 14, height: 14, duration: 0.3, ease: "expo.out" });
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


/* =========================================
   MAIN APP & ANIMATION LOGIC
   ========================================= */
const preloadColors = ['#FF0000', '#FFCF03', '#00C907', '#9A00EB', '#F2059F'];
const logoWrapperEl = document.getElementById('logoWrapper');
const counterEl = document.getElementById('loadingCounter');
const kannadaDigits = ['೦','೧','೨','೩','೪','೫','೬','೭','೮','೯'];

let wreathAnim = null;
let lastColorIndex = 0;

function initLottie() {
    wreathAnim = lottie.loadAnimation({
        container: document.getElementById('wreath-animation'),
        renderer: 'svg',
        loop: false,
        autoplay: false,
        path: 'assets/animation.json'
    });
}

function toKannadaNum(num) {
    const numStr = num.toString().padStart(2, '0');
    return numStr.split('').map(digit => kannadaDigits[parseInt(digit)]).join('');
}

// --- GSAP ENTRANCE ANIMATION (First Load) ---
function runIntroAnimation() {
    const tl = gsap.timeline({ onComplete: startAppLogic });
    const topRowElements = ['.loading-text-left', '.container', '.loading-text-right'];
    const kannadaElement = '.bottom-text';

    // Initial Setters
    gsap.set(".container", { xPercent: -50, yPercent: -50 });
    gsap.set([".loading-text-left", ".loading-text-right"], { yPercent: -50 });
    gsap.set(kannadaElement, { xPercent: -50, autoAlpha: 0, y: 50, filter: "blur(10px)" });
    gsap.set([".welcome-text", ".enter-button"], { autoAlpha: 0, y: 50, filter: "blur(10px)" });
    gsap.set("#wreath-animation", { autoAlpha: 0 });
    gsap.set("#home-screen", { autoAlpha: 0 });

    // Ensure final content is hidden from flow initially
    gsap.set(".final-sequence-content", { display: "none" });

    // Hide def group initially
    gsap.set(".def-group", { autoAlpha: 0, display: "none" });

    gsap.set(topRowElements, { autoAlpha: 0, y: 50, filter: "blur(10px)" });

    // Animation
    tl.to(topRowElements, {
        duration: 2.0,
        autoAlpha: 1,
        y: 0,
        filter: "blur(0px)",
        stagger: 0,
        ease: "expo.inOut",
        clearProps: "filter"
    })
    .to(kannadaElement, {
        duration: 2.0,
        autoAlpha: 1,
        y: 0,
        filter: "blur(0px)",
        ease: "expo.inOut",
        clearProps: "filter"
    }, "-=1.9");
}

// --- GSAP EXIT ANIMATION (Loading -> Welcome) ---
function runExitAnimation() {
    const btn = document.querySelector('.enter-button');
    btn.classList.remove('interactive');

    const tl = gsap.timeline({
        onComplete: () => {
            btn.classList.add('interactive');
            attachHoverListeners(); // Re-attach for new elements
        }
    });

    const container = document.querySelector('.container');
    const kannadaText = document.querySelector('.bottom-text');
    const leftText = document.querySelector('.loading-text-left');
    const rightText = document.querySelector('.loading-text-right');
    const welcomeText = document.querySelector('.welcome-text');
    const enterButton = document.querySelector('.enter-button');
    const finalContent = document.querySelector('.final-sequence-content');

    // 1. Prepare Layout Change
    // We reveal the final content container so Flexbox can calculate the layout.
    // However, this instantly expands the container height.
    gsap.set(finalContent, { display: "flex", autoAlpha: 1 });
    // Children are still hidden from runIntroAnimation setup, so only the space is taken.

    // 2. Calculate Centering Offset
    // Because .container is centered via yPercent: -50, adding height shifts the center point UP.
    // To keep the Logo visually stationary at the start of the animation,
    // we must push the container DOWN by half the height of the added content.
    const contentStyle = window.getComputedStyle(finalContent);
    const marginTop = parseFloat(contentStyle.marginTop);
    const addedHeight = finalContent.offsetHeight + marginTop;
    const centerShiftCorrection = addedHeight / 2;

    // Apply immediate correction to prevent jump
    gsap.set(container, { y: centerShiftCorrection });

    // Set initial state for text elements (pushed down slightly)
    gsap.set([welcomeText, enterButton], { y: 20, autoAlpha: 0 });

    const finalColor = preloadColors[lastColorIndex];
    gsap.set("#wreath-animation path", { fill: finalColor, stroke: finalColor, opacity: 1.0 });

    tl.add("exitStart")
    // Fade out loading text
    .to([leftText, rightText, kannadaText], {
        duration: 1.6,
        y: -50,
        autoAlpha: 0,
        filter: "blur(10px)",
        ease: "expo.inOut"
    }, "exitStart")

    // Animate Container to True Center (y: 0)
    // This effectively slides the whole group (Logo + Text) up until perfectly centered.
    .to(container, {
        duration: 1.6,
        y: 0,
        ease: "expo.inOut"
    }, "exitStart")

    // Reveal Text (Slide it up slightly for effect)
    .to([welcomeText, enterButton], {
        duration: 0.8,
        y: 0,
        autoAlpha: 1,
        filter: "blur(0px)",
        ease: "power2.out",
        stagger: 0,
        clearProps: "filter,transform" // Clear transform to let flow handle resizing later
    }, "exitStart+=0.7")

    .call(() => { if (wreathAnim) wreathAnim.play(); }, null, "exitStart+=0.4")
    .to("#wreath-animation", {
        duration: 1.0,
        autoAlpha: 1,
        ease: "power2.out"
    }, "exitStart+=0.4");
}

// --- HOME SCREEN TRANSITION (Welcome -> Dictionary via Morph) ---
function enterSite() {
    const btn = document.querySelector('.enter-button');
    const welcomeText = document.querySelector('.welcome-text');
    const finalContent = document.querySelector('.final-sequence-content');

    // Disable interaction
    btn.style.pointerEvents = 'none';
    btn.classList.remove('interactive');

    if (wreathAnim) {
        wreathAnim.setSpeed(3.0);
        wreathAnim.setDirection(-1);
        wreathAnim.play();
    }

    const tl = gsap.timeline();
    // UNIFIED DURATION & EASING FOR PERFECT SYNC
    const animDuration = 0.8;
    // Using expo.out for sharper, more immediate movement start
    const animEase = "expo.out";

    // TRIGGER LABEL: Everything happens at "syncStart"
    tl.add("syncStart");

    // 1. SWITCH ALIGNMENT & TEXT SWAP (Instant at Start)
    tl.call(() => {
        welcomeText.textContent = "ಕನ್ನಡಿಗ";

        // --- DYNAMIC ALIGNMENT SWITCH ---
        // 1. Align the Wrapper Items to Start (Left)
        // Since wrapper width is pinned to 88px, this creates a shelf starting at Logo Left.
        gsap.set(".main-content-wrapper", { alignItems: "flex-start" });

        // 2. Align Text Anchor & Content to Left
        gsap.set(".text-anchor", { alignItems: "flex-start" });
        gsap.set(welcomeText, { textAlign: "left" });
    }, null, "syncStart");

    // 2. Button Exit: Blur + Fade + SHRINK HEIGHT
    // By animating height to 0, we allow the container to shrink, which updates center
    tl.to(btn, {
        duration: animDuration,
        autoAlpha: 0,
        height: 0,
        margin: 0,
        padding: 0,
        borderWidth: 0,
        filter: "blur(10px)",
        ease: animEase
    }, "syncStart");

    // 3. Wreath Exit: Fade + MOVE UP
    tl.to("#wreath-animation", {
        duration: animDuration,
        autoAlpha: 0,
        y: -30,
        filter: "blur(10px)",
        ease: animEase
    }, "syncStart");

    // 4. Text Morph (Size & Position changes)
    tl.to(welcomeText, {
        duration: animDuration,
        fontSize: "32px",
        lineHeight: "1.6",
        marginBottom: "0px",
        padding: "0px",
        marginTop: "0px",
        ease: animEase
    }, "syncStart");

    // 5. Reveal Dictionary Details (Grow Height Smoothly)
    // We set display to flex immediately, but animate height from 0 to 'auto'
    tl.set(".def-group", { display: "flex", autoAlpha: 1 }, "syncStart")
      .fromTo(".def-group",
        { height: 0, marginTop: 0 },
        {
            height: "auto",
            marginTop: 20,
            duration: animDuration,
            ease: animEase
        },
        "syncStart"
      )
      .fromTo([".def-phonetic", ".def-noun", ".def-desc"],
        { autoAlpha: 0, y: 20, filter: "blur(5px)" },
        {
            duration: 0.8,
            // Functional Value to determine Opacity
            // Phonetic & Noun = 0.4, Desc = 1.0
            autoAlpha: (i, target) => {
                if (target.classList.contains('def-desc')) return 1;
                return 0.4;
            },
            y: 0,
            filter: "blur(0px)",
            stagger: 0.1,
            ease: "expo.out"
        }, "syncStart");
}

function startAppLogic() {
    startCounter();
}

function changeColorOnce() {
    let newIndex;
    do { newIndex = Math.floor(Math.random() * preloadColors.length); } while (newIndex === lastColorIndex);
    lastColorIndex = newIndex;
    logoWrapperEl.style.backgroundColor = preloadColors[newIndex];
}

function startCounter() {
    const progress = { val: 0 };
    let lastIntVal = 0;
    gsap.to(progress, {
        val: 100,
        duration: 6,
        ease: "expo.inOut",
        onUpdate: function() {
            const currentVal = Math.floor(progress.val);
            if (currentVal !== lastIntVal) {
                counterEl.textContent = toKannadaNum(currentVal);
                if (currentVal === 1 || (currentVal > 0 && currentVal % 5 === 0)) {
                    changeColorOnce();
                }
                lastIntVal = currentVal;
            }
        },
        onComplete: function() {
            runExitAnimation();
        }
    });
}

// --- INIT ---
fetch('assets/metal.svg')
    .then(response => response.text())
    .then(svgContent => {
        document.getElementById('logoWrapper').innerHTML = svgContent;
        initLottie();
        runIntroAnimation();
        if (window.initSVGLights) window.initSVGLights();
    })
    .catch(err => {
        console.error('Error loading SVG:', err);
        startAppLogic();
    });