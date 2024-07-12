import { Bullet, EnemyManager } from "./bullet.js";
import {
  SplitArrowEquipment,
  ElectricKnifeEquipment,
  WingmanEquipment,
} from "./equipment.js";
import { Wingman } from "./wingman.js";

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
    this.onTouchStart = this.onTouchStart.bind(this);
    this.handleEquipmentChoice = this.handleEquipmentChoice.bind(this);
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
    this.wingmen = [];
  }

  update(currentTime) {
    if (this.gameOver) return;

    // 只在不选择装备时更新游戏状态
    if (!this.choosingEquipment) {
      this.lastTime = currentTime;
      this.enemyManager.update(currentTime);
      this.bullets.forEach((bullet) =>
        bullet.update(this.enemyManager.enemies)
      );
      this.bullets = this.bullets.filter(
        (bullet) =>
          !bullet.isOutOfScreen(
            this.systemInfo.windowHeight,
            this.systemInfo.windowWidth
          )
      );
      this.checkCollisions();
      this.checkPlayerCollision(); // 添加这行
      this.wingmen.forEach((wingman) => {
        const offsetX = wingman.type === "left" ? -40 : 40;
        wingman.update(this.player.x + offsetX, this.player.y + 20);
        const bullet = wingman.shoot(currentTime);
        if (bullet) {
          this.bullets.push(bullet);
        }
      });
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
    this.wingmen.forEach((wingman) => wingman.render(this.ctx));

    if (this.choosingEquipment) {
      this.renderEquipmentChoices();
    }

    if (this.gameOver) {
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      this.ctx.fillRect(
        0,
        0,
        this.systemInfo.windowWidth,
        this.systemInfo.windowHeight
      );

      this.ctx.fillStyle = "white";
      this.ctx.font = "48px Arial";
      this.ctx.textAlign = "center";
      this.ctx.fillText(
        "Game Over",
        this.systemInfo.windowWidth / 2,
        this.systemInfo.windowHeight / 2 - 50
      );

      // 显示最终得分
      this.ctx.font = "24px Arial";
      this.ctx.fillText(
        `Final Score: ${this.score}`,
        this.systemInfo.windowWidth / 2,
        this.systemInfo.windowHeight / 2 + 20
      );

      // 绘制"Restart"按钮
      this.ctx.fillStyle = "green";
      this.ctx.fillRect(
        this.systemInfo.windowWidth / 2 - 60,
        this.systemInfo.windowHeight / 2 + 50,
        120,
        40
      );
      this.ctx.fillStyle = "white";
      this.ctx.font = "20px Arial";
      this.ctx.fillText(
        "Restart",
        this.systemInfo.windowWidth / 2,
        this.systemInfo.windowHeight / 2 + 75
      );
    }
  }

  resetGame() {
    this.player = {
      x: this.systemInfo.windowWidth / 2,
      y: this.systemInfo.windowHeight * 0.8,
      width: 50,
      height: 50,
    };
    this.enemyManager = new EnemyManager(
      this.ctx,
      this.systemInfo.windowWidth,
      this.systemInfo.windowHeight
    );
    this.bullets = [];
    this.lastTime = 0;
    this.lastShootTime = 0;
    this.gameOver = false;
    this.score = 0;
    this.equipments = [];
    this.isPaused = false;
    this.lastEquipmentScore = 0;
    this.wingmen = [];
    this.choosingEquipment = false;
  }

  checkPlayerCollision() {
    for (const enemy of this.enemyManager.enemies) {
      if (this.checkCollision(this.player, enemy)) {
        this.gameOver = true;
        console.log("Game Over: Player collided with enemy");
        break;
      }
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

  addWingman(type) {
    // 检查是否已经存在该类型的僚机
    const existingWingman = this.wingmen.find((w) => w.type === type);
    if (!existingWingman) {
      const x = this.player.x + (type === "left" ? -40 : 40);
      const y = this.player.y + 20;
      const newWingman = new Wingman(x, y, type);
      this.wingmen.push(newWingman);
      console.log(`Added ${type} wingman`); // 添加日志
    } else {
      console.log(`${type} wingman already exists`); // 添加日志
    }
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
      new WingmanEquipment("left"),
      new WingmanEquipment("right"),
      // ... 其他装备
    ];
    const choices = this.getRandomEquipments(availableEquipments, 2);
    this.presentEquipmentChoices(choices);
  }
  handleEquipmentChoice(touch) {
    if (!this.choosingEquipment) return;

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
        console.log(`Selected equipment: ${equipment.name}`); // 添加日志
        this.choosingEquipment = false;
        this.isPaused = false;
        this.lastEquipmentScore = this.score;
      }
    });
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
    // 主飞机射击
    let bullets = [
      new Bullet(
        this.player.x,
        this.player.y - this.player.height / 2,
        5,
        -Math.PI / 2,
        {}
      ),
    ];

    // 应用装备效果
    for (const equipment of this.equipments) {
      let newBullets = [];
      for (const bullet of bullets) {
        newBullets = newBullets.concat(equipment.apply(this, bullet));
      }
      bullets = newBullets;
    }

    this.bullets.push(...bullets);

    // 僚机射击
    this.wingmen.forEach((wingman) => {
      const wingmanBullet = wingman.shoot(this.lastTime);
      if (wingmanBullet) {
        this.bullets.push(wingmanBullet);
      }
    });
  }

  checkCollisions() {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      for (let j = this.enemyManager.enemies.length - 1; j >= 0; j--) {
        const enemy = this.enemyManager.enemies[j];
        if (this.checkCollision(bullet, enemy)) {
          this.addScore(enemy.score);
          this.enemyManager.enemies.splice(j, 1);

          if (bullet.effects && bullet.effects.aoe) {
            // 对周围敌人造成伤害
            this.dealAoeDamage(bullet, j);
          }

          if (!bullet.effects || !bullet.effects.piercing) {
            this.bullets.splice(i, 1);
            break;
          }
        }
      }
    }
  }
  checkCollision(object1, object2) {
    return (
      object1.x < object2.x + object2.width &&
      object1.x + object1.width > object2.x &&
      object1.y < object2.y + object2.height &&
      object1.y + object1.height > object2.y
    );
  }

  dealAoeDamage(bullet, excludeIndex) {
    const aoeRadius = 100;
    for (let i = this.enemyManager.enemies.length - 1; i >= 0; i--) {
      if (i !== excludeIndex) {
        const enemy = this.enemyManager.enemies[i];
        const distance = Math.sqrt(
          Math.pow(enemy.x - bullet.x, 2) + Math.pow(enemy.y - bullet.y, 2)
        );
        if (distance <= aoeRadius) {
          this.addScore(Math.floor(enemy.score / 2));
          this.enemyManager.enemies.splice(i, 1);
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
    if (this.gameOver) {
      const restartButtonX = this.systemInfo.windowWidth / 2 - 60;
      const restartButtonY = this.systemInfo.windowHeight / 2 + 50;
      const restartButtonWidth = 120;
      const restartButtonHeight = 40;

      if (
        touch.clientX >= restartButtonX &&
        touch.clientX <= restartButtonX + restartButtonWidth &&
        touch.clientY >= restartButtonY &&
        touch.clientY <= restartButtonY + restartButtonHeight
      ) {
        this.resetGame();
        return;
      }
    } else if (this.choosingEquipment) {
      this.handleEquipmentChoice(touch);
    }
  }
  onTouchEnd(touch) {
    if (this.gameOver || this.choosingEquipment) return; // 添加这行

    // 正常游戏中的触摸结束逻辑（如果有的话）
  }
}
