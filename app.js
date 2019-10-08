'use strict';

const tetris = (function () {

    /*

        Tetris info taken from
        https://tetris.wiki/SRS

    */

    // let tetrominoesBM = new Image();
    // tetrominoesBM.src = 'tetrominoes.png';

    const STATE = {
        TITLE: 1,
        DROPPING: 2,
        CHECK_FOR_LINES: 3,
        REMOVE_LINES: 4,
        GAME_OVER: 5
    };
    const SCREEN_WIDTH = 600;
    const SCREEN_HEIGHT = 600;
    const GAME_WIDTH = 10;
    const GAME_HEIGHT = 20;
    const CELL_SIZE = 20;
    const CELL_EDGE_SIZE = 2;

    const INPUT_DELAY_TIME = 0.15;

    const FULL_LINE_ANIAMTION_TIME = 0.4;

    const SCORE_PIECE = 50;
    const SCORE_LINE = 1000;
    const SCORE_PUSHDOWN = 1;

    const GRAVITY_TICK_TIME_MAX = 0.8;
    const GRAVITY_TICK_TIME_MIN = 0.1;
    const GRAVITY_TICK_TIME_LINE_COUNT = 10;
    const GRAVITY_TICK_TIME_DELTA = 0.05;

    const STYLES = {
        backgroundColour: '#000000',
        borderColour: '#FFFFFF',
        borderSize: 5,
        uiFont1: 'bold 16px sans-serif',
        uiFont2: 'bold 40px sans-serif',
        uiFont3: 'bold 12px sans-serif',
        uiFont4: 'bold 16px sans-serif',
        uiColour1: '#009999',
        uiColour2: '#00FFFF',
        messageColour: '#FFFF00',
        messageColour2: '#FF8000',
        messageFont: 'bold 100px sans-serif',
        playareaBorderColour: '#FFFFFF',
        playareaBorderSize: 3,
    }

    const PIECES = [{
            size:           4,
            colourMain:     { r: 0, g: 155, b: 155 },
            colourEdge:     { r: 0, g: 255, b: 255 },
            cells:          '....' + '..X.' + '....' + '.X..' +
                            'XXXX' + '..X.' + '....' + '.X..' +
                            '....' + '..X.' + 'XXXX' + '.X..' +
                            '....' + '..X.' + '....' + '.X..'
        },
        {
            size:           3,
            colourMain:     { r: 0, g: 0, b: 155 },
            colourEdge:     { r: 0, g: 100, b: 255 },
            cells:          'X..' + '.XX' + '...' + '.X.' +
                            'XXX' + '.X.' + 'XXX' + '.X.' +
                            '...' + '.X.' + '..X' + 'XX.'
        },
        {
            size:           3,
            colourMain:     { r: 155, g: 69, b: 0 },
            colourEdge:     { r: 255, g: 169, b: 0 },
            cells:          '..X' + '.X.' + '...' + 'XX.' +
                            'XXX' + '.X.' + 'XXX' + '.X.' +
                            '...' + '.XX' + 'X..' + '.X.'
        },
        {
            size:           2,
            colourMain:     { r: 155, g: 155, b: 0 },
            colourEdge:     { r: 255, g: 255, b: 0 },
            cells:          'XX' + 'XX' + 'XX' + 'XX' +
                            'XX' + 'XX' + 'XX' + 'XX'
        },
        {
            size:           3,
            colourMain:     { r: 0, g: 155, b: 0 },
            colourEdge:     { r: 0, g: 255, b: 0 },
            cells:          '.XX' + '.X.' + '...' + 'X..' +
                            'XX.' + '.XX' + '.XX' + 'XX.' +
                            '...' + '..X' + 'XX.' + '.X.'
        },
        {
            size:           3,
            colourMain:     { r: 70, g: 0, b: 155 },
            colourEdge:     { r: 170, g: 0, b: 255 },
            cells:          '.X.' + '.X.' + '...' + '.X.' +
                            'XXX' + '.XX' + 'XXX' + 'XX.' +
                            '...' + '.X.' + '.X.' + '.X.'
        },
        {
            size:           3,
            colourMain:     { r: 155, g: 0, b: 0 },
            colourEdge:     { r: 255, g: 0, b: 0 },
            cells:          'XX.' + '..X' + '...' + '.X.' +
                            '.XX' + '.XX' + 'XX.' + 'XX.' +
                            '...' + '.X.' + '.XX' + 'X..'
        }
    ];

    // y values inverted from original source; original assumes y increases up the screen
    //ktAB - A = current rotation index (0-3), B = requested rotation index (0-3)
    const KICKTESTS_3x3 = {
        kt01: [0, 0, -1, 0, -1, -1, 0, +2, -1, +2],
        kt10: [0, 0, +1, 0, +1, +1, 0, -2, +1, -2],
        kt12: [0, 0, +1, 0, +1, +1, 0, -2, +1, -2],
        kt21: [0, 0, -1, 0, -1, -1, 0, +2, -1, +2],
        kt23: [0, 0, +1, 0, +1, -1, 0, +2, +1, +2],
        kt32: [0, 0, -1, 0, -1, +1, 0, -2, -1, -2],
        kt30: [0, 0, -1, 0, -1, +1, 0, -2, -1, -2],
        kt03: [0, 0, +1, 0, +1, -1, 0, +2, +1, +2]
    }
    const KICKTESTS_4x4 = {
        kt01: [0, 0, -2, 0, +1, 0, -2, +1, +1, -2],
        kt10: [0, 0, +2, 0, -1, 0, +2, -1, -1, +2],
        kt12: [0, 0, -1, 0, +2, 0, -1, -2, +2, +1],
        kt21: [0, 0, +1, 0, -2, 0, +1, +2, -2, -1],
        kt23: [0, 0, +2, 0, -1, 0, +2, -1, -1, +2],
        kt32: [0, 0, -2, 0, +1, 0, -2, +1, +1, -2],
        kt30: [0, 0, +1, 0, -2, 0, +1, +2, -2, -1],
        kt03: [0, 0, -1, 0, +2, 0, -1, -2, +2, +1]
    }

    const HISCORE_KEY = 'TetrisHiscore';

    let gameState, gameStateTime;
    let xpos, ypos, rotation, type, nextType;
    let score, hiscore, pieceCount, lineCount, tetrisCount;
    let gravityTickTime, gravityTickCurrent;
    let inputDelay;
    let playarea;
    let playareaFullLines;

    let ctx = document.getElementById('theCanvas').getContext('2d');
    //ctx.globalCompositeOperation = '';

    let previousTimestamp = (Date.now() / 1000.0);


    let playareaBitmap = ctx.createImageData(GAME_WIDTH * CELL_SIZE, GAME_HEIGHT * CELL_SIZE);

    let LAYOUT = {};
    LAYOUT.midX = SCREEN_WIDTH * 0.5;
    LAYOUT.midY = SCREEN_HEIGHT * 0.5;
    LAYOUT.playareaW = GAME_WIDTH * CELL_SIZE;
    LAYOUT.playareaH = GAME_HEIGHT * CELL_SIZE;
    LAYOUT.playareaX = Math.floor((SCREEN_WIDTH - LAYOUT.playareaW) * 0.5);
    LAYOUT.playareaY = Math.floor((SCREEN_HEIGHT - LAYOUT.playareaH) * 0.5);
    LAYOUT.nextPieceX = LAYOUT.playareaX + LAYOUT.playareaW + Math.floor((SCREEN_WIDTH - LAYOUT.playareaX - LAYOUT.playareaW) * 0.5);
    LAYOUT.nextPieceY = LAYOUT.playareaY;
    LAYOUT.uiX = Math.floor(LAYOUT.playareaX * 0.5);
    LAYOUT.uiY = LAYOUT.playareaY;

    const KEY_MOVE_LEFT = 'ArrowLeft';
    const KEY_MOVE_RIGHT = 'ArrowRight';
    const KEY_MOVE_DOWN = 'ArrowDown';
    const KEY_ROTATE_CW = 'x';
    const KEY_ROTATE_CCW = 'z';
    const KEY_SPACE = ' ';
    let KEYBOARD_STATE = {};
    document.onkeyup = (e) => KEYBOARD_STATE[e.key] = false;
    document.onkeydown = (e) => KEYBOARD_STATE[e.key] = true;
    // document.onmousedown = (e) => {
    //     console.log('============================================');
    //     for (let y = 0; y < GAME_HEIGHT; y++) {
    //         let txt = y + ') ';
    //         for (let x = 0; x < GAME_WIDTH; x++) {
    //             txt += (playarea[y][x] == -1) ? '.' : 'X';
    //         }
    //         console.log(txt);
    //     }
    // };

    initGame();
    setState(STATE.TITLE);
    generatePieceBitmaps();
    requestAnimationFrame(gameLoop);


    function gameLoop() {
        let currentTimestamp = (Date.now() / 1000.0);
        let dt = currentTimestamp - previousTimestamp;
        previousTimestamp = currentTimestamp;
        gameStateTime += dt;

        switch (gameState) {
            case STATE.TITLE:
                if (KEYBOARD_STATE[KEY_SPACE] == true) {
                    startGame();
                }
                break;
            case STATE.DROPPING:
                handlePlayerInput(dt);
                let hasHit = handleGravity(dt);
                if (hasHit == true) {
                    score += SCORE_PIECE;
                    setState(STATE.CHECK_FOR_LINES);
                }
                break;
            case STATE.CHECK_FOR_LINES:
                addPieceToPlayarea();
                playareaFullLines = findFullLines(ypos);
                if (playareaFullLines.length == 0) {
                    //let isDead = isPileAtTop();
                    //if (isDead == false) {
                    if (initTetromino() == true) {
                        setState(STATE.DROPPING);
                    } else {
                        setState(STATE.GAME_OVER);
                    }
                    // }
                    // else
                    // {
                    //     type = -1;
                    //     setState(STATE.GAME_OVER);
                    // }
                } else {
                    lineCount += playareaFullLines.length;
                    if (playareaFullLines.length == 4) tetrisCount++;
                    let scoreMultiplier = Math.floor(1 + lineCount / 40);
                    score += ((SCORE_LINE * scoreMultiplier) << (playareaFullLines.length - 1));
                    setState(STATE.REMOVE_LINES);
                }
                break;
            case STATE.REMOVE_LINES:
                if (gameStateTime >= FULL_LINE_ANIAMTION_TIME) {
                    for (let i = 0; i < playareaFullLines.length; i++) {
                        removeRowAndShiftDownPlayarea(playareaFullLines[i]);
                        removeRowAndShiftDownPlayareaBitmap(playareaFullLines[i]);
                        redrawEdgesAfterSplit(playareaFullLines[i]);
                    }
                    playareaFullLines = [];
                    if (initTetromino() == true) {
                        setState(STATE.DROPPING);
                    } else {
                        setState(STATE.GAME_OVER);
                    }
                }
                break;
            case STATE.GAME_OVER:
                if (KEYBOARD_STATE[KEY_SPACE] == true) {
                    startGame();
                }
                else if (gameStateTime > 3) {
                    setState(STATE.TITLE);
                }
                break;
        }
        if (score > hiscore) {
            hiscore = score;
            localStorage.setItem(HISCORE_KEY, hiscore);
        }
        render();
        requestAnimationFrame(gameLoop);
    }
    /*================================================================================
        STATE ACTIONS
    ================================================================================*/

    function initGame() {
        score = 0;
        hiscore = localStorage.getItem(HISCORE_KEY) || 0;
        score = 0;
        pieceCount = 0;
        lineCount = 0;
        tetrisCount = 0;
        nextType = -1;
        type = -1;
        clearPlayareaBitmap();
    }

    function startGame() {
        inputDelay = 0;
        score = 0;
        pieceCount = 0;
        lineCount = 0;
        tetrisCount = 0;
        gravityTickTime = GRAVITY_TICK_TIME_MAX;
        gravityTickCurrent = 0;
        //clear play area
        playarea = [];
        for (let y = 0; y < GAME_HEIGHT; y++) {
            playarea[y] = [];
            for (let x = 0; x < GAME_WIDTH; x++) {
                playarea[y][x] = {
                    type: -1,
                    id: -1
                };
            }
        }
        clearPlayareaBitmap();
        //first piece
        nextType = Math.floor(Math.random() * PIECES.length);
        initTetromino();
        setState(STATE.DROPPING);
    }

    function initTetromino() {
        // calc gravity tick
        gravityTickCurrent = 0;
        gravityTickTime = Math.max(GRAVITY_TICK_TIME_MIN, GRAVITY_TICK_TIME_MAX - Math.floor(lineCount / GRAVITY_TICK_TIME_LINE_COUNT) * GRAVITY_TICK_TIME_DELTA);
        //set new piece
        type = nextType;
        rotation = 0;
        xpos = Math.floor((GAME_WIDTH - Math.round(PIECES[type].size)) * 0.5);
        ypos = 0;
        pieceCount++;
        // pick next piece
        while (type === nextType)
        {
            nextType = Math.floor(Math.random() * PIECES.length);
        }
        //check if ew piece topping out
        let isToppedOut = false;
        if (checkForPieceCollision(xpos, ypos, type, rotation) == true) {
            isToppedOut = true;
            //if colliding, move y up until no collsion position found (so we can render the 'breaking' piece)
            ypos--;
            while (checkForPieceCollision(xpos, ypos, type, rotation) == true) {
                ypos--;
            }
        }
        return !isToppedOut;
    }

    /*================================================================================
        PIECE MOVEMENT
    ================================================================================*/

    function handlePlayerInput(dt) {

        let size = PIECES[type].size;
        //user actions
        inputDelay -= dt;
        if (inputDelay <= 0) {
            if (KEYBOARD_STATE[KEY_MOVE_LEFT] == true && checkForPieceCollision(xpos - 1, ypos, type, rotation) == false) {
                xpos--;
                inputDelay = INPUT_DELAY_TIME;
            }
            if (KEYBOARD_STATE[KEY_MOVE_RIGHT] == true && checkForPieceCollision(xpos + 1, ypos, type, rotation) == false) {
                xpos++;
                inputDelay = INPUT_DELAY_TIME;
            }
            if (KEYBOARD_STATE[KEY_MOVE_DOWN] == true && checkForPieceCollision(xpos, ypos + 1, type, rotation) == false) {
                ypos++;
                inputDelay = INPUT_DELAY_TIME * 0.25;
                gravityTickCurrent = 0;
                let scoreMultiplier = Math.floor(1 + lineCount / 40);
                score += SCORE_PUSHDOWN * scoreMultiplier;
            }
            if (size > 2 && (KEYBOARD_STATE[KEY_ROTATE_CW] == true || KEYBOARD_STATE[KEY_ROTATE_CCW] == true)) {
                let currentRotation = rotation;
                let newRotation = (KEYBOARD_STATE[KEY_ROTATE_CW] == true) ? ((rotation + 1) % 4) : ((rotation + 3) % 4);
                let key = "kt" + currentRotation + newRotation;
                let kicks = (size == 3) ? KICKTESTS_3x3[key] : KICKTESTS_4x4[key];
                let kickXYindex = 0;
                while (kickXYindex < kicks.length) {
                    if (checkForPieceCollision(xpos + kicks[kickXYindex], ypos + kicks[kickXYindex + 1], type, newRotation) == false) {
                        rotation = newRotation;
                        xpos += kicks[kickXYindex];
                        ypos += kicks[kickXYindex + 1];
                        inputDelay = INPUT_DELAY_TIME;
                        break;
                    }
                    kickXYindex += 2;
                }
            }
        }
    }

    function handleGravity(dt) {
        //if piece about to hit something and stop, reduce the gravity tick time so
        //piece does not "appear" to have stopped, but is actually still controllable
        let hasGrounded = false;
        let isAboutToGround = checkForPieceCollision(xpos, ypos + 1, type, rotation);
        let maxGravityTime = (isAboutToGround) ? (gravityTickTime * 0.25) : gravityTickTime;
        gravityTickCurrent += dt;
        if (gravityTickCurrent >= maxGravityTime) {
            gravityTickCurrent = 0;
            hasGrounded = isAboutToGround;
            if (isAboutToGround == false) {
                ypos++;
            }
        }
        return hasGrounded;
    }

    /*================================================================================
        STUFF
    ================================================================================*/

    function checkForPieceCollision(xpos, ypos, type, rotation) {
        let currentPieceSize = PIECES[type].size;
        for (let y = 0; y < currentPieceSize; y++) {
            let playareaY = ypos + y;
            if (playareaY >= 0) {
                for (let x = 0; x < currentPieceSize; x++) {
                    if (getRotatedPiecePart(x, y, type, rotation) === 'X') {
                        let playareaX = xpos + x;
                        if (playareaX < 0 || playareaX >= GAME_WIDTH || playareaY >= GAME_HEIGHT) return true;
                        if (playarea[playareaY][playareaX].type !== -1) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    function addPieceToPlayarea() {
        //add to data
        let currentPieceSize = PIECES[type].size;
        for (let y = 0; y < currentPieceSize; y++) {
            if ((ypos + y) >= 0) {
                for (let x = 0; x < currentPieceSize; x++) {
                    if (getRotatedPiecePart(x, y, type, rotation) === 'X') {
                        playarea[ypos + y][xpos + x].type = type;
                        playarea[ypos + y][xpos + x].id = pieceCount;
                    }
                }
            }
        }
        //add to bitmap
        playareaBitmap = ctx.getImageData(LAYOUT.playareaX, LAYOUT.playareaY, GAME_WIDTH * CELL_SIZE, GAME_HEIGHT * CELL_SIZE);
    }

    function getRotatedPiecePart(x, y, type, rotation) {
        let size = PIECES[type].size;
        return PIECES[type].cells[rotation * size + x + y * size * 4];
    }

    /*================================================================================
        STUFF
    ================================================================================*/

    function render() {

        //clear screen
        ctx.fillStyle = STYLES.backgroundColour;
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

        //draw screen
        ctx.strokeStyle = STYLES.borderColour;
        ctx.lineWidth = STYLES.borderSize * 2;
        ctx.strokeRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

        //draw playarea
        //if (gameState != STATE.TITLE) {
            ctx.strokeStyle = STYLES.playareaBorderColour;
            ctx.lineWidth = STYLES.playareaBorderSize;
            let left = LAYOUT.playareaX - STYLES.playareaBorderSize * 0.5;
            let top = LAYOUT.playareaY - STYLES.playareaBorderSize * 0.5;
            let right = left + GAME_WIDTH * CELL_SIZE + STYLES.playareaBorderSize;
            let bottom = top + GAME_HEIGHT * CELL_SIZE + STYLES.playareaBorderSize;
            ctx.beginPath();
            ctx.moveTo(left, top);
            ctx.lineTo(left, bottom);
            ctx.lineTo(right, bottom);
            ctx.lineTo(right, top);
            ctx.stroke();
            ctx.putImageData(playareaBitmap, LAYOUT.playareaX, LAYOUT.playareaY);
        //}

        //draw next piece
        if (gameState != STATE.GAME_OVER && nextType != -1) {
            //drawPiece(LAYOUT.nextPieceX, LAYOUT.nextPieceY, nextType, 0);
            let bmSize = PIECES[nextType].size * CELL_SIZE;
            drawPiece(LAYOUT.nextPieceX - bmSize * 0.5, LAYOUT.nextPieceY, nextType, 0);
            //ctx.drawImage(tetrominoesBM, 0, CELL_SIZE * 4 * nextType, bmSize, bmSize, LAYOUT.nextPieceX - bmSize * 0.5, LAYOUT.nextPieceY, bmSize, bmSize);
        }

        //draw active piece
        if (gameState != STATE.REMOVE_LINES && type != -1) {
            drawPiece(LAYOUT.playareaX + xpos * CELL_SIZE, LAYOUT.playareaY + ypos * CELL_SIZE, type, rotation);
        }
        //draw full line glow
        if (gameState == STATE.REMOVE_LINES) {
            let ratioOfAnimationPart1 = Math.min(1, 2 * gameStateTime / FULL_LINE_ANIAMTION_TIME);
            let ratioOfAnimationPart2 = Math.max(0, 2 * gameStateTime / FULL_LINE_ANIAMTION_TIME - 1);
            let r = 255 - 255 * ratioOfAnimationPart2;
            let g = 255 - 255 * ratioOfAnimationPart2;
            let b = 255 - 255 * ratioOfAnimationPart2;
            let a = ratioOfAnimationPart1;
            let colStyle = `rgba(${r},${g},${b},${a})`;
            for (let i = 0; i < playareaFullLines.length; i++) {
                ctx.fillStyle = colStyle;
                ctx.fillRect(LAYOUT.playareaX, LAYOUT.playareaY + playareaFullLines[i] * CELL_SIZE, GAME_WIDTH * CELL_SIZE, CELL_SIZE);
            }
        }

        //draw ui
        //if (gameState != STATE.TITLE) {
            let uiXpos = LAYOUT.uiX;
            let uiYpos = LAYOUT.uiY;
            renderUItext('HISCORE:', uiXpos, uiYpos, STYLES.uiFont1, STYLES.uiColour1);
            uiYpos += 20;
            renderUItext(hiscore.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), uiXpos, uiYpos, STYLES.uiFont2, STYLES.uiColour2);
            uiYpos += 60;
            renderUItext('SCORE:', uiXpos, uiYpos, STYLES.uiFont1, STYLES.uiColour1);
            uiYpos += 20;
            renderUItext(score.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), uiXpos, uiYpos, STYLES.uiFont2, STYLES.uiColour2);
            uiYpos += 150;
            renderUItext('PIECES:', uiXpos, uiYpos, STYLES.uiFont3, STYLES.uiColour1);
            uiYpos += 16;
            renderUItext(pieceCount, uiXpos, uiYpos, STYLES.uiFont4, STYLES.uiColour2);
            uiYpos += 32;
            renderUItext('LINES:', uiXpos, uiYpos, STYLES.uiFont3, STYLES.uiColour1);
            uiYpos += 16;
            renderUItext(lineCount, uiXpos, uiYpos, STYLES.uiFont4, STYLES.uiColour2);
            uiYpos += 32;
            renderUItext('TETRII:', uiXpos, uiYpos, STYLES.uiFont3, STYLES.uiColour1);
            uiYpos += 16;
            renderUItext(tetrisCount, uiXpos, uiYpos, STYLES.uiFont4, STYLES.uiColour2);
        //}

        if (gameState == STATE.TITLE || gameState == STATE.GAME_OVER)
        {
            ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
            ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
        }
        
        if (gameState == STATE.TITLE) {
            renderUItitle(["TETRIS"], STYLES.messageFont, STYLES.messageColour, STYLES.messageColour2);
            renderUItext("PRESS SPACE TO PLAY", SCREEN_WIDTH* 0.5, SCREEN_HEIGHT * 0.9, STYLES.uiFont1, STYLES.messageColour);
        }

        if (gameState == STATE.GAME_OVER) {
            renderUItitle(["GAME","OVER"], STYLES.messageFont, STYLES.messageColour, STYLES.messageColour2);
        }
    }

    function renderUItitle(strs, font, colour1, colour2)
    {
        ctx.font = font;
        ctx.fillStyle = colour1;
        ctx.strokeStyle = colour2;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 10;
        ctx.lett
        ctx.miterLimit = 5;
        const GAP = 120;
        let ypos = LAYOUT.midY - (strs.length - 1) * GAP * 0.5;
        for (let i = 0; i < strs.length; i++) {
            ctx.strokeText(strs[i], LAYOUT.midX, ypos);
            ctx.fillText(strs[i], LAYOUT.midX, ypos);
            ypos += GAP;
        }
    }

    function renderUItext(str, x, y, font, colour) {
        ctx.font = font;
        ctx.fillStyle = colour;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(str, x, y);
    }

    /*================================================================================
        STUFF
    ================================================================================*/

    function drawPiece(xpos, ypos, type, rotation) {
        let bmSize = PIECES[type].size * CELL_SIZE;
        // let xSrc = CELL_SIZE * 4 * rotation;
        // let ySrc = CELL_SIZE * 4 * type;
        //ctx.drawImage(tetrominoesBM, xSrc, ySrc, bmSize, bmSize, xpos, ypos, bmSize, bmSize);
        let srcData = PIECES[type].imageData;
        let destData = ctx.getImageData(xpos, ypos, bmSize, bmSize);
        let srcIndex, destIndex = 0;
        for (let y = 0; y < bmSize; y++) {
            for (let x = 0; x < bmSize; x++) {
                switch (rotation) {
                    case 0:
                        srcIndex = destIndex;
                        break;
                    case 1:
                        srcIndex = 4 * ((bmSize * (bmSize - 1)) - (bmSize * x) + y);
                        break;
                    case 2:
                        srcIndex = 4 * ((bmSize * bmSize - 1) - x - bmSize * y);
                        break;
                    case 3:
                        srcIndex = 4 * ((bmSize - 1) + (bmSize * x) - y);
                        break;
                }
                if (srcData.data[srcIndex + 3] > 0) {
                    destData.data[destIndex + 0] = srcData.data[srcIndex + 0];
                    destData.data[destIndex + 1] = srcData.data[srcIndex + 1];
                    destData.data[destIndex + 2] = srcData.data[srcIndex + 2];
                    destData.data[destIndex + 3] = srcData.data[srcIndex + 3];
                }
                destIndex += 4;
            }
        }
        ctx.putImageData(destData, xpos, ypos);
    }

    function setState(newState) {
        gameStateTime = 0;
        gameState = newState;
    }

    /*================================================================================
        LINES
    ================================================================================*/

    function findFullLines(ystart) {
        let result = [];
        //find full lines
        ystart = Math.max(0, ystart);
        let yend = Math.min(GAME_HEIGHT - 1, ystart + 3);
        for (let y = ystart; y <= yend; y++) {
            let isFull = true;
            for (let x = 0; x < GAME_WIDTH; x++) {
                if (playarea[y][x].type == -1) {
                    isFull = false;
                    break;
                }
            }
            if (isFull == true) result.push(y);
        }
        return result;
    }

    function removeRowAndShiftDownPlayarea(rowToRemove) {
        for (let y = rowToRemove; y > 0; y--) {
            for (let x = 0; x < GAME_WIDTH; x++) {
                playarea[y][x] = playarea[y - 1][x];
            }
        }
        //fill top line with empty
        for (let x = 0; x < GAME_WIDTH; x++) {
            playarea[0][x] = {
                type: -1,
                id: -1
            };
        }
    }

    function removeRowAndShiftDownPlayareaBitmap(rowToRemove) {
        let rowIndexCount = GAME_WIDTH * CELL_SIZE * CELL_SIZE * 4;
        let lastIndexOfSrc = rowToRemove * rowIndexCount - 4;
        for (let i = lastIndexOfSrc; i >= 0; i -= 4) {
            playareaBitmap.data[rowIndexCount + i + 0] = playareaBitmap.data[i + 0];
            playareaBitmap.data[rowIndexCount + i + 1] = playareaBitmap.data[i + 1];
            playareaBitmap.data[rowIndexCount + i + 2] = playareaBitmap.data[i + 2];
            playareaBitmap.data[rowIndexCount + i + 3] = playareaBitmap.data[i + 3];
        }
        //clear top row
        for (let i = 0; i < rowIndexCount; i += 4) {
            playareaBitmap.data[i + 0] = 0;
            playareaBitmap.data[i + 1] = 0;
            playareaBitmap.data[i + 2] = 0;
            playareaBitmap.data[i + 3] = 255;
        }
    }

    function clearPlayareaBitmap() {
        let len = playareaBitmap.data.length;
        for (let i = 0; i < len; i += 4) {
            playareaBitmap.data[i + 0] = 0;
            playareaBitmap.data[i + 1] = 0;
            playareaBitmap.data[i + 2] = 0;
            playareaBitmap.data[i + 3] = 255;
        }
    }

    function redrawEdgesAfterSplit(rowRemoved) {
        for (let i = 0; i < GAME_WIDTH; i++) {
            let cellAboveType = playarea[rowRemoved][i].type;
            let cellBelowType = (rowRemoved < GAME_HEIGHT - 1) ? playarea[rowRemoved + 1][i].type : -1;
            if (cellAboveType != -1) {
                let dataStartIndex = rowRemoved * (GAME_WIDTH * CELL_SIZE * CELL_SIZE * 4);
                drawCellRect(playareaBitmap, dataStartIndex, GAME_WIDTH, i * CELL_SIZE, CELL_SIZE - CELL_EDGE_SIZE, CELL_SIZE, CELL_EDGE_SIZE, PIECES[cellAboveType].colourEdge);
            }
            if (cellBelowType != -1) {
                let dataStartIndex = (rowRemoved + 1) * (GAME_WIDTH * CELL_SIZE * CELL_SIZE * 4);
                drawCellRect(playareaBitmap, dataStartIndex, GAME_WIDTH, i * CELL_SIZE, 0, CELL_SIZE, CELL_EDGE_SIZE, PIECES[cellBelowType].colourEdge);
            }
        }
    }

    /*================================================================================
        GENERATE PIECE BITMAPS
    ================================================================================*/

    function generatePieceBitmaps() {
        for (let i = 0; i < PIECES.length; i++) {
            let size = PIECES[i].size;
            let cellData = PIECES[i].cells;
            let imageData = ctx.createImageData(size * CELL_SIZE, size * CELL_SIZE);
            for (let x = 0; x < size; x++) {
                for (let y = 0; y < size; y++) {
                    if (cellData[x + y * size * 4] == 'X') {
                        let edgeN = (y == 0);
                        let edgeE = (x == size - 1);
                        let edgeS = (y == size - 1);
                        let edgeW = (x == 0);
                        let neighbours = {};
                        neighbours.N = (edgeN == false && cellData[(x + 0) + (y - 1) * size * 4] == 'X');
                        neighbours.NE = (edgeE == false && edgeN == false && cellData[(x + 1) + (y - 1) * size * 4] == 'X');
                        neighbours.E = (edgeE == false && cellData[(x + 1) + (y + 0) * size * 4] == 'X');
                        neighbours.SE = (edgeE == false && edgeS == false && cellData[(x + 1) + (y + 1) * size * 4] == 'X');
                        neighbours.S = (edgeS == false && cellData[(x + 0) + (y + 1) * size * 4] == 'X');
                        neighbours.SW = (edgeW == false && edgeS == false && cellData[(x - 1) + (y + 1) * size * 4] == 'X');
                        neighbours.W = (edgeW == false && cellData[(x - 1) + (y + 0) * size * 4] == 'X');
                        neighbours.NW = (edgeW == false && edgeN == false && cellData[(x - 1) + (y - 1) * size * 4] == 'X');

                        drawPieceCell(imageData, x, y, size, PIECES[i].colourMain, PIECES[i].colourEdge, neighbours);
                    }
                }
            }
            PIECES[i].imageData = imageData;
        }
    }

    function drawPieceCell(data, cellx, celly, size, colM, colE, neighbours) {
        let startIndex = 4 * (cellx * CELL_SIZE + celly * CELL_SIZE * size * CELL_SIZE);

        drawCellRect(data, startIndex, size, 0, 0, CELL_SIZE, CELL_SIZE, colM);
        //draw edges?
        if (neighbours.N == false) {
            drawCellRect(data, startIndex, size, 0, 0, CELL_SIZE, CELL_EDGE_SIZE, colE);
        }
        if (neighbours.E == false) {
            drawCellRect(data, startIndex, size, CELL_SIZE - CELL_EDGE_SIZE, 0, CELL_EDGE_SIZE, CELL_SIZE, colE);
        }
        if (neighbours.W == false) {
            drawCellRect(data, startIndex, size, 0, 0, CELL_EDGE_SIZE, CELL_SIZE, colE);
        }
        if (neighbours.S == false) {
            drawCellRect(data, startIndex, size, 0, CELL_SIZE - CELL_EDGE_SIZE, CELL_SIZE, CELL_EDGE_SIZE, colE);
        }
        //draw corners?
        if ( /* neighbours.N == true && neighbours.E == true &&  */ neighbours.NE == false) {
            drawCellRect(data, startIndex, size, CELL_SIZE - CELL_EDGE_SIZE, 0, CELL_EDGE_SIZE, CELL_EDGE_SIZE, colE);
        }
        if ( /* neighbours.E == true && neighbours.S == true &&  */ neighbours.SE == false) {
            drawCellRect(data, startIndex, size, CELL_SIZE - CELL_EDGE_SIZE, CELL_SIZE - CELL_EDGE_SIZE, CELL_EDGE_SIZE, CELL_EDGE_SIZE, colE);
        }
        if ( /* neighbours.S == true && neighbours.W == true &&  */ neighbours.SW == false) {
            drawCellRect(data, startIndex, size, 0, CELL_SIZE - CELL_EDGE_SIZE, CELL_EDGE_SIZE, CELL_EDGE_SIZE, colE);
        }
        if ( /* neighbours.W == true && neighbours.N == true &&  */ neighbours.NW == false) {
            drawCellRect(data, startIndex, size, 0, 0, CELL_EDGE_SIZE, CELL_EDGE_SIZE, colE);
        }

    }

    function drawCellRect(data, dataStartIndex, size, xs, ys, w, h, col) {
        for (let y = ys; y < (ys + h); y++) {
            for (let x = xs; x < (xs + w); x++) {
                let byteIndex = dataStartIndex + 4 * (x + y * CELL_SIZE * size);
                data.data[byteIndex + 0] = col.r;
                data.data[byteIndex + 1] = col.g;
                data.data[byteIndex + 2] = col.b;
                data.data[byteIndex + 3] = 255;
            }
        }
    }


}());