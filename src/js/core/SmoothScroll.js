export default class SmoothScroll {
    constructor(trackId) {
        this.track = document.getElementById(trackId);
        if (!this.track) return;

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

    // Helper to get true offset relative to the track
    getSectionOffset(section) {
        let offset = 0;
        let node = section;
        while (node && node !== this.track) {
            offset += node.offsetLeft;
            node = node.offsetParent;
        }
        return offset;
    }

    // --- BOTTOM NAVIGATION LOGIC ---
    initBottomNav() {
        if (!this.navContainer) return;
        this.navContainer.innerHTML = '';
        this.navContainer.style.gap = '0px';

        const elementsToDim = "#scroll-viewport, #menu-trigger, #home-screen";

        this.sections.forEach((section, index) => {
            const wrapper = document.createElement('div');
            wrapper.classList.add('nav-line-wrapper');
            wrapper.style.width = '12px';
            wrapper.style.height = '100%';
            wrapper.style.display = 'flex';
            wrapper.style.alignItems = 'flex-end';
            wrapper.style.justifyContent = 'center';
            wrapper.style.cursor = 'pointer';
            wrapper.style.position = 'relative';

            const line = document.createElement('div');
            line.classList.add('nav-line');
            line.style.pointerEvents = 'none';

            wrapper.addEventListener('mouseenter', () => {
                this.navState.isHovering = true;
                this.navState.hoveredIndex = index;
                this.updateNavLabel(index, true);
                gsap.to(elementsToDim, { opacity: 0.1, filter: "blur(4px)", duration: 0.5, ease: "power2.out", overwrite: "auto" });
            });

            wrapper.addEventListener('mouseleave', (e) => {
                 this.navState.isHovering = false;
                 this.navState.hoveredIndex = -1;
                 this.updateNavLabel(-1, false);
                 if (e.relatedTarget && e.relatedTarget.closest('.nav-line-wrapper')) { return; }
                 gsap.to(elementsToDim, { opacity: 1, filter: "blur(0px)", duration: 0.5, ease: "power2.out", overwrite: "auto" });
            });

            wrapper.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                const sectionOffset = this.getSectionOffset(section);
                const targetX = sectionOffset + (section.offsetWidth / 2) - (window.innerWidth / 2);
                let clampedTarget = Math.max(0, Math.min(targetX, this.maxScroll));

                this.isAutoScrolling = true;
                gsap.to(this, {
                    current: clampedTarget,
                    target: clampedTarget,
                    duration: 2.5,
                    ease: "power4.out",
                    overwrite: "auto",
                    onComplete: () => { this.isAutoScrolling = false; }
                });
            });

            wrapper.appendChild(line);
            this.navContainer.appendChild(wrapper);
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

    updateNavVisuals() {
        const viewportCenter = window.innerWidth / 2;

        this.navLines.forEach((line, index) => {
            let targetHeight = 20;
            let targetOpacity = 0.1;

            if (this.navState.isHovering) {
                const dist = Math.abs(index - this.navState.hoveredIndex);
                if (dist === 0) { targetHeight = 26; targetOpacity = 1.0; }
                else if (dist === 1) { targetHeight = 22; targetOpacity = 0.3; }

            } else {
                const section = this.sections[index];
                const sectionOffset = this.getSectionOffset(section);
                const sectionWidth = section.offsetWidth;
                const sectionCenter = sectionOffset + (sectionWidth / 2);
                const visualCenter = sectionCenter - this.current;
                const dist = Math.abs(visualCenter - viewportCenter);
                const distRatio = dist / window.innerWidth;
                const k = 3.0;
                let activation = Math.exp(-k * Math.pow(distRatio, 2));

                if (index === 0 && visualCenter > viewportCenter) { activation = 1.0; }
                else if (index === this.sections.length - 1 && visualCenter < viewportCenter) { activation = 1.0; }

                targetHeight = 20;
                targetOpacity = 0.1 + (0.9 * Math.pow(activation, 1.5));
            }

            const currentH = parseFloat(line.style.height) || 20;
            const currentO = parseFloat(line.style.opacity) || 0.1;
            const lerp = (start, end, amt) => (1 - amt) * start + amt * end;
            const speed = this.navState.isHovering ? 0.2 : 0.1;

            line.style.height = `${lerp(currentH, targetHeight, speed)}px`;
            line.style.opacity = lerp(currentO, targetOpacity, speed);
        });

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
        window.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
        window.addEventListener('mousedown', (e) => this.onDown(e));
        window.addEventListener('touchstart', (e) => this.onDown(e.touches[0]), { passive: false });
        window.addEventListener('mousemove', (e) => this.onMove(e));
        window.addEventListener('touchmove', (e) => this.onMove(e.touches[0]), { passive: false });
        window.addEventListener('mouseup', () => this.onUp());
        window.addEventListener('touchend', () => this.onUp());
        this.animate();
    }

    onWheel(e) {
        if (this.isAutoScrolling) {
            gsap.killTweensOf(this);
            this.isAutoScrolling = false;
        }
        let delta = e.deltaY;
        if (this.target < 0 || this.target > this.maxScroll) { delta *= this.elasticity; }
        this.target += delta;
        this.isWheeling = true;
        if (this.wheelTimeout) clearTimeout(this.wheelTimeout);
        this.wheelTimeout = setTimeout(() => { this.isWheeling = false; }, 100);
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
        if (this.target < 0) { this.target = this.target * this.elasticity; }
        else if (this.target > this.maxScroll) {
            const extra = this.target - this.maxScroll;
            this.target = this.maxScroll + (extra * this.elasticity);
        }
    }

    onUp() {
        this.isDragging = false;
        this.track.style.cursor = 'grab';
    }

    animate() {
        if (!this.isDragging && !this.isWheeling && !this.isAutoScrolling) {
             if (this.target < 0) {
                 this.target += (0 - this.target) * this.springFactor;
                 if (Math.abs(this.target) < 0.1) this.target = 0;
             } else if (this.target > this.maxScroll) {
                 this.target += (this.maxScroll - this.target) * this.springFactor;
                 if (Math.abs(this.target - this.maxScroll) < 0.1) this.target = this.maxScroll;
             }
        }

        if (!this.isAutoScrolling) {
            this.current += (this.target - this.current) * this.friction;
        }

        if (Math.abs(this.target - this.current) < 0.05 && !this.isDragging && !this.isWheeling && !this.isAutoScrolling) {
            this.current = this.target;
        }

        if (this.current > 50 && !this.isInstructionHidden) {
            this.isInstructionHidden = true;
            gsap.to("#scroll-instruction", { autoAlpha: 0, filter: "blur(10px)", duration: 0.5, ease: "power2.out" });
        } else if (this.current <= 50 && this.isInstructionHidden) {
            this.isInstructionHidden = false;
            gsap.to("#scroll-instruction", { autoAlpha: 1, filter: "blur(0px)", duration: 0.5, ease: "power2.out" });
        }

        this.updateNavVisuals();
        this.track.style.transform = `translate3d(${-this.current}px, 0, 0)`;
        this.rafId = requestAnimationFrame(() => this.animate());
    }
}
