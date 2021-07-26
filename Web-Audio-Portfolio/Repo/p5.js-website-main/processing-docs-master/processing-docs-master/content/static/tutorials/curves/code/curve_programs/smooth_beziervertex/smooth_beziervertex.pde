void setup( )
{
  size(150, 150);
  background(255);
  smooth();

  stroke(192);
  line(25, 25, 30, 70);
  line(100, 50, 50, 100);
  line(20, 130, 50, 100);
  line(75, 140, 120, 120);
  
  stroke(0);
  noFill();
  ellipse(25, 25, 5, 5); // control point 1 for curve A
  ellipse(75, 140, 5, 5); // control point 2 for curve B
  fill(255, 0, 0); 
  ellipse(100, 50, 5, 5); // control point 2 for curve A
  fill(0, 128, 0);
  ellipse(20, 130, 5, 5); // control point 1 for curve B
  noFill();
  stroke(0);
  beginShape();
  vertex(30, 70); // first point
  bezierVertex(25, 25, 100, 50, 50, 100);
  bezierVertex(20, 130, 75, 140, 120, 120);
  endShape();
}

