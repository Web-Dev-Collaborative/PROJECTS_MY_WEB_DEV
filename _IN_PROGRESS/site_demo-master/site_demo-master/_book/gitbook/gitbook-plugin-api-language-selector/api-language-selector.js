require(["gitbook", "jquery"], function (t, p) {
  var g = [],
    r = {
      toolbarBtnId: void 0,
      presentLanguages: [],
      currentLanguage: void 0,
      defaultLanguage: void 0,
    };
  function u() {
    p(document).one("click", ".language-picker .btn", function (a) {
      !(function (a, n, e) {
        for (
          var t = n.currentLanguage,
            g = n.presentLanguages,
            r = p("<table>"),
            u = 0,
            o = Math.ceil(g.length / e),
            l = 0;
          l < o;
          l++
        ) {
          for (var i = p("<tr>"), c = 0; l * e + c < g.length && c < e; c++) {
            var d = p("<td>"),
              s = p("<a>"),
              f = g[u];
            d.addClass("language-picker-cell"),
              s.attr("data-lang", f.lang),
              s.attr("data-name", f.name),
              s.addClass("language-picker-btn"),
              f.lang === t.lang && s.addClass("active"),
              s.html(f.name),
              d.append(s),
              i.append(d),
              u++;
          }
          r.append(i);
        }
        r.addClass("language-picker-grid"), a.empty(), a.append(r);
      })(p(".language-picker .dropdown-menu"), r, 3),
        i(r);
    });
  }
  function o() {
    var e;
    !(function () {
      if (void 0 !== r.defaultLanguage) return;
      if (0 === g.length) return;
      var a = g.find(function (a) {
        return a.default;
      });
      r.defaultLanguage = a;
    })(),
      l(
        t.storage.get("language-selector", { currentLanguage: void 0 })
          .currentLanguage
      ),
      (e = []),
      p(".code-method-sample").each(function () {
        var n = p(this).data("lang"),
          a = p(this).data("name");
        e.find(function (a) {
          return n == a.lang;
        }) || e.push({ name: a, lang: n });
      }),
      (r.presentLanguages = e.sort(function (a, n) {
        return a.name.localeCompare(n.name);
      })),
      (function () {
        var n = r.currentLanguage;
        if (
          !n ||
          !r.presentLanguages.find(function (a) {
            return a.lang === n.lang;
          })
        ) {
          var e = r.defaultLanguage;
          if (
            e &&
            r.presentLanguages.find(function (a) {
              return a.lang === e.lang;
            })
          )
            l(e);
          else {
            var a = r.presentLanguages[0] || void 0;
            a && l(a);
          }
        }
      })(),
      0 < r.presentLanguages.length && void 0 === r.toolbarBtnId
        ? (r.toolbarBtnId = t.toolbar.createButton({
            icon: "fa fa-code",
            label: "Change language",
            className: "language-picker",
            dropdown: [],
          }))
        : 0 === r.presentLanguages.length &&
          (t.toolbar.removeButton(r.toolbarBtnId), (r.toolbarBtnId = void 0));
  }
  function l(a) {
    r.currentLanguage = a;
  }
  function i(a) {
    var n, e, t;
    (n = a.currentLanguage),
      a.defaultLanguage,
      p(".code-method-sample").each(function () {
        var a = !(p(this).data("lang") === n.lang);
        p(this).toggleClass("hidden", a);
      }),
      (e = a.currentLanguage),
      p(".language-picker-btn").each(function () {
        var a = p(this).data("lang") === e.lang;
        p(this).toggleClass("active", a);
      }),
      (t = a.currentLanguage) &&
        (p("span.active-name").remove(),
        p(".dropdown.language-picker")
          .children("a")
          .append(p('<span class="active-name">').text(t.name)));
  }
  t.events.bind("start", function (a, n) {
    var e = n["api-language-selector"];
    (g = e.languages),
      o(),
      p(document).on("click", ".language-picker-btn", function () {
        var n = p(this).data("lang"),
          a = r.presentLanguages.find(function (a) {
            return a.lang === n;
          });
        l(a), t.storage.set("language-selector", { currentLanguage: a }), i(r);
      }),
      u(),
      i(r);
  }),
    t.events.on("page.change", function () {
      o(), u(), i(r);
    });
});
