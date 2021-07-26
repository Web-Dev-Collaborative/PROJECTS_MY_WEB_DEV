//////////////////////////////
// Note class
//  handles each note, retaining an id, a count, and its actuation
class Note {
  float x, y, x_size, y_size;
  int duration, id;
  boolean on;  // Whether sound is currently on or not
  Sample sound;   // The sound file
  int current_period;
  int note_separation; // periods between drop, changes dynamically, in units of quavers
  int state; // state stores whether the note's valve is ready for another
             //   0 - ready for new sequence
             //   n - play note, but decrement by 1
  int last_played, next_play;
  int refractory_period = 300; // How many milliseconds does it take the valve to recover
  float weight; // A 0 to 1 variable dependent on whether this is the most used or least used note
  
  boolean worthy;  // Stores whether this note is currently a worthy note

  float period;  // Period of the current note
  float phase;  // Phase of current note, ranges from -1 to 1
  float adjusted_period, adjusted_phase;

  // Valve-timing variables
  int current_mark;  // which mark are we currently at (levels of the reservoir)
  int timing;    // AVR timing of the valve
  int valve_delay;  // AVR delayed triggering of valve

  int play_count;  // Counts the number of times the droplet has been played
  int play_limit;  // How many drops can be played before the limit of the bottom reservoir is reached

  Note(int _id, float _x, float _y, float _x_size, float _y_size, String _file_name) { // Simple constructor, used in generators 1,2,3,4
    id = _id;    // ID of the note
    x = _x;
    y = _y;
    x_size = _x_size;
    y_size = _y_size;
    on = false;
    period = NATURAL_PERIOD;    // Default to the natural period
    phase = 0;
    note_separation = 0;
    current_period = 0;
    worthy = false;
    state = 0;        // stores how many more drops to be played in this sequence
    last_played = 0;  // millis() of the last time the note was played
    next_play = 0;
    play_count = 0;
    play_limit = valve_timing_marks[valve_timing_marks.length-1];
    current_mark = 0;        // Assume water is at the top
    timing = int(valve_default_timing[0]*valve_scaling[valve_by_note[id]]);    // Take the initial timing
    sendTiming();
    valve_delay = 0;
//    if(fileExists(_file_name)) {
      sound = new Sample(_file_name);
      sound.setPan(random(-1, 1));
      sound.setVolume(random(0.33, 1));
      // }
//    else
//      println(_file_name+" does not exist"); 
      }
    
  void drawIt() {
    turnOffHighlight();
    
    // Draw note block
    noStroke();
    if(on) {         // if note is being played, highlight it red
      stroke(225, 128, 128);
      fill(218,64,64); }
    else if(calibration_button.on && (id==calibrating_note[0] || id==calibrating_note[1])) {      // If note is being calibrated
      stroke(225, 128, 128);
      fill(64,218,64); }
    else if(domain.contains(id)) {
      stroke(64);
      fill(192); }
    else {
      stroke(128);
      fill(224); }
    rect(x, y, x_size, y_size); 
    
    // Draw note status
//    textFont(button_font, 10);
//    fill(32, 32, 230);
//    text(play_count, x, y+y_size+10);
    if(play_count < play_limit) {
      float reservoir_height = y_size*((play_count)/float(valve_timing_marks[valve_timing_marks.length-1]));
      stroke(32, 32, 230, 96);
      fill(32, 32, 230, 48);
      rect(x, y+reservoir_height, x_size, y_size-reservoir_height); }
      
    // Draw worthy_one indicator
    if(worthy) {
      fill(255, 128, 32);
      rect(x, y-3, x_size, 3);
      }
    }
    
  void playIt() {
    if(debug_button.on) println("Playing note "+id);
    // adjust weight
    if(drops_max > drops_min)
      weight = float(play_count-drops_min)/(drops_max - drops_min);

    play_count++;
    
    last_played = millis();
    if(simulation_button.on)
      sound.play();
    else if (play_count < play_limit) {
      avr.playNote(id);
//      play_count++;
      checkTiming();
      }
    on = true; }
    
  void checkTiming() {
    // Now check to see if we have reached a play_count that requires adjusting
    // valve timing
    // If the current mark is the last one, do nothing
    if(current_mark >= valve_timing_marks.length-1) { ; }
    else {
      // Advance the mark if we've reached a certain drop-count;
      if(play_count >= valve_timing_marks[current_mark+1])
        current_mark++;
      if(current_mark >= valve_timing_marks.length-1) {
        timing = int(valve_default_timing[valve_default_timing.length-1]*valve_scaling[valve_by_note[id]]);
        avr.printLine("Changing note "+id+" timing (valve "+valve_by_note[id]+") to final timing "+timing, 1);
        println("Changing note "+id+" timing (played "+play_count+") to final timing "+timing);
        }
      else {
        int timing1 = int(valve_default_timing[current_mark]*valve_scaling[valve_by_note[id]]);
        int timing2 = int(valve_default_timing[current_mark+1]*valve_scaling[valve_by_note[id]]);
        // Only change timing if the timing at next mark is different
        if(timing1 != timing2) {
          int correct_timing = timing1 + (timing2-timing1)*(play_count-valve_timing_marks[current_mark]) / (valve_timing_marks[current_mark+1]-valve_timing_marks[current_mark]);
          if(timing != correct_timing) {
            avr.printLine("Changing note "+id+" timing (valve "+valve_by_note[id]+") from "+timing+" to "+correct_timing, 1);
            println("Changing note "+id+" timing (played "+play_count+") from "+timing+" to "+correct_timing);
            timing = correct_timing;
            sendTiming(); } } } }
      }
  
  void turnOff() {
    on = false;
    if(simulation_button.on)
      sound.stop();
    }
    
  void turnOffHighlight() { // turn off highlight of the note
    if(on && millis() > last_played+300)
      turnOff(); }
  
  boolean isReady() { // A valve can only be activated once every so often
    return (millis() > last_played+MIN_VALVE_DELAY); }
  
  boolean stepState() {
    if(state == 0) {
      return false; }
    else {
      if(--current_period<=0) { // time for another drop
        if(--state>0) {        // If there's still another drop pending
          playIt();
//          next_play = last_played + int(period*(1+phase));
          current_period = note_separation; }
        else {
          note_separation = 0;
          current_period = 0;
          state = 0; } }
      return true; } }
    
  boolean newState(int number_of_drops, int period_length) {    // A new series of state
    if(state != 0) {
      return false; }
    else {
      state = number_of_drops;
      note_separation = period_length;
      current_period = period_length;
      last_played = millis();
      return true; } }
  
  boolean isTimeToPlay() {
//    if(millis() > next_play)
    if((millis()-last_played)+(adjusted_period*adjusted_phase) > adjusted_period)
      return true;
    else if(on && millis() > last_played+300)
      on = false;
    return false;
    }

  boolean clicked(int m_x, int m_y) {
    if(m_x > x && m_x < x+x_size && m_y > y && m_y < y+y_size) {
      if(!on)
        playIt();
      else 
        turnOff(); 
      return true; }
    else
      return false; }
      
  void sendTiming() {
//    avr.changeNoteTiming(id, timing);    // and program it
    }
    
  void setMark(int mark) {
    if(mark >= 0 && mark < valve_timing_marks.length-1)
      play_count = valve_timing_marks[mark];
    }
}
