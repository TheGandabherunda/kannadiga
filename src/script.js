/* =========================================
   CUSTOM CURSOR LOGIC
   ========================================= */
const cursor = document.getElementById('custom-cursor');
const container = document.querySelector('.container');
const logoWrapper = document.getElementById('logoWrapper');

// --- 1. MOVEMENT ---
// Track mouse position globally
let lastMouseX = window.innerWidth / 2;
let lastMouseY = window.innerHeight / 2;

// Initial set
gsap.set(cursor, { xPercent: -50, yPercent: -50, x: lastMouseX, y: lastMouseY });

window.addEventListener('mousemove', (e) => {
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;

    // Only update position if NOT hovering a menu item
    if (!isMenuHover) {
        // We use gsap.to instead of quickTo for better compatibility with the snap animations
        gsap.to(cursor, {
            x: e.clientX,
            y: e.clientY,
            duration: 0.15,
            ease: "power3.out",
            overwrite: "auto" // Only overwrite x/y, leave width/height alone if possible
        });
    }
});

// --- 2. STATE MANAGEMENT ---
let isTextHover = false;
let isMenuHover = false;
let currentTextHeight = 0;

const textSelectors = '.loading-text-left, .loading-text-right, .bottom-text, .welcome-text, p, h1, h2, h3, h4, h5, h6, span, .def-phonetic, .def-noun, .def-desc';
const menuSelectors = '#top-nav a';

const attachHoverListeners = () => {
    // Generic Text Hover (Bar Cursor)
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
                ease: "power3.out",
                overwrite: "auto"
            });
        });
        el.addEventListener('mouseleave', () => {
            isTextHover = false;
            if(!isMenuHover) {
                gsap.to(cursor, {
                    width: 14,
                    height: 14,
                    duration: 0.3,
                    ease: "power3.out",
                    overwrite: "auto"
                });
            }
        });
    });

    // Menu Item Hover (Magnetic Background Fill + Brackets)
    document.querySelectorAll(menuSelectors).forEach(el => {
        if(el.dataset.cursorAttached) return;
        el.dataset.cursorAttached = "true";
        el.addEventListener('mouseenter', () => {
            isMenuHover = true;
            cursor.classList.add('menu-mode'); // Trigger visual change (brackets)

            const rect = el.getBoundingClientRect();

            // SNAP TO MENU ITEM
            // We use overwrite: true to ensuring we kill any mouse-following momentum immediately
            gsap.to(cursor, {
                width: rect.width + 12,
                height: rect.height + 4,
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2,
                borderRadius: 0,
                duration: 0.4,
                ease: "power3.out",
                overwrite: true
            });
        });

        el.addEventListener('mouseleave', () => {
            isMenuHover = false;
            cursor.classList.remove('menu-mode'); // Revert visual change

            // 1. Reset SHAPE (Size)
            gsap.to(cursor, {
                width: 14,
                height: 14,
                borderRadius: 0,
                duration: 0.3,
                ease: "power2.out",
                overwrite: "auto"
            });

            // 2. Reset POSITION (Return to Mouse)
            // We explicitly fire this to bridge the gap between mouseleave and the next mousemove
            gsap.to(cursor, {
                x: lastMouseX,
                y: lastMouseY,
                duration: 0.15,
                ease: "power3.out",
                overwrite: "auto"
            });
        });
    });
};

attachHoverListeners();

// --- 3. CLICK INTERACTION ---
window.addEventListener('mousedown', () => {
    if (isTextHover) {
        gsap.to(cursor, { height: currentTextHeight - 2, duration: 0.15, ease: "power2.out", overwrite: "auto" });
    } else if (isMenuHover) {
        gsap.to(cursor, { scale: 0.9, duration: 0.15, ease: "power2.out", overwrite: "auto" });
    } else {
        gsap.to(cursor, { width: 12, height: 12, duration: 0.15, ease: "power2.out", overwrite: "auto" });
    }
});

