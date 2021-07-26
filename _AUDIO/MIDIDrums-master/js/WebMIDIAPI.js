/* Copyright 2013 Chris Wilson

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

// Initialize the MIDI library.
(function (global) {
  "use strict";
  var midiIO,
    _requestMIDIAccess,
    _getMIDIAccess,
    MIDIAccess,
    _onReady,
    MIDIPort,
    MIDIInput,
    MIDIOutput,
    _midiProc;

  //init: create plugin
  if (!window.navigator.requestMIDIAccess) {
    window.navigator.requestMIDIAccess = _requestMIDIAccess;
    if (!window.navigator.getMIDIAccess)
      window.navigator.getMIDIAccess = _getMIDIAccess;
  }

  function Promise() {}

  Promise.prototype.then = function (accept, reject) {
    this.accept = accept;
    this.reject = reject;
  };

  Promise.prototype.succeed = function (access) {
    if (this.accept) this.accept(access);
  };

  Promise.prototype.fail = function (error) {
    if (this.reject) this.reject(error);
  };

  function _JazzInstance() {
    this.inputInUse = false;
    this.outputInUse = false;

    // load the Jazz plugin
    var o1 = document.createElement("object");
    o1.id = "_Jazz" + Math.random() + "ie";
    o1.classid = "CLSID:1ACE1618-1C7D-4561-AEE1-34842AA85E90";

    this.activeX = o1;

    var o2 = document.createElement("object");
    o2.id = "_Jazz" + Math.random();
    o2.type = "audio/x-jazz";
    o1.appendChild(o2);

    this.objRef = o2;

    var e = document.createElement("p");
    e.appendChild(document.createTextNode("This page requires the "));

    var a = document.createElement("a");
    a.appendChild(document.createTextNode("Jazz plugin"));
    a.href = "http://jazz-soft.net/";

    e.appendChild(a);
    e.appendChild(document.createTextNode("."));
    o2.appendChild(e);

    var insertionPoint = document.getElementById("MIDIPlugin");
    if (!insertionPoint) {
      // Create hidden element
      var insertionPoint = document.createElement("div");
      insertionPoint.id = "MIDIPlugin";
      insertionPoint.style.position = "absolute";
      insertionPoint.style.visibility = "hidden";
      insertionPoint.style.left = "-9999px";
      insertionPoint.style.top = "-9999px";
      document.body.appendChild(insertionPoint);
    }
    insertionPoint.appendChild(o1);

    if (this.objRef.isJazz) this._Jazz = this.objRef;
    else if (this.activeX.isJazz) this._Jazz = this.activeX;
    else this._Jazz = null;
    if (this._Jazz) {
      this._Jazz._jazzTimeZero = this._Jazz.Time();
      this._Jazz._perfTimeZero = window.performance.now();
    }
  }

  function _requestMIDIAccess() {
    var access = new MIDIAccess();
    return access._promise;
  }

  // API Methods

  function MIDIAccess() {
    this._jazzInstances = new Array();
    this._jazzInstances.push(new _JazzInstance());
    this._promise = new Promise();

    if (this._jazzInstances[0]._Jazz) {
      this._Jazz = this._jazzInstances[0]._Jazz;
      window.setTimeout(_onReady.bind(this), 3);
    } else {
      window.setTimeout(_onNotReady.bind(this), 3);
    }
  }

  function _onReady() {
    if (this._promise) this._promise.succeed(this);
  }

  function _onNotReady() {
    if (this._promise) this._promise.fail({ code: 1 });
  }

  MIDIAccess.prototype.inputs = function () {
    if (!this._Jazz) return null;
    var list = this._Jazz.MidiInList();
    var inputs = new Array(list.length);

    for (var i = 0; i < list.length; i++) {
      inputs[i] = new MIDIInput(this, list[i], i);
    }
    return inputs;
  };

  MIDIAccess.prototype.outputs = function () {
    if (!this._Jazz) return null;
    var list = this._Jazz.MidiOutList();
    var outputs = new Array(list.length);

    for (var i = 0; i < list.length; i++) {
      outputs[i] = new MIDIOutput(this, list[i], i);
    }
    return outputs;
  };

  function MIDIInput(midiAccess, name, index) {
    this._listeners = [];
    this._midiAccess = midiAccess;
    this._index = index;
    this.id = "" + index + "." + name;
    this.manufacturer = "";
    this.name = name;
    this.type = "input";
    this.version = "";
    this.onmidimessage = null;

    var inputInstance = null;
    for (
      var i = 0;
      i < midiAccess._jazzInstances.length && !inputInstance;
      i++
    ) {
      if (!midiAccess._jazzInstances[i].inputInUse)
        inputInstance = midiAccess._jazzInstances[i];
    }
    if (!inputInstance) {
      inputInstance = new _JazzInstance();
      midiAccess._jazzInstances.push(inputInstance);
    }
    inputInstance.inputInUse = true;

    this._jazzInstance = inputInstance._Jazz;
    this._input = this._jazzInstance.MidiInOpen(
      this._index,
      _midiProc.bind(this)
    );
  }

  // Introduced in DOM Level 2:
  MIDIInput.prototype.addEventListener = function (type, listener, useCapture) {
    if (type !== "midimessage") return;
    for (var i = 0; i < this._listeners.length; i++)
      if (this._listeners[i] == listener) return;
    this._listeners.push(listener);
  };

  MIDIInput.prototype.removeEventListener = function (
    type,
    listener,
    useCapture
  ) {
    if (type !== "midimessage") return;
    for (var i = 0; i < this._listeners.length; i++)
      if (this._listeners[i] == listener) {
        this._listeners.splice(i, 1); //remove it
        return;
      }
  };

  MIDIInput.prototype.preventDefault = function () {
    this._pvtDef = true;
  };

  MIDIInput.prototype.dispatchEvent = function (evt) {
    this._pvtDef = false;

    // dispatch to listeners
    for (var i = 0; i < this._listeners.length; i++)
      if (this._listeners[i].handleEvent)
        this._listeners[i].handleEvent.bind(this)(evt);
      else this._listeners[i].bind(this)(evt);

    if (this.onmidimessage) this.onmidimessage(evt);

    return this._pvtDef;
  };

  function _midiProc(timestamp, data) {
    // Have to use createEvent/initEvent because IE10 fails on new CustomEvent.  Thanks, IE!
    var evt = document.createEvent("Event");
    evt.initEvent("midimessage", false, false);
    evt.timestamp =
      parseFloat(timestamp.toString()) + this._jazzInstance._perfTimeZero;
    var length = 0;
    var i, j;

    // Jazz sometimes passes us multiple messages at once, so we need to parse them out
    // and pass them one at a time.
    for (i = 0; i < data.length; i += length) {
      switch (data[i] & 0xf0) {
        case 0x80: // note off
        case 0x90: // note on
        case 0xa0: // polyphonic aftertouch
        case 0xb0: // control change
        case 0xe0: // channel mode
          length = 3;
          break;

        case 0xc0: // program change
        case 0xd0: // channel aftertouch
          length = 2;
          break;

        case 0xf0:
          switch (data[i]) {
            case 0xf0: // variable-length sysex.
              // count the length;
              length = -1;
              j = i + 1;
              while (j < data.length && data[j] != 0xf7) j++;
              length = j - i + 1;
              break;

            case 0xf1: // MTC quarter frame
            case 0xf3: // song select
              length = 2;
              break;

            case 0xf2: // song position pointer
              length = 3;
              break;

            default:
              length = 1;
              break;
          }
          break;
      }
      evt.data = new Uint8Array(data.slice(i, length + i));
      this.dispatchEvent(evt);
    }
  }

  function MIDIOutput(midiAccess, name, index) {
    this._listeners = [];
    this._midiAccess = midiAccess;
    this._index = index;
    this.id = "" + index + "." + name;
    this.manufacturer = "";
    this.name = name;
    this.type = "output";
    this.version = "";

    var outputInstance = null;
    for (
      var i = 0;
      i < midiAccess._jazzInstances.length && !outputInstance;
      i++
    ) {
      if (!midiAccess._jazzInstances[i].outputInUse)
        outputInstance = midiAccess._jazzInstances[i];
    }
    if (!outputInstance) {
      outputInstance = new _JazzInstance();
      midiAccess._jazzInstances.push(outputInstance);
    }
    outputInstance.outputInUse = true;

    this._jazzInstance = outputInstance._Jazz;
    this._jazzInstance.MidiOutOpen(this.name);
  }

  function _sendLater() {
    this.jazz.MidiOutLong(this.data); // handle send as sysex
  }

  MIDIOutput.prototype.send = function (data, timestamp) {
    var delayBeforeSend = 0;
    if (data.length == 0) return false;

    if (timestamp)
      delayBeforeSend = Math.floor(timestamp - window.performance.now());

    if (timestamp && delayBeforeSend > 1) {
      var sendObj = new Object();
      sendObj.jazz = this._jazzInstance;
      sendObj.data = data;

      window.setTimeout(_sendLater.bind(sendObj), delayBeforeSend);
    } else {
      this._jazzInstance.MidiOutLong(data);
    }
    return true;
  };
})(window);

// Polyfill window.performance.now() if necessary.
(function (exports) {
  var perf = {},
    props;

  function findAlt() {
    var prefix = "moz,webkit,opera,ms".split(","),
      i = prefix.length,
      //worst case, we use Date.now()
      props = {
        value: (function (start) {
          return function () {
            return Date.now() - start;
          };
        })(Date.now()),
      };

    //seach for vendor prefixed version
    for (; i >= 0; i--) {
      if (prefix[i] + "Now" in exports.performance) {
        props.value = (function (method) {
          return function () {
            exports.performance[method]();
          };
        })(prefix[i] + "Now");
        return props;
      }
    }

    //otherwise, try to use connectionStart
    if (
      "timing" in exports.performance &&
      "connectStart" in exports.performance.timing
    ) {
      //this pretty much approximates performance.now() to the millisecond
      props.value = (function (start) {
        return function () {
          Date.now() - start;
        };
      })(exports.performance.timing.connectStart);
    }
    return props;
  }

  //if already defined, bail
  if ("performance" in exports && "now" in exports.performance) return;
  if (!("performance" in exports))
    Object.defineProperty(exports, "performance", {
      get: function () {
        return perf;
      },
    });
  //otherwise, performance is there, but not "now()"

  props = findAlt();
  Object.defineProperty(exports.performance, "now", props);
})(window);