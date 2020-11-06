// Changer à true pour voir les informations de debug à l'écran
var DEBUG = false;

// Sprites JSON
var SPRITES_DATA = {
    'snowball': {
        'src': 'sprites/snowballSprite.png',
        'width': 1625,
        'height': 125,
        'frameWidth': 125,
        'speed': 80,
    },
    'tree': {
        'src': 'sprites/treeSprite.png',
        'width': 480,
        'height': 48,
        'frameWidth': 48,
        'speed': 100,
    },
    'impact': {
        'src': 'sprites/impactSprite.png',
        'width': 680,
        'height': 170,
        'frameWidth': 170,
        'speed': 80,
    },
    'avalanche': {
        'src': 'sprites/avalancheSprite.png',
        'width': 68,
        'height': 72,
        'frameWidth': 68,
        'speed': 0,
    },
    'heart': {
        'src': 'sprites/heartSprite.png',
        'width': 900,
        'height': 158,
        'frameWidth': 180,
        'speed': 0,
    },
};

// enum DIRECTION
var DIRECTION = {
    LEFT: 0,
    RIGHT: 1,
};

// Canvas
var canvas = document.getElementById('game');
var context2d = canvas.getContext('2d');
// Supprimer l'anti alias
context2d.msImageSmoothingEnabled = false;
context2d.mozImageSmoothingEnabled = false;
context2d.webkitImageSmoothingEnabled = false;
context2d.imageSmoothingEnabled = false;


// Utilitaires
var UTILITY = {

    /**
     * Retourne un entier aléatoire entre min et max
     * @param {Number} min
     * @param {Number} max
     * @return {Number}
     */
    getRandomInt: function(min, max) {
        return Math.floor(Math.random()*(max-min+1)+min);
    },
    /**
     * Retourne si deux hitbox se touchent
     * @param {hitbox} hitboxA
     * @param {hitbox} hitboxB
     * @return {Boolean}
     */
    doCollide: function(hitboxA, hitboxB) {
        return (hitboxA.x < hitboxB.x + hitboxB.width &&
            hitboxA.x + hitboxA.width > hitboxB.x &&
            hitboxA.y < hitboxB.y + hitboxB.height &&
            hitboxA.height + hitboxA.y > hitboxB.y);
    },
    /**
     * Dessine la hitbox d'un objet et des infos sur son sprite
     * @param {hitbox} hitbox
     * @param {Sprite} sprite
     * @param {String} color
     */
    debugObject: function(hitbox, sprite, color) {
        context2d.strokeStyle = color ? color : 'red';
        context2d.beginPath();
        context2d.rect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);
        context2d.lineWidth = 1;
        context2d.stroke();
        // Position hitbox
        context2d.font = '12px Arial';
        context2d.fillStyle = color ? color : 'red';
        // context2d.fillText('Hitbox : (x : ' + hitbox.x.toFixed(1) + ', y : ' + hitbox.y.toFixed(1) + ') w :' + hitbox.width.toFixed(2) + ' x h : ' + hitbox.height.toFixed(2), hitbox.x, hitbox.y - 5 );
        // Infos sprite
        // context2d.fillText('Sprite : ' + sprite.getDebugInfos(), hitbox.x, hitbox.y + hitbox.height + 15);
    },

    /**
     * Imprime des informations à l'écran
     * @param {Number} X position X à l'écran
     * @param {Number} Y position Y à l'écran
     * @param {Array} infos
     */
    debugInfos: function(X, Y, infos) {
        context2d.font = '12px Arial';
        context2d.fillStyle = 'red';
        for (var i = 0; i < infos.length; i++) {
            context2d.fillText(infos[i], X, Y + 15*(i+1));
        }
    },

    /**
     * Retourne une hitbox après une mise à l'échelle
     * @param {Number} posX
     * @param {Number} posY
     * @param {Number} width
     * @param {Number} height
     * @param {Number} scale
     * @return {hitbox} hitbox
     */
    getScaledHitbox: function(posX, posY, width, height, scale) {
        var hitboxW = width * scale;
        var hitboxH = height * scale;
        return {
            x: posX + (width - hitboxW)/2,
            y: posY + (height - hitboxH)/2,
            height: hitboxH,
            width: hitboxW,
        };
    },

    /**
     * Retourne la couleur en fonction du combo
     * @param {Number} combo
     * @return {String} color
     */
    getComboColor: function(combo) {
        return combo == 1 ? '#e5e5e5' : combo < 4 ? '#00aeff' : combo < 7 ? '#ffa42d' : combo < 10 ? '#fc5914' : '#8e0000';
    },
};

