class AVRComm {
  Serial avr;
  int x, y, h, w; // Store location of terminal box
  
  PFont font;
  StringBuffer input, serial_input;
  int serial_count = 0;
  String[] output;
  int[] output_source;
  int LINE_HEIGHT = 15;
  int FONT_SIZE = 13;
  int MAX_LINES;
  
  AVRComm(processing.core.PApplet applet, int _x, int _y, int _w, int _h) {
    x = _x;
    y = _y;
    w = _w;
    h = _h;
    avr = new Serial(applet, "/dev/tty.USA19H1b1P1.1", 38400);
    MAX_LINES = (h-40)/LINE_HEIGHT;
    font = loadFont("GillSans-Bold.vlw.gz");
    textFont(font, FONT_SIZE); 
    input = new StringBuffer(128);
    serial_input = new StringBuffer(128);
    output = new String[MAX_LINES];
    output_source = new int[MAX_LINES];
    for(int i=0; i<output.length; i++)
      output[i] = "";
  }
  
  void draw() {
    fill(32);
    rect(x,y,w,h);
    printText(output, LINE_HEIGHT);
    printInputText();
  }
  
  void process() {  // Process any new serial data
    while(avr.available() > 0) { // Which it should be
      char inbyte = avr.readChar();
      switch(inbyte) {
        case '\n':
//          println("New Serial Input: "+serial_input.toString());
          printLine(serial_input.toString(), 2);
          serial_input.delete(0, serial_input.length());
          break;
        default:
          serial_input.append((char) inbyte);
      }
    }
  }

  void keyPressed(char key) {
    if(keyCode == BACKSPACE) {
      if(input.length() > 0)
        input.deleteCharAt(input.length()-1); }
    else
      switch(key) {
        case '\n':
          String input_string = input.toString();
          printLine(input_string, 1);
          if(input_string.trim().matches("^status$")) {
            char[] status_command = {42, 255, 255};
            avr.write(new String(status_command)); }
      // If command is just one number, fire that valve
          else if(input_string.matches("^\\d+$")) {
            int note = int(input_string);
            if(!isInNoteRange(note))
              printLine("Command Error: Valve "+note+" does not exist", 0);
            else {
              playNote(note); } }
      // If command is "1 10" ie, two numbers, change valve timing
          else if(input_string.trim().matches("^\\d+ \\d+$")) {
            String[] command = input_string.trim().split(" ");
            int note = int(command[0]);
            int timing = int(command[1]);
            if(!isInNoteRange(note))
              printLine("Command Error: Note "+valve_by_note[note]+" does not exist", 0);
            else if(timing > 255)
              printLine("Command Error: Timing "+timing+" is greater than 255", 0);
            else {
              changeNoteTiming(note, timing); } }
      // If command is "c 1", valve 1 is specified for calibration
          else if(input_string.trim().matches("^c \\d+$")) {
            String[] command = input_string.trim().split(" ");
            int note = int(command[1]);
            if(isInNoteRange(note) && calibrating_note[calibration_note_to_change] != note && calibrating_note[1-calibration_note_to_change] != note) {
              calibrating_note[calibration_note_to_change] = note;
              printLine("Calibrating Notes "+calibrating_note[0]+" and "+calibrating_note[1], 1);     
              calibration_note_to_change = 1-calibration_note_to_change; }
            }
      // If command is "d 1 30", valve 1's delay is changed to 30
          else if(input_string.trim().matches("^d \\d+ \\d+$")) {
            String[] command = input_string.trim().split(" ");
            int note = int(command[1]);
            int _delay = int(command[2]);
            if(note > 24)
              printLine("Command Error: Note "+note+" does not exist", 0);
            else if(_delay > 255)
              printLine("Command Error: Delay "+_delay+" is greater than 255", 0);
            else {
              changeNoteDelay(note, _delay); } }
      // If command is "send timing", all note timings are sent
          else if(input_string.trim().matches("^send timing$")) {
            for(int i=0; i<number_of_notes; i++)
              the_notes[i].sendTiming(); }
      // If command is "rhythm 1", rhythm sequence 1 is activated
          else if(input_string.trim().matches("^rhythm \\d+$")) {
            String[] command = input_string.trim().split(" ");
            int seq = int(command[1]);
            coherence.surgeUp();
            coherence.coherence = 1;
            rhythm_hint.activate(seq); }
      // If command is "music 1", music sequence 1 is activated
          else if(input_string.trim().matches("^music \\d+$")) {
            String[] command = input_string.trim().split(" ");
            int seq = int(command[1]);
            coherence.surgeUp();
            coherence.coherence = 1;
            music_hint.activate(1, seq); }
      // If command is "setmark 1 0", valve 1's level mark is set at 0
          else if(input_string.trim().matches("^setmark \\d+ \\d+$")) {
            String[] command = input_string.trim().split(" ");
            int note = int(command[1]);
            int mark = int(command[2]);
            if(note > 24)
              printLine("Command Error: Note "+note+" does not exist", 0);
            else if(mark > valve_timing_marks.length-1)
              printLine("Command Error: Mark "+mark+" is greater than "+(valve_timing_marks.length-1), 0);
            else {
              the_notes[note].setMark(mark); } }
          else if(input_string.trim().matches("^show count$")) {
            for(int i=0; i<the_notes.length; i++)
              println("Note "+i+": played "+the_notes[i].play_count+" - weight "+the_notes[i].weight+"- delay "+the_notes[i].valve_delay+" - timing "+the_notes[i].timing); }
          else if(input_string.trim().matches("^uptime$")) {
            println("Program has been running for "+(millis()/60000)+" minutes."); }
          else
            printLine("Unknown command", 0);
            input.delete(0, input.length());
          break;
        default:
          input.append((char) key);
        }
      }
  
