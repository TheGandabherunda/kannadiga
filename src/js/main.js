import SmoothScroll from './core/SmoothScroll.js';
import { Menu } from './modules/Menu.js';
import { LogoLighting } from './modules/LogoLighting.js';
import { BackgroundAnimations } from './animations/BackgroundAnimations.js';
import { toKannadaNum } from './utils/kannada-utils.js';

const preloadColors = ['#FF0000', '#FFCF03', '#00C907', '#9A00EB', '#F2059F'];

class App {
    constructor() {
        this.bgAnims = new BackgroundAnimations();
        this.lastColorIndex = 0;
        this.wreathAnim = null;
        this.init();
    }

    async init() {
        try {
            // 1. Load HTML Components
            await this.loadComponents();

            // 2. Load Assets
            const response = await fetch('assets/metal.svg');
            const svgContent = await response.text();

            const desktopWrapper = document.getElementById('logoWrapper');
            if (desktopWrapper) desktopWrapper.innerHTML = svgContent;

            const mobileWrapper = document.getElementById('mobileLogoWrapper');
            if (mobileWrapper) {
                let uniqueSvg = svgContent.replace(/id="([^"]+)"/g, 'id="mobile-$1"')
                                          .replace(/url\(#([^)]+)\)/g, 'url(#mobile-$1)')
                                          .replace(/xlink:href="#([^"]+)"/g, 'xlink:href="#mobile-$1"');
                mobileWrapper.innerHTML = uniqueSvg;
            }

            // 3. Initialize Modules
            this.initLottie();
            new Menu();
            new LogoLighting();
            this.runIntroAnimation();
            this.startCounter();

        } catch (err) {
            console.error('Error during initialization:', err);
            // Fallback to counter if something fails but we can still show progress
            this.startCounter();
        }
    }

    async loadComponents() {
        const [preloaderHtml, welcomeHtml, mainHtml] = await Promise.all([
            fetch('components/preloader.html').then(res => res.text()),
            fetch('components/welcome.html').then(res => res.text()),
            fetch('components/main.html').then(res => res.text())
        ]);

        document.getElementById('preloader-mount').innerHTML = preloaderHtml;
        document.getElementById('welcome-mount').innerHTML = welcomeHtml;

        // main.html contains both home-view and other sections
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = mainHtml;

        const homeView = tempDiv.querySelector('#home-view');
        if (homeView) {
            document.getElementById('home-mount').appendChild(homeView);
        }

        const sections = tempDiv.querySelectorAll('.scroll-section');
        const sectionsMount = document.getElementById('sections-mount');
        if (sectionsMount) {
            sections.forEach(section => {
                sectionsMount.appendChild(section);
            });
        }
    }

    initLottie() {
        this.wreathAnim = lottie.loadAnimation({
            container: document.getElementById('wreath-animation'),
            renderer: 'svg',
            loop: false,
            autoplay: false,
            path: 'assets/animation.json'
        });
    }

