
void musicGenerator()
{
  int lag = millis() - next_period;

  if(coherence.isTimeToStep())
    coherence.stepCoherence();

  if(millis() > next_period) {
    // Check if there are processing lag (too much delay in processing next note)
    if(debug_button.on) println("Lag: "+lag+"    Total: "+(millis()/60000)+" minutes");

    // Check quota, before adjusting coherence to get the last period's coherence
    checkQuota(lag);
    
    if(random(100) > 70 + 40*coherence.getValue()) {  // Up to 40% chance of skipping a note
      if(debug_button.on) println("Skipping period");
      next_period = millis()+int(last_delay*(1-0.8*coherence.getValue()));
      }
    else {
      // Algorithm that determines next note to play
      // depending on coherence, it may try to choose a note that's more dominant
      //    i.e. 0, 3, 5
      
      // First we need to update the acceptable note distance
      domain.updateAcceptableDistance();
      
      if(music_hint.isActive()) {    // If there's a music_hint, use that
        int chosen_one = music_hint.getNote();  // Get the first note
        if(isInNoteRange(chosen_one)) {
          the_notes[chosen_one].playIt();
          last_chosen_one = chosen_one; }
        boolean next_note_is_concurrent = music_hint.nextNoteIsConcurrent();
        if(next_note_is_concurrent)
          music_hint.getTiming();      // Step to next note
        while(music_hint.isActive() && next_note_is_concurrent) {  // Then if there are concurrent notes, play them
          chosen_one = music_hint.getNote();
          if(isInNoteRange(chosen_one)) {
            the_notes[chosen_one].playIt();
            next_note_is_concurrent = music_hint.nextNoteIsConcurrent();  // See if next note is concurrent
            music_hint.getTiming();    // Then step to the next note
            } }
        }
      else {  // Regular 
        int chosen_one = noteGenerator();
        if(chosen_one >= 0) {
          the_notes[chosen_one].playIt();
          if(random(100)*sq(coherence.getValue()) > 40) {   // possible harmonies when c > 0.9
            int harmony_note = domain.getChordNote(chosen_one);
            if(harmony_note != -1 && abs(chosen_one-harmony_note)<13)
              the_notes[harmony_note].playIt(); }
          last_chosen_one = chosen_one; }
        }
     
    // Readjust weights, figure out min and max
    int current_min = 10000;
    for(int i=0; i<number_of_notes; i++)
      if(the_notes[i].play_count > drops_max)
        drops_max = the_notes[i].play_count;
      else if(the_notes[i].play_count < current_min)
        current_min = the_notes[i].play_count;
    drops_min = current_min;
      
    // Algorithm for changing scale
    if(true && random(1000)>990) {
      domain.shiftMajorMinor(); }
      
    // Randomly activate music and rhythm hint
    if(!music_hint.isActive() && !rhythm_hint.isActive() && random(1000)>990) {
      float r = random(0, 1);
      if(r > 0.6) {
        coherence.coherence = 1;
        rhythm_hint.activate(); }
      else
        coherence.coherence = 1;
        music_hint.activate(); }

    // adjust the period: The nominal period varies based on coherence
    // faster when music-like, slower when noise-like
    int adjusted_period = int(NATURAL_PERIOD+800*(1-coherence.getValue()));

    // Timing of next droplet... dependent on coherence
    // First get a random number from a uniform distribution
    float deviation = random(-1, 1);

    // Change the uniform distribution to one that favours the ends at -1 and 1
    deviation = deviation + (1-coherence.getValue())*( sqrt(abs(deviation))*deviation/abs(deviation) - deviation);
    if(deviation < 0)  // Negative deviation, multiply by coherenec to also get the range to compact
      deviation *= (1-coherence.getValue())*MAX_NEG_PERIOD_DEVIATION;
    else
      deviation *= (1-coherence.getValue())*MAX_POS_PERIOD_DEVIATION;
      
    // Now add the deviation to the natural period to form the final deviation
    int new_delay = int(adjusted_period + deviation);
    
    // But above all, if there is a rhythm_hint or music_hint, use that
    if(music_hint.isActive()) {  // music_hint first
      int rhythmic_delay = music_hint.getTiming();
      new_delay = new_delay+int((rhythmic_delay-new_delay)*sqrt(coherence.getValue()));
      println("new delay: "+new_delay+", "+rhythmic_delay+", "+sqrt(coherence.getValue()));
      }
    else if(rhythm_hint.isActive()) {  // rhythm_hint next
      int rhythmic_delay = rhythm_hint.imposeTiming();
      new_delay = new_delay+int((rhythmic_delay-new_delay)*sqrt(coherence.getValue()));
      }
    else if(new_delay > 100 && random(0,1) > 0.9) { // Occasionally make a half-period note
      new_delay = new_delay/2; }
    else {
      }

    // For low coherence mode, do not allow the next period to be too similar to the last period (rhythm may be perceived)
//    if(abs(next_period - last_period)*sq(1-coherence.getValue()) < MAX_POS_PERIOD_DEVIATION+MAX_NEG_PERIOD_DEVIATION) {
      // not working yet
 //     }

     // Now we add the new delay to current time
     next_period = millis()+new_delay;
    }
    
    last_delay = next_period-millis();
//    println(" waiting "+(next_period-millis())+"ms under "+coherence+" coherence");
  }
}

