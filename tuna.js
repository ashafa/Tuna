/*
 * Copyright (c) 2010 Tunde Ashafa
 * All rights reserved.

 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 * notice, this list of conditions and the following disclaimer in the
 * documentation and/or other materials provided with the distribution.
 * 3. The name of the author may not be used to endorse or promote products
 * derived from this software without specific prior written permission.

 * THIS SOFTWARE IS PROVIDED BY THE AUTHOR ``AS IS'' AND ANY EXPRESS OR
 * IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
 * OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 * IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT, INDIRECT,
 * INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 * NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRTunaT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */


(function() {;

   var Tuna = {
     version: "0.1a",
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
       if ( document.selection ) {
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
           r.push(a[i]);
         }
         return r;
       },
       rinseCandidates: function() {
         Tuna.autoCompleter.candidates = Tuna.autoCompleter.unique(Tuna.autoCompleter.dirtyCandidates.concat(Tuna.autoCompleter.candidates));
         Tuna.autoCompleter.dirtyCandidates = Tuna.autoCompleter.candidates;
       },
       getCompletions: function(searchStr) {
         return $.map(Tuna.autoCompleter.candidates, function(candidate) {
           var ctest = new RegExp("^" + searchStr, "i");
           return (ctest.test(candidate)) ? candidate.replace(ctest, "") : null;
         });
       }
     }
   };

   $("#status").bind("keyup", function(event) {
     var el = $(this),
     caretPos = Tuna.getCaretPosition(this),
     value = el.val(),
     startPos = this.selectionStart,
     endPos = this.selectionEnd,
     charAtPos = value.substr(caretPos-1, 1),
     charBeforePos = value.substr(caretPos-2, 1),
     charAfterPos = value.substr(caretPos, 1),
     isAcWorthy = ( caretPos == 1 ) ? /\s|^$/.test(charAfterPos) : /\s|^$/.test(charBeforePos) && /\s|^$/.test(charAfterPos);
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
           var acUsers = Tuna.autoCompleter.getCompletions(searchFor);
           if ( acUsers.length > 0 && acUsers[0] != "") {
             el.data("scroll-top", el.scrollTop());
             var acUser = (/^[A-Z]/.test(searchFor)) ? acUsers[0] : acUsers[0].toLowerCase();
             el.val(value.substring(0, startPos) + acUser + " " + value.substring(endPos, value.length));
             Tuna.selectRange(this, caretPos, caretPos + acUser.length + 1);
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
      Tuna.selectRange(this, endAc, endAc);
      return false;
    }
    return true;
  });

   var getTunaScreenNames = function(insertMethod) {
     var candidateElements = $("a.screen-name:not(.tuna-ac),a.username:not(.tuna-ac)");
     if ( candidateElements.length > 0 ) {
       candidateElements.each(function(){
         $(this).addClass("tuna-ac");
         Tuna.autoCompleter.dirtyCandidates[insertMethod]($(this).text().replace(/^@/,''));
       });
       Tuna.autoCompleter.rinseCandidates();
       localStorage.setItem("tuna-candidates", JSON.stringify(Tuna.autoCompleter.candidates));
     }
   };
   try {
     Tuna.autoCompleter.candidates = JSON.parse(localStorage["tuna-candidates"]);
   } catch (e) {

   }
   getTunaScreenNames("unshift");
   setInterval(function(){getTunaScreenNames("unshift");}, 1000);

   $("#tuna").remove();
  var notification = $("<div id='tuna' style='color:#777;position:absolute;left:385px;top:0;background:rgba(177,177,177,0.3) url(http://ashafa.com/tuna/green.png) no-repeat 5px 6px;padding:0 5px 0 18px;font-size:11px;border-radius:3px;-moz-border-radius:3px;-webkit-border-radius:3px;'>tuna v" + Tuna.version + " <div id='tuna-dd' style='margin-left:1px;border-left:1px solid #fff;display:inline-block;cursor:pointer;'><img style='position:relative;top:-1px;padding:0 0 0 4px;' src='http://ashafa.com/tuna/dd-link.png'/></div></div>");
   $("div.bar:eq(0)").append(notification);
   $("div#tuna-dd").click(function(){
   });

})();