/**
 * Sprite
 * @param {any} spriteData données du sprite (voir le JSON SPRITES_DATA)
 * @param {Boolean} loop
 */
function Sprite(spriteData, loop) {
    // Remplace les this
    var sprite = this;

    // Image du sprite
    var image = new Image();
    image.src = spriteData.src;
    var currentFrame = 0;
    var lastFrameTick = 0;
    var nbFrames = Math.floor(spriteData.width / spriteData.frameWidth);
    var paused = true;
    var endFrame = nbFrames-1;
    var startFrame = 0;
    var finishedCallback = null;

    /**
     * Fonction responsable de dessiner le sprite (à mettre dans la boucle du jeu)
     * @param {Number} timestamp temps du jeu
     * @param {Number} width
     * @param {Number} height
     * @param {Number} posX
     * @param {Number} posY
     */
    sprite.draw = function(timestamp, width, height, posX, posY) {
        // Dessiner l'image
        context2d.drawImage(image, currentFrame * spriteData.frameWidth, 0, spriteData.frameWidth, spriteData.height, posX, posY, width, height);

        // Passer à la frame suivante
        if (!paused && timestamp - lastFrameTick > spriteData.speed) {
            if (currentFrame < endFrame)
                currentFrame++;
            else if (currentFrame == endFrame && finishedCallback) {
                finishedCallback();
                finishedCallback = null;
            }
            else if (currentFrame == endFrame && loop) // Boucler si on arrive à la dernière frame
                currentFrame = startFrame;

            lastFrameTick = timestamp;
        }
    };

    /**
     * Mets en pause l'animation sur une frame donnée
     * @param {Number} frame
     */
    sprite.pause = function(frame) {
        paused = true;
        currentFrame = frame;
    };

    /**
     * Joue l'animation depuis une frame donnée à une frame donnée
     * @param {Number} start
     * @param {Number} end
     * @param {Function} callback action à faire une fois que la séquence est jouée
     */
    sprite.play = function(start, end, callback) {
        paused = false;
        startFrame = currentFrame = start;
        endFrame = end;
        finishedCallback = callback;
    };

    /**
     * Retourne des informations de debug sur le sprite
     * @return {String} debugInfos
     */
    sprite.getDebugInfos = function() {
        return spriteData.src + ' (' + (currentFrame+1) + '/' + nbFrames + ') delay : ' + spriteData.speed.toFixed(2) + (loop ? ' (loop)' : '') + (paused ? ' (paused)' : '');
    };
}

/**
 * Joueur (boule de neige)
 */
