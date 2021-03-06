/*

// Ticker Developed for Motion Theory, 2004 Gabriel Dunne
// gdunne@quilime.com
// http://www.quilime.com
// http://www.motiontheory.com

*/

BImage a;
BFont monospace;
int[][] aPixels;
String fileName, frameNumber, sequenceExtension, sequencePrefix, targaSequencePrefix;
int rowWidth, rowHeight, rowSpace, numberofRows, sequenceEndFrame, sequenceStartFrame, extCount;
float minScrollSpeed, maxScrollSpeed;
boolean isImageSequence, saveTargaSequence;
color BGColor, tickerBGColor;
TickerRow[] row;

// setup
void setup() {

  // settings
  //////////////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////////////////////////

  size(800, 200);                             // size = pixels in the image

  monospace = loadFont("SCREENFont-R.vlw");   // load font (must be a monospace to be authentic)

  fileName = "test.jpg";                      // the image must be the exact pixel dimensions of the composition. if you are using an image sequence, this variable doesn't matter

  isImageSequence = false;                    // set if there is a sequence of images or not

  // the following must have 'isImageSequence' set to TRUE in order to be used by the applet
  sequencePrefix = "sequence_dir/sequence_";  // file name (do not include frame numbers)
  sequenceExtension = ".jpg";                 // file extension
  sequenceStartFrame = 0;                     // first frame of the image sequence
  sequenceEndFrame = 97;                      // last frame of the image sequence

  saveTargaSequence = false;                  // change this to true if you want to save an image sequence
  targaSequencePrefix = "SEQUENCE_01-";       // SEQUENCE_01-###0.tga

  BGColor = color(0,0,0);                      // applet background color
  tickerBGColor = color(0,0,0);                // ticker-row background color (this was set to black for production --the rows were extruded and textured in post.

  rowSpace = 0;                               // spacing between rows
  numberofRows = 20;                          // total number of rows
  minScrollSpeed = 1f;                      // minimum speed rows will be able to scroll
  maxScrollSpeed = 8f;                     // maximum speed rows will be able to scroll

  rowHeight = height/numberofRows;            // height of each row  (don't touch this variable for full screen)
  rowWidth = width;                           // width of each row   (don't touch this variable for full screen)

  //////////////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////////////////////////

  noStroke();
  noSmooth();

if (!isImageSequence) { updateImage(); } // if not an image sequence, update the pixel array once
else { extCount = sequenceStartFrame; }

  // initialize each row
  row = new TickerRow[numberofRows];
  for(int i=0; i < row.length; i++)
  {
    row[i] = new TickerRow(rowHeight*(i), rowWidth, rowHeight-rowSpace, random(minScrollSpeed, maxScrollSpeed));
  }

}

// loop
void loop() {

  background(BGColor); // redraw background

  if (isImageSequence)  updateImage();  // if there is an image sequence, update the pixel array every frame
  for(int i=0; i < row.length; i++) row[i].scroll(); // draw rows

  if (saveTargaSequence) saveFrame(targaSequencePrefix + "-####.tga"); // save each frame
}

void updateImage() {

  if(extCount == sequenceEndFrame) extCount = sequenceStartFrame; // if extension is equal to the end of the sequence, restart at the beginning

  frameNumber = String(extCount);  // adding the appropriate number of zeros
  if      (frameNumber.length() == 1)  frameNumber = "0000" + frameNumber;
  else if (frameNumber.length() == 2)  frameNumber = "000"  + frameNumber;
  else if (frameNumber.length() == 3)  frameNumber = "00"   + frameNumber;

  if (isImageSequence) fileName = sequencePrefix + frameNumber + sequenceExtension;

  a = loadImage(fileName); // Loads the image
  aPixels = new int[width][height]; // pixel array
  for(int i=0; i<height; i++) // assign pixel data
  {
    for(int j=0; j<width; j++)
    {
      aPixels[j][i] = a.pixels[i*width+j];
    }
  }
  extCount++; // increment the extension
}

// ticker object
class TickerRow {

  float ypos, xpos1, xpos2, tickerwidth, tickerheight, speed;
  String stock;
  int numSymbols = 31;
  int selSymbol = int(random(numSymbols));
  String[] stcksymbol;
  String order = "";
  int orderlist[];

