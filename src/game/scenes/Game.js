import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

export class Game extends Scene
{
    constructor ()
    {
        super('Game');
        // Game configuration
        this.config = {
            grid: {
                size: 64,    // Size of each grid cell in pixels
                width: 16,   // Number of cells horizontally
                height: 9    // Number of cells vertically
            },
            timing: {
                initialGameDelay: 1000,    // Delay before starting game
                enemySpawnInterval: 1000,   // Time between enemy spawns
                turretFireRate: 1200,      // Time between turret shots
                bulletLifespan: 2000       // How long bullets live
            },
            speeds: {
                baseEnemySpeed: 1/10000,   // Base speed for enemies
                enemy2SpeedMultiplier: 1.5, // Speed multiplier for enemy2
                enemySpeedVariation: 0.2,   // ±20% random speed variation
                bulletSpeed: 300,          // Pixels per second
                bulletTurnRate: 0.03       // How fast bullets can turn
            },
            gameplay: {
                startingMoney: 100,
                turretCost: 50,
                killReward: 10,
                killScore: 10,
                bulletDamage: 40          // Add bullet damage to config
            }
        };

        // Initialize game state using config
        this.gridSize = this.config.grid.size;
        this.grid = {
            width: this.config.grid.width,
            height: this.config.grid.height
        };
        
        // Generate path
        const pathGen = new PathGenerator(this.grid.width, this.grid.height);
        this.waypoints = pathGen.generatePath();

        // Add enemy spawning properties
        this.enemies = []; // Initialize the enemies array

        this.turrets = []; // Array to store all turrets
        this.gridCells = []; // Array to store grid cell data

        this.score = 0;
        this.money = this.config.gameplay.startingMoney;
        this.escapedEnemies = 0;  // Add counter for escaped enemies

        // Persistent game state
        this.level = 1;
    }

    generatePath(start, end) {
        const waypoints = [start];
        let current = {...start};
        
        while (current.x < end.x) {
            // Decide whether to move horizontally or vertically
            if (Math.random() < 0.5 && current.x < end.x) {
                // Move horizontally
                const moveX = Math.min(3, end.x - current.x); // Move up to 3 cells at a time
                current = {
                    x: current.x + moveX,
                    y: current.y
                };
            } else {
                // Move vertically
                const moveY = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
                current = {
                    x: current.x,
                    y: Math.max(1, Math.min(7, current.y + moveY)) // Keep within bounds
                };
            }
            waypoints.push({...current});
        }
        
        // Ensure we end at the right point
        waypoints.push(end);
        
        return waypoints;
    }