function Player() {
    // Remplace les this
    var player = this;

    player.initialPlayerSize = 35;
    player.maxPlayerSize = 105;

    // Piste derrière
    var trail = new Trail(player);

    // Taille
    var currentSize = player.initialPlayerSize;
    var growth = 0.05;

    // Vitesse
    var minSpeed = 2;
    var targetSpeed = 4;
    var currentSpeed = minSpeed;

    var acceleration = 0.1;

    // Position
    var posX = canvas.width/2 - currentSize/2;
    var posY = canvas.height / 5;

    // Direction
    var direction = DIRECTION.RIGHT;
    var directionChangeDelay = 100; // temps minimum entre deux changements de direction
    var lastDirectionChangeTime = 0;
    var currentTime = 0;

    // Sprite
    var sprite = new Sprite(SPRITES_DATA.snowball, true);
    sprite.play(0, 7);

    var impactSprite = new Sprite(SPRITES_DATA.impact, false);

    var drawImpact = false;

    /**
    * Quand le joueur est touché
    */
    player.onHit = function() {
        drawImpact = true;
        impactSprite.play(0, 4, function() {
            drawImpact = false;
         });
    };

    /**
    * Quand le joueur est mort
    */
    player.onGameOver = function(callback) {
        sprite.play(8, 12, function() {
            sprite.pause(12);
            callback();
        });
    };

    /**
    * Modifier la taille
    */
    player.setSize = function(size) {
        currentSize = size;
    };

    /**
    * Retourne la taille
    * @return {Number} taille
    */
    player.getSize = function() {
        return currentSize;
    };

    /**
    * Retourne la vitesse
    * @return {Number} vitesse
    */
    player.getSpeed = function() {
        return currentSpeed;
    };

    /**
    * Retourne le nombre de vies (1 à 3)
    * @return {Number} vies
    */
    player.getLives = function() {
        return Math.floor( player.getSizeRatio() );
    };

    /**
    * Retourne la posY
    * @return {Number} posY
    */
    player.getPosY = function() {
        return posY;
    };

    /**
    * Retourne le ration taille_initiale/taille_actuelle
    * @return {Number} ratio
    */
    player.getSizeRatio = function() {
        return currentSize / player.initialPlayerSize;
    };

    /**
    * Change la direction du joueur
    */
    player.changeDirection = function() {
        // Diviser par deux la vitesse actuelle (minimum minSpeed)
        currentSpeed = Math.max(minSpeed, currentSpeed/2);

        if (direction == DIRECTION.RIGHT)
            direction = DIRECTION.LEFT;
        else
            direction = DIRECTION.RIGHT;

        lastDirectionChangeTime = currentTime;
    };

    /**
     * Boucle (à mettre dans la boucle principale du jeu)
     * @param {Number} timestamp temps du jeu
     * @param {Number} gameSpeed vitesse du jeu
     */
    player.loop = function(timestamp, gameSpeed) {
        // Mouvement
        if (direction == DIRECTION.RIGHT)
            posX += currentSpeed*gameSpeed;
        else
            posX -= currentSpeed*gameSpeed;

        // Acceleration
        if (currentSpeed < targetSpeed)
            currentSpeed += Math.min(acceleration, targetSpeed-currentSpeed); // Pour ne pas dépasser targetSpeed

        // Grossissement
        if (currentSize < player.maxPlayerSize)
            currentSize += Math.min(growth*gameSpeed, (player.maxPlayerSize-currentSize)*gameSpeed); // Pour ne pas dépasser maxPlayerSize

        currentTime = timestamp;

        // Dessiner la piste derière
        trail.loop(timestamp, gameSpeed);

        // Dessiner le sprite
        sprite.draw(timestamp, currentSize, currentSize, posX, posY);

        // Dessiner le sprite de l'impact
        if (drawImpact) {
            var impactSize = currentSize * 2;
            impactSprite.draw(timestamp, impactSize, impactSize, posX-(impactSize-currentSize)/2, posY-(impactSize-currentSize)/2);
        }

        // Debug
        if (DEBUG) {
            UTILITY.debugInfos(10, 10, [
                '-- JOUEUR',
                'posX : ' + posX.toFixed(2) + ' , posY : ' + posY.toFixed(2),
                'taille : ' + currentSize.toFixed(2) + ' (max : ' + player.maxPlayerSize + ') ; grossissement : ' + growth,
                'vitesse : ' + currentSpeed.toFixed(2) + ' (min : ' + minSpeed + ', max : ' + targetSpeed + ') ; acceleration : ' + acceleration,
                'direction : ' + (direction == DIRECTION.RIGHT ? 'DROITE' : 'GAUCHE') + ' ; délai avant prochain changement : ' + Math.max(0, (directionChangeDelay - (currentTime - lastDirectionChangeTime))).toFixed(2),
            ]);
            // Hitbox
            UTILITY.debugObject( player.getHitbox(), sprite);
        }
    };

    /**
     * Evenement touche clavier (à attacher au document)
     */
    player.onKeyDown = function() {
        // Eviter les changements de direction trop rapides
        if (currentTime - lastDirectionChangeTime < directionChangeDelay)
            return;

        // Changement de direction
        player.changeDirection();
    };

    /**
     * Retourne la hitbox du joueur
     * @return {hitbox} hitbox
     */
    player.getHitbox = function() {
        return UTILITY.getScaledHitbox(posX, posY, currentSize, currentSize, 0.8);
    };
}

