export class Menu {
    constructor() {
        this.trigger = document.getElementById('menu-trigger');
        this.overlay = document.getElementById('menu-overlay');
        this.animatedMenuItems = document.querySelectorAll('.overlay-nav > *, .overlay-footer');
        this.isMenuOpen = false;
        this.init();
    }

    init() {
        if (!this.trigger) return;

        this.trigger.addEventListener('click', () => {
            this.isMenuOpen = !this.isMenuOpen;
            const animDuration = 1.2;
            const syncEase = "expo.inOut";

            gsap.killTweensOf([this.overlay, this.animatedMenuItems, '#menu-trigger svg']);

            if (this.isMenuOpen) {
                const tl = gsap.timeline();
                this.overlay.style.pointerEvents = 'auto';

                tl.to(this.overlay, { autoAlpha: 1, duration: animDuration, ease: syncEase }, 0);
                tl.to('#menu-trigger svg', { rotation: 45, duration: animDuration, ease: syncEase }, 0);
                tl.to(this.animatedMenuItems, { autoAlpha: 1, y: 0, stagger: 0.05, duration: animDuration, ease: syncEase }, 0);
            } else {
                const tl = gsap.timeline();
                tl.to(this.animatedMenuItems, { autoAlpha: 0, y: 20, stagger: { each: 0.05, from: "end" }, duration: animDuration, ease: syncEase }, 0);
                tl.to('#menu-trigger svg', { rotation: 0, duration: animDuration, ease: syncEase }, 0);
                tl.to(this.overlay, { autoAlpha: 0, duration: animDuration, ease: syncEase }, 0);
                this.overlay.style.pointerEvents = 'none';
            }
        });
    }
}