    create ()
    {
        // Generate random colors
        const backgroundColors = [
            0x2e8b57,  // Sea green (original)
            0x3cb371,  // Medium sea green
            0x228b22,  // Forest green
            0x556b2f,  // Dark olive green
            0x8fbc8f,  // Dark sea green
            0x90ee90,  // Light green
            0x98fb98   // Pale green
        ];
        
        const pathColors = [
            0xcd853f,  // Sandy brown (original)
            0xdeb887,  // Burlywood
            0xd2691e,  // Chocolate
            0x8b4513,  // Saddle brown
            0xa0522d,  // Sienna
            0xbc8f8f,  // Rosy brown
            0xf4a460   // Sandy brown
        ];

        // Randomly select colors
        const backgroundColor = Phaser.Utils.Array.GetRandom(backgroundColors);
        const pathColor = Phaser.Utils.Array.GetRandom(pathColors);

        // Add grass background with random color
        const background = this.add.rectangle(
            0, 
            0, 
            this.grid.width * this.gridSize,
            this.grid.height * this.gridSize,
            backgroundColor  // Use random background color
        );
        background.setOrigin(0, 0);

        // Draw dirt path with random color
        const pathGraphics = this.add.graphics();
        pathGraphics.fillStyle(pathColor, 1); // Use random path color

        // Fill path segments
        for (let i = 0; i < this.waypoints.length - 1; i++) {
            const start = this.waypoints[i];
            const end = this.waypoints[i + 1];
            
            // For vertical segments
            if (start.x === end.x) {
                const minY = Math.min(start.y, end.y);
                const maxY = Math.max(start.y, end.y);
                pathGraphics.fillRect(
                    start.x * this.gridSize,
                    minY * this.gridSize,
                    this.gridSize,
                    (maxY - minY + 1) * this.gridSize
                );
            }
            
            // For horizontal segments
            if (start.y === end.y) {
                const minX = Math.min(start.x, end.x);
                const maxX = Math.max(start.x, end.x);
                pathGraphics.fillRect(
                    minX * this.gridSize,
                    start.y * this.gridSize,
                    (maxX - minX + 1) * this.gridSize,
                    this.gridSize
                );
            }
        }

        // Draw grid (optional - comment out if you don't want grid lines)
        const gridGraphics = this.add.graphics();
        gridGraphics.lineStyle(1, 0x000000, 0.2);
        
        // Vertical lines
        for (let x = 0; x <= this.grid.width; x++) {
            gridGraphics.moveTo(x * this.gridSize, 0);
            gridGraphics.lineTo(x * this.gridSize, this.grid.height * this.gridSize);
        }
        
        // Horizontal lines
        for (let y = 0; y <= this.grid.height; y++) {
            gridGraphics.moveTo(0, y * this.gridSize);
            gridGraphics.lineTo(this.grid.width * this.gridSize, y * this.gridSize);
        }
        
        gridGraphics.strokePath();

        // Draw the new path
        const pathGraphics2 = this.add.graphics();
        pathGraphics2.lineStyle(3, 0xffffff, 1);

        // Create the path for enemies to follow
        this.path = new Phaser.Curves.Path(
            (this.waypoints[0].x * this.gridSize) + (this.gridSize / 2),
            (this.waypoints[0].y * this.gridSize) + (this.gridSize / 2)
        );

        // Add line segments to path
        for (let i = 1; i < this.waypoints.length; i++) {
            this.path.lineTo(
                (this.waypoints[i].x * this.gridSize) + (this.gridSize / 2),
                (this.waypoints[i].y * this.gridSize) + (this.gridSize / 2)
            );
        }

        // Draw the path
        // this.path.draw(pathGraphics2);

        // Initialize empty enemies array
        this.enemies = [];
        
        // Create first enemy
        // Create clickable grid cells
        for (let y = 0; y < this.grid.height; y++) {
            for (let x = 0; x < this.grid.width; x++) {
                const cellX = x * this.gridSize;
                const cellY = y * this.gridSize;
                
                const cell = this.add.rectangle(
                    cellX + this.gridSize/2,
                    cellY + this.gridSize/2,
                    this.gridSize,
                    this.gridSize,
                    0x666666,
                    0.1
                );
                
                cell.setInteractive();
                cell.on('pointerdown', () => this.placeTurret(x, y));
                
                // Store grid position in cell object
                cell.gridX = x;
                cell.gridY = y;
                this.gridCells.push(cell);
            }
        }

        // Create UI box
        const padding = 10;
        const uiBox = this.add.rectangle(
            padding, 
            padding, 
            200, 
            100, 
            0x000000, 
            0.5
        );
        uiBox.setOrigin(0, 0); // Align to top-left

        // Add text
        this.scoreText = this.add.text(
            padding + 10, 
            padding + 10, 
            'Score: 0', 
            { color: '#ffffff', fontSize: '16px' }
        );
        this.moneyText = this.add.text(
            padding + 10, 
            padding + 35, 
            'Money: $100', 
            { color: '#ffffff', fontSize: '16px' }
        );

        // Add text for escaped enemies count
        this.escapedText = this.add.text(
            padding + 10, 
            padding + 60, // Position below money text
            'Escaped: 0', 
            { color: '#ffffff', fontSize: '16px' }
        );

        // Add wave text display
        this.waveText = this.add.text(
            padding + 10,
            padding + 85, // Position below escaped text
            'Wave: 1/5',
            { color: '#ffffff', fontSize: '16px' }
        );

        // Update score when enemy dies (remove money addition)
        this.events.on('enemyKilled', (value) => {
            this.score += value;  // Only update score
            this.scoreText.setText(`Score: ${this.score}`);
        });

        // // Create a few invisible test enemies to warm up the engine
        // for (let i = 0; i < 5; i++) {
        //     const enemy = new Enemy(this, this.waypoints, 'BASIC');  // Specify 'BASIC' type
        //     enemy.setVisible(false);  // Make them invisible
        //     enemy.update(0, 16);      // Run update once
        //     enemy.destroy();          // Clean up
        // }

        // Wait a moment before starting the first wave
        this.time.delayedCall(1000, () => {
            this.enemySpawner = new EnemySpawner(this);
        });

        // Update the event listener to update the display
        this.events.on('enemyReachedEnd', () => {
            this.escapedEnemies++;
            this.escapedText.setText(`Escaped: ${this.escapedEnemies}`);
            console.log(`Enemies escaped: ${this.escapedEnemies}`);
        });

        this.moneyDrops = [];
        
        // Add auto-collect radius around the mouse
        const collectRadius = 50;
        this.input.on('pointermove', (pointer) => {
            this.moneyDrops.forEach(money => {
                if (Phaser.Math.Distance.Between(pointer.x, pointer.y, money.x, money.y) < collectRadius) {
                    money.collect();
                }
            });
        });

        // Create UI box for turret selection (adjusted position)
        const turretUIBox = this.add.rectangle(
            this.game.config.width - 210, // Moved further left
            padding,
            200,
            100, // Reduced height
            0x000000,
            0.5
        );
        turretUIBox.setOrigin(0, 0); // Changed origin to top-left

        // Add "Turrets:" text
        this.add.text(
            this.game.config.width - 200,
            padding + 10,
            'Turrets:',
            { color: '#ffffff', fontSize: '16px' }
        );

        // Create buttons for each turret type
        const turretButtons = [
            {
                type: 'BASIC',
                y: padding + 40,
                color: 0x00ff00,
                text: `Basic ($${TURRET_TYPES.BASIC.cost})`
            },
            {
                type: 'SNIPER',
                y: padding + 70, // Reduced spacing
                color: 0x0000ff,
                text: `Sniper ($${TURRET_TYPES.SNIPER.cost})`
            }
        ];

        // Selected turret type
        this.selectedTurretType = 'BASIC';

        // Create level display in center top
        const centerX = this.game.config.width / 2;
        this.levelText = this.add.text(
            centerX,
            padding + 10,
            `Level ${this.level}`,
            { 
                color: '#ffffff', 
                fontSize: '24px',
                fontWeight: 'bold'
            }
        ).setOrigin(0.5, 0); // Center align the text

        // Update turret button creation
        turretButtons.forEach(button => {
            const buttonWidth = 180;
            const buttonHeight = 30;
            
            // Create button background (adjusted position)
            const buttonBg = this.add.rectangle(
                this.game.config.width - 200,
                button.y,
                buttonWidth,
                buttonHeight,
                button.color,
                0.8
            );
            buttonBg.setOrigin(0, 0);
            buttonBg.setInteractive();

            // Add button text (adjusted position)
            const buttonText = this.add.text(
                this.game.config.width - 190,
                button.y + buttonHeight/2,
                button.text,
                { color: '#ffffff', fontSize: '14px' }
            );
            buttonText.setOrigin(0, 0.5);

            // Add click handler
            buttonBg.on('pointerdown', () => {
                this.selectedTurretType = button.type;
                
                // Update visual feedback
                turretButtons.forEach(b => {
                    const isSelected = b.type === button.type;
                    b.buttonBg.setAlpha(isSelected ? 1 : 0.8);
                });
            });

            // Store reference to button background
            button.buttonBg = buttonBg;
        });

        // Update other UI elements with persistent state
        this.scoreText.setText(`Score: ${this.score}`);
        this.moneyText.setText(`Money: $${this.money}`);
        this.escapedText.setText(`Escaped: ${this.escapedEnemies}`);

        EventBus.emit('current-scene-ready', this);
    }