/**
 * Piste (trace laissé par la boule de neige)
 * @param {Player} player
 */
function Trail(player) {
    // Remplace les this
    var trail = this;

    var pieces = [];

    /**
     * Boucle (à mettre dans la boucle principale du jeu)
     * @param {Number} timestamp temps du jeu
     * @param {Number} gameSpeed vitesse du jeu
     */
    trail.loop = function(timestamp, gameSpeed) {
        // Ajout de traits
        pieces.push({
            y: player.getHitbox().y + player.getHitbox().height/2,
            x: player.getHitbox().x,
            height: gameSpeed*4 + 5,
            width: player.getHitbox().width - 10,
        });

        for (var i=0; i<pieces.length; i++) {
            // Dessiner
            context2d.strokeStyle = UTILITY.getComboColor(combo);
            context2d.lineCap = 'round';
            context2d.beginPath();
            context2d.moveTo(pieces[i].x, pieces[i].y);
            context2d.lineTo(pieces[i].x + pieces[i].width, pieces[i].y);
            context2d.lineWidth = pieces[i].height;
            context2d.stroke();

            // Mouvement vertical
            pieces[i].y -= 4 * gameSpeed;
        }

        // Supprimer ceux hors de l'écran
        for (var i=0; i<pieces.length; i++) {
            if (pieces[i].y < 0)
                pieces.splice(i, 1);
        }
    };
}

/**
 * Obstacle (les arbres)
 * @param {Number} posX
 * @param {Number} size
 */
function Obstacle(posX, size) {
    // Remplace les this
    var obstacle = this;

    // Si touché
    var isHit = false;
    // Si touché la zone bonus
    var isBonus = false;

    // Position
    var posY = canvas.height + size/2;

    // Sprite
    var sprite = new Sprite(SPRITES_DATA.tree, false);

    /**
     * Boucle à mettre dans la boucle du jeu
     * @param {Number} timestamp
     * @param {Number} gameSpeed
     */
    obstacle.loop = function(timestamp, gameSpeed) {
        // Mouvement vertical
        posY -= 4 * gameSpeed;

        // Dessiner le sprite
        sprite.draw(timestamp, size, size, posX, posY);

        // Debug
        if (DEBUG) {
            UTILITY.debugObject(obstacle.getHitbox(), sprite);
            UTILITY.debugObject(obstacle.getBonusHitBox(), sprite, 'green');
        }
    };

    /**
     * Retourne si l'obstacle est sorti de l'écran
     * @return {Boolean}
     */
    obstacle.outOfScreen = function() {
        return posY+size < 0;
    };

    /**
     * Retourne la hitbox de la zone hit
     * @return {hitbox} hitbox
     */
    obstacle.getHitbox = function() {
        if (!isHit)
            return UTILITY.getScaledHitbox(posX+size/15, posY+size/5, size, size, 0.5);

        return {x: -1000, y: -1000, width: 0, height: 0};
    };

    /**
     * Retourne la hitbox de la zone bonus
     * @return {hitbox} hitbox
     */
    obstacle.getBonusHitBox = function() {
        if (!isBonus)
            return UTILITY.getScaledHitbox(posX, posY, size, size, 1.5);

        return {x: -1000, y: -1000, width: 0, height: 0};
    };

    /**
     * Action à faire quand on touche la zone bonus
     */
    obstacle.onBonus = function() {
        isBonus = true;

        sprite.play(0, 4);
    };

    /**
     * Action à faire quand on touche la zone hit
     */
    obstacle.onHit = function() {
        isHit = true;

        sprite.play(5, 9);
    };
}

/**
 * Avalanche
 * @param {Number} minGameSpeed
 * @param {Number} maxGameSpeed
 */
