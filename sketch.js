let eyeImages = [];
let eyes = [];

let holeX, holeY, holeR;
let tiltX = 0;
let tiltY = 0;
let sensorText = "画面をタップして傾き操作を開始";

const EYE_COUNT = 50;
const SPEED = 0.16;
const MAX_SPEED = 16;

function preload() {
  for (let i = 1; i <= 4; i++) {
    eyeImages.push(loadImage("eye0" + i + ".png"));
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  holeX = width / 2;
  holeY = height / 2;
  holeR = min(width, height) * 0.09;

  eyes = [];

  let d = min(width, height) * 0.105;

  for (let i = 0; i < EYE_COUNT; i++) {
    eyes.push({
      img: random(eyeImages),
      x: random(d, width - d),
      y: random(d, height - d),
      vx: random(-3, 3),
      vy: random(-3, 3),
      d: d,
      gone: false
    });
  }
}

function draw() {
  background(0);

  // 中央の穴
  noStroke();
  fill(55);
  circle(holeX, holeY, holeR * 2);
  fill(0);
  circle(holeX, holeY, holeR * 1.65);

  for (let e of eyes) {
    if (e.gone) continue;

    // 傾きに対する反応を強くする
    e.vx += tiltX * SPEED;
    e.vy += tiltY * SPEED;

    // 摩擦を少なくして速さを維持
    e.vx *= 0.997;
    e.vy *= 0.997;

    e.vx = constrain(e.vx, -MAX_SPEED, MAX_SPEED);
    e.vy = constrain(e.vy, -MAX_SPEED, MAX_SPEED);

    e.x += e.vx;
    e.y += e.vy;

    // 壁で跳ね返る
    if (e.x < e.d / 2) {
      e.x = e.d / 2;
      e.vx = abs(e.vx) * 0.85;
    }

    if (e.x > width - e.d / 2) {
      e.x = width - e.d / 2;
      e.vx = -abs(e.vx) * 0.85;
    }

    if (e.y < e.d / 2) {
      e.y = e.d / 2;
      e.vy = abs(e.vy) * 0.85;
    }

    if (e.y > height - e.d / 2) {
      e.y = height - e.d / 2;
      e.vy = -abs(e.vy) * 0.85;
    }

    // 中央の穴に入ると消える
    if (dist(e.x, e.y, holeX, holeY) < holeR * 0.8) {
      e.gone = true;
      continue;
    }

    imageMode(CENTER);
    image(e.img, e.x, e.y, e.d, e.d);
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
          window.addEventListener(
            "deviceorientation",
            handleOrientation
          );
          sensorText = "傾き操作 ON";
        } else {
          sensorText = "センサーが許可されていません";
        }
      })
      .catch(() => {
        sensorText = "センサーを利用できません";
      });
  } else {
    window.addEventListener(
      "deviceorientation",
      handleOrientation
    );
    sensorText = "傾き操作を確認中";
  }

  return false;
}

function handleOrientation(event) {
  if (event.gamma !== null && event.beta !== null) {
    tiltX = constrain(event.gamma / 20, -1, 1);
    tiltY = constrain(event.beta / 20, -1, 1);
    sensorText = "傾き操作 ON";
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  holeX = width / 2;
  holeY = height / 2;
  holeR = min(width, height) * 0.09;
}