    placeTurret(x, y) {
        const turretType = this.selectedTurretType;
        const config = TURRET_TYPES[turretType];
        const cost = config.cost;
        
        // Check if cell is empty and not on path
        if (this.canPlaceTurret(x, y) && this.money >= cost) {
            // Create confirmation dialog at tile position
            const dialogBox = this.add.rectangle(
                (x * this.gridSize) + this.gridSize,
                (y * this.gridSize) + this.gridSize/2,
                200,
                100,
                0x000000,
                0.8
            );
            
            const text = this.add.text(
                dialogBox.x,
                dialogBox.y - 20,
                `Spend $${cost} on ${turretType} turret?`,
                { color: '#ffffff', fontSize: '16px' }
            ).setOrigin(0.5);

            // Create buttons
            const yesButton = this.add.rectangle(
                dialogBox.x - 40,
                dialogBox.y + 20,
                60,
                30,
                0x00ff00,
                0.8
            ).setInteractive();
            
            const noButton = this.add.rectangle(
                dialogBox.x + 40,
                dialogBox.y + 20,
                60,
                30,
                0xff0000,
                0.8
            ).setInteractive();

            // Add button text
            const yesText = this.add.text(yesButton.x, yesButton.y, 'Yes', 
                { color: '#ffffff' }).setOrigin(0.5);
            const noText = this.add.text(noButton.x, noButton.y, 'No', 
                { color: '#ffffff' }).setOrigin(0.5);

            // Button handlers
            yesButton.on('pointerdown', () => {
                this.money -= cost;
                this.moneyText.setText(`Money: $${this.money}`);
                const turret = new Turret(
                    this,
                    x * this.gridSize + this.gridSize/2,
                    y * this.gridSize + this.gridSize/2,
                    turretType
                );
                this.turrets.push(turret);
                dialogBox.destroy();
                text.destroy();
                yesButton.destroy();
                noButton.destroy();
                yesText.destroy();
                noText.destroy();
            });

            noButton.on('pointerdown', () => {
                dialogBox.destroy();
                text.destroy();
                yesButton.destroy();
                noButton.destroy();
                yesText.destroy();
                noText.destroy();
            });
        } else if (this.money < cost) {
            // Show insufficient funds message near the tile
            const text = this.add.text(
                (x * this.gridSize) + this.gridSize/2,
                (y * this.gridSize) - 20,
                'Not enough money!',
                { color: '#ff0000', fontSize: '20px' }
            ).setOrigin(0.5);
            
            this.time.delayedCall(1000, () => text.destroy());
        }
    }

