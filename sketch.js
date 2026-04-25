// 使用比例定義路徑 (x: 0~1, y: 0~1)，這樣縮放螢幕時路徑會自動放大
let pathRatios = [
  { x: 0.05, y: 0.5 },
  { x: 0.15, y: 0.3 },
  { x: 0.3, y: 0.7 },
  { x: 0.45, y: 0.2 },
  { x: 0.6, y: 0.8 },
  { x: 0.75, y: 0.3 },
  { x: 0.85, y: 0.6 },
  { x: 0.95, y: 0.5 }
];

let gapHeights = [100, 90, 110, 95, 105, 90, 100, 100]; 
let obstacles = [];
let fireworks = [];

// 遊戲統計數據
let gameState = "MENU"; // MENU, WAIT, PLAYING, GAMEOVER, WIN
let attempts = 1;
let timer = 0;
let lastMillis = 0;
let restartBtnPos = { x: 0, y: 0, w: 200, h: 60 };

class Obstacle {
  constructor(xRatio, yRatio, range) {
    this.xRatio = xRatio;
    this.yRatio = yRatio;
    this.range = range;
    this.angle = random(TWO_PI);
  }
  update() {
    this.angle += 0.05;
  }
  draw() {
    let x = this.xRatio * width;
    let y = (this.yRatio * height) + sin(this.angle) * this.range;
    fill(255, 50, 50);
    rect(x - 5, y - 25, 10, 50);
    
    // 碰撞偵測 (與滑鼠距離)
    if (gameState === "PLAYING" && dist(mouseX, mouseY, x, y) < 25) {
      gameState = "GAMEOVER";
      attempts++; // 碰到障礙物失敗，次數加 1
    }
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  noCursor();
  // 初始化一些障礙物
  obstacles.push(new Obstacle(0.3, 0.7, 50));
  obstacles.push(new Obstacle(0.6, 0.8, 80));
  obstacles.push(new Obstacle(0.75, 0.3, 40));
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  updateRestartBtnPos();
}

function updateRestartBtnPos() {
  restartBtnPos.x = width / 2 - 100;
  restartBtnPos.y = height / 2 + 100;
}

function draw() {
  background(20);
  updateTimer();

  if (gameState === "MENU") {
    displayMainMenu();
    return; // 主畫面時不繪製路徑
  }

  // --- 以下為遊戲中與結算畫面都會顯示的內容 ---

  // 1. 繪製路徑 (白色)
  noFill();
  stroke(255);
  strokeWeight(4);
  
  beginShape();
  for (let i = 0; i < pathRatios.length; i++) {
    vertex(pathRatios[i].x * width, pathRatios[i].y * height);
  }
  endShape();
  beginShape();
  for (let i = 0; i < pathRatios.length; i++) {
    vertex(pathRatios[i].x * width, pathRatios[i].y * height + gapHeights[i]);
  }
  endShape();

  // 2. 繪製障礙物 (僅遊戲中會碰撞)
  for (let obs of obstacles) {
    if (gameState === "PLAYING") obs.update();
    obs.draw();
  }

  // 3. 遊戲邏輯與狀態
  if (gameState === "PLAYING") {
    checkCollision();
    displayLiveStats();
  } else if (gameState === "GAMEOVER") {
    displayGameOver();
    displayLiveStats();
  } else if (gameState === "WAIT") {
    displayStartMessage();
    displayLiveStats();
    let startX = pathRatios[0].x * width;
    let startY = pathRatios[0].y * height + gapHeights[0] / 2;
    if (dist(mouseX, mouseY, startX, startY) < 15) {
      gameState = "PLAYING";
    }
  } else if (gameState === "WIN") {
    displayWin();
    spawnFireworks();
  }

  // 4. 繪製起點與終點
  drawPoint(0, color(0, 255, 0)); // 起點
  drawPoint(pathRatios.length - 1, color(255, 255, 0)); // 終點

  // 5. 繪製笑臉游標
  drawSmiley(mouseX, mouseY);
  
  // 6. 更新煙火
  for (let i = fireworks.length - 1; i >= 0; i--) {
    fireworks[i].update();
    fireworks[i].show();
    if (fireworks[i].done()) fireworks.splice(i, 1);
  }
}

function updateTimer() {
  if (gameState === "PLAYING") {
    let currentMillis = millis();
    timer += (currentMillis - lastMillis) / 1000;
    lastMillis = currentMillis;
  } else {
    lastMillis = millis(); // 暫停時重置基準點
  }
}

function drawPoint(idx, c) {
  fill(c);
  noStroke();
  let x = pathRatios[idx].x * width;
  let y = pathRatios[idx].y * height + gapHeights[idx] / 2;
  ellipse(x, y, 25, 25);
}

function drawSmiley(x, y) {
  push();
  translate(x, y);
  stroke(0);
  strokeWeight(1);
  fill(255, 255, 0);
  ellipse(0, 0, 20, 20); // 臉
  fill(0);
  ellipse(-4, -3, 3, 3); // 左眼
  ellipse(4, -3, 3, 3);  // 右眼
  noFill();
  arc(0, 2, 10, 8, 0, PI); // 嘴巴
  pop();
}

function checkCollision() {
  let startX = pathRatios[0].x * width;
  let endX = pathRatios[pathRatios.length - 1].x * width;

  if (mouseX < startX || mouseX > endX) {
    gameState = "GAMEOVER";
    attempts++; // 超出左右邊界失敗，次數加 1
    return;
  }

  let lastIdx = pathRatios.length - 1;
  let finalX = pathRatios[lastIdx].x * width;
  let finalY = pathRatios[lastIdx].y * height + gapHeights[lastIdx] / 2;
  if (dist(mouseX, mouseY, finalX, finalY) < 15) {
    gameState = "WIN";
    updateRestartBtnPos();
  }

  for (let i = 0; i < pathRatios.length - 1; i++) {
    let x1 = pathRatios[i].x * width;
    let x2 = pathRatios[i+1].x * width;

    if (mouseX >= x1 && mouseX <= x2) {
      let t = (mouseX - x1) / (x2 - x1);
      let topY = lerp(pathRatios[i].y * height, pathRatios[i+1].y * height, t);
      let bottomY = lerp(pathRatios[i].y * height + gapHeights[i], pathRatios[i+1].y * height + gapHeights[i+1], t);

      if (mouseY <= topY || mouseY >= bottomY) {
        gameState = "GAMEOVER";
        attempts++;
      }
      break;
    }
  }
}

function displayMainMenu() {
  push();
  fill(255, 255, 0); // 改用黃色
  stroke(0);        // 加上黑色描邊
  strokeWeight(4);
  textAlign(CENTER, CENTER);
  textSize(60);
  text("電流急急棒挑戰", width / 2, height / 2 - 50);
  pop();

  // 開始按鈕
  let btnW = 200, btnH = 60;
  let btnX = width / 2 - btnW / 2;
  let btnY = height / 2 + 50;
  
  push();
  fill(255);
  stroke(0);
  strokeWeight(2);
  rect(btnX, btnY, btnW, btnH, 10);
  
  fill(0);
  noStroke();
  textAlign(CENTER, CENTER); // 強制文字在接下來的座標點完全置中
  textSize(24);
  text("開始遊戲", width / 2, btnY + btnH / 2);
  pop();

  // 裝飾游標
  drawSmiley(mouseX, mouseY);
}

function displayLiveStats() {
  push();
  let boxW = 140;
  let boxH = 65;
  let x = width - boxW - 20;
  let y = 20;

  // 白框 (stroke) 紅底 (fill)
  stroke(255);
  strokeWeight(3);
  fill(255, 0, 0);
  rect(x, y, boxW, boxH, 10);

  // 文字顯示
  noStroke();
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(18);
  text(`時間: ${timer.toFixed(1)}s`, x + boxW/2, y + 20);
  text(`嘗試次數: ${attempts}`, x + boxW/2, y + 45);
  pop();
}

function displayStartMessage() {
  push();
  fill(255, 255, 0); // 改用亮黃色
  stroke(0);        // 加上黑色描邊增加對比
  strokeWeight(3);
  textAlign(CENTER); 
  textSize(28);      // 稍微放大字體
  text("請將滑鼠移至 綠色起點 開始挑戰！", width / 2, 100);
  pop();
}

function displayGameOver() {
  fill(255, 50, 50); textAlign(CENTER); textSize(50);
  text("遊戲失敗！點擊畫面重試", width / 2, height / 2);
}

function displayWin() {
  // 半透明遮罩
  fill(0, 0, 0, 150);
  rect(0, 0, width, height);
  
  fill(100, 255, 100);
  textAlign(CENTER, CENTER);
  textSize(60);
  text("恭喜通關成功！", width / 2, height / 2 - 100);
  
  fill(255);
  textSize(30);
  text(`最終成績`, width / 2, height / 2 - 20);
  textSize(24);
  text(`總花費時間: ${timer.toFixed(2)} 秒`, width / 2, height / 2 + 20);
  text(`總嘗試次數: ${attempts} 次`, width / 2, height / 2 + 50);
  
  // 重新開始按鈕
  fill(255);
  rect(restartBtnPos.x, restartBtnPos.y, restartBtnPos.w, restartBtnPos.h, 10);
  fill(0);
  text("重新開始遊戲", width / 2, restartBtnPos.y + restartBtnPos.h / 2);
}

function spawnFireworks() {
  if (frameCount % 10 === 0) {
    for(let i=0; i<20; i++) {
      fireworks.push(new Particle(random(width), random(height)));
    }
  }
}

function mousePressed() {
  if (gameState === "MENU") {
    // 檢查是否點擊開始按鈕
    if (mouseX > width/2 - 100 && mouseX < width/2 + 100 && mouseY > height/2 + 50 && mouseY < height/2 + 110) {
      resetGameFull();
      gameState = "WAIT";
    }
  } else if (gameState === "GAMEOVER") {
    gameState = "WAIT";
  } else if (gameState === "WIN") {
    // 檢查是否點擊重新開始按鈕
    if (mouseX > restartBtnPos.x && mouseX < restartBtnPos.x + restartBtnPos.w && 
        mouseY > restartBtnPos.y && mouseY < restartBtnPos.y + restartBtnPos.h) {
      resetGameFull();
      gameState = "MENU";
    }
  }
}

function resetGameFull() {
  timer = 0;
  attempts = 1;
  fireworks = [];
}
