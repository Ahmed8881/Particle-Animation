const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Controls
const galaxyBtn = document.getElementById('galaxyBtn');
const vortexBtn = document.getElementById('vortexBtn');
const flowBtn = document.getElementById('flowBtn');
const cosmicBtn = document.getElementById('cosmicBtn');
const neonBtn = document.getElementById('neonBtn');
const fireiceBtn = document.getElementById('fireiceBtn');
const trailsBtn = document.getElementById('trailsBtn');
const glowBtn = document.getElementById('glowBtn');
const particleSlider = document.getElementById('particleSlider');
const speedSlider = document.getElementById('speedSlider');
const sizeSlider = document.getElementById('sizeSlider');
const hideButton = document.getElementById('hideButton');
const controls = document.getElementById('controls');
const info = document.getElementById('info');
const particleCount = document.getElementById('particleCount');
const fpsCount = document.getElementById('fpsCount');

// Configuration
let config = {
    mode: 'galaxy',       // galaxy, vortex, flow
    theme: 'cosmic',      // cosmic, neon, fireice
    trails: false,
    glow: false,
    particleCount: parseInt(particleSlider.value),
    speed: parseInt(speedSlider.value) / 10,
    size: parseInt(sizeSlider.value) / 2
};

// Theme colors
const themes = {
    cosmic: {
        background: 'radial-gradient(circle, #0f0c29, #302b63, #24243e)',
        colors: [
            '#ff3366', '#33ccff', '#ffcc33', '#33ff99', '#cc33ff', '#ff99cc'
        ],
        glow: 'rgba(100, 100, 255, 0.5)'
    },
    neon: {
        background: 'radial-gradient(circle, #000000, #1a0033)',
        colors: [
            '#ff00ff', '#00ffff', '#ff3300', '#33ff00', '#ffff00'
        ],
        glow: 'rgba(255, 0, 255, 0.5)'
    },
    fireice: {
        background: 'linear-gradient(135deg, #330000, #000033)',
        colors: [
            '#ff3300', '#ff6600', '#ff9900', '#00ccff', '#0099ff', '#0066ff'
        ],
        glow: 'rgba(255, 100, 50, 0.5)'
    }
};

// Particles array
let particles = [];

// Mouse position
let mouse = {
    x: null,
    y: null,
    radius: 150,
    active: false
};

// Timer variables for FPS calculation
let fpsTime = 0;
let localFpsCount = 0;
let lastFrameTime = 0;

// Animation variables
let animationFrame;
let globalTime = 0;

// Resize canvas to fit window
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    initParticles();
}

// Particle class
class Particle {
    constructor() {
        this.reset();
    }
    
    reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * config.size + 1;
        this.baseSize = this.size;
        
        // Add variation to speeds
        this.speedX = (Math.random() - 0.5) * config.speed;
        this.speedY = (Math.random() - 0.5) * config.speed;
        
        // Color based on theme
        const colors = themes[config.theme].colors;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        
        // Properties for different modes
        this.density = Math.random() * 30 + 1;
        this.angle = Math.random() * Math.PI * 2;
        this.distance = Math.random() * (canvas.width/2);
        this.opacity = Math.random() * 0.8 + 0.2;
        
        // Trail history for trailing effect
        this.history = [];
        this.historyLength = Math.floor(Math.random() * 10) + 5;
    }
    
    update() {
        // Store position history for trails
        if (config.trails && this.history.length < this.historyLength) {
            this.history.push({x: this.x, y: this.y});
        } else if (config.trails) {
            this.history.shift();
            this.history.push({x: this.x, y: this.y});
        }
        
        // Different movement patterns based on mode
        if (config.mode === 'galaxy') {
            // Orbit around center
            this.angle += config.speed * 0.01 / this.density;
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const targetX = centerX + this.distance * Math.cos(this.angle);
            const targetY = centerY + this.distance * Math.sin(this.angle);
            
            this.x += (targetX - this.x) * 0.01 * config.speed;
            this.y += (targetY - this.y) * 0.01 * config.speed;
        } else if (config.mode === 'vortex') {
            // Spiral movement
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const dx = this.x - centerX;
            const dy = this.y - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 1) {
                const angle = Math.atan2(dy, dx) + config.speed * 0.01;
                const newDistance = distance - config.speed * 0.1;
                
                if (newDistance < 5) {
                    this.reset();
                } else {
                    this.x = centerX + newDistance * Math.cos(angle);
                    this.y = centerY + newDistance * Math.sin(angle);
                }
            } else {
                this.reset();
            }
        } else if (config.mode === 'flow') {
            // Flowing field
            const noiseScale = 0.005;
            const noise = Math.sin(this.x * noiseScale) * Math.cos(this.y * noiseScale) * 5;
            this.angle = noise + globalTime * 0.0005;
            
            this.x += Math.cos(this.angle) * config.speed;
            this.y += Math.sin(this.angle) * config.speed;
        }
        
        // Check boundaries
        if (this.x < 0 || this.x > canvas.width || 
            this.y < 0 || this.y > canvas.height) {
            this.reset();
        }
        
        // Mouse interaction
        if (mouse.active) {
            const dx = this.x - mouse.x;
            const dy = this.y - mouse.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < mouse.radius) {
                // Repel from mouse
                const force = (mouse.radius - distance) / mouse.radius;
                const angle = Math.atan2(dy, dx);
                const moveX = Math.cos(angle) * force * 5;
                const moveY = Math.sin(angle) * force * 5;
                
                this.x += moveX;
                this.y += moveY;
                this.size = this.baseSize + force * 3;
            } else {
                // Gradually return to original size
                this.size = this.size * 0.95 + this.baseSize * 0.05;
            }
        }
    }
    
    draw() {
        // Draw trail if enabled
        if (config.trails && this.history.length > 1) {
            ctx.beginPath();
            ctx.moveTo(this.history[0].x, this.history[0].y);
            
            for (let i = 1; i < this.history.length; i++) {
                ctx.lineTo(this.history[i].x, this.history[i].y);
            }
            
            ctx.strokeStyle = this.color;
            ctx.lineWidth = this.size / 2;
            ctx.stroke();
        }
        
        // Draw glow if enabled
        if (config.glow) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = this.color;
        }
        
        // Draw the particle
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.opacity;
        ctx.fill();
        
        // Reset shadow
        if (config.glow) {
            ctx.shadowBlur = 0;
        }
        
        ctx.globalAlpha = 1;
    }
}

