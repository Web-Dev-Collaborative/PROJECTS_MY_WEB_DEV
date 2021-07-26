Point[ ] coords = new Point[4];

void setup( )
{
  size(150, 150);
  background(255);
  smooth();
  coords[0] = new Point(50, 75);
  coords[1] = new Point(25, 25); // cp 1
  coords[2] = new Point(125, 25);  // cp 2
  coords[3] = new Point(100, 75);

  ellipse(coords[0].x, coords[0].y, 5, 5);
  ellipse(coords[3].x, coords[3].y, 5, 5);
  fill(255, 0, 0);
  ellipse(coords[1].x, coords[1].y, 5, 5);
  ellipse(coords[2].x, coords[2].y, 5, 5); 
  noFill();


  while (coords.length > 1)
  {
    drawPoly(coords);
    coords = midpoints(coords);
  }

  stroke(0);
  bezier(coords[0].x, coords[0].y,
  coords[1].x, coords[1].y,
  coords[2].x, coords[2].y,
  coords[3].x, coords[3].y);
}

void drawPoly(Point[ ] points)
{
  stroke(192);
  for (int i = 0; i < points.length - 1; i++)
  {
    line(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);
  }
}

Point[ ] midpoints(Point[ ] points)
{
  Point[ ] result = new Point[points.length - 1];
  for (int i = 0; i < points.length - 1; i++)
  {
    result[i] = new Point((points[i + 1].x + points[i].x) / 2,
    (points[i + 1].y + points[i].y) / 2);
  }
  return result;
}



