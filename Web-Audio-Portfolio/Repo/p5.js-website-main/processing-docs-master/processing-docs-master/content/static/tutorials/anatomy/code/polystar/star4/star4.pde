void setup( )
{
  size(300, 300);
  background(255);
  smooth();

  noFill();
  star(3, 60, 75, 100, 100, -PI / 2.0, 0.3); // -90 degrees
  star(4, 170, 75, 25, 0.5);  // use simpler call

  fill(255, 204, 255);
  stroke(128, 0, 128);
  star(5, 60, 200, 75, 50, -PI / 2.0, 0.9); // -90 degrees

  noFill();
  stroke(0);
  star(6, 170, 200, 50, 100, 0, 0.4);
  stroke(128);
  
  // draw enclosing ellipses to make sure we did it right
  ellipse(60, 75, 100, 100);
  ellipse(170, 75, 50, 50);
  ellipse(60, 200, 75, 50);
  ellipse(170, 200, 50, 100);
}

void star(int n, float cx, float cy, float r, float proportion)
{
  star(n, cx, cy, 2.0 * r, 2.0 * r, 0.0, proportion);
}

void star(int n, float cx, float cy, float w, float h,
  float startAngle, float proportion)
{
  if (n > 2)
  {
    float angle = TWO_PI/ (2 *n);  // twice as many sides
    float dw; // draw width
    float dh; // draw height
    
    w = w / 2.0;
    h = h / 2.0;
    
    beginShape();
    for (int i = 0; i < 2 * n; i++)
    {
      dw = w;
      dh = h;
      if (i % 2 == 1) // for odd vertices, use short radius
      {
        dw = w * proportion;
        dh = h * proportion;
      }
      vertex(cx + dw * cos(startAngle + angle * i),
        cy + dh * sin(startAngle + angle * i));
    }
    endShape(CLOSE);
  }
}

