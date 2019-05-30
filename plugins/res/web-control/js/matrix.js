
//Building Block Unit
const unit = 20;
const density = 1;
const tailUnit = 25;
const optimize = 3;


//Canvas settings and units
var canvas;
var c;
var windowWidth;
var windowHeight;
var width;
var height;
var wUnit;
var hUnit;
var ctx;

//FPS Counter Vars
var fps = 0;
var lastsecond = Date.now();
var numFrame = 0;

//Matrix's needed for Matrix Rain
var valueMatrix = [];
var effectMatrix = [];
var speedMatrix = [];

//Canvas Setup
function canvasResize() {
    speedMatrix = [];
    effectMatrix = [];
    valueMatrix = [];
    windowWidth = window.innerWidth;
    windowHeight = window.innerHeight;
    canvas.width = windowWidth;
    canvas.height = windowHeight;
    width = Math.ceil((windowWidth / unit) / optimize);
    height = Math.ceil((windowHeight / unit) / optimize);
    wUnit = (windowWidth / width) / optimize;
    hUnit = (windowHeight / height) / optimize;
    buildValueMatrix();
    buildEffectMatrix();
    buildSpeedMatrix();
}

//Setup Matrix Background

(function setup() {

    canvas = document.createElement('canvas');
    canvas.width = windowWidth;
    canvas.height = windowHeight;
    c = document.body.appendChild(canvas);
    c.style.backgroundColor = '#000';
    c.style.position = "fixed";
    c.style.top = "0px";
    c.style.left = "0px";
    ctx = c.getContext('2d');
    ctx.globalCompositeOperation = 'destination-over';
    window.addEventListener('resize', canvasResize);
    canvasResize();
    draw();
})();

//FPS Counter

function fpsCounter() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, 37, 13);
    ctx.font = '10px Arial';
    ctx.fillStyle = 'white';
    ctx.fillText(fps + ' FPS', 2, 10);
    let now = Date.now();
    if (now - lastsecond > 1000) {
        lastsecond = now;
        fps = numFrame;
        numFrame = 0;
    }
}

function iterator() {
    ctx.font = hUnit + 'px Arial';
    for (let i = width - 1; i >= 0; i--) {
        for (let j = height - 1; j >= 0; j--) {
            let effectValue = effectMatrix[j][i];
            if (effectValue == 'x') {
                let jump = j;
                if (numFrame % speedMatrix[i] == 0) {
                    jump = j + 1 < height ? j + 1 : 0;
                    effectMatrix[j][i] = 255;
                    effectMatrix[jump][i] = 'x';
                }
                ctx.fillStyle = 'rgb(255,255,255)';
                for (let k = 0; k < optimize; k++) {
                    for (let l = 0; l < optimize; l++) {
                        ctx.fillText(valueMatrix[jump][i], l * width * wUnit + i * wUnit, k * height * hUnit + (j * hUnit + hUnit));
                    }
                }
            } else if (effectValue > 0) {
                if (numFrame % speedMatrix[i] == 0) {
                    effectMatrix[j][i] -= tailUnit;
                }
                if (effectMatrix[j][i] > 0) {
                    ctx.fillStyle = 'rgba(153, 50, 204, ' + effectMatrix[j][i] / 255 + ')';
                    for (let k = 0; k < optimize; k++) {
                        for (let l = 0; l < optimize; l++) {
                            ctx.fillText(valueMatrix[j][i], l * width * wUnit + i * wUnit, k * height * hUnit + (j * hUnit + hUnit));
                        }
                    }
                }
            }
        }
    }
}

function buildEffectMatrix() {
    for (let i = 0; i < height; i++) {
        let tmpLine = [];
        for (let j = 0; j < width; j++) {
            tmpLine.push(0);
        }
        effectMatrix.push(tmpLine);
    }
    for (let i = 0; i < width; i++) {
        let pos = [];
        let headNumber = density;
        while (headNumber > 0) {
            let random = Math.ceil((height - 1) * Math.random());
            if (!pos.includes(random)) {
                pos.push(random);
                effectMatrix[random][i] = 'x';
                headNumber--;
            }
        }
    }
}

function buildValueMatrix() {
    for (let i = 0; i < height; i++) {
        let tmpLine = [];
        for (let j = 0; j < width; j++) {
            tmpLine.push(String.fromCharCode(Math.floor(33 + 93 * Math.random())));
        }
        valueMatrix.push(tmpLine);
    }
}

function buildSpeedMatrix() {
    for (let i = 0; i < width; i++) {
        speedMatrix.push(1 + Math.ceil(2 * Math.random()));
    }
}


function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    iterator();
    fpsCounter();
    numFrame++;
    requestAnimationFrame(draw);
}
