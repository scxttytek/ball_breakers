const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlaySubtitle = document.getElementById('overlaySubtitle');

const GAME_WIDTH = 800;
const GAME_HEIGHT = 545;
const PADDLE_WIDTH = 100;
const PADDLE_HEIGHT = 15;
const BALL_RADIUS = 8;
const BRICK_ROW_COUNT = 5;
const BRICK_COLUMN_COUNT = 10;
const BRICK_WIDTH = 70;
const BRICK_HEIGHT = 25;
const BRICK_PADDING = 8;
const BRICK_OFFSET_TOP = 50;
const BRICK_OFFSET_LEFT = 35;

const BRICK_COLORS = [
    '#e94560',
    '#ff6b6b',
    '#feca57',
    '#48dbfb',
    '#1dd1a1'
];

const POWER_UPS = [
    { type: 'multiball', color: '#ff9ff3', symbol: 'M', duration: 0 },
    { type: 'expand', color: '#1dd1a1', symbol: 'E', duration: 10000 },
    { type: 'shrink', color: '#ee5a24', symbol: 'S', duration: 10000 },
    { type: 'fireball', color: '#ff6b6b', symbol: 'F', duration: 8000 },
    { type: 'slow', color: '#48dbfb', symbol: 'T', duration: 8000 },
    { type: 'extralife', color: '#feca57', symbol: '+', duration: 0 }
];

const BALL_SKINS = [
    { id: 'classic', name: 'Classic', color: '#ffffff', glowColor: '#48dbfb', trailColor: '#a2d2ff', unlocked: true, requirement: null },
    { id: 'fire', name: 'Fire', color: '#ff6600', glowColor: '#ff0000', trailColor: '#ffaa00', unlocked: true, requirement: { type: 'score', value: 500 } },
    { id: 'ice', name: 'Ice', color: '#00ffff', glowColor: '#00ccff', trailColor: '#ccffff', unlocked: false, requirement: { type: 'level', value: 3 } },
    { id: 'neon', name: 'Neon', color: '#ff00ff', glowColor: '#ff00ff', trailColor: '#ff88ff', unlocked: false, requirement: { type: 'combo', value: 5 } },
    { id: 'gold', name: 'Gold', color: '#ffd700', glowColor: '#ffaa00', trailColor: '#ffee88', unlocked: false, requirement: { type: 'score', value: 2000 } },
    { id: 'shadow', name: 'Shadow', color: '#333333', glowColor: '#000000', trailColor: '#666666', unlocked: false, requirement: { type: 'level', value: 5 } },
    { id: 'rainbow', name: 'Rainbow', color: '#ff0000', glowColor: '#ffffff', trailColor: '#ff00ff', unlocked: false, requirement: { type: 'score', value: 5000 } },
    { id: 'plasma', name: 'Plasma', color: '#00ff00', glowColor: '#00ff00', trailColor: '#88ff88', unlocked: false, requirement: { type: 'combo', value: 10 } }
];

const PADDLE_SKINS = [
    { id: 'classic', name: 'Classic', color: '#e94560', secondaryColor: '#ff6b6b', pattern: 'solid', unlocked: true, requirement: null },
    { id: 'neon', name: 'Neon', color: '#00ff00', secondaryColor: '#88ff88', pattern: 'striped', unlocked: false, requirement: { type: 'level', value: 2 } },
    { id: 'ocean', name: 'Ocean', color: '#0066ff', secondaryColor: '#00ccff', pattern: 'wave', unlocked: false, requirement: { type: 'score', value: 1000 } },
    { id: 'sunset', name: 'Sunset', color: '#ff6600', secondaryColor: '#ff0066', pattern: 'gradient', unlocked: false, requirement: { type: 'level', value: 4 } },
    { id: 'cyber', name: 'Cyber', color: '#ff00ff', secondaryColor: '#00ffff', pattern: 'cyber', unlocked: false, requirement: { type: 'score', value: 3000 } },
    { id: 'golden', name: 'Golden', color: '#ffd700', secondaryColor: '#ffaa00', pattern: 'shimmer', unlocked: false, requirement: { type: 'combo', value: 8 } }
];

const PARTICLE_STYLES = [
    { id: 'sparks', name: 'Sparks', unlocked: true, requirement: null },
    { id: 'stars', name: 'Stars', unlocked: false, requirement: { type: 'level', value: 2 } },
    { id: 'bubbles', name: 'Bubbles', unlocked: false, requirement: { type: 'score', value: 1500 } },
    { id: 'confetti', name: 'Confetti', unlocked: false, requirement: { type: 'score', value: 3500 } },
    { id: 'energy', name: 'Energy', unlocked: false, requirement: { type: 'combo', value: 7 } }
];

const ACHIEVEMENTS = [
    { id: 'first_brick', name: 'First Break', description: 'Break your first brick', icon: '🧱', unlocked: false },
    { id: 'combo_5', name: 'On Fire', description: 'Get a 5x combo', icon: '🔥', unlocked: false },
    { id: 'combo_10', name: 'Unstoppable', description: 'Get a 10x combo', icon: '💥', unlocked: false },
    { id: 'level_5', name: 'Rising Star', description: 'Reach level 5', icon: '⭐', unlocked: false },
    { id: 'level_10', name: 'Master', description: 'Reach level 10', icon: '👑', unlocked: false },
    { id: 'score_5000', name: 'High Scorer', description: 'Score 5000 points', icon: '🎯', unlocked: false },
    { id: 'multiball', name: 'Double Trouble', description: 'Use multiball power-up', icon: '🎱', unlocked: false },
    { id: 'fireball', name: 'Hot Shot', description: 'Use fireball power-up', icon: '🔥', unlocked: false }
];

