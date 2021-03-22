class Particle {
  constructor(x, y, rand, img_, devWidth, devHeight, touchTime, part_UUID, part_audioUUID) {
    this.origposition = createVector(x, y);
    this.map_position = createVector(
      constrain(map(x, 0, devWidth, 0, width), 0, width),
      constrain(map(y, 0, devHeight, 0, height), 0, height)
    );
    this.alignpixel = 100;
    this.position = createVector(
      constrain(
        round(this.map_position.x / this.alignpixel) * this.alignpixel,
        this.alignpixel,
        width - this.alignpixel
      ),
      constrain(
        round(this.map_position.y / this.alignpixel) * this.alignpixel,
        this.alignpixel,
        height - this.alignpixel
      )
    );
    this.resize_position = createVector();
    this.velocity = createVector();
    this.acceleration = createVector();
    this.lifespan = 255.0;
    this.fill_alpha = 100.0;
    this.rand = rand;
    this.img = img_;
    this.radius = 0.0;
    this.resize = 0.2 * int(random(1, 3)) + width * 0.0001;
    this.maxradius = width >= height ? width : height;
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
    this.strokeweight = 0;
    this.intersect = 0.0;
    this.recording = false;
    this.recordcount = 0.0;
    this.initload = initload;
    this.outerDiam = 0;
    this.audioUUID = part_audioUUID;
  }

  colour() {
    this.col_array = [];

    this.col_array[0] = color(this.img[0], 0, 0);
    this.col_array[1] = color(0, this.img[1], 0);
    this.col_array[2] = color(0, 0, this.img[2]);

    this.fill_col = this.col_array[this.rand];
    this.stroke_col = this.col_array[this.rand];

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
      this.fill_col.setAlpha(this.fill_alpha);
    } else {
      this.col = color(this.img[0], this.img[1], this.img[2], this.fill_alpha);
      this.fill_col = lerpColor(
        this.fill_col,
        this.col,
        map(this.timer, 0, this.timermax, 0, 1)
      );
      this.fill_col.setAlpha(
        map(this.timer, 0, this.timermax, this.fill_alpha, 0)
      );
    }

    //first click - white and lerps to color
    if (
      this.firstrun &&
      this.active &&
      this.duration <= 800 &&
      !pixelShaderToggle
    ) {
      this.col = color(this.img[0], this.img[1], this.img[2], this.fill_alpha);
      this.fill_col = lerpColor(
        this.col,
        this.fill_col,
        constrain(map(this.duration, 100, 800, 0, 1), 0, 1)
      );
      this.strokeweight = lerp(5, 0, map(this.duration, 0, 800, 0, 1));
    }
  }

  holdevent(p) {

    if (window.recording && this.duration < 51 && this.firstrun) {
      this.recording = true;
    }

    if (
      this.UUID == uuid &&
      this.recording &&
      this.active &&
      this.recordcount == 0 &&
      window.recordingLimitReached == false
    ) {
      for (var i = 0; i < 3; i++) {
        this.diam = this.outerDiam - 100 * i;
        if (this.diam > 0) {
          this.fade = map(this.diam, 0, 200, 255, 0);
          p.fill(this.fade);
          p.noStroke();
          p.ellipse(this.map_position.x, this.map_position.y, this.diam);
        }
      }

      this.outerDiam = this.outerDiam + 3;

      if (this.outerDiam >= 500) {
        this.recordcount = this.recordcount + 1;
      }
    }
  }


  run(p) {
    this.update();
    this.display(p);
    this.holdevent(p);
    //console.log(width,height,this.position.x,this.position.y,this.map_position.x,this.map_position.y);
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
    this.map_position.x = constrain(
      map(this.origposition.x, 0, this.origWidth, 0, width),
      0,
      width
    );
    this.map_position.y = constrain(
      map(this.origposition.y, 0, this.origHeight, 0, height),
      0,
      height
    );

    this.resize_position.x = constrain(
      map(this.origposition.x, 0, this.origWidth, 0, width),
      0,
      width
    );
    this.resize_position.y = constrain(
      map(this.origposition.y, 0, this.origHeight, 0, height),
      0,
      height
    );

    this.resize_position.x = constrain(
      round(this.resize_position.x / this.alignpixel) * this.alignpixel,
      this.alignpixel,
      width - this.alignpixel
    );
    this.resize_position.y = constrain(
      round(this.resize_position.y / this.alignpixel) * this.alignpixel,
      this.alignpixel,
      height - this.alignpixel
    );

    this.resize = 0.2 * int(random(1, 3)) + width * 0.0001;
    this.maxradius = width >= height ? width : height;

    this.velocity.x = 0;
    this.velocity.y = 0;
    this.acceleration.x = -0.1 * (this.position.x - this.resize_position.x);
    this.acceleration.y = -0.1 * (this.position.y - this.resize_position.y);
  }

  update() {
    this.velocity.add(this.acceleration);
    this.position.add(this.velocity);
    this.acceleration.mult(0);
    this.lifespan -= 0.0;
    this.velocity.limit(this.maxspeed);

    this.colour();

    if (touchtime >= this.touchtime) {
      this.active = true;
    }

    if (this.active == true && this.radius <= this.maxradius) {
      this.radius += this.resize;
      this.duration = this.duration + 1;
    }

    if (this.active && pixelShaderToggle && this.UUID == uuid) {
      this.lifespan -= this.intersect;
      this.fill_alpha -= this.intersect;
    }
    //  if (!pixelShaderToggle) {

    if (this.duration > 500 && this.active == true) {
      this.alph_factor = constrain(map(width, 300, 1000, 0.2, 0.1), 0.1, 0.2);
      this.lifespan -= this.alph_factor * (this.rand + 1);
      this.fill_alpha -= this.alph_factor * (this.rand + 1);
    }
    if (this.lifespan <= 0.5 && this.active == true) {
      this.radius = 0;
      this.fill_alpha = 200.0;
      this.lifespan = 255.0;
      this.duration = 0.0;
      this.active = false;
      this.rand = floor(random(0, 3));
      this.firstrun = false;
      this.intersect = 0.0;
      this.initload = false;
      initload = false; //global flag
    }
  }

  audioBuffer(p) {

    for (var i = 0; i < 10; i++) {
      this.diam = this.radius - (10 * i);
      if (this.diam > 0) {
        if (this.firstrun) {
          p.ellipse(this.map_position.x, this.map_position.y, this.diam);
        } else {
          p.ellipse(this.position.x, this.position.y, this.diam);
        }
        this.diam += this.resize;
      }
    }

  }


  // Method to display
  display(p) {
    p.push();

    // if (pixelShaderToggle && this.UUID == uuid) {
    //   p.stroke(255, this.fill_alpha);
    // } else {
    //   p.noStroke();
    // }

    if (!pixelShaderToggle && this.UUID != uuid && this.firstrun) {
      p.strokeWeight(this.strokeweight);
      p.stroke(this.fill_col, this.fill_alpha);
    } else {
      p.noStroke();
    }

    p.fill(this.fill_col);
    p.ellipseMode(CENTER);

    if (this.initload) {

      p.ellipse(this.position.x, this.position.y, this.radius);

    } else {
      if (this.firstrun) {

        if (this.audioUUID == window.audioUUID) {
          this.audioBuffer(p);
        } else {
          p.ellipse(this.map_position.x, this.map_position.y, this.radius);
        }

      } else {
        if (this.audioUUID == window.audioUUID) {
          this.audioBuffer(p);
        } else {
          p.ellipse(this.position.x, this.position.y, this.radius);
        }
      }
    }
    p.pop();
  }

  isDead() {
    if (!this.alive && !this.active) {
      window.logging && console.log("pixel is dead");
      // setTimeout makes it async
      setTimeout(() => {
        window.dispatchEvent(window.radiusLimit);
      });

      return true;
    } else {
      return false;
    }
  }
}