  TickerRow (int y, int widthsetting, int heightsetting, float scrollSpeed)
  {
    ypos = y; // initial y position
    xpos1 = 0;    // initial x position (for ticker 1
    tickerwidth = widthsetting;
    tickerheight = heightsetting;
    xpos2 = widthsetting; // intial x position (for ticker 2
    speed = scrollSpeed;

    stcksymbol = new String[numSymbols]; // hard-coded array of stock symbols. Numbers are hardcoded; should really be random but I never got around to it.

    stcksymbol[30] = "NRA 46.25";
    stcksymbol[29] = "MSSL 21.41";
    stcksymbol[28] = "GNTM 64.52";
    stcksymbol[27] = "JSTS 34.52";
    stcksymbol[26] = "AXS-EVL 12.41";
    stcksymbol[25] = "PTRT_ACT 34.85";
    stcksymbol[24] = "SMRT_BMB 94.82";
    stcksymbol[23] = "HBTN 12.74";
    stcksymbol[22] = "AZNR 94.82";
    stcksymbol[21] = "BLR 52.10";
    stcksymbol[20] = "CHML 51.49";
    stcksymbol[19] = "BIN-LDN 34.45";
    stcksymbol[18] = "SADM 34.30";
    stcksymbol[17] = "SDI_RBIA 6.65";
    stcksymbol[16] = "WTC 13.34";
    stcksymbol[15] = "BSH 45.81";
    stcksymbol[14] = "WMD 7.99";
    stcksymbol[13] = "CHNY 5.34";
    stcksymbol[12] = "RIBS 1.08";
    stcksymbol[11] = "JED 34.20";
    stcksymbol[10] = "ROVS 34.93";
    stcksymbol[9] =  "MRDR 34.12";
    stcksymbol[8] =  "BNKR-BSTR 34.12";
    stcksymbol[7] =  "NRON 44.5";
    stcksymbol[6] =  "HLBR 6.76";
    stcksymbol[5] =  "NRA 9.15";
    stcksymbol[4] =  "CRCE 4.05";
    stcksymbol[3] =  "4OIL 1.76";
    stcksymbol[2] =  "CRD-OIL 2.37";
    stcksymbol[1] =  "MTH 44.93";
    stcksymbol[0] =  "ARMS 0.34";

    refreshOrder(); // refresh the random order of the symbols on each row
  }

  void scroll() // old parallax scrolling trick (clone self and seamlessly repeat ad-nauseam). However, after every complete pan, the stock symbols reset. The illusion is complete.
  {
    xpos1 -= speed; // decrement xpos1 in relation to speed
    xpos2 -= speed; // decrement xpos2 in relation to speed
    if (xpos1 < -width)
    {
      xpos1 = width; refreshOrder();
    }
    if (xpos2 < -width)
    {
      xpos2 = width; refreshOrder();
    }
    tickerDisplay(int(xpos1), int(ypos), int(tickerwidth), int(tickerheight)); // scroll ticker 1st part, the original
    tickerDisplay(int(xpos2), int(ypos), int(tickerwidth), int(tickerheight)); // scroll ticker 2ndpart, the clone(!)
  }

  void refreshOrder()
  {
    for(int i=0; i<numSymbols; i++)
    {
      order += String(int(random(numSymbols))) + " ";
    }
    orderlist = splitInts(order);
  }

  void tickerDisplay(int x, int y, int tickerwidth, int tickerheight)
  {

    int count, symCount, numRows, charHeight, charWidth, rowHeight, arrayKey, curSymbolLength, keyNumber;
    String curSymbol;

    textFont(monospace, tickerheight*1.6);

    arrayKey = orderlist[0]; // the current array key
    keyNumber = 0;
    count = 0; // the string count

    noStroke();
    fill(tickerBGColor);
    rect(x, y, tickerwidth, tickerheight);

    for(int j=0; j<tickerwidth-tickerheight/1.3; j+=tickerheight/1.3)
    {

      curSymbol = stcksymbol[arrayKey];         // the current symbol
      curSymbolLength = curSymbol.length();     // length of the current symbol

      if((x+j-2) < width && (x+j-2) > 0)
      {
        /*
        if (brightness(aPixels[x+j-2][y+tickerheight/2]) < 50 )
        fill(random(0, 80));
        else
        */
        fill(aPixels[x+j-2][y+tickerheight/2]); // fill
      }

      if (count < curSymbolLength)
      {
        text(curSymbol.substring(count,count+1), x+j-2, y+tickerheight);
        count++;
      }
      else if (count == curSymbolLength)
      {

        //stroke(0,0,255); // will show the space
        //noFill();
        //rect(x+j,y,20,30);

        count=0;
        keyNumber++;
        j+=tickerheight/2; // put two spaces
        arrayKey = orderlist[keyNumber];
      }
    }
  }
}

