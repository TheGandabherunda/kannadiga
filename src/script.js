/* =========================================
   MENU OVERLAY LOGIC (NEW)
   ========================================= */
const trigger = document.getElementById('menu-trigger');
const overlay = document.getElementById('menu-overlay');
const links = document.querySelectorAll('.overlay-nav a');
let isMenuOpen = false;

if (trigger) {
    trigger.addEventListener('click', () => {
        isMenuOpen = !isMenuOpen;

        // Increased duration for a more luxurious, smooth feel
        const animDuration = 0.85;
        // Changed from expo (sharp) to power3 (silky/smooth)
        const syncEase = "power3.inOut";

        // Kill any running animations to prevent conflicts if clicked rapidly
        gsap.killTweensOf([overlay, links, '#menu-trigger svg']);

        if (isMenuOpen) {
            // --- OPEN SEQUENCE (TIMELINE) ---
            const tl = gsap.timeline();

            overlay.style.pointerEvents = 'auto';

            // 1. Overlay Fade In
            tl.to(overlay, {
                autoAlpha: 1,
                duration: animDuration,
                ease: syncEase
            }, 0); // Start at time 0

            // 2. Icon Rotation (+ to x)
            // Using same ease as links to stay perfectly in sync
            tl.to('#menu-trigger svg', {
                rotation: 45,
                duration: animDuration,
                ease: syncEase
            }, 0); // Start at time 0 (Synced)

            // 3. Links Slide In
            tl.to(links, {
                autoAlpha: 1,
                y: 0,
                // Slightly looser stagger for a fluid wave effect
                stagger: 0.05,
                duration: animDuration,
                ease: syncEase
            }, 0); // Start at time 0 (Synced)

        } else {
            // --- CLOSE SEQUENCE (TIMELINE) ---
            const tl = gsap.timeline();

            // 1. Links Slide Out (Reverse Stagger)
            tl.to(links, {
                autoAlpha: 0,
                y: 20, // Move back down to original position
                stagger: {
                    each: 0.05,
                    from: "end" // Bottom to top
                },
                duration: animDuration,
                ease: syncEase
            }, 0); // Start at time 0

            // 2. Icon Rotation Back (x to +)
            tl.to('#menu-trigger svg', {
                rotation: 0,
                duration: animDuration,
                ease: syncEase
            }, 0); // Start at time 0

            // 3. Overlay Fade Out
            tl.to(overlay, {
                autoAlpha: 0,
                duration: animDuration,
                ease: syncEase
            }, 0); // Start at time 0

            overlay.style.pointerEvents = 'none';
        }
    });
}


/* =========================================
   SVG LIGHTING LOGIC (RESTRICTED TO VIEWPORT)
   ========================================= */
