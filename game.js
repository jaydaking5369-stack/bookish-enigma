// ============================================
// REALISTIC CREATURE GAME - OPEN WORLD MAP
// ============================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Canvas setup
canvas.width = window.innerWidth;
canvas.height = window.innerHeight - 120;

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 120;
});

// ============================================
// GAME STATE
// ============================================

const gameState = {
    player: {
        x: canvas.width / 2,
        y: canvas.height / 2,
        width: 30,
        height: 40,
        speed: 3,
        health: 100,
        direction: 'down'
    },
    camera: {
        x: 0,
        y: 0
    },
    worldSize: {
        width: 3000,
        height: 3000
    },
    creaturesCaught: 0,
    input: {
        up: false,
        down: false,
        left: false,
        right: false
    }
};

// ============================================
// TILE MAP (Realistic Biome Generation)
// ============================================

const TILE_SIZE = 40;
const BIOME_TYPES = {
    GRASS: { color: '#2d5016', name: 'Grassland' },
    FOREST: { color: '#1a3a1a', name: 'Forest' },
    WATER: { color: '#4a90e2', name: 'Water' },
    MOUNTAIN: { color: '#8b7355', name: 'Mountain' },
    SAND: { color: '#daa520', name: 'Desert' }
};

function generateTileMap() {
    const tileMap = [];
    const tilesX = gameState.worldSize.width / TILE_SIZE;
    const tilesY = gameState.worldSize.height / TILE_SIZE;

    for (let y = 0; y < tilesY; y++) {
        tileMap[y] = [];
        for (let x = 0; x < tilesX; x++) {
            // Perlin-like noise using simple sine/cosine patterns
            const noise = Math.sin(x * 0.05) * Math.cos(y * 0.05);
            let biome;

            if (noise > 0.5) biome = BIOME_TYPES.FOREST;
            else if (noise > 0.2) biome = BIOME_TYPES.GRASS;
            else if (noise > -0.2) biome = BIOME_TYPES.WATER;
            else if (noise > -0.5) biome = BIOME_TYPES.SAND;
            else biome = BIOME_TYPES.MOUNTAIN;

            tileMap[y][x] = biome;
        }
    }

    return tileMap;
}

const tileMap = generateTileMap();

// ============================================
// CREATURES (Realistic Wildlife)
// ============================================

class Creature {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = type.width;
        this.height = type.height;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.speed = type.speed;
        this.roamRadius = 200;
        this.startX = x;
        this.startY = y;
        this.health = type.health;
    }

    update() {
        // Simple AI: Random walk with tendency to return home
        if (Math.random() < 0.02) {
            this.vx = (Math.random() - 0.5) * 2;
            this.vy = (Math.random() - 0.5) * 2;
        }

        // Return to starting location
        const distToHome = Math.hypot(this.x - this.startX, this.y - this.startY);
        if (distToHome > this.roamRadius) {
            this.vx += (this.startX - this.x) * 0.0005;
            this.vy += (this.startY - this.y) * 0.0005;
        }

        this.x += this.vx * this.speed;
        this.y += this.vy * this.speed;

        // Boundary check
        this.x = Math.max(0, Math.min(gameState.worldSize.width - this.width, this.x));
        this.y = Math.max(0, Math.min(gameState.worldSize.height - this.height, this.y));
    }

    draw(ctx) {
        ctx.fillStyle = this.type.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Draw eyes
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x + 5, this.y + 5, 5, 5);
        ctx.fillRect(this.x + this.width - 10, this.y + 5, 5, 5);
    }
}

