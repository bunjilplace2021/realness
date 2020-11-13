// save this file as sketch.js
// Sketch One

const globalv = 99;

var s = function( p ) { // p could be any variable name
  var x = 100;
  var y = 100;
  p.setup = function() {
    p.createCanvas(400, 400);
  };

  p.draw = function() {
    console.log(globalv);
    p.background(0);
    p.fill(255);
    p.rect(x,y,50,50);
  };
};
var myp5 = new p5(s, 'c1');

// Sketch Two
var t = function( p ) {
  var x = 100.0;
  var y = 100;
  var speed = 2.5;
  var mousepress = false;
  var m = 0;

  p.setup = function() {
    p.createCanvas(400,400 );
  };

  p.draw = function() {
    p.background(100);
    p.fill(1);
    console.log(globalv);
    x += speed;
    if(x > p.width){
      x = 0;
    }
    p.ellipse(x,y,50,50);

    if(mousepress){

     document.getElementById("c2").style.filter = `opacity(${m})`;
      if (m < 1.0){
        m +=.1;
      }
    } else {
      document.getElementById("c2").style.filter = `opacity(${m})`;
      if (m > 0){
        m -=.1;
      }
    }

      };


  p.mousePressed = function(){
    mousepress = !mousepress;
  }


};
var myp5 = new p5(t, 'c2');
