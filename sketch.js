let eyes = [];
let holeX, holeY, holeR;
let tiltX = 0;
let tiltY = 0;
let sensorText = "画面をタップして傾き操作を開始";

function preload() {
  for (let i = 1; i <= 4; i++) {
    eyes.push(loadImage("eye0" + i + ".png"));
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  holeX = width / 2;
  holeY = height / 2;
  holeR = min(width, height) * 0.09;

  for (let i = 0; i < eyes.length; i++) {
    let d = min(width, height) * 0.13;
    eyes[i] = {
      img: eyes[i],
      x: random(d, width - d),
      y: random(d, height - d),
      vx: random(-1, 1),
      vy: random(-1, 1),
      d: d,
      gone: false
    };
  }
}

function draw() {
  background(0);

  // 中央の穴
  noStroke();
  fill(45);
  circle(holeX, holeY, holeR * 2);
  fill(0);
  circle(holeX, holeY, holeR * 1.65);

  for (let e of eyes) {
    if (e.gone) continue;

    e.vx += tiltX * 0.04;
    e.vy += tiltY * 0.04;

    e.vx *= 0.99;
    e.vy *= 0.99;
    e.vx = constrain(e.vx, -7, 7);
    e.vy = constrain(e.vy, -7, 7);

    e.x += e.vx;
    e.y += e.vy;

    if (e.x < e.d / 2 || e.x > width - e.d / 2) {
      e.vx *= -0.8;
      e.x = constrain(e.x, e.d / 2, width - e.d / 2);
    }

    if (e.y < e.d / 2 || e.y > height - e.d / 2) {
      e.vy *= -0.8;
      e.y = constrain(e.y, e.d / 2, height - e.d / 2);
    }

    if (dist(e.x, e.y, holeX, holeY) < holeR) {
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
  if (typeof DeviceOrientationEvent !== "undefined" &&
      typeof DeviceOrientationEvent.requestPermission === "function") {
    DeviceOrientationEvent.requestPermission()
      .then(result => {
        if (result === "granted") {
          window.addEventListener("deviceorientation", handleOrientation);
          sensorText = "傾きセンサー ON";
        } else {
          sensorText = "センサーが許可されていません";
        }
      })
      .catch(() => sensorText = "センサーを利用できません");
  } else {
    window.addEventListener("deviceorientation", handleOrientation);
    sensorText = "傾きセンサーを確認中";
  }

  return false;
}

function handleOrientation(event) {
  if (event.gamma !== null && event.beta !== null) {
    tiltX = constrain(event.gamma / 30, -1, 1);
    tiltY = constrain(event.beta / 30, -1, 1);
    sensorText = "傾き操作 ON";
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  holeX = width / 2;
  holeY = height / 2;
}