function Avalanche(minGameSpeed, maxGameSpeed) {
    // Remplace les this
    var avalanche = this;

    // Vitesse
    var speed = minGameSpeed/2;
    var maxSpeed = maxGameSpeed * 0.9;
    var acceleration = 0.001;

    // Distance
    var distanceTraveled = -100; // En retard

    // Position
    var posY;

    // Sprite
    var sprite = new Sprite(SPRITES_DATA.avalanche, false);
    var spriteWidth = SPRITES_DATA.avalanche.width;
    var spriteHeight = SPRITES_DATA.avalanche.height;

    // Etat du jeu
    var gameOver = false;

    // Callback
    var onGameOver = null;

    /**
     * Retourne la position Y
     * @return {Number} posY
     */
    avalanche.getY = function() {
        return posY;
    };

    /**
     * Met en marche l'animation de fin
     * @param {Function} callback function à appeler après la fin de l'animation
     */
    avalanche.gameOver = function(callback) {
        gameOver = true;
        onGameOver = callback;
    };

    /**
     * Retourne si l'animation de fin est en train de joueur
     * @return {Boolean}
     */
    avalanche.isGameOverAnimation = function() {
        return gameOver;
    };

    /**
     * Boucle à mettre dans la boucle du jeu
     * @param {Number} timestamp
     * @param {Number} gameDistanceTraveled distance parcourue par le joueur
     */
    avalanche.loop = function(timestamp, gameDistanceTraveled) {
        distanceTraveled += speed;

        if (speed < maxSpeed)
            speed += Math.min(acceleration, maxSpeed - speed); // Pour ne pas dépasser maxSpeed

        // Dessiner
        if ( gameDistanceTraveled - distanceTraveled < canvas.height/6 ) {
            playAvalanche(); // Audio
            if (gameOver) { // Game over = fait joueur l'animation (aller tout en bas)
                posY += 5;
                if (posY > canvas.height + spriteHeight && onGameOver) {
                    onGameOver();
                    stopAvalanche(); // Audio
                }
            }
            else
                posY = canvas.height/6 - (gameDistanceTraveled - distanceTraveled);


            for (var i=0; i<Math.ceil(canvas.width/spriteWidth); i++) {
                context2d.beginPath();
                context2d.fillStyle = 'white';
                context2d.rect(0, 0, canvas.width, posY-spriteHeight);
                context2d.fill();
                sprite.draw(timestamp, spriteWidth, spriteHeight, spriteWidth*i, posY-spriteHeight);
            }

            if (DEBUG) {
                context2d.strokeStyle = 'red';
                context2d.beginPath();
                context2d.moveTo(0, posY);
                context2d.lineTo(canvas.width, posY);
                context2d.lineWidth = 5;
                context2d.stroke();
            }
        } else {
            stopAvalanche(); // Audio
        }

        // Debug
        if (DEBUG)
        UTILITY.debugInfos(700, 10, [
            '-- Avalanche',
            'Vitesse : ' + speed.toFixed(2) + ' (max : ' + maxSpeed.toFixed(2) + ') ; acceleration : ' + acceleration,
            'Distance parcourue : ' + distanceTraveled.toFixed(2),
        ]);
    };

    /**
     * Retourne la distance parcourue par l'avalanche
     * @return {Number}
     */
    avalanche.getDistanceTraveled = function() {
        return distanceTraveled;
    };
}

/**
 * HUD (interface score etc..)
 */
function Hud() {
    // Remplace les this
    var hud = this;

    var heartSprite = new Sprite(SPRITES_DATA.heart, false);

    /**
     * Boucle à mettre dans la boucle du jeu
     * @param {Number} timestamp
     * @param {Number} score
     * @param {Number} combo
     * @param {Number} sizeRatio
     */
    hud.loop = function(timestamp, score, combo, sizeRatio) {
        if (DEBUG)
            return;

        // Score
        context2d.fillStyle = 'black';
        context2d.font = '30px EightBit';
        var scoreText = Math.floor(score/10);
        context2d.fillText(scoreText, canvas.width - context2d.measureText(scoreText).width - 100, 50);

        // Combo
        context2d.font = '20px EightBit';
        context2d.fillStyle = UTILITY.getComboColor(combo);
        var comboText = 'x' + combo;
        context2d.fillText(comboText, canvas.width - context2d.measureText(comboText).width - 50, 74);

        // Vies
        for (var i=1; i<=2; i++) {
            var fill = sizeRatio - i;
            var frame = fill > 1 ? 4 : fill > 0.75 ? 3 : fill > 0.5 ? 2 : fill > 0.25 ? 1 : 0;
            heartSprite.pause(frame);
            heartSprite.draw(timestamp, 60, 52.6, 50 + 70*(i-1) + 10, 5);
        }
    };
}

