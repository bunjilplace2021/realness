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
    // LP QUICK FIX - Added loop to check if particle is active
    this.particles.forEach((particle) => {
      if (this.particles.length > 30 && !particle.active) {
        this.particles.splice(0, 1);
      }
    });
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

  run() {
    for (let particle of this.particles) {
      particle.run();
    }

    // Filter removes any elements of the array that do not pass the test
    this.particles = this.particles.filter((particle) => !particle.isDead());
  }

  applyForce(f) {
    for (let particle of this.particles) {
      particle.applyForce(f);
    }
  }
}