    canPlaceTurret(x, y) {
        // Check each path segment between waypoints
        for (let i = 0; i < this.waypoints.length - 1; i++) {
            const start = this.waypoints[i];
            const end = this.waypoints[i + 1];
            
            // Check if point is on vertical segment
            if (start.x === end.x && x === start.x) {
                const minY = Math.min(start.y, end.y);
                const maxY = Math.max(start.y, end.y);
                if (y >= minY && y <= maxY) return false;
            }
            
            // Check if point is on horizontal segment
            if (start.y === end.y && y === start.y) {
                const minX = Math.min(start.x, end.x);
                const maxX = Math.max(start.x, end.x);
                if (x >= minX && x <= maxX) return false;
            }
        }
        
        // Check if there's already a turret here
        const hasTurret = this.turrets.some(turret => 
            Math.floor(turret.x / this.gridSize) === x && 
            Math.floor(turret.y / this.gridSize) === y
        );
        
        return !hasTurret;
    }
    update(time, delta) {
        // Check if enemySpawner exists before updating
        if (this.enemySpawner) {
            this.enemySpawner.update(time, delta);
        }

        // Update all active enemies
        this.enemies = this.enemies.filter(enemy => enemy.active);
        this.enemies.forEach(enemy => enemy.update(time, delta));

        // Update all turrets
        this.turrets.forEach(turret => turret.update(time, delta));

        // Debug log
        if (this.turrets[0]?.targetEnemy) {
            console.log("Firing");
        }
    }

    // Optional: Add money cleanup when changing scenes
    shutdown() {
        this.moneyDrops.forEach(money => money.destroy());
        this.moneyDrops = [];
    }

    // Method to reset level but keep persistent state
    resetLevel() {
        // Clear existing entities
        this.enemies?.forEach(enemy => enemy.destroy());
        this.turrets?.forEach(turret => turret.destroy());
        this.moneyDrops?.forEach(money => money.destroy());
        
        // Reset arrays
        this.enemies = [];
        this.turrets = [];
        this.moneyDrops = [];
        this.gridCells = [];

        // Generate new path
        const pathGen = new PathGenerator(this.grid.width, this.grid.height);
        this.waypoints = pathGen.generatePath();

        // Recreate the game scene
        this.create();
    }

    // Method to advance to next level
    nextLevel() {
        this.level++;
        console.log(`Advancing to level ${this.level}`);
        
        // Add a slight delay before resetting the level
        this.time.delayedCall(1000, () => {
            this.resetLevel();
        });
    }