// -------------------------------------------- JEU

// Variables
var gSpeed, paused, over, player, obstacles, obstacleFrequency, lastObstacle, combo, lastCombo, score, gDistanceTraveled, avalanche, hud;

var started = false;

// Constantes
var gAcceleration = 0.001;
var obstacleFrequency = 1000;
var maxGspeed = 3.5;
var minGspeed = 1;

var combo = 1;
var comboDecay = 2000;

var speedGainPerBonus = 0.1;

/**
 * Démarre une nouvelle partie
 */
function start() {
    hideInterface();

    started = true;

    paused = false;
    over = false;
    gSpeed = minGspeed;
    player = new Player();
    avalanche = new Avalanche(minGspeed, maxGspeed);
    hud = new Hud();
    obstacles = [];

    maxCombo = 10;
    lastCombo = 0;
    score = 0;

    gDistanceTraveled = 0;

    lastObstacle = 0;

    document.addEventListener('keydown', player.onKeyDown);

    window.requestAnimationFrame(mainLoop);
}

/**
 * Arrête la partie en cours
 * @param {Boolean} gameOver
 */
function stop(gameOver) {
    stopAvalanche(); // Audio

    paused = true;

    document.removeEventListener('keydown', player.onKeyDown);

    if (gameOver) {
        over = true;
        showInterface(UI_TYPE.GAME_OVER);
    }
    else
        showInterface(UI_TYPE.PAUSE);
}

/**
 * Reprend une partie en cours
 */
function resume() {
    paused = false;

    hideInterface();

    document.addEventListener('keydown', player.onKeyDown);
    window.requestAnimationFrame(mainLoop);
}

/**
 * Boucle principle du jeu
 * @param {Number} timestamp
 */
