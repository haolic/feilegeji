export class Bullet {
  constructor(x, y, speed = 5, angle = 0, effects = {}) {
    this.x = x;
    this.y = y;
    this.width = 5;
    this.height = 10;
    this.speed = speed;
    this.angle = angle;
    this.effects = effects;
  }

  update() {
    this.x += Math.sin(this.angle) * this.speed;
    this.y -= Math.cos(this.angle) * this.speed;
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // 根据效果绘制不同的子弹外观
    if (this.effects.electric) {
      ctx.fillStyle = "cyan";
      ctx.strokeStyle = "blue";
      ctx.lineWidth = 2;
    } else {
      ctx.fillStyle = "yellow";
    }

    ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

    if (this.effects.electric) {
      ctx.strokeRect(
        -this.width / 2,
        -this.height / 2,
        this.width,
        this.height
      );
    }

    ctx.restore();
  }

  isOutOfScreen(canvasHeight, canvasWidth) {
    return (
      this.y + this.height < 0 ||
      this.y - this.height > canvasHeight ||
      this.x + this.width < 0 ||
      this.x - this.width > canvasWidth
    );
  }
}

export class EnemyManager {
  constructor(ctx, canvasWidth, canvasHeight) {
    this.ctx = ctx;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.enemies = [];
    this.spawnInterval = 2000;
    this.lastSpawnTime = 0;
  }

  update(currentTime) {
    if (currentTime - this.lastSpawnTime > this.spawnInterval) {
      const types = ["normal", "fast", "strong"];
      const type = types[Math.floor(Math.random() * types.length)];
      this.enemies.push(
        new Enemy(this.ctx, this.canvasWidth, this.canvasHeight, type)
      );
      this.lastSpawnTime = currentTime;
    }
    this.enemies.forEach((enemy) => enemy.update());
    this.enemies = this.enemies.filter((enemy) => !enemy.isOutOfScreen());
  }

  render() {
    this.enemies.forEach((enemy) => enemy.render());
  }
}

class Enemy {
  constructor(ctx, canvasWidth, canvasHeight, type = "normal") {
    this.ctx = ctx;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.width = 40;
    this.height = 40;
    this.x = Math.random() * (canvasWidth - this.width);
    this.y = -this.height;
    this.type = type;

    switch (type) {
      case "fast":
        this.speed = 4 + Math.random() * 2;
        this.score = 20;
        this.color = "green";
        break;
      case "strong":
        this.speed = 1 + Math.random() * 1.5;
        this.score = 30;
        this.color = "purple";
        break;
      default:
        this.speed = 2 + Math.random() * 2;
        this.score = 10;
        this.color = "red";
        break;
    }
  }

  update() {
    this.y += this.speed;
  }

  render() {
    this.ctx.fillStyle = this.color;
    switch (this.type) {
      case "fast":
        this.ctx.beginPath();
        this.ctx.arc(
          this.x + this.width / 2,
          this.y + this.height / 2,
          this.width / 2,
          0,
          Math.PI * 2
        );
        this.ctx.fill();
        break;
      case "strong":
        this.ctx.beginPath();
        this.ctx.moveTo(this.x + this.width / 2, this.y);
        this.ctx.lineTo(this.x + this.width, this.y + this.height);
        this.ctx.lineTo(this.x, this.y + this.height);
        this.ctx.closePath();
        this.ctx.fill();
        break;
      default:
        this.ctx.fillRect(this.x, this.y, this.width, this.height);
        break;
    }
  }

  isOutOfScreen() {
    return this.y > this.canvasHeight;
  }
}