    changeScene() {
        // Clean up all enemies before changing scene
        this.enemies?.forEach(enemy => {
            // Destroy health bar graphics first
            if (enemy.healthBar) {
                enemy.healthBar.destroy();
            }
            enemy.destroy(true); // true ensures complete destruction
        });
        
        // Clear the arrays
        this.enemies = [];
        this.turrets?.forEach(turret => turret.destroy(true));
        this.turrets = [];
        
        // Clean up any remaining money drops
        this.moneyDrops?.forEach(money => money.destroy(true));
        this.moneyDrops = [];

        // Now safely change to GameOver scene
        this.scene.start('GameOver');
    }
}

// Define enemy types with their specific attributes
const ENEMY_TYPES = {
    BASIC: {
        sprite: 'enemy',
        health: 80,
        speed: 1/10000,
        scale: 0.3,
        value: 10
    },
    FAST: {
        sprite: 'enemy2',
        health: 40,
        speed: 1.3/10000,
        scale: .1,
        value: 5
    },
    TANK: {
        sprite: 'enemy3',
        health: 200,
        speed: 0.3/10000,
        scale: .06,
        value: 20
    }
};

export class Enemy extends Phaser.GameObjects.Sprite {
    constructor(scene, waypoints, enemyType) {
        const startPoint = waypoints[0];
        const x = (startPoint.x * scene.gridSize) + (scene.gridSize / 2);
        const y = (startPoint.y * scene.gridSize) + (scene.gridSize / 2);
        
        // Get enemy configuration
        const config = ENEMY_TYPES[enemyType || 'BASIC'];
        
        super(scene, x, y, config.sprite);
        
        this.scene = scene;
        this.waypoints = waypoints;
        this.currentWaypointIndex = 0;
        
        // Initialize follower BEFORE calling startOnPath
        this.follower = {
            t: 0,
            vec: new Phaser.Math.Vector2()
        };
        
        // Set properties from config
        this.setScale(config.scale);
        this.speed = config.speed;
        this.maxHealth = config.health;
        this.health = this.maxHealth;
        this.value = config.value;
        
        // Add to scene
        scene.add.existing(this);
        
        // Start on path
        this.startOnPath();

        // Add rotation properties
        this.rotationOffset = 0;
        this.rotationSpeed = 20;
        this.rotationAmount = 0.2;

        // Add health bar
        this.healthBar = scene.add.graphics();
        this.updateHealthBar();

        // Add money drops array to scene if it doesn't exist
        if (!scene.moneyDrops) {
            scene.moneyDrops = [];
        }
    }

    startOnPath() {
        // Set the t parameter at the start of the path
        this.follower.t = 0;
        
        // Get x and y of the given t point
        this.scene.path.getPoint(this.follower.t, this.follower.vec);
        
        // Set the x and y of our enemy to the received point
        this.setPosition(this.follower.vec.x, this.follower.vec.y);
    }

    update(time, delta) {
        // Move the t point along the path, using this enemy's individual speed
        this.follower.t += this.speed * delta;
        
        // Get the new x and y coordinates in vec
        this.scene.path.getPoint(this.follower.t, this.follower.vec);
        
        // Update enemy x and y to the newly obtained x and y
        this.setPosition(this.follower.vec.x, this.follower.vec.y);

        // Add wobble rotation
        this.rotationOffset += this.rotationSpeed * (delta / 1000);
        this.setRotation(Math.sin(this.rotationOffset) * this.rotationAmount);

        // If we have reached the end of the path
        if (this.follower.t >= 1) {
            this.reachedEnd();  // Use new method instead of destroy()
        }

        // Update health bar position
        this.updateHealthBar();
    }

    // Modify existing destroy method to be specific for killed enemies
    destroy() {
        // First remove from the enemies array
        const index = this.scene.enemies.indexOf(this);
        if (index > -1) {
            this.scene.enemies.splice(index, 1);
        }

        // Spawn money drops based on enemy value
        const numDrops = Math.floor(this.value / 5); // One gem per 5 value
        for (let i = 0; i < numDrops; i++) {
            const money = new Money(this.scene, this.x, this.y);
            this.scene.moneyDrops.push(money);
        }
        
        // Only emit the event if scoreText still exists
        if (this.scene.scoreText && this.scene.scoreText.active) {
            this.scene.events.emit('enemyKilled', this.value);
        }
        
        // Destroy the health bar if it exists
        if (this.healthBar) {
            this.healthBar.destroy();
            this.healthBar = null;
        }
        
        // Finally destroy the enemy sprite
        super.destroy();
    }

