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
    this.size_v2 = 0.0;
    this.maxsize = height; //(skip / (particlecount / 1.5)) * 10.0; //random(1, 3) * (height/12) ;//40 //50;
    this.radius = 25;
    this.highlight = false;
    this.maxspeed = 3;
    this.maxforce = 1;
    this.resize = 0.5; //random(1, 3) * (1 / particlecount);
    this.strokeweight = 1.0;
    this.selected = false;
    this.period = (this.rand + 1) * 600;
    this.fillperiod = (this.rand + 1);
    this.amplitude = this.lifespan;
    this.local_force = true;
    this.origWidth = devWidth;
    this.origHeight = devHeight;
    this.history = [];
    this.touchtime = touchTime;
    this.duration = 0.;
    this.active = false;
    this.UUID = part_UUID;

  }

  colour(rand) {

    this.c = color(this.img[0], this.img[1], this.img[2], 240);

    this.col_array = [];

    this.col_array[0] = color(this.img[0], 0, 0);
    this.col_array[1] = color(0, this.img[1], 0);
    this.col_array[2] = color(0, 0, this.img[2]);


    //this.img.get(this.home.x / skip, this.home.y / skip);

    this.fill_col = this.col_array[rand]; //this.c; //this.random_color_gen[rand];
    this.stroke_col = this.col_array[rand]; //this.c; //this.random_color_gen[(rand + 3)];
  }

  run() {
    this.update();
    this.display();
  }

  behaviors(px, py) {
    this.mouse = createVector(px, py);
    var flee = this.flee(this.mouse);
    flee.mult(-1.0);


    this.applyForce(flee);
  }

  flee() {
    var desired = p5.Vector.sub(this.mouse, this.position);
    var d = dist(this.mouse.x, this.mouse.y, this.position.x, this.position.y);
    this.mouseradius = eraser_size;
    this.positionradius = (this.size_v2 / 2);


    //var d = desired.mag();

    if (d < this.mouseradius + this.positionradius) {
      desired.setMag(this.maxspeed);
      desired.mult(10.0);
      var steer = p5.Vector.sub(desired, this.velocity);
      steer.limit(this.maxforce);
      this.local_force = true;
      return steer;
    } else {
      return createVector(0, 0);
    }
  }

  intersects(other) {
    this.dir = p5.Vector.sub(this.position, other.position);
    return (this.dir.magSq() < ((150) * (150)) && this.local_force == true &&
      this.position.x !== 0 && this.position.x !== width && this.position.y !== 0 && this.position.y !== height);
  }

  intersectForce() {
    this.power = 50;
    let d = this.dir.mag(); // Distance between objects
    this.dir.normalize(); // Normalize vector (distance doesn't matter here, we just want this vector for direction)
    d = constrain(d, 5, 100); // Keep distance within a reasonable range
    let force = 1 * this.power / (d * d); // Repelling force is inversely proportional to distance
    this.dir.mult(force); // Get force vector --> magnitude * direction
    //  return dir;
    //this.dir.setMag(0.01);
    this.applyForce(this.dir);
  }

  applyForce(f) {
    this.acceleration.add(f);
  }

  update() {

    // this.velocity.add(this.acceleration);
    // this.position.add(this.velocity);
    // this.acceleration.mult(0);
    this.lifespan -= 0.0;
    //  this.velocity.limit(this.maxspeed);

    // this.history.push(this.position.copy());
    // //console.log(this.history);
    //
    // if (this.history.length > 300) {
    //   this.history.splice(0, 1);
    // }

    this.home.x = map(this.origposition.x, 0, this.origWidth, 0, width);
    this.home.y = map(this.origposition.y, 0, this.origHeight, 0, height);


    // this.c = 0.01;
    // this.speed = this.velocity.mag();
    // this.dragMagnitude = this.c * this.speed * this.speed;
    // this.drag = this.velocity.copy();
    // this.drag.mult(-1);
    // this.drag.normalize();
    // this.drag.mult(this.dragMagnitude);
    // this.velocity.add(this.drag);

    this.colour(this.rand);
    this.d = dist(this.position.x, this.position.y, this.home.x, this.home.y);

    if (this.local_force == true) {
      this.velocity = this.velocity_v2;
    }


    // if (this.amplitude < this.lifespan) {
    //   this.amplitude += 5.0;
    // }

    if (touchtime >= this.touchtime) {
      this.active = true;
      //console.log(this.active);
    }

    if (this.active == true && this.size_v2 <= this.maxsize) {
      this.size_v2 += this.resize;
      this.duration = this.duration + 1;
    }

    if (this.duration > 500 && this.local_force == true && this.active == true) {
      this.lifespan -= 1.0;
      this.fill_alpha -= 1.0;
    }
    if (this.lifespan <= 0.5 && this.local_force == true && this.active == true) {
      this.size_v2 = 0.;
      this.fill_alpha = 200.0;
      this.lifespan = 255.0;
      this.duration = 0.0;
      this.active = false;
      this.rand = this.rand + 1;
        if (this.rand > 2){
          this.rand = 0;
        }
    }


    if (pixelShaderToggle && this.fill_alpha > 30 && this.lifespan > 30 && this.local_force == false) {
      this.lifespan -= 2.0
      this.fill_alpha -= 2.0;
      //this.strokeweight += 1.0;
    }

    if (pixelShaderToggle) {
      this.local_force = false;
    } else {
      this.local_force = true;
    }


    // if (this.strokeweight > 1.0) {
    //   this.strokeweight -= 0.0;
    // }

    if (this.position.y < 0) {
      this.velocity.mult(-1);
      //  this.position.y = height;
    }

    if (this.position.y > height) {
      //  this.position.y = 0;
      this.velocity.mult(-1);
    }
    if (this.position.x < 0) {
      //  this.position.x = width;
      this.velocity.mult(-1);
    }

    if (this.position.x > width) {
      //  this.position.x = 0;
      this.velocity.mult(-1);
    }



  }

  // Method to display
  display() {

    // if (mouseIsPressed || LFO == true) {
    //
    //   this.fill_alpha = map(this.d, 0, 500, 255, 40);
    //   //this.size_v2 = map(this.d, 0, 500, skip, this.maxsize);
    //   //this.amplitude = map(this.d, 0, 500, 0, this.amplitude);
    //   this.size_osc = 0;
    // }

    if (this.d > 0.05 && mouseIsPressed) {
      this.local_force = false;
    }

    this.fill_col.setAlpha(this.fill_alpha);
    this.stroke_col.setAlpha(this.lifespan);
    //console.log(this.stroke_col);
    //push();
    //translate(this.position.x * 1.4,this.position.y * 1.4)
    //scale(1.4);
    push();
    noStroke();
    //stroke(this.stroke_col);//this.stroke_col
    fill(this.fill_col);
    //strokeWeight(3);
    ellipseMode(CENTER);
    ellipse(this.position.x, this.position.y,
      (this.size_v2));
    //rectMode(CENTER); //or rect?
    //rect(this.position.x, this.position.y,(this.size_v2), this.size_v2);
    // stroke(255);
    // beginShape();
    // for (let i = 0; i < this.history.length; i++) {
    //   let pos = this.history[i];
    //   noFill();
    //   vertex(pos.x, pos.y);
    //   endShape();
    //}


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
