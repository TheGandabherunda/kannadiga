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

    // Initial Setters: All elements start fuzzy (blur) and hidden
    gsap.set(".container", { xPercent: -50, yPercent: -50 });
    gsap.set([".loading-text-left", ".loading-text-right"], { yPercent: -50 });
    gsap.set(kannadaElement, { xPercent: -50, autoAlpha: 0, y: 50, filter: "blur(10px)" });
    gsap.set([".welcome-text", ".enter-button"], { autoAlpha: 0, y: 50, filter: "blur(10px)" });
    gsap.set("#wreath-animation", { autoAlpha: 0, filter: "blur(10px)" }); // Set wreath initial blur
    gsap.set("#home-screen", { autoAlpha: 0 });

    // Ensure final content is hidden from flow initially
    gsap.set(".final-sequence-content", { display: "none" });

    // Hide def group initially
    gsap.set(".def-group", { autoAlpha: 0, display: "none" });

    gsap.set(topRowElements, { autoAlpha: 0, y: 50, filter: "blur(10px)" });

    // Animation: Fade in + Unblur
    tl.to(topRowElements, {
        duration: 2.0,
        autoAlpha: 1,
        y: 0,
        filter: "blur(0px)",
        stagger: 0,
        ease: "expo.inOut",
        clearProps: "filter" // Clear for sharpness after anim
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
    gsap.set(finalContent, { display: "flex", autoAlpha: 1 });

    // 2. Calculate Centering Offset
    const contentStyle = window.getComputedStyle(finalContent);
    const marginTop = parseFloat(contentStyle.marginTop);
    const addedHeight = finalContent.offsetHeight + marginTop;
    const centerShiftCorrection = addedHeight / 2;

    // Apply immediate correction
    gsap.set(container, { y: centerShiftCorrection });

    // Set initial state for text elements (Blurred)
    gsap.set([welcomeText, enterButton], { y: 20, autoAlpha: 0, filter: "blur(10px)" });
    // Set initial state for Wreath (Blurred)
    gsap.set("#wreath-animation", { autoAlpha: 0, filter: "blur(10px)" });

    const finalColor = preloadColors[lastColorIndex];
    gsap.set("#wreath-animation path", { fill: finalColor, stroke: finalColor, opacity: 1.0 });

    tl.add("exitStart")
    // EXIT OLD ELEMENTS: Blur Out
    .to([leftText, rightText, kannadaText], {
        duration: 1.6,
        y: -50,
        autoAlpha: 0,
        filter: "blur(15px)", // Increased blur for exit
        ease: "expo.inOut"
    }, "exitStart")

    .to(container, {
        duration: 1.6,
        y: 0,
        ease: "expo.inOut"
    }, "exitStart")

    // ENTER NEW TEXT: Unblur In
    .to([welcomeText, enterButton], {
        duration: 1.2,
        y: 0,
        autoAlpha: 1,
        filter: "blur(0px)",
        ease: "expo.out",
        stagger: 0.1,
        clearProps: "filter,transform"
    }, "exitStart+=0.7")

    .call(() => { if (wreathAnim) wreathAnim.play(); }, null, "exitStart+=0.4")

    // ENTER WREATH: Unblur In
    .to("#wreath-animation", {
        duration: 1.5,
        autoAlpha: 1,
        filter: "blur(0px)",
        ease: "expo.out"
    }, "exitStart+=0.4");
}

// --- HOME SCREEN TRANSITION (Welcome -> Dictionary via FLIP & Crossfade) ---
function enterSite() {
    // 1. SELECT ELEMENTS
    const logoWrapper = document.getElementById('logoWrapper');
    const welcomeText = document.querySelector('.welcome-text');
    const btn = document.querySelector('.enter-button');
    const wreath = document.getElementById('wreath-animation');
    const defGroup = document.querySelector('.def-group');
    const mainWrapper = document.querySelector('.main-content-wrapper');
    const textAnchor = document.querySelector('.text-anchor');

    // Disable button interaction
    btn.style.pointerEvents = 'none';
    btn.classList.remove('interactive');

    // 2. CREATE CLONES FOR SMOOTH EXIT (VISUAL SNAPSHOTS)
    const textRect = welcomeText.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();

    const textClone = welcomeText.cloneNode(true);
    const btnClone = btn.cloneNode(true);

    // Remove ID to avoid duplicates
    textClone.removeAttribute('id');
    btnClone.removeAttribute('id');
    btnClone.classList.remove('interactive');

    // Helper: Position clones exactly where elements are visually on screen
    const setFixedStyles = (clone, rect, original) => {
        const compStyle = window.getComputedStyle(original);

        clone.style.position = 'fixed';
        clone.style.top = rect.top + 'px';
        clone.style.left = rect.left + 'px';
        clone.style.width = rect.width + 'px';
        clone.style.height = rect.height + 'px';
        clone.style.margin = '0';
        clone.style.transform = 'none';
        clone.style.pointerEvents = 'none';
        clone.style.zIndex = '50';

        // Preserve crucial text alignment props
        clone.style.textAlign = compStyle.textAlign;
        clone.style.display = compStyle.display;
        clone.style.alignItems = compStyle.alignItems;
        clone.style.justifyContent = compStyle.justifyContent;
        clone.style.fontFamily = compStyle.fontFamily;
        clone.style.fontSize = compStyle.fontSize;

        document.body.appendChild(clone);
    };

    setFixedStyles(textClone, textRect, welcomeText);
    setFixedStyles(btnClone, btnRect, btn);

    // 3. CAPTURE INITIAL STATE OF LOGO (For FLIP)
    const logoStartRect = logoWrapper.getBoundingClientRect();

    // 4. CHANGE STATE (Hide originals, Update Layout)
    gsap.set([welcomeText, btn], { autoAlpha: 0 });
    gsap.set(btn, { display: "none" });

    // Change Content
    welcomeText.innerHTML = "ಕನ್ನಡಿಗ";

    // Change Layout to Left Aligned
    gsap.set(mainWrapper, { alignItems: "flex-start" });
    gsap.set(textAnchor, { alignItems: "flex-start" });
    gsap.set(welcomeText, { textAlign: "left", fontSize: "32px", margin: "0", padding: "0" });

    // Show Definitions
    gsap.set(defGroup, { display: "flex", autoAlpha: 1, marginTop: "20px" });

    // 5. CAPTURE FINAL STATE OF LOGO
    const logoEndRect = logoWrapper.getBoundingClientRect();

    // 6. CALCULATE FLIP DELTAS
    const deltaX = logoStartRect.left - logoEndRect.left;
    const deltaY = logoStartRect.top - logoEndRect.top;

    // 7. SET INITIAL POSITIONS (Invert)
    gsap.set(logoWrapper, { x: deltaX, y: deltaY });

    // Prepare New Elements (Blurred & Hidden)
    gsap.set(welcomeText, { y: 20, x: 0, autoAlpha: 0, filter: "blur(10px)" });
    gsap.set([".def-phonetic", ".def-noun", ".def-desc"], { autoAlpha: 0, y: 15, filter: "blur(8px)" });

    // 8. ANIMATE (Play)
    const tl = gsap.timeline();

    // --- PHASE 1: EXITING ELEMENTS ---

    // WREATH: Reverse immediately
    if (wreathAnim) {
        wreathAnim.setDirection(-1);
        wreathAnim.setSpeed(0.6);
        wreathAnim.play();
    }

    // WREATH: Fade Out & Blur INSTANTLY
    tl.to(wreath, {
        duration: 0.8,
        autoAlpha: 0,
        filter: "blur(15px)", // Heavy blur for exit
        ease: "expo.in"
    }, 0);

    // TEXT CLONE: Fade & Blur Out
    tl.to(textClone, {
        duration: 0.8, // MATCHED TO WREATH (Was 0.6)
        y: -40,
        autoAlpha: 0,
        filter: "blur(15px)",
        ease: "expo.in"
    }, 0);

    // BUTTON CLONE: Fade & Blur Out
    tl.to(btnClone, {
        duration: 0.8, // MATCHED TO WREATH (Was 0.6)
        y: 30,
        autoAlpha: 0,
        scale: 0.9,
        filter: "blur(15px)",
        ease: "expo.in"
    }, 0);

    // --- PHASE 2: MOVING ELEMENTS ---

    // LOGO: Slide to new position
    tl.to(logoWrapper, {
        x: 0,
        y: 0,
        duration: 1.0,
        ease: "expo.inOut"
    }, 0);

    // --- PHASE 3: ENTERING ELEMENTS ---
    // Start slightly after logo moves

    // NEW TEXT (Title): Slide Up & Unblur
    tl.to(welcomeText, {
        y: 0,
        autoAlpha: 1,
        filter: "blur(0px)",
        duration: 1.0,
        ease: "expo.out"
    }, 0.6);

    // DEFS: Cascade In & Unblur
    tl.to([".def-phonetic", ".def-noun", ".def-desc"], {
            duration: 1.0,
            y: 0,
            autoAlpha: (i, t) => t.classList.contains('def-desc') ? 1 : 0.4,
            filter: "blur(0px)",
            stagger: 0.08,
            ease: "expo.out"
        },
        0.8
    );

    // 9. CLEANUP
    tl.call(() => {
        textClone.remove();
        btnClone.remove();
        gsap.set(wreath, { display: "none" });
    });
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