    // New method for when enemy reaches the end
    reachedEnd() {
        // Remove from the enemies array when reaching end
        const index = this.scene.enemies.indexOf(this);
        if (index > -1) {
            this.scene.enemies.splice(index, 1);
        }
        // Could emit an event to reduce player health/lives
        this.scene.events.emit('enemyReachedEnd');
        this.healthBar.destroy();
        super.destroy();
    }

    // Add new method to handle damage
    takeDamage(amount) {
        this.health -= amount;
        this.updateHealthBar();
        
        if (this.health <= 0) {
            this.destroy();
        }
    }

    // Add new method to update health bar
    updateHealthBar() {
        this.healthBar.clear();
        
        // Health bar background (red)
        this.healthBar.fillStyle(0xff0000);
        this.healthBar.fillRect(this.x - 20, this.y - 30, 40, 5);
        
        // Health bar foreground (green)
        const healthPercent = this.health / this.maxHealth;
        this.healthBar.fillStyle(0x00ff00);
        this.healthBar.fillRect(this.x - 20, this.y - 30, 40 * healthPercent, 5);
    }
}

// Define turret types with their specific attributes
const TURRET_TYPES = {
    BASIC: {
        sprite: 'turret',
        cost: 50,
        range: 300,
        fireRate: 1200,
        scale: 1,
        bulletType: 'BASIC'
    },
    SNIPER: {
        sprite: 'turret2',
        cost: 100,
        range: 500,
        fireRate: 2000,
        scale: 1,
        bulletType: 'SNIPER'
    }
};

// Define bullet types with their specific attributes
const BULLET_TYPES = {
    BASIC: {
        sprite: 'bullet',
        speed: 300,
        damage: 40,
        turnRate: 0.03,
        scale: 1,
        lifespan: 2000,
        hitRadius: 30
    },
    SNIPER: {
        sprite: 'bullet2',
        speed: 500,
        damage: 100,
        turnRate: 0.01,
        scale: 0.8,
        lifespan: 3000,
        hitRadius: 20
    }
};

class Bullet extends Phaser.GameObjects.Image {
    constructor(scene, x, y, bulletType = 'BASIC') {
        const config = BULLET_TYPES[bulletType];
        super(scene, x, y, config.sprite);
        
        this.setScale(config.scale);
        
        // Set properties from config
        this.speed = config.speed;
        this.lifespan = config.lifespan;
        this.turnRate = config.turnRate;
        this.hitRadius = config.hitRadius;
        this.damage = config.damage;
        
        this.born = 0;
    }

    fire(shooter, target) {
        this.setPosition(shooter.x, shooter.y);
        this.target = target;
        
        // Initial angle to target
        const angle = Phaser.Math.Angle.Between(shooter.x, shooter.y, target.x, target.y);
        this.rotation = angle + Math.PI/2;   // Add 90 degrees (π/2 radians)
        
        // Initial velocity (use original angle for movement)
        this.dx = Math.cos(angle) * this.speed;
        this.dy = Math.sin(angle) * this.speed;
        
        this.born = 0;
    }

    update(time, delta) {
        this.born += delta;
        
        if (this.target && this.target.active) {
            const distance = Phaser.Math.Distance.Between(
                this.x, this.y,
                this.target.x, this.target.y
            );

            // Modified collision check to apply damage instead of instant destroy
            if (distance < this.hitRadius) {
                this.target.takeDamage(this.damage);
                this.destroy();
                return;
            }

            const targetAngle = Phaser.Math.Angle.Between(
                this.x, this.y,
                this.target.x, this.target.y
            );
            
            let newRotation = Phaser.Math.Angle.RotateTo(
                this.rotation - Math.PI/2,  // Subtract 90 degrees for calculation
                targetAngle,
                this.turnRate
            );
            
            // Add 90 degrees back for visual rotation
            this.rotation = newRotation + Math.PI/2;
            
            // Use original angle for movement
            this.dx = Math.cos(newRotation) * this.speed;
            this.dy = Math.sin(newRotation) * this.speed;
        }
        
        // Move bullet
        this.x += this.dx * (delta / 1000);
        this.y += this.dy * (delta / 1000);

        if (this.born > this.lifespan) {
            this.destroy();
        }
    }
}