  void playNote(int note) {
    printLine("Playing note "+note+" with valve"+valve_by_note[note], 1);
    avr.write(42);
    avr.write(valve_by_note[note]);
    avr.write(valve_by_note[note]);
  }
  
  void changeNoteTiming(int note, int timing) {
    println("Changing note "+valve_by_note[note]+" timing to "+timing);
    avr.write(42);
    avr.write(valve_by_note[note]+49);
    avr.write(timing);
  }

  void changeNoteDelay(int note, int _delay) {
    println("Changing note "+valve_by_note[note]+" delay to "+_delay);
    avr.write(42);
    avr.write(valve_by_note[note]+100);
    avr.write(_delay);
  }

  // Special test-only command to fire all valves simultaneously
  void playAllNotes() {
    println("Playing all notes");
    avr.write(42);
    avr.write(43);
    avr.write(44);
  }
  
  void printInputText() {
    fill(64);
    rect(x, y+h-25, w, 25);
    fill(255, 192, 64);
    text(input.toString(), x+10, y+h-10);
  }

  void printText(String[] lines, int line_spacing) {
    pushMatrix();
    translate(x, y+10);
    for(int i=0; i<lines.length; i++) {
      translate(0, line_spacing);
      switch(output_source[i]) {
        case 0:  // Error
          fill(255, 32, 32);
          break;
        case 2:  // From serial
          fill(196, 196, 0);
          break;
        case 1:  // From text input
        default:
          fill(255);
        }
      text(lines[i], 10, 0);
      }
    popMatrix();
  }

  // Prints a line onto the console panel
  // input_type 0 - error
  //            1 - console/user
  //            2 - serial input 
  void printLine(String input_line, int input_type) {
      for(int i=0; i<output.length-1; i++) {
          output[i] = output[i+1];
          output_source[i] = output_source[i+1]; }
      output_source[output.length-1] = input_type;
      output[output.length-1] = input_line;
  }
  
  void stop() {
    avr.stop(); }
}