function mainLoop(timestamp) {
    // Effacer le canvas
    context2d.clearRect(0, 0, canvas.width, canvas.height);

    // Barrières (de plus en plus visible si on s'approche)
    var leftLineWidth = Math.min(3, 80/Math.abs(player.getHitbox().x));
    var rightLineWidth = Math.min(3, 80/Math.abs((canvas.width - (player.getHitbox().x + player.getSize()))));

    context2d.strokeStyle = 'red';
    context2d.beginPath();
    context2d.moveTo(0, 0);
    context2d.lineTo(0, canvas.height);
    context2d.lineWidth = leftLineWidth;
    context2d.stroke();
    context2d.beginPath();
    context2d.moveTo(canvas.width, 0);
    context2d.lineTo(canvas.width, canvas.height);
    context2d.lineWidth = rightLineWidth;
    context2d.stroke();

    // Ejecter le joueur s'il touche les barrières
    if (player.getHitbox().x - player.getSpeed()*gSpeed*2 < 0 || player.getHitbox().x + player.getHitbox().width + player.getSpeed()*gSpeed*2 > canvas.width) {
        player.changeDirection();
        // Son
        playSfx(SFX_DATA.barrier);
    }

    // Joueur
    player.loop(timestamp, gSpeed);

    // Expiration combo
    if (timestamp - lastCombo > comboDecay)
        combo = 1;

    // Ajout d'obstacle
    if (timestamp - lastObstacle > obstacleFrequency/gSpeed) {
        var obstacleSize = UTILITY.getRandomInt(96, 120);
        obstacles.push(new Obstacle( UTILITY.getRandomInt( 0, canvas.width - obstacleSize ), obstacleSize));
        lastObstacle = timestamp;
    }

    // Obstacles (collision + mouvement)
    for (var i=0; i<obstacles.length; i++) {
        // Collison zone bonus
        if ( UTILITY.doCollide(player.getHitbox(), obstacles[i].getBonusHitBox()) ) {
            // Animations
            obstacles[i].onBonus();

            // Son
            playSfx(SFX_DATA.combo);

            // Gagner en combo
            if (combo < maxCombo)
                combo++;

            // Gagner en vitesse
            if (gSpeed < maxGspeed)
                gSpeed += Math.min(speedGainPerBonus, maxGspeed - gSpeed); // Pour ne pas dépasser maxGSpeed

            lastCombo = timestamp;
        }

        // Collision zone hitbox
        if ( UTILITY.doCollide(player.getHitbox(), obstacles[i].getHitbox()) ) {
            // Animations
            player.onHit();
            obstacles[i].onHit();

            // Son
            playSfx(SFX_DATA.hit);

            // Reset le compteur combo
            combo = 1;

            // Réduire la vitesse
            gSpeed = Math.max(minGspeed, gSpeed / 1.5);

            // Perdre en taille
            if (player.getLives() == 1) { // Game over
                player.onGameOver(function() {
                    stop(true);
                });
            } else { // Perdre une vie
                player.setSize(player.getSize() - player.initialPlayerSize);
            }
        }

        obstacles[i].loop(timestamp, gSpeed);
    }

    // Obstacles (supression) (évite le clignotement d'où les 2 boucles)
    for (var i=0; i<obstacles.length; i++)
        if (obstacles[i].outOfScreen())
            obstacles.splice(i, 1);


    // Avalanche
    avalanche.loop(timestamp, gDistanceTraveled);

    // HUD
    hud.loop(timestamp, score, combo, player.getSizeRatio());

    // Debug
    if (DEBUG)
        UTILITY.debugInfos(360, 10, [
            '-- JEU',
            'Vitesse : ' + gSpeed.toFixed(2) + ' (min : ' + minGspeed + ', max : ' + maxGspeed + ') ; acceleration : ' + gAcceleration,
            'En pause : ' + (paused ? 'OUI' : 'NON') + (over ? ' (game over)' : ''),
            'Obstacles : ' + obstacles.length + ' ; fréquence : ' + (obstacleFrequency/gSpeed).toFixed(2),
            'Combo : x' + combo + ' (max : ' + maxCombo + ') ; expire dans : ' + Math.max(0, comboDecay - (timestamp-lastCombo)).toFixed(2),
            'Score : ' + Math.floor(score/10),
            'Vies : ' + player.getLives(),
            'Distance parcourue : ' + gDistanceTraveled.toFixed(2),
            'Distance avalanche : ' + (gDistanceTraveled - avalanche.getDistanceTraveled()).toFixed(2),
        ]);

    // Augmenter la vitesse du jeu
    if (gSpeed < maxGspeed)
        gSpeed += Math.min(gAcceleration, maxGspeed-gSpeed); // pour ne pas dépasser maxGspeed

    // Score
    if (!over) // Eviter de rajouter des points si gameover par avalanche
        score += combo;

    // Distance parcourue
    gDistanceTraveled += gSpeed;

    // Game over (avalanche)
    if (avalanche.getY() > player.getHitbox().y) {
        gSpeed = 0;
        combo = 1;
        over = true;
        if (!avalanche.isGameOverAnimation())
            avalanche.gameOver(function() {
                stop(true);
            });
    }


    // Boucler
    if (!paused)
        window.requestAnimationFrame(mainLoop);
}

// -------------------------------------------- SON

// JSON des effets
var SFX_DATA = {
    'combo': 'sfx/bonusHit.mp3',
    'hit': 'sfx/hit.mp3',
    'barrier': 'sfx/hitBarrier.mp3',
};

var avalancheAudio = new Audio('sfx/avalanche.mp3');
var avalanchePlaying = false;

/**
* Joue le son de l'avalanche
*/
function stopAvalanche() {
    if (!avalanchePlaying)
        return;
    avalanchePlaying = false;

    // Fade
    var intervalID = setInterval( function()  {
        if (avalancheAudio.volume > 0.1)
            avalancheAudio.volume -= 0.1;
        else {
            avalancheAudio.pause();
            avalancheAudio.volume = 1;
            avalancheAudio.currentTime = 0;
            clearInterval(intervalID);
        }
    }, 100);
}

