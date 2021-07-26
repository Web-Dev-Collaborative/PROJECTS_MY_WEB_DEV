// Aqueous
//   version 1
//     06 2005
// Zai

//  TO IMPLEMENT
//  play-count saving and loading (XML?)
//  using note weight during noise mode to even out tanks

import pitaru.sonia_v2_9.*;

import processing.opengl.*;
import processing.serial.*;

Note[] the_notes;
float notes_box_x, notes_box_y, notes_box_size_x, notes_box_size_y;

NotesDomain domain;
int current_time, last_delay, next_period, period;
int NATURAL_PHASE = 0;
int NATURAL_PERIOD = 250;
int MAX_NEG_PERIOD_DEVIATION = -0;
int MAX_POS_PERIOD_DEVIATION = 3000;
int MIN_VALVE_DELAY = 500;
int number_of_notes = 25;    // 25 notes total
int note_to_play; // index of the current note being played
int[] worthy_ones = new int[number_of_notes];    // Store list of notes that are in the chord
boolean last_round_no_worthy = true;

// Coherence
// ranges from 0 to 1
// affects the note sequences that are generated, 0 being noise-like, 1 being music-like
CoherenceClass coherence;
int last_chosen_one;

// Weights
// keeps track of least-used and most-used notes and constructs a probability weight based on that
int drops_total, drops_min, drops_max;

// Quotas
// checks that within a certain period (5 minutes),
// there will be at least certain amount of pattern and certain amount of silence
int QUOTA_PERIOD = 180000;  // 3 minutes
int next_quota_check;
float music_quota = 30000;
float music_count; // Expressed in number of notes per minute
float noise_quota = 120000;
float noise_count;

// Hints
RhythmHint rhythm_hint;
MusicHint music_hint;

// Buttons
//
Button simulation_button, surge_button, noise_button, start_button, 
       rhythm_hint_button, music_hint_button, draw_button, debug_button;
PFont button_font;

// Valve Actuation Stuff
AVRComm avr;

// Variables for calibration mode
Button calibration_button;
int next_calibration_time;
int CALIBRATION_PERIOD = 800;
int calibration_state = 0;    // either 1 or 0, identifies which valve to pulse next
int calibration_note_to_change = 0;    // Stores which calibration note should be changed next
int calibrating_note[] = {0, 1};

// For Tank Emptying mode
// basically this steps through a pre-defined sequence
Button empty_tank_button;
int empty_tank_state = 0;
int empty_tank_sequence[] = {0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24};

void setup()
{
  Sonia.start(this);
  size(800, 400, P3D);
  avr = new AVRComm(this, 480, 0, width-480, height);
  
  String file_names[] = {"C2.wav", "C+2.wav",
                      "D2.wav", "D+2.wav",
                      "E2.wav", "F2.wav",
                      "F+2.wav", "G2.wav",
                      "G+2.wav", "A2.wav",
                      "A+2.wav", "B2.wav",
                      "C3.wav", "C+3.wav",
                      "D3.wav", "D+3.wav",
                      "E3.wav", "F3.wav",
                      "F+3.wav", "G3.wav",
                      "G+3.wav", "A3.wav",
                      "A+3.wav", "B3.wav", "C4.wav"};

  the_notes = new Note[number_of_notes];
  notes_box_x = notes_box_y = 0;
  notes_box_size_x = 480;
  notes_box_size_y = 100;
  float note_width = (notes_box_size_x-30)/number_of_notes;  // This is actually note width plus spacing
  float note_spacing = note_width*0.2;
  note_width *= 0.8;
  float padding = (notes_box_size_x-number_of_notes*(note_width+note_spacing))/2;

  for(int i=0; i<number_of_notes; i++) {
    the_notes[i] = new Note(i, notes_box_x+padding+i*(note_width+note_spacing), notes_box_y+20, notes_box_x+note_width, notes_box_y+60, file_names[i]); }
  coherence = new CoherenceClass(0, 100, 480, 80);    // Set coherence
    
  domain = new NotesDomain(number_of_notes);
  next_period = 0;
  last_delay = 0;
  period = NATURAL_PERIOD; // Fixed period for musicGenerators 1,2,3
  last_chosen_one = 0;
  drops_total = 0;
  drops_min = 0;
  drops_max = 0;
  rhythm_hint = new RhythmHint();
  music_hint = new MusicHint();
  
  button_font = loadFont("GillSans-Bold.vlw.gz");
  start_button = new Button(20, height-30, 120, 18, "Stopped", "Running");
  simulation_button = new Button(160, height-30, 120, 18, "Simulation Mode Off", "Simulation Mode On");
  surge_button = new Button(20, 200, 120, 18, "A Surge Of Pattern");
  noise_button = new Button(20, 230, 120, 18, "A Calming Of Noise");
  rhythm_hint_button = new Button(160, 200, 140, 18, "A Rhythmic Intervention");
  music_hint_button = new Button(160, 230, 140, 18, "A Musical Intervention");
  calibration_button = new Button(300, height-30, 120, 18, "Calibration Mode Off", "Calibration Mode On");
  draw_button = new Button(20, height-60, 120, 18, "Graphics Disabled", "Graphics Enabled");
  debug_button = new Button(20, height-90, 120, 18, "Console Output Off", "Console Output On");
  empty_tank_button = new Button(300, height-60, 120, 18, "Start Emptying", "Stop Emptying");
  next_calibration_time = 0;

  last_round_no_worthy = true;
  draw_button.on = true;
  debug_button.on = false;
  start_button.on = true;
  simulation_button.on = true;
  empty_tank_button.on = false;
  
  music_count = 0;
  noise_count = 0;
}

