/////////////////////////////////////
// NotesDomain
//
// Class that regualtes scales, transitions.
class NotesDomain {
  // Generic major and minor scales
  //   0 - not a note in the scale
  //   1 - note in the scale
  //   2 - dominant note
  //   3 - tonic
  //              C, C#,D, D#, E, F, F#, G, G#, A, A#, B
  int[] _major = {3, 0 ,1, 0 , 2, 1, 0 , 2, 0 , 1, 0 , 1};
  int[] _minor = {3, 0 ,1, 2 , 0, 1, 0 , 2, 1 , 0, 0 , 1};
  int[] major, minor, current_domain;
  int num_notes;
  int acceptable_note_distance_min, acceptable_note_distance_max;
  
  // Stores location of the tonic, index, 0-11
  int tonic;

  // State stores whether we're in major or minor (or other things I might use later)
  //   1 - major
  //   2 - minor
  int state;
  
  // Chord hints
  // possible chords for harmony
  int chord_hints[][][] = { { {1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0},  // major tonic
                              {1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0},  // 
                              {0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0} },
                            { {1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0},  // minor tonic
                              {1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0},  // 
                              {0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0} } };

  NotesDomain(int _num_notes) {
    num_notes = _num_notes;
    // Generate a major scale specific to setup defined by number_of_notes
    // Each note is associated with filenames[1:13]
    current_domain = new int[num_notes];
    major = new int[num_notes];
    minor = new int[num_notes];
    for(int i=0; i<num_notes; i++) {
      major[i] = _major[i%12];
      minor[i] = _minor[i%12]; }
    state = 1;
    tonic = 0;
    acceptable_note_distance_min = 0;
    acceptable_note_distance_max = 6;
    current_domain = major; }

  // See if the scale contains a certain note
  boolean contains(int note) {
    if (note >= num_notes || current_domain[note]==0 )
      return false;
    else
      return true; }
  
  // Allow the transition to a potential note based on previous note
  // in coherent mode this prevents going from a non-dominant note to another non-dominant
  // in non-coherence mode it makes notes that do not belong in the scale more prominent
  boolean allowTransition(int previous_note, int candidate) {
    if(coherence.getValue() > 0.5)   // If we're in coherent mode
      switch(current_domain[previous_note]) {
        case 0:  // If last note wasn't even in the scale, do whatever the 
                 // hell you want
          return true;
        case 1:  // If last note was permissible
          if(current_domain[candidate] > current_domain[previous_note])
            return true;  // Only allow note if next note is more dominant
          else
            return false;
        case 2:  // If last note was dominant
        case 3:  // If last note was tonic
          return true;
        default:
          return true;
        }
    else {    // in noise-like mode, 
/*      switch(current_domain[previous_note]) {
        case 0:  // If last note wasn't in the scale, only allow something permisible
          if(current_domain[candidate] > 0) return true;
          else return false;
        case 1:  // If last note was permissible
          return true;
        case 2:  // If last note was dominant
        case 3:  // Or if last note was tonic, do not allow another dominant
          if(current_domain[candidate] > 1) return false;
          else return true;
        default:
          return true; } */
      float r = random(1);
      switch(current_domain[candidate]) {
        case 0:    // 80% chance
          if(r < 0.8) return true;
          else return false;
        case 1:    // 50%
          if(r < 0.33) return true;
          else return false;
        case 2:    // 25%
          if(r < 0.20) return true;
          else return false;
        case 3:    
          return false;
        default:
          return true;
        }
      }
    }
  
  // Limit distance from previous note to next note
  // low coherence -> large allowable distance
  // high coherence -> small allowable distance (
  boolean acceptableDistance(int previous_note, int candidate) {
    int difference = candidate-previous_note;
    if(abs(difference) <= acceptable_note_distance_max && abs(difference) >= acceptable_note_distance_min)
      return true;
    else
      return false;
  }
  