let paddle = {
    x: GAME_WIDTH / 2 - PADDLE_WIDTH / 2,
    y: GAME_HEIGHT - 40,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    dx: 0,
    speed: 8,
    baseWidth: PADDLE_WIDTH,
    glowIntensity: 0,
    activePowerUps: {},
    skin: 'classic'
};

let balls = [];
let bricks = [];
let powerUps = [];
let score = 0;
let lives = 3;
let gameState = 'start';
let rightPressed = false;
let leftPressed = false;
let highScore = localStorage.getItem('ballBreakersHighScore') || 0;
let particles = [];
let screenShake = 0;
let audioCtx = null;
let comboCount = 0;
let comboTimer = 0;
let lastHitTime = 0;
let level = 1;
let difficultyMultiplier = 1;
let floatingTexts = [];
let selectedBallSkin = 'classic';
let selectedPaddleSkin = 'classic';
let selectedParticleStyle = 'sparks';
let unlockedItems = {};
let achievements = [];
let shopVisible = false;
let totalBricksBroken = 0;
let totalMultiballUsed = 0;
let totalFireballUsed = 0;

function loadProgress() {
    const saved = localStorage.getItem('ballBreakersProgress');
    if (saved) {
        const data = JSON.parse(saved);
        unlockedItems = data.unlockedItems || {};
        achievements = data.achievements || ACHIEVEMENTS.map(a => ({ ...a, unlocked: false }));
        selectedBallSkin = data.selectedBallSkin || 'classic';
        selectedPaddleSkin = data.selectedPaddleSkin || 'classic';
        selectedParticleStyle = data.selectedParticleStyle || 'sparks';
        totalBricksBroken = data.totalBricksBroken || 0;
        totalMultiballUsed = data.totalMultiballUsed || 0;
        totalFireballUsed = data.totalFireballUsed || 0;
    } else {
        achievements = ACHIEVEMENTS.map(a => ({ ...a, unlocked: false }));
    }
    
    BALL_SKINS.forEach(skin => {
        skin.unlocked = unlockedItems[`ball_${skin.id}`] || skin.requirement === null;
    });
    
    PADDLE_SKINS.forEach(skin => {
        skin.unlocked = unlockedItems[`paddle_${skin.id}`] || skin.requirement === null;
    });
    
    PARTICLE_STYLES.forEach(style => {
        style.unlocked = unlockedItems[`particle_${style.id}`] || style.requirement === null;
    });
    
    checkAchievements();
}

function saveProgress() {
    const data = {
        unlockedItems,
        achievements,
        selectedBallSkin,
        selectedPaddleSkin,
        selectedParticleStyle,
        totalBricksBroken,
        totalMultiballUsed,
        totalFireballUsed
    };
    localStorage.setItem('ballBreakersProgress', JSON.stringify(data));
}

function checkAchievements() {
    const unlocks = [];
    
    BALL_SKINS.forEach(skin => {
        if (!skin.unlocked && skin.requirement) {
            let unlocked = false;
            if (skin.requirement.type === 'score' && score >= skin.requirement.value) unlocked = true;
            if (skin.requirement.type === 'level' && level >= skin.requirement.value) unlocked = true;
            if (skin.requirement.type === 'combo' && comboCount >= skin.requirement.value) unlocked = true;
            
            if (unlocked) {
                skin.unlocked = true;
                unlocks.push(skin.name);
            }
        }
    });
    
    PADDLE_SKINS.forEach(skin => {
        if (!skin.unlocked && skin.requirement) {
            let unlocked = false;
            if (skin.requirement.type === 'score' && score >= skin.requirement.value) unlocked = true;
            if (skin.requirement.type === 'level' && level >= skin.requirement.value) unlocked = true;
            if (skin.requirement.type === 'combo' && comboCount >= skin.requirement.value) unlocked = true;
            
            if (unlocked) {
                skin.unlocked = true;
                unlocks.push(skin.name);
            }
        }
    });
    
    PARTICLE_STYLES.forEach(style => {
        if (!style.unlocked && style.requirement) {
            let unlocked = false;
            if (style.requirement.type === 'score' && score >= style.requirement.value) unlocked = true;
            if (style.requirement.type === 'level' && level >= style.requirement.value) unlocked = true;
            if (style.requirement.type === 'combo' && comboCount >= style.requirement.value) unlocked = true;
            
            if (unlocked) {
                style.unlocked = true;
                unlocks.push(style.name);
            }
        }
    });
    
    achievements.forEach(ach => {
        if (!ach.unlocked) {
            let unlocked = false;
            switch(ach.id) {
                case 'first_brick': unlocked = totalBricksBroken >= 1; break;
                case 'combo_5': unlocked = comboCount >= 5; break;
                case 'combo_10': unlocked = comboCount >= 10; break;
                case 'level_5': unlocked = level >= 5; break;
                case 'level_10': unlocked = level >= 10; break;
                case 'score_5000': unlocked = score >= 5000; break;
                case 'multiball': unlocked = totalMultiballUsed >= 1; break;
                case 'fireball': unlocked = totalFireballUsed >= 1; break;
            }
            
            if (unlocked) {
                ach.unlocked = true;
                unlocks.push(ach.name);
            }
        }
    });
    
    if (unlocks.length > 0) {
        addFloatingText(GAME_WIDTH / 2, GAME_HEIGHT / 2, `UNLOCKED: ${unlocks.join(', ')}!`, '#ffd700');
    }
    
    saveProgress();
}

