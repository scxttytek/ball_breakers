# Ball Breakers

A modern arcade Breakout-style game built with HTML5 Canvas and vanilla JavaScript.

## 🎮 Features

- Classic Breakout gameplay with modern visuals
- 8 unlockable ball skins
- 6 unlockable paddle designs
- 5 particle effect styles
- 8 achievements to unlock cosmetics
- Combo scoring system
- Progressive difficulty levels
- Power-ups: Multi-ball, Expand, Shrink, Fireball, Slow, Extra Life
- Sound effects using Web Audio API
- Persistent progress with localStorage

## 🐳 Docker Deployment

### Quick Start with Docker Compose

```bash
docker-compose up -d
```

Then open http://localhost:8080 in your browser.

### Manual Docker Build & Run

```bash
# Build the image
docker build -t ball-breakers .

# Run the container
docker run -d -p 8080:80 --name ball-breakers ball-breakers
```

### Stop the Container

```bash
docker-compose down
# or
docker stop ball-breakers && docker rm ball-breakers
```

## 🎮 Controls

- **Arrow Keys / A,D** - Move paddle
- **SPACE** - Start game / Launch ball
- **P** - Pause game
- **S** - Open Shop
- **I** - View Stats

## 🔧 Development

Open `index.html` directly in a browser, or serve with any local web server:

```bash
# Using Python
python3 -m http.server 8000

# Using Node.js
npx serve .

# Using PHP
php -S localhost:8000
```

## 📁 Project Structure

```
ball-breakers/
├── index.html      # Main HTML file
├── styles.css      # Game styling
├── game.js         # Game logic
├── Dockerfile      # Docker configuration
├── docker-compose.yml
└── README.md
```

## 🏆 Achievements

| Achievement | Description | Reward |
|-------------|-------------|--------|
| First Break | Break your first brick | - |
| On Fire | Get a 5x combo | Fire Ball skin |
| Unstoppable | Get a 10x combo | Plasma Ball skin |
| Rising Star | Reach level 5 | Shadow Ball skin |
| Master | Reach level 10 | - |
| High Scorer | Score 5000 points | Rainbow Ball skin |
| Double Trouble | Use multiball | - |
| Hot Shot | Use fireball | - |

## 🎨 Unlock Requirements

| Requirement | Skins Unlocked |
|-------------|---------------|
| Score 500 | Fire Ball |
| Level 3 | Ice Ball, Stars particles |
| 5x Combo | Neon Ball |
| Score 2000 | Gold Ball, Ocean Paddle |
| Level 5 | Shadow Ball |
| 10x Combo | Plasma Ball, Energy particles |
| Score 3000 | Cyber Paddle |
| Score 5000 | Rainbow Ball, Confetti particles |
| 8x Combo | Golden Paddle |

## 📝 License

MIT License - Feel free to use and modify!
