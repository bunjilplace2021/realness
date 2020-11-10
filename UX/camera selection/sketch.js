var circles = [];
var change, colorsPalette;
var img;
var counter = 0;

function preload(){
  img = loadImage("webcam.jpg");

}

function setup() {
  createCanvas(windowWidth, windowWidth);
img.resize(windowWidth,windowHeight);
 // background(0,255);
  change = 0;
  colorsPalette = [color(255, 0, 0,200),
            color(0, 255, 0,200),
            color(0, 0, 255,200),
          ];



}

function mousePressed(){
  for (var i=0;i<3;i++){
    circles.push(new Circle(30+i,mouseX,mouseY,0,i*random(90),colorsPalette[i]));
  }
}

function draw() {
  blendMode(BLEND)
  background(img);
  blendMode(ADD);
  noCursor();

if (!mouseIsPressed){
  fill(255,200);
  noStroke();
  ellipse(mouseX,mouseY,30);
}

  for(var i=0; i<circles.length;i++){
      circles[i].show(change);
  }

  change+=0.01;
}

function windowResized(){
  resizeCanvas(windowWidth,windowHeight);
  img.resize(width,height);
}


function Circle(radius,xpos,ypos,roughness,angle,color){

  this.radius = radius; //radius of blob
  this.xpos = xpos; //x position of blob
  this.ypos = ypos; // y position of blob
  this.roughness = roughness; // magnitude of how much the circle is distorted
  this.angle = angle; //how much to rotate the circle by
  this.color = color; // color of the blob
  this.active = true;
  this.show = function(change){


    if (mouseIsPressed){
      if (this.radius < 100 & this.active) {
      this.radius += 0.5;
      }
      if (this.roughness < 40 & this.active){
        this.roughness += 1;

      }

    }else{
  if(this.roughness>= 0){
      this.roughness -= 1;
      this.active = !this.active;
  }
    }

   fill(this.color); //color to fill the blob

    push(); //we enclose things between push and pop so that all transformations within only affect items within
    translate(xpos, ypos); //move to xpos, ypos
    rotate(this.angle); //rotate by this.angle+change
    beginShape(); //begin a shape based on the vertex points below
    //The lines below create our vertex points
    var off = 0;
    for (var i = 0; i < TWO_PI; i += 0.05) {
      var offset = map(noise(off, change), 0, 1, -this.roughness, this.roughness);
      var r = this.radius + offset;
      var x = r * cos(i);
      var y = r * sin(i);
      vertex(x, y);
      off += 0.1;
    }
    endShape(CLOSE); //end and create the shape
    pop();

    }
}
