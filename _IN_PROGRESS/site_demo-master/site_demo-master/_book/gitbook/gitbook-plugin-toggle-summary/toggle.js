require(["gitbook", "jQuery"], function (gitbook, $) {
  gitbook.events.bind("page.change", function () {
    addExpandButton();
    $("li.chapter").children("ul.articles").hide();
    var $activeChapter = $("li.chapter.active");
    var $children = $activeChapter.children("ul.articles");
    expand($activeChapter);
    if ($children.length > 0) {
      collapseExapnd($activeChapter.find(">i"), true);
    }
    attachEvents();
  });
  function expand($chapter) {
    collapseExapnd($chapter.find(">i"), true);
    if (
      $chapter.parent().attr("class") != "summary" &&
      $chapter.parent().attr("class") != "book-summary" &&
      $chapter.length != 0
    ) {
      expand($chapter.parent());
    }
  }
  function addExpandButton() {
    var $chapters = $("li.chapter");
    $chapters.each(function () {
      var $chapter = $(this);
      var $children = $chapter.find("ul.articles");
      if ($children.length > 0) {
        $chapter.prepend("<i class='expand-button'></i>");
      }
    });
  }
  function attachEvents() {
    $("body").on("click", ".expand-button", function (e) {
      collapseExapnd($(this), true);
    });
    $("body").on("click", ".collapse-button", function (e) {
      collapseExapnd($(this), false);
    });
  }
  function collapseExapnd($button, isExapnd) {
    var $li = $button.parent();
    var $ul = $li.find(">ul.articles");
    if (isExapnd) {
      $ul.find(".hide").removeClass("hide");
      $ul.slideDown();
      $button.removeClass("expand-button");
      $button.addClass("collapse-button");
    } else {
      $ul.slideUp();
      $button.removeClass("collapse-button");
      $button.addClass("expand-button");
    }
  }
});
