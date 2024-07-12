import { Bullet } from "./bullet.js";
export class Wingman {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 30;
    this.type = type; // 确保设置了type
    this.shootInterval = 1000; // 射击间隔
    this.lastShootTime = 0;
  }

  update(playerX, playerY) {
    // 跟随玩家移动
    this.x = playerX + (this.type === "left" ? -40 : 40);
    this.y = playerY + 20;
  }

  shoot(currentTime) {
    if (currentTime - this.lastShootTime > this.shootInterval) {
      this.lastShootTime = currentTime;
      return this.createBullet();
    }
    return null;
  }

  createBullet() {
    // 根据僚机类型创建不同的子弹
    switch (this.type) {
      case "left":
        return new Bullet(this.x, this.y, 5, -Math.PI / 2, { aoe: true });
      case "right":
        return new Bullet(this.x, this.y, 5, -Math.PI / 2, { homing: true });
      default:
        return new Bullet(this.x, this.y, 5, -Math.PI / 2, {});
    }
  }

  render(ctx) {
    ctx.fillStyle = this.type === "left" ? "green" : "orange";
    ctx.fillRect(
      this.x - this.width / 2,
      this.y - this.height / 2,
      this.width,
      this.height
    );
  }
}
