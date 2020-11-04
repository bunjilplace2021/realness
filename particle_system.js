let particlecount;

class ParticleSystem {
  constructor(position, img_) {
    this.origin = position.copy();
    this.particles = [];
  }

  addParticle(x, y, rand, img, devWidth, devHeight, touchTime, part_UUID) {
    if (x !== undefined && y !== undefined) {
      this.particles.push(new Particle(x, y, rand, img, devWidth, devHeight, touchTime, part_UUID));
      particlecount = this.particles.length;
    } else {
      this.particles.push(new Particle(this.origin.x, this.origin.y));
    }
  }

  run() {
    for (let particle of this.particles) {
      particle.run();
    }

    // Filter removes any elements of the array that do not pass the test
    this.particles = this.particles.filter(particle => !particle.isDead());
  }

  applyForce(f) {
    for (let particle of this.particles) {
      particle.applyForce(f);
    }
  }



  behaviors() {
    for (let particle of this.particles) {
      particle.behaviors(mouseX, mouseY);

    }
  }


  return_home() {
    for (let particle of this.particles) {
      particle.velocity.x = 0.0;
      particle.velocity.y = 0.0;
      particle.acceleration.x = -0.1 * (particle.position.x - particle.home.x);
      particle.acceleration.y = -0.1 * (particle.position.y - particle.home.y);
    }
  }



}
