import { Game } from "./game.js";

class Main {
  constructor() {
    this.canvas = wx.createCanvas();
    this.ctx = this.canvas.getContext("2d");
    this.systemInfo = wx.getSystemInfoSync();
    this.canvas.width = this.systemInfo.windowWidth;
    this.canvas.height = this.systemInfo.windowHeight;
    this.game = new Game(this.ctx, this.systemInfo);
    this.bindEvent();
    this.lastTime = 0;
    this.loop();
  }

  bindEvent() {
    wx.onTouchStart(this.onTouchStart.bind(this));
    wx.onTouchMove(this.onTouchMove.bind(this));
    wx.onTouchEnd(this.onTouchEnd.bind(this));
  }

  onTouchStart(e) {
    const touch = e.touches[0];
    this.game.onTouchStart(touch);
  }

  onTouchMove(e) {
    const touch = e.touches[0];
    this.game.onTouchMove(touch);
  }

  onTouchEnd(e) {
    const touch = e.changedTouches[0];
    this.game.onTouchEnd(touch);
  }

  loop(currentTime) {
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    this.game.update(currentTime);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.game.render();
    requestAnimationFrame(this.loop.bind(this));
  }
}

export default Main;
