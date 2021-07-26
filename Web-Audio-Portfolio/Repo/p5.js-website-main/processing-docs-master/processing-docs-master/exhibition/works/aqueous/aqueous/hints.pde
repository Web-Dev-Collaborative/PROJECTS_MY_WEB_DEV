//////////////////////////////
// RhythmHint class
//  on occasion, when the coherence level is high, the single instance of RhythmHint class
//  is activated, and it will impose a rhythm by making the timing conform to the one of the
//  several pre-defined sequences
class RhythmHint
{
  int rhythm_sequences[][] = { {250, 500, 250, 500 },
                        {200, 600, 800 },
                        {200, 200, 400 },
                        {250, 250, 250, 800} };
  boolean active;
  int[] count;
  int chosen_sequence;  // Array index of the chosen sequence
  int repetitions;    // How many remaining times this sequence is to be imposed
  int position;      // Where along a sequence are we
  float speed;      // The sequences can be played faster or slower
  
  RhythmHint() {
    position = 0;
    repetitions = 0;
    speed = 1;
    count = new int[rhythm_sequences.length];
    active = false;
    }
    
  void activate() {  // Activates a random sequence
    chosen_sequence = int(random(0, rhythm_sequences.length));
    count[chosen_sequence]++;
    repetitions = int(random(4, 8));
    position = 0;
    active = true; }
  
  void activate(int _sequence) {  // Activates a random sequence
    chosen_sequence = constrain(_sequence, 0, rhythm_sequences.length-1);
    count[chosen_sequence]++;
    repetitions = int(random(4, 8));
    position = 0;
    active = true; }
    
  // Returns the next timing period required by the sequence
  int imposeTiming() {
    int timing = int(speed * rhythm_sequences[chosen_sequence][position]);
    if(++position >= rhythm_sequences[chosen_sequence].length) {
      position = 0;
      if(--repetitions <= 0) {
        coherence.surgeDown();
        active = false; } }
    return timing; }

  boolean isActive() {
    return active; }

}


//////////////////////////////
// MusicHint class
//  on occasion, when the coherence level is high, the single instance of RhythmHint class
//  is activated, and it will impose a certain melody
//  sometimes it is a generated melody (by storing the first run of the sequence
//  sometimes it will be a familiar tune
class MusicHint extends RhythmHint
{
  // Each music sequence contains one array of notes and one array of its timing
  int music_sequences[][][] = {
              // Pink Panther
            { {11,  12,  14,  15,  17,  18 },
              {200, 400, 200, 800, 200, 3000 } },
              // Broken Chord Sequence 1
            { {0,  12,  4,  12,  7,  12 },
              {400, 400, 400, 400, 400, 3000 } },
              // Broken Chord Sequence 2
            { {12,  16,  12,  17,  12,  19 },
              {400, 400, 400, 400, 400, 3000 } },
              // The Major Chord
            { {12,  16,  19,  24 },
              {0,  0,  0,  3000 } },
              // The Minor Chord
            { {12,  15,  19,  24 },
              {0,  0,  0,  3000 } },
              // a Chord
            { {14,  17,  23 },
              {0,  0,  3000 } },
               // Line 1
            { {19,  26,  3,  9},
              {200, 200, 200, 3000 } },
               // Line 2
            { {24,  5,  15,  11,  6, 16},
              {200, 200, 200, 200, 200, 3000 } },
               // Line 3
            { {23,  22,  3,   14,  12,  7,   21},
              {200, 200, 200, 200, 200, 200, 3000 } },
               // Left and Right
            { {13,  13,  13,  10,  10,  10, 13,  13,  13 },
              {200, 200, 800, 200, 200, 800, 200, 200, 3000 } },
              // Top Right and Bottom Left
            { {22,  22,  22,   20,  20,   20,  22,  22,  22 },
              {200, 200, 800, 200, 200, 800, 200, 200, 3000 } },
              // Top Left and Bottom Right
            { {10,  10,  10,  8,  8,  8, 10, 10, 10, 8,  8,  8 },
              {300, 300, 300, 300, 300, 300, 300, 300, 300, 300, 300, 3000 } },
             // Circle around
            { {10,  24,  21,  7,   20,  18,  9,   8,   13,  23,  4,   19,  17 },
              {200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 5000} }
                            };
  int[] music_store;      // Stores a music sequence
  int mode;    // 0 - dynamic sequence
               // 1 - familiar sequence
  boolean first_time;    // Used by mode 0
  int[] count;
  int NOTES = 0;
  int RHYTHM = 1;
    