const CREATURE_TYPES = {
    DEER: {
        color: '#8B4513',
        width: 40,
        height: 25,
        speed: 1.5,
        health: 30,
        name: 'Deer',
        rarity: 'common'
    },
    WOLF: {
        color: '#696969',
        width: 35,
        height: 20,
        speed: 2,
        health: 50,
        name: 'Wolf',
        rarity: 'uncommon'
    },
    EAGLE: {
        color: '#8B4513',
        width: 30,
        height: 35,
        speed: 3,
        health: 25,
        name: 'Eagle',
        rarity: 'uncommon'
    },
    BEAR: {
        color: '#5C4033',
        width: 50,
        height: 40,
        speed: 1.2,
        health: 80,
        name: 'Bear',
        rarity: 'rare'
    },
    RABBIT: {
        color: '#D2B48C',
        width: 20,
        height: 15,
        speed: 2.5,
        health: 15,
        name: 'Rabbit',
        rarity: 'common'
    }
};

let creatures = [];

function spawnCreatures() {
    for (let i = 0; i < 50; i++) {
        const x = Math.random() * gameState.worldSize.width;
        const y = Math.random() * gameState.worldSize.height;
        const typeKey = Object.keys(CREATURE_TYPES)[Math.floor(Math.random() * Object.keys(CREATURE_TYPES).length)];
        creatures.push(new Creature(x, y, CREATURE_TYPES[typeKey]));
    }
}

spawnCreatures();

// ============================================
// INPUT HANDLING
// ============================================

// Keyboard
document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'w' || e.key === 'ArrowUp') gameState.input.up = true;
    if (e.key.toLowerCase() === 's' || e.key === 'ArrowDown') gameState.input.down = true;
    if (e.key.toLowerCase() === 'a' || e.key === 'ArrowLeft') gameState.input.left = true;
    if (e.key.toLowerCase() === 'd' || e.key === 'ArrowRight') gameState.input.right = true;
    if (e.key === ' ') attemptCatch();
    if (e.key.toLowerCase() === 'e') interact();
});

document.addEventListener('keyup', (e) => {
    if (e.key.toLowerCase() === 'w' || e.key === 'ArrowUp') gameState.input.up = false;
    if (e.key.toLowerCase() === 's' || e.key === 'ArrowDown') gameState.input.down = false;
    if (e.key.toLowerCase() === 'a' || e.key === 'ArrowLeft') gameState.input.left = false;
    if (e.key.toLowerCase() === 'd' || e.key === 'ArrowRight') gameState.input.right = false;
});

// Touch/Mobile Controls
document.getElementById('btnUp').addEventListener('touchstart', () => gameState.input.up = true);
document.getElementById('btnUp').addEventListener('touchend', () => gameState.input.up = false);

document.getElementById('btnDown').addEventListener('touchstart', () => gameState.input.down = true);
document.getElementById('btnDown').addEventListener('touchend', () => gameState.input.down = false);

document.getElementById('btnLeft').addEventListener('touchstart', () => gameState.input.left = true);
document.getElementById('btnLeft').addEventListener('touchend', () => gameState.input.left = false);

document.getElementById('btnRight').addEventListener('touchstart', () => gameState.input.right = true);
document.getElementById('btnRight').addEventListener('touchend', () => gameState.input.right = false);

document.getElementById('btnInteract').addEventListener('click', interact);
document.getElementById('btnCatch').addEventListener('click', attemptCatch);

// ============================================
// GAME MECHANICS
// ============================================

function attemptCatch() {
    let nearbyCreature = null;
    const catchRange = 80;

    for (let creature of creatures) {
        const dist = Math.hypot(
            creature.x - gameState.player.x,
            creature.y - gameState.player.y
        );
        if (dist < catchRange) {
            nearbyCreature = creature;
            break;
        }
    }

    if (nearbyCreature) {
        const catchChance = Math.random();
        const rarity = nearbyCreature.type.rarity;
        const successRate = rarity === 'common' ? 0.7 : rarity === 'uncommon' ? 0.5 : 0.3;

        if (catchChance < successRate) {
            gameState.creaturesCaught++;
            creatures = creatures.filter(c => c !== nearbyCreature);
            console.log(`Caught ${nearbyCreature.type.name}! Total: ${gameState.creaturesCaught}`);
        } else {
            console.log('Catch failed! The creature escaped.');
        }
    }
}