function selectBallSkin(skinId) {
    const skin = BALL_SKINS.find(s => s.id === skinId);
    if (skin && skin.unlocked) {
        selectedBallSkin = skinId;
        saveProgress();
    }
}

function selectPaddleSkin(skinId) {
    const skin = PADDLE_SKINS.find(s => s.id === skinId);
    if (skin && skin.unlocked) {
        selectedPaddleSkin = skinId;
        saveProgress();
    }
}

function selectParticleStyle(styleId) {
    const style = PARTICLE_STYLES.find(s => s.id === styleId);
    if (style && style.unlocked) {
        selectedParticleStyle = styleId;
        saveProgress();
    }
}

function getCurrentBallSkin() {
    return BALL_SKINS.find(s => s.id === selectedBallSkin) || BALL_SKINS[0];
}

function getCurrentPaddleSkin() {
    return PADDLE_SKINS.find(s => s.id === selectedPaddleSkin) || PADDLE_SKINS[0];
}

function getCurrentParticleStyle() {
    return PARTICLE_STYLES.find(s => s.id === selectedParticleStyle) || PARTICLE_STYLES[0];
}

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playSound(type, pitch = 1) {
    if (!audioCtx) return;
    
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    const baseFreq = 200 * pitch;
    
    switch(type) {
        case 'brick':
            oscillator.frequency.setValueAtTime(baseFreq + Math.random() * 200, audioCtx.currentTime);
            oscillator.type = 'square';
            gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.08);
            break;
        case 'paddle':
            oscillator.frequency.setValueAtTime(350, audioCtx.currentTime);
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.06);
            break;
        case 'wall':
            oscillator.frequency.setValueAtTime(baseFreq, audioCtx.currentTime);
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.04);
            break;
        case 'lose':
            oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
            oscillator.type = 'sawtooth';
            gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.25);
            break;
        case 'powerup':
            oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.15);
            break;
        case 'combo':
            oscillator.frequency.setValueAtTime(400 + comboCount * 50, audioCtx.currentTime);
            oscillator.type = 'triangle';
            gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.1);
            break;
        case 'unlock':
            oscillator.frequency.setValueAtTime(523, audioCtx.currentTime);
            oscillator.frequency.setValueAtTime(659, audioCtx.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(784, audioCtx.currentTime + 0.2);
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.3);
            break;
    }
}

function createParticles(x, y, color, count = 10) {
    const style = getCurrentParticleStyle();
    
    for (let i = 0; i < count; i++) {
        let particle = {
            x: x,
            y: y,
            dx: (Math.random() - 0.5) * 10,
            dy: (Math.random() - 0.5) * 10,
            radius: Math.random() * 5 + 2,
            color: color,
            life: 1,
            decay: Math.random() * 0.025 + 0.015,
            style: style.id
        };
        
        switch(style.id) {
            case 'stars':
                particle.type = 'star';
                break;
            case 'bubbles':
                particle.dy = -Math.abs(particle.dy) - 1;
                break;
            case 'confetti':
                particle.type = 'confetti';
                particle.color = `hsl(${Math.random() * 360}, 70%, 50%)`;
                break;
            case 'energy':
                particle.type = 'energy';
                particle.radius = Math.random() * 3 + 1;
                break;
        }
        
        particles.push(particle);
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.dx;
        p.y += p.dy;
        p.dy += 0.15;
        p.life -= p.decay;
        
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function drawParticles() {
    for (const p of particles) {
        ctx.save();
        ctx.globalAlpha = p.life;
        
        switch(p.type) {
            case 'star':
                drawStar(p.x, p.y, 5, p.radius * 2, p.radius, p.color);
                break;
            case 'confetti':
                ctx.fillStyle = p.color;
                ctx.fillRect(p.x, p.y, p.radius * 2, p.radius * 2);
                break;
            case 'energy':
                ctx.shadowBlur = 10;
                ctx.shadowColor = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.fill();
                break;
            default:
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius * p.life, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.fill();
        }
        
        ctx.closePath();
        ctx.restore();
    }
}

function drawStar(cx, cy, spikes, outerRadius, innerRadius, color) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    let step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
}

function applyScreenShake() {
    if (screenShake > 0) {
        ctx.save();
        const shakeX = (Math.random() - 0.5) * screenShake;
        const shakeY = (Math.random() - 0.5) * screenShake;
        ctx.translate(shakeX, shakeY);
        screenShake *= 0.85;
        if (screenShake < 0.5) screenShake = 0;
    }
}

function restoreScreenShake() {
    if (screenShake > 0) {
        ctx.restore();
    }
}

function spawnPowerUp(x, y) {
    if (Math.random() > 0.15) return;
    
    const powerUpType = POWER_UPS[Math.floor(Math.random() * POWER_UPS.length)];
    powerUps.push({
        x: x,
        y: y,
        dy: 2,
        width: 30,
        height: 30,
        ...powerUpType
    });
}

function updatePowerUps() {
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const p = powerUps[i];
        p.y += p.dy;
        
        if (p.y > GAME_HEIGHT) {
            powerUps.splice(i, 1);
            continue;
        }
        
        if (p.x < paddle.x + paddle.width &&
            p.x + p.width > paddle.x &&
            p.y < paddle.y + paddle.height &&
            p.y + p.height > paddle.y) {
            activatePowerUp(p);
            powerUps.splice(i, 1);
        }
    }
}

