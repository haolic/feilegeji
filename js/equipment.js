import { Bullet } from "./bullet.js";

export class BulletEffect {
  constructor(name, applyEffect) {
    this.name = name;
    this.applyEffect = applyEffect;
  }

  apply(game, bullet) {
    return this.applyEffect(game, bullet);
  }
}

const BulletEffects = {
  SPLIT_ARROW: new BulletEffect("Split Arrow", (game, bullet) => {
    const angles = [-Math.PI / 6, 0, Math.PI / 6];
    return angles.map(
      (angle) =>
        new Bullet(bullet.x, bullet.y, bullet.speed, bullet.angle + angle)
    );
  }),
};
export class Equipment {
  constructor(name, applyEffect) {
    this.name = name;
    this.applyEffect = applyEffect;
  }

  apply(game, bullet) {
    return this.applyEffect(game, bullet);
  }
}

export class SplitArrowEquipment extends Equipment {
  constructor() {
    super("Split Arrow", (game, bullet) => {
      const angles = [-Math.PI / 6, 0, Math.PI / 6];
      return angles.map(
        (angle) =>
          new Bullet(bullet.x, bullet.y, bullet.speed, bullet.angle + angle, {
            ...bullet.effects,
            split: true,
          })
      );
    });
  }
}

export class ElectricKnifeEquipment extends Equipment {
  constructor() {
    super("Electric Knife", (game, bullet) => {
      bullet.effects.electric = true;
      return [bullet];
    });
  }
}
