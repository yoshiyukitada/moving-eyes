let eyeImages = [];
let eyes = [];

let holeX, holeY, holeR;
let tiltX = 0;
let tiltY = 0;
let sensorText = "傾けるか、指でなぞってください";

const EYE_COUNT = 50;
const ACCELERATION = 0.32;
const FRICTION = 0.992;
const MAX_SPEED = 18;
const BOUNCE = 0.88;

let eyeSize;
let lastTapTime = 0;
let pointerX = -1000;
let pointerY = -1000;
let pointerActive = false;

function preload() {
  for (let i = 1; i <= 4; i++) {
    eyeImages.push(loadImage("eye0" + i + ".png"));
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  imageMode(CENTER);
  resetEyes();
}

function resetEyes() {
  holeX = width / 2;
  holeY = height / 2;

  eyeSize = min(width, height) * 0.105;

  // 穴の直径を目玉の直径の1.2倍にする
  holeR = eyeSize * 1.2 / 2;

  eyes = [];

  for (let i = 0; i < EYE_COUNT; i++) {
    let x, y;
    let attempts = 0;

    do {
      x = random(eyeSize / 2, width - eyeSize / 2);
      y = random(eyeSize / 2, height - eyeSize / 2);
      attempts++;
    } while (
      dist(x, y, holeX, holeY) < holeR * 2 + eyeSize &&
      attempts < 200
    );

    eyes.push({
      img: random(eyeImages),
      x: x,
      y: y,
      vx: random(-2, 2),
      vy: random(-2, 2),
      d: eyeSize,
      r: eyeSize / 2,
      gone: false,
      angle: random(TWO_PI)
    });
  }
}

function draw() {
  background(0);

  // 穴
  noStroke();
  fill(65);
  circle(holeX, holeY, holeR * 2.5);
  fill(0);
  circle(holeX, holeY, holeR * 2);

  // 傾きと指による力
  for (let e of eyes) {
    if (e.gone) continue;

    e.vx += tiltX * ACCELERATION;
    e.vy += tiltY * ACCELERATION;

    // 指の周囲の目玉を押して動かす
    if (pointerActive) {
      let dx = e.x - pointerX;
      let dy = e.y - pointerY;
      let d = sqrt(dx * dx + dy * dy);
      let influence = eyeSize * 3;

      if (d > 0 && d < influence) {
        let force = (1 - d / influence) * 1.8;
        e.vx += dx / d * force;
        e.vy += dy / d * force;
      }
    }

    e.vx *= FRICTION;
    e.vy *= FRICTION;

    let speed = sqrt(e.vx * e.vx + e.vy * e.vy);

    if (speed > MAX_SPEED) {
      e.vx = e.vx / speed * MAX_SPEED;
      e.vy = e.vy / speed * MAX_SPEED;
    }

    e.x += e.vx;
    e.y += e.vy;
    e.angle += speed * 0.025;

    // 壁で跳ね返る
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

    // 穴に近づくと吸い込まれる
    let hd = dist(e.x, e.y, holeX, holeY);

    if (hd < holeR * 2.5 && hd > 0) {
      let pull = map(hd, holeR * 2.5, 0, 0.04, 0.25);
      e.vx += (holeX - e.x) / hd * pull;
      e.vy += (holeY - e.y) / hd * pull;
    }

    if (hd < holeR) {
      e.gone = true;
    }
  }

  // 目玉同士の衝突
  for (let i = 0; i < eyes.length; i++) {
    let a = eyes[i];
    if (a.gone) continue;

    for (let j = i + 1; j < eyes.length; j++) {
      let b = eyes[j];
      if (b.gone) continue;

      let dx = b.x - a.x;
      let dy = b.y - a.y;
      let d = sqrt(dx * dx + dy * dy);
      let minD = a.r + b.r;

      if (d > 0 && d < minD) {
        let nx = dx / d;
        let ny = dy / d;
        let overlap = minD - d;

        a.x -= nx * overlap / 2;
        a.y -= ny * overlap / 2;
        b.x += nx * overlap / 2;
        b.y += ny * overlap / 2;

        let relative = (b.vx - a.vx) * nx +
                       (b.vy - a.vy) * ny;

        if (relative < 0) {
          let impulse = -(1 + BOUNCE) * relative / 2;
          a.vx -= impulse * nx;
          a.vy -= impulse * ny;
          b.vx += impulse * nx;
          b.vy += impulse * ny;
        }
      }
    }
  }

  // 目玉を描く
  for (let e of eyes) {
    if (e.gone) continue;

    push();
    translate(e.x, e.y);
    rotate(e.angle * 0.08);
    image(e.img, 0, 0, e.d, e.d);
    pop();
  }
}

// タップとダブルクリック
function touchStarted() {
  enableTilt();
  registerTap(mouseX, mouseY);
  return false;
}

function mousePressed() {
  registerTap(mouseX, mouseY);
  return false;
}

function registerTap(x, y) {
  let now = millis();

  if (now - lastTapTime < 350) {
    resetEyes();
    sensorText = "50個復活！";
    lastTapTime = 0;
    return;
  }

  lastTapTime = now;
  pointerX = x;
  pointerY = y;
  pointerActive = true;
}

function touchMoved() {
  pointerX = mouseX;
  pointerY = mouseY;
  pointerActive = true;
  return false;
}

function touchEnded() {
  pointerActive = false;
  return false;
}

function mouseDragged() {
  pointerX = mouseX;
  pointerY = mouseY;
  pointerActive = true;
  return false;
}

function mouseReleased() {
  pointerActive = false;
  return false;
}

function enableTilt() {
  if (
    typeof DeviceOrientationEvent !== "undefined" &&
    typeof DeviceOrientationEvent.requestPermission === "function"
  ) {
    DeviceOrientationEvent.requestPermission()
      .then(result => {
        if (result === "granted") {
          window.addEventListener("deviceorientation", handleOrientation);
          sensorText = "傾き操作 ON";
        }
      })
      .catch(() => {});
  } else {
    window.addEventListener("deviceorientation", handleOrientation);
  }
}

function handleOrientation(event) {
  if (event.gamma !== null && event.beta !== null) {
    tiltX = constrain(event.gamma / 25, -1, 1);
    tiltY = constrain(event.beta / 25, -1, 1);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  resetEyes();
}
