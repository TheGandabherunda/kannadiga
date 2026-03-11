export class LogoLighting {
    constructor() {
        this.vbWidth = 72;
        this.vbHeight = 97;
        this.logoWrapper = document.getElementById('logoWrapper');
        this.init();
    }

    init() {
        window.addEventListener('mousemove', (e) => this.update(e));
        document.addEventListener('mouseleave', () => this.reset());
    }

    update(e) {
        const lightSource = document.getElementById('light-source');
        const diffuseSource = document.getElementById('diffuse-source');
        const shadowFilter = document.getElementById('dynamic-shadow');
        const specularElement = document.getElementById('specular-element');

        if (!lightSource || !diffuseSource || !this.logoWrapper) return;

        const homeSection = document.querySelector('.home-section');
        if (homeSection) {
            const rect = homeSection.getBoundingClientRect();
            if (rect.right <= 0 || rect.left >= window.innerWidth) {
                this.reset();
                return;
            }
        }

        const logoRect = this.logoWrapper.getBoundingClientRect();
        const logoCenterX = logoRect.left + logoRect.width / 2;
        const logoCenterY = logoRect.top + logoRect.height / 2;
        const distX = e.clientX - logoCenterX;
        const distY = e.clientY - logoCenterY;

        const sensitivityX = (this.vbWidth * 3) / window.innerWidth;
        const sensitivityY = (this.vbHeight * 3) / window.innerHeight;

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

        this.logoWrapper.style.setProperty('--glow-opacity', intensity.toFixed(2));
        const baseSpecular = 0.9;
        const minSpecular = 0.75;
        const currentSpecular = minSpecular + (baseSpecular - minSpecular) * intensity;
        if (specularElement) specularElement.setAttribute('specularConstant', currentSpecular.toFixed(2));
    }

    reset() {
        const lightSource = document.getElementById('light-source');
        const diffuseSource = document.getElementById('diffuse-source');
        const shadowFilter = document.getElementById('dynamic-shadow');
        const specularElement = document.getElementById('specular-element');

        if (lightSource) lightSource.setAttribute('x', 36);
        if (diffuseSource) diffuseSource.setAttribute('y', 48);
        if (specularElement) specularElement.setAttribute('specularConstant', '0.75');
        if (shadowFilter) {
            shadowFilter.setAttribute('dx', 0);
            shadowFilter.setAttribute('dy', 0);
        }
        if (this.logoWrapper) {
            this.logoWrapper.style.setProperty('--light-x', '50%');
            this.logoWrapper.style.setProperty('--light-y', '50%');
            this.logoWrapper.style.setProperty('--glow-opacity', '0');
        }
    }
}
