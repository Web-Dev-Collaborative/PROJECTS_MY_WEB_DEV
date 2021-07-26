void setup()
{
  int[ ] coords = {
    40, 40, 80, 60, 100, 100, 60, 120, 50, 150
  };
  int i;
  
  size(200, 200);
  background(255);
  smooth();

  noFill();
  stroke(0);
  beginShape();
  curveVertex(40, 40); // the first control point
  curveVertex(40, 40); // is also the start point of curve
  curveVertex(80, 60);
  curveVertex(100, 100);
  curveVertex(60, 120);
  curveVertex(50, 150); // the last point of curve
  curveVertex(50, 150); // is also the last control point
  endShape();
  
  fill(255, 0, 0);
  noStroke();
  for (i = 0; i < coords.length; i += 2)
  {
    ellipse(coords[i], coords[i + 1], 3, 3);
  }
  stroke(0, 0, 255, 128);
  for (i = 0; i < (coords.length / 2) - 2; i++)
  {
    drawTangent(coords[i * 2], coords[i * 2 + 1],
      coords[(i + 2) * 2], coords[(i + 2) * 2 + 1],
      coords[(i + 1) * 2], coords[(i + 1) * 2 + 1]);
  }
}

/*
  Draw tangent line at px, py that is
  parallel to line from (x1, y1) to (x2, y2)
*/
void drawTangent(float x1, float y1, float x2, float y2,
  float px, float py)
{
  final int TAN_LENGTH = 15;
  float theta;
  float xOffset;
  float slope = (y1 - y2) / (x1 - x2);
  float intercept;
  if (abs(slope) != Float.POSITIVE_INFINITY)
  {
    intercept = py - slope * px;
    theta = atan2(y1 - y2, x1 - x2);
    xOffset = TAN_LENGTH * cos(theta);
    line(px - xOffset, slope * (px - xOffset) + intercept,
      px + xOffset, slope * (px + xOffset) + intercept);
  }
  else
  {
    line(px, py - TAN_LENGTH, px, py + TAN_LENGTH);
  }

}