int noteGenerator()
{
  int number_of_worthy_ones = 0;

  // Start with a uniform distribution r
  // float r = random(0, 1);
//  float r1 = random(0,1);
//  float r2 = random(0,1);
  // float r3 = random(-0.5, 0.5);
      
      // Apply distribution-altering function
//      r1 = r1*r1*(1-coherence.getValue());
//      r2 = r2*(1-coherence.getValue());
    // Change the uniform distribution to one that favours the ends at 0 and 1
  //  r3 = (1-coherence.getValue())    0.5+sqrt(abs(r3))*r3/abs(r3);
      
//      ArrayList worthy_ones = new ArrayList();  // To store notes that we allow to play this time round
      for(int i=0; i<number_of_notes; i++) {
        float p = 0;
        if(domain.acceptableDistance(last_chosen_one, i)) { // Fundamental
          p = 1;
          if(domain.contains(i))
            p *= constrain(0.5+0.6*sin(coherence.getValue()*PI/2), 0, 1);  // Smooth variation from 0 to 1, but a plateau towards full coherence
          else
            p *= constrain(0.45-0.55*sin(coherence.getValue()*PI/2), 0, 1);
            
          if(domain.allowTransition(last_chosen_one, i))
            p *= 4*sq(coherence.getValue()-0.5);
          else 
            p *= 1-4*sq(coherence.getValue()-0.5);
          }
        if(p > random(1) || (last_round_no_worthy && ((coherence.getValue() > 0.5 && domain.contains(i)) || (coherence.getValue() < 0.5 && !domain.contains(i))))) {// Use probability to determine if this note is worthy
          the_notes[i].worthy = true;
          worthy_ones[number_of_worthy_ones++] = i; }
        else
          the_notes[i].worthy = false;
        }
        // Of coherence is less than 0.5, start creeping in some non-scale notes
//        if((domain.contains(i) && coherence.getValue() < 0.3) || r2 > 0.5) {
//          if(the_notes[i].isReady())      // Mandatory because valve has to recover first
//            if(domain.allowTransition(last_chosen_one, i) || random(0, 1) > 4*sq(coherence.getValue()-0.5)) // Use defined transiations only in really noise-like or really music-like states
//              if(domain.acceptableDistance(last_chosen_one, i))
//                worthy_ones[number_of_worthy_ones++] = i; }
            

  if(false) {
      print("Worhty Ones: ");
      for(int i=0; i<number_of_worthy_ones; i++ )
        print(worthy_ones[i]+", "); }

      // Occasionally there are no worthy ones
 //   if(worthy_ones.size() == 0) {
 //       println("No worthy ones");
 //       return -1;    // Tell the musicGenerator function that no worthy ones can be found
 //       }
    if(number_of_worthy_ones == 0) {
      println("No worthy ones");
      last_round_no_worthy = true;    // Keep track of this, and force the next round to have worthy ones
      return -1;    // Tell the musicGenerator function that no worthy ones can be found
      }

  last_round_no_worthy = false;

  // Choose one note from the worthy ones
  int chosen_one = worthy_ones[int(random(0, number_of_worthy_ones))];
//      print("Chosen note: "+chosen_one+"\n");
  return chosen_one;
}

void calibrateValves()
{
  if(millis() > next_calibration_time) {
    the_notes[calibrating_note[calibration_state]].playIt();
    calibration_state = 1-calibration_state;
    next_calibration_time = millis() + CALIBRATION_PERIOD;
    }
}

void emptyTanks()
{
  if(millis() > next_calibration_time) {
    the_notes[empty_tank_sequence[empty_tank_state]].playIt();
    if(++empty_tank_state >= empty_tank_sequence.length)
      empty_tank_state = 0;
    next_calibration_time = millis() + 80;
    }
}

void checkQuota(int lag)
{
  if(millis() > next_quota_check) {
    next_quota_check = millis() + QUOTA_PERIOD;
    music_count = 0;
    noise_count = 0;
    }
  // If coherence is greater than 0.8 it counts as music
  if(coherence.getValue() > 0.8) {
    music_count += lag;
    if(music_count > music_quota)
      music_count = music_quota;
    if(debug_button.on) println("Music Count at "+music_count);
    }
  else if(coherence.getValue() < 0.2) {
    noise_count += lag;
    if(noise_count > noise_quota)
      noise_count = noise_quota;
    if(debug_button.on) println("Noise Count at "+noise_count);
    }
     
}