  MusicHint() {
    position = 0;
    repetitions = 0;
    speed = 1;
    count = new int[music_sequences.length];
    music_store = new int[16];
    active = false;
    }
    
  void activate() {  // Activates a random sequence
    if(random(0, 100) > 30) {
      mode = 1;
      chosen_sequence = int(random(0, music_sequences.length));
      count[chosen_sequence]++;
      repetitions = int(random(1, 2));   // Just play it once, otherwise its crap
      position = 0; }
    else {
      mode = 0;
      first_time = true;
      chosen_sequence = int(random(0, rhythm_sequences.length));
      repetitions = int(random(2, 5));
      position = 0; }
    active = true; }
    
  void activate(int _mode) {
    if(_mode == 1) {
      mode = 1;
      chosen_sequence = int(random(0, music_sequences.length));
      repetitions = 1;   // Just play it once, otherwise its crap
      position = 0; }
    else {
      mode = 0;
      first_time = true;
      chosen_sequence = int(random(0, rhythm_sequences.length));
      repetitions = int(random(2, 6));
      position = 0; }
    active = true; }
    
  void activate(int _mode, int _sequence) {
    if(_mode == 1) {
      mode = 1;
      chosen_sequence = constrain(_sequence, 0, music_sequences.length-1);
      repetitions = 1;   // Just play it once, otherwise its crap
      position = 0; }
    else {
      mode = 0;
      first_time = true;
      chosen_sequence = constrain(_sequence, 0, rhythm_sequences.length-1);
      repetitions = int(random(2, 6));
      position = 0; }
    active = true; }
    
  // Whether or not the next note is zero-length, which means to play the next note at the same time
  boolean nextNoteIsConcurrent() {
    if(mode==0 && rhythm_sequences[chosen_sequence][position] == 0 )
        return true;
    else if(music_sequences[chosen_sequence][RHYTHM][position] == 0)
        return true;
    else
        return false; }
  
  // Returns the next timing period required by the sequence
  // getting timing also advances the position in the sequence,
  // so call this AFTER getting the note
  int getTiming() {
    if(mode == 0) {
//      return imposeTiming(); }    // if mode 0, just use the parent class' timing model
      int timing = int(speed * rhythm_sequences[chosen_sequence][position]);
      if(++position >= rhythm_sequences[chosen_sequence].length) {
        position = 0;
        if(first_time)
          first_time = false;
        if(--repetitions <= 0) {
          coherence.surgeDown();
          active = false; } }
      return timing; }
    else {
      int timing = int(speed * music_sequences[chosen_sequence][RHYTHM][position]);
      if(++position >= music_sequences[chosen_sequence][RHYTHM].length) {
        position = 0;
        repetitions = 0;
        coherence.coherence = 0;    // For music sequence, force coherence to be zero afterwards
//        coherence.surgeDown();
        active = false; }
      return timing; } }
  
  // Returns the note to be played in the sequence
  int getNote() {
    if(mode == 0) {
      if(first_time) {
        // Get new note
        int new_note = noteGenerator();
        music_store[position] = new_note;
        return music_store[position];
        }
      else {
        return music_store[position];
        }
      }
    else {
      return music_sequences[chosen_sequence][NOTES][position];
      }
    }
}