window.addEventListener('mouseup', () => {
    if (isTextHover) {
        gsap.to(cursor, { height: currentTextHeight, duration: 0.15, ease: "power2.out", overwrite: "auto" });
    } else if (isMenuHover) {
        gsap.to(cursor, { scale: 1.0, duration: 0.15, ease: "power2.out", overwrite: "auto" });
    } else {
        gsap.to(cursor, { width: 14, height: 14, duration: 0.15, ease: "power2.out", overwrite: "auto" });
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
    gsap.set("#scroll-instruction", { autoAlpha: 0, filter: "blur(10px)" }); // Ensure instruction is hidden

    // Ensure Top Nav & Bottom Nav are hidden initially
    gsap.set("#top-nav", { autoAlpha: 0, y: -20, filter: "blur(10px)" });
    gsap.set("#bottom-nav-indicator", { autoAlpha: 0, y: 20, filter: "blur(10px)" });

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
    const tl = gsap.timeline({
        onComplete: () => {
            textClone.remove();
            btnClone.remove();
            gsap.set(wreath, { display: "none" });

            // --- TRIGGER HORIZONTAL SCROLL HERE ---
            enableSmoothScroll();

             // --- SYNCED APPEARANCE ---
             gsap.to(["#top-nav", "#scroll-instruction", "#bottom-nav-indicator"], {
                autoAlpha: 1,
                y: 0,
                filter: "blur(0px)",
                duration: 0.8,
                ease: "power2.out"
            });

            // Re-attach hover for the new menu items
            attachHoverListeners();
        }
    });

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
}

/* =========================================
   HORIZONTAL SCROLL & DRAG PHYSICS
   ========================================= */
class SmoothScroll {
    constructor(trackId) {
        this.track = document.getElementById(trackId);
        this.current = 0;
        this.target = 0;
        this.maxScroll = 0;

        // Interaction Flags
        this.isDragging = false;
        this.isWheeling = false;
        this.isAutoScrolling = false; // New flag for click animation
        this.wheelTimeout = null;

        // Instruction visibility flag
        this.isInstructionHidden = false;

        this.startX = 0;
        this.dragStartScroll = 0;
        this.rafId = null;

        // Physics Params
        this.friction = 0.08; // Inertia for the actual scroll (current following target)
        this.springFactor = 0.2;
        this.dragSpeed = 1.5;
        this.elasticity = 0.2;

        // Nav Logic
        this.navLines = [];
        this.navLabel = document.getElementById('nav-label');
        this.navContainer = document.getElementById('nav-lines');
        this.sections = Array.from(document.querySelectorAll('.scroll-section'));

        // Tracks hover state for the Nav
        this.navState = {
            hoveredIndex: -1,
            isHovering: false
        };

        this.init();
        this.initBottomNav();
    }

    updateDimensions() {
        this.maxScroll = this.track.scrollWidth - window.innerWidth;
    }

    // --- BOTTOM NAVIGATION LOGIC ---
    initBottomNav() {
        if (!this.navContainer) return;
        this.navContainer.innerHTML = '';

        this.sections.forEach((section, index) => {
            const line = document.createElement('div');
            line.classList.add('nav-line');

            // Interaction: Mouse Enter
            line.addEventListener('mouseenter', () => {
                this.navState.isHovering = true;
                this.navState.hoveredIndex = index;
                this.updateNavLabel(index, true); // Fade in label
            });

            // Interaction: Mouse Leave
            this.navContainer.addEventListener('mouseleave', () => {
                 this.navState.isHovering = false;
                 this.navState.hoveredIndex = -1;
                 this.updateNavLabel(-1, false); // Fade out label
            });

            // Interaction: Click to Scroll
            line.addEventListener('mousedown', (e) => {
                // STOP PROPAGATION so the drag logic doesn't fire
                e.stopPropagation();

                // Calculate center of the target section
                const targetX = section.offsetLeft + (section.offsetWidth / 2) - (window.innerWidth / 2);

                // Clamp target
                let clampedTarget = Math.max(0, Math.min(targetX, this.maxScroll));

                // TRIGGER AUTO SCROLL ANIMATION
                this.isAutoScrolling = true;

                // Animate both target and current so physics don't fight it
                gsap.to(this, {
                    current: clampedTarget,
                    target: clampedTarget,
                    duration: 2.5, // Increased duration for smoother slow scroll
                    ease: "expo.out",
                    onComplete: () => {
                        this.isAutoScrolling = false;
                    }
                });
            });

            this.navContainer.appendChild(line);
            this.navLines.push(line);
        });
    }

    updateNavLabel(index, isVisible) {
        if (isVisible && index >= 0) {
            const name = this.sections[index].getAttribute('data-nav-name') || "Section " + (index + 1);
            this.navLabel.textContent = name;
            this.navLabel.style.opacity = '1';
            this.navLabel.style.transform = 'translateY(0)';
        } else {
            this.navLabel.style.opacity = '0';
            this.navLabel.style.transform = 'translateY(4px)';
        }
    }

    // Run every frame to animate lines
    updateNavVisuals() {
        const viewportCenter = window.innerWidth / 2;

        this.navLines.forEach((line, index) => {
            let targetHeight = 20;
            let targetOpacity = 0.1;

            // --- LOGIC BRANCH: HOVER vs SCROLL ---

            if (this.navState.isHovering) {
                // MOUSE INTERACTION MODE
                const dist = Math.abs(index - this.navState.hoveredIndex);

                if (dist === 0) {
                    targetHeight = 32;
                    targetOpacity = 1.0;
                } else if (dist === 1) {
                    targetHeight = 24;
                    targetOpacity = 0.3;
                }
                // Others remain default

            } else {
                // SCROLL SYNC MODE

                // 1. Get Geometry
                const sectionLeft = this.sections[index].offsetLeft;
                const sectionWidth = this.sections[index].offsetWidth;
                const sectionCenter = sectionLeft + (sectionWidth / 2);

                // 2. Calculate Distance
                // visualCenter is where the section is on screen right now
                const visualCenter = sectionCenter - this.current;

                // absolute distance from center of screen in pixels
                const dist = Math.abs(visualCenter - viewportCenter);

                // 3. Convert to "Unit Distance" (1 unit = 1 screen width)
                // This makes the math responsive
                const distRatio = dist / window.innerWidth;

                // 4. Gaussian Function for Organic Falloff
                // We tune 'k' to match the specific "Neighbor = 24px" requirement
                // k = 1.1 ensures that at distRatio = 1.0 (neighbor), result is ~0.33
                // UPDATED: User requested neighbors (at ~0.6 distRatio for 60vw sections) to be max 24px.
                // At distRatio 0.6, we want activation ~0.33 (which maps to 24px).
                // exp(-k * 0.6^2) = 0.33 => -k*0.36 = -1.1 => k ≈ 3.05
                const k = 3.0;
                let activation = Math.exp(-k * Math.pow(distRatio, 2));

                // 5. EDGE CASE HANDLING (Sticky Ends)
                // If first section is near/past center to right, keep fully active
                if (index === 0 && visualCenter > viewportCenter) {
                    activation = 1.0;
                }
                // If last section is near/past center to left, keep fully active
                else if (index === this.sections.length - 1 && visualCenter < viewportCenter) {
                    activation = 1.0;
                }

                // 6. Map Activation (0 to 1) to Visual Properties

                // Height: Base 20px -> Max 32px (Range 12px)
                // Neighbor (0.33 activation) gets ~24px
                targetHeight = 20 + (12 * activation);

                // Opacity: Base 0.1 -> Max 1.0 (Range 0.9)
                // We power the activation slightly to make opacity drop faster than height
                // Neighbor (0.33^1.5 ≈ 0.19) -> 0.1 + (0.9 * 0.19) ≈ 0.27 (Close to 30%)
                targetOpacity = 0.1 + (0.9 * Math.pow(activation, 1.5));
            }

            // Apply styles using simple LERP for smoothness (optional, or direct set)
            // Since this runs in RAF, direct set is usually fine, but let's LERP for ultra smooth
            const currentH = parseFloat(line.style.height) || 20;
            const currentO = parseFloat(line.style.opacity) || 0.1;

            const lerp = (start, end, amt) => (1 - amt) * start + amt * end;

            // Higher interpolation factor for hover for snappiness, lower for scroll
            const speed = this.navState.isHovering ? 0.2 : 0.1;

            line.style.height = `${lerp(currentH, targetHeight, speed)}px`;
            line.style.opacity = lerp(currentO, targetOpacity, speed);
        });
    }

    init() {
        this.updateDimensions();
        window.addEventListener('resize', () => this.updateDimensions());

        // Wheel Event
        window.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });

        // Drag Events
        window.addEventListener('mousedown', (e) => this.onDown(e));
        window.addEventListener('touchstart', (e) => this.onDown(e.touches[0]), { passive: false });

        window.addEventListener('mousemove', (e) => this.onMove(e));
        window.addEventListener('touchmove', (e) => this.onMove(e.touches[0]), { passive: false });

        window.addEventListener('mouseup', () => this.onUp());
        window.addEventListener('touchend', () => this.onUp());

        // Start Loop
        this.animate();
    }

    onWheel(e) {
        // Stop any active auto-scroll animations immediately for responsiveness
        if (this.isAutoScrolling) {
            gsap.killTweensOf(this);
            this.isAutoScrolling = false;
        }

        let delta = e.deltaY;

        // 1. Apply Resistance if out of bounds (Elasticity)
        if (this.target < 0 || this.target > this.maxScroll) {
            delta *= this.elasticity;
        }

        this.target += delta;

        // 2. Manage Wheeling State for Snap Back
        this.isWheeling = true;
        if (this.wheelTimeout) clearTimeout(this.wheelTimeout);

        this.wheelTimeout = setTimeout(() => {
            this.isWheeling = false;
        }, 100); // Wait for scroll to stop before snapping back
    }

    onDown(e) {
        // Stop any active auto-scroll animations immediately for responsiveness
        if (this.isAutoScrolling) {
            gsap.killTweensOf(this);
            this.isAutoScrolling = false;
        }

        this.isDragging = true;
        this.startX = e.clientX;
        this.dragStartScroll = this.target;
        this.track.style.cursor = 'grabbing';
    }

    onMove(e) {
        if (!this.isDragging) return;

        const delta = (e.clientX - this.startX) * this.dragSpeed;
        this.target = this.dragStartScroll - delta;

        // Apply elasticity if out of bounds
        if (this.target < 0) {
            this.target = this.target * this.elasticity;
        } else if (this.target > this.maxScroll) {
            const extra = this.target - this.maxScroll;
            this.target = this.maxScroll + (extra * this.elasticity);
        }
    }

    onUp() {
        this.isDragging = false;
        this.track.style.cursor = 'grab';

        // Snap logic is handled in animate() now to unify wheel/drag release
    }

    animate() {
        // 1. Snap Target Back to Bounds if not interacting
        if (!this.isDragging && !this.isWheeling && !this.isAutoScrolling) {
             if (this.target < 0) {
                 this.target += (0 - this.target) * this.springFactor;
                 if (Math.abs(this.target) < 0.1) this.target = 0;
             } else if (this.target > this.maxScroll) {
                 this.target += (this.maxScroll - this.target) * this.springFactor;
                 if (Math.abs(this.target - this.maxScroll) < 0.1) this.target = this.maxScroll;
             }
        }

        // 2. Interpolate Current towards Target (Momentum)
        // ONLY if not auto-scrolling. If auto-scrolling, GSAP handles this.current directly.
        if (!this.isAutoScrolling) {
            this.current += (this.target - this.current) * this.friction;
        }

        // Optimization: Snap current to target if very close (only if target is settled)
        if (Math.abs(this.target - this.current) < 0.05 && !this.isDragging && !this.isWheeling && !this.isAutoScrolling) {
            this.current = this.target;
        }

        // 3. Instruction Text Logic (Hide on Scroll)
        // Threshold: 50 pixels scrolled
        if (this.current > 50 && !this.isInstructionHidden) {
            this.isInstructionHidden = true;
            gsap.to("#scroll-instruction", {
                autoAlpha: 0,
                filter: "blur(10px)",
                duration: 0.5,
                ease: "power2.out"
            });
        } else if (this.current <= 50 && this.isInstructionHidden) {
            this.isInstructionHidden = false;
            gsap.to("#scroll-instruction", {
                autoAlpha: 1,
                filter: "blur(0px)",
                duration: 0.5,
                ease: "power2.out"
            });
        }

        // 4. Update Bottom Navigation (Physics)
        this.updateNavVisuals();

        // 5. Apply Transform
        this.track.style.transform = `translate3d(${-this.current}px, 0, 0)`;

        this.rafId = requestAnimationFrame(() => this.animate());
    }
}

