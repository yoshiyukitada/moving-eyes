// MOVING EYES — GLASS MARBLES
// Processing style interaction with p5.js
// 50 eyes / tilt / touch / double-tap reset

let eyeImages = [];
let eyes = [];

let holeX, holeY, holeR;
let eyeSize;

let tiltX = 0;
let tiltY = 0;
let sensorEnabled = false;

const EYE_COUNT = 50;
const ACCELERATION = 0.32;
const FRICTION = 0.992;
const MAX_SPEED = 18;
const BOUNCE = 0.88;

let pointerX = -1000;
let pointerY = -1000;
let pointerActive = false;
let dragging = false;

// Double-tap detection
let lastTapTime = 0;
let lastTapX = 0;
let lastTapY = 0;
const DOUBLE_TAP_TIME = 400;
const DOUBLE_TAP_DISTANCE = 100;

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

  // Hole diameter = 1.2 times eye diameter
  holeR = eyeSize * 0.6;

  eyes = [];

  for (let i = 0; i < EYE_COUNT; i++) {
    let x, y;
    let attempts = 0;

    do {
      x = random(eyeSize / 2, width - eyeSize / 2);
      y = random(eyeSize / 2, height - eyeSize / 2);
      attempts++;
    } while (
      dist(x, y, holeX, holeY) < holeR + eyeSize &&
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

  pointerActive = false;
  dragging = false;
}

function draw() {
  background(0);

  // Dark glass rim around the hole
  noStroke();
  fill(65);
  circle(holeX, holeY, holeR * 2.5);
  fill(0);
  circle(holeX, holeY, holeR * 2);

  // Movement and gravity from device tilt
  for (let e of eyes) {
    if (e.gone) continue;

    e.vx += tiltX * ACCELERATION;
    e.vy += tiltY * ACCELERATION;

    // Finger pushes nearby marbles
    if (pointerActive && dragging) {
      let dx = e.x - pointerX;
      let dy = e.y - pointerY;
      let d = sqrt(dx * dx + dy * dy);
      let influence = eyeSize * 3;

      if (d > 0 && d < influence) {
        let force = (1 - d / influence) * 2.0;
        e.vx += (dx / d) * force;
        e.vy += (dy / d) * force;
      }
    }

    // Glass friction
    e.vx *= FRICTION;
    e.vy *= FRICTION;

    let speed = sqrt(e.vx * e.vx + e.vy * e.vy);

    if (speed > MAX_SPEED) {
      e.vx = (e.vx / speed) * MAX_SPEED;
      e.vy = (e.vy / speed) * MAX_SPEED;
    }

    e.x += e.vx;
    e.y += e.vy;

    // Rolling rotation
    e.angle += speed * 0.025;

    // Bounce off screen edges
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

    // Pull toward the hole
    let hd = dist(e.x, e.y, holeX, holeY);

    if (hd < holeR * 2.5 && hd > 0) {
      let pull = map(hd, holeR * 2.5, 0, 0.04, 0.25);
      e.vx += ((holeX - e.x) / hd) * pull;
      e.vy += ((holeY - e.y) / hd) * pull;
    }

    // Fall into the hole
    if (hd < holeR) {
      e.gone = true;
    }
  }

  // Marble-to-marble collisions
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

        a.x -= nx * overlap * 0.5;
        a.y -= ny * overlap * 0.5;
        b.x += nx * overlap * 0.5;
        b.y += ny * overlap * 0.5;

        let relative =
          (b.vx - a.vx) * nx +
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

  // Draw eyes without any text
  for (let e of eyes) {
    if (e.gone) continue;

    push();
    translate(e.x, e.y);
    rotate(e.angle * 0.08);
    image(e.img, 0, 0, e.d, e.d);
    pop();
  }
}

// Touchscreen: double-tap reset and finger interaction
function touchStarted() {
  enableTilt();

  if (touches.length === 0) return false;

  let x = touches[0].x;
  let y = touches[0].y;
  let now = millis();

  if (
    lastTapTime > 0 &&
    now - lastTapTime < DOUBLE_TAP_TIME &&
    dist(x, y, lastTapX, lastTapY) < DOUBLE_TAP_DISTANCE
  ) {
    resetEyes();
    lastTapTime = 0;
    return false;
  }

  lastTapTime = now;
  lastTapX = x;
  lastTapY = y;

  pointerX = x;
  pointerY = y;
  pointerActive = true;
  dragging = false;

  return false;
}

function touchMoved() {
  if (touches.length > 0) {
    pointerX = touches[0].x;
    pointerY = touches[0].y;
    pointerActive = true;
    dragging = true;
  }

  return false;
}

function touchEnded() {
  pointerActive = false;
  dragging = false;
  return false;
}

// Mouse support for desktop testing
function mousePressed() {
  if (touches.length > 0) return false;

  let now = millis();

  if (
    lastTapTime > 0 &&
    now - lastTapTime < DOUBLE_TAP_TIME &&
    dist(mouseX, mouseY, lastTapX, lastTapY) < DOUBLE_TAP_DISTANCE
  ) {
    resetEyes();
    lastTapTime = 0;
    return false;
  }

  lastTapTime = now;
  lastTapX = mouseX;
  lastTapY = mouseY;

  pointerX = mouseX;
  pointerY = mouseY;
  pointerActive = true;
  dragging = false;

  return false;
}

function mouseDragged() {
  pointerX = mouseX;
  pointerY = mouseY;
  pointerActive = true;
  dragging = true;
  return false;
}

function mouseReleased() {
  pointerActive = false;
  dragging = false;
  return false;
}

// Enable tilt sensor
function enableTilt() {
  if (sensorEnabled) return;

  if (
    typeof DeviceOrientationEvent !== "undefined" &&
    typeof DeviceOrientationEvent.requestPermission === "function"
  ) {
    DeviceOrientationEvent.requestPermission()
      .then(result => {
        if (result === "granted") {
          window.addEventListener(
            "deviceorientation",
            handleOrientation
          );
          sensorEnabled = true;
        }
      })
      .catch(() => {});
  } else {
    window.addEventListener(
      "deviceorientation",
      handleOrientation
    );
    sensorEnabled = true;
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