function activatePowerUp(powerUp) {
    playSound('powerup');
    createParticles(powerUp.x, powerUp.y, powerUp.color, 20);
    screenShake = 8;
    
    switch(powerUp.type) {
        case 'multiball':
            totalMultiballUsed++;
            const baseBall = balls[0] || { x: paddle.x + paddle.width / 2, y: paddle.y - 20, dx: 3, dy: -4, radius: BALL_RADIUS };
            for (let i = 0; i < 2; i++) {
                balls.push({
                    x: baseBall.x,
                    y: baseBall.y,
                    dx: baseBall.dx * (Math.random() > 0.5 ? 1 : -1) * (0.8 + Math.random() * 0.4),
                    dy: -Math.abs(baseBall.dy),
                    radius: BALL_RADIUS,
                    active: true,
                    trail: [],
                    fireball: false
                });
            }
            addFloatingText(powerUp.x, powerUp.y, 'MULTIBALL!', '#ff9ff3');
            break;
            
        case 'expand':
            paddle.width = Math.min(paddle.width * 1.5, 200);
            paddle.activePowerUps.expand = Date.now() + powerUp.duration;
            addFloatingText(powerUp.x, powerUp.y, 'EXPAND!', powerUp.color);
            break;
            
        case 'shrink':
            paddle.width = Math.max(paddle.width * 0.6, 40);
            paddle.activePowerUps.shrink = Date.now() + powerUp.duration;
            addFloatingText(powerUp.x, powerUp.y, 'SHRINK!', powerUp.color);
            break;
            
        case 'fireball':
            totalFireballUsed++;
            for (const ball of balls) {
                ball.fireball = true;
            }
            paddle.activePowerUps.fireball = Date.now() + powerUp.duration;
            addFloatingText(powerUp.x, powerUp.y, 'FIREBALL!', powerUp.color);
            break;
            
        case 'slow':
            for (const ball of balls) {
                ball.dx *= 0.6;
                ball.dy *= 0.6;
            }
            paddle.activePowerUps.slow = Date.now() + powerUp.duration;
            addFloatingText(powerUp.x, powerUp.y, 'SLOW!', powerUp.color);
            break;
            
        case 'extralife':
            lives++;
            updateUI();
            addFloatingText(powerUp.x, powerUp.y, '+1 LIFE!', powerUp.color);
            break;
    }
}

function updatePowerUpTimers() {
    const now = Date.now();
    
    if (paddle.activePowerUps.expand && now > paddle.activePowerUps.expand) {
        paddle.width = paddle.baseWidth;
        delete paddle.activePowerUps.expand;
    }
    
    if (paddle.activePowerUps.shrink && now > paddle.activePowerUps.shrink) {
        paddle.width = paddle.baseWidth;
        delete paddle.activePowerUps.shrink;
    }
    
    if (paddle.activePowerUps.fireball && now > paddle.activePowerUps.fireball) {
        for (const ball of balls) {
            ball.fireball = false;
        }
        delete paddle.activePowerUps.fireball;
    }
    
    if (paddle.activePowerUps.slow && now > paddle.activePowerUps.slow) {
        delete paddle.activePowerUps.slow;
    }
}

function drawPowerUps() {
    for (const p of powerUps) {
        ctx.beginPath();
        ctx.arc(p.x + p.width / 2, p.y + p.height / 2, 15, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.closePath();
        
        ctx.beginPath();
        ctx.arc(p.x + p.width / 2, p.y + p.height / 2, 12, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fill();
        ctx.closePath();
        
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.symbol, p.x + p.width / 2, p.y + p.height / 2);
    }
}

function addFloatingText(x, y, text, color) {
    floatingTexts.push({
        x: x,
        y: y,
        text: text,
        color: color,
        life: 1,
        dy: -2
    });
}

function updateFloatingTexts() {
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];
        ft.y += ft.dy;
        ft.life -= 0.02;
        
        if (ft.life <= 0) {
            floatingTexts.splice(i, 1);
        }
    }
}

