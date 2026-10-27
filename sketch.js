let eyeImages = [];
let eyes = [];

let holeX, holeY, holeR;
let tiltX = 0;
let tiltY = 0;
let sensorText = "画面をタップして傾き操作を開始";

const EYE_COUNT = 50;
const ACCELERATION = 0.32;
const FRICTION = 0.992;
const MAX_SPEED = 18;
const BOUNCE = 0.88;

function preload() {
  for (let i = 1; i <= 4; i++) {
    eyeImages.push(loadImage("eye0" + i + ".png"));
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  imageMode(CENTER);

  holeX = width / 2;
  holeY = height / 2;
  holeR = min(width, height) * 0.09;

  let d = min(width, height) * 0.105;

  for (let i = 0; i < EYE_COUNT; i++) {
    let x, y;
    let attempts = 0;

    do {
      x = random(d, width - d);
      y = random(d, height - d);
      attempts++;
    } while (
      dist(x, y, holeX, holeY) < holeR * 1.8 &&
      attempts < 100
    );

    eyes.push({
      img: random(eyeImages),
      x: x,
      y: y,
      vx: random(-2, 2),
      vy: random(-2, 2),
      d: d,
      r: d * 0.46,
      gone: false,
      angle: random(TWO_PI),
      spin: random(-0.03, 0.03)
    });
  }
}

function draw() {
  background(0);

  // ガラスの上にある穴
  noStroke();
  fill(55);
  circle(holeX, holeY, holeR * 2.3);
  fill(15);
  circle(holeX, holeY, holeR * 2);
  fill(0);
  circle(holeX, holeY, holeR * 1.7);

  // 傾きによる加速と摩擦
  for (let e of eyes) {
    if (e.gone) continue;

    e.vx += tiltX * ACCELERATION;
    e.vy += tiltY * ACCELERATION;

    e.vx *= FRICTION;
    e.vy *= FRICTION;

    let speed = sqrt(e.vx * e.vx + e.vy * e.vy);
    if (speed > MAX_SPEED) {
      e.vx = e.vx / speed * MAX_SPEED;
      e.vy = e.vy / speed * MAX_SPEED;
    }

    e.x += e.vx;
    e.y += e.vy;

    // 転がる回転
    e.angle += speed * 0.025;
    e.spin = e.vx * 0.002;

    // 壁との衝突
    if (e.x < e.r) {
      e.x = e.r;
      e.vx = abs(e.vx) * BOUNCE;
    }
    if (e.x > width - e.r) {
      e.x = width - e.r;
      e.vx = -abs(e.vx) * BOUNCE;
    }
    if (e.y < e.r) {
      e.y = e.r;
      e.vy = abs(e.vy) * BOUNCE;
    }
    if (e.y > height - e.r) {
      e.y = height - e.r;
      e.vy = -abs(e.vy) * BOUNCE;
    }

    // 穴の縁に近づくと吸い込まれる
    let holeDist = dist(e.x, e.y, holeX, holeY);

    if (holeDist < holeR * 1.5 && holeDist > 0) {
      let pull = map(holeDist, holeR * 1.5, 0, 0.04, 0.22);
      e.vx += (holeX - e.x) / holeDist * pull;
      e.vy += (holeY - e.y) / holeDist * pull;
    }

    if (holeDist < holeR * 0.72) {
      e.gone = true;
    }
  }

  // ビー玉同士の衝突
  for (let i = 0; i < eyes.length; i++) {
    let a = eyes[i];
    if (a.gone) continue;

    for (let j = i + 1; j < eyes.length; j++) {
      let b = eyes[j];
      if (b.gone) continue;

      let dx = b.x - a.x;
      let dy = b.y - a.y;
      let distance = sqrt(dx * dx + dy * dy);
      let minDist = a.r + b.r;

      if (distance > 0 && distance < minDist) {
        let nx = dx / distance;
        let ny = dy / distance;
        let overlap = minDist - distance;

        // めり込みを解消する
        a.x -= nx * overlap * 0.5;
        a.y -= ny * overlap * 0.5;
        b.x += nx * overlap * 0.5;
        b.y += ny * overlap * 0.5;

        // 衝突方向の速度を交換する
        let relative = (b.vx - a.vx) * nx +
                       (b.vy - a.vy) * ny;

        if (relative < 0) {
          let impulse = -(1 + BOUNCE) * relative * 0.5;

          a.vx -= impulse * nx;
          a.vy -= impulse * ny;
          b.vx += impulse * nx;
          b.vy += impulse * ny;
        }
      }
    }
  }

  // 目を描画
  for (let e of eyes) {
    if (e.gone) continue;

    push();
    translate(e.x, e.y);
    rotate(e.angle * 0.08);
    image(e.img, 0, 0, e.d, e.d);
    pop();
  }

  fill(180);
  textAlign(CENTER);
  textSize(12);
  text(sensorText, width / 2, height - 24);
}

function touchStarted() {
  if (
    typeof DeviceOrientationEvent !== "undefined" &&
    typeof DeviceOrientationEvent.requestPermission === "function"
  ) {
    DeviceOrientationEvent.requestPermission()
      .then(result => {
        if (result === "granted") {
          window.addEventListener("deviceorientation", handleOrientation);
          sensorText = "傾き操作 ON";
        } else {
          sensorText = "センサーが許可されていません";
        }
      })
      .catch(() => {
        sensorText = "センサーを利用できません";
      });
  } else {
    window.addEventListener("deviceorientation", handleOrientation);
    sensorText = "傾き操作を確認中";
  }

  return false;
}

function handleOrientation(event) {
  if (event.gamma !== null && event.beta !== null) {
    tiltX = constrain(event.gamma / 25, -1, 1);
    tiltY = constrain(event.beta / 25, -1, 1);
    sensorText = "傾き操作 ON";
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  holeX = width / 2;
  holeY = height / 2;
  holeR = min(width, height) * 0.09;
}
