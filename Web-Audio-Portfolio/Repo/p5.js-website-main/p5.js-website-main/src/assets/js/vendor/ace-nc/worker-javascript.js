"no use strict";
(function (e) {
  if (typeof e.window != "undefined" && e.document) return;
  (e.console = function () {
    var e = Array.prototype.slice.call(arguments, 0);
    postMessage({ type: "log", data: e });
  }),
    (e.console.error =
      e.console.warn =
      e.console.log =
      e.console.trace =
        e.console),
    (e.window = e),
    (e.ace = e),
    (e.onerror = function (e, t, n, r, i) {
      console.error("Worker " + (i ? i.stack : e));
    }),
    (e.normalizeModule = function (t, n) {
      if (n.indexOf("!") !== -1) {
        var r = n.split("!");
        return e.normalizeModule(t, r[0]) + "!" + e.normalizeModule(t, r[1]);
      }
      if (n.charAt(0) == ".") {
        var i = t.split("/").slice(0, -1).join("/");
        n = (i ? i + "/" : "") + n;
        while (n.indexOf(".") !== -1 && s != n) {
          var s = n;
          n = n
            .replace(/^\.\//, "")
            .replace(/\/\.\//, "/")
            .replace(/[^\/]+\/\.\.\//, "");
        }
      }
      return n;
    }),
    (e.require = function (t, n) {
      n || ((n = t), (t = null));
      if (!n.charAt)
        throw new Error(
          "worker.js require() accepts only (parentId, id) as arguments"
        );
      n = e.normalizeModule(t, n);
      var r = e.require.modules[n];
      if (r)
        return (
          r.initialized ||
            ((r.initialized = !0), (r.exports = r.factory().exports)),
          r.exports
        );
      var i = n.split("/");
      if (!e.require.tlns) return console.log("unable to load " + n);
      i[0] = e.require.tlns[i[0]] || i[0];
      var s = i.join("/") + ".js";
      return (e.require.id = n), importScripts(s), e.require(t, n);
    }),
    (e.require.modules = {}),
    (e.require.tlns = {}),
    (e.define = function (t, n, r) {
      arguments.length == 2
        ? ((r = n), typeof t != "string" && ((n = t), (t = e.require.id)))
        : arguments.length == 1 && ((r = t), (n = []), (t = e.require.id)),
        n.length || (n = ["require", "exports", "module"]);
      if (t.indexOf("text!") === 0) return;
      var i = function (n) {
        return e.require(t, n);
      };
      e.require.modules[t] = {
        exports: {},
        factory: function () {
          var e = this,
            t = r.apply(
              this,
              n.map(function (t) {
                switch (t) {
                  case "require":
                    return i;
                  case "exports":
                    return e.exports;
                  case "module":
                    return e;
                  default:
                    return i(t);
                }
              })
            );
          return t && (e.exports = t), e;
        },
      };
    }),
    (e.define.amd = {}),
    (e.initBaseUrls = function (t) {
      require.tlns = t;
    }),
    (e.initSender = function () {
      var n = e.require("ace/lib/event_emitter").EventEmitter,
        r = e.require("ace/lib/oop"),
        i = function () {};
      return (
        function () {
          r.implement(this, n),
            (this.callback = function (e, t) {
              postMessage({ type: "call", id: t, data: e });
            }),
            (this.emit = function (e, t) {
              postMessage({ type: "event", name: e, data: t });
            });
        }.call(i.prototype),
        new i()
      );
    });
  var t = (e.main = null),
    n = (e.sender = null);
  e.onmessage = function (r) {
    var i = r.data;
    if (i.command) {
      if (!t[i.command]) throw new Error("Unknown command:" + i.command);
      t[i.command].apply(t, i.args);
    } else if (i.init) {
      initBaseUrls(i.tlns),
        require("ace/lib/es5-shim"),
        (n = e.sender = initSender());
      var s = require(i.module)[i.classname];
      t = e.main = new s(n);
    } else i.event && n && n._signal(i.event, i.data);
  };
})(this),
  ace.define(
    "ace/lib/oop",
    ["require", "exports", "module"],
    function (e, t, n) {
      "use strict";
      (t.inherits = function (e, t) {
        (e.super_ = t),
          (e.prototype = Object.create(t.prototype, {
            constructor: {
              value: e,
              enumerable: !1,
              writable: !0,
              configurable: !0,
            },
          }));
      }),
        (t.mixin = function (e, t) {
          for (var n in t) e[n] = t[n];
          return e;
        }),
        (t.implement = function (e, n) {
          t.mixin(e, n);
        });
    }
  ),
  ace.define(
    "ace/lib/event_emitter",
    ["require", "exports", "module"],
    function (e, t, n) {
      "use strict";
      var r = {},
        i = function () {
          this.propagationStopped = !0;
        },
        s = function () {
          this.defaultPrevented = !0;
        };
      (r._emit = r._dispatchEvent =
        function (e, t) {
          this._eventRegistry || (this._eventRegistry = {}),
            this._defaultHandlers || (this._defaultHandlers = {});
          var n = this._eventRegistry[e] || [],
            r = this._defaultHandlers[e];
          if (!n.length && !r) return;
          if (typeof t != "object" || !t) t = {};
          t.type || (t.type = e),
            t.stopPropagation || (t.stopPropagation = i),
            t.preventDefault || (t.preventDefault = s),
            (n = n.slice());
          for (var o = 0; o < n.length; o++) {
            n[o](t, this);
            if (t.propagationStopped) break;
          }
          if (r && !t.defaultPrevented) return r(t, this);
        }),
        (r._signal = function (e, t) {
          var n = (this._eventRegistry || {})[e];
          if (!n) return;
          n = n.slice();
          for (var r = 0; r < n.length; r++) n[r](t, this);
        }),
        (r.once = function (e, t) {
          var n = this;
          t &&
            this.addEventListener(e, function r() {
              n.removeEventListener(e, r), t.apply(null, arguments);
            });
        }),
        (r.setDefaultHandler = function (e, t) {
          var n = this._defaultHandlers;
          n || (n = this._defaultHandlers = { _disabled_: {} });
          if (n[e]) {
            var r = n[e],
              i = n._disabled_[e];
            i || (n._disabled_[e] = i = []), i.push(r);
            var s = i.indexOf(t);
            s != -1 && i.splice(s, 1);
          }
          n[e] = t;
        }),
        (r.removeDefaultHandler = function (e, t) {
          var n = this._defaultHandlers;
          if (!n) return;
          var r = n._disabled_[e];
          if (n[e] == t) {
            var i = n[e];
            r && this.setDefaultHandler(e, r.pop());
          } else if (r) {
            var s = r.indexOf(t);
            s != -1 && r.splice(s, 1);
          }
        }),
        (r.on = r.addEventListener =
          function (e, t, n) {
            this._eventRegistry = this._eventRegistry || {};
            var r = this._eventRegistry[e];
            return (
              r || (r = this._eventRegistry[e] = []),
              r.indexOf(t) == -1 && r[n ? "unshift" : "push"](t),
              t
            );
          }),
        (r.off =
          r.removeListener =
          r.removeEventListener =
            function (e, t) {
              this._eventRegistry = this._eventRegistry || {};
              var n = this._eventRegistry[e];
              if (!n) return;
              var r = n.indexOf(t);
              r !== -1 && n.splice(r, 1);
            }),
        (r.removeAllListeners = function (e) {
          this._eventRegistry && (this._eventRegistry[e] = []);
        }),
        (t.EventEmitter = r);
    }
  ),
  ace.define("ace/range", ["require", "exports", "module"], function (e, t, n) {
    "use strict";
    var r = function (e, t) {
        return e.row - t.row || e.column - t.column;
      },
      i = function (e, t, n, r) {
        (this.start = { row: e, column: t }),
          (this.end = { row: n, column: r });
      };
    (function () {
      (this.isEqual = function (e) {
        return (
          this.start.row === e.start.row &&
          this.end.row === e.end.row &&
          this.start.column === e.start.column &&
          this.end.column === e.end.column
        );
      }),
        (this.toString = function () {
          return (
            "Range: [" +
            this.start.row +
            "/" +
            this.start.column +
            "] -> [" +
            this.end.row +
            "/" +
            this.end.column +
            "]"
          );
        }),
        (this.contains = function (e, t) {
          return this.compare(e, t) == 0;
        }),
        (this.compareRange = function (e) {
          var t,
            n = e.end,
            r = e.start;
          return (
            (t = this.compare(n.row, n.column)),
            t == 1
              ? ((t = this.compare(r.row, r.column)),
                t == 1 ? 2 : t == 0 ? 1 : 0)
              : t == -1
              ? -2
              : ((t = this.compare(r.row, r.column)),
                t == -1 ? -1 : t == 1 ? 42 : 0)
          );
        }),
        (this.comparePoint = function (e) {
          return this.compare(e.row, e.column);
        }),
        (this.containsRange = function (e) {
          return (
            this.comparePoint(e.start) == 0 && this.comparePoint(e.end) == 0
          );
        }),
        (this.intersects = function (e) {
          var t = this.compareRange(e);
          return t == -1 || t == 0 || t == 1;
        }),
        (this.isEnd = function (e, t) {
          return this.end.row == e && this.end.column == t;
        }),
        (this.isStart = function (e, t) {
          return this.start.row == e && this.start.column == t;
        }),
        (this.setStart = function (e, t) {
          typeof e == "object"
            ? ((this.start.column = e.column), (this.start.row = e.row))
            : ((this.start.row = e), (this.start.column = t));
        }),
        (this.setEnd = function (e, t) {
          typeof e == "object"
            ? ((this.end.column = e.column), (this.end.row = e.row))
            : ((this.end.row = e), (this.end.column = t));
        }),
        (this.inside = function (e, t) {
          return this.compare(e, t) == 0
            ? this.isEnd(e, t) || this.isStart(e, t)
              ? !1
              : !0
            : !1;
        }),
        (this.insideStart = function (e, t) {
          return this.compare(e, t) == 0 ? (this.isEnd(e, t) ? !1 : !0) : !1;
        }),
        (this.insideEnd = function (e, t) {
          return this.compare(e, t) == 0 ? (this.isStart(e, t) ? !1 : !0) : !1;
        }),
        (this.compare = function (e, t) {
          return !this.isMultiLine() && e === this.start.row
            ? t < this.start.column
              ? -1
              : t > this.end.column
              ? 1
              : 0
            : e < this.start.row
            ? -1
            : e > this.end.row
            ? 1
            : this.start.row === e
            ? t >= this.start.column
              ? 0
              : -1
            : this.end.row === e
            ? t <= this.end.column
              ? 0
              : 1
            : 0;
        }),
        (this.compareStart = function (e, t) {
          return this.start.row == e && this.start.column == t
            ? -1
            : this.compare(e, t);
        }),
        (this.compareEnd = function (e, t) {
          return this.end.row == e && this.end.column == t
            ? 1
            : this.compare(e, t);
        }),
        (this.compareInside = function (e, t) {
          return this.end.row == e && this.end.column == t
            ? 1
            : this.start.row == e && this.start.column == t
            ? -1
            : this.compare(e, t);
        }),
        (this.clipRows = function (e, t) {
          if (this.end.row > t) var n = { row: t + 1, column: 0 };
          else if (this.end.row < e) var n = { row: e, column: 0 };
          if (this.start.row > t) var r = { row: t + 1, column: 0 };
          else if (this.start.row < e) var r = { row: e, column: 0 };
          return i.fromPoints(r || this.start, n || this.end);
        }),
        (this.extend = function (e, t) {
          var n = this.compare(e, t);
          if (n == 0) return this;
          if (n == -1) var r = { row: e, column: t };
          else var s = { row: e, column: t };
          return i.fromPoints(r || this.start, s || this.end);
        }),
        (this.isEmpty = function () {
          return (
            this.start.row === this.end.row &&
            this.start.column === this.end.column
          );
        }),
        (this.isMultiLine = function () {
          return this.start.row !== this.end.row;
        }),
        (this.clone = function () {
          return i.fromPoints(this.start, this.end);
        }),
        (this.collapseRows = function () {
          return this.end.column == 0
            ? new i(
                this.start.row,
                0,
                Math.max(this.start.row, this.end.row - 1),
                0
              )
            : new i(this.start.row, 0, this.end.row, 0);
        }),
        (this.toScreenRange = function (e) {
          var t = e.documentToScreenPosition(this.start),
            n = e.documentToScreenPosition(this.end);
          return new i(t.row, t.column, n.row, n.column);
        }),
        (this.moveBy = function (e, t) {
          (this.start.row += e),
            (this.start.column += t),
            (this.end.row += e),
            (this.end.column += t);
        });
    }.call(i.prototype),
      (i.fromPoints = function (e, t) {
        return new i(e.row, e.column, t.row, t.column);
      }),
      (i.comparePoints = r),
      (i.comparePoints = function (e, t) {
        return e.row - t.row || e.column - t.column;
      }),
      (t.Range = i));
  }),
  ace.define(
    "ace/anchor",
    ["require", "exports", "module", "ace/lib/oop", "ace/lib/event_emitter"],
    function (e, t, n) {
      "use strict";
      var r = e("./lib/oop"),
        i = e("./lib/event_emitter").EventEmitter,
        s = (t.Anchor = function (e, t, n) {
          (this.$onChange = this.onChange.bind(this)),
            this.attach(e),
            typeof n == "undefined"
              ? this.setPosition(t.row, t.column)
              : this.setPosition(t, n);
        });
      (function () {
        r.implement(this, i),
          (this.getPosition = function () {
            return this.$clipPositionToDocument(this.row, this.column);
          }),
          (this.getDocument = function () {
            return this.document;
          }),
          (this.$insertRight = !1),
          (this.onChange = function (e) {
            var t = e.data,
              n = t.range;
            if (n.start.row == n.end.row && n.start.row != this.row) return;
            if (n.start.row > this.row) return;
            if (n.start.row == this.row && n.start.column > this.column) return;
            var r = this.row,
              i = this.column,
              s = n.start,
              o = n.end;
            if (t.action === "insertText")
              if (s.row === r && s.column <= i) {
                if (s.column !== i || !this.$insertRight)
                  s.row === o.row
                    ? (i += o.column - s.column)
                    : ((i -= s.column), (r += o.row - s.row));
              } else s.row !== o.row && s.row < r && (r += o.row - s.row);
            else
              t.action === "insertLines"
                ? (s.row !== r || i !== 0 || !this.$insertRight) &&
                  s.row <= r &&
                  (r += o.row - s.row)
                : t.action === "removeText"
                ? s.row === r && s.column < i
                  ? o.column >= i
                    ? (i = s.column)
                    : (i = Math.max(0, i - (o.column - s.column)))
                  : s.row !== o.row && s.row < r
                  ? (o.row === r && (i = Math.max(0, i - o.column) + s.column),
                    (r -= o.row - s.row))
                  : o.row === r &&
                    ((r -= o.row - s.row),
                    (i = Math.max(0, i - o.column) + s.column))
                : t.action == "removeLines" &&
                  s.row <= r &&
                  (o.row <= r ? (r -= o.row - s.row) : ((r = s.row), (i = 0)));
            this.setPosition(r, i, !0);
          }),
          (this.setPosition = function (e, t, n) {
            var r;
            n
              ? (r = { row: e, column: t })
              : (r = this.$clipPositionToDocument(e, t));
            if (this.row == r.row && this.column == r.column) return;
            var i = { row: this.row, column: this.column };
            (this.row = r.row),
              (this.column = r.column),
              this._signal("change", { old: i, value: r });
          }),
          (this.detach = function () {
            this.document.removeEventListener("change", this.$onChange);
          }),
          (this.attach = function (e) {
            (this.document = e || this.document),
              this.document.on("change", this.$onChange);
          }),
          (this.$clipPositionToDocument = function (e, t) {
            var n = {};
            return (
              e >= this.document.getLength()
                ? ((n.row = Math.max(0, this.document.getLength() - 1)),
                  (n.column = this.document.getLine(n.row).length))
                : e < 0
                ? ((n.row = 0), (n.column = 0))
                : ((n.row = e),
                  (n.column = Math.min(
                    this.document.getLine(n.row).length,
                    Math.max(0, t)
                  ))),
              t < 0 && (n.column = 0),
              n
            );
          });
      }.call(s.prototype));
    }
  ),
  ace.define(
    "ace/document",
    [
      "require",
      "exports",
      "module",
      "ace/lib/oop",
      "ace/lib/event_emitter",
      "ace/range",
      "ace/anchor",
    ],
    function (e, t, n) {
      "use strict";
      var r = e("./lib/oop"),
        i = e("./lib/event_emitter").EventEmitter,
        s = e("./range").Range,
        o = e("./anchor").Anchor,
        u = function (e) {
          (this.$lines = []),
            e.length === 0
              ? (this.$lines = [""])
              : Array.isArray(e)
              ? this._insertLines(0, e)
              : this.insert({ row: 0, column: 0 }, e);
        };
      (function () {
        r.implement(this, i),
          (this.setValue = function (e) {
            var t = this.getLength();
            this.remove(new s(0, 0, t, this.getLine(t - 1).length)),
              this.insert({ row: 0, column: 0 }, e);
          }),
          (this.getValue = function () {
            return this.getAllLines().join(this.getNewLineCharacter());
          }),
          (this.createAnchor = function (e, t) {
            return new o(this, e, t);
          }),
          "aaa".split(/a/).length === 0
            ? (this.$split = function (e) {
                return e.replace(/\r\n|\r/g, "\n").split("\n");
              })
            : (this.$split = function (e) {
                return e.split(/\r\n|\r|\n/);
              }),
          (this.$detectNewLine = function (e) {
            var t = e.match(/^.*?(\r\n|\r|\n)/m);
            (this.$autoNewLine = t ? t[1] : "\n"),
              this._signal("changeNewLineMode");
          }),
          (this.getNewLineCharacter = function () {
            switch (this.$newLineMode) {
              case "windows":
                return "\r\n";
              case "unix":
                return "\n";
              default:
                return this.$autoNewLine || "\n";
            }
          }),
          (this.$autoNewLine = ""),
          (this.$newLineMode = "auto"),
          (this.setNewLineMode = function (e) {
            if (this.$newLineMode === e) return;
            (this.$newLineMode = e), this._signal("changeNewLineMode");
          }),
          (this.getNewLineMode = function () {
            return this.$newLineMode;
          }),
          (this.isNewLine = function (e) {
            return e == "\r\n" || e == "\r" || e == "\n";
          }),
          (this.getLine = function (e) {
            return this.$lines[e] || "";
          }),
          (this.getLines = function (e, t) {
            return this.$lines.slice(e, t + 1);
          }),
          (this.getAllLines = function () {
            return this.getLines(0, this.getLength());
          }),
          (this.getLength = function () {
            return this.$lines.length;
          }),
          (this.getTextRange = function (e) {
            if (e.start.row == e.end.row)
              return this.getLine(e.start.row).substring(
                e.start.column,
                e.end.column
              );
            var t = this.getLines(e.start.row, e.end.row);
            t[0] = (t[0] || "").substring(e.start.column);
            var n = t.length - 1;
            return (
              e.end.row - e.start.row == n &&
                (t[n] = t[n].substring(0, e.end.column)),
              t.join(this.getNewLineCharacter())
            );
          }),
          (this.$clipPosition = function (e) {
            var t = this.getLength();
            return (
              e.row >= t
                ? ((e.row = Math.max(0, t - 1)),
                  (e.column = this.getLine(t - 1).length))
                : e.row < 0 && (e.row = 0),
              e
            );
          }),
          (this.insert = function (e, t) {
            if (!t || t.length === 0) return e;
            (e = this.$clipPosition(e)),
              this.getLength() <= 1 && this.$detectNewLine(t);
            var n = this.$split(t),
              r = n.splice(0, 1)[0],
              i = n.length == 0 ? null : n.splice(n.length - 1, 1)[0];
            return (
              (e = this.insertInLine(e, r)),
              i !== null &&
                ((e = this.insertNewLine(e)),
                (e = this._insertLines(e.row, n)),
                (e = this.insertInLine(e, i || ""))),
              e
            );
          }),
          (this.insertLines = function (e, t) {
            return e >= this.getLength()
              ? this.insert({ row: e, column: 0 }, "\n" + t.join("\n"))
              : this._insertLines(Math.max(e, 0), t);
          }),
          (this._insertLines = function (e, t) {
            if (t.length == 0) return { row: e, column: 0 };
            while (t.length > 61440) {
              var n = this._insertLines(e, t.slice(0, 61440));
              (t = t.slice(61440)), (e = n.row);
            }
            var r = [e, 0];
            r.push.apply(r, t), this.$lines.splice.apply(this.$lines, r);
            var i = new s(e, 0, e + t.length, 0),
              o = { action: "insertLines", range: i, lines: t };
            return this._signal("change", { data: o }), i.end;
          }),
          (this.insertNewLine = function (e) {
            e = this.$clipPosition(e);
            var t = this.$lines[e.row] || "";
            (this.$lines[e.row] = t.substring(0, e.column)),
              this.$lines.splice(e.row + 1, 0, t.substring(e.column, t.length));
            var n = { row: e.row + 1, column: 0 },
              r = {
                action: "insertText",
                range: s.fromPoints(e, n),
                text: this.getNewLineCharacter(),
              };
            return this._signal("change", { data: r }), n;
          }),
          (this.insertInLine = function (e, t) {
            if (t.length == 0) return e;
            var n = this.$lines[e.row] || "";
            this.$lines[e.row] =
              n.substring(0, e.column) + t + n.substring(e.column);
            var r = { row: e.row, column: e.column + t.length },
              i = { action: "insertText", range: s.fromPoints(e, r), text: t };
            return this._signal("change", { data: i }), r;
          }),
          (this.remove = function (e) {
            e instanceof s || (e = s.fromPoints(e.start, e.end)),
              (e.start = this.$clipPosition(e.start)),
              (e.end = this.$clipPosition(e.end));
            if (e.isEmpty()) return e.start;
            var t = e.start.row,
              n = e.end.row;
            if (e.isMultiLine()) {
              var r = e.start.column == 0 ? t : t + 1,
                i = n - 1;
              e.end.column > 0 && this.removeInLine(n, 0, e.end.column),
                i >= r && this._removeLines(r, i),
                r != t &&
                  (this.removeInLine(t, e.start.column, this.getLine(t).length),
                  this.removeNewLine(e.start.row));
            } else this.removeInLine(t, e.start.column, e.end.column);
            return e.start;
          }),
          (this.removeInLine = function (e, t, n) {
            if (t == n) return;
            var r = new s(e, t, e, n),
              i = this.getLine(e),
              o = i.substring(t, n),
              u = i.substring(0, t) + i.substring(n, i.length);
            this.$lines.splice(e, 1, u);
            var a = { action: "removeText", range: r, text: o };
            return this._signal("change", { data: a }), r.start;
          }),
          (this.removeLines = function (e, t) {
            return e < 0 || t >= this.getLength()
              ? this.remove(new s(e, 0, t + 1, 0))
              : this._removeLines(e, t);
          }),
          (this._removeLines = function (e, t) {
            var n = new s(e, 0, t + 1, 0),
              r = this.$lines.splice(e, t - e + 1),
              i = {
                action: "removeLines",
                range: n,
                nl: this.getNewLineCharacter(),
                lines: r,
              };
            return this._signal("change", { data: i }), r;
          }),
          (this.removeNewLine = function (e) {
            var t = this.getLine(e),
              n = this.getLine(e + 1),
              r = new s(e, t.length, e + 1, 0),
              i = t + n;
            this.$lines.splice(e, 2, i);
            var o = {
              action: "removeText",
              range: r,
              text: this.getNewLineCharacter(),
            };
            this._signal("change", { data: o });
          }),
          (this.replace = function (e, t) {
            e instanceof s || (e = s.fromPoints(e.start, e.end));
            if (t.length == 0 && e.isEmpty()) return e.start;
            if (t == this.getTextRange(e)) return e.end;
            this.remove(e);
            if (t) var n = this.insert(e.start, t);
            else n = e.start;
            return n;
          }),
          (this.applyDeltas = function (e) {
            for (var t = 0; t < e.length; t++) {
              var n = e[t],
                r = s.fromPoints(n.range.start, n.range.end);
              n.action == "insertLines"
                ? this.insertLines(r.start.row, n.lines)
                : n.action == "insertText"
                ? this.insert(r.start, n.text)
                : n.action == "removeLines"
                ? this._removeLines(r.start.row, r.end.row - 1)
                : n.action == "removeText" && this.remove(r);
            }
          }),
          (this.revertDeltas = function (e) {
            for (var t = e.length - 1; t >= 0; t--) {
              var n = e[t],
                r = s.fromPoints(n.range.start, n.range.end);
              n.action == "insertLines"
                ? this._removeLines(r.start.row, r.end.row - 1)
                : n.action == "insertText"
                ? this.remove(r)
                : n.action == "removeLines"
                ? this._insertLines(r.start.row, n.lines)
                : n.action == "removeText" && this.insert(r.start, n.text);
            }
          }),
          (this.indexToPosition = function (e, t) {
            var n = this.$lines || this.getAllLines(),
              r = this.getNewLineCharacter().length;
            for (var i = t || 0, s = n.length; i < s; i++) {
              e -= n[i].length + r;
              if (e < 0) return { row: i, column: e + n[i].length + r };
            }
            return { row: s - 1, column: n[s - 1].length };
          }),
          (this.positionToIndex = function (e, t) {
            var n = this.$lines || this.getAllLines(),
              r = this.getNewLineCharacter().length,
              i = 0,
              s = Math.min(e.row, n.length);
            for (var o = t || 0; o < s; ++o) i += n[o].length + r;
            return i + e.column;
          });
      }.call(u.prototype),
        (t.Document = u));
    }
  ),
  ace.define(
    "ace/lib/lang",
    ["require", "exports", "module"],
    function (e, t, n) {
      "use strict";
      (t.last = function (e) {
        return e[e.length - 1];
      }),
        (t.stringReverse = function (e) {
          return e.split("").reverse().join("");
        }),
        (t.stringRepeat = function (e, t) {
          var n = "";
          while (t > 0) {
            t & 1 && (n += e);
            if ((t >>= 1)) e += e;
          }
          return n;
        });
      var r = /^\s\s*/,
        i = /\s\s*$/;
      (t.stringTrimLeft = function (e) {
        return e.replace(r, "");
      }),
        (t.stringTrimRight = function (e) {
          return e.replace(i, "");
        }),
        (t.copyObject = function (e) {
          var t = {};
          for (var n in e) t[n] = e[n];
          return t;
        }),
        (t.copyArray = function (e) {
          var t = [];
          for (var n = 0, r = e.length; n < r; n++)
            e[n] && typeof e[n] == "object"
              ? (t[n] = this.copyObject(e[n]))
              : (t[n] = e[n]);
          return t;
        }),
        (t.deepCopy = function (e) {
          if (typeof e != "object" || !e) return e;
          var n = e.constructor;
          if (n === RegExp) return e;
          var r = n();
          for (var i in e)
            typeof e[i] == "object" ? (r[i] = t.deepCopy(e[i])) : (r[i] = e[i]);
          return r;
        }),
        (t.arrayToMap = function (e) {
          var t = {};
          for (var n = 0; n < e.length; n++) t[e[n]] = 1;
          return t;
        }),
        (t.createMap = function (e) {
          var t = Object.create(null);
          for (var n in e) t[n] = e[n];
          return t;
        }),
        (t.arrayRemove = function (e, t) {
          for (var n = 0; n <= e.length; n++) t === e[n] && e.splice(n, 1);
        }),
        (t.escapeRegExp = function (e) {
          return e.replace(/([.*+?^${}()|[\]\/\\])/g, "\\$1");
        }),
        (t.escapeHTML = function (e) {
          return e
            .replace(/&/g, "&#38;")
            .replace(/"/g, "&#34;")
            .replace(/'/g, "&#39;")
            .replace(/</g, "&#60;");
        }),
        (t.getMatchOffsets = function (e, t) {
          var n = [];
          return (
            e.replace(t, function (e) {
              n.push({
                offset: arguments[arguments.length - 2],
                length: e.length,
              });
            }),
            n
          );
        }),
        (t.deferredCall = function (e) {
          var t = null,
            n = function () {
              (t = null), e();
            },
            r = function (e) {
              return r.cancel(), (t = setTimeout(n, e || 0)), r;
            };
          return (
            (r.schedule = r),
            (r.call = function () {
              return this.cancel(), e(), r;
            }),
            (r.cancel = function () {
              return clearTimeout(t), (t = null), r;
            }),
            (r.isPending = function () {
              return t;
            }),
            r
          );
        }),
        (t.delayedCall = function (e, t) {
          var n = null,
            r = function () {
              (n = null), e();
            },
            i = function (e) {
              n == null && (n = setTimeout(r, e || t));
            };
          return (
            (i.delay = function (e) {
              n && clearTimeout(n), (n = setTimeout(r, e || t));
            }),
            (i.schedule = i),
            (i.call = function () {
              this.cancel(), e();
            }),
            (i.cancel = function () {
              n && clearTimeout(n), (n = null);
            }),
            (i.isPending = function () {
              return n;
            }),
            i
          );
        });
    }
  ),
  ace.define(
    "ace/worker/mirror",
    ["require", "exports", "module", "ace/document", "ace/lib/lang"],
    function (e, t, n) {
      "use strict";
      var r = e("../document").Document,
        i = e("../lib/lang"),
        s = (t.Mirror = function (e) {
          this.sender = e;
          var t = (this.doc = new r("")),
            n = (this.deferredUpdate = i.delayedCall(this.onUpdate.bind(this))),
            s = this;
          e.on("change", function (e) {
            t.applyDeltas(e.data);
            if (s.$timeout) return n.schedule(s.$timeout);
            s.onUpdate();
          });
        });
      (function () {
        (this.$timeout = 500),
          (this.setTimeout = function (e) {
            this.$timeout = e;
          }),
          (this.setValue = function (e) {
            this.doc.setValue(e), this.deferredUpdate.schedule(this.$timeout);
          }),
          (this.getValue = function (e) {
            this.sender.callback(this.doc.getValue(), e);
          }),
          (this.onUpdate = function () {}),
          (this.isPending = function () {
            return this.deferredUpdate.isPending();
          });
      }.call(s.prototype));
    }
  ),
  ace.define(
    "ace/mode/javascript/jshint",
    ["require", "exports", "module"],
    function (e, t, n) {
      n.exports = (function r(t, n, i) {
        function s(u, a) {
          if (!n[u]) {
            if (!t[u]) {
              var f = typeof e == "function" && e;
              if (!a && f) return f(u, !0);
              if (o) return o(u, !0);
              throw new Error("Cannot find module '" + u + "'");
            }
            var l = (n[u] = { exports: {} });
            t[u][0].call(
              l.exports,
              function (e) {
                var n = t[u][1][e];
                return s(n ? n : e);
              },
              l,
              l.exports,
              r,
              t,
              n,
              i
            );
          }
          return n[u].exports;
        }
        var o = typeof e == "function" && e;
        for (var u = 0; u < i.length; u++) s(i[u]);
        return s;
      })(
        {
          1: [
            function (e, t, n) {
              var r = [];
              for (var i = 0; i < 128; i++)
                r[i] =
                  i === 36 ||
                  (i >= 65 && i <= 90) ||
                  i === 95 ||
                  (i >= 97 && i <= 122);
              var s = [];
              for (var i = 0; i < 128; i++) s[i] = r[i] || (i >= 48 && i <= 57);
              t.exports = {
                asciiIdentifierStartTable: r,
                asciiIdentifierPartTable: s,
              };
            },
            {},
          ],
          2: [
            function (e, t, n) {
              (function () {
                var e = this,
                  r = e._,
                  i = {},
                  s = Array.prototype,
                  o = Object.prototype,
                  u = Function.prototype,
                  a = s.push,
                  f = s.slice,
                  l = s.concat,
                  c = o.toString,
                  h = o.hasOwnProperty,
                  p = s.forEach,
                  d = s.map,
                  v = s.reduce,
                  m = s.reduceRight,
                  g = s.filter,
                  y = s.every,
                  b = s.some,
                  w = s.indexOf,
                  E = s.lastIndexOf,
                  S = Array.isArray,
                  x = Object.keys,
                  T = u.bind,
                  N = function (e) {
                    if (e instanceof N) return e;
                    if (!(this instanceof N)) return new N(e);
                    this._wrapped = e;
                  };
                typeof n != "undefined"
                  ? (typeof t != "undefined" &&
                      t.exports &&
                      (n = t.exports = N),
                    (n._ = N))
                  : (e._ = N),
                  (N.VERSION = "1.6.0");
                var C =
                  (N.each =
                  N.forEach =
                    function (e, t, n) {
                      if (e == null) return e;
                      if (p && e.forEach === p) e.forEach(t, n);
                      else if (e.length === +e.length) {
                        for (var r = 0, s = e.length; r < s; r++)
                          if (t.call(n, e[r], r, e) === i) return;
                      } else {
                        var o = N.keys(e);
                        for (var r = 0, s = o.length; r < s; r++)
                          if (t.call(n, e[o[r]], o[r], e) === i) return;
                      }
                      return e;
                    });
                N.map = N.collect = function (e, t, n) {
                  var r = [];
                  return e == null
                    ? r
                    : d && e.map === d
                    ? e.map(t, n)
                    : (C(e, function (e, i, s) {
                        r.push(t.call(n, e, i, s));
                      }),
                      r);
                };
                var k = "Reduce of empty array with no initial value";
                (N.reduce =
                  N.foldl =
                  N.inject =
                    function (e, t, n, r) {
                      var i = arguments.length > 2;
                      e == null && (e = []);
                      if (v && e.reduce === v)
                        return (
                          r && (t = N.bind(t, r)),
                          i ? e.reduce(t, n) : e.reduce(t)
                        );
                      C(e, function (e, s, o) {
                        i ? (n = t.call(r, n, e, s, o)) : ((n = e), (i = !0));
                      });
                      if (!i) throw new TypeError(k);
                      return n;
                    }),
                  (N.reduceRight = N.foldr =
                    function (e, t, n, r) {
                      var i = arguments.length > 2;
                      e == null && (e = []);
                      if (m && e.reduceRight === m)
                        return (
                          r && (t = N.bind(t, r)),
                          i ? e.reduceRight(t, n) : e.reduceRight(t)
                        );
                      var s = e.length;
                      if (s !== +s) {
                        var o = N.keys(e);
                        s = o.length;
                      }
                      C(e, function (u, a, f) {
                        (a = o ? o[--s] : --s),
                          i
                            ? (n = t.call(r, n, e[a], a, f))
                            : ((n = e[a]), (i = !0));
                      });
                      if (!i) throw new TypeError(k);
                      return n;
                    }),
                  (N.find = N.detect =
                    function (e, t, n) {
                      var r;
                      return (
                        L(e, function (e, i, s) {
                          if (t.call(n, e, i, s)) return (r = e), !0;
                        }),
                        r
                      );
                    }),
                  (N.filter = N.select =
                    function (e, t, n) {
                      var r = [];
                      return e == null
                        ? r
                        : g && e.filter === g
                        ? e.filter(t, n)
                        : (C(e, function (e, i, s) {
                            t.call(n, e, i, s) && r.push(e);
                          }),
                          r);
                    }),
                  (N.reject = function (e, t, n) {
                    return N.filter(
                      e,
                      function (e, r, i) {
                        return !t.call(n, e, r, i);
                      },
                      n
                    );
                  }),
                  (N.every = N.all =
                    function (e, t, n) {
                      t || (t = N.identity);
                      var r = !0;
                      return e == null
                        ? r
                        : y && e.every === y
                        ? e.every(t, n)
                        : (C(e, function (e, s, o) {
                            if (!(r = r && t.call(n, e, s, o))) return i;
                          }),
                          !!r);
                    });
                var L =
                  (N.some =
                  N.any =
                    function (e, t, n) {
                      t || (t = N.identity);
                      var r = !1;
                      return e == null
                        ? r
                        : b && e.some === b
                        ? e.some(t, n)
                        : (C(e, function (e, s, o) {
                            if (r || (r = t.call(n, e, s, o))) return i;
                          }),
                          !!r);
                    });
                (N.contains = N.include =
                  function (e, t) {
                    return e == null
                      ? !1
                      : w && e.indexOf === w
                      ? e.indexOf(t) != -1
                      : L(e, function (e) {
                          return e === t;
                        });
                  }),
                  (N.invoke = function (e, t) {
                    var n = f.call(arguments, 2),
                      r = N.isFunction(t);
                    return N.map(e, function (e) {
                      return (r ? t : e[t]).apply(e, n);
                    });
                  }),
                  (N.pluck = function (e, t) {
                    return N.map(e, N.property(t));
                  }),
                  (N.where = function (e, t) {
                    return N.filter(e, N.matches(t));
                  }),
                  (N.findWhere = function (e, t) {
                    return N.find(e, N.matches(t));
                  }),
                  (N.max = function (e, t, n) {
                    if (
                      !t &&
                      N.isArray(e) &&
                      e[0] === +e[0] &&
                      e.length < 65535
                    )
                      return Math.max.apply(Math, e);
                    var r = -Infinity,
                      i = -Infinity;
                    return (
                      C(e, function (e, s, o) {
                        var u = t ? t.call(n, e, s, o) : e;
                        u > i && ((r = e), (i = u));
                      }),
                      r
                    );
                  }),
                  (N.min = function (e, t, n) {
                    if (
                      !t &&
                      N.isArray(e) &&
                      e[0] === +e[0] &&
                      e.length < 65535
                    )
                      return Math.min.apply(Math, e);
                    var r = Infinity,
                      i = Infinity;
                    return (
                      C(e, function (e, s, o) {
                        var u = t ? t.call(n, e, s, o) : e;
                        u < i && ((r = e), (i = u));
                      }),
                      r
                    );
                  }),
                  (N.shuffle = function (e) {
                    var t,
                      n = 0,
                      r = [];
                    return (
                      C(e, function (e) {
                        (t = N.random(n++)), (r[n - 1] = r[t]), (r[t] = e);
                      }),
                      r
                    );
                  }),
                  (N.sample = function (e, t, n) {
                    return t == null || n
                      ? (e.length !== +e.length && (e = N.values(e)),
                        e[N.random(e.length - 1)])
                      : N.shuffle(e).slice(0, Math.max(0, t));
                  });
                var A = function (e) {
                  return e == null
                    ? N.identity
                    : N.isFunction(e)
                    ? e
                    : N.property(e);
                };
                N.sortBy = function (e, t, n) {
                  return (
                    (t = A(t)),
                    N.pluck(
                      N.map(e, function (e, r, i) {
                        return {
                          value: e,
                          index: r,
                          criteria: t.call(n, e, r, i),
                        };
                      }).sort(function (e, t) {
                        var n = e.criteria,
                          r = t.criteria;
                        if (n !== r) {
                          if (n > r || n === void 0) return 1;
                          if (n < r || r === void 0) return -1;
                        }
                        return e.index - t.index;
                      }),
                      "value"
                    )
                  );
                };
                var O = function (e) {
                  return function (t, n, r) {
                    var i = {};
                    return (
                      (n = A(n)),
                      C(t, function (s, o) {
                        var u = n.call(r, s, o, t);
                        e(i, u, s);
                      }),
                      i
                    );
                  };
                };
                (N.groupBy = O(function (e, t, n) {
                  N.has(e, t) ? e[t].push(n) : (e[t] = [n]);
                })),
                  (N.indexBy = O(function (e, t, n) {
                    e[t] = n;
                  })),
                  (N.countBy = O(function (e, t) {
                    N.has(e, t) ? e[t]++ : (e[t] = 1);
                  })),
                  (N.sortedIndex = function (e, t, n, r) {
                    n = A(n);
                    var i = n.call(r, t),
                      s = 0,
                      o = e.length;
                    while (s < o) {
                      var u = (s + o) >>> 1;
                      n.call(r, e[u]) < i ? (s = u + 1) : (o = u);
                    }
                    return s;
                  }),
                  (N.toArray = function (e) {
                    return e
                      ? N.isArray(e)
                        ? f.call(e)
                        : e.length === +e.length
                        ? N.map(e, N.identity)
                        : N.values(e)
                      : [];
                  }),
                  (N.size = function (e) {
                    return e == null
                      ? 0
                      : e.length === +e.length
                      ? e.length
                      : N.keys(e).length;
                  }),
                  (N.first =
                    N.head =
                    N.take =
                      function (e, t, n) {
                        return e == null
                          ? void 0
                          : t == null || n
                          ? e[0]
                          : t < 0
                          ? []
                          : f.call(e, 0, t);
                      }),
                  (N.initial = function (e, t, n) {
                    return f.call(e, 0, e.length - (t == null || n ? 1 : t));
                  }),
                  (N.last = function (e, t, n) {
                    return e == null
                      ? void 0
                      : t == null || n
                      ? e[e.length - 1]
                      : f.call(e, Math.max(e.length - t, 0));
                  }),
                  (N.rest =
                    N.tail =
                    N.drop =
                      function (e, t, n) {
                        return f.call(e, t == null || n ? 1 : t);
                      }),
                  (N.compact = function (e) {
                    return N.filter(e, N.identity);
                  });
                var M = function (e, t, n) {
                  return t && N.every(e, N.isArray)
                    ? l.apply(n, e)
                    : (C(e, function (e) {
                        N.isArray(e) || N.isArguments(e)
                          ? t
                            ? a.apply(n, e)
                            : M(e, t, n)
                          : n.push(e);
                      }),
                      n);
                };
                (N.flatten = function (e, t) {
                  return M(e, t, []);
                }),
                  (N.without = function (e) {
                    return N.difference(e, f.call(arguments, 1));
                  }),
                  (N.partition = function (e, t) {
                    var n = [],
                      r = [];
                    return (
                      C(e, function (e) {
                        (t(e) ? n : r).push(e);
                      }),
                      [n, r]
                    );
                  }),
                  (N.uniq = N.unique =
                    function (e, t, n, r) {
                      N.isFunction(t) && ((r = n), (n = t), (t = !1));
                      var i = n ? N.map(e, n, r) : e,
                        s = [],
                        o = [];
                      return (
                        C(i, function (n, r) {
                          if (
                            t ? !r || o[o.length - 1] !== n : !N.contains(o, n)
                          )
                            o.push(n), s.push(e[r]);
                        }),
                        s
                      );
                    }),
                  (N.union = function () {
                    return N.uniq(N.flatten(arguments, !0));
                  }),
                  (N.intersection = function (e) {
                    var t = f.call(arguments, 1);
                    return N.filter(N.uniq(e), function (e) {
                      return N.every(t, function (t) {
                        return N.contains(t, e);
                      });
                    });
                  }),
                  (N.difference = function (e) {
                    var t = l.apply(s, f.call(arguments, 1));
                    return N.filter(e, function (e) {
                      return !N.contains(t, e);
                    });
                  }),
                  (N.zip = function () {
                    var e = N.max(N.pluck(arguments, "length").concat(0)),
                      t = new Array(e);
                    for (var n = 0; n < e; n++)
                      t[n] = N.pluck(arguments, "" + n);
                    return t;
                  }),
                  (N.object = function (e, t) {
                    if (e == null) return {};
                    var n = {};
                    for (var r = 0, i = e.length; r < i; r++)
                      t ? (n[e[r]] = t[r]) : (n[e[r][0]] = e[r][1]);
                    return n;
                  }),
                  (N.indexOf = function (e, t, n) {
                    if (e == null) return -1;
                    var r = 0,
                      i = e.length;
                    if (n) {
                      if (typeof n != "number")
                        return (r = N.sortedIndex(e, t)), e[r] === t ? r : -1;
                      r = n < 0 ? Math.max(0, i + n) : n;
                    }
                    if (w && e.indexOf === w) return e.indexOf(t, n);
                    for (; r < i; r++) if (e[r] === t) return r;
                    return -1;
                  }),
                  (N.lastIndexOf = function (e, t, n) {
                    if (e == null) return -1;
                    var r = n != null;
                    if (E && e.lastIndexOf === E)
                      return r ? e.lastIndexOf(t, n) : e.lastIndexOf(t);
                    var i = r ? n : e.length;
                    while (i--) if (e[i] === t) return i;
                    return -1;
                  }),
                  (N.range = function (e, t, n) {
                    arguments.length <= 1 && ((t = e || 0), (e = 0)),
                      (n = arguments[2] || 1);
                    var r = Math.max(Math.ceil((t - e) / n), 0),
                      i = 0,
                      s = new Array(r);
                    while (i < r) (s[i++] = e), (e += n);
                    return s;
                  });
                var _ = function () {};
                (N.bind = function (e, t) {
                  var n, r;
                  if (T && e.bind === T)
                    return T.apply(e, f.call(arguments, 1));
                  if (!N.isFunction(e)) throw new TypeError();
                  return (
                    (n = f.call(arguments, 2)),
                    (r = function () {
                      if (this instanceof r) {
                        _.prototype = e.prototype;
                        var i = new _();
                        _.prototype = null;
                        var s = e.apply(i, n.concat(f.call(arguments)));
                        return Object(s) === s ? s : i;
                      }
                      return e.apply(t, n.concat(f.call(arguments)));
                    })
                  );
                }),
                  (N.partial = function (e) {
                    var t = f.call(arguments, 1);
                    return function () {
                      var n = 0,
                        r = t.slice();
                      for (var i = 0, s = r.length; i < s; i++)
                        r[i] === N && (r[i] = arguments[n++]);
                      while (n < arguments.length) r.push(arguments[n++]);
                      return e.apply(this, r);
                    };
                  }),
                  (N.bindAll = function (e) {
                    var t = f.call(arguments, 1);
                    if (t.length === 0)
                      throw new Error("bindAll must be passed function names");
                    return (
                      C(t, function (t) {
                        e[t] = N.bind(e[t], e);
                      }),
                      e
                    );
                  }),
                  (N.memoize = function (e, t) {
                    var n = {};
                    return (
                      t || (t = N.identity),
                      function () {
                        var r = t.apply(this, arguments);
                        return N.has(n, r)
                          ? n[r]
                          : (n[r] = e.apply(this, arguments));
                      }
                    );
                  }),
                  (N.delay = function (e, t) {
                    var n = f.call(arguments, 2);
                    return setTimeout(function () {
                      return e.apply(null, n);
                    }, t);
                  }),
                  (N.defer = function (e) {
                    return N.delay.apply(
                      N,
                      [e, 1].concat(f.call(arguments, 1))
                    );
                  }),
                  (N.throttle = function (e, t, n) {
                    var r,
                      i,
                      s,
                      o = null,
                      u = 0;
                    n || (n = {});
                    var a = function () {
                      (u = n.leading === !1 ? 0 : N.now()),
                        (o = null),
                        (s = e.apply(r, i)),
                        (r = i = null);
                    };
                    return function () {
                      var f = N.now();
                      !u && n.leading === !1 && (u = f);
                      var l = t - (f - u);
                      return (
                        (r = this),
                        (i = arguments),
                        l <= 0
                          ? (clearTimeout(o),
                            (o = null),
                            (u = f),
                            (s = e.apply(r, i)),
                            (r = i = null))
                          : !o && n.trailing !== !1 && (o = setTimeout(a, l)),
                        s
                      );
                    };
                  }),
                  (N.debounce = function (e, t, n) {
                    var r,
                      i,
                      s,
                      o,
                      u,
                      a = function () {
                        var f = N.now() - o;
                        f < t
                          ? (r = setTimeout(a, t - f))
                          : ((r = null),
                            n || ((u = e.apply(s, i)), (s = i = null)));
                      };
                    return function () {
                      (s = this), (i = arguments), (o = N.now());
                      var f = n && !r;
                      return (
                        r || (r = setTimeout(a, t)),
                        f && ((u = e.apply(s, i)), (s = i = null)),
                        u
                      );
                    };
                  }),
                  (N.once = function (e) {
                    var t = !1,
                      n;
                    return function () {
                      return t
                        ? n
                        : ((t = !0),
                          (n = e.apply(this, arguments)),
                          (e = null),
                          n);
                    };
                  }),
                  (N.wrap = function (e, t) {
                    return N.partial(t, e);
                  }),
                  (N.compose = function () {
                    var e = arguments;
                    return function () {
                      var t = arguments;
                      for (var n = e.length - 1; n >= 0; n--)
                        t = [e[n].apply(this, t)];
                      return t[0];
                    };
                  }),
                  (N.after = function (e, t) {
                    return function () {
                      if (--e < 1) return t.apply(this, arguments);
                    };
                  }),
                  (N.keys = function (e) {
                    if (!N.isObject(e)) return [];
                    if (x) return x(e);
                    var t = [];
                    for (var n in e) N.has(e, n) && t.push(n);
                    return t;
                  }),
                  (N.values = function (e) {
                    var t = N.keys(e),
                      n = t.length,
                      r = new Array(n);
                    for (var i = 0; i < n; i++) r[i] = e[t[i]];
                    return r;
                  }),
                  (N.pairs = function (e) {
                    var t = N.keys(e),
                      n = t.length,
                      r = new Array(n);
                    for (var i = 0; i < n; i++) r[i] = [t[i], e[t[i]]];
                    return r;
                  }),
                  (N.invert = function (e) {
                    var t = {},
                      n = N.keys(e);
                    for (var r = 0, i = n.length; r < i; r++) t[e[n[r]]] = n[r];
                    return t;
                  }),
                  (N.functions = N.methods =
                    function (e) {
                      var t = [];
                      for (var n in e) N.isFunction(e[n]) && t.push(n);
                      return t.sort();
                    }),
                  (N.extend = function (e) {
                    return (
                      C(f.call(arguments, 1), function (t) {
                        if (t) for (var n in t) e[n] = t[n];
                      }),
                      e
                    );
                  }),
                  (N.pick = function (e) {
                    var t = {},
                      n = l.apply(s, f.call(arguments, 1));
                    return (
                      C(n, function (n) {
                        n in e && (t[n] = e[n]);
                      }),
                      t
                    );
                  }),
                  (N.omit = function (e) {
                    var t = {},
                      n = l.apply(s, f.call(arguments, 1));
                    for (var r in e) N.contains(n, r) || (t[r] = e[r]);
                    return t;
                  }),
                  (N.defaults = function (e) {
                    return (
                      C(f.call(arguments, 1), function (t) {
                        if (t)
                          for (var n in t) e[n] === void 0 && (e[n] = t[n]);
                      }),
                      e
                    );
                  }),
                  (N.clone = function (e) {
                    return N.isObject(e)
                      ? N.isArray(e)
                        ? e.slice()
                        : N.extend({}, e)
                      : e;
                  }),
                  (N.tap = function (e, t) {
                    return t(e), e;
                  });
                var D = function (e, t, n, r) {
                  if (e === t) return e !== 0 || 1 / e == 1 / t;
                  if (e == null || t == null) return e === t;
                  e instanceof N && (e = e._wrapped),
                    t instanceof N && (t = t._wrapped);
                  var i = c.call(e);
                  if (i != c.call(t)) return !1;
                  switch (i) {
                    case "[object String]":
                      return e == String(t);
                    case "[object Number]":
                      return e != +e
                        ? t != +t
                        : e == 0
                        ? 1 / e == 1 / t
                        : e == +t;
                    case "[object Date]":
                    case "[object Boolean]":
                      return +e == +t;
                    case "[object RegExp]":
                      return (
                        e.source == t.source &&
                        e.global == t.global &&
                        e.multiline == t.multiline &&
                        e.ignoreCase == t.ignoreCase
                      );
                  }
                  if (typeof e != "object" || typeof t != "object") return !1;
                  var s = n.length;
                  while (s--) if (n[s] == e) return r[s] == t;
                  var o = e.constructor,
                    u = t.constructor;
                  if (
                    o !== u &&
                    !(
                      N.isFunction(o) &&
                      o instanceof o &&
                      N.isFunction(u) &&
                      u instanceof u
                    ) &&
                    "constructor" in e &&
                    "constructor" in t
                  )
                    return !1;
                  n.push(e), r.push(t);
                  var a = 0,
                    f = !0;
                  if (i == "[object Array]") {
                    (a = e.length), (f = a == t.length);
                    if (f) while (a--) if (!(f = D(e[a], t[a], n, r))) break;
                  } else {
                    for (var l in e)
                      if (N.has(e, l)) {
                        a++;
                        if (!(f = N.has(t, l) && D(e[l], t[l], n, r))) break;
                      }
                    if (f) {
                      for (l in t) if (N.has(t, l) && !a--) break;
                      f = !a;
                    }
                  }
                  return n.pop(), r.pop(), f;
                };
                (N.isEqual = function (e, t) {
                  return D(e, t, [], []);
                }),
                  (N.isEmpty = function (e) {
                    if (e == null) return !0;
                    if (N.isArray(e) || N.isString(e)) return e.length === 0;
                    for (var t in e) if (N.has(e, t)) return !1;
                    return !0;
                  }),
                  (N.isElement = function (e) {
                    return !!e && e.nodeType === 1;
                  }),
                  (N.isArray =
                    S ||
                    function (e) {
                      return c.call(e) == "[object Array]";
                    }),
                  (N.isObject = function (e) {
                    return e === Object(e);
                  }),
                  C(
                    [
                      "Arguments",
                      "Function",
                      "String",
                      "Number",
                      "Date",
                      "RegExp",
                    ],
                    function (e) {
                      N["is" + e] = function (t) {
                        return c.call(t) == "[object " + e + "]";
                      };
                    }
                  ),
                  N.isArguments(arguments) ||
                    (N.isArguments = function (e) {
                      return !!e && !!N.has(e, "callee");
                    }),
                  typeof /./ != "function" &&
                    (N.isFunction = function (e) {
                      return typeof e == "function";
                    }),
                  (N.isFinite = function (e) {
                    return isFinite(e) && !isNaN(parseFloat(e));
                  }),
                  (N.isNaN = function (e) {
                    return N.isNumber(e) && e != +e;
                  }),
                  (N.isBoolean = function (e) {
                    return (
                      e === !0 || e === !1 || c.call(e) == "[object Boolean]"
                    );
                  }),
                  (N.isNull = function (e) {
                    return e === null;
                  }),
                  (N.isUndefined = function (e) {
                    return e === void 0;
                  }),
                  (N.has = function (e, t) {
                    return h.call(e, t);
                  }),
                  (N.noConflict = function () {
                    return (e._ = r), this;
                  }),
                  (N.identity = function (e) {
                    return e;
                  }),
                  (N.constant = function (e) {
                    return function () {
                      return e;
                    };
                  }),
                  (N.property = function (e) {
                    return function (t) {
                      return t[e];
                    };
                  }),
                  (N.matches = function (e) {
                    return function (t) {
                      if (t === e) return !0;
                      for (var n in e) if (e[n] !== t[n]) return !1;
                      return !0;
                    };
                  }),
                  (N.times = function (e, t, n) {
                    var r = Array(Math.max(0, e));
                    for (var i = 0; i < e; i++) r[i] = t.call(n, i);
                    return r;
                  }),
                  (N.random = function (e, t) {
                    return (
                      t == null && ((t = e), (e = 0)),
                      e + Math.floor(Math.random() * (t - e + 1))
                    );
                  }),
                  (N.now =
                    Date.now ||
                    function () {
                      return new Date().getTime();
                    });
                var P = {
                  escape: {
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    '"': "&quot;",
                    "'": "&#x27;",
                  },
                };
                P.unescape = N.invert(P.escape);
                var H = {
                  escape: new RegExp(
                    "[" + N.keys(P.escape).join("") + "]",
                    "g"
                  ),
                  unescape: new RegExp(
                    "(" + N.keys(P.unescape).join("|") + ")",
                    "g"
                  ),
                };
                N.each(["escape", "unescape"], function (e) {
                  N[e] = function (t) {
                    return t == null
                      ? ""
                      : ("" + t).replace(H[e], function (t) {
                          return P[e][t];
                        });
                  };
                }),
                  (N.result = function (e, t) {
                    if (e == null) return void 0;
                    var n = e[t];
                    return N.isFunction(n) ? n.call(e) : n;
                  }),
                  (N.mixin = function (e) {
                    C(N.functions(e), function (t) {
                      var n = (N[t] = e[t]);
                      N.prototype[t] = function () {
                        var e = [this._wrapped];
                        return (
                          a.apply(e, arguments), q.call(this, n.apply(N, e))
                        );
                      };
                    });
                  });
                var B = 0;
                (N.uniqueId = function (e) {
                  var t = ++B + "";
                  return e ? e + t : t;
                }),
                  (N.templateSettings = {
                    evaluate: /<%([\s\S]+?)%>/g,
                    interpolate: /<%=([\s\S]+?)%>/g,
                    escape: /<%-([\s\S]+?)%>/g,
                  });
                var j = /(.)^/,
                  F = {
                    "'": "'",
                    "\\": "\\",
                    "\r": "r",
                    "\n": "n",
                    "	": "t",
                    "\u2028": "u2028",
                    "\u2029": "u2029",
                  },
                  I = /\\|'|\r|\n|\t|\u2028|\u2029/g;
                (N.template = function (e, t, n) {
                  var r;
                  n = N.defaults({}, n, N.templateSettings);
                  var i = new RegExp(
                      [
                        (n.escape || j).source,
                        (n.interpolate || j).source,
                        (n.evaluate || j).source,
                      ].join("|") + "|$",
                      "g"
                    ),
                    s = 0,
                    o = "__p+='";
                  e.replace(i, function (t, n, r, i, u) {
                    return (
                      (o += e.slice(s, u).replace(I, function (e) {
                        return "\\" + F[e];
                      })),
                      n &&
                        (o +=
                          "'+\n((__t=(" + n + "))==null?'':_.escape(__t))+\n'"),
                      r && (o += "'+\n((__t=(" + r + "))==null?'':__t)+\n'"),
                      i && (o += "';\n" + i + "\n__p+='"),
                      (s = u + t.length),
                      t
                    );
                  }),
                    (o += "';\n"),
                    n.variable || (o = "with(obj||{}){\n" + o + "}\n"),
                    (o =
                      "var __t,__p='',__j=Array.prototype.join,print=function(){__p+=__j.call(arguments,'');};\n" +
                      o +
                      "return __p;\n");
                  try {
                    r = new Function(n.variable || "obj", "_", o);
                  } catch (u) {
                    throw ((u.source = o), u);
                  }
                  if (t) return r(t, N);
                  var a = function (e) {
                    return r.call(this, e, N);
                  };
                  return (
                    (a.source =
                      "function(" + (n.variable || "obj") + "){\n" + o + "}"),
                    a
                  );
                }),
                  (N.chain = function (e) {
                    return N(e).chain();
                  });
                var q = function (e) {
                  return this._chain ? N(e).chain() : e;
                };
                N.mixin(N),
                  C(
                    [
                      "pop",
                      "push",
                      "reverse",
                      "shift",
                      "sort",
                      "splice",
                      "unshift",
                    ],
                    function (e) {
                      var t = s[e];
                      N.prototype[e] = function () {
                        var n = this._wrapped;
                        return (
                          t.apply(n, arguments),
                          (e == "shift" || e == "splice") &&
                            n.length === 0 &&
                            delete n[0],
                          q.call(this, n)
                        );
                      };
                    }
                  ),
                  C(["concat", "join", "slice"], function (e) {
                    var t = s[e];
                    N.prototype[e] = function () {
                      return q.call(this, t.apply(this._wrapped, arguments));
                    };
                  }),
                  N.extend(N.prototype, {
                    chain: function () {
                      return (this._chain = !0), this;
                    },
                    value: function () {
                      return this._wrapped;
                    },
                  }),
                  typeof define == "function" &&
                    define.amd &&
                    ace.define("underscore", [], function () {
                      return N;
                    });
              }.call(this));
            },
            {},
          ],
          3: [
            function (e, t, n) {
              var r = e("underscore"),
                i = e("events"),
                s = e("./vars.js"),
                o = e("./messages.js"),
                u = e("./lex.js").Lexer,
                a = e("./reg.js"),
                f = e("./state.js").state,
                l = e("./style.js"),
                c = (function () {
                  "use strict";
                  function I(e, t) {
                    return (
                      (e = e.trim()),
                      /^[+-]W\d{3}$/g.test(e)
                        ? !0
                        : p[e] === undefined &&
                          h[e] === undefined &&
                          t.type !== "jslint" &&
                          !m[e]
                        ? (G("E001", t, e), !1)
                        : !0
                    );
                  }
                  function q(e) {
                    return (
                      Object.prototype.toString.call(e) === "[object String]"
                    );
                  }
                  function R(e, t) {
                    return e ? (!e.identifier || e.value !== t ? !1 : !0) : !1;
                  }
                  function U(e) {
                    if (!e.reserved) return !1;
                    var t = e.meta;
                    if (t && t.isFutureReservedWord && f.option.inES5()) {
                      if (!t.es5) return !1;
                      if (
                        t.strictOnly &&
                        !f.option.strict &&
                        !f.directive["use strict"]
                      )
                        return !1;
                      if (e.isProperty) return !1;
                    }
                    return !0;
                  }
                  function z(e, t) {
                    return e.replace(/\{([^{}]*)\}/g, function (e, n) {
                      var r = t[n];
                      return typeof r == "string" || typeof r == "number"
                        ? r
                        : e;
                    });
                  }
                  function W(e, t) {
                    Object.keys(t).forEach(function (n) {
                      if (r.has(c.blacklist, n)) return;
                      e[n] = t[n];
                    });
                  }
                  function X() {
                    f.option.esnext && W(M, s.newEcmaIdentifiers),
                      f.option.couch && W(M, s.couch),
                      f.option.qunit && W(M, s.qunit),
                      f.option.rhino && W(M, s.rhino),
                      f.option.shelljs && (W(M, s.shelljs), W(M, s.node)),
                      f.option.typed && W(M, s.typed),
                      f.option.phantom && W(M, s.phantom),
                      f.option.prototypejs && W(M, s.prototypejs),
                      f.option.node && (W(M, s.node), W(M, s.typed)),
                      f.option.devel && W(M, s.devel),
                      f.option.dojo && W(M, s.dojo),
                      f.option.browser && (W(M, s.browser), W(M, s.typed)),
                      f.option.nonstandard && W(M, s.nonstandard),
                      f.option.jasmine && W(M, s.jasmine),
                      f.option.jquery && W(M, s.jquery),
                      f.option.mootools && W(M, s.mootools),
                      f.option.worker && W(M, s.worker),
                      f.option.wsh && W(M, s.wsh),
                      f.option.globalstrict &&
                        f.option.strict !== !1 &&
                        (f.option.strict = !0),
                      f.option.yui && W(M, s.yui),
                      f.option.mocha && W(M, s.mocha),
                      (f.option.inMoz = function (e) {
                        return f.option.moz;
                      }),
                      (f.option.inESNext = function (e) {
                        return f.option.moz || f.option.esnext;
                      }),
                      (f.option.inES5 = function () {
                        return !f.option.es3;
                      }),
                      (f.option.inES3 = function (e) {
                        return e
                          ? !f.option.moz && !f.option.esnext && f.option.es3
                          : f.option.es3;
                      });
                  }
                  function V(e, t, n) {
                    var r = Math.floor((t / f.lines.length) * 100),
                      i = o.errors[e].desc;
                    throw {
                      name: "JSHintError",
                      line: t,
                      character: n,
                      message: i + " (" + r + "% scanned).",
                      raw: i,
                      code: e,
                    };
                  }
                  function $(e, t, n, r) {
                    return c.undefs.push([e, t, n, r]);
                  }
                  function J() {
                    var e = f.ignoredLines;
                    if (r.isEmpty(e)) return;
                    c.errors = r.reject(c.errors, function (t) {
                      return e[t.line];
                    });
                  }
                  function K(e, t, n, r, i, s) {
                    var u, a, l, h;
                    if (/^W\d{3}$/.test(e)) {
                      if (f.ignored[e]) return;
                      h = o.warnings[e];
                    } else
                      /E\d{3}/.test(e)
                        ? (h = o.errors[e])
                        : /I\d{3}/.test(e) && (h = o.info[e]);
                    return (
                      (t = t || f.tokens.next),
                      t.id === "(end)" && (t = f.tokens.curr),
                      (a = t.line || 0),
                      (u = t.from || 0),
                      (l = {
                        id: "(error)",
                        raw: h.desc,
                        code: h.code,
                        evidence: f.lines[a - 1] || "",
                        line: a,
                        character: u,
                        scope: c.scope,
                        a: n,
                        b: r,
                        c: i,
                        d: s,
                      }),
                      (l.reason = z(h.desc, l)),
                      c.errors.push(l),
                      J(),
                      c.errors.length >= f.option.maxerr && V("E043", a, u),
                      l
                    );
                  }
                  function Q(e, t, n, r, i, s, o) {
                    return K(e, { line: t, from: n }, r, i, s, o);
                  }
                  function G(e, t, n, r, i, s) {
                    K(e, t, n, r, i, s);
                  }
                  function Y(e, t, n, r, i, s, o) {
                    return G(e, { line: t, from: n }, r, i, s, o);
                  }
                  function Z(e, t) {
                    var n;
                    return (
                      (n = { id: "(internal)", elem: e, value: t }),
                      c.internals.push(n),
                      n
                    );
                  }
                  function et(e, t) {
                    t = t || {};
                    var n = t.type,
                      i = t.token,
                      s = t.islet;
                    n === "exception" &&
                      r.has(w["(context)"], e) &&
                      w[e] !== !0 &&
                      !f.option.node &&
                      K("W002", f.tokens.next, e),
                      r.has(w, e) &&
                        !w["(global)"] &&
                        (w[e] === !0
                          ? f.option.latedef &&
                            ((f.option.latedef === !0 &&
                              r.contains([w[e], n], "unction")) ||
                              !r.contains([w[e], n], "unction")) &&
                            K("W003", f.tokens.next, e)
                          : (((!f.option.shadow ||
                              r.contains(
                                ["inner", "outer"],
                                f.option.shadow
                              )) &&
                              n !== "exception") ||
                              w["(blockscope)"].getlabel(e)) &&
                            K("W004", f.tokens.next, e)),
                      w["(context)"] &&
                        r.has(w["(context)"], e) &&
                        n !== "function" &&
                        f.option.shadow === "outer" &&
                        K("W123", f.tokens.next, e),
                      s
                        ? w["(blockscope)"].current.add(e, n, f.tokens.curr)
                        : (w["(blockscope)"].shadow(e),
                          (w[e] = n),
                          i && (w["(tokens)"][e] = i),
                          Xt(w, e, { unused: t.unused || !1 }),
                          w["(global)"]
                            ? ((S[e] = w),
                              r.has(x, e) &&
                                (f.option.latedef &&
                                  ((f.option.latedef === !0 &&
                                    r.contains([w[e], n], "unction")) ||
                                    !r.contains([w[e], n], "unction")) &&
                                  K("W003", f.tokens.next, e),
                                delete x[e]))
                            : (D[e] = w));
                  }
                  function tt() {
                    var e = f.tokens.next,
                      t = e.body.match(
                        /(-\s+)?[^\s,:]+(?:\s*:\s*(-\s+)?[^\s,]+)?/g
                      ),
                      n = {};
                    if (e.type === "globals") {
                      t.forEach(function (e) {
                        e = e.split(":");
                        var t = (e[0] || "").trim(),
                          r = (e[1] || "").trim();
                        t.charAt(0) === "-"
                          ? ((t = t.slice(1)),
                            (r = !1),
                            (c.blacklist[t] = t),
                            delete M[t])
                          : (n[t] = r === "true");
                      }),
                        W(M, n);
                      for (var i in n) r.has(n, i) && (g[i] = e);
                    }
                    e.type === "exported" &&
                      t.forEach(function (e) {
                        y[e] = !0;
                      }),
                      e.type === "members" &&
                        ((A = A || {}),
                        t.forEach(function (e) {
                          var t = e.charAt(0),
                            n = e.charAt(e.length - 1);
                          t === n &&
                            (t === '"' || t === "'") &&
                            (e = e.substr(1, e.length - 2).replace('\\"', '"')),
                            (A[e] = !1);
                        }));
                    var s = [
                      "maxstatements",
                      "maxparams",
                      "maxdepth",
                      "maxcomplexity",
                      "maxerr",
                      "maxlen",
                      "indent",
                    ];
                    if (e.type === "jshint" || e.type === "jslint")
                      t.forEach(function (t) {
                        t = t.split(":");
                        var n = (t[0] || "").trim(),
                          r = (t[1] || "").trim();
                        if (!I(n, e)) return;
                        if (s.indexOf(n) >= 0) {
                          if (r !== "false") {
                            r = +r;
                            if (
                              typeof r != "number" ||
                              !isFinite(r) ||
                              r <= 0 ||
                              Math.floor(r) !== r
                            ) {
                              G("E032", e, t[1].trim());
                              return;
                            }
                            f.option[n] = r;
                          } else f.option[n] = n === "indent" ? 4 : !1;
                          return;
                        }
                        if (n === "validthis") {
                          if (w["(global)"]) return void G("E009");
                          if (r !== "true" && r !== "false")
                            return void G("E002", e);
                          f.option.validthis = r === "true";
                          return;
                        }
                        if (n === "quotmark") {
                          switch (r) {
                            case "true":
                            case "false":
                              f.option.quotmark = r === "true";
                              break;
                            case "double":
                            case "single":
                              f.option.quotmark = r;
                              break;
                            default:
                              G("E002", e);
                          }
                          return;
                        }
                        if (n === "shadow") {
                          switch (r) {
                            case "true":
                              f.option.shadow = !0;
                              break;
                            case "outer":
                              f.option.shadow = "outer";
                              break;
                            case "false":
                            case "inner":
                              f.option.shadow = "inner";
                              break;
                            default:
                              G("E002", e);
                          }
                          return;
                        }
                        if (n === "unused") {
                          switch (r) {
                            case "true":
                              f.option.unused = !0;
                              break;
                            case "false":
                              f.option.unused = !1;
                              break;
                            case "vars":
                            case "strict":
                              f.option.unused = r;
                              break;
                            default:
                              G("E002", e);
                          }
                          return;
                        }
                        if (n === "latedef") {
                          switch (r) {
                            case "true":
                              f.option.latedef = !0;
                              break;
                            case "false":
                              f.option.latedef = !1;
                              break;
                            case "nofunc":
                              f.option.latedef = "nofunc";
                              break;
                            default:
                              G("E002", e);
                          }
                          return;
                        }
                        if (n === "ignore") {
                          switch (r) {
                            case "start":
                              f.ignoreLinterErrors = !0;
                              break;
                            case "end":
                              f.ignoreLinterErrors = !1;
                              break;
                            case "line":
                              (f.ignoredLines[e.line] = !0), J();
                              break;
                            default:
                              G("E002", e);
                          }
                          return;
                        }
                        var i = /^([+-])(W\d{3})$/g.exec(n);
                        if (i) {
                          f.ignored[i[2]] = i[1] === "-";
                          return;
                        }
                        var o;
                        if (r === "true" || r === "false") {
                          e.type === "jslint"
                            ? ((o = v[n] || n),
                              (f.option[o] = r === "true"),
                              d[o] !== undefined &&
                                (f.option[o] = !f.option[o]))
                            : (f.option[n] = r === "true"),
                            n === "newcap" &&
                              (f.option["(explicitNewcap)"] = !0);
                          return;
                        }
                        G("E002", e);
                      }),
                        X();
                  }
                  function nt(e) {
                    var t = e || 0,
                      n = 0,
                      r;
                    while (n <= t)
                      (r = C[n]), r || (r = C[n] = k.token()), (n += 1);
                    return r;
                  }
                  function rt(t, n) {
                    switch (f.tokens.curr.id) {
                      case "(number)":
                        f.tokens.next.id === "." && K("W005", f.tokens.curr);
                        break;
                      case "-":
                        (f.tokens.next.id === "-" ||
                          f.tokens.next.id === "--") &&
                          K("W006");
                        break;
                      case "+":
                        (f.tokens.next.id === "+" ||
                          f.tokens.next.id === "++") &&
                          K("W007");
                    }
                    if (
                      f.tokens.curr.type === "(string)" ||
                      f.tokens.curr.identifier
                    )
                      e = f.tokens.curr.value;
                    t &&
                      f.tokens.next.id !== t &&
                      (n
                        ? f.tokens.next.id === "(end)"
                          ? G("E019", n, n.id)
                          : G(
                              "E020",
                              f.tokens.next,
                              t,
                              n.id,
                              n.line,
                              f.tokens.next.value
                            )
                        : (f.tokens.next.type !== "(identifier)" ||
                            f.tokens.next.value !== t) &&
                          K("W116", f.tokens.next, t, f.tokens.next.value)),
                      (f.tokens.prev = f.tokens.curr),
                      (f.tokens.curr = f.tokens.next);
                    for (;;) {
                      (f.tokens.next = C.shift() || k.token()),
                        f.tokens.next || V("E041", f.tokens.curr.line);
                      if (
                        f.tokens.next.id === "(end)" ||
                        f.tokens.next.id === "(error)"
                      )
                        return;
                      f.tokens.next.check && f.tokens.next.check();
                      if (f.tokens.next.isSpecial) tt();
                      else if (f.tokens.next.id !== "(endline)") break;
                    }
                  }
                  function it(e) {
                    return e.infix || (!e.identifier && !!e.led);
                  }
                  function st() {
                    var e = f.tokens.curr,
                      t = f.tokens.next;
                    return t.id === ";" || t.id === "}" || t.id === ":"
                      ? !0
                      : it(t) === it(e) ||
                        (e.id === "yield" && f.option.inMoz(!0))
                      ? e.line !== t.line
                      : !1;
                  }
                  function ot(t, n) {
                    var i,
                      s = !1,
                      o = !1,
                      u = !1;
                    !n &&
                      f.tokens.next.value === "let" &&
                      nt(0).value === "(" &&
                      (f.option.inMoz(!0) ||
                        K("W118", f.tokens.next, "let expressions"),
                      (u = !0),
                      w["(blockscope)"].stack(),
                      rt("let"),
                      rt("("),
                      f.syntax.let.fud.call(f.syntax.let.fud, !1),
                      rt(")")),
                      f.tokens.next.id === "(end)" && G("E006", f.tokens.curr);
                    var a =
                      f.option.asi &&
                      f.tokens.prev.line < f.tokens.curr.line &&
                      r.contains(["]", ")"], f.tokens.prev.id) &&
                      r.contains(["[", "("], f.tokens.curr.id);
                    a && K("W014", f.tokens.curr, f.tokens.curr.id),
                      rt(),
                      n &&
                        ((e = "anonymous"),
                        (w["(verb)"] = f.tokens.curr.value));
                    if (n === !0 && f.tokens.curr.fud) i = f.tokens.curr.fud();
                    else {
                      f.tokens.curr.nud
                        ? (i = f.tokens.curr.nud())
                        : G("E030", f.tokens.curr, f.tokens.curr.id);
                      while (t < f.tokens.next.lbp && !st())
                        (s = f.tokens.curr.value === "Array"),
                          (o = f.tokens.curr.value === "Object"),
                          i &&
                            (i.value || (i.first && i.first.value)) &&
                            (i.value !== "new" ||
                              (i.first &&
                                i.first.value &&
                                i.first.value === ".")) &&
                            ((s = !1),
                            i.value !== f.tokens.curr.value && (o = !1)),
                          rt(),
                          s &&
                            f.tokens.curr.id === "(" &&
                            f.tokens.next.id === ")" &&
                            K("W009", f.tokens.curr),
                          o &&
                            f.tokens.curr.id === "(" &&
                            f.tokens.next.id === ")" &&
                            K("W010", f.tokens.curr),
                          i && f.tokens.curr.led
                            ? (i = f.tokens.curr.led(i))
                            : G("E033", f.tokens.curr, f.tokens.curr.id);
                    }
                    return u && w["(blockscope)"].unstack(), i;
                  }
                  function ut(e, t) {
                    (e = e || f.tokens.curr),
                      (t = t || f.tokens.next),
                      !f.option.laxbreak &&
                        e.line !== t.line &&
                        K("W014", t, t.value);
                  }
                  function at(e) {
                    (e = e || f.tokens.curr),
                      e.line !== f.tokens.next.line && K("E022", e, e.value);
                  }
                  function ft(e, t) {
                    e.line !== t.line &&
                      (f.option.laxcomma ||
                        (lt.first && (K("I001"), (lt.first = !1)),
                        K("W014", e, t.value)));
                  }
                  function lt(e) {
                    (e = e || {}),
                      e.peek
                        ? ft(f.tokens.prev, f.tokens.curr)
                        : (ft(f.tokens.curr, f.tokens.next), rt(","));
                    if (
                      f.tokens.next.identifier &&
                      (!e.property || !f.option.inES5())
                    )
                      switch (f.tokens.next.value) {
                        case "break":
                        case "case":
                        case "catch":
                        case "continue":
                        case "default":
                        case "do":
                        case "else":
                        case "finally":
                        case "for":
                        case "if":
                        case "in":
                        case "instanceof":
                        case "return":
                        case "switch":
                        case "throw":
                        case "try":
                        case "var":
                        case "let":
                        case "while":
                        case "with":
                          return (
                            G("E024", f.tokens.next, f.tokens.next.value), !1
                          );
                      }
                    if (f.tokens.next.type === "(punctuator)")
                      switch (f.tokens.next.value) {
                        case "}":
                        case "]":
                        case ",":
                          if (e.allowTrailing) return !0;
                        case ")":
                          return (
                            G("E024", f.tokens.next, f.tokens.next.value), !1
                          );
                      }
                    return !0;
                  }
                  function ct(e, t) {
                    var n = f.syntax[e];
                    if (!n || typeof n != "object")
                      f.syntax[e] = n = { id: e, lbp: t, value: e };
                    return n;
                  }
                  function ht(e) {
                    return ct(e, 0);
                  }
                  function pt(e, t) {
                    var n = ht(e);
                    return (n.identifier = n.reserved = !0), (n.fud = t), n;
                  }
                  function dt(e, t) {
                    var n = pt(e, t);
                    return (n.block = !0), n;
                  }
                  function vt(e) {
                    var t = e.id.charAt(0);
                    if ((t >= "a" && t <= "z") || (t >= "A" && t <= "Z"))
                      e.identifier = e.reserved = !0;
                    return e;
                  }
                  function mt(e, t) {
                    var n = ct(e, 150);
                    return (
                      vt(n),
                      (n.nud =
                        typeof t == "function"
                          ? t
                          : function () {
                              (this.right = ot(150)), (this.arity = "unary");
                              if (this.id === "++" || this.id === "--")
                                f.option.plusplus
                                  ? K("W016", this, this.id)
                                  : this.right &&
                                    (!this.right.identifier || U(this.right)) &&
                                    this.right.id !== "." &&
                                    this.right.id !== "[" &&
                                    K("W017", this);
                              return this;
                            }),
                      n
                    );
                  }
                  function gt(e, t) {
                    var n = ht(e);
                    return (n.type = e), (n.nud = t), n;
                  }
                  function yt(e, t) {
                    var n = gt(e, t);
                    return (n.identifier = !0), (n.reserved = !0), n;
                  }
                  function bt(e, t) {
                    var n = gt(
                      e,
                      (t && t.nud) ||
                        function () {
                          return this;
                        }
                    );
                    return (
                      (t = t || {}),
                      (t.isFutureReservedWord = !0),
                      (n.value = e),
                      (n.identifier = !0),
                      (n.reserved = !0),
                      (n.meta = t),
                      n
                    );
                  }
                  function wt(e, t) {
                    return yt(e, function () {
                      return typeof t == "function" && t(this), this;
                    });
                  }
                  function Et(e, t, n, r) {
                    var i = ct(e, n);
                    return (
                      vt(i),
                      (i.infix = !0),
                      (i.led = function (i) {
                        return (
                          r || ut(f.tokens.prev, f.tokens.curr),
                          e === "in" && i.id === "!" && K("W018", i, "!"),
                          typeof t == "function"
                            ? t(i, this)
                            : ((this.left = i), (this.right = ot(n)), this)
                        );
                      }),
                      i
                    );
                  }
                  function St(e) {
                    var t = ct(e, 42);
                    return (
                      (t.led = function (e) {
                        return (
                          f.option.inESNext() ||
                            K(
                              "W104",
                              f.tokens.curr,
                              "arrow function syntax (=>)"
                            ),
                          ut(f.tokens.prev, f.tokens.curr),
                          (this.left = e),
                          (this.right = Jt(undefined, undefined, !1, e)),
                          this
                        );
                      }),
                      t
                    );
                  }
                  function xt(e, t) {
                    var n = ct(e, 100);
                    return (
                      (n.led = function (e) {
                        ut(f.tokens.prev, f.tokens.curr);
                        var n = ot(100);
                        return (
                          R(e, "NaN") || R(n, "NaN")
                            ? K("W019", this)
                            : t && t.apply(this, [e, n]),
                          (!e || !n) && V("E041", f.tokens.curr.line),
                          e.id === "!" && K("W018", e, "!"),
                          n.id === "!" && K("W018", n, "!"),
                          (this.left = e),
                          (this.right = n),
                          this
                        );
                      }),
                      n
                    );
                  }
                  function Tt(e) {
                    return (
                      e &&
                      ((e.type === "(number)" && +e.value === 0) ||
                        (e.type === "(string)" && e.value === "") ||
                        (e.type === "null" && !f.option.eqnull) ||
                        e.type === "true" ||
                        e.type === "false" ||
                        e.type === "undefined")
                    );
                  }
                  function Nt(e, t) {
                    if (f.option.notypeof) return !1;
                    if (!e || !t) return !1;
                    var n = [
                      "undefined",
                      "object",
                      "boolean",
                      "number",
                      "string",
                      "function",
                      "xml",
                      "object",
                      "unknown",
                    ];
                    return t.type === "(identifier)" &&
                      t.value === "typeof" &&
                      e.type === "(string)"
                      ? !r.contains(n, e.value)
                      : !1;
                  }
                  function Ct(e) {
                    function n(e) {
                      if (typeof e != "object") return;
                      return e.right === "prototype" ? e : n(e.left);
                    }
                    function r(e) {
                      while (!e.identifier && typeof e.left == "object")
                        e = e.left;
                      if (e.identifier && t.indexOf(e.value) >= 0)
                        return e.value;
                    }
                    var t = [
                        "Array",
                        "ArrayBuffer",
                        "Boolean",
                        "Collator",
                        "DataView",
                        "Date",
                        "DateTimeFormat",
                        "Error",
                        "EvalError",
                        "Float32Array",
                        "Float64Array",
                        "Function",
                        "Infinity",
                        "Intl",
                        "Int16Array",
                        "Int32Array",
                        "Int8Array",
                        "Iterator",
                        "Number",
                        "NumberFormat",
                        "Object",
                        "RangeError",
                        "ReferenceError",
                        "RegExp",
                        "StopIteration",
                        "String",
                        "SyntaxError",
                        "TypeError",
                        "Uint16Array",
                        "Uint32Array",
                        "Uint8Array",
                        "Uint8ClampedArray",
                        "URIError",
                      ],
                      i = n(e);
                    if (i) return r(i);
                  }
                  function kt(e, t, n) {
                    var r = Et(
                      e,
                      typeof t == "function"
                        ? t
                        : function (e, t) {
                            t.left = e;
                            if (e) {
                              if (f.option.freeze) {
                                var n = Ct(e);
                                n && K("W121", e, n);
                              }
                              M[e.value] === !1 && D[e.value]["(global)"] === !0
                                ? K("W020", e)
                                : e["function"] && K("W021", e, e.value),
                                w[e.value] === "const" && G("E013", e, e.value);
                              if (e.id === ".")
                                return (
                                  e.left
                                    ? e.left.value === "arguments" &&
                                      !f.directive["use strict"] &&
                                      K("E031", t)
                                    : K("E031", t),
                                  (t.right = ot(10)),
                                  t
                                );
                              if (e.id === "[")
                                return (
                                  f.tokens.curr.left.first
                                    ? f.tokens.curr.left.first.forEach(
                                        function (e) {
                                          e &&
                                            w[e.value] === "const" &&
                                            G("E013", e, e.value);
                                        }
                                      )
                                    : e.left
                                    ? e.left.value === "arguments" &&
                                      !f.directive["use strict"] &&
                                      K("E031", t)
                                    : K("E031", t),
                                  (t.right = ot(10)),
                                  t
                                );
                              if (e.identifier && !U(e))
                                return (
                                  w[e.value] === "exception" && K("W022", e),
                                  (t.right = ot(10)),
                                  t
                                );
                              e === f.syntax["function"] &&
                                K("W023", f.tokens.curr);
                            }
                            G("E031", t);
                          },
                      n
                    );
                    return (r.exps = !0), (r.assign = !0), r;
                  }
                  function Lt(e, t, n) {
                    var r = ct(e, n);
                    return (
                      vt(r),
                      (r.led =
                        typeof t == "function"
                          ? t
                          : function (e) {
                              return (
                                f.option.bitwise && K("W016", this, this.id),
                                (this.left = e),
                                (this.right = ot(n)),
                                this
                              );
                            }),
                      r
                    );
                  }
                  function At(e) {
                    return kt(
                      e,
                      function (e, t) {
                        f.option.bitwise && K("W016", t, t.id);
                        if (e)
                          return e.id === "." ||
                            e.id === "[" ||
                            (e.identifier && !U(e))
                            ? (ot(10), t)
                            : (e === f.syntax["function"] &&
                                K("W023", f.tokens.curr),
                              t);
                        G("E031", t);
                      },
                      20
                    );
                  }
                  function Ot(e) {
                    var t = ct(e, 150);
                    return (
                      (t.led = function (e) {
                        return (
                          f.option.plusplus
                            ? K("W016", this, this.id)
                            : (!e.identifier || U(e)) &&
                              e.id !== "." &&
                              e.id !== "[" &&
                              K("W017", this),
                          (this.left = e),
                          this
                        );
                      }),
                      t
                    );
                  }
                  function Mt(e, t) {
                    if (!f.tokens.next.identifier) return;
                    rt();
                    var n = f.tokens.curr,
                      r = f.tokens.curr.value;
                    return U(n)
                      ? t && f.option.inES5()
                        ? r
                        : e && r === "undefined"
                        ? r
                        : (K("W024", f.tokens.curr, f.tokens.curr.id), r)
                      : r;
                  }
                  function _t(e, t) {
                    var n = Mt(e, t);
                    if (n) return n;
                    f.tokens.curr.id === "function" && f.tokens.next.id === "("
                      ? K("W025")
                      : G("E030", f.tokens.next, f.tokens.next.value);
                  }
                  function Dt(e) {
                    var t = 0,
                      n;
                    if (f.tokens.next.id !== ";" || O) return;
                    for (;;) {
                      do (n = nt(t)), (t += 1);
                      while (n.id != "(end)" && n.id === "(comment)");
                      if (n.reach) return;
                      if (n.id !== "(endline)") {
                        if (n.id === "function") {
                          f.option.latedef === !0 && K("W026", n);
                          break;
                        }
                        K("W027", n, n.value, e);
                        break;
                      }
                    }
                  }
                  function Pt() {
                    f.tokens.next.id !== ";"
                      ? f.option.asi ||
                        ((!f.option.lastsemic ||
                          f.tokens.next.id !== "}" ||
                          f.tokens.next.line !== f.tokens.curr.line) &&
                          Q(
                            "W033",
                            f.tokens.curr.line,
                            f.tokens.curr.character
                          ))
                      : rt(";");
                  }
                  function Ht() {
                    var e,
                      t = N,
                      n,
                      i = D,
                      s = f.tokens.next;
                    if (s.id === ";") {
                      rt(";");
                      return;
                    }
                    var o = U(s);
                    o &&
                      s.meta &&
                      s.meta.isFutureReservedWord &&
                      nt().id === ":" &&
                      (K("W024", s, s.id), (o = !1));
                    if (
                      s.value === "module" &&
                      s.type === "(identifier)" &&
                      nt().type === "(identifier)"
                    ) {
                      f.option.inESNext() || K("W119", f.tokens.curr, "module"),
                        rt("module");
                      var u = _t();
                      et(u, { type: "unused", token: f.tokens.curr }),
                        rt("from"),
                        rt("(string)"),
                        Pt();
                      return;
                    }
                    if (r.has(["[", "{"], s.value) && on().isDestAssign) {
                      f.option.inESNext() ||
                        K("W104", f.tokens.curr, "destructuring expression"),
                        (e = Yt()),
                        e.forEach(function (e) {
                          $(w, "W117", e.token, e.id);
                        }),
                        rt("="),
                        Zt(e, ot(10, !0)),
                        rt(";");
                      return;
                    }
                    s.identifier &&
                      !o &&
                      nt().id === ":" &&
                      (rt(),
                      rt(":"),
                      (D = Object.create(i)),
                      et(s.value, { type: "label" }),
                      !f.tokens.next.labelled &&
                        f.tokens.next.value !== "{" &&
                        K("W028", f.tokens.next, s.value, f.tokens.next.value),
                      (f.tokens.next.label = s.value),
                      (s = f.tokens.next));
                    if (s.id === "{") {
                      var a =
                        w["(verb)"] === "case" && f.tokens.curr.value === ":";
                      Ft(!0, !0, !1, !1, a);
                      return;
                    }
                    return (
                      (n = ot(0, !0)),
                      n &&
                        (!n.identifier || n.value !== "function") &&
                        n.type !== "(punctuator)" &&
                        !f.directive["use strict"] &&
                        f.option.globalstrict &&
                        f.option.strict &&
                        K("E007"),
                      s.block ||
                        (!f.option.expr && (!n || !n.exps)
                          ? K("W030", f.tokens.curr)
                          : f.option.nonew &&
                            n &&
                            n.left &&
                            n.id === "(" &&
                            n.left.id === "new" &&
                            K("W031", s),
                        Pt()),
                      (N = t),
                      (D = i),
                      n
                    );
                  }
                  function Bt(e) {
                    var t = [],
                      n;
                    while (!f.tokens.next.reach && f.tokens.next.id !== "(end)")
                      f.tokens.next.id === ";"
                        ? ((n = nt()),
                          (!n || (n.id !== "(" && n.id !== "[")) && K("W032"),
                          rt(";"))
                        : t.push(Ht(e === f.tokens.next.line));
                    return t;
                  }
                  function jt() {
                    var e, t, n;
                    for (;;) {
                      if (f.tokens.next.id === "(string)") {
                        t = nt(0);
                        if (t.id === "(endline)") {
                          e = 1;
                          do (n = nt(e)), (e += 1);
                          while (n.id === "(endline)");
                          if (n.id !== ";") {
                            if (
                              n.id !== "(string)" &&
                              n.id !== "(number)" &&
                              n.id !== "(regexp)" &&
                              n.identifier !== !0 &&
                              n.id !== "}"
                            )
                              break;
                            K("W033", f.tokens.next);
                          } else t = n;
                        } else if (t.id === "}") K("W033", t);
                        else if (t.id !== ";") break;
                        rt(),
                          f.directive[f.tokens.curr.value] &&
                            K("W034", f.tokens.curr, f.tokens.curr.value),
                          f.tokens.curr.value === "use strict" &&
                            (f.option["(explicitNewcap)"] ||
                              (f.option.newcap = !0),
                            (f.option.undef = !0)),
                          (f.directive[f.tokens.curr.value] = !0),
                          t.id === ";" && rt(";");
                        continue;
                      }
                      break;
                    }
                  }
                  function Ft(e, t, n, i, s) {
                    var o,
                      u = T,
                      a = N,
                      l,
                      c = D,
                      h,
                      p,
                      d;
                    T = e;
                    if (!e || !f.option.funcscope) D = Object.create(D);
                    h = f.tokens.next;
                    var v = w["(metrics)"];
                    (v.nestedBlockDepth += 1),
                      v.verifyMaxNestedBlockDepthPerFunction();
                    if (f.tokens.next.id === "{") {
                      rt("{"),
                        w["(blockscope)"].stack(),
                        (p = f.tokens.curr.line);
                      if (f.tokens.next.id !== "}") {
                        N += f.option.indent;
                        while (!e && f.tokens.next.from > N)
                          N += f.option.indent;
                        if (n) {
                          l = {};
                          for (d in f.directive)
                            r.has(f.directive, d) && (l[d] = f.directive[d]);
                          jt(),
                            f.option.strict &&
                              w["(context)"]["(global)"] &&
                              !l["use strict"] &&
                              !f.directive["use strict"] &&
                              K("E007");
                        }
                        (o = Bt(p)),
                          (v.statementCount += o.length),
                          n && (f.directive = l),
                          (N -= f.option.indent);
                      }
                      rt("}", h), w["(blockscope)"].unstack(), (N = a);
                    } else if (!e)
                      if (n) {
                        (l = {}),
                          t &&
                            !i &&
                            !f.option.inMoz(!0) &&
                            G(
                              "W118",
                              f.tokens.curr,
                              "function closure expressions"
                            );
                        if (!t)
                          for (d in f.directive)
                            r.has(f.directive, d) && (l[d] = f.directive[d]);
                        ot(10),
                          f.option.strict &&
                            w["(context)"]["(global)"] &&
                            !l["use strict"] &&
                            !f.directive["use strict"] &&
                            K("E007");
                      } else G("E021", f.tokens.next, "{", f.tokens.next.value);
                    else
                      (w["(nolet)"] = !0),
                        (!t || f.option.curly) &&
                          K("W116", f.tokens.next, "{", f.tokens.next.value),
                        (O = !0),
                        (N += f.option.indent),
                        (o = [Ht()]),
                        (N -= f.option.indent),
                        (O = !1),
                        delete w["(nolet)"];
                    switch (w["(verb)"]) {
                      case "break":
                      case "continue":
                      case "return":
                      case "throw":
                        if (s) break;
                      default:
                        w["(verb)"] = null;
                    }
                    if (!e || !f.option.funcscope) D = c;
                    return (
                      (T = u),
                      e &&
                        f.option.noempty &&
                        (!o || o.length === 0) &&
                        K("W035"),
                      (v.nestedBlockDepth -= 1),
                      o
                    );
                  }
                  function It(e) {
                    A &&
                      typeof A[e] != "boolean" &&
                      K("W036", f.tokens.curr, e),
                      typeof L[e] == "number" ? (L[e] += 1) : (L[e] = 1);
                  }
                  function qt(e) {
                    var t = e.value,
                      n = Object.getOwnPropertyDescriptor(x, t);
                    n ? n.value.push(e.line) : (x[t] = [e.line]);
                  }
                  function Ut() {
                    var e = {};
                    (e.exps = !0), w["(comparray)"].stack();
                    var t = !1;
                    return (
                      f.tokens.next.value !== "for" &&
                        ((t = !0),
                        f.option.inMoz(!0) ||
                          K("W116", f.tokens.next, "for", f.tokens.next.value),
                        w["(comparray)"].setState("use"),
                        (e.right = ot(10))),
                      rt("for"),
                      f.tokens.next.value === "each" &&
                        (rt("each"),
                        f.option.inMoz(!0) ||
                          K("W118", f.tokens.curr, "for each")),
                      rt("("),
                      w["(comparray)"].setState("define"),
                      (e.left = ot(130)),
                      r.contains(["in", "of"], f.tokens.next.value)
                        ? rt()
                        : G("E045", f.tokens.curr),
                      w["(comparray)"].setState("generate"),
                      ot(10),
                      rt(")"),
                      f.tokens.next.value === "if" &&
                        (rt("if"),
                        rt("("),
                        w["(comparray)"].setState("filter"),
                        (e.filter = ot(10)),
                        rt(")")),
                      t ||
                        (w["(comparray)"].setState("use"), (e.right = ot(10))),
                      rt("]"),
                      w["(comparray)"].unstack(),
                      e
                    );
                  }
                  function zt() {
                    var e = Mt(!1, !0);
                    return (
                      e ||
                        (f.tokens.next.id === "(string)"
                          ? ((e = f.tokens.next.value), rt())
                          : f.tokens.next.id === "(number)" &&
                            ((e = f.tokens.next.value.toString()), rt())),
                      e === "hasOwnProperty" && K("W001"),
                      e
                    );
                  }
                  function Wt(e) {
                    var t,
                      n,
                      i = [],
                      s,
                      o = [],
                      u,
                      a = !1;
                    if (e) {
                      if (Array.isArray(e)) {
                        for (var l in e) {
                          t = e[l];
                          if (t.value === "...") {
                            f.option.inESNext() ||
                              K("W104", t, "spread/rest operator");
                            continue;
                          }
                          t.value !== "," &&
                            (i.push(t.value),
                            et(t.value, { type: "unused", token: t }));
                        }
                        return i;
                      }
                      if (e.identifier === !0)
                        return et(e.value, { type: "unused", token: e }), [e];
                    }
                    (n = f.tokens.next), rt("(");
                    if (f.tokens.next.id === ")") {
                      rt(")");
                      return;
                    }
                    for (;;) {
                      if (r.contains(["{", "["], f.tokens.next.id)) {
                        o = Yt();
                        for (u in o)
                          (u = o[u]),
                            u.id &&
                              (i.push(u.id),
                              et(u.id, { type: "unused", token: u.token }));
                      } else
                        f.tokens.next.value === "..."
                          ? (f.option.inESNext() ||
                              K("W104", f.tokens.next, "spread/rest operator"),
                            rt("..."),
                            (s = _t(!0)),
                            i.push(s),
                            et(s, { type: "unused", token: f.tokens.curr }))
                          : ((s = _t(!0)),
                            i.push(s),
                            et(s, { type: "unused", token: f.tokens.curr }));
                      a &&
                        f.tokens.next.id !== "=" &&
                        G("E051", f.tokens.current),
                        f.tokens.next.id === "=" &&
                          (f.option.inESNext() ||
                            K("W119", f.tokens.next, "default parameters"),
                          rt("="),
                          (a = !0),
                          ot(10));
                      if (f.tokens.next.id !== ",") return rt(")", n), i;
                      lt();
                    }
                  }
                  function Xt(e, t, n) {
                    e["(properties)"][t] ||
                      (e["(properties)"][t] = { unused: !1 }),
                      r.extend(e["(properties)"][t], n);
                  }
                  function Vt(e, t, n) {
                    return e["(properties)"][t]
                      ? e["(properties)"][t][n] || null
                      : null;
                  }
                  function $t(e, t, n, i) {
                    var s = {
                      "(name)": e,
                      "(breakage)": 0,
                      "(loopage)": 0,
                      "(scope)": n,
                      "(tokens)": {},
                      "(properties)": {},
                      "(catch)": !1,
                      "(global)": !1,
                      "(line)": null,
                      "(character)": null,
                      "(metrics)": null,
                      "(statement)": null,
                      "(context)": null,
                      "(blockscope)": null,
                      "(comparray)": null,
                      "(generator)": null,
                      "(params)": null,
                    };
                    return (
                      t &&
                        r.extend(s, {
                          "(line)": t.line,
                          "(character)": t.character,
                          "(metrics)": Kt(t),
                        }),
                      r.extend(s, i),
                      s["(context)"] &&
                        ((s["(blockscope)"] = s["(context)"]["(blockscope)"]),
                        (s["(comparray)"] = s["(context)"]["(comparray)"])),
                      s
                    );
                  }
                  function Jt(t, n, i, s) {
                    var o,
                      u = f.option,
                      a = f.ignored,
                      l = D;
                    return (
                      (f.option = Object.create(f.option)),
                      (f.ignored = Object.create(f.ignored)),
                      (D = Object.create(D)),
                      (w = $t(t || '"' + e + '"', f.tokens.next, D, {
                        "(statement)": n,
                        "(context)": w,
                        "(generator)": i ? !0 : null,
                      })),
                      (o = w),
                      (f.tokens.curr.funct = w),
                      E.push(w),
                      t && et(t, { type: "function" }),
                      (w["(params)"] = Wt(s)),
                      w["(metrics)"].verifyMaxParametersPerFunction(
                        w["(params)"]
                      ),
                      (c.undefs = r.filter(c.undefs, function (e) {
                        return !r.contains(r.union(s), e[2]);
                      })),
                      Ft(!1, !0, !0, s ? !0 : !1),
                      !f.option.noyield &&
                        i &&
                        w["(generator)"] !== "yielded" &&
                        K("W124", f.tokens.curr),
                      w["(metrics)"].verifyMaxStatementsPerFunction(),
                      w["(metrics)"].verifyMaxComplexityPerFunction(),
                      (w["(unusedOption)"] = f.option.unused),
                      (D = l),
                      (f.option = u),
                      (f.ignored = a),
                      (w["(last)"] = f.tokens.curr.line),
                      (w["(lastcharacter)"] = f.tokens.curr.character),
                      r.map(Object.keys(w), function (e) {
                        if (e[0] === "(") return;
                        w["(blockscope)"].unshadow(e);
                      }),
                      (w = w["(context)"]),
                      o
                    );
                  }
                  function Kt(e) {
                    return {
                      statementCount: 0,
                      nestedBlockDepth: -1,
                      ComplexityCount: 1,
                      verifyMaxStatementsPerFunction: function () {
                        f.option.maxstatements &&
                          this.statementCount > f.option.maxstatements &&
                          K("W071", e, this.statementCount);
                      },
                      verifyMaxParametersPerFunction: function (t) {
                        (t = t || []),
                          f.option.maxparams &&
                            t.length > f.option.maxparams &&
                            K("W072", e, t.length);
                      },
                      verifyMaxNestedBlockDepthPerFunction: function () {
                        f.option.maxdepth &&
                          this.nestedBlockDepth > 0 &&
                          this.nestedBlockDepth === f.option.maxdepth + 1 &&
                          K("W073", null, this.nestedBlockDepth);
                      },
                      verifyMaxComplexityPerFunction: function () {
                        var t = f.option.maxcomplexity,
                          n = this.ComplexityCount;
                        t && n > t && K("W074", e, n);
                      },
                    };
                  }
                  function Qt() {
                    w["(metrics)"].ComplexityCount += 1;
                  }
                  function Gt(e) {
                    var t, n;
                    e &&
                      ((t = e.id),
                      (n = e.paren),
                      t === "," &&
                        (e = e.exprs[e.exprs.length - 1]) &&
                        ((t = e.id), (n = n || e.paren)));
                    switch (t) {
                      case "=":
                      case "+=":
                      case "-=":
                      case "*=":
                      case "%=":
                      case "&=":
                      case "|=":
                      case "^=":
                      case "/=":
                        !n && !f.option.boss && K("W084");
                    }
                  }
                  function Yt() {
                    var e,
                      t,
                      n = [];
                    f.option.inESNext() ||
                      K("W104", f.tokens.curr, "destructuring expression");
                    var i = function () {
                      var e;
                      if (r.contains(["[", "{"], f.tokens.next.value)) {
                        t = Yt();
                        for (var s in t)
                          (s = t[s]), n.push({ id: s.id, token: s.token });
                      } else
                        f.tokens.next.value === ","
                          ? n.push({ id: null, token: f.tokens.curr })
                          : f.tokens.next.value === "("
                          ? (rt("("), i(), rt(")"))
                          : ((e = _t()),
                            e && n.push({ id: e, token: f.tokens.curr }));
                    };
                    if (f.tokens.next.value === "[") {
                      rt("["), i();
                      while (f.tokens.next.value !== "]") rt(","), i();
                      rt("]");
                    } else if (f.tokens.next.value === "{") {
                      rt("{"),
                        (e = _t()),
                        f.tokens.next.value === ":"
                          ? (rt(":"), i())
                          : n.push({ id: e, token: f.tokens.curr });
                      while (f.tokens.next.value !== "}")
                        rt(","),
                          (e = _t()),
                          f.tokens.next.value === ":"
                            ? (rt(":"), i())
                            : n.push({ id: e, token: f.tokens.curr });
                      rt("}");
                    }
                    return n;
                  }
                  function Zt(e, t) {
                    var n = t.first;
                    if (!n) return;
                    r.zip(e, Array.isArray(n) ? n : [n]).forEach(function (e) {
                      var t = e[0],
                        n = e[1];
                      t && n
                        ? (t.first = n)
                        : t &&
                          t.first &&
                          !n &&
                          K("W080", t.first, t.first.value);
                    });
                  }
                  function rn(e) {
                    return (
                      f.option.inESNext() || K("W104", f.tokens.curr, "class"),
                      e
                        ? ((this.name = _t()),
                          et(this.name, {
                            type: "unused",
                            token: f.tokens.curr,
                          }))
                        : f.tokens.next.identifier &&
                          f.tokens.next.value !== "extends" &&
                          (this.name = _t()),
                      sn(this),
                      this
                    );
                  }
                  function sn(e) {
                    var t = f.directive["use strict"];
                    f.tokens.next.value === "extends" &&
                      (rt("extends"), (e.heritage = ot(10))),
                      (f.directive["use strict"] = !0),
                      rt("{"),
                      (e.body = f.syntax["{"].nud(!0)),
                      (f.directive["use strict"] = t);
                  }
                  function un() {
                    var e = on();
                    e.notJson
                      ? (!f.option.inESNext() &&
                          e.isDestAssign &&
                          K("W104", f.tokens.curr, "destructuring assignment"),
                        Bt())
                      : ((f.option.laxbreak = !0), (f.jsonMode = !0), fn());
                  }
                  function fn() {
                    function e() {
                      var e = {},
                        t = f.tokens.next;
                      rt("{");
                      if (f.tokens.next.id !== "}")
                        for (;;) {
                          if (f.tokens.next.id === "(end)")
                            G("E026", f.tokens.next, t.line);
                          else {
                            if (f.tokens.next.id === "}") {
                              K("W094", f.tokens.curr);
                              break;
                            }
                            f.tokens.next.id === ","
                              ? G("E028", f.tokens.next)
                              : f.tokens.next.id !== "(string)" &&
                                K("W095", f.tokens.next, f.tokens.next.value);
                          }
                          e[f.tokens.next.value] === !0
                            ? K("W075", f.tokens.next, f.tokens.next.value)
                            : (f.tokens.next.value === "__proto__" &&
                                !f.option.proto) ||
                              (f.tokens.next.value === "__iterator__" &&
                                !f.option.iterator)
                            ? K("W096", f.tokens.next, f.tokens.next.value)
                            : (e[f.tokens.next.value] = !0),
                            rt(),
                            rt(":"),
                            fn();
                          if (f.tokens.next.id !== ",") break;
                          rt(",");
                        }
                      rt("}");
                    }
                    function t() {
                      var e = f.tokens.next;
                      rt("[");
                      if (f.tokens.next.id !== "]")
                        for (;;) {
                          if (f.tokens.next.id === "(end)")
                            G("E027", f.tokens.next, e.line);
                          else {
                            if (f.tokens.next.id === "]") {
                              K("W094", f.tokens.curr);
                              break;
                            }
                            f.tokens.next.id === "," &&
                              G("E028", f.tokens.next);
                          }
                          fn();
                          if (f.tokens.next.id !== ",") break;
                          rt(",");
                        }
                      rt("]");
                    }
                    switch (f.tokens.next.id) {
                      case "{":
                        e();
                        break;
                      case "[":
                        t();
                        break;
                      case "true":
                      case "false":
                      case "null":
                      case "(number)":
                      case "(string)":
                        rt();
                        break;
                      case "-":
                        rt("-"), rt("(number)");
                        break;
                      default:
                        G("E003", f.tokens.next);
                    }
                  }
                  var e,
                    t,
                    n = {
                      "<": !0,
                      "<=": !0,
                      "==": !0,
                      "===": !0,
                      "!==": !0,
                      "!=": !0,
                      ">": !0,
                      ">=": !0,
                      "+": !0,
                      "-": !0,
                      "*": !0,
                      "/": !0,
                      "%": !0,
                    },
                    h = {
                      asi: !0,
                      bitwise: !0,
                      boss: !0,
                      browser: !0,
                      camelcase: !0,
                      couch: !0,
                      curly: !0,
                      debug: !0,
                      devel: !0,
                      dojo: !0,
                      eqeqeq: !0,
                      eqnull: !0,
                      notypeof: !0,
                      es3: !0,
                      es5: !0,
                      esnext: !0,
                      moz: !0,
                      evil: !0,
                      expr: !0,
                      forin: !0,
                      funcscope: !0,
                      globalstrict: !0,
                      immed: !0,
                      iterator: !0,
                      jasmine: !0,
                      jquery: !0,
                      lastsemic: !0,
                      laxbreak: !0,
                      laxcomma: !0,
                      loopfunc: !0,
                      mootools: !0,
                      multistr: !0,
                      freeze: !0,
                      newcap: !0,
                      noarg: !0,
                      node: !0,
                      noempty: !0,
                      nonbsp: !0,
                      nonew: !0,
                      nonstandard: !0,
                      phantom: !0,
                      plusplus: !0,
                      proto: !0,
                      prototypejs: !0,
                      qunit: !0,
                      rhino: !0,
                      shelljs: !0,
                      typed: !0,
                      undef: !0,
                      scripturl: !0,
                      strict: !0,
                      sub: !0,
                      supernew: !0,
                      validthis: !0,
                      withstmt: !0,
                      worker: !0,
                      wsh: !0,
                      yui: !0,
                      mocha: !0,
                      noyield: !0,
                      onecase: !0,
                      regexp: !0,
                      regexdash: !0,
                    },
                    p = {
                      maxlen: !1,
                      indent: !1,
                      maxerr: !1,
                      predef: !1,
                      globals: !1,
                      quotmark: !1,
                      scope: !1,
                      maxstatements: !1,
                      maxdepth: !1,
                      maxparams: !1,
                      maxcomplexity: !1,
                      shadow: !1,
                      unused: !0,
                      latedef: !1,
                      ignore: !1,
                    },
                    d = {
                      bitwise: !0,
                      forin: !0,
                      newcap: !0,
                      plusplus: !0,
                      regexp: !0,
                      undef: !0,
                      eqeqeq: !0,
                      strict: !0,
                    },
                    v = { eqeq: "eqeqeq", windows: "wsh", sloppy: "strict" },
                    m = {
                      nomen: !0,
                      onevar: !0,
                      passfail: !0,
                      white: !0,
                      gcl: !0,
                      smarttabs: !0,
                      trailing: !0,
                    },
                    g,
                    y,
                    b = [
                      "closure",
                      "exception",
                      "global",
                      "label",
                      "outer",
                      "unused",
                      "var",
                    ],
                    w,
                    E,
                    S,
                    x,
                    T,
                    N,
                    C,
                    k,
                    L,
                    A,
                    O,
                    M,
                    D,
                    P,
                    H,
                    B,
                    j = [],
                    F = new i.EventEmitter();
                  gt("(number)", function () {
                    return this;
                  }),
                    gt("(string)", function () {
                      return this;
                    }),
                    gt("(template)", function () {
                      return this;
                    }),
                    (f.syntax["(identifier)"] = {
                      type: "(identifier)",
                      lbp: 0,
                      identifier: !0,
                      nud: function () {
                        var t = this.value,
                          n = D[t],
                          r,
                          i;
                        typeof n == "function"
                          ? (n = undefined)
                          : !w["(blockscope)"].current.has(t) &&
                            typeof n == "boolean" &&
                            ((r = w),
                            (w = E[0]),
                            et(t, { type: "var" }),
                            (n = w),
                            (w = r)),
                          (i = w["(blockscope)"].getlabel(t));
                        if (w === n || i)
                          switch (i ? i[t]["(type)"] : w[t]) {
                            case "unused":
                              i ? (i[t]["(type)"] = "var") : (w[t] = "var");
                              break;
                            case "unction":
                              i
                                ? (i[t]["(type)"] = "function")
                                : (w[t] = "function"),
                                (this["function"] = !0);
                              break;
                            case "const":
                              Xt(w, t, { unused: !1 });
                              break;
                            case "function":
                              this["function"] = !0;
                              break;
                            case "label":
                              K("W037", f.tokens.curr, t);
                          }
                        else if (w["(global)"])
                          typeof M[t] != "boolean" &&
                            ((e !== "typeof" && e !== "delete") ||
                              (f.tokens.next &&
                                (f.tokens.next.value === "." ||
                                  f.tokens.next.value === "["))) &&
                            (w["(comparray)"].check(t) ||
                              $(w, "W117", f.tokens.curr, t)),
                            qt(f.tokens.curr);
                        else
                          switch (w[t]) {
                            case "closure":
                            case "function":
                            case "var":
                            case "unused":
                              K("W038", f.tokens.curr, t);
                              break;
                            case "label":
                              K("W037", f.tokens.curr, t);
                              break;
                            case "outer":
                            case "global":
                              break;
                            default:
                              if (n === !0) w[t] = !0;
                              else if (n === null)
                                K("W039", f.tokens.curr, t), qt(f.tokens.curr);
                              else if (typeof n != "object")
                                ((e !== "typeof" && e !== "delete") ||
                                  (f.tokens.next &&
                                    (f.tokens.next.value === "." ||
                                      f.tokens.next.value === "["))) &&
                                  $(w, "W117", f.tokens.curr, t),
                                  (w[t] = !0),
                                  qt(f.tokens.curr);
                              else
                                switch (n[t]) {
                                  case "function":
                                  case "unction":
                                    (this["function"] = !0),
                                      (n[t] = "closure"),
                                      (w[t] = n["(global)"]
                                        ? "global"
                                        : "outer");
                                    break;
                                  case "var":
                                  case "unused":
                                    (n[t] = "closure"),
                                      (w[t] = n["(global)"]
                                        ? "global"
                                        : "outer");
                                    break;
                                  case "const":
                                    Xt(n, t, { unused: !1 });
                                    break;
                                  case "closure":
                                    w[t] = n["(global)"] ? "global" : "outer";
                                    break;
                                  case "label":
                                    K("W037", f.tokens.curr, t);
                                }
                          }
                        return this;
                      },
                      led: function () {
                        G("E033", f.tokens.next, f.tokens.next.value);
                      },
                    }),
                    gt("(regexp)", function () {
                      return this;
                    }),
                    ht("(endline)"),
                    ht("(begin)"),
                    (ht("(end)").reach = !0),
                    (ht("(error)").reach = !0),
                    (ht("}").reach = !0),
                    ht(")"),
                    ht("]"),
                    (ht('"').reach = !0),
                    (ht("'").reach = !0),
                    ht(";"),
                    (ht(":").reach = !0),
                    ht("#"),
                    yt("else"),
                    (yt("case").reach = !0),
                    yt("catch"),
                    (yt("default").reach = !0),
                    yt("finally"),
                    wt("arguments", function (e) {
                      f.directive["use strict"] &&
                        w["(global)"] &&
                        K("E008", e);
                    }),
                    wt("eval"),
                    wt("false"),
                    wt("Infinity"),
                    wt("null"),
                    wt("this", function (e) {
                      f.directive["use strict"] &&
                        !f.option.validthis &&
                        ((w["(statement)"] && w["(name)"].charAt(0) > "Z") ||
                          w["(global)"]) &&
                        K("W040", e);
                    }),
                    wt("true"),
                    wt("undefined"),
                    kt("=", "assign", 20),
                    kt("+=", "assignadd", 20),
                    kt("-=", "assignsub", 20),
                    kt("*=", "assignmult", 20),
                    (kt("/=", "assigndiv", 20).nud = function () {
                      G("E014");
                    }),
                    kt("%=", "assignmod", 20),
                    At("&=", "assignbitand", 20),
                    At("|=", "assignbitor", 20),
                    At("^=", "assignbitxor", 20),
                    At("<<=", "assignshiftleft", 20),
                    At(">>=", "assignshiftright", 20),
                    At(">>>=", "assignshiftrightunsigned", 20),
                    Et(
                      ",",
                      function (e, t) {
                        var n;
                        t.exprs = [e];
                        if (!lt({ peek: !0 })) return t;
                        for (;;) {
                          if (!(n = ot(10))) break;
                          t.exprs.push(n);
                          if (f.tokens.next.value !== "," || !lt()) break;
                        }
                        return t;
                      },
                      10,
                      !0
                    ),
                    Et(
                      "?",
                      function (e, t) {
                        return (
                          Qt(),
                          (t.left = e),
                          (t.right = ot(10)),
                          rt(":"),
                          (t["else"] = ot(10)),
                          t
                        );
                      },
                      30
                    );
                  var Rt = 40;
                  Et(
                    "||",
                    function (e, t) {
                      return Qt(), (t.left = e), (t.right = ot(Rt)), t;
                    },
                    Rt
                  ),
                    Et("&&", "and", 50),
                    Lt("|", "bitor", 70),
                    Lt("^", "bitxor", 80),
                    Lt("&", "bitand", 90),
                    xt("==", function (e, t) {
                      var n =
                        f.option.eqnull &&
                        (e.value === "null" || t.value === "null");
                      switch (!0) {
                        case !n && f.option.eqeqeq:
                          (this.from = this.character),
                            K("W116", this, "===", "==");
                          break;
                        case Tt(e):
                          K("W041", this, "===", e.value);
                          break;
                        case Tt(t):
                          K("W041", this, "===", t.value);
                          break;
                        case Nt(t, e):
                          K("W122", this, t.value);
                          break;
                        case Nt(e, t):
                          K("W122", this, e.value);
                      }
                      return this;
                    }),
                    xt("===", function (e, t) {
                      return (
                        Nt(t, e)
                          ? K("W122", this, t.value)
                          : Nt(e, t) && K("W122", this, e.value),
                        this
                      );
                    }),
                    xt("!=", function (e, t) {
                      var n =
                        f.option.eqnull &&
                        (e.value === "null" || t.value === "null");
                      return (
                        !n && f.option.eqeqeq
                          ? ((this.from = this.character),
                            K("W116", this, "!==", "!="))
                          : Tt(e)
                          ? K("W041", this, "!==", e.value)
                          : Tt(t)
                          ? K("W041", this, "!==", t.value)
                          : Nt(t, e)
                          ? K("W122", this, t.value)
                          : Nt(e, t) && K("W122", this, e.value),
                        this
                      );
                    }),
                    xt("!==", function (e, t) {
                      return (
                        Nt(t, e)
                          ? K("W122", this, t.value)
                          : Nt(e, t) && K("W122", this, e.value),
                        this
                      );
                    }),
                    xt("<"),
                    xt(">"),
                    xt("<="),
                    xt(">="),
                    Lt("<<", "shiftleft", 120),
                    Lt(">>", "shiftright", 120),
                    Lt(">>>", "shiftrightunsigned", 120),
                    Et("in", "in", 120),
                    Et("instanceof", "instanceof", 120),
                    Et(
                      "+",
                      function (e, t) {
                        var n = ot(130);
                        return e &&
                          n &&
                          e.id === "(string)" &&
                          n.id === "(string)"
                          ? ((e.value += n.value),
                            (e.character = n.character),
                            !f.option.scripturl &&
                              a.javascriptURL.test(e.value) &&
                              K("W050", e),
                            e)
                          : ((t.left = e), (t.right = n), t);
                      },
                      130
                    ),
                    mt("+", "num"),
                    mt("+++", function () {
                      return (
                        K("W007"),
                        (this.right = ot(150)),
                        (this.arity = "unary"),
                        this
                      );
                    }),
                    Et(
                      "+++",
                      function (e) {
                        return (
                          K("W007"),
                          (this.left = e),
                          (this.right = ot(130)),
                          this
                        );
                      },
                      130
                    ),
                    Et("-", "sub", 130),
                    mt("-", "neg"),
                    mt("---", function () {
                      return (
                        K("W006"),
                        (this.right = ot(150)),
                        (this.arity = "unary"),
                        this
                      );
                    }),
                    Et(
                      "---",
                      function (e) {
                        return (
                          K("W006"),
                          (this.left = e),
                          (this.right = ot(130)),
                          this
                        );
                      },
                      130
                    ),
                    Et("*", "mult", 140),
                    Et("/", "div", 140),
                    Et("%", "mod", 140),
                    Ot("++", "postinc"),
                    mt("++", "preinc"),
                    (f.syntax["++"].exps = !0),
                    Ot("--", "postdec"),
                    mt("--", "predec"),
                    (f.syntax["--"].exps = !0),
                    (mt("delete", function () {
                      var e = ot(10);
                      return (
                        (!e || (e.id !== "." && e.id !== "[")) && K("W051"),
                        (this.first = e),
                        this
                      );
                    }).exps = !0),
                    mt("~", function () {
                      return (
                        f.option.bitwise && K("W052", this, "~"), ot(150), this
                      );
                    }),
                    mt("...", function () {
                      return (
                        f.option.inESNext() ||
                          K("W104", this, "spread/rest operator"),
                        f.tokens.next.identifier ||
                          G("E030", f.tokens.next, f.tokens.next.value),
                        ot(150),
                        this
                      );
                    }),
                    mt("!", function () {
                      return (
                        (this.right = ot(150)),
                        (this.arity = "unary"),
                        this.right || V("E041", this.line || 0),
                        n[this.right.id] === !0 && K("W018", this, "!"),
                        this
                      );
                    }),
                    mt("typeof", "typeof"),
                    mt("new", function () {
                      var e = ot(155),
                        t;
                      if (e && e.id !== "function")
                        if (e.identifier) {
                          e["new"] = !0;
                          switch (e.value) {
                            case "Number":
                            case "String":
                            case "Boolean":
                            case "Math":
                            case "JSON":
                              K("W053", f.tokens.prev, e.value);
                              break;
                            case "Function":
                              f.option.evil || K("W054");
                              break;
                            case "Date":
                            case "RegExp":
                            case "this":
                              break;
                            default:
                              e.id !== "function" &&
                                ((t = e.value.substr(0, 1)),
                                f.option.newcap &&
                                  (t < "A" || t > "Z") &&
                                  !r.has(S, e.value) &&
                                  K("W055", f.tokens.curr));
                          }
                        } else
                          e.id !== "." &&
                            e.id !== "[" &&
                            e.id !== "(" &&
                            K("W056", f.tokens.curr);
                      else f.option.supernew || K("W057", this);
                      return (
                        f.tokens.next.id !== "(" &&
                          !f.option.supernew &&
                          K("W058", f.tokens.curr, f.tokens.curr.value),
                        (this.first = e),
                        this
                      );
                    }),
                    (f.syntax["new"].exps = !0),
                    (mt("void").exps = !0),
                    Et(
                      ".",
                      function (e, t) {
                        var n = _t(!1, !0);
                        return (
                          typeof n == "string" && It(n),
                          (t.left = e),
                          (t.right = n),
                          n &&
                            n === "hasOwnProperty" &&
                            f.tokens.next.value === "=" &&
                            K("W001"),
                          !e ||
                          e.value !== "arguments" ||
                          (n !== "callee" && n !== "caller")
                            ? !f.option.evil &&
                              e &&
                              e.value === "document" &&
                              (n === "write" || n === "writeln") &&
                              K("W060", e)
                            : f.option.noarg
                            ? K("W059", e, n)
                            : f.directive["use strict"] && G("E008"),
                          !f.option.evil &&
                            (n === "eval" || n === "execScript") &&
                            K("W061"),
                          t
                        );
                      },
                      160,
                      !0
                    ),
                    (Et(
                      "(",
                      function (e, t) {
                        f.option.immed &&
                          e &&
                          !e.immed &&
                          e.id === "function" &&
                          K("W062");
                        var n = 0,
                          r = [];
                        e &&
                          e.type === "(identifier)" &&
                          e.value.match(
                            /^[A-Z]([A-Z0-9_$]*[a-z][A-Za-z0-9_$]*)?$/
                          ) &&
                          "Number String Boolean Date Object Error".indexOf(
                            e.value
                          ) === -1 &&
                          (e.value === "Math"
                            ? K("W063", e)
                            : f.option.newcap && K("W064", e));
                        if (f.tokens.next.id !== ")")
                          for (;;) {
                            (r[r.length] = ot(10)), (n += 1);
                            if (f.tokens.next.id !== ",") break;
                            lt();
                          }
                        return (
                          rt(")"),
                          typeof e == "object" &&
                            (f.option.inES3() &&
                              e.value === "parseInt" &&
                              n === 1 &&
                              K("W065", f.tokens.curr),
                            f.option.evil ||
                              (e.value === "eval" ||
                              e.value === "Function" ||
                              e.value === "execScript"
                                ? (K("W061", e),
                                  r[0] &&
                                    [0].id === "(string)" &&
                                    Z(e, r[0].value))
                                : !r[0] ||
                                  r[0].id !== "(string)" ||
                                  (e.value !== "setTimeout" &&
                                    e.value !== "setInterval")
                                ? r[0] &&
                                  r[0].id === "(string)" &&
                                  e.value === "." &&
                                  e.left.value === "window" &&
                                  (e.right === "setTimeout" ||
                                    e.right === "setInterval") &&
                                  (K("W066", e), Z(e, r[0].value))
                                : (K("W066", e), Z(e, r[0].value))),
                            !e.identifier &&
                              e.id !== "." &&
                              e.id !== "[" &&
                              e.id !== "(" &&
                              e.id !== "&&" &&
                              e.id !== "||" &&
                              e.id !== "?" &&
                              K("W067", e)),
                          (t.left = e),
                          t
                        );
                      },
                      155,
                      !0
                    ).exps = !0),
                    mt("(", function () {
                      var e,
                        t = [],
                        n,
                        i,
                        s = 0,
                        o,
                        u = 1;
                      do
                        (n = nt(s)),
                          n.value === "("
                            ? (u += 1)
                            : n.value === ")" && (u -= 1),
                          (s += 1),
                          (i = nt(s));
                      while (
                        (u !== 0 || n.value !== ")") &&
                        i.value !== "=>" &&
                        i.value !== ";" &&
                        i.type !== "(end)"
                      );
                      f.tokens.next.id === "function" &&
                        (f.tokens.next.immed = !0);
                      var a = [];
                      if (f.tokens.next.id !== ")")
                        for (;;) {
                          if (
                            i.value === "=>" &&
                            r.contains(["{", "["], f.tokens.next.value)
                          ) {
                            (e = f.tokens.next), (e.left = Yt()), t.push(e);
                            for (var l in e.left) a.push(e.left[l].token);
                          } else a.push(ot(10));
                          if (f.tokens.next.id !== ",") break;
                          lt();
                        }
                      rt(")", this),
                        f.option.immed &&
                          a[0] &&
                          a[0].id === "function" &&
                          f.tokens.next.id !== "(" &&
                          (f.tokens.next.id !== "." ||
                            (nt().value !== "call" &&
                              nt().value !== "apply")) &&
                          K("W068", this);
                      if (f.tokens.next.value === "=>") return a;
                      if (!a.length) return;
                      return (
                        a.length > 1
                          ? ((o = Object.create(f.syntax[","])), (o.exprs = a))
                          : (o = a[0]),
                        o && (o.paren = !0),
                        o
                      );
                    }),
                    St("=>"),
                    Et(
                      "[",
                      function (e, t) {
                        var n = ot(10),
                          r;
                        return (
                          n &&
                            n.type === "(string)" &&
                            (!f.option.evil &&
                              (n.value === "eval" ||
                                n.value === "execScript") &&
                              K("W061", t),
                            It(n.value),
                            !f.option.sub &&
                              a.identifier.test(n.value) &&
                              ((r = f.syntax[n.value]),
                              (!r || !U(r)) &&
                                K("W069", f.tokens.prev, n.value))),
                          rt("]", t),
                          n &&
                            n.value === "hasOwnProperty" &&
                            f.tokens.next.value === "=" &&
                            K("W001"),
                          (t.left = e),
                          (t.right = n),
                          t
                        );
                      },
                      160,
                      !0
                    ),
                    mt(
                      "[",
                      function () {
                        var e = on(!0);
                        if (e.isCompArray)
                          return (
                            f.option.inESNext() ||
                              K("W119", f.tokens.curr, "array comprehension"),
                            Ut()
                          );
                        e.isDestAssign &&
                          !f.option.inESNext() &&
                          K("W104", f.tokens.curr, "destructuring assignment");
                        var t = f.tokens.curr.line !== f.tokens.next.line;
                        (this.first = []),
                          t &&
                            ((N += f.option.indent),
                            f.tokens.next.from === N + f.option.indent &&
                              (N += f.option.indent));
                        while (f.tokens.next.id !== "(end)") {
                          while (f.tokens.next.id === ",")
                            f.option.inES5() || K("W070"), rt(",");
                          if (f.tokens.next.id === "]") break;
                          this.first.push(ot(10));
                          if (f.tokens.next.id !== ",") break;
                          lt({ allowTrailing: !0 });
                          if (f.tokens.next.id === "]" && !f.option.inES5(!0)) {
                            K("W070", f.tokens.curr);
                            break;
                          }
                        }
                        return t && (N -= f.option.indent), rt("]", this), this;
                      },
                      160
                    ),
                    (function (e) {
                      (e.nud = function (e) {
                        function c(e, t) {
                          a[e] && r.has(a, e)
                            ? K("W075", f.tokens.next, i)
                            : (a[e] = {}),
                            (a[e].basic = !0),
                            (a[e].basictkn = t);
                        }
                        function h(e, t) {
                          a[e] && r.has(a, e)
                            ? (a[e].basic || a[e].setter) &&
                              K("W075", f.tokens.next, i)
                            : (a[e] = {}),
                            (a[e].setter = !0),
                            (a[e].setterToken = t);
                        }
                        function p(e) {
                          a[e] && r.has(a, e)
                            ? (a[e].basic || a[e].getter) &&
                              K("W075", f.tokens.next, i)
                            : (a[e] = {}),
                            (a[e].getter = !0),
                            (a[e].getterToken = f.tokens.curr);
                        }
                        var t,
                          n,
                          i,
                          s,
                          o,
                          u,
                          a = {},
                          l = "";
                        (t = f.tokens.curr.line !== f.tokens.next.line),
                          t &&
                            ((N += f.option.indent),
                            f.tokens.next.from === N + f.option.indent &&
                              (N += f.option.indent));
                        for (;;) {
                          if (f.tokens.next.id === "}") break;
                          e &&
                            f.tokens.next.value === "static" &&
                            (rt("static"), (l = "static "));
                          if (f.tokens.next.value === "get" && nt().id !== ":")
                            rt("get"),
                              f.option.inES5(!e) || G("E034"),
                              (i = zt()),
                              !i && !f.option.inESNext() && G("E035"),
                              e &&
                                i === "constructor" &&
                                G(
                                  "E049",
                                  f.tokens.next,
                                  "class getter method",
                                  i
                                ),
                              i && p(l + i),
                              (o = f.tokens.next),
                              (n = Jt()),
                              (s = n["(params)"]),
                              i && s && K("W076", o, s[0], i);
                          else if (
                            f.tokens.next.value === "set" &&
                            nt().id !== ":"
                          )
                            rt("set"),
                              f.option.inES5(!e) || G("E034"),
                              (i = zt()),
                              !i && !f.option.inESNext() && G("E035"),
                              e &&
                                i === "constructor" &&
                                G(
                                  "E049",
                                  f.tokens.next,
                                  "class setter method",
                                  i
                                ),
                              i && h(l + i, f.tokens.next),
                              (o = f.tokens.next),
                              (n = Jt()),
                              (s = n["(params)"]),
                              i && (!s || s.length !== 1) && K("W077", o, i);
                          else {
                            (u = !1),
                              f.tokens.next.value === "*" &&
                                f.tokens.next.type === "(punctuator)" &&
                                (f.option.inESNext() ||
                                  K(
                                    "W104",
                                    f.tokens.next,
                                    "generator functions"
                                  ),
                                rt("*"),
                                (u = !0)),
                              (i = zt()),
                              c(l + i, f.tokens.next);
                            if (typeof i != "string") break;
                            f.tokens.next.value === "("
                              ? (f.option.inESNext() ||
                                  K("W104", f.tokens.curr, "concise methods"),
                                Jt(i, undefined, u))
                              : e || (rt(":"), ot(10));
                          }
                          e &&
                            i === "prototype" &&
                            G("E049", f.tokens.next, "class method", i),
                            It(i);
                          if (e) {
                            l = "";
                            continue;
                          }
                          if (f.tokens.next.id !== ",") break;
                          lt({ allowTrailing: !0, property: !0 }),
                            f.tokens.next.id === ","
                              ? K("W070", f.tokens.curr)
                              : f.tokens.next.id === "}" &&
                                !f.option.inES5(!0) &&
                                K("W070", f.tokens.curr);
                        }
                        t && (N -= f.option.indent), rt("}", this);
                        if (f.option.inES5())
                          for (var d in a)
                            r.has(a, d) &&
                              a[d].setter &&
                              !a[d].getter &&
                              K("W078", a[d].setterToken);
                        return this;
                      }),
                        (e.fud = function () {
                          G("E036", f.tokens.curr);
                        });
                    })(ht("{"));
                  var en = pt("const", function (e) {
                    var t, n, i;
                    f.option.inESNext() || K("W104", f.tokens.curr, "const"),
                      (this.first = []);
                    for (;;) {
                      var s = [];
                      r.contains(["{", "["], f.tokens.next.value)
                        ? ((t = Yt()), (i = !1))
                        : ((t = [{ id: _t(), token: f.tokens.curr }]),
                          (i = !0));
                      for (var o in t)
                        t.hasOwnProperty(o) &&
                          ((o = t[o]),
                          w[o.id] === "const" && K("E011", null, o.id),
                          w["(global)"] &&
                            M[o.id] === !1 &&
                            K("W079", o.token, o.id),
                          o.id &&
                            (et(o.id, {
                              token: o.token,
                              type: "const",
                              unused: !0,
                            }),
                            s.push(o.token)));
                      if (e) break;
                      (this.first = this.first.concat(s)),
                        f.tokens.next.id !== "=" &&
                          K("E012", f.tokens.curr, f.tokens.curr.value),
                        f.tokens.next.id === "=" &&
                          (rt("="),
                          f.tokens.next.id === "undefined" &&
                            K("W080", f.tokens.prev, f.tokens.prev.value),
                          nt(0).id === "=" &&
                            f.tokens.next.identifier &&
                            K("W120", f.tokens.next, f.tokens.next.value),
                          (n = ot(10)),
                          i ? (t[0].first = n) : Zt(s, n));
                      if (f.tokens.next.id !== ",") break;
                      lt();
                    }
                    return this;
                  });
                  en.exps = !0;
                  var tn = pt("var", function (e) {
                    var t, n, i;
                    this.first = [];
                    for (;;) {
                      var s = [];
                      r.contains(["{", "["], f.tokens.next.value)
                        ? ((t = Yt()), (n = !1))
                        : ((t = [{ id: _t(), token: f.tokens.curr }]),
                          (n = !0));
                      for (var o in t)
                        t.hasOwnProperty(o) &&
                          ((o = t[o]),
                          f.option.inESNext() &&
                            w[o.id] === "const" &&
                            K("E011", null, o.id),
                          w["(global)"] &&
                            M[o.id] === !1 &&
                            K("W079", o.token, o.id),
                          o.id &&
                            (et(o.id, { type: "unused", token: o.token }),
                            s.push(o.token)));
                      if (e) break;
                      (this.first = this.first.concat(s)),
                        f.tokens.next.id === "=" &&
                          (rt("="),
                          f.tokens.next.id === "undefined" &&
                            K("W080", f.tokens.prev, f.tokens.prev.value),
                          nt(0).id === "=" &&
                            f.tokens.next.identifier &&
                            K("W120", f.tokens.next, f.tokens.next.value),
                          (i = ot(10)),
                          n ? (t[0].first = i) : Zt(s, i));
                      if (f.tokens.next.id !== ",") break;
                      lt();
                    }
                    return this;
                  });
                  tn.exps = !0;
                  var nn = pt("let", function (e) {
                    var t, n, i, s;
                    f.option.inESNext() || K("W104", f.tokens.curr, "let"),
                      f.tokens.next.value === "("
                        ? (f.option.inMoz(!0) ||
                            K("W118", f.tokens.next, "let block"),
                          rt("("),
                          w["(blockscope)"].stack(),
                          (s = !0))
                        : w["(nolet)"] && G("E048", f.tokens.curr),
                      (this.first = []);
                    for (;;) {
                      var o = [];
                      r.contains(["{", "["], f.tokens.next.value)
                        ? ((t = Yt()), (n = !1))
                        : ((t = [{ id: _t(), token: f.tokens.curr.value }]),
                          (n = !0));
                      for (var u in t)
                        t.hasOwnProperty(u) &&
                          ((u = t[u]),
                          f.option.inESNext() &&
                            w[u.id] === "const" &&
                            K("E011", null, u.id),
                          w["(global)"] &&
                            M[u.id] === !1 &&
                            K("W079", u.token, u.id),
                          u.id &&
                            !w["(nolet)"] &&
                            (et(u.id, {
                              type: "unused",
                              token: u.token,
                              islet: !0,
                            }),
                            o.push(u.token)));
                      if (e) break;
                      (this.first = this.first.concat(o)),
                        f.tokens.next.id === "=" &&
                          (rt("="),
                          f.tokens.next.id === "undefined" &&
                            K("W080", f.tokens.prev, f.tokens.prev.value),
                          nt(0).id === "=" &&
                            f.tokens.next.identifier &&
                            K("W120", f.tokens.next, f.tokens.next.value),
                          (i = ot(10)),
                          n ? (t[0].first = i) : Zt(o, i));
                      if (f.tokens.next.id !== ",") break;
                      lt();
                    }
                    return (
                      s &&
                        (rt(")"),
                        Ft(!0, !0),
                        (this.block = !0),
                        w["(blockscope)"].unstack()),
                      this
                    );
                  });
                  (nn.exps = !0),
                    dt("class", function () {
                      return rn.call(this, !0);
                    }),
                    dt("function", function () {
                      var e = !1;
                      f.tokens.next.value === "*" &&
                        (rt("*"),
                        f.option.inESNext(!0)
                          ? (e = !0)
                          : K("W119", f.tokens.curr, "function*")),
                        T && K("W082", f.tokens.curr);
                      var t = _t();
                      return (
                        w[t] === "const" && K("E011", null, t),
                        et(t, { type: "unction", token: f.tokens.curr }),
                        Jt(t, { statement: !0 }, e),
                        f.tokens.next.id === "(" &&
                          f.tokens.next.line === f.tokens.curr.line &&
                          G("E039"),
                        this
                      );
                    }),
                    mt("function", function () {
                      var e = !1;
                      f.tokens.next.value === "*" &&
                        (f.option.inESNext() ||
                          K("W119", f.tokens.curr, "function*"),
                        rt("*"),
                        (e = !0));
                      var t = Mt();
                      return (
                        Jt(t, undefined, e),
                        !f.option.loopfunc && w["(loopage)"] && K("W083"),
                        this
                      );
                    }),
                    dt("if", function () {
                      var e = f.tokens.next;
                      return (
                        Qt(),
                        (f.condition = !0),
                        rt("("),
                        Gt(ot(0)),
                        rt(")", e),
                        (f.condition = !1),
                        Ft(!0, !0),
                        f.tokens.next.id === "else" &&
                          (rt("else"),
                          f.tokens.next.id === "if" ||
                          f.tokens.next.id === "switch"
                            ? Ht(!0)
                            : Ft(!0, !0)),
                        this
                      );
                    }),
                    dt("try", function () {
                      function t() {
                        var e = D,
                          t;
                        rt("catch"),
                          rt("("),
                          (D = Object.create(e)),
                          (t = f.tokens.next.value),
                          f.tokens.next.type !== "(identifier)" &&
                            ((t = null), K("E030", f.tokens.next, t)),
                          rt(),
                          (w = $t("(catch)", f.tokens.next, D, {
                            "(context)": w,
                            "(breakage)": w["(breakage)"],
                            "(loopage)": w["(loopage)"],
                            "(statement)": !1,
                            "(catch)": !0,
                          })),
                          t && et(t, { type: "exception" }),
                          f.tokens.next.value === "if" &&
                            (f.option.inMoz(!0) ||
                              K("W118", f.tokens.curr, "catch filter"),
                            rt("if"),
                            ot(0)),
                          rt(")"),
                          (f.tokens.curr.funct = w),
                          E.push(w),
                          Ft(!1),
                          (D = e),
                          (w["(last)"] = f.tokens.curr.line),
                          (w["(lastcharacter)"] = f.tokens.curr.character),
                          (w = w["(context)"]);
                      }
                      var e;
                      Ft(!0);
                      while (f.tokens.next.id === "catch")
                        Qt(),
                          e &&
                            !f.option.inMoz(!0) &&
                            K("W118", f.tokens.next, "multiple catch blocks"),
                          t(),
                          (e = !0);
                      if (f.tokens.next.id === "finally") {
                        rt("finally"), Ft(!0);
                        return;
                      }
                      return (
                        e ||
                          G(
                            "E021",
                            f.tokens.next,
                            "catch",
                            f.tokens.next.value
                          ),
                        this
                      );
                    }),
                    (dt("while", function () {
                      var e = f.tokens.next;
                      return (
                        (w["(breakage)"] += 1),
                        (w["(loopage)"] += 1),
                        Qt(),
                        rt("("),
                        Gt(ot(0)),
                        rt(")", e),
                        Ft(!0, !0),
                        (w["(breakage)"] -= 1),
                        (w["(loopage)"] -= 1),
                        this
                      );
                    }).labelled = !0),
                    dt("with", function () {
                      var e = f.tokens.next;
                      return (
                        f.directive["use strict"]
                          ? G("E010", f.tokens.curr)
                          : f.option.withstmt || K("W085", f.tokens.curr),
                        rt("("),
                        ot(0),
                        rt(")", e),
                        Ft(!0, !0),
                        this
                      );
                    }),
                    (dt("switch", function () {
                      var e = f.tokens.next,
                        t = !1,
                        n = !1;
                      (w["(breakage)"] += 1),
                        rt("("),
                        Gt(ot(0)),
                        rt(")", e),
                        (e = f.tokens.next),
                        rt("{"),
                        f.tokens.next.from === N && (n = !0),
                        n || (N += f.option.indent),
                        (this.cases = []);
                      for (;;)
                        switch (f.tokens.next.id) {
                          case "case":
                            switch (w["(verb)"]) {
                              case "yield":
                              case "break":
                              case "case":
                              case "continue":
                              case "return":
                              case "switch":
                              case "throw":
                                break;
                              default:
                                a.fallsThrough.test(
                                  f.lines[f.tokens.next.line - 2]
                                ) || K("W086", f.tokens.curr, "case");
                            }
                            rt("case"),
                              this.cases.push(ot(0)),
                              Qt(),
                              (t = !0),
                              rt(":"),
                              (w["(verb)"] = "case");
                            break;
                          case "default":
                            switch (w["(verb)"]) {
                              case "yield":
                              case "break":
                              case "continue":
                              case "return":
                              case "throw":
                                break;
                              default:
                                this.cases.length &&
                                  (a.fallsThrough.test(
                                    f.lines[f.tokens.next.line - 2]
                                  ) ||
                                    K("W086", f.tokens.curr, "default"));
                            }
                            rt("default"), (t = !0), rt(":");
                            break;
                          case "}":
                            n || (N -= f.option.indent),
                              rt("}", e),
                              (w["(breakage)"] -= 1),
                              (w["(verb)"] = undefined);
                            return;
                          case "(end)":
                            G("E023", f.tokens.next, "}");
                            return;
                          default:
                            N += f.option.indent;
                            if (t)
                              switch (f.tokens.curr.id) {
                                case ",":
                                  G("E040");
                                  return;
                                case ":":
                                  (t = !1), Bt();
                                  break;
                                default:
                                  G("E025", f.tokens.curr);
                                  return;
                              }
                            else {
                              if (f.tokens.curr.id !== ":") {
                                G(
                                  "E021",
                                  f.tokens.next,
                                  "case",
                                  f.tokens.next.value
                                );
                                return;
                              }
                              rt(":"), G("E024", f.tokens.curr, ":"), Bt();
                            }
                            N -= f.option.indent;
                        }
                    }).labelled = !0),
                    (pt("debugger", function () {
                      return f.option.debug || K("W087", this), this;
                    }).exps = !0),
                    (function () {
                      var e = pt("do", function () {
                        (w["(breakage)"] += 1),
                          (w["(loopage)"] += 1),
                          Qt(),
                          (this.first = Ft(!0, !0)),
                          rt("while");
                        var e = f.tokens.next;
                        return (
                          rt("("),
                          Gt(ot(0)),
                          rt(")", e),
                          (w["(breakage)"] -= 1),
                          (w["(loopage)"] -= 1),
                          this
                        );
                      });
                      (e.labelled = !0), (e.exps = !0);
                    })(),
                    (dt("for", function () {
                      var e,
                        t = f.tokens.next,
                        n = !1,
                        i = null;
                      t.value === "each" &&
                        ((i = t),
                        rt("each"),
                        f.option.inMoz(!0) ||
                          K("W118", f.tokens.curr, "for each")),
                        (w["(breakage)"] += 1),
                        (w["(loopage)"] += 1),
                        Qt(),
                        rt("(");
                      var s,
                        o = 0,
                        u = ["in", "of"];
                      do (s = nt(o)), ++o;
                      while (
                        !r.contains(u, s.value) &&
                        s.value !== ";" &&
                        s.type !== "(end)"
                      );
                      if (r.contains(u, s.value)) {
                        !f.option.inESNext() &&
                          s.value === "of" &&
                          G("W104", s, "for of");
                        if (f.tokens.next.id === "var")
                          rt("var"),
                            f.syntax["var"].fud.call(f.syntax["var"].fud, !0);
                        else if (f.tokens.next.id === "let")
                          rt("let"),
                            (n = !0),
                            w["(blockscope)"].stack(),
                            f.syntax.let.fud.call(f.syntax.let.fud, !0);
                        else if (!f.tokens.next.identifier)
                          G("E030", f.tokens.next, f.tokens.next.type), rt();
                        else {
                          switch (w[f.tokens.next.value]) {
                            case "unused":
                              w[f.tokens.next.value] = "var";
                              break;
                            case "var":
                              break;
                            default:
                              w["(blockscope)"].getlabel(f.tokens.next.value) ||
                                K("W088", f.tokens.next, f.tokens.next.value);
                          }
                          rt();
                        }
                        rt(s.value),
                          ot(20),
                          rt(")", t),
                          (e = Ft(!0, !0)),
                          f.option.forin &&
                            e &&
                            (e.length > 1 ||
                              typeof e[0] != "object" ||
                              e[0].value !== "if") &&
                            K("W089", this),
                          (w["(breakage)"] -= 1),
                          (w["(loopage)"] -= 1);
                      } else {
                        i && G("E045", i);
                        if (f.tokens.next.id !== ";")
                          if (f.tokens.next.id === "var")
                            rt("var"),
                              f.syntax["var"].fud.call(f.syntax["var"].fud);
                          else if (f.tokens.next.id === "let")
                            rt("let"),
                              (n = !0),
                              w["(blockscope)"].stack(),
                              f.syntax.let.fud.call(f.syntax.let.fud);
                          else
                            for (;;) {
                              ot(0, "for");
                              if (f.tokens.next.id !== ",") break;
                              lt();
                            }
                        at(f.tokens.curr),
                          rt(";"),
                          f.tokens.next.id !== ";" && Gt(ot(0)),
                          at(f.tokens.curr),
                          rt(";"),
                          f.tokens.next.id === ";" &&
                            G("E021", f.tokens.next, ")", ";");
                        if (f.tokens.next.id !== ")")
                          for (;;) {
                            ot(0, "for");
                            if (f.tokens.next.id !== ",") break;
                            lt();
                          }
                        rt(")", t),
                          Ft(!0, !0),
                          (w["(breakage)"] -= 1),
                          (w["(loopage)"] -= 1);
                      }
                      return n && w["(blockscope)"].unstack(), this;
                    }).labelled = !0),
                    (pt("break", function () {
                      var e = f.tokens.next.value;
                      return (
                        w["(breakage)"] === 0 &&
                          K("W052", f.tokens.next, this.value),
                        f.option.asi || at(this),
                        f.tokens.next.id !== ";" &&
                          !f.tokens.next.reach &&
                          f.tokens.curr.line === f.tokens.next.line &&
                          (w[e] !== "label"
                            ? K("W090", f.tokens.next, e)
                            : D[e] !== w && K("W091", f.tokens.next, e),
                          (this.first = f.tokens.next),
                          rt()),
                        Dt("break"),
                        this
                      );
                    }).exps = !0),
                    (pt("continue", function () {
                      var e = f.tokens.next.value;
                      return (
                        w["(breakage)"] === 0 &&
                          K("W052", f.tokens.next, this.value),
                        f.option.asi || at(this),
                        f.tokens.next.id !== ";" && !f.tokens.next.reach
                          ? f.tokens.curr.line === f.tokens.next.line &&
                            (w[e] !== "label"
                              ? K("W090", f.tokens.next, e)
                              : D[e] !== w && K("W091", f.tokens.next, e),
                            (this.first = f.tokens.next),
                            rt())
                          : w["(loopage)"] ||
                            K("W052", f.tokens.next, this.value),
                        Dt("continue"),
                        this
                      );
                    }).exps = !0),
                    (pt("return", function () {
                      return (
                        this.line === f.tokens.next.line
                          ? f.tokens.next.id !== ";" &&
                            !f.tokens.next.reach &&
                            ((this.first = ot(0)),
                            this.first &&
                              this.first.type === "(punctuator)" &&
                              this.first.value === "=" &&
                              !this.first.paren &&
                              !f.option.boss &&
                              Q("W093", this.first.line, this.first.character))
                          : f.tokens.next.type === "(punctuator)" &&
                            ["[", "{", "+", "-"].indexOf(f.tokens.next.value) >
                              -1 &&
                            at(this),
                        Dt("return"),
                        this
                      );
                    }).exps = !0),
                    (function (e) {
                      (e.exps = !0), (e.lbp = 25);
                    })(
                      mt("yield", function () {
                        var e = f.tokens.prev;
                        return (
                          f.option.inESNext(!0) && !w["(generator)"]
                            ? ("(catch)" !== w["(name)"] ||
                                !w["(context)"]["(generator)"]) &&
                              G("E046", f.tokens.curr, "yield")
                            : f.option.inESNext() ||
                              K("W104", f.tokens.curr, "yield"),
                          (w["(generator)"] = "yielded"),
                          this.line === f.tokens.next.line ||
                          !f.option.inMoz(!0)
                            ? (f.tokens.next.id !== ";" &&
                                !f.tokens.next.reach &&
                                f.tokens.next.nud &&
                                (ut(f.tokens.curr, f.tokens.next),
                                (this.first = ot(10)),
                                this.first.type === "(punctuator)" &&
                                  this.first.value === "=" &&
                                  !this.first.paren &&
                                  !f.option.boss &&
                                  Q(
                                    "W093",
                                    this.first.line,
                                    this.first.character
                                  )),
                              f.option.inMoz(!0) &&
                                f.tokens.next.id !== ")" &&
                                (e.lbp > 30 ||
                                  (!e.assign && !st()) ||
                                  e.id === "yield") &&
                                G("E050", this))
                            : f.option.asi || at(this),
                          this
                        );
                      })
                    ),
                    (pt("throw", function () {
                      return at(this), (this.first = ot(20)), Dt("throw"), this;
                    }).exps = !0),
                    (pt("import", function () {
                      f.option.inESNext() || K("W119", f.tokens.curr, "import");
                      if (f.tokens.next.type === "(string)")
                        return rt("(string)"), this;
                      if (f.tokens.next.identifier)
                        (this.name = _t()),
                          et(this.name, {
                            type: "unused",
                            token: f.tokens.curr,
                          });
                      else {
                        rt("{");
                        for (;;) {
                          if (f.tokens.next.value === "}") {
                            rt("}");
                            break;
                          }
                          var e;
                          f.tokens.next.type === "default"
                            ? ((e = "default"), rt("default"))
                            : (e = _t()),
                            f.tokens.next.value === "as" &&
                              (rt("as"), (e = _t())),
                            et(e, { type: "unused", token: f.tokens.curr });
                          if (f.tokens.next.value !== ",") {
                            if (f.tokens.next.value === "}") {
                              rt("}");
                              break;
                            }
                            G("E024", f.tokens.next, f.tokens.next.value);
                            break;
                          }
                          rt(",");
                        }
                      }
                      return rt("from"), rt("(string)"), this;
                    }).exps = !0),
                    (pt("export", function () {
                      f.option.inESNext() || K("W119", f.tokens.curr, "export");
                      if (f.tokens.next.type === "default") {
                        rt("default");
                        if (
                          f.tokens.next.id === "function" ||
                          f.tokens.next.id === "class"
                        )
                          this.block = !0;
                        return (this.exportee = ot(10)), this;
                      }
                      if (f.tokens.next.value === "{") {
                        rt("{");
                        for (;;) {
                          y[_t()] = !0;
                          if (f.tokens.next.value !== ",") {
                            if (f.tokens.next.value === "}") {
                              rt("}");
                              break;
                            }
                            G("E024", f.tokens.next, f.tokens.next.value);
                            break;
                          }
                          rt(",");
                        }
                        return this;
                      }
                      return (
                        f.tokens.next.id === "var"
                          ? (rt("var"),
                            (y[f.tokens.next.value] = !0),
                            f.syntax["var"].fud.call(f.syntax["var"].fud))
                          : f.tokens.next.id === "let"
                          ? (rt("let"),
                            (y[f.tokens.next.value] = !0),
                            f.syntax.let.fud.call(f.syntax.let.fud))
                          : f.tokens.next.id === "const"
                          ? (rt("const"),
                            (y[f.tokens.next.value] = !0),
                            f.syntax["const"].fud.call(f.syntax["const"].fud))
                          : f.tokens.next.id === "function"
                          ? ((this.block = !0),
                            rt("function"),
                            (y[f.tokens.next.value] = !0),
                            f.syntax["function"].fud())
                          : f.tokens.next.id === "class"
                          ? ((this.block = !0),
                            rt("class"),
                            (y[f.tokens.next.value] = !0),
                            f.syntax["class"].fud())
                          : G("E024", f.tokens.next, f.tokens.next.value),
                        this
                      );
                    }).exps = !0),
                    bt("abstract"),
                    bt("boolean"),
                    bt("byte"),
                    bt("char"),
                    bt("class", { es5: !0, nud: rn }),
                    bt("double"),
                    bt("enum", { es5: !0 }),
                    bt("export", { es5: !0 }),
                    bt("extends", { es5: !0 }),
                    bt("final"),
                    bt("float"),
                    bt("goto"),
                    bt("implements", { es5: !0, strictOnly: !0 }),
                    bt("import", { es5: !0 }),
                    bt("int"),
                    bt("interface", { es5: !0, strictOnly: !0 }),
                    bt("long"),
                    bt("native"),
                    bt("package", { es5: !0, strictOnly: !0 }),
                    bt("private", { es5: !0, strictOnly: !0 }),
                    bt("protected", { es5: !0, strictOnly: !0 }),
                    bt("public", { es5: !0, strictOnly: !0 }),
                    bt("short"),
                    bt("static", { es5: !0, strictOnly: !0 }),
                    bt("super", { es5: !0 }),
                    bt("synchronized"),
                    bt("transient"),
                    bt("volatile");
                  var on = function () {
                      var e,
                        t,
                        n = -1,
                        i = 0,
                        s = {};
                      r.contains(["[", "{"], f.tokens.curr.value) && (i += 1);
                      do {
                        (e = n === -1 ? f.tokens.next : nt(n)),
                          (t = nt(n + 1)),
                          (n += 1),
                          r.contains(["[", "{"], e.value)
                            ? (i += 1)
                            : r.contains(["]", "}"], e.value) && (i -= 1);
                        if (e.identifier && e.value === "for" && i === 1) {
                          (s.isCompArray = !0), (s.notJson = !0);
                          break;
                        }
                        if (
                          r.contains(["}", "]"], e.value) &&
                          t.value === "=" &&
                          i === 0
                        ) {
                          (s.isDestAssign = !0), (s.notJson = !0);
                          break;
                        }
                        e.value === ";" && ((s.isBlock = !0), (s.notJson = !0));
                      } while (i > 0 && e.id !== "(end)" && n < 15);
                      return s;
                    },
                    an = function () {
                      function i(e) {
                        var t = n.variables.filter(function (t) {
                          if (t.value === e) return (t.undef = !1), e;
                        }).length;
                        return t !== 0;
                      }
                      function s(e) {
                        var t = n.variables.filter(function (t) {
                          if (t.value === e && !t.undef)
                            return t.unused === !0 && (t.unused = !1), e;
                        }).length;
                        return t === 0;
                      }
                      var e = function () {
                          (this.mode = "use"), (this.variables = []);
                        },
                        t = [],
                        n;
                      return {
                        stack: function () {
                          (n = new e()), t.push(n);
                        },
                        unstack: function () {
                          n.variables.filter(function (e) {
                            e.unused && K("W098", e.token, e.value),
                              e.undef && $(e.funct, "W117", e.token, e.value);
                          }),
                            t.splice(-1, 1),
                            (n = t[t.length - 1]);
                        },
                        setState: function (e) {
                          r.contains(
                            ["use", "define", "generate", "filter"],
                            e
                          ) && (n.mode = e);
                        },
                        check: function (e) {
                          if (!n) return;
                          return n && n.mode === "use"
                            ? (s(e) &&
                                n.variables.push({
                                  funct: w,
                                  token: f.tokens.curr,
                                  value: e,
                                  undef: !0,
                                  unused: !1,
                                }),
                              !0)
                            : n && n.mode === "define"
                            ? (i(e) ||
                                n.variables.push({
                                  funct: w,
                                  token: f.tokens.curr,
                                  value: e,
                                  undef: !1,
                                  unused: !0,
                                }),
                              !0)
                            : n && n.mode === "generate"
                            ? ($(w, "W117", f.tokens.curr, e), !0)
                            : n && n.mode === "filter"
                            ? (s(e) && $(w, "W117", f.tokens.curr, e), !0)
                            : !1;
                        },
                      };
                    },
                    ln = function () {
                      function n() {
                        for (var t in e)
                          if (e[t]["(type)"] === "unused" && f.option.unused) {
                            var n = e[t]["(token)"],
                              r = n.line,
                              i = n.character;
                            Q("W098", r, i, t);
                          }
                      }
                      var e = {},
                        t = [e];
                      return {
                        stack: function () {
                          (e = {}), t.push(e);
                        },
                        unstack: function () {
                          n(), t.splice(t.length - 1, 1), (e = r.last(t));
                        },
                        getlabel: function (e) {
                          for (var n = t.length - 1; n >= 0; --n)
                            if (r.has(t[n], e) && !t[n][e]["(shadowed)"])
                              return t[n];
                        },
                        shadow: function (e) {
                          for (var n = t.length - 1; n >= 0; n--)
                            r.has(t[n], e) && (t[n][e]["(shadowed)"] = !0);
                        },
                        unshadow: function (e) {
                          for (var n = t.length - 1; n >= 0; n--)
                            r.has(t[n], e) && (t[n][e]["(shadowed)"] = !1);
                        },
                        current: {
                          has: function (t) {
                            return r.has(e, t);
                          },
                          add: function (t, n, r) {
                            e[t] = {
                              "(type)": n,
                              "(token)": r,
                              "(shadowed)": !1,
                            };
                          },
                        },
                      };
                    },
                    cn = function (e, n, i) {
                      function v(e, t) {
                        if (!e) return;
                        !Array.isArray(e) &&
                          typeof e == "object" &&
                          (e = Object.keys(e)),
                          e.forEach(t);
                      }
                      var o,
                        a,
                        l,
                        h,
                        p = {},
                        d = {};
                      (n = r.clone(n)),
                        f.reset(),
                        n && n.scope
                          ? (c.scope = n.scope)
                          : ((c.errors = []),
                            (c.undefs = []),
                            (c.internals = []),
                            (c.blacklist = {}),
                            (c.scope = "(main)")),
                        (M = Object.create(null)),
                        W(M, s.ecmaIdentifiers),
                        W(M, s.reservedVars),
                        W(M, i || {}),
                        (g = Object.create(null)),
                        (y = Object.create(null));
                      if (n) {
                        v(n.predef || null, function (e) {
                          var t, r;
                          e[0] === "-"
                            ? ((t = e.slice(1)), (c.blacklist[t] = t))
                            : ((r = Object.getOwnPropertyDescriptor(
                                n.predef,
                                e
                              )),
                              (M[e] = r ? r.value : !1));
                        }),
                          v(n.exported || null, function (e) {
                            y[e] = !0;
                          }),
                          delete n.predef,
                          delete n.exported,
                          (h = Object.keys(n));
                        for (l = 0; l < h.length; l++)
                          /^-W\d{3}$/g.test(h[l])
                            ? (d[h[l].slice(1)] = !0)
                            : ((p[h[l]] = n[h[l]]),
                              h[l] === "newcap" &&
                                n[h[l]] === !1 &&
                                (p["(explicitNewcap)"] = !0));
                      }
                      (f.option = p),
                        (f.ignored = d),
                        (f.option.indent = f.option.indent || 4),
                        (f.option.maxerr = f.option.maxerr || 50),
                        (N = 1),
                        (S = Object.create(M)),
                        (D = S),
                        (w = $t("(global)", null, D, {
                          "(global)": !0,
                          "(blockscope)": ln(),
                          "(comparray)": an(),
                          "(metrics)": Kt(f.tokens.next),
                        })),
                        (E = [w]),
                        (B = []),
                        (P = null),
                        (L = {}),
                        (A = null),
                        (x = {}),
                        (T = !1),
                        (C = []),
                        (H = []);
                      if (!q(e) && !Array.isArray(e)) return Y("E004", 0), !1;
                      (t = {
                        get isJSON() {
                          return f.jsonMode;
                        },
                        getOption: function (e) {
                          return f.option[e] || null;
                        },
                        getCache: function (e) {
                          return f.cache[e];
                        },
                        setCache: function (e, t) {
                          f.cache[e] = t;
                        },
                        warn: function (e, t) {
                          Q.apply(null, [e, t.line, t.char].concat(t.data));
                        },
                        on: function (e, t) {
                          e.split(" ").forEach(
                            function (e) {
                              F.on(e, t);
                            }.bind(this)
                          );
                        },
                      }),
                        F.removeAllListeners(),
                        (j || []).forEach(function (e) {
                          e(t);
                        }),
                        (f.tokens.prev =
                          f.tokens.curr =
                          f.tokens.next =
                            f.syntax["(begin)"]),
                        (k = new u(e)),
                        k.on("warning", function (e) {
                          Q.apply(
                            null,
                            [e.code, e.line, e.character].concat(e.data)
                          );
                        }),
                        k.on("error", function (e) {
                          Y.apply(
                            null,
                            [e.code, e.line, e.character].concat(e.data)
                          );
                        }),
                        k.on("fatal", function (e) {
                          V("E041", e.line, e.from);
                        }),
                        k.on("Identifier", function (e) {
                          F.emit("Identifier", e);
                        }),
                        k.on("String", function (e) {
                          F.emit("String", e);
                        }),
                        k.on("Number", function (e) {
                          F.emit("Number", e);
                        }),
                        k.start();
                      for (var m in n) r.has(n, m) && I(m, f.tokens.curr);
                      X(), W(M, i || {}), (lt.first = !0);
                      try {
                        rt();
                        switch (f.tokens.next.id) {
                          case "{":
                          case "[":
                            un();
                            break;
                          default:
                            jt(),
                              f.directive["use strict"] &&
                                !f.option.globalstrict &&
                                !f.option.node &&
                                !f.option.phantom &&
                                K("W097", f.tokens.prev),
                              Bt();
                        }
                        rt(
                          f.tokens.next && f.tokens.next.value !== "."
                            ? "(end)"
                            : undefined
                        ),
                          w["(blockscope)"].unstack();
                        var b = function (e, t) {
                            do {
                              if (typeof t[e] == "string")
                                return (
                                  t[e] === "unused"
                                    ? (t[e] = "var")
                                    : t[e] === "unction" && (t[e] = "closure"),
                                  !0
                                );
                              t = t["(context)"];
                            } while (t);
                            return !1;
                          },
                          O = function (e, t) {
                            if (!x[e]) return;
                            var n = [];
                            for (var r = 0; r < x[e].length; r += 1)
                              x[e][r] !== t && n.push(x[e][r]);
                            n.length === 0 ? delete x[e] : (x[e] = n);
                          },
                          R = function (e, t, n, r) {
                            var i = t.line,
                              s = t.character;
                            r === undefined && (r = f.option.unused),
                              r === !0 && (r = "last-param");
                            var o = {
                              vars: ["var"],
                              "last-param": ["var", "param"],
                              strict: ["var", "param", "last-param"],
                            };
                            r &&
                              o[r] &&
                              o[r].indexOf(n) !== -1 &&
                              Q("W098", i, s, e),
                              H.push({ name: e, line: i, character: s });
                          },
                          U = function (e, t) {
                            var n = e[t],
                              i = e["(tokens)"][t];
                            if (t.charAt(0) === "(") return;
                            if (
                              n !== "unused" &&
                              n !== "unction" &&
                              n !== "const"
                            )
                              return;
                            if (
                              e["(params)"] &&
                              e["(params)"].indexOf(t) !== -1
                            )
                              return;
                            if (e["(global)"] && r.has(y, t)) return;
                            if (n === "const" && !Vt(e, t, "unused")) return;
                            R(t, i, "var");
                          };
                        for (o = 0; o < c.undefs.length; o += 1)
                          (a = c.undefs[o].slice(0)),
                            b(a[2].value, a[0])
                              ? O(a[2].value, a[2].line)
                              : f.option.undef && K.apply(K, a.slice(1));
                        E.forEach(function (e) {
                          if (e["(unusedOption)"] === !1) return;
                          for (var t in e) r.has(e, t) && U(e, t);
                          if (!e["(params)"]) return;
                          var n = e["(params)"].slice(),
                            i = n.pop(),
                            s,
                            o;
                          while (i) {
                            (s = e[i]),
                              (o = e["(unusedOption)"] || f.option.unused),
                              (o = o === !0 ? "last-param" : o);
                            if (i === "undefined") return;
                            if (s === "unused" || s === "unction")
                              R(
                                i,
                                e["(tokens)"][i],
                                "param",
                                e["(unusedOption)"]
                              );
                            else if (o === "last-param") return;
                            i = n.pop();
                          }
                        });
                        for (var z in g)
                          r.has(g, z) &&
                            !r.has(S, z) &&
                            !r.has(y, z) &&
                            R(z, g[z], "var");
                      } catch ($) {
                        if (!$ || $.name !== "JSHintError") throw $;
                        var J = f.tokens.next || {};
                        c.errors.push(
                          {
                            scope: "(main)",
                            raw: $.raw,
                            code: $.code,
                            reason: $.message,
                            line: $.line || J.line,
                            character: $.character || J.from,
                          },
                          null
                        );
                      }
                      if (c.scope === "(main)") {
                        n = n || {};
                        for (o = 0; o < c.internals.length; o += 1)
                          (a = c.internals[o]),
                            (n.scope = a.elem),
                            cn(a.value, n, i);
                      }
                      return c.errors.length === 0;
                    };
                  return (
                    (cn.addModule = function (e) {
                      j.push(e);
                    }),
                    cn.addModule(l.register),
                    (cn.data = function () {
                      var e = { functions: [], options: f.option },
                        t = [],
                        n = [],
                        i,
                        s,
                        o,
                        u,
                        a,
                        l;
                      cn.errors.length && (e.errors = cn.errors),
                        f.jsonMode && (e.json = !0);
                      for (a in x)
                        r.has(x, a) && t.push({ name: a, line: x[a] });
                      t.length > 0 && (e.implieds = t),
                        B.length > 0 && (e.urls = B),
                        (l = Object.keys(D)),
                        l.length > 0 && (e.globals = l);
                      for (o = 1; o < E.length; o += 1) {
                        (s = E[o]), (i = {});
                        for (u = 0; u < b.length; u += 1) i[b[u]] = [];
                        for (u = 0; u < b.length; u += 1)
                          i[b[u]].length === 0 && delete i[b[u]];
                        (i.name = s["(name)"]),
                          (i.param = s["(params)"]),
                          (i.line = s["(line)"]),
                          (i.character = s["(character)"]),
                          (i.last = s["(last)"]),
                          (i.lastcharacter = s["(lastcharacter)"]),
                          (i.metrics = {
                            complexity: s["(metrics)"].ComplexityCount,
                            parameters: (s["(params)"] || []).length,
                            statements: s["(metrics)"].statementCount,
                          }),
                          e.functions.push(i);
                      }
                      H.length > 0 && (e.unused = H), (n = []);
                      for (a in L)
                        if (typeof L[a] == "number") {
                          e.member = L;
                          break;
                        }
                      return e;
                    }),
                    (cn.jshint = cn),
                    cn
                  );
                })();
              typeof n == "object" && n && (n.JSHINT = c);
            },
            {
              "./lex.js": 4,
              "./messages.js": 5,
              "./reg.js": 6,
              "./state.js": 7,
              "./style.js": 8,
              "./vars.js": 9,
              events: 10,
              underscore: 2,
            },
          ],
          4: [
            function (e, t, n) {
              "use strict";
              function c() {
                var e = [];
                return {
                  push: function (t) {
                    e.push(t);
                  },
                  check: function () {
                    for (var t = 0; t < e.length; ++t) e[t]();
                    e.splice(0, e.length);
                  },
                };
              }
              function h(e) {
                var t = e;
                typeof t == "string" &&
                  (t = t
                    .replace(/\r\n/g, "\n")
                    .replace(/\r/g, "\n")
                    .split("\n")),
                  t[0] &&
                    t[0].substr(0, 2) === "#!" &&
                    (t[0].indexOf("node") !== -1 && (o.option.node = !0),
                    (t[0] = "")),
                  (this.emitter = new i.EventEmitter()),
                  (this.source = e),
                  this.setLines(t),
                  (this.prereg = !0),
                  (this.line = 0),
                  (this.char = 1),
                  (this.from = 1),
                  (this.input = ""),
                  (this.inComment = !1);
                for (var n = 0; n < o.option.indent; n += 1) o.tab += " ";
              }
              var r = e("underscore"),
                i = e("events"),
                s = e("./reg.js"),
                o = e("./state.js").state,
                u = e("../data/ascii-identifier-data.js"),
                a = u.asciiIdentifierStartTable,
                f = u.asciiIdentifierPartTable,
                l = {
                  Identifier: 1,
                  Punctuator: 2,
                  NumericLiteral: 3,
                  StringLiteral: 4,
                  Comment: 5,
                  Keyword: 6,
                  NullLiteral: 7,
                  BooleanLiteral: 8,
                  RegExp: 9,
                  TemplateLiteral: 10,
                };
              (h.prototype = {
                _lines: [],
                getLines: function () {
                  return (this._lines = o.lines), this._lines;
                },
                setLines: function (e) {
                  (this._lines = e), (o.lines = this._lines);
                },
                peek: function (e) {
                  return this.input.charAt(e || 0);
                },
                skip: function (e) {
                  (e = e || 1),
                    (this.char += e),
                    (this.input = this.input.slice(e));
                },
                on: function (e, t) {
                  e.split(" ").forEach(
                    function (e) {
                      this.emitter.on(e, t);
                    }.bind(this)
                  );
                },
                trigger: function () {
                  this.emitter.emit.apply(
                    this.emitter,
                    Array.prototype.slice.call(arguments)
                  );
                },
                triggerAsync: function (e, t, n, r) {
                  n.push(
                    function () {
                      r() && this.trigger(e, t);
                    }.bind(this)
                  );
                },
                scanPunctuator: function () {
                  var e = this.peek(),
                    t,
                    n,
                    r;
                  switch (e) {
                    case ".":
                      if (/^[0-9]$/.test(this.peek(1))) return null;
                      if (this.peek(1) === "." && this.peek(2) === ".")
                        return { type: l.Punctuator, value: "..." };
                    case "(":
                    case ")":
                    case ";":
                    case ",":
                    case "{":
                    case "}":
                    case "[":
                    case "]":
                    case ":":
                    case "~":
                    case "?":
                      return { type: l.Punctuator, value: e };
                    case "#":
                      return { type: l.Punctuator, value: e };
                    case "":
                      return null;
                  }
                  return (
                    (t = this.peek(1)),
                    (n = this.peek(2)),
                    (r = this.peek(3)),
                    e === ">" && t === ">" && n === ">" && r === "="
                      ? { type: l.Punctuator, value: ">>>=" }
                      : e === "=" && t === "=" && n === "="
                      ? { type: l.Punctuator, value: "===" }
                      : e === "!" && t === "=" && n === "="
                      ? { type: l.Punctuator, value: "!==" }
                      : e === ">" && t === ">" && n === ">"
                      ? { type: l.Punctuator, value: ">>>" }
                      : e === "<" && t === "<" && n === "="
                      ? { type: l.Punctuator, value: "<<=" }
                      : e === ">" && t === ">" && n === "="
                      ? { type: l.Punctuator, value: ">>=" }
                      : e === "=" && t === ">"
                      ? { type: l.Punctuator, value: e + t }
                      : e === t && "+-<>&|".indexOf(e) >= 0
                      ? { type: l.Punctuator, value: e + t }
                      : "<>=!+-*%&|^".indexOf(e) >= 0
                      ? t === "="
                        ? { type: l.Punctuator, value: e + t }
                        : { type: l.Punctuator, value: e }
                      : e === "/"
                      ? t === "=" && /\/=(?!(\S*\/[gim]?))/.test(this.input)
                        ? { type: l.Punctuator, value: "/=" }
                        : { type: l.Punctuator, value: "/" }
                      : null
                  );
                },
                scanComments: function () {
                  function s(e, t, n) {
                    var r = [
                        "jshint",
                        "jslint",
                        "members",
                        "member",
                        "globals",
                        "global",
                        "exported",
                      ],
                      i = !1,
                      s = e + t,
                      o = "plain";
                    return (
                      (n = n || {}),
                      n.isMultiline && (s += "*/"),
                      r.forEach(function (n) {
                        if (i) return;
                        if (e === "//" && n !== "jshint") return;
                        t.substr(0, n.length) === n &&
                          ((i = !0), (e += n), (t = t.substr(n.length))),
                          !i &&
                            t.charAt(0) === " " &&
                            t.substr(1, n.length) === n &&
                            ((i = !0),
                            (e = e + " " + n),
                            (t = t.substr(n.length + 1)));
                        if (!i) return;
                        switch (n) {
                          case "member":
                            o = "members";
                            break;
                          case "global":
                            o = "globals";
                            break;
                          default:
                            o = n;
                        }
                      }),
                      {
                        type: l.Comment,
                        commentType: o,
                        value: s,
                        body: t,
                        isSpecial: i,
                        isMultiline: n.isMultiline || !1,
                        isMalformed: n.isMalformed || !1,
                      }
                    );
                  }
                  var e = this.peek(),
                    t = this.peek(1),
                    n = this.input.substr(2),
                    r = this.line,
                    i = this.char;
                  if (e === "*" && t === "/")
                    return (
                      this.trigger("error", {
                        code: "E018",
                        line: r,
                        character: i,
                      }),
                      this.skip(2),
                      null
                    );
                  if (e !== "/" || (t !== "*" && t !== "/")) return null;
                  if (t === "/")
                    return this.skip(this.input.length), s("//", n);
                  var o = "";
                  if (t === "*") {
                    (this.inComment = !0), this.skip(2);
                    while (this.peek() !== "*" || this.peek(1) !== "/")
                      if (this.peek() === "") {
                        o += "\n";
                        if (!this.nextLine())
                          return (
                            this.trigger("error", {
                              code: "E017",
                              line: r,
                              character: i,
                            }),
                            (this.inComment = !1),
                            s("/*", o, { isMultiline: !0, isMalformed: !0 })
                          );
                      } else (o += this.peek()), this.skip();
                    return (
                      this.skip(2),
                      (this.inComment = !1),
                      s("/*", o, { isMultiline: !0 })
                    );
                  }
                },
                scanKeyword: function () {
                  var e = /^[a-zA-Z_$][a-zA-Z0-9_$]*/.exec(this.input),
                    t = [
                      "if",
                      "in",
                      "do",
                      "var",
                      "for",
                      "new",
                      "try",
                      "let",
                      "this",
                      "else",
                      "case",
                      "void",
                      "with",
                      "enum",
                      "while",
                      "break",
                      "catch",
                      "throw",
                      "const",
                      "yield",
                      "class",
                      "super",
                      "return",
                      "typeof",
                      "delete",
                      "switch",
                      "export",
                      "import",
                      "default",
                      "finally",
                      "extends",
                      "function",
                      "continue",
                      "debugger",
                      "instanceof",
                    ];
                  return e && t.indexOf(e[0]) >= 0
                    ? { type: l.Keyword, value: e[0] }
                    : null;
                },
                scanIdentifier: function () {
                  function i(e) {
                    return e > 256;
                  }
                  function s(e) {
                    return e > 256;
                  }
                  function o(e) {
                    return /^[0-9a-fA-F]$/.test(e);
                  }
                  var e = "",
                    t = 0,
                    n,
                    r,
                    u = function () {
                      t += 1;
                      if (this.peek(t) !== "u") return null;
                      var e = this.peek(t + 1),
                        n = this.peek(t + 2),
                        r = this.peek(t + 3),
                        i = this.peek(t + 4),
                        u;
                      return o(e) && o(n) && o(r) && o(i)
                        ? ((u = parseInt(e + n + r + i, 16)),
                          f[u] || s(u)
                            ? ((t += 5), "\\u" + e + n + r + i)
                            : null)
                        : null;
                    }.bind(this),
                    c = function () {
                      var e = this.peek(t),
                        n = e.charCodeAt(0);
                      return n === 92
                        ? u()
                        : n < 128
                        ? a[n]
                          ? ((t += 1), e)
                          : null
                        : i(n)
                        ? ((t += 1), e)
                        : null;
                    }.bind(this),
                    h = function () {
                      var e = this.peek(t),
                        n = e.charCodeAt(0);
                      return n === 92
                        ? u()
                        : n < 128
                        ? f[n]
                          ? ((t += 1), e)
                          : null
                        : s(n)
                        ? ((t += 1), e)
                        : null;
                    }.bind(this);
                  r = c();
                  if (r === null) return null;
                  e = r;
                  for (;;) {
                    r = h();
                    if (r === null) break;
                    e += r;
                  }
                  switch (e) {
                    case "true":
                    case "false":
                      n = l.BooleanLiteral;
                      break;
                    case "null":
                      n = l.NullLiteral;
                      break;
                    default:
                      n = l.Identifier;
                  }
                  return { type: n, value: e };
                },
                scanNumericLiteral: function () {
                  function s(e) {
                    return /^[0-9]$/.test(e);
                  }
                  function o(e) {
                    return /^[0-7]$/.test(e);
                  }
                  function u(e) {
                    return /^[0-9a-fA-F]$/.test(e);
                  }
                  function a(e) {
                    return (
                      e === "$" ||
                      e === "_" ||
                      e === "\\" ||
                      (e >= "a" && e <= "z") ||
                      (e >= "A" && e <= "Z")
                    );
                  }
                  var e = 0,
                    t = "",
                    n = this.input.length,
                    r = this.peek(e),
                    i;
                  if (r !== "." && !s(r)) return null;
                  if (r !== ".") {
                    (t = this.peek(e)), (e += 1), (r = this.peek(e));
                    if (t === "0") {
                      if (r === "x" || r === "X") {
                        (e += 1), (t += r);
                        while (e < n) {
                          r = this.peek(e);
                          if (!u(r)) break;
                          (t += r), (e += 1);
                        }
                        if (t.length <= 2)
                          return {
                            type: l.NumericLiteral,
                            value: t,
                            isMalformed: !0,
                          };
                        if (e < n) {
                          r = this.peek(e);
                          if (a(r)) return null;
                        }
                        return {
                          type: l.NumericLiteral,
                          value: t,
                          base: 16,
                          isMalformed: !1,
                        };
                      }
                      if (o(r)) {
                        (e += 1), (t += r), (i = !1);
                        while (e < n) {
                          r = this.peek(e);
                          if (s(r)) i = !0;
                          else if (!o(r)) break;
                          (t += r), (e += 1);
                        }
                        if (e < n) {
                          r = this.peek(e);
                          if (a(r)) return null;
                        }
                        return {
                          type: l.NumericLiteral,
                          value: t,
                          base: 8,
                          isMalformed: !1,
                        };
                      }
                      s(r) && ((e += 1), (t += r));
                    }
                    while (e < n) {
                      r = this.peek(e);
                      if (!s(r)) break;
                      (t += r), (e += 1);
                    }
                  }
                  if (r === ".") {
                    (t += r), (e += 1);
                    while (e < n) {
                      r = this.peek(e);
                      if (!s(r)) break;
                      (t += r), (e += 1);
                    }
                  }
                  if (r === "e" || r === "E") {
                    (t += r), (e += 1), (r = this.peek(e));
                    if (r === "+" || r === "-") (t += this.peek(e)), (e += 1);
                    r = this.peek(e);
                    if (!s(r)) return null;
                    (t += r), (e += 1);
                    while (e < n) {
                      r = this.peek(e);
                      if (!s(r)) break;
                      (t += r), (e += 1);
                    }
                  }
                  if (e < n) {
                    r = this.peek(e);
                    if (a(r)) return null;
                  }
                  return {
                    type: l.NumericLiteral,
                    value: t,
                    base: 10,
                    isMalformed: !isFinite(t),
                  };
                },
                scanTemplateLiteral: function () {
                  if (!o.option.esnext || this.peek() !== "`") return null;
                  var e = this.line,
                    t = this.char,
                    n = 1,
                    r = "";
                  this.skip();
                  while (this.peek() !== "`") {
                    while (this.peek() === "") {
                      if (!this.nextLine())
                        return (
                          this.trigger("error", {
                            code: "E052",
                            line: e,
                            character: t,
                          }),
                          { type: l.TemplateLiteral, value: r, isUnclosed: !0 }
                        );
                      r += "\n";
                    }
                    var i = this.peek();
                    this.skip(n), (r += i);
                  }
                  return (
                    this.skip(),
                    { type: l.TemplateLiteral, value: r, isUnclosed: !1 }
                  );
                },
                scanStringLiteral: function (e) {
                  var t = this.peek();
                  if (t !== '"' && t !== "'") return null;
                  this.triggerAsync(
                    "warning",
                    { code: "W108", line: this.line, character: this.char },
                    e,
                    function () {
                      return o.jsonMode && t !== '"';
                    }
                  );
                  var n = "",
                    r = this.line,
                    i = this.char,
                    s = !1;
                  this.skip();
                  e: while (this.peek() !== t) {
                    while (this.peek() === "") {
                      s
                        ? ((s = !1),
                          this.triggerAsync(
                            "warning",
                            {
                              code: "W043",
                              line: this.line,
                              character: this.char,
                            },
                            e,
                            function () {
                              return !o.option.multistr;
                            }
                          ),
                          this.triggerAsync(
                            "warning",
                            {
                              code: "W042",
                              line: this.line,
                              character: this.char,
                            },
                            e,
                            function () {
                              return o.jsonMode && o.option.multistr;
                            }
                          ))
                        : this.trigger("warning", {
                            code: "W112",
                            line: this.line,
                            character: this.char,
                          });
                      if (!this.nextLine())
                        return (
                          this.trigger("error", {
                            code: "E029",
                            line: r,
                            character: i,
                          }),
                          {
                            type: l.StringLiteral,
                            value: n,
                            isUnclosed: !0,
                            quote: t,
                          }
                        );
                      if (this.peek() == t) break e;
                    }
                    s = !1;
                    var u = this.peek(),
                      a = 1;
                    u < " " &&
                      this.trigger("warning", {
                        code: "W113",
                        line: this.line,
                        character: this.char,
                        data: ["<non-printable>"],
                      });
                    if (u === "\\") {
                      this.skip(), (u = this.peek());
                      switch (u) {
                        case "'":
                          this.triggerAsync(
                            "warning",
                            {
                              code: "W114",
                              line: this.line,
                              character: this.char,
                              data: ["\\'"],
                            },
                            e,
                            function () {
                              return o.jsonMode;
                            }
                          );
                          break;
                        case "b":
                          u = "\\b";
                          break;
                        case "f":
                          u = "\\f";
                          break;
                        case "n":
                          u = "\\n";
                          break;
                        case "r":
                          u = "\\r";
                          break;
                        case "t":
                          u = "\\t";
                          break;
                        case "0":
                          u = "\\0";
                          var f = parseInt(this.peek(1), 10);
                          this.triggerAsync(
                            "warning",
                            {
                              code: "W115",
                              line: this.line,
                              character: this.char,
                            },
                            e,
                            function () {
                              return (
                                f >= 0 && f <= 7 && o.directive["use strict"]
                              );
                            }
                          );
                          break;
                        case "u":
                          (u = String.fromCharCode(
                            parseInt(this.input.substr(1, 4), 16)
                          )),
                            (a = 5);
                          break;
                        case "v":
                          this.triggerAsync(
                            "warning",
                            {
                              code: "W114",
                              line: this.line,
                              character: this.char,
                              data: ["\\v"],
                            },
                            e,
                            function () {
                              return o.jsonMode;
                            }
                          ),
                            (u = "");
                          break;
                        case "x":
                          var c = parseInt(this.input.substr(1, 2), 16);
                          this.triggerAsync(
                            "warning",
                            {
                              code: "W114",
                              line: this.line,
                              character: this.char,
                              data: ["\\x-"],
                            },
                            e,
                            function () {
                              return o.jsonMode;
                            }
                          ),
                            (u = String.fromCharCode(c)),
                            (a = 3);
                          break;
                        case "\\":
                          u = "\\\\";
                          break;
                        case '"':
                          u = '\\"';
                          break;
                        case "/":
                          break;
                        case "":
                          (s = !0), (u = "");
                          break;
                        case "!":
                          if (n.slice(n.length - 2) === "<") break;
                        default:
                          this.trigger("warning", {
                            code: "W044",
                            line: this.line,
                            character: this.char,
                          });
                      }
                    }
                    (n += u), this.skip(a);
                  }
                  return (
                    this.skip(),
                    {
                      type: l.StringLiteral,
                      value: n,
                      isUnclosed: !1,
                      quote: t,
                    }
                  );
                },
                scanRegExp: function () {
                  var e = 0,
                    t = this.input.length,
                    n = this.peek(),
                    r = n,
                    i = "",
                    s = [],
                    o = !1,
                    u = !1,
                    a,
                    f = function () {
                      n < " " &&
                        ((o = !0),
                        this.trigger("warning", {
                          code: "W048",
                          line: this.line,
                          character: this.char,
                        })),
                        n === "<" &&
                          ((o = !0),
                          this.trigger("warning", {
                            code: "W049",
                            line: this.line,
                            character: this.char,
                            data: [n],
                          }));
                    }.bind(this);
                  if (!this.prereg || n !== "/") return null;
                  (e += 1), (a = !1);
                  while (e < t) {
                    (n = this.peek(e)), (r += n), (i += n);
                    if (u) {
                      n === "]" &&
                        (this.peek(e - 1) !== "\\" ||
                          this.peek(e - 2) === "\\") &&
                        (u = !1),
                        n === "\\" &&
                          ((e += 1),
                          (n = this.peek(e)),
                          (i += n),
                          (r += n),
                          f()),
                        (e += 1);
                      continue;
                    }
                    if (n === "\\") {
                      (e += 1), (n = this.peek(e)), (i += n), (r += n), f();
                      if (n === "/") {
                        e += 1;
                        continue;
                      }
                      if (n === "[") {
                        e += 1;
                        continue;
                      }
                    }
                    if (n === "[") {
                      (u = !0), (e += 1);
                      continue;
                    }
                    if (n === "/") {
                      (i = i.substr(0, i.length - 1)), (a = !0), (e += 1);
                      break;
                    }
                    e += 1;
                  }
                  if (!a)
                    return (
                      this.trigger("error", {
                        code: "E015",
                        line: this.line,
                        character: this.from,
                      }),
                      void this.trigger("fatal", {
                        line: this.line,
                        from: this.from,
                      })
                    );
                  while (e < t) {
                    n = this.peek(e);
                    if (!/[gim]/.test(n)) break;
                    s.push(n), (r += n), (e += 1);
                  }
                  try {
                    new RegExp(i, s.join(""));
                  } catch (c) {
                    (o = !0),
                      this.trigger("error", {
                        code: "E016",
                        line: this.line,
                        character: this.char,
                        data: [c.message],
                      });
                  }
                  return { type: l.RegExp, value: r, flags: s, isMalformed: o };
                },
                scanNonBreakingSpaces: function () {
                  return o.option.nonbsp ? this.input.search(/(\u00A0)/) : -1;
                },
                scanUnsafeChars: function () {
                  return this.input.search(s.unsafeChars);
                },
                next: function (e) {
                  this.from = this.char;
                  var t;
                  if (/\s/.test(this.peek())) {
                    t = this.char;
                    while (/\s/.test(this.peek()))
                      (this.from += 1), this.skip();
                  }
                  var n =
                    this.scanComments() ||
                    this.scanStringLiteral(e) ||
                    this.scanTemplateLiteral();
                  return n
                    ? n
                    : ((n =
                        this.scanRegExp() ||
                        this.scanPunctuator() ||
                        this.scanKeyword() ||
                        this.scanIdentifier() ||
                        this.scanNumericLiteral()),
                      n ? (this.skip(n.value.length), n) : null);
                },
                nextLine: function () {
                  var e;
                  if (this.line >= this.getLines().length) return !1;
                  (this.input = this.getLines()[this.line]),
                    (this.line += 1),
                    (this.char = 1),
                    (this.from = 1);
                  var t = this.input.trim(),
                    n = function () {
                      return r.some(arguments, function (e) {
                        return t.indexOf(e) === 0;
                      });
                    },
                    i = function () {
                      return r.some(arguments, function (e) {
                        return t.indexOf(e, t.length - e.length) !== -1;
                      });
                    };
                  o.ignoreLinterErrors === !0 &&
                    !n("/*", "//") &&
                    !i("*/") &&
                    (this.input = ""),
                    (e = this.scanNonBreakingSpaces()),
                    e >= 0 &&
                      this.trigger("warning", {
                        code: "W125",
                        line: this.line,
                        character: e + 1,
                      }),
                    (this.input = this.input.replace(/\t/g, o.tab)),
                    (e = this.scanUnsafeChars()),
                    e >= 0 &&
                      this.trigger("warning", {
                        code: "W100",
                        line: this.line,
                        character: e,
                      });
                  if (o.option.maxlen && o.option.maxlen < this.input.length) {
                    var u =
                        this.inComment || n.call(t, "//") || n.call(t, "/*"),
                      a = !u || !s.maxlenException.test(t);
                    a &&
                      this.trigger("warning", {
                        code: "W101",
                        line: this.line,
                        character: this.input.length,
                      });
                  }
                  return !0;
                },
                start: function () {
                  this.nextLine();
                },
                token: function () {
                  function n(e, t) {
                    if (!e.reserved) return !1;
                    var n = e.meta;
                    if (n && n.isFutureReservedWord && o.option.inES5()) {
                      if (!n.es5) return !1;
                      if (
                        n.strictOnly &&
                        !o.option.strict &&
                        !o.directive["use strict"]
                      )
                        return !1;
                      if (t) return !1;
                    }
                    return !0;
                  }
                  var e = c(),
                    t,
                    i = function (t, i, s) {
                      var u;
                      t !== "(endline)" && t !== "(end)" && (this.prereg = !1);
                      if (t === "(punctuator)") {
                        switch (i) {
                          case ".":
                          case ")":
                          case "~":
                          case "#":
                          case "]":
                            this.prereg = !1;
                            break;
                          default:
                            this.prereg = !0;
                        }
                        u = Object.create(o.syntax[i] || o.syntax["(error)"]);
                      }
                      if (t === "(identifier)") {
                        if (i === "return" || i === "case" || i === "typeof")
                          this.prereg = !0;
                        r.has(o.syntax, i) &&
                          ((u = Object.create(
                            o.syntax[i] || o.syntax["(error)"]
                          )),
                          n(u, s && t === "(identifier)") || (u = null));
                      }
                      return (
                        u || (u = Object.create(o.syntax[t])),
                        (u.identifier = t === "(identifier)"),
                        (u.type = u.type || t),
                        (u.value = i),
                        (u.line = this.line),
                        (u.character = this.char),
                        (u.from = this.from),
                        s && u.identifier && (u.isProperty = s),
                        (u.check = e.check),
                        u
                      );
                    }.bind(this);
                  for (;;) {
                    if (!this.input.length)
                      return i(this.nextLine() ? "(endline)" : "(end)", "");
                    t = this.next(e);
                    if (!t) {
                      this.input.length &&
                        (this.trigger("error", {
                          code: "E024",
                          line: this.line,
                          character: this.char,
                          data: [this.peek()],
                        }),
                        (this.input = ""));
                      continue;
                    }
                    switch (t.type) {
                      case l.StringLiteral:
                        return (
                          this.triggerAsync(
                            "String",
                            {
                              line: this.line,
                              char: this.char,
                              from: this.from,
                              value: t.value,
                              quote: t.quote,
                            },
                            e,
                            function () {
                              return !0;
                            }
                          ),
                          i("(string)", t.value)
                        );
                      case l.TemplateLiteral:
                        return (
                          this.trigger("Template", {
                            line: this.line,
                            char: this.char,
                            from: this.from,
                            value: t.value,
                          }),
                          i("(template)", t.value)
                        );
                      case l.Identifier:
                        this.trigger("Identifier", {
                          line: this.line,
                          char: this.char,
                          from: this.form,
                          name: t.value,
                          isProperty: o.tokens.curr.id === ".",
                        });
                      case l.Keyword:
                      case l.NullLiteral:
                      case l.BooleanLiteral:
                        return i(
                          "(identifier)",
                          t.value,
                          o.tokens.curr.id === "."
                        );
                      case l.NumericLiteral:
                        return (
                          t.isMalformed &&
                            this.trigger("warning", {
                              code: "W045",
                              line: this.line,
                              character: this.char,
                              data: [t.value],
                            }),
                          this.triggerAsync(
                            "warning",
                            {
                              code: "W114",
                              line: this.line,
                              character: this.char,
                              data: ["0x-"],
                            },
                            e,
                            function () {
                              return t.base === 16 && o.jsonMode;
                            }
                          ),
                          this.triggerAsync(
                            "warning",
                            {
                              code: "W115",
                              line: this.line,
                              character: this.char,
                            },
                            e,
                            function () {
                              return o.directive["use strict"] && t.base === 8;
                            }
                          ),
                          this.trigger("Number", {
                            line: this.line,
                            char: this.char,
                            from: this.from,
                            value: t.value,
                            base: t.base,
                            isMalformed: t.malformed,
                          }),
                          i("(number)", t.value)
                        );
                      case l.RegExp:
                        return i("(regexp)", t.value);
                      case l.Comment:
                        o.tokens.curr.comment = !0;
                        if (t.isSpecial)
                          return {
                            id: "(comment)",
                            value: t.value,
                            body: t.body,
                            type: t.commentType,
                            isSpecial: t.isSpecial,
                            line: this.line,
                            character: this.char,
                            from: this.from,
                          };
                        break;
                      case "":
                        break;
                      default:
                        return i("(punctuator)", t.value);
                    }
                  }
                },
              }),
                (n.Lexer = h);
            },
            {
              "../data/ascii-identifier-data.js": 1,
              "./reg.js": 6,
              "./state.js": 7,
              events: 10,
              underscore: 2,
            },
          ],
          5: [
            function (e, t, n) {
              "use strict";
              var r = e("underscore"),
                i = {
                  E001: "Bad option: '{a}'.",
                  E002: "Bad option value.",
                  E003: "Expected a JSON value.",
                  E004: "Input is neither a string nor an array of strings.",
                  E005: "Input is empty.",
                  E006: "Unexpected early end of program.",
                  E007: 'Missing "use strict" statement.',
                  E008: "Strict violation.",
                  E009: "Option 'validthis' can't be used in a global scope.",
                  E010: "'with' is not allowed in strict mode.",
                  E011: "const '{a}' has already been declared.",
                  E012: "const '{a}' is initialized to 'undefined'.",
                  E013: "Attempting to override '{a}' which is a constant.",
                  E014: "A regular expression literal can be confused with '/='.",
                  E015: "Unclosed regular expression.",
                  E016: "Invalid regular expression.",
                  E017: "Unclosed comment.",
                  E018: "Unbegun comment.",
                  E019: "Unmatched '{a}'.",
                  E020: "Expected '{a}' to match '{b}' from line {c} and instead saw '{d}'.",
                  E021: "Expected '{a}' and instead saw '{b}'.",
                  E022: "Line breaking error '{a}'.",
                  E023: "Missing '{a}'.",
                  E024: "Unexpected '{a}'.",
                  E025: "Missing ':' on a case clause.",
                  E026: "Missing '}' to match '{' from line {a}.",
                  E027: "Missing ']' to match '[' from line {a}.",
                  E028: "Illegal comma.",
                  E029: "Unclosed string.",
                  E030: "Expected an identifier and instead saw '{a}'.",
                  E031: "Bad assignment.",
                  E032: "Expected a small integer or 'false' and instead saw '{a}'.",
                  E033: "Expected an operator and instead saw '{a}'.",
                  E034: "get/set are ES5 features.",
                  E035: "Missing property name.",
                  E036: "Expected to see a statement and instead saw a block.",
                  E037: null,
                  E038: null,
                  E039: "Function declarations are not invocable. Wrap the whole function invocation in parens.",
                  E040: "Each value should have its own case label.",
                  E041: "Unrecoverable syntax error.",
                  E042: "Stopping.",
                  E043: "Too many errors.",
                  E044: null,
                  E045: "Invalid for each loop.",
                  E046: "A yield statement shall be within a generator function (with syntax: `function*`)",
                  E047: null,
                  E048: "Let declaration not directly within block.",
                  E049: "A {a} cannot be named '{b}'.",
                  E050: "Mozilla requires the yield expression to be parenthesized here.",
                  E051: "Regular parameters cannot come after default parameters.",
                  E052: "Unclosed template literal.",
                },
                s = {
                  W001: "'hasOwnProperty' is a really bad name.",
                  W002: "Value of '{a}' may be overwritten in IE 8 and earlier.",
                  W003: "'{a}' was used before it was defined.",
                  W004: "'{a}' is already defined.",
                  W005: "A dot following a number can be confused with a decimal point.",
                  W006: "Confusing minuses.",
                  W007: "Confusing plusses.",
                  W008: "A leading decimal point can be confused with a dot: '{a}'.",
                  W009: "The array literal notation [] is preferable.",
                  W010: "The object literal notation {} is preferable.",
                  W011: null,
                  W012: null,
                  W013: null,
                  W014: "Bad line breaking before '{a}'.",
                  W015: null,
                  W016: "Unexpected use of '{a}'.",
                  W017: "Bad operand.",
                  W018: "Confusing use of '{a}'.",
                  W019: "Use the isNaN function to compare with NaN.",
                  W020: "Read only.",
                  W021: "'{a}' is a function.",
                  W022: "Do not assign to the exception parameter.",
                  W023: "Expected an identifier in an assignment and instead saw a function invocation.",
                  W024: "Expected an identifier and instead saw '{a}' (a reserved word).",
                  W025: "Missing name in function declaration.",
                  W026: "Inner functions should be listed at the top of the outer function.",
                  W027: "Unreachable '{a}' after '{b}'.",
                  W028: "Label '{a}' on {b} statement.",
                  W030: "Expected an assignment or function call and instead saw an expression.",
                  W031: "Do not use 'new' for side effects.",
                  W032: "Unnecessary semicolon.",
                  W033: "Missing semicolon.",
                  W034: 'Unnecessary directive "{a}".',
                  W035: "Empty block.",
                  W036: "Unexpected /*member '{a}'.",
                  W037: "'{a}' is a statement label.",
                  W038: "'{a}' used out of scope.",
                  W039: "'{a}' is not allowed.",
                  W040: "Possible strict violation.",
                  W041: "Use '{a}' to compare with '{b}'.",
                  W042: "Avoid EOL escaping.",
                  W043: "Bad escaping of EOL. Use option multistr if needed.",
                  W044: "Bad or unnecessary escaping.",
                  W045: "Bad number '{a}'.",
                  W046: "Don't use extra leading zeros '{a}'.",
                  W047: "A trailing decimal point can be confused with a dot: '{a}'.",
                  W048: "Unexpected control character in regular expression.",
                  W049: "Unexpected escaped character '{a}' in regular expression.",
                  W050: "JavaScript URL.",
                  W051: "Variables should not be deleted.",
                  W052: "Unexpected '{a}'.",
                  W053: "Do not use {a} as a constructor.",
                  W054: "The Function constructor is a form of eval.",
                  W055: "A constructor name should start with an uppercase letter.",
                  W056: "Bad constructor.",
                  W057: "Weird construction. Is 'new' necessary?",
                  W058: "Missing '()' invoking a constructor.",
                  W059: "Avoid arguments.{a}.",
                  W060: "document.write can be a form of eval.",
                  W061: "eval can be harmful.",
                  W062: "Wrap an immediate function invocation in parens to assist the reader in understanding that the expression is the result of a function, and not the function itself.",
                  W063: "Math is not a function.",
                  W064: "Missing 'new' prefix when invoking a constructor.",
                  W065: "Missing radix parameter.",
                  W066: "Implied eval. Consider passing a function instead of a string.",
                  W067: "Bad invocation.",
                  W068: "Wrapping non-IIFE function literals in parens is unnecessary.",
                  W069: "['{a}'] is better written in dot notation.",
                  W070: "Extra comma. (it breaks older versions of IE)",
                  W071: "This function has too many statements. ({a})",
                  W072: "This function has too many parameters. ({a})",
                  W073: "Blocks are nested too deeply. ({a})",
                  W074: "This function's cyclomatic complexity is too high. ({a})",
                  W075: "Duplicate key '{a}'.",
                  W076: "Unexpected parameter '{a}' in get {b} function.",
                  W077: "Expected a single parameter in set {a} function.",
                  W078: "Setter is defined without getter.",
                  W079: "Redefinition of '{a}'.",
                  W080: "It's not necessary to initialize '{a}' to 'undefined'.",
                  W081: null,
                  W082: "Function declarations should not be placed in blocks. Use a function expression or move the statement to the top of the outer function.",
                  W083: "Don't make functions within a loop.",
                  W084: "Assignment in conditional expression",
                  W085: "Don't use 'with'.",
                  W086: "Expected a 'break' statement before '{a}'.",
                  W087: "Forgotten 'debugger' statement?",
                  W088: "Creating global 'for' variable. Should be 'for (var {a} ...'.",
                  W089: "The body of a for in should be wrapped in an if statement to filter unwanted properties from the prototype.",
                  W090: "'{a}' is not a statement label.",
                  W091: "'{a}' is out of scope.",
                  W093: "Did you mean to return a conditional instead of an assignment?",
                  W094: "Unexpected comma.",
                  W095: "Expected a string and instead saw {a}.",
                  W096: "The '{a}' key may produce unexpected results.",
                  W097: 'Use the function form of "use strict".',
                  W098: "'{a}' is defined but never used.",
                  W099: null,
                  W100: "This character may get silently deleted by one or more browsers.",
                  W101: "Line is too long.",
                  W102: null,
                  W103: "The '{a}' property is deprecated.",
                  W104: "'{a}' is available in ES6 (use esnext option) or Mozilla JS extensions (use moz).",
                  W105: "Unexpected {a} in '{b}'.",
                  W106: "Identifier '{a}' is not in camel case.",
                  W107: "Script URL.",
                  W108: "Strings must use doublequote.",
                  W109: "Strings must use singlequote.",
                  W110: "Mixed double and single quotes.",
                  W112: "Unclosed string.",
                  W113: "Control character in string: {a}.",
                  W114: "Avoid {a}.",
                  W115: "Octal literals are not allowed in strict mode.",
                  W116: "Expected '{a}' and instead saw '{b}'.",
                  W117: "'{a}' is not defined.",
                  W118: "'{a}' is only available in Mozilla JavaScript extensions (use moz option).",
                  W119: "'{a}' is only available in ES6 (use esnext option).",
                  W120: "You might be leaking a variable ({a}) here.",
                  W121: "Extending prototype of native object: '{a}'.",
                  W122: "Invalid typeof value '{a}'",
                  W123: "'{a}' is already defined in outer scope.",
                  W124: "A generator function shall contain a yield statement.",
                  W125: "This line contains non-breaking spaces: http://jshint.com/doc/options/#nonbsp",
                },
                o = {
                  I001: "Comma warnings can be turned off with 'laxcomma'.",
                  I002: null,
                  I003: "ES5 option is now set per default",
                };
              (n.errors = {}),
                (n.warnings = {}),
                (n.info = {}),
                r.each(i, function (e, t) {
                  n.errors[t] = { code: t, desc: e };
                }),
                r.each(s, function (e, t) {
                  n.warnings[t] = { code: t, desc: e };
                }),
                r.each(o, function (e, t) {
                  n.info[t] = { code: t, desc: e };
                });
            },
            { underscore: 2 },
          ],
          6: [
            function (e, t, n) {
              "use string";
              (n.unsafeString = /@cc|<\/?|script|\]\s*\]|<\s*!|&lt/i),
                (n.unsafeChars =
                  /[\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/),
                (n.needEsc =
                  /[\u0000-\u001f&<"\/\\\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/),
                (n.needEscGlobal =
                  /[\u0000-\u001f&<"\/\\\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g),
                (n.starSlash = /\*\//),
                (n.identifier = /^([a-zA-Z_$][a-zA-Z0-9_$]*)$/),
                (n.javascriptURL =
                  /^(?:javascript|jscript|ecmascript|vbscript|livescript)\s*:/i),
                (n.fallsThrough = /^\s*\/\*\s*falls?\sthrough\s*\*\/\s*$/),
                (n.maxlenException = /^(?:(?:\/\/|\/\*|\*) ?)?[^ ]+$/);
            },
            {},
          ],
          7: [
            function (e, t, n) {
              "use strict";
              var r = {
                syntax: {},
                reset: function () {
                  (this.tokens = { prev: null, next: null, curr: null }),
                    (this.option = {}),
                    (this.ignored = {}),
                    (this.directive = {}),
                    (this.jsonMode = !1),
                    (this.jsonWarnings = []),
                    (this.lines = []),
                    (this.tab = ""),
                    (this.cache = {}),
                    (this.ignoredLines = {}),
                    (this.ignoreLinterErrors = !1);
                },
              };
              n.state = r;
            },
            {},
          ],
          8: [
            function (e, t, n) {
              "use strict";
              n.register = function (e) {
                e.on("Identifier", function (n) {
                  if (e.getOption("proto")) return;
                  n.name === "__proto__" &&
                    e.warn("W103", {
                      line: n.line,
                      char: n.char,
                      data: [n.name],
                    });
                }),
                  e.on("Identifier", function (n) {
                    if (e.getOption("iterator")) return;
                    n.name === "__iterator__" &&
                      e.warn("W104", {
                        line: n.line,
                        char: n.char,
                        data: [n.name],
                      });
                  }),
                  e.on("Identifier", function (n) {
                    if (!e.getOption("camelcase")) return;
                    n.name.replace(/^_+|_+$/g, "").indexOf("_") > -1 &&
                      !n.name.match(/^[A-Z0-9_]*$/) &&
                      e.warn("W106", {
                        line: n.line,
                        char: n.from,
                        data: [n.name],
                      });
                  }),
                  e.on("String", function (n) {
                    var r = e.getOption("quotmark"),
                      i;
                    if (!r) return;
                    r === "single" && n.quote !== "'" && (i = "W109"),
                      r === "double" && n.quote !== '"' && (i = "W108"),
                      r === !0 &&
                        (e.getCache("quotmark") ||
                          e.setCache("quotmark", n.quote),
                        e.getCache("quotmark") !== n.quote && (i = "W110")),
                      i && e.warn(i, { line: n.line, char: n.char });
                  }),
                  e.on("Number", function (n) {
                    n.value.charAt(0) === "." &&
                      e.warn("W008", {
                        line: n.line,
                        char: n.char,
                        data: [n.value],
                      }),
                      n.value.substr(n.value.length - 1) === "." &&
                        e.warn("W047", {
                          line: n.line,
                          char: n.char,
                          data: [n.value],
                        }),
                      /^00+/.test(n.value) &&
                        e.warn("W046", {
                          line: n.line,
                          char: n.char,
                          data: [n.value],
                        });
                  }),
                  e.on("String", function (n) {
                    var r =
                      /^(?:javascript|jscript|ecmascript|vbscript|livescript)\s*:/i;
                    if (e.getOption("scripturl")) return;
                    r.test(n.value) &&
                      e.warn("W107", { line: n.line, char: n.char });
                  });
              };
            },
            {},
          ],
          9: [
            function (e, t, n) {
              "use strict";
              (n.reservedVars = { arguments: !1, NaN: !1 }),
                (n.ecmaIdentifiers = {
                  Array: !1,
                  Boolean: !1,
                  Date: !1,
                  decodeURI: !1,
                  decodeURIComponent: !1,
                  encodeURI: !1,
                  encodeURIComponent: !1,
                  Error: !1,
                  eval: !1,
                  EvalError: !1,
                  Function: !1,
                  hasOwnProperty: !1,
                  isFinite: !1,
                  isNaN: !1,
                  JSON: !1,
                  Math: !1,
                  Number: !1,
                  Object: !1,
                  parseInt: !1,
                  parseFloat: !1,
                  RangeError: !1,
                  ReferenceError: !1,
                  RegExp: !1,
                  String: !1,
                  SyntaxError: !1,
                  TypeError: !1,
                  URIError: !1,
                }),
                (n.newEcmaIdentifiers = {
                  Set: !1,
                  Map: !1,
                  WeakMap: !1,
                  WeakSet: !1,
                  Proxy: !1,
                  Promise: !1,
                }),
                (n.browser = {
                  Audio: !1,
                  Blob: !1,
                  addEventListener: !1,
                  applicationCache: !1,
                  atob: !1,
                  blur: !1,
                  btoa: !1,
                  CanvasGradient: !1,
                  CanvasPattern: !1,
                  CanvasRenderingContext2D: !1,
                  clearInterval: !1,
                  clearTimeout: !1,
                  close: !1,
                  closed: !1,
                  CustomEvent: !1,
                  DOMParser: !1,
                  defaultStatus: !1,
                  document: !1,
                  Element: !1,
                  ElementTimeControl: !1,
                  event: !1,
                  FileReader: !1,
                  FormData: !1,
                  focus: !1,
                  frames: !1,
                  getComputedStyle: !1,
                  HTMLElement: !1,
                  HTMLAnchorElement: !1,
                  HTMLBaseElement: !1,
                  HTMLBlockquoteElement: !1,
                  HTMLBodyElement: !1,
                  HTMLBRElement: !1,
                  HTMLButtonElement: !1,
                  HTMLCanvasElement: !1,
                  HTMLDirectoryElement: !1,
                  HTMLDivElement: !1,
                  HTMLDListElement: !1,
                  HTMLFieldSetElement: !1,
                  HTMLFontElement: !1,
                  HTMLFormElement: !1,
                  HTMLFrameElement: !1,
                  HTMLFrameSetElement: !1,
                  HTMLHeadElement: !1,
                  HTMLHeadingElement: !1,
                  HTMLHRElement: !1,
                  HTMLHtmlElement: !1,
                  HTMLIFrameElement: !1,
                  HTMLImageElement: !1,
                  HTMLInputElement: !1,
                  HTMLIsIndexElement: !1,
                  HTMLLabelElement: !1,
                  HTMLLayerElement: !1,
                  HTMLLegendElement: !1,
                  HTMLLIElement: !1,
                  HTMLLinkElement: !1,
                  HTMLMapElement: !1,
                  HTMLMenuElement: !1,
                  HTMLMetaElement: !1,
                  HTMLModElement: !1,
                  HTMLObjectElement: !1,
                  HTMLOListElement: !1,
                  HTMLOptGroupElement: !1,
                  HTMLOptionElement: !1,
                  HTMLParagraphElement: !1,
                  HTMLParamElement: !1,
                  HTMLPreElement: !1,
                  HTMLQuoteElement: !1,
                  HTMLScriptElement: !1,
                  HTMLSelectElement: !1,
                  HTMLStyleElement: !1,
                  HTMLTableCaptionElement: !1,
                  HTMLTableCellElement: !1,
                  HTMLTableColElement: !1,
                  HTMLTableElement: !1,
                  HTMLTableRowElement: !1,
                  HTMLTableSectionElement: !1,
                  HTMLTextAreaElement: !1,
                  HTMLTitleElement: !1,
                  HTMLUListElement: !1,
                  HTMLVideoElement: !1,
                  history: !1,
                  Image: !1,
                  length: !1,
                  localStorage: !1,
                  location: !1,
                  matchMedia: !1,
                  MessageChannel: !1,
                  MessageEvent: !1,
                  MessagePort: !1,
                  MouseEvent: !1,
                  moveBy: !1,
                  moveTo: !1,
                  MutationObserver: !1,
                  name: !1,
                  Node: !1,
                  NodeFilter: !1,
                  NodeList: !1,
                  navigator: !1,
                  onbeforeunload: !0,
                  onblur: !0,
                  onerror: !0,
                  onfocus: !0,
                  onload: !0,
                  onresize: !0,
                  onunload: !0,
                  open: !1,
                  openDatabase: !1,
                  opener: !1,
                  Option: !1,
                  parent: !1,
                  print: !1,
                  removeEventListener: !1,
                  resizeBy: !1,
                  resizeTo: !1,
                  screen: !1,
                  scroll: !1,
                  scrollBy: !1,
                  scrollTo: !1,
                  sessionStorage: !1,
                  setInterval: !1,
                  setTimeout: !1,
                  SharedWorker: !1,
                  status: !1,
                  SVGAElement: !1,
                  SVGAltGlyphDefElement: !1,
                  SVGAltGlyphElement: !1,
                  SVGAltGlyphItemElement: !1,
                  SVGAngle: !1,
                  SVGAnimateColorElement: !1,
                  SVGAnimateElement: !1,
                  SVGAnimateMotionElement: !1,
                  SVGAnimateTransformElement: !1,
                  SVGAnimatedAngle: !1,
                  SVGAnimatedBoolean: !1,
                  SVGAnimatedEnumeration: !1,
                  SVGAnimatedInteger: !1,
                  SVGAnimatedLength: !1,
                  SVGAnimatedLengthList: !1,
                  SVGAnimatedNumber: !1,
                  SVGAnimatedNumberList: !1,
                  SVGAnimatedPathData: !1,
                  SVGAnimatedPoints: !1,
                  SVGAnimatedPreserveAspectRatio: !1,
                  SVGAnimatedRect: !1,
                  SVGAnimatedString: !1,
                  SVGAnimatedTransformList: !1,
                  SVGAnimationElement: !1,
                  SVGCSSRule: !1,
                  SVGCircleElement: !1,
                  SVGClipPathElement: !1,
                  SVGColor: !1,
                  SVGColorProfileElement: !1,
                  SVGColorProfileRule: !1,
                  SVGComponentTransferFunctionElement: !1,
                  SVGCursorElement: !1,
                  SVGDefsElement: !1,
                  SVGDescElement: !1,
                  SVGDocument: !1,
                  SVGElement: !1,
                  SVGElementInstance: !1,
                  SVGElementInstanceList: !1,
                  SVGEllipseElement: !1,
                  SVGExternalResourcesRequired: !1,
                  SVGFEBlendElement: !1,
                  SVGFEColorMatrixElement: !1,
                  SVGFEComponentTransferElement: !1,
                  SVGFECompositeElement: !1,
                  SVGFEConvolveMatrixElement: !1,
                  SVGFEDiffuseLightingElement: !1,
                  SVGFEDisplacementMapElement: !1,
                  SVGFEDistantLightElement: !1,
                  SVGFEFloodElement: !1,
                  SVGFEFuncAElement: !1,
                  SVGFEFuncBElement: !1,
                  SVGFEFuncGElement: !1,
                  SVGFEFuncRElement: !1,
                  SVGFEGaussianBlurElement: !1,
                  SVGFEImageElement: !1,
                  SVGFEMergeElement: !1,
                  SVGFEMergeNodeElement: !1,
                  SVGFEMorphologyElement: !1,
                  SVGFEOffsetElement: !1,
                  SVGFEPointLightElement: !1,
                  SVGFESpecularLightingElement: !1,
                  SVGFESpotLightElement: !1,
                  SVGFETileElement: !1,
                  SVGFETurbulenceElement: !1,
                  SVGFilterElement: !1,
                  SVGFilterPrimitiveStandardAttributes: !1,
                  SVGFitToViewBox: !1,
                  SVGFontElement: !1,
                  SVGFontFaceElement: !1,
                  SVGFontFaceFormatElement: !1,
                  SVGFontFaceNameElement: !1,
                  SVGFontFaceSrcElement: !1,
                  SVGFontFaceUriElement: !1,
                  SVGForeignObjectElement: !1,
                  SVGGElement: !1,
                  SVGGlyphElement: !1,
                  SVGGlyphRefElement: !1,
                  SVGGradientElement: !1,
                  SVGHKernElement: !1,
                  SVGICCColor: !1,
                  SVGImageElement: !1,
                  SVGLangSpace: !1,
                  SVGLength: !1,
                  SVGLengthList: !1,
                  SVGLineElement: !1,
                  SVGLinearGradientElement: !1,
                  SVGLocatable: !1,
                  SVGMPathElement: !1,
                  SVGMarkerElement: !1,
                  SVGMaskElement: !1,
                  SVGMatrix: !1,
                  SVGMetadataElement: !1,
                  SVGMissingGlyphElement: !1,
                  SVGNumber: !1,
                  SVGNumberList: !1,
                  SVGPaint: !1,
                  SVGPathElement: !1,
                  SVGPathSeg: !1,
                  SVGPathSegArcAbs: !1,
                  SVGPathSegArcRel: !1,
                  SVGPathSegClosePath: !1,
                  SVGPathSegCurvetoCubicAbs: !1,
                  SVGPathSegCurvetoCubicRel: !1,
                  SVGPathSegCurvetoCubicSmoothAbs: !1,
                  SVGPathSegCurvetoCubicSmoothRel: !1,
                  SVGPathSegCurvetoQuadraticAbs: !1,
                  SVGPathSegCurvetoQuadraticRel: !1,
                  SVGPathSegCurvetoQuadraticSmoothAbs: !1,
                  SVGPathSegCurvetoQuadraticSmoothRel: !1,
                  SVGPathSegLinetoAbs: !1,
                  SVGPathSegLinetoHorizontalAbs: !1,
                  SVGPathSegLinetoHorizontalRel: !1,
                  SVGPathSegLinetoRel: !1,
                  SVGPathSegLinetoVerticalAbs: !1,
                  SVGPathSegLinetoVerticalRel: !1,
                  SVGPathSegList: !1,
                  SVGPathSegMovetoAbs: !1,
                  SVGPathSegMovetoRel: !1,
                  SVGPatternElement: !1,
                  SVGPoint: !1,
                  SVGPointList: !1,
                  SVGPolygonElement: !1,
                  SVGPolylineElement: !1,
                  SVGPreserveAspectRatio: !1,
                  SVGRadialGradientElement: !1,
                  SVGRect: !1,
                  SVGRectElement: !1,
                  SVGRenderingIntent: !1,
                  SVGSVGElement: !1,
                  SVGScriptElement: !1,
                  SVGSetElement: !1,
                  SVGStopElement: !1,
                  SVGStringList: !1,
                  SVGStylable: !1,
                  SVGStyleElement: !1,
                  SVGSwitchElement: !1,
                  SVGSymbolElement: !1,
                  SVGTRefElement: !1,
                  SVGTSpanElement: !1,
                  SVGTests: !1,
                  SVGTextContentElement: !1,
                  SVGTextElement: !1,
                  SVGTextPathElement: !1,
                  SVGTextPositioningElement: !1,
                  SVGTitleElement: !1,
                  SVGTransform: !1,
                  SVGTransformList: !1,
                  SVGTransformable: !1,
                  SVGURIReference: !1,
                  SVGUnitTypes: !1,
                  SVGUseElement: !1,
                  SVGVKernElement: !1,
                  SVGViewElement: !1,
                  SVGViewSpec: !1,
                  SVGZoomAndPan: !1,
                  TimeEvent: !1,
                  top: !1,
                  URL: !1,
                  WebSocket: !1,
                  window: !1,
                  Worker: !1,
                  XMLHttpRequest: !1,
                  XMLSerializer: !1,
                  XPathEvaluator: !1,
                  XPathException: !1,
                  XPathExpression: !1,
                  XPathNamespace: !1,
                  XPathNSResolver: !1,
                  XPathResult: !1,
                }),
                (n.devel = {
                  alert: !1,
                  confirm: !1,
                  console: !1,
                  Debug: !1,
                  opera: !1,
                  prompt: !1,
                }),
                (n.worker = { importScripts: !0, postMessage: !0, self: !0 }),
                (n.nonstandard = { escape: !1, unescape: !1 }),
                (n.couch = {
                  require: !1,
                  respond: !1,
                  getRow: !1,
                  emit: !1,
                  send: !1,
                  start: !1,
                  sum: !1,
                  log: !1,
                  exports: !1,
                  module: !1,
                  provides: !1,
                }),
                (n.node = {
                  __filename: !1,
                  __dirname: !1,
                  GLOBAL: !1,
                  global: !1,
                  module: !1,
                  require: !1,
                  Buffer: !0,
                  console: !0,
                  exports: !0,
                  process: !0,
                  setTimeout: !0,
                  clearTimeout: !0,
                  setInterval: !0,
                  clearInterval: !0,
                  setImmediate: !0,
                  clearImmediate: !0,
                }),
                (n.phantom = {
                  phantom: !0,
                  require: !0,
                  WebPage: !0,
                  console: !0,
                  exports: !0,
                }),
                (n.qunit = {
                  asyncTest: !1,
                  deepEqual: !1,
                  equal: !1,
                  expect: !1,
                  module: !1,
                  notDeepEqual: !1,
                  notEqual: !1,
                  notPropEqual: !1,
                  notStrictEqual: !1,
                  ok: !1,
                  propEqual: !1,
                  QUnit: !1,
                  raises: !1,
                  start: !1,
                  stop: !1,
                  strictEqual: !1,
                  test: !1,
                  throws: !1,
                }),
                (n.rhino = {
                  defineClass: !1,
                  deserialize: !1,
                  gc: !1,
                  help: !1,
                  importClass: !1,
                  importPackage: !1,
                  java: !1,
                  load: !1,
                  loadClass: !1,
                  Packages: !1,
                  print: !1,
                  quit: !1,
                  readFile: !1,
                  readUrl: !1,
                  runCommand: !1,
                  seal: !1,
                  serialize: !1,
                  spawn: !1,
                  sync: !1,
                  toint32: !1,
                  version: !1,
                }),
                (n.shelljs = {
                  target: !1,
                  echo: !1,
                  exit: !1,
                  cd: !1,
                  pwd: !1,
                  ls: !1,
                  find: !1,
                  cp: !1,
                  rm: !1,
                  mv: !1,
                  mkdir: !1,
                  test: !1,
                  cat: !1,
                  sed: !1,
                  grep: !1,
                  which: !1,
                  dirs: !1,
                  pushd: !1,
                  popd: !1,
                  env: !1,
                  exec: !1,
                  chmod: !1,
                  config: !1,
                  error: !1,
                  tempdir: !1,
                }),
                (n.typed = {
                  ArrayBuffer: !1,
                  ArrayBufferView: !1,
                  DataView: !1,
                  Float32Array: !1,
                  Float64Array: !1,
                  Int16Array: !1,
                  Int32Array: !1,
                  Int8Array: !1,
                  Uint16Array: !1,
                  Uint32Array: !1,
                  Uint8Array: !1,
                  Uint8ClampedArray: !1,
                }),
                (n.wsh = {
                  ActiveXObject: !0,
                  Enumerator: !0,
                  GetObject: !0,
                  ScriptEngine: !0,
                  ScriptEngineBuildVersion: !0,
                  ScriptEngineMajorVersion: !0,
                  ScriptEngineMinorVersion: !0,
                  VBArray: !0,
                  WSH: !0,
                  WScript: !0,
                  XDomainRequest: !0,
                }),
                (n.dojo = {
                  dojo: !1,
                  dijit: !1,
                  dojox: !1,
                  define: !1,
                  require: !1,
                }),
                (n.jquery = { $: !1, jQuery: !1 }),
                (n.mootools = {
                  $: !1,
                  $$: !1,
                  Asset: !1,
                  Browser: !1,
                  Chain: !1,
                  Class: !1,
                  Color: !1,
                  Cookie: !1,
                  Core: !1,
                  Document: !1,
                  DomReady: !1,
                  DOMEvent: !1,
                  DOMReady: !1,
                  Drag: !1,
                  Element: !1,
                  Elements: !1,
                  Event: !1,
                  Events: !1,
                  Fx: !1,
                  Group: !1,
                  Hash: !1,
                  HtmlTable: !1,
                  IFrame: !1,
                  IframeShim: !1,
                  InputValidator: !1,
                  instanceOf: !1,
                  Keyboard: !1,
                  Locale: !1,
                  Mask: !1,
                  MooTools: !1,
                  Native: !1,
                  Options: !1,
                  OverText: !1,
                  Request: !1,
                  Scroller: !1,
                  Slick: !1,
                  Slider: !1,
                  Sortables: !1,
                  Spinner: !1,
                  Swiff: !1,
                  Tips: !1,
                  Type: !1,
                  typeOf: !1,
                  URI: !1,
                  Window: !1,
                }),
                (n.prototypejs = {
                  $: !1,
                  $$: !1,
                  $A: !1,
                  $F: !1,
                  $H: !1,
                  $R: !1,
                  $break: !1,
                  $continue: !1,
                  $w: !1,
                  Abstract: !1,
                  Ajax: !1,
                  Class: !1,
                  Enumerable: !1,
                  Element: !1,
                  Event: !1,
                  Field: !1,
                  Form: !1,
                  Hash: !1,
                  Insertion: !1,
                  ObjectRange: !1,
                  PeriodicalExecuter: !1,
                  Position: !1,
                  Prototype: !1,
                  Selector: !1,
                  Template: !1,
                  Toggle: !1,
                  Try: !1,
                  Autocompleter: !1,
                  Builder: !1,
                  Control: !1,
                  Draggable: !1,
                  Draggables: !1,
                  Droppables: !1,
                  Effect: !1,
                  Sortable: !1,
                  SortableObserver: !1,
                  Sound: !1,
                  Scriptaculous: !1,
                }),
                (n.yui = { YUI: !1, Y: !1, YUI_config: !1 }),
                (n.mocha = {
                  describe: !1,
                  it: !1,
                  before: !1,
                  after: !1,
                  beforeEach: !1,
                  afterEach: !1,
                  suite: !1,
                  test: !1,
                  setup: !1,
                  teardown: !1,
                }),
                (n.jasmine = {
                  jasmine: !1,
                  describe: !1,
                  it: !1,
                  xit: !1,
                  beforeEach: !1,
                  afterEach: !1,
                  setFixtures: !1,
                  loadFixtures: !1,
                  spyOn: !1,
                  expect: !1,
                  runs: !1,
                  waitsFor: !1,
                  waits: !1,
                });
            },
            {},
          ],
          10: [
            function (e, t, n) {
              function r() {
                (this._events = this._events || {}),
                  (this._maxListeners = this._maxListeners || undefined);
              }
              function i(e) {
                return typeof e == "function";
              }
              function s(e) {
                return typeof e == "number";
              }
              function o(e) {
                return typeof e == "object" && e !== null;
              }
              function u(e) {
                return e === void 0;
              }
              (t.exports = r),
                (r.EventEmitter = r),
                (r.prototype._events = undefined),
                (r.prototype._maxListeners = undefined),
                (r.defaultMaxListeners = 10),
                (r.prototype.setMaxListeners = function (e) {
                  if (!s(e) || e < 0 || isNaN(e))
                    throw TypeError("n must be a positive number");
                  return (this._maxListeners = e), this;
                }),
                (r.prototype.emit = function (e) {
                  var t, n, r, s, a, f;
                  this._events || (this._events = {});
                  if (e === "error")
                    if (
                      !this._events.error ||
                      (o(this._events.error) && !this._events.error.length)
                    )
                      throw (
                        ((t = arguments[1]),
                        t instanceof Error
                          ? t
                          : TypeError('Uncaught, unspecified "error" event.'))
                      );
                  n = this._events[e];
                  if (u(n)) return !1;
                  if (i(n))
                    switch (arguments.length) {
                      case 1:
                        n.call(this);
                        break;
                      case 2:
                        n.call(this, arguments[1]);
                        break;
                      case 3:
                        n.call(this, arguments[1], arguments[2]);
                        break;
                      default:
                        (r = arguments.length), (s = new Array(r - 1));
                        for (a = 1; a < r; a++) s[a - 1] = arguments[a];
                        n.apply(this, s);
                    }
                  else if (o(n)) {
                    (r = arguments.length), (s = new Array(r - 1));
                    for (a = 1; a < r; a++) s[a - 1] = arguments[a];
                    (f = n.slice()), (r = f.length);
                    for (a = 0; a < r; a++) f[a].apply(this, s);
                  }
                  return !0;
                }),
                (r.prototype.addListener = function (e, t) {
                  var n;
                  if (!i(t)) throw TypeError("listener must be a function");
                  this._events || (this._events = {}),
                    this._events.newListener &&
                      this.emit(
                        "newListener",
                        e,
                        i(t.listener) ? t.listener : t
                      ),
                    this._events[e]
                      ? o(this._events[e])
                        ? this._events[e].push(t)
                        : (this._events[e] = [this._events[e], t])
                      : (this._events[e] = t);
                  if (o(this._events[e]) && !this._events[e].warned) {
                    var n;
                    u(this._maxListeners)
                      ? (n = r.defaultMaxListeners)
                      : (n = this._maxListeners),
                      n &&
                        n > 0 &&
                        this._events[e].length > n &&
                        ((this._events[e].warned = !0),
                        console.error(
                          "(node) warning: possible EventEmitter memory leak detected. %d listeners added. Use emitter.setMaxListeners() to increase limit.",
                          this._events[e].length
                        ),
                        console.trace());
                  }
                  return this;
                }),
                (r.prototype.on = r.prototype.addListener),
                (r.prototype.once = function (e, t) {
                  function r() {
                    this.removeListener(e, r),
                      n || ((n = !0), t.apply(this, arguments));
                  }
                  if (!i(t)) throw TypeError("listener must be a function");
                  var n = !1;
                  return (r.listener = t), this.on(e, r), this;
                }),
                (r.prototype.removeListener = function (e, t) {
                  var n, r, s, u;
                  if (!i(t)) throw TypeError("listener must be a function");
                  if (!this._events || !this._events[e]) return this;
                  (n = this._events[e]), (s = n.length), (r = -1);
                  if (n === t || (i(n.listener) && n.listener === t))
                    delete this._events[e],
                      this._events.removeListener &&
                        this.emit("removeListener", e, t);
                  else if (o(n)) {
                    for (u = s; u-- > 0; )
                      if (
                        n[u] === t ||
                        (n[u].listener && n[u].listener === t)
                      ) {
                        r = u;
                        break;
                      }
                    if (r < 0) return this;
                    n.length === 1
                      ? ((n.length = 0), delete this._events[e])
                      : n.splice(r, 1),
                      this._events.removeListener &&
                        this.emit("removeListener", e, t);
                  }
                  return this;
                }),
                (r.prototype.removeAllListeners = function (e) {
                  var t, n;
                  if (!this._events) return this;
                  if (!this._events.removeListener)
                    return (
                      arguments.length === 0
                        ? (this._events = {})
                        : this._events[e] && delete this._events[e],
                      this
                    );
                  if (arguments.length === 0) {
                    for (t in this._events) {
                      if (t === "removeListener") continue;
                      this.removeAllListeners(t);
                    }
                    return (
                      this.removeAllListeners("removeListener"),
                      (this._events = {}),
                      this
                    );
                  }
                  n = this._events[e];
                  if (i(n)) this.removeListener(e, n);
                  else while (n.length) this.removeListener(e, n[n.length - 1]);
                  return delete this._events[e], this;
                }),
                (r.prototype.listeners = function (e) {
                  var t;
                  return (
                    !this._events || !this._events[e]
                      ? (t = [])
                      : i(this._events[e])
                      ? (t = [this._events[e]])
                      : (t = this._events[e].slice()),
                    t
                  );
                }),
                (r.listenerCount = function (e, t) {
                  var n;
                  return (
                    !e._events || !e._events[t]
                      ? (n = 0)
                      : i(e._events[t])
                      ? (n = 1)
                      : (n = e._events[t].length),
                    n
                  );
                });
            },
            {},
          ],
        },
        {},
        [3]
      )(3);
    }
  ),
  ace.define(
    "ace/mode/javascript_worker",
    [
      "require",
      "exports",
      "module",
      "ace/lib/oop",
      "ace/worker/mirror",
      "ace/mode/javascript/jshint",
    ],
    function (require, exports, module) {
      "use strict";
      function startRegex(e) {
        return RegExp("^(" + e.join("|") + ")");
      }
      var oop = require("../lib/oop"),
        Mirror = require("../worker/mirror").Mirror,
        lint = require("./javascript/jshint").JSHINT,
        disabledWarningsRe = startRegex([
          "Bad for in variable '(.+)'.",
          'Missing "use strict"',
        ]),
        errorsRe = startRegex([
          "Unexpected",
          "Expected ",
          "Confusing (plus|minus)",
          "\\{a\\} unterminated regular expression",
          "Unclosed ",
          "Unmatched ",
          "Unbegun comment",
          "Bad invocation",
          "Missing space after",
          "Missing operator at",
        ]),
        infoRe = startRegex([
          "Expected an assignment",
          "Bad escapement of EOL",
          "Unexpected comma",
          "Unexpected space",
          "Missing radix parameter.",
          "A leading decimal point can",
          "\\['{a}'\\] is better written in dot notation.",
          "'{a}' used out of scope",
        ]),
        JavaScriptWorker = (exports.JavaScriptWorker = function (e) {
          Mirror.call(this, e), this.setTimeout(500), this.setOptions();
        });
      oop.inherits(JavaScriptWorker, Mirror),
        function () {
          (this.setOptions = function (e) {
            (this.options = e || {
              esnext: !0,
              moz: !0,
              devel: !0,
              browser: !0,
              node: !0,
              laxcomma: !0,
              laxbreak: !0,
              lastsemic: !0,
              onevar: !1,
              passfail: !1,
              maxerr: 100,
              expr: !0,
              multistr: !0,
              globalstrict: !0,
            }),
              this.doc.getValue() && this.deferredUpdate.schedule(100);
          }),
            (this.changeOptions = function (e) {
              oop.mixin(this.options, e),
                this.doc.getValue() && this.deferredUpdate.schedule(100);
            }),
            (this.isValidJS = function (str) {
              try {
                eval("throw 0;" + str);
              } catch (e) {
                if (e === 0) return !0;
              }
              return !1;
            }),
            (this.onUpdate = function () {
              var e = this.doc.getValue();
              e = e.replace(/^#!.*\n/, "\n");
              if (!e) {
                this.sender.emit("jslint", []);
                return;
              }
              var t = [],
                n = this.isValidJS(e) ? "warning" : "error";
              lint(e, this.options);
              var r = lint.errors,
                i = !1;
              for (var s = 0; s < r.length; s++) {
                var o = r[s];
                if (!o) continue;
                var u = o.raw,
                  a = "warning";
                if (u == "Missing semicolon.") {
                  var f = o.evidence.substr(o.character);
                  (f = f.charAt(f.search(/\S/))),
                    n == "error" && f && /[\w\d{(['"]/.test(f)
                      ? ((o.reason = 'Missing ";" before statement'),
                        (a = "error"))
                      : (a = "info");
                } else {
                  if (disabledWarningsRe.test(u)) continue;
                  infoRe.test(u)
                    ? (a = "info")
                    : errorsRe.test(u)
                    ? ((i = !0), (a = n))
                    : u == "'{a}' is not defined."
                    ? (a = "warning")
                    : u == "'{a}' is defined but never used." && (a = "info");
                }
                t.push({
                  row: o.line - 1,
                  column: o.character - 1,
                  text: o.reason,
                  type: a,
                  raw: u,
                }),
                  i;
              }
              this.sender.emit("jslint", t);
            });
        }.call(JavaScriptWorker.prototype);
    }
  ),
  ace.define(
    "ace/lib/es5-shim",
    ["require", "exports", "module"],
    function (e, t, n) {
      function r() {}
      function w(e) {
        try {
          return Object.defineProperty(e, "sentinel", {}), "sentinel" in e;
        } catch (t) {}
      }
      function H(e) {
        return (
          (e = +e),
          e !== e
            ? (e = 0)
            : e !== 0 &&
              e !== 1 / 0 &&
              e !== -1 / 0 &&
              (e = (e > 0 || -1) * Math.floor(Math.abs(e))),
          e
        );
      }
      function B(e) {
        var t = typeof e;
        return (
          e === null ||
          t === "undefined" ||
          t === "boolean" ||
          t === "number" ||
          t === "string"
        );
      }
      function j(e) {
        var t, n, r;
        if (B(e)) return e;
        n = e.valueOf;
        if (typeof n == "function") {
          t = n.call(e);
          if (B(t)) return t;
        }
        r = e.toString;
        if (typeof r == "function") {
          t = r.call(e);
          if (B(t)) return t;
        }
        throw new TypeError();
      }
      Function.prototype.bind ||
        (Function.prototype.bind = function (t) {
          var n = this;
          if (typeof n != "function")
            throw new TypeError(
              "Function.prototype.bind called on incompatible " + n
            );
          var i = u.call(arguments, 1),
            s = function () {
              if (this instanceof s) {
                var e = n.apply(this, i.concat(u.call(arguments)));
                return Object(e) === e ? e : this;
              }
              return n.apply(t, i.concat(u.call(arguments)));
            };
          return (
            n.prototype &&
              ((r.prototype = n.prototype),
              (s.prototype = new r()),
              (r.prototype = null)),
            s
          );
        });
      var i = Function.prototype.call,
        s = Array.prototype,
        o = Object.prototype,
        u = s.slice,
        a = i.bind(o.toString),
        f = i.bind(o.hasOwnProperty),
        l,
        c,
        h,
        p,
        d;
      if ((d = f(o, "__defineGetter__")))
        (l = i.bind(o.__defineGetter__)),
          (c = i.bind(o.__defineSetter__)),
          (h = i.bind(o.__lookupGetter__)),
          (p = i.bind(o.__lookupSetter__));
      if ([1, 2].splice(0).length != 2)
        if (
          !(function () {
            function e(e) {
              var t = new Array(e + 2);
              return (t[0] = t[1] = 0), t;
            }
            var t = [],
              n;
            t.splice.apply(t, e(20)),
              t.splice.apply(t, e(26)),
              (n = t.length),
              t.splice(5, 0, "XXX"),
              n + 1 == t.length;
            if (n + 1 == t.length) return !0;
          })()
        )
          Array.prototype.splice = function (e, t) {
            var n = this.length;
            e > 0
              ? e > n && (e = n)
              : e == void 0
              ? (e = 0)
              : e < 0 && (e = Math.max(n + e, 0)),
              e + t < n || (t = n - e);
            var r = this.slice(e, e + t),
              i = u.call(arguments, 2),
              s = i.length;
            if (e === n) s && this.push.apply(this, i);
            else {
              var o = Math.min(t, n - e),
                a = e + o,
                f = a + s - o,
                l = n - a,
                c = n - o;
              if (f < a) for (var h = 0; h < l; ++h) this[f + h] = this[a + h];
              else if (f > a) for (h = l; h--; ) this[f + h] = this[a + h];
              if (s && e === c) (this.length = c), this.push.apply(this, i);
              else {
                this.length = c + s;
                for (h = 0; h < s; ++h) this[e + h] = i[h];
              }
            }
            return r;
          };
        else {
          var v = Array.prototype.splice;
          Array.prototype.splice = function (e, t) {
            return arguments.length
              ? v.apply(
                  this,
                  [
                    e === void 0 ? 0 : e,
                    t === void 0 ? this.length - e : t,
                  ].concat(u.call(arguments, 2))
                )
              : [];
          };
        }
      Array.isArray ||
        (Array.isArray = function (t) {
          return a(t) == "[object Array]";
        });
      var m = Object("a"),
        g = m[0] != "a" || !(0 in m);
      Array.prototype.forEach ||
        (Array.prototype.forEach = function (t) {
          var n = F(this),
            r = g && a(this) == "[object String]" ? this.split("") : n,
            i = arguments[1],
            s = -1,
            o = r.length >>> 0;
          if (a(t) != "[object Function]") throw new TypeError();
          while (++s < o) s in r && t.call(i, r[s], s, n);
        }),
        Array.prototype.map ||
          (Array.prototype.map = function (t) {
            var n = F(this),
              r = g && a(this) == "[object String]" ? this.split("") : n,
              i = r.length >>> 0,
              s = Array(i),
              o = arguments[1];
            if (a(t) != "[object Function]")
              throw new TypeError(t + " is not a function");
            for (var u = 0; u < i; u++)
              u in r && (s[u] = t.call(o, r[u], u, n));
            return s;
          }),
        Array.prototype.filter ||
          (Array.prototype.filter = function (t) {
            var n = F(this),
              r = g && a(this) == "[object String]" ? this.split("") : n,
              i = r.length >>> 0,
              s = [],
              o,
              u = arguments[1];
            if (a(t) != "[object Function]")
              throw new TypeError(t + " is not a function");
            for (var f = 0; f < i; f++)
              f in r && ((o = r[f]), t.call(u, o, f, n) && s.push(o));
            return s;
          }),
        Array.prototype.every ||
          (Array.prototype.every = function (t) {
            var n = F(this),
              r = g && a(this) == "[object String]" ? this.split("") : n,
              i = r.length >>> 0,
              s = arguments[1];
            if (a(t) != "[object Function]")
              throw new TypeError(t + " is not a function");
            for (var o = 0; o < i; o++)
              if (o in r && !t.call(s, r[o], o, n)) return !1;
            return !0;
          }),
        Array.prototype.some ||
          (Array.prototype.some = function (t) {
            var n = F(this),
              r = g && a(this) == "[object String]" ? this.split("") : n,
              i = r.length >>> 0,
              s = arguments[1];
            if (a(t) != "[object Function]")
              throw new TypeError(t + " is not a function");
            for (var o = 0; o < i; o++)
              if (o in r && t.call(s, r[o], o, n)) return !0;
            return !1;
          }),
        Array.prototype.reduce ||
          (Array.prototype.reduce = function (t) {
            var n = F(this),
              r = g && a(this) == "[object String]" ? this.split("") : n,
              i = r.length >>> 0;
            if (a(t) != "[object Function]")
              throw new TypeError(t + " is not a function");
            if (!i && arguments.length == 1)
              throw new TypeError(
                "reduce of empty array with no initial value"
              );
            var s = 0,
              o;
            if (arguments.length >= 2) o = arguments[1];
            else
              do {
                if (s in r) {
                  o = r[s++];
                  break;
                }
                if (++s >= i)
                  throw new TypeError(
                    "reduce of empty array with no initial value"
                  );
              } while (!0);
            for (; s < i; s++) s in r && (o = t.call(void 0, o, r[s], s, n));
            return o;
          }),
        Array.prototype.reduceRight ||
          (Array.prototype.reduceRight = function (t) {
            var n = F(this),
              r = g && a(this) == "[object String]" ? this.split("") : n,
              i = r.length >>> 0;
            if (a(t) != "[object Function]")
              throw new TypeError(t + " is not a function");
            if (!i && arguments.length == 1)
              throw new TypeError(
                "reduceRight of empty array with no initial value"
              );
            var s,
              o = i - 1;
            if (arguments.length >= 2) s = arguments[1];
            else
              do {
                if (o in r) {
                  s = r[o--];
                  break;
                }
                if (--o < 0)
                  throw new TypeError(
                    "reduceRight of empty array with no initial value"
                  );
              } while (!0);
            do o in this && (s = t.call(void 0, s, r[o], o, n));
            while (o--);
            return s;
          });
      if (!Array.prototype.indexOf || [0, 1].indexOf(1, 2) != -1)
        Array.prototype.indexOf = function (t) {
          var n = g && a(this) == "[object String]" ? this.split("") : F(this),
            r = n.length >>> 0;
          if (!r) return -1;
          var i = 0;
          arguments.length > 1 && (i = H(arguments[1])),
            (i = i >= 0 ? i : Math.max(0, r + i));
          for (; i < r; i++) if (i in n && n[i] === t) return i;
          return -1;
        };
      if (!Array.prototype.lastIndexOf || [0, 1].lastIndexOf(0, -3) != -1)
        Array.prototype.lastIndexOf = function (t) {
          var n = g && a(this) == "[object String]" ? this.split("") : F(this),
            r = n.length >>> 0;
          if (!r) return -1;
          var i = r - 1;
          arguments.length > 1 && (i = Math.min(i, H(arguments[1]))),
            (i = i >= 0 ? i : r - Math.abs(i));
          for (; i >= 0; i--) if (i in n && t === n[i]) return i;
          return -1;
        };
      Object.getPrototypeOf ||
        (Object.getPrototypeOf = function (t) {
          return t.__proto__ || (t.constructor ? t.constructor.prototype : o);
        });
      if (!Object.getOwnPropertyDescriptor) {
        var y = "Object.getOwnPropertyDescriptor called on a non-object: ";
        Object.getOwnPropertyDescriptor = function (t, n) {
          if ((typeof t != "object" && typeof t != "function") || t === null)
            throw new TypeError(y + t);
          if (!f(t, n)) return;
          var r, i, s;
          r = { enumerable: !0, configurable: !0 };
          if (d) {
            var u = t.__proto__;
            t.__proto__ = o;
            var i = h(t, n),
              s = p(t, n);
            t.__proto__ = u;
            if (i || s) return i && (r.get = i), s && (r.set = s), r;
          }
          return (r.value = t[n]), r;
        };
      }
      Object.getOwnPropertyNames ||
        (Object.getOwnPropertyNames = function (t) {
          return Object.keys(t);
        });
      if (!Object.create) {
        var b;
        Object.prototype.__proto__ === null
          ? (b = function () {
              return { __proto__: null };
            })
          : (b = function () {
              var e = {};
              for (var t in e) e[t] = null;
              return (
                (e.constructor =
                  e.hasOwnProperty =
                  e.propertyIsEnumerable =
                  e.isPrototypeOf =
                  e.toLocaleString =
                  e.toString =
                  e.valueOf =
                  e.__proto__ =
                    null),
                e
              );
            }),
          (Object.create = function (t, n) {
            var r;
            if (t === null) r = b();
            else {
              if (typeof t != "object")
                throw new TypeError(
                  "typeof prototype[" + typeof t + "] != 'object'"
                );
              var i = function () {};
              (i.prototype = t), (r = new i()), (r.__proto__ = t);
            }
            return n !== void 0 && Object.defineProperties(r, n), r;
          });
      }
      if (Object.defineProperty) {
        var E = w({}),
          S =
            typeof document == "undefined" || w(document.createElement("div"));
        if (!E || !S) var x = Object.defineProperty;
      }
      if (!Object.defineProperty || x) {
        var T = "Property description must be an object: ",
          N = "Object.defineProperty called on non-object: ",
          C = "getters & setters can not be defined on this javascript engine";
        Object.defineProperty = function (t, n, r) {
          if ((typeof t != "object" && typeof t != "function") || t === null)
            throw new TypeError(N + t);
          if ((typeof r != "object" && typeof r != "function") || r === null)
            throw new TypeError(T + r);
          if (x)
            try {
              return x.call(Object, t, n, r);
            } catch (i) {}
          if (f(r, "value"))
            if (d && (h(t, n) || p(t, n))) {
              var s = t.__proto__;
              (t.__proto__ = o),
                delete t[n],
                (t[n] = r.value),
                (t.__proto__ = s);
            } else t[n] = r.value;
          else {
            if (!d) throw new TypeError(C);
            f(r, "get") && l(t, n, r.get), f(r, "set") && c(t, n, r.set);
          }
          return t;
        };
      }
      Object.defineProperties ||
        (Object.defineProperties = function (t, n) {
          for (var r in n) f(n, r) && Object.defineProperty(t, r, n[r]);
          return t;
        }),
        Object.seal ||
          (Object.seal = function (t) {
            return t;
          }),
        Object.freeze ||
          (Object.freeze = function (t) {
            return t;
          });
      try {
        Object.freeze(function () {});
      } catch (k) {
        Object.freeze = (function (t) {
          return function (n) {
            return typeof n == "function" ? n : t(n);
          };
        })(Object.freeze);
      }
      Object.preventExtensions ||
        (Object.preventExtensions = function (t) {
          return t;
        }),
        Object.isSealed ||
          (Object.isSealed = function (t) {
            return !1;
          }),
        Object.isFrozen ||
          (Object.isFrozen = function (t) {
            return !1;
          }),
        Object.isExtensible ||
          (Object.isExtensible = function (t) {
            if (Object(t) === t) throw new TypeError();
            var n = "";
            while (f(t, n)) n += "?";
            t[n] = !0;
            var r = f(t, n);
            return delete t[n], r;
          });
      if (!Object.keys) {
        var L = !0,
          A = [
            "toString",
            "toLocaleString",
            "valueOf",
            "hasOwnProperty",
            "isPrototypeOf",
            "propertyIsEnumerable",
            "constructor",
          ],
          O = A.length;
        for (var M in { toString: null }) L = !1;
        Object.keys = function I(e) {
          if ((typeof e != "object" && typeof e != "function") || e === null)
            throw new TypeError("Object.keys called on a non-object");
          var I = [];
          for (var t in e) f(e, t) && I.push(t);
          if (L)
            for (var n = 0, r = O; n < r; n++) {
              var i = A[n];
              f(e, i) && I.push(i);
            }
          return I;
        };
      }
      Date.now ||
        (Date.now = function () {
          return new Date().getTime();
        });
      var _ =
        "	\n\f\r \u00a0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029\ufeff";
      if (!String.prototype.trim || _.trim()) {
        _ = "[" + _ + "]";
        var D = new RegExp("^" + _ + _ + "*"),
          P = new RegExp(_ + _ + "*$");
        String.prototype.trim = function () {
          return String(this).replace(D, "").replace(P, "");
        };
      }
      var F = function (e) {
        if (e == null) throw new TypeError("can't convert " + e + " to object");
        return Object(e);
      };
    }
  );