function drawFloatingTexts() {
    for (const ft of floatingTexts) {
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = ft.color;
        ctx.globalAlpha = ft.life;
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.globalAlpha = 1;
}

function updateCombo() {
    const now = Date.now();
    if (now - lastHitTime > 2000) {
        comboCount = 0;
    }
}

function createBricks() {
    bricks = [];
    const rows = Math.min(BRICK_ROW_COUNT + Math.floor(level / 2), 8);
    
    for (let c = 0; c < BRICK_COLUMN_COUNT; c++) {
        bricks[c] = [];
        for (let r = 0; r < rows; r++) {
            bricks[c][r] = {
                x: 0,
                y: 0,
                status: 1,
                color: BRICK_COLORS[r % BRICK_COLORS.length]
            };
        }
    }
}

function initGame() {
    score = 0;
    lives = 3;
    level = 1;
    difficultyMultiplier = 1;
    balls = [{
        x: GAME_WIDTH / 2,
        y: GAME_HEIGHT - 60,
        dx: 4,
        dy: -4,
        radius: BALL_RADIUS,
        active: false,
        trail: [],
        fireball: false
    }];
    particles = [];
    powerUps = [];
    floatingTexts = [];
    comboCount = 0;
    paddle.width = paddle.baseWidth;
    paddle.activePowerUps = {};
    createBricks();
    updateUI();
}

function resetBall() {
    if (balls.length === 0) {
        balls = [{
            x: GAME_WIDTH / 2,
            y: GAME_HEIGHT - 60,
            dx: 4 * (Math.random() > 0.5 ? 1 : -1) * difficultyMultiplier,
            dy: -4 * difficultyMultiplier,
            radius: BALL_RADIUS,
            active: false,
            trail: [],
            fireball: false
        }];
    }
    
    const mainBall = balls[0];
    mainBall.x = paddle.x + paddle.width / 2;
    mainBall.y = paddle.y - mainBall.radius - 2;
    mainBall.active = false;
    mainBall.trail = [];
    mainBall.fireball = paddle.activePowerUps.fireball ? true : false;
}

function updateUI() {
    scoreElement.textContent = score;
    livesElement.textContent = lives;
}

function drawPaddle() {
    const skin = getCurrentPaddleSkin();
    let glowColor = skin.color;
    
    if (paddle.activePowerUps.fireball) glowColor = '#ff6b6b';
    else if (paddle.activePowerUps.expand) glowColor = '#1dd1a1';
    else if (paddle.activePowerUps.shrink) glowColor = '#ee5a24';
    
    paddle.glowIntensity = Math.min(paddle.glowIntensity + 0.1, 0.6);
    
    ctx.shadowBlur = 20 * paddle.glowIntensity;
    ctx.shadowColor = glowColor;
    
    ctx.beginPath();
    ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 5);
    
    switch(skin.pattern) {
        case 'gradient':
            const gradient = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x + paddle.width, paddle.y);
            gradient.addColorStop(0, skin.color);
            gradient.addColorStop(1, skin.secondaryColor);
            ctx.fillStyle = gradient;
            break;
        case 'striped':
            ctx.fillStyle = skin.color;
            break;
        case 'wave':
            ctx.fillStyle = skin.color;
            break;
        case 'cyber':
            ctx.fillStyle = '#000000';
            break;
        case 'shimmer':
            const shimmerGrad = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + paddle.height);
            shimmerGrad.addColorStop(0, skin.color);
            shimmerGrad.addColorStop(0.5, '#ffffff');
            shimmerGrad.addColorStop(1, skin.color);
            ctx.fillStyle = shimmerGrad;
            break;
        default:
            ctx.fillStyle = skin.color;
    }
    
    ctx.fill();
    ctx.closePath();
    
    switch(skin.pattern) {
        case 'striped':
            ctx.fillStyle = skin.secondaryColor;
            for (let i = 10; i < paddle.width - 10; i += 20) {
                ctx.fillRect(paddle.x + i, paddle.y, 8, paddle.height);
            }
            break;
        case 'cyber':
            ctx.strokeStyle = skin.color;
            ctx.lineWidth = 2;
            ctx.strokeRect(paddle.x + 2, paddle.y + 2, paddle.width - 4, paddle.height - 4);
            ctx.fillStyle = skin.secondaryColor;
            ctx.fillRect(paddle.x + 10, paddle.y + 5, paddle.width - 20, paddle.height - 10);
            break;
        default:
            ctx.beginPath();
            ctx.roundRect(paddle.x + 3, paddle.y + 3, paddle.width - 6, paddle.height - 6, 3);
            ctx.fillStyle = skin.secondaryColor;
            ctx.fill();
            ctx.closePath();
    }
    
    ctx.shadowBlur = 0;
    
    ctx.beginPath();
    ctx.roundRect(paddle.x + paddle.width / 2 - 5, paddle.y - 2, 10, 4, 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.closePath();
}

