void setup()
{
  size(200, 200);
  background(255);
  smooth();
  stroke(0);
  curve(40, 40, 80, 60, 100, 100, 60, 120);
  
  noStroke();
  fill(0, 128, 0);
  ellipse(40, 40, 3, 3); // cp1
  ellipse(100, 100, 3, 3); // x2 y2
  fill(255, 0, 255);
  ellipse(80, 60, 3, 3); // x1 y1
  ellipse(60, 120, 3, 3);  // cp2
  
  noFill();
  stroke(0, 128, 0, 96);
  line(40, 40, 100, 100);  // from control pt 1 to x2, y2
  drawTangent(40, 40, 100, 100, 80, 60);
  stroke(255, 0, 255, 96);
  line(80, 60, 60, 120); // from x1, y1 to control point 2
  drawTangent(80, 60, 60, 120, 100, 100);
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

