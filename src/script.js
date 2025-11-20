/* =========================================
   CUSTOM CURSOR LOGIC (Runs Immediately)
   ========================================= */

const cursor = document.getElementById('custom-cursor');
const container = document.querySelector('.container');
const logoWrapper = document.getElementById('logoWrapper');

// --- 1. MOVEMENT ---
// We use gsap.quickTo for high-performance, smooth dragging/following
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

// Define text elements that trigger the shape change
// Added '.def-text' to the selectors
const textSelectors = '.loading-text-left, .loading-text-right, .kannada-text, .def-text, p, h1, h2, h3, h4, h5, h6, span';

// Add listeners to all matching elements
// Use event delegation or re-query if elements are dynamic,
// but since these exist in DOM (just hidden), simple querySelectorAll works.
const attachHoverListeners = () => {
    document.querySelectorAll(textSelectors).forEach(el => {
        // Prevent duplicate listeners if run multiple times
        if(el.dataset.cursorAttached) return;
        el.dataset.cursorAttached = "true";

        el.addEventListener('mouseenter', () => {
            isTextHover = true;

            // Calculate font size of the hovered text
            const style = window.getComputedStyle(el);
            const fontSize = parseFloat(style.fontSize);
            currentTextHeight = fontSize;

            // Smooth transition to Text Cursor (Bar)
            // Width 2px, Height = Font Size
            gsap.to(cursor, {
                width: 2,
                height: fontSize,
                duration: 0.3,
                ease: "expo.out"
            });
        });

        el.addEventListener('mouseleave', () => {
            isTextHover = false;

            // Smooth transition back to Default Cursor (Square)
            // 14x14
            gsap.to(cursor, {
                width: 14,
                height: 14,
                duration: 0.3,
                ease: "expo.out"
            });
        });
    });
};

// Run initially
attachHoverListeners();

// --- 3. CLICK INTERACTION ---
window.addEventListener('mousedown', () => {
    if (isTextHover) {
        // If on text: Reduce height by 2px
        gsap.to(cursor, {
            height: currentTextHeight - 2,
            duration: 0.15,
            ease: "power2.out"
        });
    } else {
        // If default: Shrink to 12x12
        gsap.to(cursor, {
            width: 12,
            height: 12,
            duration: 0.15,
            ease: "power2.out"
        });
    }
});

window.addEventListener('mouseup', () => {
    if (isTextHover) {
        // If on text: Restore to font size
        gsap.to(cursor, {
            height: currentTextHeight,
            duration: 0.15,
            ease: "power2.out"
        });
    } else {
        // If default: Restore to 14x14
        gsap.to(cursor, {
            width: 14,
            height: 14,
            duration: 0.15,
            ease: "power2.out"
        });
    }
});


/* =========================================
   SVG LIGHTING LOGIC (Called after Fetch)
   ========================================= */

window.initSVGLights = function() {
    // These elements are only available after SVG injection
    const lightSource = document.getElementById('light-source');
    const diffuseSource = document.getElementById('diffuse-source');
    const shadowFilter = document.getElementById('dynamic-shadow');
    const specularElement = document.getElementById('specular-element');

    // Original viewBox dimensions
    // These remain constant as they describe the SVG's internal coordinate system
    const vbWidth = 72;
    const vbHeight = 97;

    // --- EVENT LISTENER FOR LIGHTING ---
    window.addEventListener('mousemove', (e) => {
        // Guard clause
        if (!lightSource || !diffuseSource) return;

        // Get updated rect (This will automatically account for the new 80px width)
        const logoRect = logoWrapper.getBoundingClientRect();

        // 1. Calculate Center of the Logo
        const logoCenterX = logoRect.left + logoRect.width / 2;
        const logoCenterY = logoRect.top + logoRect.height / 2;

        // 2. Local calculations for Leather Shine
        const localX = e.clientX - logoRect.left;
        const localY = e.clientY - logoRect.top;

        logoWrapper.style.setProperty('--light-x', `${localX}px`);
        logoWrapper.style.setProperty('--light-y', `${localY}px`);

        // 3. Calculate Distance for SVG Lights
        const distX = e.clientX - logoCenterX;
        const distY = e.clientY - logoCenterY;

        const sensitivityX = (vbWidth * 3) / window.innerWidth;
        const sensitivityY = (vbHeight * 3) / window.innerHeight;

        const svgX = 36 + (distX * sensitivityX);
        const svgY = 48 + (distY * sensitivityY);

        // Update SVG Lights
        lightSource.setAttribute('x', svgX);
        lightSource.setAttribute('y', svgY);
        diffuseSource.setAttribute('x', svgX);
        diffuseSource.setAttribute('y', svgY);

        // 4. Update Drop Shadow
        const shadowX = ((logoCenterX - e.clientX) / window.innerWidth) * 8;
        const shadowY = ((logoCenterY - e.clientY) / window.innerHeight) * 8;

        shadowFilter.setAttribute('dx', shadowX);
        shadowFilter.setAttribute('dy', shadowY);

        // 5. Intensity
        const distance = Math.sqrt(distX * distX + distY * distY);
        const maxDistance = Math.sqrt(window.innerWidth ** 2 + window.innerHeight ** 2) / 1.5;
        let intensity = Math.max(0, 1 - (distance / maxDistance));

        logoWrapper.style.setProperty('--glow-opacity', intensity.toFixed(2));

        const baseSpecular = 0.9;
        const minSpecular = 0.75;
        const currentSpecular = minSpecular + (baseSpecular - minSpecular) * intensity;
        specularElement.setAttribute('specularConstant', currentSpecular.toFixed(2));
    });

    // --- RESET ON LEAVE ---
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