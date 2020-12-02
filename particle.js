class Particle {
  constructor(x, y, rand, img_, devWidth, devHeight, touchTime, part_UUID) {
    this.origposition = createVector(x, y);
    this.map_position = createVector(
      map(x, 0, devWidth, 0, width),
      map(y, 0, devHeight, 0, height)
    );
    this.position = createVector(
      round(this.map_position.x / 100) * 100,
      round(this.map_position.y / 100) * 100
    );
    this.resize_position = createVector();
    this.velocity = createVector();
    this.acceleration = createVector();
    this.lifespan = 255.0;
    this.fill_alpha = 200.0;
    this.rand = floor(random(0, 3));
    this.img = img_;
    this.radius = 0.0;
    this.resize = 0.2 * int(random(1, 3));
    this.maxradius = height;
    this.origWidth = devWidth;
    this.origHeight = devHeight;
    this.touchtime = touchTime;
    this.duration = 0;
    this.timer = 0;
    this.timermax = 150;
    this.alive = true;
    this.active = false;
    this.UUID = part_UUID;
    this.firstrun = true;
  }

  colour(rand) {
    this.col_array = [];

    this.col_array[0] = color(this.img[0], 0, 0);
    this.col_array[1] = color(0, this.img[1], 0);
    this.col_array[2] = color(0, 0, this.img[2]);

    this.fill_col = this.col_array[rand];
    this.stroke_col = this.col_array[rand];

    if (pixelShaderToggle) {
      if (this.timer < this.timermax) {
        this.timer = this.timer + 1;
      }
    } else {
      if (this.timer >= 0) {
        this.timer = this.timer - 1;
      }
    }

    if (this.UUID == uuid) {
      this.col = color(this.img[0], this.img[1], this.img[2], this.fill_alpha);
      this.fill_col = lerpColor(
        this.fill_col,
        this.col,
        map(this.timer, 0, this.timermax, 0, 1)
      );
    } else {
      this.col = color(0, this.fill_alpha);
      this.fill_col = lerpColor(
        this.fill_col,
        this.col,
        map(this.timer, 0, this.timermax, 0, 1)
      );
    }

    //first click - white and lerps to color
    if (
      this.firstrun &&
      this.UUID == uuid &&
      this.active &&
      this.duration <= 200
    ) {
      this.col = color(this.img[0], this.img[1], this.img[2], this.fill_alpha);
      this.fill_col = lerpColor(
        this.col,
        this.fill_col,
        map(this.duration, 0, 200, 0, 1)
      );
    }
  }

  run() {
    this.update();
    this.display();
  }

  intersects(other) {
    let d = dist(
      this.position.x,
      this.position.y,
      other.position.x,
      other.position.y
    );
    return d < this.radius * 0.5 + other.radius * 0.5 && this.active == true;
  }

  resize_window() {
    this.resize_position.x = map(
      this.origposition.x,
      0,
      this.origWidth,
      0,
      width
    );
    this.resize_position.y = map(
      this.origposition.y,
      0,
      this.origHeight,
      0,
      height
    );
    this.resize_position.x = round(this.resize_position.x / 100) * 100;
    this.resize_position.y = round(this.resize_position.y / 100) * 100;

    this.velocity.x = 0;
    this.velocity.y = 0;
    this.acceleration.x = -0.1 * (this.position.x - this.resize_position.x);
    this.acceleration.y = -0.1 * (this.position.y - this.resize_position.y);
  }

  update() {
    // this.position.x = (round(this.position.x / 100))*100;
    // this.position.y = (round(this.position.y / 100))*100;

    this.velocity.add(this.acceleration);
    this.position.add(this.velocity);
    this.acceleration.mult(0);
    this.lifespan -= 0.0;
    this.velocity.limit(this.maxspeed);

    this.colour(this.rand);

    if (touchtime >= this.touchtime) {
      this.active = true;
    }

    if (this.active == true && this.radius <= this.maxradius) {
      this.radius += this.resize;
      this.duration = this.duration + 1;
    }

    if (this.duration > 500 && this.active == true) {
      this.lifespan -= 0.2 * (this.rand + 1);
      this.fill_alpha -= 0.2 * (this.rand + 1);
    }
    if (this.lifespan <= 0.5 && this.active == true) {
      this.radius = 0;
      this.fill_alpha = 200.0;
      this.lifespan = 255.0;
      this.duration = 0.0;
      this.active = false;
      this.rand = this.rand + 1;
      this.firstrun = !this.firstrun;

      if (this.rand > 2) {
        this.rand = 0;
      }
    }
  }

  // Method to display
  display() {
    this.fill_col.setAlpha(this.fill_alpha);

    push();
    noStroke();
    fill(this.fill_col);
    ellipseMode(CENTER);
    ellipse(this.position.x, this.position.y, this.radius);
    pop();
  }

  isDead() {
    if (!this.alive && !this.active) {
      return true;
    } else {
      return false;
    }
  }
}