  void updateAcceptableDistance() {
    acceptable_note_distance_min = int(floor(pow(1-coherence.getValue(), 1.5)*number_of_notes/3));
    acceptable_note_distance_max = 6+int(pow(1-coherence.getValue(), 1.5)*(number_of_notes-6));
//    println("Acceptable Distance: "+acceptable_note_distance_min+" to "+acceptable_note_distance_max);
  }
  
  // Shift to major or minor in the same tonic
  void shiftMajorMinor() {
    if (state==1) {  // If we're in major, shift to minor
      for(int i=0; i<num_notes; i++)
         current_domain[i] = _minor[(i+12-tonic)%12];
      state = 2; }
    else if(state==2) { // If we're in minor, shift to major
      for(int i=0; i<num_notes; i++)
         current_domain[i] = _major[(i+12-tonic)%12];
      state = 1; } }
  
  // Shift to relative major or minor
  void shiftToRelative() {
    if (state==1) {  // If we're in major, shift to relative minor
      tonic = (12+tonic-3)%12;   // add 12 incase tonic is less than 3
      for(int i=0; i<num_notes; i++)
         current_domain[i] = _minor[(i+12-tonic)%12];
      state = 2; }
    else if(state==2) { // If we're in minor, shift to relative major
      tonic = (tonic+3)%12;
      for(int i=0; i<num_notes; i++)
         current_domain[i] = _major[(i+12-tonic)%12];
      state = 1; } }
  
  void shiftToDominant() {
    if(state==1) { // if we're in major
      tonic = (tonic+7)%12;
      for(int i=0; i<num_notes; i++)
         current_domain[i] = _major[(i+12-tonic)%12]; }
    else if(state==2) { // if we're in minor
      tonic = (tonic+7)%12;
      for(int i=0; i<num_notes; i++)
         current_domain[i] = _minor[(i+12-tonic)%12]; } }

  void shiftToSubdominant() {
    if(state==1) { // if we're in major
      tonic = (tonic+5)%12;
      for(int i=0; i<num_notes; i++)
         current_domain[i] = _major[(i+12-tonic)%12]; }
    else if(state==2) { // if we're in minor
      tonic = (tonic+5)%12;
      for(int i=0; i<num_notes; i++)
         current_domain[i] = _minor[(i+12-tonic)%12]; } }
     
  // For a given note, find a chord that contains that note
  int getChordIndex(int note) {
    int[] worthy_ones = new int[number_of_notes];    // Store list of chords that contain the note
    int number_of_worthy_ones = 0;
    int index = state-1;
    int note_index = (note+12-tonic)%12;
    for(int i=0; i<chord_hints[index].length; i++) {
      if(chord_hints[index][i][note_index] == 1) {
        worthy_ones[number_of_worthy_ones] = i;
        number_of_worthy_ones++; } }
    if(number_of_worthy_ones == 0)
      return -1;    // error
    else
      return worthy_ones[int(random(0, number_of_worthy_ones))]; }

  // For a given note, find another note that forms a defined chord with it
  int getChordNote(int note) {
    int[] worthy_ones = new int[number_of_notes];    // Store list of notes that are in the chord
    int number_of_worthy_ones = 0;
    int index = state-1;
    int chord_index = getChordIndex(note);
    int note_index = (note+12-tonic)%12;
    if(chord_index >= 0)    // If there is a permissible chord
      for(int i=0; i<number_of_notes; i++) {
        int j = (i+12-tonic)%12;
        // A good note to choose is one that is part of the chord and one that
        // isn't beyond the acceptable distance
        if(chord_hints[index][chord_index][j] == 1 && j!=note_index && acceptableDistance(note, j)) {
          worthy_ones[number_of_worthy_ones++] = i; } }
    if(number_of_worthy_ones == 0)
      return -1;    // error
    else
      return worthy_ones[int(random(0, number_of_worthy_ones))]; }
}
//
/////////////////////////////////