/**
* Arrête le son de l'avalanche
*/
function playAvalanche() {
    if (avalanchePlaying)
        return;
    avalanchePlaying = true;
    avalancheAudio.play();
    avalancheAudio.addEventListener('ended', function() {
        avalanchePlaying = false;
        playAvalanche();
    });
}

/**
* Joue un son sfx
* @param {String} src
*/
function playSfx(src) {
    var audio = new Audio(src);
    audio.volume = 0.2;
    audio.play();
}


// -------------------------------------------- INTEFACE

// enum UI_TYPE
UI_TYPE = {
    START: 0,
    PAUSE: 1,
    GAME_OVER: 2,
};

var lastNickname = localStorage.getItem('lastNickname') || 'MOI';

var hallOfFame = JSON.parse(localStorage.getItem('hallOfFame')) || [
    {name: '', score: 0},
    {name: '', score: 0},
    {name: '', score: 0},
    {name: '', score: 0},
    {name: '', score: 0},
];

/**
 * Met à jour le hall of fame dans le localstorage
 */
function updateHallOfFame() {
    localStorage.setItem('hallOfFame', JSON.stringify(hallOfFame));
}

/**
 * Met à jour lastNickname dans le localstorage
 */
function updateLastNickname() {
    localStorage.setItem('lastNickname', lastNickname);
}

/**
 * Montre une interface
 * @param {UI_TYPE} type
 */
function showInterface(type) {
    // Cache tous les contents
    $('.content').hide();

    hallOfFamePosition = -1;

    switch (type) {
        case UI_TYPE.START:
            $('#title').text('A\'valanche');
            $('#footer').text('(cliquez pour commencer)');
            $('#startContent').show();
            break;
        case UI_TYPE.PAUSE:
            $('#title').text('Pause');
            $('#footer').text('(cliquez pour reprendre)');
            $('#pauseContent').show();
            break;
        case UI_TYPE.GAME_OVER:
            $('#title').text('Game Over');
            $('#footer').text('(cliquez pour rejouer)');
            $('#gameOverContent').show();
            $('.current').removeClass('current');

            // Afficher les best of five
            for (var i=0; i<hallOfFame.length; i++) {
                if ( hallOfFamePosition == -1 && Math.floor(score/10) > hallOfFame[i].score ) { // Si on a un meilleur score
                    $($('.hallOfFameElement > span')[i]).html( Math.floor(score/10) + ' (<input id="nicknameInput"/>)');
                    $($('.hallOfFameElement > span')[i]).addClass('current');

                    hallOfFamePosition = i;

                    // Tout décaler
                    var length = hallOfFame.length;
                    for (var j = length -1; j >= hallOfFamePosition; j--) {
                        hallOfFame[length] = hallOfFame[j];
                        length--;
                    };
                    // Remplacer
                    hallOfFame[hallOfFamePosition] = {name: lastNickname, score: Math.floor(score/10)};
                    // Supprimer le dernier
                    hallOfFame.pop();

                    updateHallOfFame();
                }
                else if (hallOfFame[i].name !== '')
                    $($('.hallOfFameElement > span')[i]).text(hallOfFame[i].score + ' (' + hallOfFame[i].name + ')');
            }

            break;
    }

    $('#overlay').show();

    if (hallOfFamePosition > -1) {
        $('#nicknameInput').val(lastNickname);
        $('#nicknameInput').focus();
        $('#nicknameInput').select();

        document.addEventListener('keyup', onHallOfFameKeyUp);
    }
}

/**
 * Evènement taper au clavier halloffame
 */
function onHallOfFameKeyUp() {
    lastNickname = $('#nicknameInput').val();
    updateLastNickname();
    hallOfFame[hallOfFamePosition].name = lastNickname;
    updateHallOfFame();
};

/**
 * Cache l'inteface
 */
function hideInterface() {
    $('#overlay').hide();
}


// Evenement souris
document.addEventListener('click', function(event) {

    // Ignore les clicks dans l'input
    if ($(event.target).attr('id') === 'nicknameInput')
        return;

    if (!started || over) {
        document.removeEventListener('keyup', onHallOfFameKeyUp);
        start();
    }
    else if (paused)
        resume();
    else
        stop();
});

// Afficher le menu start
showInterface(UI_TYPE.START);
