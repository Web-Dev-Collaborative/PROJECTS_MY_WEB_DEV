void setup( )
{
  size(300, 300);
  background(255);
  smooth();

  noFill();
  polygon(3, 70, 75, 50); // use the defaults
  polygon(4, 170, 75, 25);

  stroke(128);
  // draw enclosing ellipses to make sure we did it right
  ellipse(70, 75, 100, 100);
  ellipse(170, 75, 50, 50);
}

void polygon(int n, float cx, float cy, float r)
{
  polygon(n, cx, cy, r * 2.0, r * 2.0, 0.0);
}

void polygon(int n, float cx, float cy, float w, float h, float startAngle)
{
  if (n > 2)
  {
    float angle = TWO_PI/ n;

    /* The horizontal "radius" is one half the width;
     the vertical "radius" is one half the height */
    w = w / 2.0;
    h = h / 2.0;

    beginShape();
    for (int i = 0; i < n; i++)
    {
      vertex(cx + w * cos(startAngle + angle * i),
      cy + h * sin(startAngle + angle * i));
    }
    endShape(CLOSE);
  }
}

