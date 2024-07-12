import { Bullet, EnemyManager } from "./bullet.js";
import { SplitArrowEquipment, ElectricKnifeEquipment } from "./equipment.js";

const DEBUG_MODE = true;
const GAME_CONFIG = {
  scorePerEquipment: DEBUG_MODE ? 40 : 500,
  maxEquipments: 6,
};

export class Game {
  constructor(ctx, systemInfo) {
    this.ctx = ctx;
    this.systemInfo = systemInfo;
    this.player = {
      x: systemInfo.windowWidth / 2,
      y: systemInfo.windowHeight * 0.8,
      width: 50,
      height: 50,
    };
    this.enemyManager = new EnemyManager(
      ctx,
      systemInfo.windowWidth,
      systemInfo.windowHeight
    );
    this.bullets = [];
    this.lastTime = 0;
    this.lastShootTime = 0;
    this.shootInterval = 500;
    this.gameOver = false;
    this.score = 0;
    this.maxScore = 3000;
    this.equipments = [];
    this.isPaused = false;
    this.lastEquipmentScore = 0;
    this.scorePerEquipment = GAME_CONFIG.scorePerEquipment;
    this.maxEquipments = GAME_CONFIG.maxEquipments;
  }

  update(currentTime) {
    if (this.gameOver) return;

    // 只在不选择装备时更新游戏状态
    if (!this.choosingEquipment) {
      this.lastTime = currentTime;
      this.enemyManager.update(currentTime);
      this.bullets.forEach((bullet) => bullet.update());
      this.bullets = this.bullets.filter(
        (bullet) =>
          !bullet.isOutOfScreen(
            this.systemInfo.windowHeight,
            this.systemInfo.windowWidth
          )
      );
      this.checkCollisions();
      if (currentTime - this.lastShootTime > this.shootInterval) {
        this.shoot();
        this.lastShootTime = currentTime;
      }
      if (this.score >= this.maxScore) {
        this.onMaxScoreReached();
      }
      this.checkEquipmentSelection();
    }
  }

  render() {
    this.ctx.clearRect(
      0,
      0,
      this.systemInfo.windowWidth,
      this.systemInfo.windowHeight
    );

    this.renderGameState();

    if (this.choosingEquipment) {
      this.renderEquipmentChoices();
    }

    if (this.gameOver) {
      this.ctx.fillStyle = "white";
      this.ctx.font = "48px Arial";
      this.ctx.textAlign = "center";
      this.ctx.fillText(
        "Game Over",
        this.systemInfo.windowWidth / 2,
        this.systemInfo.windowHeight / 2
      );
    }
  }

  renderGameState() {
    // 渲染分数
    this.ctx.fillStyle = "white";
    this.ctx.font = "24px Arial";
    this.ctx.textAlign = "left";
    this.ctx.fillText(`Score: ${this.score}`, 10, 50);

    // 渲染玩家
    this.ctx.fillStyle = "blue";
    this.ctx.fillRect(
      this.player.x - this.player.width / 2,
      this.player.y - this.player.height / 2,
      this.player.width,
      this.player.height
    );

    // 渲染敌人
    this.enemyManager.render();

    // 渲染子弹
    this.bullets.forEach((bullet) => bullet.render(this.ctx));
  }

  checkEquipmentSelection() {
    const equipmentCount = Math.floor(this.score / this.scorePerEquipment);
    const lastEquipmentCount = Math.floor(
      this.lastEquipmentScore / this.scorePerEquipment
    );

    if (
      equipmentCount > lastEquipmentCount &&
      this.equipments.length < this.maxEquipments
    ) {
      this.choosingEquipment = true;
      this.offerEquipmentChoice();
    }
  }

  offerEquipmentChoice() {
    const availableEquipments = [
      new SplitArrowEquipment(),
      new ElectricKnifeEquipment(),
      // 可以在这里添加更多装备类型
    ];
    const choices = this.getRandomEquipments(availableEquipments, 2);
    this.presentEquipmentChoices(choices);
  }

  presentEquipmentChoices(choices) {
    this.equipmentChoices = choices;
    this.choosingEquipment = true;
    this.isPaused = true;
  }

