const container = document.querySelector('.container');
const logoWrapper = document.getElementById('logoWrapper');

// These elements are now available because this script is loaded after SVG injection
const lightSource = document.getElementById('light-source');
const diffuseSource = document.getElementById('diffuse-source');
const shadowFilter = document.getElementById('dynamic-shadow');
const specularElement = document.getElementById('specular-element');

// Original viewBox dimensions
const vbWidth = 72;
const vbHeight = 97;

// Event listener attached to window to capture full viewport movement
window.addEventListener('mousemove', (e) => {
    // Guard clause in case SVG hasn't fully parsed yet
    if (!lightSource || !diffuseSource) return;

    const logoRect = logoWrapper.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // Center of the logo in viewport coordinates
    const logoCenterX = logoRect.left + logoRect.width / 2;
    const logoCenterY = logoRect.top + logoRect.height / 2;

    // Calculate distance from cursor to logo center
    const distX = e.clientX - logoCenterX;
    const distY = e.clientY - logoCenterY;
    const distance = Math.sqrt(distX * distX + distY * distY);

    // Dynamic maxDistance based on viewport size to ensure corners work
    // using the diagonal of the screen divided by 1.5 ensures it covers corners comfortably
    const maxDistance = Math.sqrt(windowWidth * windowWidth + windowHeight * windowHeight) / 1.5;

    // Calculate intensity (0 to 1) based on distance
    let intensity = Math.max(0, 1 - (distance / maxDistance));

    // Update Glow Opacity
    logoWrapper.style.setProperty('--glow-opacity', intensity.toFixed(2));

    // Update Specular Light Intensity
    // MODIFIED: Set minSpecular to 0.75 for a very subtle shade darker when away (was 0.9)
    const baseSpecular = 0.9;
    const minSpecular = 0.75;

    const currentSpecular = minSpecular + (baseSpecular - minSpecular) * intensity;
    specularElement.setAttribute('specularConstant', currentSpecular.toFixed(2));


    // 1. Global calculations for the Medal 3D Effect (based on Window)
    const xPercent = e.clientX / windowWidth;
    const yPercent = e.clientY / windowHeight;

    // Map window percentage to SVG coordinates
    // We multiply by larger numbers to allow the light to move "outside" the SVG bounds
    // giving a more dramatic directional effect
    const svgX = xPercent * vbWidth * 3 - (vbWidth);
    const svgY = yPercent * vbHeight * 3 - (vbHeight);

    // Update SVG Lights
    lightSource.setAttribute('x', svgX);
    lightSource.setAttribute('y', svgY);
    diffuseSource.setAttribute('x', svgX);
    diffuseSource.setAttribute('y', svgY);

    // Update SVG Drop Shadow
    const centerX = 0.5;
    const centerY = 0.5;
    const shadowX = (centerX - xPercent) * 8; // Increased multiplier for more dramatic shadow
    const shadowY = (centerY - yPercent) * 8;
    shadowFilter.setAttribute('dx', shadowX);
    shadowFilter.setAttribute('dy', shadowY);

    // 2. Local calculations for the Leather Container Shine
    const localX = e.clientX - logoRect.left;
    const localY = e.clientY - logoRect.top;

    // Update CSS variables on the wrapper
    logoWrapper.style.setProperty('--light-x', `${localX}px`);
    logoWrapper.style.setProperty('--light-y', `${localY}px`);
});

// RESET TO DEFAULT ON MOUSE LEAVE (window)
document.addEventListener('mouseleave', () => {
    if (!lightSource || !diffuseSource) return;

    // 1. Reset SVG Lights to initial HTML values (Center)
    lightSource.setAttribute('x', 36);
    lightSource.setAttribute('y', 48);
    diffuseSource.setAttribute('x', 36);
    diffuseSource.setAttribute('y', 48);

    // Reset intensity
    // MODIFIED: Reset to 0.75 (matching minSpecular) for slight darkness
    specularElement.setAttribute('specularConstant', '0.75');

    // 2. Reset Drop Shadow to 0
    shadowFilter.setAttribute('dx', 0);
    shadowFilter.setAttribute('dy', 0);

    // 3. Reset Leather Sheen to Center & OFF
    logoWrapper.style.setProperty('--light-x', '50%');
    logoWrapper.style.setProperty('--light-y', '50%');
    logoWrapper.style.setProperty('--glow-opacity', '0');
});