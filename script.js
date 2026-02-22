const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const resetBtn = document.getElementById('reset-btn');

let width, height;
let tsums = [];
let selectedTsums = [];
const emojis = ['CHINKO', '🐸', '🐰', '🐷', '🐻'];
let score = 0;

function init() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    tsums = [];
    spawnTsums(40); // 最初に40個降らせる
}

class Tsum {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.emoji = emojis[Math.floor(Math.random() * emojis.length)];
        this.radius = 35; 
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = 0;
        this.gravity = 0.8; // 重力を強めてドッシリさせる
        this.friction = 0.8; // 摩擦（空気抵抗）を強く
        this.isSelected = false;
    }

    update() {
        this.vy += this.gravity;
        
        // 速度を常に減速させて暴走を止める
        this.vx *= this.friction;
        this.vy *= this.friction;

        this.x += this.vx;
        this.y += this.vy;

        // 床の判定（跳ね返りをほぼゼロに）
        if (this.y + this.radius > height) {
            this.y = height - this.radius;
            this.vy *= -0.1;
        }
        // 壁の判定
        if (this.x + this.radius > width) {
            this.x = width - this.radius;
            this.vx *= -0.5;
        } else if (this.x - this.radius < 0) {
            this.x = this.radius;
            this.vx *= -0.5;
        }

        // ツム同士の重なり回避（ねっとり動くように調整）
        tsums.forEach(other => {
            if (other === this) return;
            const dx = other.x - this.x;
            const dy = other.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = this.radius + other.radius;

            if (distance < minDistance) {
                const angle = Math.atan2(dy, dx);
                const push = (minDistance - distance) * 0.1; 
                this.vx -= Math.cos(angle) * push;
                this.vy -= Math.sin(angle) * push;
                other.vx += Math.cos(angle) * push;
                other.vy += Math.sin(angle) * push;
            }
        });
        
        // 完全に止まりやすくする処理
        if (Math.abs(this.vx) < 0.05) this.vx = 0;
        if (Math.abs(this.vy) < 0.05) this.vy = 0;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        if (this.isSelected) {
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 5, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
            ctx.fill();
        }
        ctx.font = `${this.radius * 2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.emoji, 0, 0);
        ctx.restore();
    }
}

function spawnTsums(count) {
    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            tsums.push(new Tsum(Math.random() * width, -100));
        }, i * 50);
    }
}

function animate() {
    ctx.clearRect(0, 0, width, height);
    
    if (selectedTsums.length > 0) {
        ctx.beginPath();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
        ctx.lineWidth = 8;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.moveTo(selectedTsums[0].x, selectedTsums[0].y);
        for (let i = 1; i < selectedTsums.length; i++) {
            ctx.lineTo(selectedTsums[i].x, selectedTsums[i].y);
        }
        ctx.stroke();
    }

    tsums.forEach(tsum => {
        tsum.update();
        tsum.draw();
    });
    requestAnimationFrame(animate);
}

canvas.addEventListener('pointerdown', startSelect);
canvas.addEventListener('pointermove', dragSelect);
window.addEventListener('pointerup', endSelect);

function startSelect(e) { checkTsum(e.clientX, e.clientY); }
function dragSelect(e) { if (e.buttons > 0) checkTsum(e.clientX, e.clientY); }

function checkTsum(x, y) {
    tsums.forEach(tsum => {
        const dx = x - tsum.x;
        const dy = y - tsum.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < tsum.radius && !tsum.isSelected) {
            if (selectedTsums.length === 0 || 
               (selectedTsums[0].emoji === tsum.emoji && isNear(tsum, selectedTsums[selectedTsums.length-1]))) {
                tsum.isSelected = true;
                selectedTsums.push(tsum);
            }
        }
    });
}

function isNear(t1, t2) {
    const dist = Math.sqrt((t1.x-t2.x)**2 + (t1.y-t2.y)**2);
    return dist < 120; 
}

function endSelect() {
    if (selectedTsums.length >= 3) {
        score += selectedTsums.length * 100;
        scoreElement.innerText = score;
        const count = selectedTsums.length;
        tsums = tsums.filter(t => !t.isSelected);
        spawnTsums(count); 
    } else {
        tsums.forEach(t => t.isSelected = false);
    }
    selectedTsums = [];
}

resetBtn.addEventListener('click', init);
window.addEventListener('resize', init);
init();
animate();