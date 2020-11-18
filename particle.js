class Particle {
  constructor(x, y, rand, img_, devWidth, devHeight, touchTime, part_UUID) {
    this.origposition = createVector(x, y);
    this.position = createVector(map(x, 0, devWidth, 0, width), map(y, 0, devHeight, 0, height));
    this.velocity = createVector();
    this.velocity_v2 = createVector(random(-2, 2), random(-2, 2));
    this.acceleration = createVector();
    this.home = this.origposition.copy();
    this.lifespan = 255.0;
    this.fill_alpha = 200.0;
    this.rand = floor(random(0, 3));
    this.img = img_;
    this.radius = 0.0;
    this.resize = 0.5;
    this.maxradius = height;
    this.selected = false;
    this.origWidth = devWidth;
    this.origHeight = devHeight;
    this.touchtime = touchTime;
    this.duration = 0.;
    this.active = false;
    this.UUID = part_UUID;

  }

  colour(rand) {

    this.col_array = [];

    this.col_array[0] = color(this.img[0], 0, 0);
    this.col_array[1] = color(0, this.img[1], 0);
    this.col_array[2] = color(0, 0, this.img[2]);

    this.fill_col = this.col_array[rand];
    this.stroke_col = this.col_array[rand];
  }

  run() {
    this.update();
    this.display();
  }


  intersects(other) {
    let d = dist(this.position.x, this.position.y, other.position.x, other.position.y);
    return (d < (this.radius*0.5) + (other.radius*0.5) && this.active == true);
  }



  update() {
    this.lifespan -= 0.0;

    this.colour(this.rand);

    if (touchtime >= this.touchtime) {
      this.active = true;
    }

    if (this.active == true && this.radius <= this.maxradius) {
      this.radius += this.resize;
      this.duration = this.duration + 1;
    }

    if (this.duration > 500 && this.active == true) {
      this.lifespan -= 1.0;
      this.fill_alpha -= 1.0;
    }
    if (this.lifespan <= 0.5 && this.active == true) {
      this.radius = 0.;
      this.fill_alpha = 200.0;
      this.lifespan = 255.0;
      this.duration = 0.0;
      this.active = false;
      this.rand = this.rand + 1;

      if (this.rand > 2) {
        this.rand = 0;
      }
    }

  }

  // Method to display
  display() {

    this.fill_col.setAlpha(this.fill_alpha);
    this.stroke_col.setAlpha(this.lifespan);

    push();
    noStroke();
    fill(this.fill_col);
    ellipseMode(CENTER);
    ellipse(this.position.x, this.position.y, this.radius);

    pop();
  }

  isDead() {
    if (reset == true) {
      return true;
    } else {
      return false;
    }
  }
}
