/*
 * @name Video Capture
 * @frame 710,240
 * @description Capture video from the webcam and display
 * on the canvas as well with invert filter. Note that by
 * default the capture feed shows up, too. You can hide the
 * feed by uncommenting the capture.hide() line.
 * To run this example locally, you will need a running
 * <a href="https://github.com/processing/p5.js/wiki/Local-server">local server</a>.
 */
let capture;

function setup() {
  createCanvas(390, 240);
  capture = createCapture(VIDEO);
  capture.size(320, 240);
  //capture.hide();
}

function draw() {
  background(255);
  image(capture, 0, 0, 320, 240);
  filter(INVERT);
}
