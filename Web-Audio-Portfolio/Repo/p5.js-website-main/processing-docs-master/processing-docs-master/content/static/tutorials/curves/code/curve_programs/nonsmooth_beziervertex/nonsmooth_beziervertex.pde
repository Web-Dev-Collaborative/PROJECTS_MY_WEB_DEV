void setup( )
{
  size(150, 150);
  background(255);
  smooth();

  stroke(192);
  line(25, 25, 30, 70);
  line(100, 50, 50, 100);
  line(50, 140, 50, 100);
  line(75, 140, 120, 120);
  
  stroke(0);
  fill(255, 0, 0);
  ellipse(25, 25, 5, 5); // control points for curve A
  ellipse(100, 50, 5, 5);
  fill(0, 128, 0);
  ellipse(50, 140, 5, 5); // control points for curve B
  ellipse(75, 140, 5, 5);
  noFill();
  stroke(0);
  beginShape();
  vertex(30, 70); // first point
  bezierVertex(25, 25, 100, 50, 50, 100);
  bezierVertex(50, 140, 75, 140, 120, 120);
  endShape();
}

