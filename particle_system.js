let particlecount;

class ParticleSystem {
  constructor(position, img_) {
    this.origin = position.copy();
    this.particles = [];
  }

  addParticle(x, y, rand, img, devWidth, devHeight, touchTime, part_UUID) {
    if (x !== undefined && y !== undefined) {
      this.particles.push(
        new Particle(x, y, rand, img, devWidth, devHeight, touchTime, part_UUID)
      );
      particlecount = this.particles.length;
    } else {
      this.particles.push(new Particle(this.origin.x, this.origin.y));
    }
<<<<<<< HEAD
    // LP QUICK FIX - Added loop to check if particle is active
    this.particles.forEach((particle) => {
      if (this.particles.length > 30 && !particle.active) {
        this.particles.splice(0, 1);
      }
    });
=======
>>>>>>> main
  }

  intersection() {
    let boundary = new Rectangle(0, 0, width, height);
    let qtree = new QuadTree(boundary, 4);

    for (let particle of this.particles) {
      let point = new Point(particle.position.x, particle.position.y, particle);
      qtree.insert(point);

      let range = new Circle(
        particle.position.x,
        particle.position.y,
        particle.radius * 2
      );
      let points = qtree.query(range);

      for (let point of points) {
        let other = point.userData;

        //Collision Detection Test
        if (particle !== other && particle.intersects(other)) {
          // noFill();
          // stroke(255);
          // line(particle.position.x, particle.position.y, other.position.x, other.position.y);
        }
      }
    }
  }

  resize_window() {
    for (let particle of this.particles) {
      particle.resize_window();
    }
  }

  run() {
    for (let particle of this.particles) {
      particle.run();

<<<<<<< HEAD
    // Filter removes any elements of the array that do not pass the test
    this.particles = this.particles.filter((particle) => !particle.isDead());
=======
      //remove particles if array limit exceeded.
      for (let i = this.particles.length - 1; i > array_limit; i--) {
        this.particles[i - array_limit].alive = false;
      }

    }
    this.particles = this.particles.filter(particle => !particle.isDead());
>>>>>>> main
  }

  applyForce(f) {
    for (let particle of this.particles) {
      particle.applyForce(f);
    }
  }
<<<<<<< HEAD
=======

>>>>>>> main
}