class Turret extends Phaser.GameObjects.Container {
    constructor(scene, x, y, turretType = 'BASIC') {
        super(scene, x, y);
        scene.add.existing(this);
        
        // Get turret configuration
        const config = TURRET_TYPES[turretType];
        this.config = config;
        
        // Add turret base and turret to the container
        this.turret = scene.add.image(0, 0, config.sprite);
        this.turret.setOrigin(0.5);
        this.turret.setScale(config.scale);
        this.add(this.turret);

        // Set turret properties from config
        this.range = config.range;
        this.fireRate = config.fireRate;
        this.bulletType = config.bulletType;
        this.cost = config.cost;
        
        this.targetEnemy = null;
        this.nextFire = 0;
        
        this.turret.setAngle(90);

        // Add bullets group
        this.bullets = this.scene.add.group({
            classType: Bullet,
            runChildUpdate: true
        });
    }

    update(time, delta) {
        // Always look for closest target
        const enemies = this.scene.enemies;
        let closestEnemy = null;
        let closestDistance = this.range;

        enemies.forEach(enemy => {
            const distance = Phaser.Math.Distance.Between(
                this.x,
                this.y,
                enemy.x,
                enemy.y
            );

            if (distance <= closestDistance) {
                closestDistance = distance;
                closestEnemy = enemy;
            }
        });

        // Update current target
        this.targetEnemy = closestEnemy;

        // Rotate and fire if we have a target
        if (this.targetEnemy) {
            this.rotateToTarget();
            if (time > this.nextFire) {
                this.fire();
                console.log("Firing");
                this.nextFire = time + this.fireRate;
            }
        }
    }

    rotateToTarget() {
        const angle = Phaser.Math.Angle.Between(
            this.x,
            this.y,
            this.targetEnemy.x,
            this.targetEnemy.y
        );
        
        const angleDeg = Phaser.Math.RadToDeg(angle);
        this.turret.setAngle(angleDeg + 90);
    }

    fire() {
        const bullet = this.bullets.get(this.x, this.y, this.bulletType);
        if (bullet) {
            bullet.fire(this, this.targetEnemy);
            bullet.setActive(true);
            bullet.setVisible(true);
        }
    }
}

class PathGenerator {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.pathCells = [];
    }

    generatePath() {
        this.pathCells = [];
        let y = Math.floor(this.height / 2);
        let x = 0;

        while (x < this.width) {
            this.pathCells.push({ x, y });

            let validMove = false;

            while (!validMove) {
                const move = Math.floor(Math.random() * 3);

                if (move === 0 || x % 2 === 0 || x > (this.width - 2)) {
                    x++;
                    validMove = true;
                }
                else if (move === 1 && this.cellIsEmpty(x, y + 1) && y < this.height - 2) {
                    y++;
                    validMove = true;
                }
                else if (move === 2 && this.cellIsEmpty(x, y - 1) && y > 2) {
                    y--;
                    validMove = true;
                }
            }
        }

        return this.pathCells;
    }

    cellIsEmpty(x, y) {
        return !this.pathCells.some(cell => cell.x === x && cell.y === y);
    }

    cellIsTaken(x, y) {
        return this.pathCells.some(cell => cell.x === x && cell.y === y);
    }

    cellIsTakenVector(cell) {
        return this.pathCells.some(p => p.x === cell.x && p.y === cell.y);
    }

    getCellNeighbourValue(x, y) {
        let returnValue = 0;

        if (this.cellIsTaken(x, y - 1)) returnValue += 1;
        if (this.cellIsTaken(x - 1, y)) returnValue += 2;
        if (this.cellIsTaken(x + 1, y)) returnValue += 4;
        if (this.cellIsTaken(x, y + 1)) returnValue += 8;

        return returnValue;
    }
}

// Function to generate wave config based on wave number
function generateWaveConfig(waveNumber, level = 1) {
    // Increase difficulty based on both wave and level
    const difficultyMultiplier = (level - 1) * 0.2 + 1; // Each level increases difficulty by 20%
    
    return {
        enemies: [
            { 
                type: 'BASIC', 
                weight: Math.max(30, 70 - ((waveNumber + level) * 8))
            },
            { 
                type: 'FAST', 
                weight: Math.min(40, 20 + ((waveNumber + level) * 4))
            },
            { 
                type: 'TANK', 
                weight: Math.min(30, 10 + ((waveNumber + level) * 4))
            }
        ],
        spawnInterval: Math.max(400, 1000 - ((waveNumber + level) * 80)),
        initialDelay: 1000,
        enemiesInWave: Math.floor((10 + (waveNumber * 2)) * difficultyMultiplier)
    };
}