// Initialize particles
function initParticles() {
    particles = [];
    for (let i = 0; i < config.particleCount; i++) {
        particles.push(new Particle());
    }
    particleCount.textContent = particles.length;
}

// Animation loop
function animate(timestamp) {
    if (!lastFrameTime) {
        lastFrameTime = timestamp;
    }
    const deltaTime = timestamp - lastFrameTime;
    lastFrameTime = timestamp;
    
    // Calculate FPS
    if (timestamp - fpsTime >= 1000) {
        fpsCount.textContent = Math.round(1000 / deltaTime);
        fpsTime = timestamp;
    }
    
    globalTime = timestamp;
    
    // Clear canvas with fade effect for trails
    if (config.trails) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    // Update and draw particles
    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
    }
    
    animationFrame = requestAnimationFrame(animate);
}

// Set up mouse events
canvas.addEventListener('mousemove', function(e) {
    mouse.x = e.x;
    mouse.y = e.y;
    mouse.active = true;
});

canvas.addEventListener('mouseout', function() {
    mouse.active = false;
});

// Add touch support
canvas.addEventListener('touchstart', function(e) {
    e.preventDefault();
    mouse.x = e.touches[0].clientX;
    mouse.y = e.touches[0].clientY;
    mouse.active = true;
});

canvas.addEventListener('touchmove', function(e) {
    e.preventDefault();
    mouse.x = e.touches[0].clientX;
    mouse.y = e.touches[0].clientY;
});

canvas.addEventListener('touchend', function() {
    mouse.active = false;
});

// Apply theme
function applyTheme() {
    document.body.style.background = themes[config.theme].background;
}

// Button click handlers
galaxyBtn.addEventListener('click', function() {
    setActiveButton('mode', this);
    config.mode = 'galaxy';
});

vortexBtn.addEventListener('click', function() {
    setActiveButton('mode', this);
    config.mode = 'vortex';
});

flowBtn.addEventListener('click', function() {
    setActiveButton('mode', this);
    config.mode = 'flow';
});

cosmicBtn.addEventListener('click', function() {
    setActiveButton('theme', this);
    config.theme = 'cosmic';
    applyTheme();
});

neonBtn.addEventListener('click', function() {
    setActiveButton('theme', this);
    config.theme = 'neon';
    applyTheme();
});

fireiceBtn.addEventListener('click', function() {
    setActiveButton('theme', this);
    config.theme = 'fireice';
    applyTheme();
});

trailsBtn.addEventListener('click', function() {
    config.trails = !config.trails;
    this.classList.toggle('active');
});

glowBtn.addEventListener('click', function() {
    config.glow = !config.glow;
    this.classList.toggle('active');
});

// Slider handlers
particleSlider.addEventListener('input', function() {
    config.particleCount = parseInt(this.value);
    initParticles();
});

speedSlider.addEventListener('input', function() {
    config.speed = parseInt(this.value) / 10;
});

sizeSlider.addEventListener('input', function() {
    config.size = parseInt(this.value) / 2;
});

// Toggle UI visibility
hideButton.addEventListener('click', function() {
    controls.style.display = controls.style.display === 'none' ? 'flex' : 'none';
    info.style.display = info.style.display === 'none' ? 'block' : 'none';
});

// Helper to set active button in a group
function setActiveButton(group, button) {
    if (group === 'mode') {
        galaxyBtn.classList.remove('active');
        vortexBtn.classList.remove('active');
        flowBtn.classList.remove('active');
    } else if (group === 'theme') {
        cosmicBtn.classList.remove('active');
        neonBtn.classList.remove('active');
        fireiceBtn.classList.remove('active');
    }
    
    button.classList.add('active');
}

// Auto-hide info after 5 seconds
setTimeout(function() {
    info.style.opacity = '0';
}, 5000);

// Initialize
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
applyTheme();
initParticles();
animate(0);