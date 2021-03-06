/*!
 * Copyright 2012 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */
function PointerEvent(e, t) {
  var n = document.createEvent("MouseEvent");
  return (n.__proto__ = PointerEvent.prototype), n.initPointerEvent(e, t), n;
}
(PointerEvent.prototype.__proto__ = MouseEvent.prototype),
  (PointerEvent.prototype.initPointerEvent = function (e, t) {
    var n = {
      bubbles: !1,
      cancelable: !1,
      view: null,
      detail: null,
      screenX: 0,
      screenY: 0,
      clientX: 0,
      clientY: 0,
      ctrlKey: !1,
      altKey: !1,
      shiftKey: !1,
      metaKey: !1,
      button: -1,
      buttons: null,
      which: 0,
      relatedTarget: null,
      pointerId: -1,
      width: 0,
      height: 0,
      pressure: 0,
      tiltX: 0,
      tiltY: 0,
      pointerType: "unavailable",
      hwTimestamp: 0,
      isPrimary: !1,
    };
    for (var r in t) r in n && (n[r] = t[r]);
    var i;
    n.buttons !== null
      ? (i = n.buttons ? n.button : -1)
      : (i = n.which ? n.button : -1),
      Object.defineProperties(this, {
        pointerId: { value: n.pointerId, enumerable: !0 },
        width: { value: n.width, enumerable: !0 },
        height: { value: n.height, enumerable: !0 },
        pressure: { value: n.pressure, enumerable: !0 },
        tiltX: { value: n.tiltX, enumerable: !0 },
        tiltY: { value: n.tiltY, enumerable: !0 },
        pointerType: { value: n.pointerType, enumerable: !0 },
        hwTimestamp: { value: n.hwTimestamp, enumerable: !0 },
        isPrimary: { value: n.isPrimary, enumerable: !0 },
      }),
      this.initMouseEvent(
        e,
        n.bubbles,
        n.cancelable,
        n.view,
        n.detail,
        n.screenX,
        n.screenY,
        n.clientX,
        n.clientY,
        n.ctrlKey,
        n.altKey,
        n.shiftKey,
        n.metaKey,
        i,
        n.relatedTarget
      );
  });