class EnemySpawner {
    constructor(scene) {
        this.scene = scene;
        this.currentWave = 1;
        this.totalWaves = 5;
        this.enemiesSpawned = 0;
        this.setWaveConfig(this.currentWave);
        this.waveComplete = false;
        
        this.updateWaveDisplay();
    }

    setWaveConfig(waveNumber) {
        const config = generateWaveConfig(waveNumber, this.scene.level);
        this.enemyPool = config.enemies;
        this.spawnInterval = config.spawnInterval;
        this.nextSpawnTime = this.scene.time.now + config.initialDelay;
        this.enemiesInWave = config.enemiesInWave;
        this.enemiesSpawned = 0;
        this.waveComplete = false;
    }

    updateWaveDisplay() {
        if (this.scene.waveText) {
            this.scene.waveText.setText(`Wave: ${this.currentWave}/${this.totalWaves}`);
        }
    }

    nextWave() {
        this.currentWave++;
        if (this.currentWave <= this.totalWaves) {
            this.setWaveConfig(this.currentWave);
            this.updateWaveDisplay();
            return true;
        }
        // Only advance to next level if this is the first time we've completed all waves
        if (!this.waveComplete && this.scene.enemies.length === 0) {
            this.waveComplete = true;
            this.scene.nextLevel();
        }
        return false;
    }

    spawnEnemy() {
        if (this.enemiesSpawned >= this.enemiesInWave) {
            // Check if all enemies in current wave are dead
            if (this.scene.enemies.length === 0) {
                if (!this.nextWave()) {
                    console.log("Game Complete!");
                    // You could trigger a victory condition here
                }
            }
            return;
        }

        const enemyType = this.getWeightedRandomEnemy();
        const enemy = new Enemy(this.scene, this.scene.waypoints, enemyType);
        this.scene.enemies.push(enemy);
        this.enemiesSpawned++;
    }

    getWeightedRandomEnemy() {
        const totalWeight = this.enemyPool.reduce((sum, enemy) => sum + enemy.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const enemy of this.enemyPool) {
            random -= enemy.weight;
            if (random <= 0) {
                return enemy.type;
            }
        }
        
        return 'BASIC';
    }

    update(time, delta) {
        if (time > this.nextSpawnTime) {
            if (this.enemiesSpawned >= this.enemiesInWave) {
                // Check if all enemies in current wave are dead
                if (this.scene.enemies.length === 0) {
                    this.nextWave();
                }
            } else {
                this.spawnEnemy();
                this.nextSpawnTime = time + this.spawnInterval;
            }
        }
    }
}

// Add this with the other configurations
const MONEY_CONFIG = {
    value: 5,         // Value of each money drop
    scale: 0.025,     // Visual size of money drops
    spread: 20,       // Random spread when dropped
    collectRadius: 50 // Distance at which money is collected
};

class Money extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'money');
        scene.add.existing(this);
        
        this.value = MONEY_CONFIG.value;
        this.setScale(MONEY_CONFIG.scale);
        this.collected = false;
        
        // Add a small random spread when the money drops
        const spread = MONEY_CONFIG.spread;
        this.x += Phaser.Math.Between(-spread, spread);
        this.y += Phaser.Math.Between(-spread, spread);
        
        // Add simple animation
        scene.tweens.add({
            targets: this,
            y: this.y - 10,
            duration: 1000,
            ease: 'Sine.inOut',
            yoyo: true,
            repeat: -1
        });
    }
    
    collect() {
        // Prevent collecting the same money multiple times
        if (this.collected) return;
        this.collected = true;

        this.scene.money += this.value;
        this.scene.moneyText.setText(`Money: $${this.scene.money}`);
        
        // Remove from the moneyDrops array first
        const index = this.scene.moneyDrops.indexOf(this);
        if (index > -1) {
            this.scene.moneyDrops.splice(index, 1);
        }

        // Create collection effect and destroy
        this.scene.tweens.add({
            targets: this,
            scale: 0,
            alpha: 0,
            duration: 200,
            onComplete: () => {
                this.destroy();
            }
        });
    }
}