function interact() {
    console.log('Interacting with the environment...');
    // Future: Inspect creatures, gather items, etc.
}

// ============================================
// UPDATE LOOP
// ============================================

function update() {
    // Player movement
    if (gameState.input.up) {
        gameState.player.y -= gameState.player.speed;
        gameState.player.direction = 'up';
    }
    if (gameState.input.down) {
        gameState.player.y += gameState.player.speed;
        gameState.player.direction = 'down';
    }
    if (gameState.input.left) {
        gameState.player.x -= gameState.player.speed;
        gameState.player.direction = 'left';
    }
    if (gameState.input.right) {
        gameState.player.x += gameState.player.speed;
        gameState.player.direction = 'right';
    }

    // Player boundary
    gameState.player.x = Math.max(0, Math.min(gameState.worldSize.width - gameState.player.width, gameState.player.x));
    gameState.player.y = Math.max(0, Math.min(gameState.worldSize.height - gameState.player.height, gameState.player.y));

    // Update camera (center on player)
    gameState.camera.x = gameState.player.x - canvas.width / 2 + gameState.player.width / 2;
    gameState.camera.y = gameState.player.y - canvas.height / 2 + gameState.player.height / 2;

    // Clamp camera
    gameState.camera.x = Math.max(0, Math.min(gameState.worldSize.width - canvas.width, gameState.camera.x));
    gameState.camera.y = Math.max(0, Math.min(gameState.worldSize.height - canvas.height, gameState.camera.y));

    // Update creatures
    creatures.forEach(creature => creature.update());

    // Update UI
    document.getElementById('posX').textContent = Math.floor(gameState.player.x);
    document.getElementById('posY').textContent = Math.floor(gameState.player.y);
    document.getElementById('creatureCount').textContent = gameState.creaturesCaught;
}

// ============================================
// RENDER LOOP
// ============================================

function draw() {
    // Clear canvas
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Save context
    ctx.save();
    ctx.translate(-gameState.camera.x, -gameState.camera.y);

    // Draw tile map
    const startTileX = Math.floor(gameState.camera.x / TILE_SIZE);
    const startTileY = Math.floor(gameState.camera.y / TILE_SIZE);
    const endTileX = Math.ceil((gameState.camera.x + canvas.width) / TILE_SIZE);
    const endTileY = Math.ceil((gameState.camera.y + canvas.height) / TILE_SIZE);

    for (let ty = startTileY; ty < endTileY; ty++) {
        for (let tx = startTileX; tx < endTileX; tx++) {
            if (tileMap[ty] && tileMap[ty][tx]) {
                ctx.fillStyle = tileMap[ty][tx].color;
                ctx.fillRect(tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }
    }

    // Draw creatures
    creatures.forEach(creature => creature.draw(ctx));

    // Draw player
    ctx.fillStyle = '#FF6B6B';
    ctx.fillRect(gameState.player.x, gameState.player.y, gameState.player.width, gameState.player.height);
    
    // Player eyes
    ctx.fillStyle = '#fff';
    ctx.fillRect(gameState.player.x + 5, gameState.player.y + 5, 8, 8);
    ctx.fillRect(gameState.player.x + gameState.player.width - 13, gameState.player.y + 5, 8, 8);
    ctx.fillStyle = '#000';
    ctx.fillRect(gameState.player.x + 7, gameState.player.y + 7, 4, 4);
    ctx.fillRect(gameState.player.x + gameState.player.width - 11, gameState.player.y + 7, 4, 4);

    // Restore context
    ctx.restore();

    // Draw catch radius (debug)
    ctx.strokeStyle = 'rgba(255, 200, 0, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 80, 0, Math.PI * 2);
    ctx.stroke();
}

// ============================================
// MAIN GAME LOOP
// ============================================

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();