var SideTable;
typeof WeakMap != "undefined"
  ? (SideTable = WeakMap)
  : ((SideTable = function (e) {
      this.name = "__$" + e + "$__";
    }),
    (SideTable.prototype = {
      set: function (e, t) {
        Object.defineProperty(e, this.name, { value: t, writable: !0 });
      },
      get: function (e) {
        return e[this.name];
      },
    })),
  (function (e) {
    (e = e || {}),
      Function.prototype.bind ||
        (Function.prototype.bind = function (t) {
          var n = e.toArray(arguments, 1),
            r = this;
          return function () {
            var i = e.toArray(arguments, 0);
            return r.apply(t, n.concat(i));
          };
        }),
      (e.toArray = function (e, t) {
        return Array.prototype.slice.call(e, t || 0);
      }),
      (window.__PointerEventShim__ = e);
  })(window.__PointerEventShim__),
  (function (e) {
    var t = {
      pointers: [],
      addPointer: function (e) {
        var t = { id: e };
        return this.pointers.push(t), t;
      },
      removePointer: function (e) {
        var t = this.getPointerIndex(e);
        if (t > -1) return this.pointers.splice(t, 1)[0];
      },
      getPointerById: function (e) {
        return this.pointers[this.getPointerIndex(e)];
      },
      getPointerIndex: function (e) {
        for (
          var t = 0, n = this.pointers.length, r;
          t < n && (r = this.pointers[t]);
          t++
        )
          if (r.id === e) return t;
        return -1;
      },
    };
    e.pointermap = t;
  })(window.__PointerEventShim__),
  (function (e) {
    var t = {
      targets: new SideTable("target"),
      handledEvents: new SideTable("pointer"),
      events: [],
      eventMap: {},
      eventSources: {},
      registerSource: function (e, t) {
        var n = t;
        (this.events = n.events),
          this.events.forEach(function (e) {
            n[e] && (this.eventMap[e] = n[e].bind(n));
          }, this),
          (this.eventSources[e] = n);
      },
      registerTarget: function (e) {
        this.listen(this.events, e);
      },
      unregisterTarget: function (e) {
        this.unlisten(this.events, e);
      },
      down: function (e) {
        this.fireEvent("pointerdown", e);
      },
      move: function (e) {
        this.fireEvent("pointermove", e);
      },
      up: function (e) {
        this.fireEvent("pointerup", e);
      },
      enter: function (e) {
        this.fireEvent("pointerenter", e);
      },
      leave: function (e) {
        this.fireEvent("pointerleave", e);
      },
      over: function (e) {
        this.fireEvent("pointerover", e);
      },
      out: function (e) {
        this.fireEvent("pointerout", e);
      },
      cancel: function (e) {
        this.fireEvent("pointercancel", e);
      },
      eventHandler: function (e) {
        if (this.handledEvents.get(e)) return;
        var t = e.type,
          n = this.eventMap && this.eventMap[t];
        n && n(e), this.handledEvents.set(e, !0);
      },
      listen: function (e, t) {
        e.forEach(function (e) {
          this.addEvent(e, this.boundHandler, !1, t);
        }, this);
      },
      unlisten: function (e) {
        e.forEach(function (e) {
          this.removeEvent(e, this.boundHandler, !1, inTarget);
        }, this);
      },
      addEvent: function (e, t, n, r) {
        r.addEventListener(e, t, n);
      },
      removeEvent: function (e, t, n, r) {
        r.removeEventListener(e, t, n);
      },
      makeEvent: function (e, t) {
        var n = new PointerEvent(e, t);
        return this.targets.set(n, this.targets.get(t) || t.target), n;
      },
      fireEvent: function (e, t) {
        var n = this.makeEvent(e, t);
        return this.dispatchEvent(n);
      },
      cloneEvent: function (e) {
        var t = {};
        for (var n in e) t[n] = e[n];
        return t;
      },
      getTarget: function (e) {
        return this.captureInfo && this.captureInfo.id === e.pointerId
          ? this.captureInfo.target
          : this.targets.get(e);
      },
      dispatchEvent: function (e) {
        var t = this.getTarget(e);
        if (t) return t.dispatchEvent(e);
      },
    };
    (t.boundHandler = t.eventHandler.bind(t)),
      (e.dispatcher = t),
      (e.register = function (e) {
        t.registerTarget(e);
      }),
      (e.unregister = function (e) {
        t.unregisterTarget(e);
      });
  })(window.__PointerEventShim__),
  (function (e) {
    var t = e.dispatcher,
      n = e.pointermap,
      r = Array.prototype.map.call.bind(Array.prototype.map),
      i = {
        events: ["touchstart", "touchmove", "touchend", "touchcancel"],
        POINTER_TYPE: "touch",
        firstTouch: null,
        isPrimaryTouch: function (e) {
          return this.firstTouch === e.identifier;
        },
        removePrimaryTouch: function (e) {
          this.isPrimaryTouch(e) && (this.firstTouch = null);
        },
        touchToPointer: function (e) {
          var n = t.cloneEvent(e);
          return (
            (n.pointerId = e.identifier + 2),
            (n.target = this.findTarget(n)),
            (n.bubbles = !0),
            (n.cancelable = !0),
            (n.button = 0),
            (n.buttons = 1),
            (n.isPrimary = this.isPrimaryTouch(e)),
            (n.pointerType = this.POINTER_TYPE),
            n
          );
        },
        processTouches: function (e, t) {
          var n = e.changedTouches,
            i = r(n, this.touchToPointer, this);
          i.forEach(t, this);
        },
        findTarget: function (e) {
          return document.elementFromPoint(e.clientX, e.clientY);
        },
        touchstart: function (e) {
          this.firstTouch === null &&
            (this.firstTouch = e.changedTouches[0].identifier),
            this.processTouches(e, this.overDown);
        },
        overDown: function (e) {
          var r = n.addPointer(e.pointerId);
          t.over(e), t.down(e), (r.out = e);
        },
        touchmove: function (e) {
          e.preventDefault(), this.processTouches(e, this.moveOverOut);
        },
        moveOverOut: function (e) {
          var r = e,
            i = n.getPointerById(r.pointerId),
            s = i.out;
          t.move(r),
            s &&
              s.target !== r.target &&
              ((s.relatedTarget = r.target),
              (r.relatedTarget = s.target),
              t.out(s),
              t.over(r)),
            (i.out = r);
        },
        touchend: function (e) {
          this.processTouches(e, this.upOut);
        },
        upOut: function (e) {
          t.up(e),
            t.out(e),
            n.removePointer(e.pointerId),
            this.removePrimaryTouch(e);
        },
        touchcancel: function (e) {
          this.processTouches(e, this.cancelOut);
        },
        cancelOut: function (e) {
          t.cancel(e),
            t.out(e),
            n.removePointer(e.pointerId),
            this.removePrimaryTouch(e);
        },
      },
      s = {
        POINTER_ID: 1,
        POINTER_TYPE: "mouse",
        events: ["mousedown", "mousemove", "mouseup", "mouseover", "mouseout"],
        prepareEvent: function (e) {
          var n = t.cloneEvent(e);
          return (
            (n.pointerId = this.POINTER_ID),
            (n.isPrimary = !0),
            (n.pointerType = this.POINTER_TYPE),
            n
          );
        },
        mousedown: function (e) {
          if (n.getPointerIndex(this.POINTER_ID) == -1) {
            var r = this.prepareEvent(e),
              i = n.addPointer(this.POINTER_ID);
            (i.button = e.button), t.down(r);
          }
        },
        mousemove: function (e) {
          var n = this.prepareEvent(e);
          t.move(n);
        },
        mouseup: function (e) {
          var r = n.getPointerById(this.POINTER_ID);
          if (r && r.button === e.button) {
            var i = this.prepareEvent(e);
            t.up(i), n.removePointer(this.POINTER_ID);
          }
        },
        mouseover: function (e) {
          var n = this.prepareEvent(e);
          t.over(n);
        },
        mouseout: function (e) {
          var n = this.prepareEvent(e);
          t.out(n);
        },
      };
    window.navigator.pointerEnabled === undefined &&
      ("ontouchstart" in window
        ? t.registerSource("touch", i)
        : t.registerSource("mouse", s),
      t.registerTarget(document),
      Object.defineProperty(window.navigator, "pointerEnabled", {
        value: !0,
        enumerable: !0,
      }));
  })(window.__PointerEventShim__);
