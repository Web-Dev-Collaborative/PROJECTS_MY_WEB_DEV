# MihirBegMusicLab

<p>
MihirBegMusicLab is an open source online digital audio workstation (DAW) based on the 
<a href = https://dvcs.w3.org/hg/audio/raw-file/tip/webaudio/specification.html target = "blank">Web Audio API </a>. Try MihirBegMusicLab <a href = http://OpenDaw.azurewebsites.net target = "blank"> here </a>.
</p>




<ul>
  <li>Read/Write .json file for adding and rearranging samples in the workspace as well as seperate projects</li>
  <li><del>Add track functionality</del> <i>completed</i></li>
  <li>Remove track functionality</li>
  <li>Dynamic sample length</li>
  <li>Project save/export functionality</li>
  <li><del>Click and drag samples from directory to workspace</del> <i>completed</i></li>
  <li><del>Track-specific controls such as mute, volume and "solo"</del> <i>completed</i></li>
  <li><del>Record functionality<del> <i>completed</i></li>
  <li><del>Equalization, reverb, compression and other essential effects</del> <i>completed</i></li>
  <li><del>Animated time cursor</del> <i>completed</i></li>
  <li><del>Animated level meter</del> <i>completed</i></li>
  <li>User-uploaded samples</li>
</ul>



<hr>

<p>
So far, various audio clips can be placed on multiple tracks at arbitrary start times according to a 
(currently preprogrammed) .json file. The look-ahead scheduler is accurate enough to seamlessly playback looping samples
in perfect time (even for worst case javascript threading). Samples can be placed at sixteenth note resolution. 
</p>

As much as possible from the following list of features will be implemented by the project deadline:

<ul>
  <li>Read/Write .json file for adding and rearranging samples in the workspace as well as seperate projects</li>
  <li>Add/remove track functionality</li>
  <li>Dynamic sample length</li>
  <li>Project save/export functionality</li>
  <li>Click and drag samples from directory to workspace</li>
  <li>Track-specific controls such as mute, volume and "solo"</li>
  <li>Record functionality</li>
  <li>Equalization, reverb, compression and other essential effects</li>
  <li>Animated time cursor</li>
  <li>Animated level meter</li>
  <li>User-uploaded samples</li>
</ul>

<p>The breakdown of work will be the following:</p>
Adam:
<ul>
  <li>Designing and implementing HTML5 front end and jQuery User Interface</li>
  <li>JSON reading/writing for loading/storing projects</li>
  <li>Designing reverb and chorus audio effects</li>
  <li>Drag and drop from library to project</li>
  <li>Project save functionality</li>
  <li>Record functionality</li>
</ul>



<ul>
  <li>Complete sample scheduling and cursor timing</li>
  <li>Track-specific audio controls</li>
  <li>Global playback audio controls</li>
  <li>Filtering and equalization effects</li>
  <li>Audio file export functionality</li>
  
</ul>

</p>

<p>
Projects that have helped
<a href = https://github.com/katspaugh/wavesurfer.js target="blank"> Wavesurfer.js</a> for generating waveform graphics and
<a href = https://github.com/bgoonz/metronome target="blank">Web Audio Metronome</a> for playback scheduling.
</p>

The technologies we have used so far or are planning to use:

<ul>
  <li>Google's Web Audio API</li>
  <li>Twitter Bootstrap (for HTML5 scaffoling and javascript components)</li>
  <li>jQuery and jQuery UI for frontend programming and UI components</li>
  <li>jsNode backend for writing JSON data</li>
</ul>

<hr>
  <br>
