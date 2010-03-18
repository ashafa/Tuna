(function() {
   var AC = {
     version: "0.1",
     setCaretPosition: function(el, pos) {
       el.focus();
       el = el[0];
       if( el && el.setSelectionRange ) {
         el.setSelectionRange(pos, pos);
       } else if (el && el.createTextRange) {
         var range = el.createTextRange();
         range.collapse(true);
         range.moveEnd('character', pos);
           range.moveStart('character', pos);
         range.select();
       }
     },
     getCaretPosition: function(el) {
       var caretPos = 0;
       if (document.selection) {
         el.focus ();
         var sel = document.selection.createRange();
         sel.moveStart ('character', -el.value.length);
         caretPos = sel.text.length;
       }  else if (el.selectionStart || el.selectionStart == '0') {
         caretPos = el.selectionStart;
       }
       return caretPos;
     },
     selectRange: function(el, startCharNo, endCharNo) {
       if( el.setSelectionRange ) {
         el.setSelectionRange(startCharNo, endCharNo);
       } else {
         var r = el.createTextRange();
         r.collapse(true);
         r.moveEnd('character', endCharNo);
         r.moveStart('character', startCharNo);
         r.select();
       }
     },
     autoCompleter: {
       candidates: [],
       dirtyCandidates : [],
       unique: function (a) {
         var r = new Array();
         o:for(var i = 0, n = a.length; i < n; i++) {
           for(var x = 0, y = r.length; x < y; x++) {
             if(r[x]==a[i]) continue o;
           }
           r[r.length] = a[i];
         }
         return r;
       },

       rinseCandidates: function(){
         AC.autoCompleter.candidates = AC.autoCompleter.unique(AC.autoCompleter.dirtyCandidates);
         AC.autoCompleter.dirtyCandidates = AC.autoCompleter.candidates;
       },

       getCompletions: function(searchStr) {
         return $.map(AC.autoCompleter.candidates, function(candidate){
           var ctest = new RegExp("^" + searchStr, "i");
           return (ctest.test(candidate)) ? candidate.replace(ctest, "") : null;
         });
       }
     }
   };

   $("#status").bind("keyup", function(event) {
     var el = $(this),
     caretPos = AC.getCaretPosition(this),
     value = el.val(),
     startPos = this.selectionStart,
     endPos = this.selectionEnd,
     charAtPos = value.substr(caretPos-1, 1),
     charBeforePos = value.substr(caretPos-2, 1),
     charAfterPos = value.substr(caretPos, 1),
     isAcWorthy = (caretPos == 1) ? /\s|^$/.test(charAfterPos) : /\s|^$/.test(charBeforePos) && /\s|^$/.test(charAfterPos);
     if ( (charAtPos  == "@" && isAcWorthy) || el.data("ac") ) {
       if ( event.keyCode == 8 ) {
         if ( charAtPos == "@" ) el.data("ac", null);
       } else {
         var acPos = el.data("ac");
         if ( !acPos ) {
           acPos = caretPos;
           el.data("ac", caretPos);
         }
         var searchEnd = value.indexOf(" ", acPos);
         var searchFor = value.substring(acPos, (searchEnd > 0) ? searchEnd : value.length);
         if (searchFor != "") {
           var acUsers = AC.autoCompleter.getCompletions(searchFor);
           if ( acUsers.length > 0 && acUsers[0] != "") {
             el.data("scroll-top", el.scrollTop());
             var acUser = (/^[A-Z]/.test(searchFor)) ? acUsers[0] : acUsers[0].toLowerCase();
             el.val(value.substring(0, startPos) + acUser + " " + value.substring(endPos, value.length));
             AC.selectRange(this, caretPos, caretPos + acUser.length + 1);
             el.scrollTop(el.height());
           }
         }
       }
     }
   }).bind("keydown", function(event){
    var el = $(this);
    if ( event.keyCode == 9 && el.data("ac") ) {
      return false;
    }
    if ( (event.keyCode == 32 || event.keyCode == 13) && el.data("ac") ) {
      var endAc = el.val().indexOf(" ", el.data("ac")) + 1;
      el.data("ac", null);
      if ( endAc == 0 ) {
        return true;
      }
      AC.selectRange(this, endAc, endAc);
      return false;
    }
    return true;
  });;

  var getACScreenNames = function(insertMethod) {
    $("a.screen-name:not(.ac),a.username:not(.ac)").each(function(){
      $(this).addClass("ac");
      AC.autoCompleter.dirtyCandidates[insertMethod]($(this).text().replace(/^@/,''));
    });
    AC.autoCompleter.rinseCandidates();
  };

  getACScreenNames("push");
  setInterval(function(){getACScreenNames("unshift");}, 1000);

  $("#tuna").remove();
  var notification = $("<div id='tuna' style='color:#777;position:absolute;left:415px;top:0;background:#ebebeb url(http://ashafa.com/tuna/green.png) no-repeat 5px 6px;padding:0px 8px 0 18px;font-size:11px;border-radius:3px;-moz-border-radius:3px;-webkit-border-radius:3px;'>tuna v" + AC.version + "</div>");
  $("div.bar:eq(0)").append(notification);

})();