function drawBall(ball) {
    if (!ball.active) return;
    
    const skin = getCurrentBallSkin();
    const isRainbow = skin.id === 'rainbow' && Math.floor(Date.now() / 100) % 2 === 0;
    const ballColor = isRainbow ? `hsl(${(Date.now() / 20) % 360}, 100%, 50%)` : (ball.fireball ? '#ff8800' : skin.color);
    const ballGlowColor = isRainbow ? '#ffffff' : (ball.fireball ? '#ff4400' : skin.glowColor);
    const ballTrailColor = isRainbow ? `hsl(${(Date.now() / 20 + 180) % 360}, 100%, 70%)` : (ball.fireball ? '#ff6600' : skin.trailColor);
    
    ball.trail.push({ x: ball.x, y: ball.y, alpha: 1 });
    if (ball.trail.length > 12) ball.trail.shift();
    
    for (let i = 0; i < ball.trail.length; i++) {
        const t = ball.trail[i];
        const alpha = (i / ball.trail.length) * 0.6;
        const size = (i / ball.trail.length) * ball.radius;
        
        ctx.beginPath();
        ctx.arc(t.x, t.y, size, 0, Math.PI * 2);
        ctx.fillStyle = isRainbow ? `hsl(${(i * 20 + Date.now() / 10) % 360}, 100%, 70%)` : ballTrailColor;
        ctx.globalAlpha = alpha;
        ctx.fill();
        ctx.closePath();
    }
    
    ctx.globalAlpha = 1;
    ctx.shadowBlur = ball.fireball ? 15 : 12;
    ctx.shadowColor = ballGlowColor;
    
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = ballColor;
    ctx.fill();
    ctx.closePath();
    
    ctx.shadowBlur = 0;
    
    ctx.beginPath();
    ctx.arc(ball.x - 2, ball.y - 2, ball.radius / 2, 0, Math.PI * 2);
    ctx.fillStyle = isRainbow ? '#ffffff' : (ball.fireball ? '#ffcc00' : skin.trailColor);
    ctx.fill();
    ctx.closePath();
}

function drawBricks() {
    for (let c = 0; c < BRICK_COLUMN_COUNT; c++) {
        for (let r = 0; r < bricks[c].length; r++) {
            if (bricks[c][r].status === 1) {
                const brickX = c * (BRICK_WIDTH + BRICK_PADDING) + BRICK_OFFSET_LEFT;
                const brickY = r * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_OFFSET_TOP;
                bricks[c][r].x = brickX;
                bricks[c][r].y = brickY;

                ctx.beginPath();
                ctx.roundRect(brickX, brickY, BRICK_WIDTH, BRICK_HEIGHT, 4);
                ctx.fillStyle = bricks[c][r].color;
                ctx.fill();
                ctx.closePath();

                ctx.beginPath();
                ctx.roundRect(brickX + 2, brickY + 2, BRICK_WIDTH - 4, BRICK_HEIGHT - 4, 2);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.fill();
                ctx.closePath();
            }
        }
    }
}

function collisionDetection(ball) {
    const now = Date.now();
    let hitThisFrame = false;
    
    for (let c = 0; c < BRICK_COLUMN_COUNT; c++) {
        for (let r = 0; r < bricks[c].length; r++) {
            const b = bricks[c][r];
            if (b.status === 1) {
                if (ball.x + ball.radius > b.x &&
                    ball.x - ball.radius < b.x + BRICK_WIDTH &&
                    ball.y + ball.radius > b.y &&
                    ball.y - ball.radius < b.y + BRICK_HEIGHT) {
                    
                    if (!ball.fireball) {
                        ball.dy = -ball.dy;
                    }
                    
                    b.status = 0;
                    totalBricksBroken++;
                    
                    const hitTime = now - lastHitTime;
                    if (hitTime < 500) {
                        comboCount++;
                        if (comboCount > 1) {
                            playSound('combo', 1 + comboCount * 0.1);
                            addFloatingText(b.x + BRICK_WIDTH / 2, b.y, `${comboCount}x COMBO!`, '#feca57');
                        }
                    } else {
                        comboCount = 1;
                    }
                    lastHitTime = now;
                    
                    const comboMultiplier = Math.min(comboCount, 10);
                    const points = 10 * comboMultiplier;
                    score += points;
                    updateUI();
                    
                    playSound('brick', 1 + comboCount * 0.05);
                    createParticles(b.x + BRICK_WIDTH / 2, b.y + BRICK_HEIGHT / 2, b.color, ball.fireball ? 25 : 15);
                    screenShake = ball.fireball ? 8 : 5;
                    
                    spawnPowerUp(b.x + BRICK_WIDTH / 2, b.y + BRICK_HEIGHT / 2);
                    
                    hitThisFrame = true;
                    
                    if (checkWin()) {
                        level++;
                        difficultyMultiplier = 1 + (level - 1) * 0.15;
                        addFloatingText(GAME_WIDTH / 2, GAME_HEIGHT / 2, `LEVEL ${level}!`, '#48dbfb');
                        createBricks();
                        resetBall();
                        for (const ball of balls) {
                            ball.dx *= 1.1;
                            ball.dy *= 1.1;
                        }
                    }
                }
            }
        }
    }
    
    return hitThisFrame;
}

function checkWin() {
    for (let c = 0; c < BRICK_COLUMN_COUNT; c++) {
        for (let r = 0; r < bricks[c].length; r++) {
            if (bricks[c][r].status === 1) {
                return false;
            }
        }
    }
    return true;
}

function movePaddle() {
    if (rightPressed && paddle.x < GAME_WIDTH - paddle.width) {
        paddle.x += paddle.speed;
    } else if (leftPressed && paddle.x > 0) {
        paddle.x -= paddle.speed;
    }
}

