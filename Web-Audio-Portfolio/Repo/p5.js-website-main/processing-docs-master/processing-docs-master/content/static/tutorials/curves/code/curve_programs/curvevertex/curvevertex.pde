void setup()
{
  int[ ] x = {
    40, 80, 100, 60, 50 };
  int[ ] y = {
    40, 60, 100, 120, 150  };
  int n = x.length;
  int i;
  
  size(200, 200);
  background(255);
  smooth();

  noFill();
  stroke(0);
  beginShape();
  curveVertex(x[0], y[0]);
  for (i = 0; i < n; i++)
  {
    curveVertex(x[i], y[i]);
  }
  curveVertex(x[n - 1], y[n - 1]);
  endShape();
  /*
  fill(255, 0, 0);
  for (i = 0; i < x.length; i++)
  {
    ellipse(x[i], y[i], 3, 3);
  }
  */
}