void draw()
{
  background(255);

  avr.process();

  // If start is on (the default), generate the music
  if(calibration_button.on)
    calibrateValves();      // do Calibration
  else if(empty_tank_button.on)
    emptyTanks();
  else if(start_button.on) {
    musicGenerator(); }
    
  // Draw stuff
  if(draw_button.on) {
    // Draw background around notes
    noStroke();
    fill(245);
    rect(notes_box_x, notes_box_y, notes_box_size_x, notes_box_size_y);  
    for(int i=0; i<the_notes.length; i++)
      the_notes[i].drawIt();
    coherence.display();
    avr.draw(); }
    
  textFont(button_font, 11);
  fill(255, 0, 0);
  if(music_hint.isActive())
    text("Musical Hint "+music_hint.chosen_sequence+" Active", 310, 240);
  else if(rhythm_hint.isActive())
    text("Rhythm Hint "+rhythm_hint.chosen_sequence+" Active", 310, 210);  
  
  // Draw buttons
  simulation_button.draw();
  surge_button.draw();
  noise_button.draw();
  start_button.draw();
  rhythm_hint_button.draw();
  music_hint_button.draw();
  calibration_button.draw();
  debug_button.draw();
  empty_tank_button.draw();
  draw_button.draw();
}

void mousePressed()
{
  for(int i=0; i<number_of_notes; i++) {
    if(the_notes[i].clicked(mouseX, mouseY))
      return; }
  if(simulation_button.isMouseOver(mouseX, mouseY)) {
    simulation_button.toggle(); }
  else if(calibration_button.isMouseOver(mouseX, mouseY)) {
    calibration_button.toggle();
    if(calibration_button.on)
      empty_tank_button.turnOff(); }
  else if(empty_tank_button.isMouseOver(mouseX, mouseY)) {
    empty_tank_button.toggle();
    if(empty_tank_button.on)
      calibration_button.turnOff(); }
  else if(surge_button.isMouseOver(mouseX, mouseY)) {
    coherence.surgeUp();
    surge_button.push(); }
  else if(noise_button.isMouseOver(mouseX, mouseY)) {
    coherence.surgeDown();
    noise_button.push(); }
  else if(rhythm_hint_button.isMouseOver(mouseX, mouseY)) {
    // Rhythm hint activation
    coherence.coherence = 0.9;
    coherence.surgeUp();
    rhythm_hint.activate();
    rhythm_hint_button.push(); }
  else if(music_hint_button.isMouseOver(mouseX, mouseY)) {
    // Music hint activation
    coherence.coherence = 0.9;
    coherence.surgeUp();
    music_hint.activate();    
    music_hint_button.push(); }
  else if(debug_button.isMouseOver(mouseX, mouseY)) {
    debug_button.toggle(); }
  else if(draw_button.isMouseOver(mouseX, mouseY)) {
    draw_button.toggle(); }
  else if(start_button.isMouseOver(mouseX, mouseY)) {
    start_button.toggle(); }
}

void keyPressed()
{
   avr.keyPressed(key);
}

boolean isInNoteRange(int note)
{
  return (note >= 0 && note < number_of_notes);
}


////////////////////////////////
// button
//
// mostly just define an area for clicking, function for whether its over or not
class Button {
  float x, y, x_size, y_size;
  boolean on, momentary;
  String off_text, on_text;
  
  Button(float _x, float _y, float _x_size, float _y_size, String _off_text) {
    x = _x;
    y = _y;
    x_size = _x_size;
    y_size = _y_size;
    off_text = _off_text;
    on_text = _off_text;
  }

  Button(float _x, float _y, float _x_size, float _y_size, String _off_text, String _on_text) {
    x = _x;
    y = _y;
    x_size = _x_size;
    y_size = _y_size;
    off_text = _off_text;
    on_text = _on_text;
  }
  
  void draw() {
    textFont(button_font, 10);
    if(on) {
      stroke(64);
      fill(128);
      rect(x, y, x_size, y_size);
      fill(255);
      text(on_text, x+10, y+y_size/2+3); 
      }
    else {
      stroke(64);
      fill(230); 
      rect(x, y, x_size, y_size);
      fill(0);
      text(off_text, x+10, y+y_size/2+3); 
      }
    if(momentary && isMouseOver(mouseX, mouseY)) {
      on = false;
      momentary = false;
      }
  }
  
  void push() {
    on = true;
    momentary = true;
    }
  
  void turnOn() {
    on = true;
    }
  
  void turnOff() {
    on = false;
    }
  
  boolean toggle() {
    on = !on;
    return on;
    }
  
  boolean isMouseOver(int m_x, int m_y) {
    if(m_x > x && m_x < x+x_size && m_y > y && m_y < y+y_size)
      return true;
    else
      return false;
    }
}

public boolean fileExists(String path)
{
  String full_path = path;
  return (new File(full_path)).isFile();
}


public void stop()
{
  Sonia.stop();
  avr.stop();
  super.stop();
}
