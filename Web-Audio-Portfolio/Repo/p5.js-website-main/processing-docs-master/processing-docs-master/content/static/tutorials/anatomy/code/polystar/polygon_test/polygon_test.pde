void setup( )
{
  size(300, 300);
  background(255);
  rectMode(CENTER);
  stroke(0, 0, 255);
  rect(50, 50, 50, 50);
  fill(255, 255, 204);
  stroke(0, 128, 0);
  polygon(6, 50, 50, 50, 50);
  polygon(6, 150, 150, 75, 50);
  stroke(255, 0, 0);
  noFill();
  polygonSimple(6, 50, 50, 50);
}

void polygon(int n, float x, float y, float w, float h)
{
  float cx = x;
  float cy = y;
  float angle = 360.0 / n;
  
  beginShape();
  for (int i = 0; i < n; i++)
  {
    vertex(cx + w * cos(radians(angle * i)),
      cy + h * sin(radians(angle * i)));
  }
  endShape(CLOSE);
  
}

void polygonSimple(int n, float x, float y, float r)
{
  float cx = x;
  float cy = y;
  float angle = 360.0 / n;
  
  beginShape();
  for (int i = 0; i < n; i++)
  {
    vertex(cx + r * cos(radians(angle * i)),
      cy + r * sin(radians(angle * i)));
  }
  endShape(CLOSE);
  
}