  renderEquipmentChoices() {
    const margin = 20;
    const buttonWidth = 200;
    const buttonHeight = 60;
    const centerX = this.systemInfo.windowWidth / 2;
    const centerY = this.systemInfo.windowHeight / 2;

    // 添加半透明背景
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    this.ctx.fillRect(
      0,
      0,
      this.systemInfo.windowWidth,
      this.systemInfo.windowHeight
    );

    this.ctx.fillStyle = "white";
    this.ctx.font = "24px Arial";
    this.ctx.textAlign = "center";
    this.ctx.fillText("选择装备", centerX, centerY - 100);

    this.equipmentChoices.forEach((equipment, index) => {
      const x = centerX + (index === 0 ? -buttonWidth - margin : margin);
      const y = centerY - buttonHeight / 2;

      this.ctx.fillStyle = "blue";
      this.ctx.fillRect(x, y, buttonWidth, buttonHeight);

      this.ctx.fillStyle = "white";
      this.ctx.fillText(
        equipment.name,
        x + buttonWidth / 2,
        y + buttonHeight / 2 + 8
      );
    });
  }

  addEquipment(equipment) {
    if (this.equipments.length < this.maxEquipments) {
      this.equipments.push(equipment);
      console.log(`Added equipment: ${equipment.name}`);
    }
  }

  getRandomEquipments(equipments, count) {
    return equipments.sort(() => 0.5 - Math.random()).slice(0, count);
  }

  shoot() {
    let bullets = [
      new Bullet(
        this.player.x,
        this.player.y - this.player.height / 2,
        5,
        0,
        {}
      ),
    ];

    for (const equipment of this.equipments) {
      let newBullets = [];
      for (const bullet of bullets) {
        newBullets = newBullets.concat(equipment.apply(this, bullet));
      }
      bullets = newBullets;
    }

    this.bullets.push(...bullets);
  }

  checkCollisions() {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      for (let j = this.enemyManager.enemies.length - 1; j >= 0; j--) {
        const enemy = this.enemyManager.enemies[j];
        if (
          bullet.x < enemy.x + enemy.width &&
          bullet.x + bullet.width > enemy.x &&
          bullet.y < enemy.y + enemy.height &&
          bullet.y + bullet.height > enemy.y
        ) {
          this.addScore(enemy.score);
          this.enemyManager.enemies.splice(j, 1);
          if (!bullet.piercing) {
            this.bullets.splice(i, 1);
            break;
          }
        }
      }
    }
  }

  addScore(points) {
    this.score = Math.min(this.score + points, this.maxScore);
    this.checkEquipmentSelection();
  }

  onMaxScoreReached() {
    console.log("Maximum score reached!");
  }

  onTouchMove(touch) {
    if (this.gameOver || this.choosingEquipment) return; // 添加这行

    this.player.x = touch.clientX;
    this.player.y = touch.clientY;
    this.player.x = Math.max(
      this.player.width / 2,
      Math.min(
        this.player.x,
        this.systemInfo.windowWidth - this.player.width / 2
      )
    );
    this.player.y = Math.max(
      this.player.height / 2,
      Math.min(
        this.player.y,
        this.systemInfo.windowHeight - this.player.height / 2
      )
    );
  }

  onTouchStart(touch) {
    if (this.choosingEquipment) {
      // 处理装备选择逻辑
      const centerX = this.systemInfo.windowWidth / 2;
      const centerY = this.systemInfo.windowHeight / 2;
      const buttonWidth = 200;
      const buttonHeight = 60;
      const margin = 20;

      this.equipmentChoices.forEach((equipment, index) => {
        const x = centerX + (index === 0 ? -buttonWidth - margin : margin);
        const y = centerY - buttonHeight / 2;

        if (
          touch.clientX >= x &&
          touch.clientX <= x + buttonWidth &&
          touch.clientY >= y &&
          touch.clientY <= y + buttonHeight
        ) {
          this.addEquipment(equipment);
          this.choosingEquipment = false;
          this.lastEquipmentScore =
            Math.floor(this.score / this.scorePerEquipment) *
            this.scorePerEquipment;
        }
      });
    } else if (!this.gameOver) {
      // 正常游戏中的触摸开始逻辑（如果有的话）
    }
  }

  onTouchEnd(touch) {
    if (this.gameOver || this.choosingEquipment) return; // 添加这行

    // 正常游戏中的触摸结束逻辑（如果有的话）
  }
}