function moveBall(ball) {
    if (!ball.active) {
        ball.x = paddle.x + paddle.width / 2;
        ball.y = paddle.y - ball.radius - 2;
        return;
    }

    ball.x += ball.dx;
    ball.y += ball.dy;

    if (ball.x + ball.radius > GAME_WIDTH || ball.x - ball.radius < 0) {
        ball.dx = -ball.dx;
        playSound('wall');
    }

    if (ball.y - ball.radius < 0) {
        ball.dy = -ball.dy;
        playSound('wall');
    }

    if (ball.y + ball.radius > GAME_HEIGHT) {
        return false;
    }

    if (ball.x > paddle.x &&
        ball.x < paddle.x + paddle.width &&
        ball.y + ball.radius > paddle.y &&
        ball.y - ball.radius < paddle.y + paddle.height) {
        const hitPoint = (ball.x - paddle.x) / paddle.width;
        const angle = hitPoint * Math.PI - Math.PI / 2;
        const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
        ball.dx = speed * Math.cos(angle) * 0.85;
        ball.dy = -Math.abs(speed * Math.sin(angle));
        ball.y = paddle.y - ball.radius - 1;
        
        playSound('paddle');
        screenShake = 3;
        createParticles(ball.x, ball.y, '#fff', 8);
    }

    collisionDetection(ball);
    return true;
}

function showOverlay(title, subtitle, className = '') {
    overlayTitle.textContent = title;
    overlaySubtitle.textContent = subtitle;
    overlayTitle.className = className;
    overlay.classList.remove('hidden');
}

function hideOverlay() {
    overlay.classList.add('hidden');
}

function draw() {
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    applyScreenShake();
    drawBricks();
    drawPaddle();
    for (const ball of balls) {
        drawBall(ball);
    }
    drawPowerUps();
    drawParticles();
    drawFloatingTexts();
    restoreScreenShake();
}