window.initSVGLights = function() {
    const lightSource = document.getElementById('light-source');
    const diffuseSource = document.getElementById('diffuse-source');
    const shadowFilter = document.getElementById('dynamic-shadow');
    const specularElement = document.getElementById('specular-element');
    const logoWrapper = document.getElementById('logoWrapper');

    const vbWidth = 72;
    const vbHeight = 97;

    window.addEventListener('mousemove', (e) => {
        if (!lightSource || !diffuseSource) return;

        // --- NEW: Restrict to Home Section Viewport ---
        const homeSection = document.querySelector('.home-section');
        if (homeSection) {
            const rect = homeSection.getBoundingClientRect();
            // Logic: If home section is fully scrolled out to the left (rect.right <= 0)
            // or fully out to the right (rect.left >= window.innerWidth), disable effect.
            if (rect.right <= 0 || rect.left >= window.innerWidth) {
                // Reset lights to default "off" state
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
                return; // Stop execution
            }
        }
        // ----------------------------------------------

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
    gsap.set("#wreath-animation", { autoAlpha: 0, filter: "blur(10px)" });
    gsap.set("#home-screen", { autoAlpha: 0 });
    gsap.set("#scroll-instruction", { autoAlpha: 0, filter: "blur(10px)" });

    // Ensure Top Nav (now just the trigger) & Bottom Nav are hidden initially
    gsap.set("#menu-trigger", { autoAlpha: 0, filter: "blur(10px)" });
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
        filter: "blur(15px)",
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
             // Changed: #top-nav is now #menu-trigger
             gsap.to(["#menu-trigger", "#scroll-instruction", "#bottom-nav-indicator"], {
                autoAlpha: 1,
                y: 0,
                filter: "blur(0px)",
                duration: 0.8,
                ease: "power2.out"
            });
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
        filter: "blur(15px)",
        ease: "expo.in"
    }, 0);

    // TEXT CLONE: Fade & Blur Out
    tl.to(textClone, {
        duration: 0.8,
        y: -40,
        autoAlpha: 0,
        filter: "blur(15px)",
        ease: "expo.in"
    }, 0);

    // BUTTON CLONE: Fade & Blur Out
    tl.to(btnClone, {
        duration: 0.8,
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
        this.isAutoScrolling = false;
        this.wheelTimeout = null;

        // Instruction visibility flag
        this.isInstructionHidden = false;

        this.startX = 0;
        this.dragStartScroll = 0;
        this.rafId = null;

        // Physics Params
        this.friction = 0.08;
        this.springFactor = 0.2;
        this.dragSpeed = 1.5;
        this.elasticity = 0.2;

        // Nav Logic
        this.navLines = [];
        this.navLabel = document.getElementById('nav-label');
        this.navContainer = document.getElementById('nav-lines');
        this.navIndicator = document.getElementById('bottom-nav-indicator');
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

        // Remove gap from container to handle spacing via wrappers
        // effectively maximizing the hit area between items.
        this.navContainer.style.gap = '0px';

        // Select elements to dim
        const elementsToDim = "#scroll-viewport, #menu-trigger, #home-screen";

        // IMPORTANT: We moved the dimming listeners FROM the container TO the wrappers
        // to ensure empty padding space in the container does not trigger the effect.

        this.sections.forEach((section, index) => {
            // 1. Create Wrapper (Hit Area)
            // This element creates a larger invisible target around the stick
            const wrapper = document.createElement('div');
            wrapper.classList.add('nav-line-wrapper');

            // Style wrapper to fill the gap space (12px total width per item)
            // and full height of the container (32px).
            wrapper.style.width = '12px';
            wrapper.style.height = '100%';
            wrapper.style.display = 'flex';
            wrapper.style.alignItems = 'flex-end';
            wrapper.style.justifyContent = 'center';
            wrapper.style.cursor = 'pointer';
            wrapper.style.position = 'relative';

            // 2. Create Visual Line
            const line = document.createElement('div');
            line.classList.add('nav-line');
            // Remove pointer events from the visual line so it doesn't
            // interfere with the wrapper's mouse events
            line.style.pointerEvents = 'none';

            // Interaction: Mouse Enter (on Wrapper)
            wrapper.addEventListener('mouseenter', () => {
                this.navState.isHovering = true;
                this.navState.hoveredIndex = index;
                this.updateNavLabel(index, true);

                // --- NEW: Trigger Global Dimming here ---
                gsap.to(elementsToDim, {
                    opacity: 0.1,
                    filter: "blur(4px)",
                    duration: 0.5,
                    ease: "power2.out",
                    overwrite: "auto"
                });
            });

            // Interaction: Mouse Leave (on Wrapper)
            wrapper.addEventListener('mouseleave', (e) => {
                 this.navState.isHovering = false;
                 this.navState.hoveredIndex = -1;
                 this.updateNavLabel(-1, false);

                 // --- NEW: Restore Global Dimming (Smart Check) ---
                 // If we are moving directly into another wrapper (gapless), do NOT restore yet.
                 // This prevents flickering.
                 if (e.relatedTarget && e.relatedTarget.closest('.nav-line-wrapper')) {
                     return;
                 }

                 gsap.to(elementsToDim, {
                    opacity: 1,
                    filter: "blur(0px)",
                    duration: 0.5,
                    ease: "power2.out",
                    overwrite: "auto"
                });
            });

            // Interaction: Click to Scroll (on Wrapper)
            wrapper.addEventListener('mousedown', (e) => {
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
                    duration: 2.5,
                    ease: "expo.out",
                    onComplete: () => {
                        this.isAutoScrolling = false;
                    }
                });
            });

            wrapper.appendChild(line);
            this.navContainer.appendChild(wrapper);
            this.navLines.push(line); // We still animate the visual line
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

            } else {
                // SCROLL SYNC MODE

                // 1. Get Geometry
                const sectionLeft = this.sections[index].offsetLeft;
                const sectionWidth = this.sections[index].offsetWidth;
                const sectionCenter = sectionLeft + (sectionWidth / 2);

                // 2. Calculate Distance
                const visualCenter = sectionCenter - this.current;
                const dist = Math.abs(visualCenter - viewportCenter);

                // 3. Convert to "Unit Distance" (1 unit = 1 screen width)
                const distRatio = dist / window.innerWidth;

                // 4. Gaussian Function for Organic Falloff
                const k = 3.0;
                let activation = Math.exp(-k * Math.pow(distRatio, 2));

                // 5. EDGE CASE HANDLING (Sticky Ends)
                if (index === 0 && visualCenter > viewportCenter) {
                    activation = 1.0;
                }
                else if (index === this.sections.length - 1 && visualCenter < viewportCenter) {
                    activation = 1.0;
                }

                // 6. Map Activation (0 to 1) to Visual Properties
                targetHeight = 20;
                targetOpacity = 0.1 + (0.9 * Math.pow(activation, 1.5));
            }

            // Apply styles using simple LERP for smoothness
            const currentH = parseFloat(line.style.height) || 20;
            const currentO = parseFloat(line.style.opacity) || 0.1;

            const lerp = (start, end, amt) => (1 - amt) * start + amt * end;

            // Higher interpolation factor for hover for snappiness, lower for scroll
            const speed = this.navState.isHovering ? 0.2 : 0.1;

            line.style.height = `${lerp(currentH, targetHeight, speed)}px`;
            line.style.opacity = lerp(currentO, targetOpacity, speed);
        });

        // --- SQUEEZE NAV INDICATOR ON OVERSCROLL ---
        if (this.navIndicator) {
             let scale = 1.0;
             const squeezeFactor = 0.0005;

             if (this.current < 0) {
                 scale = Math.max(0.9, 1 - (Math.abs(this.current) * squeezeFactor));
             } else if (this.current > this.maxScroll) {
                 scale = Math.max(0.9, 1 - ((this.current - this.maxScroll) * squeezeFactor));
             }

             this.navIndicator.style.transform = `translateX(-50%) scale(${scale})`;
        }
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
        if (this.isAutoScrolling) {
            gsap.killTweensOf(this);
            this.isAutoScrolling = false;
        }

        let delta = e.deltaY;

        if (this.target < 0 || this.target > this.maxScroll) {
            delta *= this.elasticity;
        }

        this.target += delta;

        this.isWheeling = true;
        if (this.wheelTimeout) clearTimeout(this.wheelTimeout);

        this.wheelTimeout = setTimeout(() => {
            this.isWheeling = false;
        }, 100);
    }

    onDown(e) {
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
        if (!this.isAutoScrolling) {
            this.current += (this.target - this.current) * this.friction;
        }

        // Optimization
        if (Math.abs(this.target - this.current) < 0.05 && !this.isDragging && !this.isWheeling && !this.isAutoScrolling) {
            this.current = this.target;
        }

        // 3. Instruction Text Logic (Hide on Scroll)
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
        const desktopWrapper = document.getElementById('logoWrapper');
        if (desktopWrapper) {
            desktopWrapper.innerHTML = svgContent;
        }

        const mobileWrapper = document.getElementById('mobileLogoWrapper');
        if (mobileWrapper) {
            let uniqueSvg = svgContent;
            uniqueSvg = uniqueSvg.replace(/id="([^"]+)"/g, 'id="mobile-$1"');
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