    runIntroAnimation() {
        this.bgAnims.initBackgroundText();
        this.bgAnims.initKannadaCircles();

        const tl = gsap.timeline();
        const topRowElements = ['.loading-text-left', '.container', '.loading-text-right'];
        const kannadaElement = '.bottom-text';

        gsap.set(".container", { xPercent: -50, yPercent: -50 });
        gsap.set([".loading-text-left", ".loading-text-right"], { yPercent: -50 });
        gsap.set(kannadaElement, { xPercent: -50, autoAlpha: 0, y: 50, filter: "blur(10px)" });
        gsap.set(["#welcome-view .welcome-text", "#welcome-view .enter-button"], { autoAlpha: 0, y: 50, filter: "blur(10px)" });
        gsap.set("#wreath-animation", { autoAlpha: 0, filter: "blur(10px)" });
        gsap.set("#home-screen", { autoAlpha: 0 });
        gsap.set("#scroll-instruction", { autoAlpha: 0, filter: "blur(10px)" });
        gsap.set('#bg-text-container', { autoAlpha: 0, filter: "blur(15px)" });
        gsap.set("#menu-trigger", { autoAlpha: 0, filter: "blur(10px)" });
        gsap.set("#bottom-nav-indicator", { autoAlpha: 0, y: 20, filter: "blur(10px)" });
        gsap.set("#welcome-view", { display: "none" });
        gsap.set("#home-view", { display: "none" });
        gsap.set(topRowElements, { autoAlpha: 0, y: 50, filter: "blur(10px)" });

        tl.to(topRowElements, {
            duration: 2.0,
            autoAlpha: 1,
            y: 0,
            filter: "blur(0px)",
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

    startCounter() {
        const progress = { val: 0 };
        const counterEl = document.getElementById('loadingCounter');
        let lastIntVal = 0;

        gsap.to(progress, {
            val: 100,
            duration: 6,
            ease: "expo.inOut",
            onUpdate: () => {
                const currentVal = Math.floor(progress.val);
                if (currentVal !== lastIntVal) {
                    if (counterEl) counterEl.textContent = toKannadaNum(currentVal);
                    if (currentVal === 1 || (currentVal > 0 && currentVal % 5 === 0)) {
                        this.changeColorOnce();
                    }
                    lastIntVal = currentVal;
                }
            },
            onComplete: () => this.runExitAnimation()
        });
    }

    changeColorOnce() {
        const logoWrapperEl = document.getElementById('logoWrapper');
        let newIndex;
        do { newIndex = Math.floor(Math.random() * preloadColors.length); } while (newIndex === this.lastColorIndex);
        this.lastColorIndex = newIndex;
        if (logoWrapperEl) logoWrapperEl.style.backgroundColor = preloadColors[newIndex];
        this.bgAnims.lastColorIndex = newIndex;
    }

    runExitAnimation() {
        const btn = document.querySelector('#welcome-view .enter-button');
        if (btn) btn.classList.remove('interactive');

        const tl = gsap.timeline({
            onComplete: () => { if (btn) btn.classList.add('interactive'); }
        });

        const container = document.querySelector('.container');
        const welcomeView = document.getElementById('welcome-view');

        if (welcomeView) {
            gsap.set(welcomeView, { display: "flex", autoAlpha: 1 });
            const centerShiftCorrection = (welcomeView.offsetHeight + parseFloat(window.getComputedStyle(welcomeView).marginTop)) / 2;
            gsap.set(container, { y: centerShiftCorrection });
        }

        tl.add("exitStart")
        .to(['.loading-text-left', '.loading-text-right', '.bottom-text'], {
            duration: 1.6, y: -50, autoAlpha: 0, filter: "blur(15px)", ease: "expo.inOut"
        }, "exitStart")
        .to('#bg-text-container', { duration: 2.5, autoAlpha: 1, filter: "blur(0px)", ease: "power2.out" }, "exitStart")
        .to(container, { duration: 1.6, y: 0, ease: "expo.inOut" }, "exitStart")
        .to(['#welcome-view .welcome-text', '#welcome-view .enter-button'], {
            duration: 1.2, y: 0, autoAlpha: 1, filter: "blur(0px)", ease: "expo.out", stagger: 0.1, clearProps: "filter,transform"
        }, "exitStart+=1.1")
        .call(() => { if (this.wreathAnim) this.wreathAnim.play(); }, null, "exitStart+=0.8")
        .to("#wreath-animation", { duration: 1.5, autoAlpha: 1, filter: "blur(0px)", ease: "expo.out" }, "exitStart+=0.8");

        if (btn) btn.onclick = () => this.enterSite();
    }

    enterSite() {
        const logoWrapper = document.getElementById('logoWrapper');
        const wreath = document.getElementById('wreath-animation');
        const welcomeView = document.getElementById('welcome-view');
        const homeMount = document.getElementById('home-mount');
        const btn = welcomeView ? welcomeView.querySelector('.enter-button') : null;

        this.bgAnims.createKannadaRings();
        this.bgAnims.kannadaRings.forEach(ring => ring.opacity = 0);

        const logoStartRect = logoWrapper.getBoundingClientRect();
        if (welcomeView) gsap.set(welcomeView, { display: "none" });

        if (homeMount) {
            gsap.set(homeMount, { display: "flex", autoAlpha: 1 });
            const actualHomeView = homeMount.querySelector('#home-view');
            if (actualHomeView) gsap.set(actualHomeView, { display: "flex", autoAlpha: 1 });

            const defGroup = homeMount.querySelector('.def-group');
            if (defGroup) gsap.set(defGroup, { autoAlpha: 1 });

            gsap.set('.home-title', { y: 20, autoAlpha: 0, filter: "blur(10px)" });
            gsap.set(['.def-phonetic', '.def-noun', '.def-desc'], { autoAlpha: 0, y: 15, filter: "blur(8px)" });
        }

        gsap.set('.main-content-wrapper', { alignItems: "flex-start" });

        const logoEndRect = logoWrapper.getBoundingClientRect();
        gsap.set(logoWrapper, { x: logoStartRect.left - logoEndRect.left, y: logoStartRect.top - logoEndRect.top });

        const tl = gsap.timeline({
            onComplete: () => {
                gsap.set(wreath, { display: "none" });
                const scroller = new SmoothScroll('scroll-track');
                // Ensure dimensions are correct after rendering everything
                setTimeout(() => scroller.updateDimensions(), 100);
            }
        });

        tl.to('#bg-text-container', { duration: 0.8, autoAlpha: 0, ease: "power2.in" }, 0);
        gsap.set('#kannada-circles-container', { autoAlpha: 1 });
        tl.to(this.bgAnims.kannadaRings, { duration: 2.0, opacity: 1, stagger: 0.1, ease: "power2.out" }, 0.5);

        if (this.wreathAnim) {
            this.wreathAnim.setDirection(-1);
            this.wreathAnim.setSpeed(0.6);
            this.wreathAnim.play();
        }

        tl.to(wreath, { duration: 0.8, autoAlpha: 0, filter: "blur(15px)", ease: "expo.in" }, 0);
        tl.to(logoWrapper, { x: 0, y: 0, duration: 1.0, ease: "expo.inOut" }, 0);

        tl.to('.home-title', { y: 0, autoAlpha: 1, filter: "blur(0px)", duration: 0.8, ease: "expo.out" }, 0.4);
        tl.to(['.def-phonetic', '.def-noun', '.def-desc'], {
            duration: 0.8,
            y: 0,
            autoAlpha: (i, t) => t.classList.contains('def-desc') ? 1 : 0.4,
            filter: "blur(0px)",
            stagger: 0.05,
            ease: "expo.out",
            clearProps: "filter"
        }, 0.5);

        tl.to(["#menu-trigger", "#scroll-instruction", "#bottom-nav-indicator"], {
            autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.6, ease: "power2.out"
        }, 1.2);
    }
}

new App();
