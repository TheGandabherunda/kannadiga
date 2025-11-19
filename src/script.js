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

    // Get updated rect (crucial because logo moves during onboarding)
    const logoRect = logoWrapper.getBoundingClientRect();

    // 1. Calculate Center of the Logo (This is the anchor point)
    const logoCenterX = logoRect.left + logoRect.width / 2;
    const logoCenterY = logoRect.top + logoRect.height / 2;

    // 2. Local calculations for the Leather Container Shine (This was already perfect, keeping as is)
    const localX = e.clientX - logoRect.left;
    const localY = e.clientY - logoRect.top;

    logoWrapper.style.setProperty('--light-x', `${localX}px`);
    logoWrapper.style.setProperty('--light-y', `${localY}px`);

    // 3. Calculate Distance from Cursor to Logo Center
    const distX = e.clientX - logoCenterX;
    const distY = e.clientY - logoCenterY;

    // --- THE FIX: Restore Original "Feel" but aligned to Logo ---
    // The original code mapped the full Window Width to 3x the SVG Width.
    // We calculate that ratio (sensitivity) and apply it to the distance from the logo center.

    const sensitivityX = (vbWidth * 3) / window.innerWidth;
    const sensitivityY = (vbHeight * 3) / window.innerHeight;

    // Apply this offset to the default SVG center (36, 48)
    // This replicates the "Global" lighting feel but makes it relative to the logo's position.
    const svgX = 36 + (distX * sensitivityX);
    const svgY = 48 + (distY * sensitivityY);

    // Update SVG Lights
    lightSource.setAttribute('x', svgX);
    lightSource.setAttribute('y', svgY);
    diffuseSource.setAttribute('x', svgX);
    diffuseSource.setAttribute('y', svgY);

    // 4. Update Drop Shadow (Synced to relative position)
    // Original logic: (0.5 - xPercent) * 8.
    // New logic: Same ratio, but using distance from logo center.
    const shadowX = ((logoCenterX - e.clientX) / window.innerWidth) * 8;
    const shadowY = ((logoCenterY - e.clientY) / window.innerHeight) * 8;

    shadowFilter.setAttribute('dx', shadowX);
    shadowFilter.setAttribute('dy', shadowY);

    // 5. Intensity Calculations (Kept exactly as original)
    const distance = Math.sqrt(distX * distX + distY * distY);

    // Dynamic maxDistance based on viewport size
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const maxDistance = Math.sqrt(windowWidth * windowWidth + windowHeight * windowHeight) / 1.5;

    // Calculate intensity (0 to 1)
    let intensity = Math.max(0, 1 - (distance / maxDistance));

    // Update Glow Opacity
    logoWrapper.style.setProperty('--glow-opacity', intensity.toFixed(2));

    // Update Specular Light Intensity
    const baseSpecular = 0.9;
    const minSpecular = 0.75;

    const currentSpecular = minSpecular + (baseSpecular - minSpecular) * intensity;
    specularElement.setAttribute('specularConstant', currentSpecular.toFixed(2));
});

// RESET TO DEFAULT ON MOUSE LEAVE (window)
document.addEventListener('mouseleave', () => {
    if (!lightSource || !diffuseSource) return;

    // 1. Reset SVG Lights to center
    lightSource.setAttribute('x', 36);
    lightSource.setAttribute('y', 48);
    diffuseSource.setAttribute('x', 36);
    diffuseSource.setAttribute('y', 48);

    // Reset intensity
    specularElement.setAttribute('specularConstant', '0.75');

    // 2. Reset Drop Shadow to 0
    shadowFilter.setAttribute('dx', 0);
    shadowFilter.setAttribute('dy', 0);

    // 3. Reset Leather Sheen to Center & OFF
    logoWrapper.style.setProperty('--light-x', '50%');
    logoWrapper.style.setProperty('--light-y', '50%');
    logoWrapper.style.setProperty('--glow-opacity', '0');
});