function enableSmoothScroll() {
    // Initialize the smooth scroll class
    // We add a small delay to ensure DOM is settled
    setTimeout(() => {
        new SmoothScroll('scroll-track');
    }, 100);
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
        // 1. Inject Standard Logo
        const desktopWrapper = document.getElementById('logoWrapper');
        if (desktopWrapper) {
            desktopWrapper.innerHTML = svgContent;
        }

        // 2. Inject Mobile Logo with Unique IDs
        const mobileWrapper = document.getElementById('mobileLogoWrapper');
        if (mobileWrapper) {
            // Uniquify IDs to prevent clashes with the desktop SVG
            let uniqueSvg = svgContent;

            // Replace IDs (e.g., id="gradient" -> id="mobile-gradient")
            uniqueSvg = uniqueSvg.replace(/id="([^"]+)"/g, 'id="mobile-$1"');

            // Replace References (e.g., url(#gradient) -> url(#mobile-gradient))
            uniqueSvg = uniqueSvg.replace(/url\(#([^)]+)\)/g, 'url(#mobile-$1)');
            uniqueSvg = uniqueSvg.replace(/xlink:href="#([^"]+)"/g, 'xlink:href="#mobile-$1"');

            mobileWrapper.innerHTML = uniqueSvg;
        }

        initLottie();
        runIntroAnimation();
        if (window.initSVGLights) window.initSVGLights();
    })
    .catch(err => {
        console.error('Error loading SVG:', err);
        startAppLogic();
    });