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

let paddle = {
    x: GAME_WIDTH / 2 - PADDLE_WIDTH / 2,
    y: GAME_HEIGHT - 40,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    dx: 0,
    speed: 8,
    baseWidth: PADDLE_WIDTH,
    glowIntensity: 0,
    activePowerUps: {}
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
    }
}

function createParticles(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            dx: (Math.random() - 0.5) * 10,
            dy: (Math.random() - 0.5) * 10,
            radius: Math.random() * 5 + 2,
            color: color,
            life: 1,
            decay: Math.random() * 0.025 + 0.015
        });
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
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * p.life, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fill();
        ctx.closePath();
    }
    ctx.globalAlpha = 1;
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
    mainBall.fireball = paddle.activePowerUps.fireball ? true : false;
}

function updateUI() {
    scoreElement.textContent = score;
    livesElement.textContent = lives;
}

function drawPaddle() {
    let glowColor = '#e94560';
    if (paddle.activePowerUps.fireball) glowColor = '#ff6b6b';
    else if (paddle.activePowerUps.expand) glowColor = '#1dd1a1';
    else if (paddle.activePowerUps.shrink) glowColor = '#ee5a24';
    
    paddle.glowIntensity = Math.min(paddle.glowIntensity + 0.1, 0.6);
    
    ctx.shadowBlur = 20 * paddle.glowIntensity;
    ctx.shadowColor = glowColor;
    
    ctx.beginPath();
    ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 5);
    ctx.fillStyle = glowColor;
    ctx.fill();
    ctx.closePath();
    
    ctx.beginPath();
    ctx.roundRect(paddle.x + 3, paddle.y + 3, paddle.width - 6, paddle.height - 6, 3);
    ctx.fillStyle = '#ff6b6b';
    ctx.fill();
    ctx.closePath();
    
    ctx.shadowBlur = 0;
    
    ctx.beginPath();
    ctx.roundRect(paddle.x + paddle.width / 2 - 5, paddle.y - 2, 10, 4, 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.closePath();
}

function drawBall(ball) {
    if (!ball.active) return;
    
    ball.trail.push({ x: ball.x, y: ball.y, alpha: 1 });
    if (ball.trail.length > 12) ball.trail.shift();
    
    for (let i = 0; i < ball.trail.length; i++) {
        const t = ball.trail[i];
        const alpha = (i / ball.trail.length) * 0.6;
        const size = (i / ball.trail.length) * ball.radius;
        
        ctx.beginPath();
        ctx.arc(t.x, t.y, size, 0, Math.PI * 2);
        ctx.fillStyle = ball.fireball ? `rgba(255, 100, 50, ${alpha})` : `rgba(162, 210, 255, ${alpha})`;
        ctx.fill();
        ctx.closePath();
    }
    
    ctx.shadowBlur = ball.fireball ? 15 : 10;
    ctx.shadowColor = ball.fireball ? '#ff4400' : '#48dbfb';
    
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = ball.fireball ? '#ff8800' : '#fff';
    ctx.fill();
    ctx.closePath();
    
    ctx.shadowBlur = 0;
    
    ctx.beginPath();
    ctx.arc(ball.x - 2, ball.y - 2, ball.radius / 2, 0, Math.PI * 2);
    ctx.fillStyle = ball.fireball ? '#ffcc00' : '#a2d2ff';
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

document.addEventListener('keydown', (e) => {
    if (e.key === 'Right' || e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        rightPressed = true;
    }
    if (e.key === 'Left' || e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        leftPressed = true;
    }
    if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        startGame();
    }
    if (e.key === 'p' || e.key === 'P') {
        togglePause();
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

createBricks();
draw();
showOverlay('BALL BREAKERS', 'Press SPACE to start');
gameLoop();
