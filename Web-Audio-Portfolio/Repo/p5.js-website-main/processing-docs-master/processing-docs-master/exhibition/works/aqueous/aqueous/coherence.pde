/////////////////////////////
// Coherence class
// handles the 0 to 1 coherence variable, and its automatic variation

class CoherenceClass {
  float x, y, x_size, y_size;
  float coherence;    // the main variable, goes from 0 to 1
  int HISTORY_SIZE = 30;
  float[] coherence_history;
//  LinkedList coherence_history;    // History, for display purposes
  int mode;          // 0 - Surge mode
                     // 1 - Target mode
  float target;        // a target coherence
  float surge_velocity;    // A velocity variable for surges, always positive
  int surge_state;        // state variable for controlling a slow (but accelerating) decay of the surge
  int COHERENCE_STEP_TIME = 300;  // coherence is stepped at regular intervals
  int next_coherence_step;  
    
  CoherenceClass(float _x, float _y, float _x_size, float _y_size) {
    x = _x;
    y = _y;
    x_size = _x_size;
    y_size = _y_size;
    coherence = 0;
    coherence_history = new float[HISTORY_SIZE];
//    coherence_history = new LinkedList();
    target = 0;
    surge_velocity = 0;
    next_coherence_step = 0;
    mode = 0;
  }
  
  float getValue() {
    return coherence;
    }
  
  boolean isTimeToStep() {
    return (millis()>next_coherence_step);
    }

  void stepCoherence() {
    // First, store the last coherence value in the history list
//    coherence_history.addFirst(new Float(coherence));
//    if(coherence_history.size() > HISTORY_SIZE)
//      coherence_history.removeLast();
    for(int i=HISTORY_SIZE-1; i>0; i--)
      coherence_history[i] = coherence_history[i-1];
    coherence_history[0] = coherence;
      
    // Then mess with the coherence
    if(mode == 0) {  // SURGE MODE - the one to use
      int time_left = next_quota_check - millis(); // Time left in the quota period
      if(time_left == 0) time_left = 1;    // No divide by zeros please
      if(music_hint.isActive() || rhythm_hint.isActive())
        // If music or rhythm hints are active, decay very slowly
        coherence += 0.05;
      else {  // Surges are possible if no hints are playing
/*        if(random(1)>(0.91+0.08*coherence - 0.4*(music_quota-music_count)/time_left)) { // Probability of a surge depends on coherence value
          surge_velocity = random(0.4, 0.8);
          surge_state = 8;    // Give it a 12-stage decay
          }
        else if (random(1)>(1.00-0.07*coherence - 0.4*(noise_quota-noise_count)/time_left)) {  // Higher chance of downward surge when coherence is high
          surge_velocity = random(-0.4, -0.8);
          } */
        if(random(1)>(0.91+0.08*coherence)) { // Probability of a surge depends on coherence value
          surge_velocity = random(0.4, 1.0);
          surge_state = 8;    // Give it a 12-stage decay
          }
        else if (random(1)>(1.00-0.09*coherence)) {  // Higher chance of downward surge when coherence is high
          surge_velocity = random(-0.4, -0.8);
          } }
        
      surge_velocity -= surge_velocity/2;
      if(surge_velocity > 1)
        surge_velocity = 1;

        // coherence decreases exponentially except when a surge is happening
        // in which case the decay is much slower
        coherence += surge_velocity - (coherence+(1-coherence)*0.3)/(6 + 50*surge_velocity + 10*surge_state*surge_state);
      if(surge_state > 1)
        surge_state--;
      }
    else if(mode == 1) {
      if(random(1000)>900) {
        target = random(0,1); }
      coherence = coherence + (target-coherence)/3; }
    enforceBounds();    // Make sure coherence is between 0 and 1;
    next_coherence_step = millis()+COHERENCE_STEP_TIME;
    }
  
  void switchMode(int new_mode) {
    if(new_mode < 2)
      mode = new_mode;
    }
    
  void enforceBounds() {
    if(coherence > 1)
      coherence = 1;
    else if(coherence < 0)
      coherence = 0;
    }
  
  void increase(float x) {
      coherence += x;
      if(coherence > 1)
        coherence = 1;
    }
  
  void decrease(float x) {
      coherence -= 0.05;
      if(coherence < 0)
        coherence = 0;
    }
  
  void surgeUp() {
    surge_velocity += 0.5;
    surge_state += 8;
    }
  
  void surgeDown() {
    surge_velocity -= random(0.4, 0.8);
    }

  // UNUSED - displays coherence as a horizontal bar
  void displayCoherence() {
    fill(196);
    rect(x+20, y+y_size/2-3, x_size-40, 6);
    fill(255, 96, 32);
    ellipseMode(CENTER);
    ellipse(x+ 20 + coherence*(x_size-40), y + y_size/2, 10, 10);
  }
  
  void display() {
    noStroke();
    fill(196);
    rect(x+18, y+10, 4, y_size-20);
    fill(255, 96, 32);
    ellipseMode(CENTER);
    ellipse(x+20, y+10 +(1-coherence)*(y_size-20), 5, 5);
    
    float bar_width = ((x_size-40)/HISTORY_SIZE - 1);
    pushMatrix();
    translate(x+20+bar_width+1, y+10);
    for(int i=0; i<HISTORY_SIZE; i++) {
      fill(255, 96, 32, (HISTORY_SIZE-i)*255/HISTORY_SIZE);
//      float bar_y_size = ((Float) coherence_history.get(i)).floatValue()*(y_size-20);
      float bar_y_size = coherence_history[i]*(y_size-20);
      float bar_y = (y_size-20)-bar_y_size;
      rect(0, bar_y, bar_width, bar_y_size);
      translate(bar_width+1, 0);
      }
    popMatrix();
  }
}