function update() {
    if (gameState === 'playing') {
        movePaddle();
        updatePowerUpTimers();
        updateCombo();
        
        for (let i = balls.length - 1; i >= 0; i--) {
            const alive = moveBall(balls[i]);
            if (!alive) {
                if (balls[i].trail) {
                    createParticles(balls[i].x, balls[i].y, balls[i].fireball ? '#ff6600' : '#a2d2ff', 20);
                }
                balls.splice(i, 1);
            }
        }
        
        if (balls.length === 0) {
            lives--;
            updateUI();
            playSound('lose');
            screenShake = 15;
            comboCount = 0;
            
            if (lives <= 0) {
                gameState = 'gameover';
                if (score > highScore) {
                    highScore = score;
                    localStorage.setItem('ballBreakersHighScore', highScore);
                }
                checkAchievements();
                showOverlay('GAME OVER', `Score: ${score} | High Score: ${highScore}\nPress SPACE to restart`, 'game-over');
            } else {
                resetBall();
            }
        }
        
        updateParticles();
        updatePowerUps();
        updateFloatingTexts();
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function startGame() {
    initAudio();
    checkAchievements();
    if (gameState === 'start' || gameState === 'gameover' || gameState === 'victory') {
        initGame();
        for (const ball of balls) {
            ball.active = true;
        }
        gameState = 'playing';
        hideOverlay();
    } else if (gameState === 'paused') {
        gameState = 'playing';
        hideOverlay();
    }
}

function togglePause() {
    if (gameState === 'playing') {
        gameState = 'paused';
        showOverlay('PAUSED', 'Press P to resume');
    } else if (gameState === 'paused') {
        gameState = 'playing';
        hideOverlay();
    }
}

function showShop() {
    shopVisible = true;
    gameState = 'shop';
    showMainMenuOverlay();
}

function closeShop() {
    shopVisible = false;
    gameState = 'start';
    showMainMenuOverlay();
}

function showStats() {
    gameState = 'stats';
    showMainMenuOverlay();
}

function closeStats() {
    gameState = 'start';
    showMainMenuOverlay();
}

function showMainMenuOverlay() {
    if (gameState === 'shop') {
        let shopHTML = `
            <div class="shop-container">
                <h1>🛒 COSMETICS SHOP</h1>
                <div class="shop-section">
                    <h2>🎱 Ball Skins</h2>
                    <div class="shop-items">
        `;
        
        BALL_SKINS.forEach(skin => {
            const isSelected = selectedBallSkin === skin.id;
            const unlocked = skin.unlocked;
            const reqText = skin.requirement ? (skin.requirement.type === 'score' ? `${skin.requirement.value} pts` : `Level ${skin.requirement.value}`) : 'Unlocked';
            shopHTML += `
                <div class="shop-item ${isSelected ? 'selected' : ''} ${unlocked ? 'unlocked' : 'locked'}" 
                     onclick="${unlocked ? `selectBallSkin('${skin.id}'); showShop();` : ''}">
                    <div class="item-preview" style="background: ${skin.color}; box-shadow: 0 0 10px ${skin.glowColor};"></div>
                    <span>${skin.name}</span>
                    <small>${unlocked ? (isSelected ? '✓ Selected' : 'Click to select') : `Locked: ${reqText}`}</small>
                </div>
            `;
        });
        
        shopHTML += `
                    </div>
                </div>
                <div class="shop-section">
                    <h2>🏓 Paddle Skins</h2>
                    <div class="shop-items">
        `;
        
        PADDLE_SKINS.forEach(skin => {
            const isSelected = selectedPaddleSkin === skin.id;
            const unlocked = skin.unlocked;
            const reqText = skin.requirement ? (skin.requirement.type === 'score' ? `${skin.requirement.value} pts` : `Level ${skin.requirement.value}`) : 'Unlocked';
            shopHTML += `
                <div class="shop-item ${isSelected ? 'selected' : ''} ${unlocked ? 'unlocked' : 'locked'}" 
                     onclick="${unlocked ? `selectPaddleSkin('${skin.id}'); showShop();` : ''}">
                    <div class="item-preview" style="background: linear-gradient(45deg, ${skin.color}, ${skin.secondaryColor});"></div>
                    <span>${skin.name}</span>
                    <small>${unlocked ? (isSelected ? '✓ Selected' : 'Click to select') : `Locked: ${reqText}`}</small>
                </div>
            `;
        });
        
        shopHTML += `
                    </div>
                </div>
                <div class="shop-section">
                    <h2>✨ Particle Effects</h2>
                    <div class="shop-items">
        `;
        
        PARTICLE_STYLES.forEach(style => {
            const isSelected = selectedParticleStyle === style.id;
            const unlocked = style.unlocked;
            const reqText = style.requirement ? (style.requirement.type === 'score' ? `${style.requirement.value} pts` : `Level ${style.requirement.value}`) : 'Unlocked';
            shopHTML += `
                <div class="shop-item ${isSelected ? 'selected' : ''} ${unlocked ? 'unlocked' : 'locked'}" 
                     onclick="${unlocked ? `selectParticleStyle('${style.id}'); showShop();` : ''}">
                    <div class="item-preview" style="background: ${style.id === 'stars' ? '#ffd700' : style.id === 'bubbles' ? '#00ccff' : style.id === 'confetti' ? '#ff69b4' : style.id === 'energy' ? '#00ff00' : '#ff6b6b'};"></div>
                    <span>${style.name}</span>
                    <small>${unlocked ? (isSelected ? '✓ Selected' : 'Click to select') : `Locked: ${reqText}`}</small>
                </div>
            `;
        });
        
        shopHTML += `
                    </div>
                </div>
                <div class="shop-section">
                    <h2>🏆 Achievements</h2>
                    <div class="achievements-grid">
        `;
        
        achievements.forEach(ach => {
            shopHTML += `
                <div class="achievement ${ach.unlocked ? 'unlocked' : 'locked'}">
                    <span class="achievement-icon">${ach.unlocked ? ach.icon : '🔒'}</span>
                    <span class="achievement-name">${ach.name}</span>
                    <span class="achievement-desc">${ach.description}</span>
                </div>
            `;
        });
        
        shopHTML += `
                    </div>
                </div>
                <div class="menu-buttons">
                    <button class="menu-btn" onclick="closeShop()">← Back to Menu</button>
                    <button class="menu-btn stats-btn" onclick="showStats()">📊 Stats</button>
                </div>
            </div>
        `;
        
        overlay.innerHTML = shopHTML;
        overlay.classList.remove('hidden');
    } else if (gameState === 'stats') {
        const statsHTML = `
            <div class="stats-container">
                <h1>📊 STATS</h1>
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-value">${score}</span>
                        <span class="stat-label">Score</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${highScore}</span>
                        <span class="stat-label">High Score</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${level}</span>
                        <span class="stat-label">Level</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${comboCount}</span>
                        <span class="stat-label">Max Combo</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${totalBricksBroken}</span>
                        <span class="stat-label">Bricks Broken</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${achievements.filter(a => a.unlocked).length}/${achievements.length}</span>
                        <span class="stat-label">Achievements</span>
                    </div>
                </div>
                <div class="menu-buttons">
                    <button class="menu-btn" onclick="closeStats()">← Back to Menu</button>
                    <button class="menu-btn shop-btn" onclick="showShop()">🛒 Shop</button>
                </div>
            </div>
        `;
        overlay.innerHTML = statsHTML;
        overlay.classList.remove('hidden');
    } else {
        overlay.innerHTML = `
            <div class="overlay-content">
                <h1 id="overlayTitle">BALL BREAKERS</h1>
                <p id="overlaySubtitle">Press SPACE to Start</p>
                <div class="controls">
                    <p>← → or A/D to move paddle</p>
                    <p>P to pause</p>
                    <p>S for Shop</p>
                    <p>I for Stats</p>
                </div>
            </div>
        `;
        overlay.classList.remove('hidden');
    }
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Right' || e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        rightPressed = true;
    }
    if (e.key === 'Left' || e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        leftPressed = true;
    }
    if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        if (gameState === 'start' || gameState === 'gameover' || gameState === 'victory') {
            startGame();
        }
    }
    if (e.key === 'p' || e.key === 'P') {
        togglePause();
    }
    if (e.key === 's' || e.key === 'S') {
        if (gameState === 'start') {
            showShop();
        }
    }
    if (e.key === 'i' || e.key === 'I') {
        if (gameState === 'start') {
            showStats();
        }
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'Right' || e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        rightPressed = false;
    }
    if (e.key === 'Left' || e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        leftPressed = false;
    }
});

loadProgress();
createBricks();
draw();
showMainMenuOverlay();
gameLoop();
