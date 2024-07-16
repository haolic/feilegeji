// 创建 Canvas
const canvas = wx.createCanvas();
const ctx = canvas.getContext("2d");

export class Game {
  constructor(rows, cols) {
    this.rows = rows;
    this.cols = cols;
    this.cellSize = 60; // 设置方块大小为60x60像素
    this.width = this.cols * this.cellSize;
    this.height = this.rows * this.cellSize;

    // 计算游戏区域在屏幕上的位置，使其居中
    this.offsetX = (canvas.width - this.width) / 2;
    this.offsetY = (canvas.height - this.height) / 2;

    this.grid = [];
    this.path = [];
    this.startCell = null;
    this.targetCell = null;
    this.currentNumber = 1;
    this.touchActive = false;

    this.initGrid();
    this.setStartCell();
    this.setTargetCell();
    this.resetGame = this.resetGame.bind(this);
  }

  initGrid() {
    for (let y = 0; y < this.rows; y++) {
      this.grid[y] = [];
      for (let x = 0; x < this.cols; x++) {
        this.grid[y][x] = { type: "empty", number: null };
      }
    }
  }

  setStartCell() {
    const x = 0;
    const y = 0;
    this.startCell = { x, y };
    this.grid[y][x] = { type: "start", number: 1 };
  }

  setTargetCell() {
    let x, y;
    do {
      x = Math.floor(Math.random() * this.cols);
      y = Math.floor(Math.random() * this.rows);
    } while (x === this.startCell.x && y === this.startCell.y);

    this.targetCell = { x, y };
    this.grid[y][x] = {
      type: "target",
      number: Math.floor(Math.random() * 19) + 2,
    };
  }

  startTouch(x, y) {
    const gridX = Math.floor((x - this.offsetX) / this.cellSize);
    const gridY = Math.floor((y - this.offsetY) / this.cellSize);
    if (gridX === this.startCell.x && gridY === this.startCell.y) {
      this.touchActive = true;
      this.path = [{ x: gridX, y: gridY }];
      this.currentNumber = 1;
    }
  }

  moveTouch(x, y) {
    if (!this.touchActive) return;

    const gridX = Math.floor((x - this.offsetX) / this.cellSize);
    const gridY = Math.floor((y - this.offsetY) / this.cellSize);
    const lastCell = this.path[this.path.length - 1];

    if (this.isValidMove(lastCell, { x: gridX, y: gridY })) {
      // 检查是否是回退
      const isBacktrack =
        this.path.length > 1 &&
        this.path[this.path.length - 2].x === gridX &&
        this.path[this.path.length - 2].y === gridY;

      if (isBacktrack) {
        // 回退操作
        const removedCell = this.path.pop();
        if (this.grid[removedCell.y][removedCell.x].type !== "target") {
          this.grid[removedCell.y][removedCell.x] = {
            type: "empty",
            number: null,
          };
        }
        this.currentNumber--;
      } else {
        // 非回退操作
        const cellType = this.grid[gridY][gridX].type;

        // 只有当格子是空的或者是目标格子时才允许移动
        if (cellType === "empty" || cellType === "target") {
          if (cellType === "target") {
            // 移动到目标格子
            if (this.currentNumber + 1 === this.grid[gridY][gridX].number) {
              this.addToPath(gridX, gridY);
            }
          } else {
            // 正常移动到空格子
            this.addToPath(gridX, gridY);
          }
        }
      }
    }
  }

  endTouch() {
    this.touchActive = false;
    if (this.isGameWon()) {
      console.log("Game Won!");
    }
  }

  isValidMove(from, to) {
    return (
      (Math.abs(from.x - to.x) === 1 && from.y === to.y) ||
      (Math.abs(from.y - to.y) === 1 && from.x === to.x)
    );
  }

  addToPath(x, y) {
    this.path.push({ x, y });
    this.currentNumber++;
    if (this.grid[y][x].type !== "target") {
      this.grid[y][x] = { type: "path", number: this.currentNumber };
    }
  }

  isGameWon() {
    return this.path.length === this.rows * this.cols;
  }

  draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制游戏背景
    ctx.fillStyle = "white";
    ctx.fillRect(this.offsetX, this.offsetY, this.width, this.height);

    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const cell = this.grid[y][x];
        const cellX = this.offsetX + x * this.cellSize;
        const cellY = this.offsetY + y * this.cellSize;

        ctx.fillStyle = this.getCellColor(cell.type);
        ctx.fillRect(cellX, cellY, this.cellSize, this.cellSize);

        if (cell.number) {
          ctx.fillStyle = "white";
          ctx.font = "20px Arial";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(
            cell.number,
            cellX + this.cellSize / 2,
            cellY + this.cellSize / 2
          );
        }

        // 绘制网格线
        ctx.strokeStyle = "#ccc";
        ctx.strokeRect(cellX, cellY, this.cellSize, this.cellSize);
      }
    }
    if (this.isWon) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)"; // 半透明黑色背景
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "gold";
      ctx.font = "bold 48px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("胜利", canvas.width / 2, canvas.height / 2);
    }
  }

  getCellColor(type) {
    switch (type) {
      case "empty":
        return "#f0f0f0";
      case "start":
        return "red";
      case "target":
        return "blue";
      case "path":
        return "green";
      default:
        return "white";
    }
  }

  resetGame() {
    // 保存当前的目标方块信息
    const targetCell = this.targetCell;
    const targetNumber = this.grid[targetCell.y][targetCell.x].number;

    // 重新初始化网格，但不重新设置目标方块
    this.initGrid();
    this.setStartCell();

    // 恢复目标方块
    this.targetCell = targetCell;
    this.grid[targetCell.y][targetCell.x] = {
      type: "target",
      number: targetNumber,
    };

    // 重置路径和当前数字
    this.path = [];
    this.currentNumber = 1;
  }

  onTouchStart(touch) {
    this.startTouch(touch.clientX, touch.clientY);
  }

  onTouchMove(touch) {
    this.moveTouch(touch.clientX, touch.clientY);
  }

  onTouchEnd() {
    this.touchActive = false;
    if (this.isGameWon()) {
      console.log("Game Won!");
      this.isWon = true; // 标记游戏胜利
      // 在这里可以添加一个延时，比如3秒后重置游戏
      setTimeout(() => {
        this.isWon = false;
        this.initGrid();
        this.setStartCell();
        this.setTargetCell();
        this.path = [];
        this.currentNumber = 1;
      }, 3000);
    } else {
      this.resetGame();
    }
  }
}

// 创建游戏实例
const game = new Game(5, 4);

// 游戏循环
function gameLoop() {
  game.draw();
  requestAnimationFrame(gameLoop);
}

// 触摸事件监听
wx.onTouchStart((e) => game.onTouchStart(e.touches[0]));
wx.onTouchMove((e) => game.onTouchMove(e.touches[0]));
wx.onTouchEnd(() => game.onTouchEnd());

// 开始游戏循环
gameLoop();
