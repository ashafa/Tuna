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
     version: "0.3.1",
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
     if ( event.keyCode != 16 ) {
       var el = $(this),
       caretPos = Tuna.getCaretPosition(this),
       value = el.val(),
       startPos = this.selectionStart,
       endPos = this.selectionEnd,
       charAtPos = value.substr(caretPos-1, 1),
       charBeforePos = value.substr(caretPos-2, 1),
       charAfterPos = value.substr(caretPos, 1),
       isAcWorthy = ( caretPos == 1 ) ? /\s|^$/.test(charAfterPos) : /\s|^$/.test(charBeforePos) && /\s|^$/.test(charAfterPos);
       if ( ( event.keyCode != 9 )  && ((charAtPos  == "@" && isAcWorthy) || el.data("ac")) ) {
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
             el.data("search-for", searchFor);
             el.data("tab", null);
             var acUsers = Tuna.autoCompleter.getCompletions(searchFor);
             el.data("ac-users", acUsers);
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
     }
   }).bind("keydown", function(event){
     var el = $(this),
     caretPos = Tuna.getCaretPosition(this),
     value = el.val(),
     startPos = this.selectionStart,
     endPos = this.selectionEnd,
     searchFor = el.data("search-for");
     if ( event.keyCode == 9 && el.data("ac") ) {
       var acUsers = el.data("ac-users");
       var tab = ( el.data("tab") == null ) ? 1 : el.data("tab");
       if ( acUsers.length > 0 && acUsers[tab]) {
         var acUser = (/^[A-Z]/.test(searchFor)) ? acUsers[tab] : acUsers[tab].toLowerCase();
         el.val(value.substring(0, startPos) + acUser + " " + value.substring(endPos, value.length));
         Tuna.selectRange(this, caretPos, caretPos + acUser.length + 1);
         el.scrollTop(el.height());
         el.data("tab", ( tab == (acUsers.length - 1) ) ? 0 : tab + 1);
       }
       return false;
     }
     if ( (event.keyCode == 32 || event.keyCode == 13 || event.keyCode == 39) && el.data("ac") ) {
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

   $("div#tuna").remove();
   var notification = $("<div id='tuna' style='text-align:right;cursor:pointer;position:absolute;left:170px;top:11px;color:#777;background:rgba(0,0,0,0.1) url(http://ashafa.com/tuna/green.png) no-repeat 5px 6px;padding:3px 5px 3px 18px;font-size:11px;border-radius:3px;-moz-border-radius:3px;-webkit-border-radius:3px;'>tuna v" + Tuna.version + "</div>");
   $("a#logo").after(notification);

   notification.mouseover(function(){
   }).mouseout(function(){
   });

   var linkPlugins = {

    _plugin_bitly: {
    name: "bitly",
    domain: "bit.ly",

    version: '2.0.1',
    login: 'ashafa',
    apiKey: 'R_765553d91b35a3676ba953ccba2df3cb',
    apply: function(link) {
      var href = link.getAttribute("href");
      var hash = href.replace(/.+\/([a-zA-Z0-9]+)$/i, "$1");
      var url = "http://api.bit.ly/info?"
                  + "version=" + linkPlugins._plugin_bitly.version
                  + "&login=" + linkPlugins._plugin_bitly.login
                  + "&apiKey=" + linkPlugins._plugin_bitly.apiKey
                  + "&hash=" + hash
                  + "&format=json&callback=?";
      var titlePath = ["htmlTitle", hash, "results"];
      var expUrlPath = ["longUrl", hash, "results"];
      linkPlugins.urlExpansion(link, url, titlePath, expUrlPath);
    }
  },

  _plugin_twitpic: {
    name: "twitpic",
    domain: "twitpic.com",

    apply: function(link) {
      var href = link.getAttribute("href");
      var imageId = href.replace(/.+\/([a-zA-Z0-9]+)$/i, "$1");
      link.setAttribute("title", "<div class=\'thumbnail\'><img src='http://twitpic.com/show/thumb/" + imageId + "' border='0' /></div>");
    }
  },

  _plugin_youtube: {
    name: "youtube",
    domain: "youtube.com",

    apply: function(link) {
      var href = link.getAttribute("href");
      var youtubeMatch = href.match(/youtube.com\/.*v=([a-z0-9_\-]+)(&|$)/i);
      if ( youtubeMatch && youtubeMatch[1] ) {
        link.setAttribute("title", "<div class=\"video\"><object width=\"200\" height=\"200\">"
          + "<param name=\"movie\" value=\"http://youtube.com/v/" + youtubeMatch[1] + "&autoplay=1\"></param>"
          + "<param name=\"allowFullScreen\" value=\"true\"></param>"
          + "<embed type=\"application/x-shockwave-flash\" src=\"http://youtube.com/v/" + youtubeMatch[1] + "&autoplay=1\" quality=\"high\" allowscriptaccess=\"always\" allowNetworking=\"all\" allowfullscreen=\"true\" wmode=\"transparent\" height=\"200\" width=\"200\"></object></div>");
      }

    }
  },

  _plugin_yfrog: {
    name: "yfrog",
    domain: "yfrog.com",

    apply: function(link) {
      var href = link.getAttribute("href");
      link.setAttribute("title", "<div class=\'thumbnail\'><img src='" + href + ".th.jpg' border='0' /></div>");

    }
  },

  _plugin_picgd: {
    name: "picgd",
    domain: "pic.gd",

    apply: function(link) {
      var href = link.getAttribute("href");
      link.setAttribute("title", "<div class=\'thumbnail\'><img src='http://TweetPhotoAPI.com/api/TPAPI.svc/imagefromurl?size=thumbnail&url=" + href + "' border='0' /></div>");

    }

  },

  _plugin_owly: {
    name: "owly",
    domain: "ow.ly",

    apply: function(link) {
      var href = link.getAttribute("href");
      var titlePath = ["title"];
      var expUrlPath = ["expurl"];
      var url = "/u/url-expander?url=" + href;
      return linkPlugins.urlExpansion(link, url, titlePath, expUrlPath);
    }
  },


  digForData: function(data, path){
    return ( path.length > 1 ) ?
      linkPlugins.digForData(data[path.pop()], path) :
      data[path.pop()];
  },

     urlExpansion: function(link ,url, titlePath, expUrlPath) {
    $.getJSON(url, function(data){
      var title = linkPlugins.digForData(data, titlePath) || "<span class='no-info'>(No title.)</span>";
      var expUrl = linkPlugins.digForData(data, expUrlPath);
      var urlMatches = expUrl.match(/(.{40}).*(.{10}$)/);
      var formattedUrl = (urlMatches) ? (urlMatches[1] + "..." + urlMatches[2]) : expUrl;
      var html = "<p>" + title + "<br /><a title='" + expUrl + "' href='" + expUrl + "'>" + formattedUrl + "</a></p>";
      var youtubeMatch = expUrl.match(/youtube.com\/.*v=([a-z0-9_\-]+)(&|$)/i);
      if ( youtubeMatch && youtubeMatch[1] ) {
        html += "<div class=\"video\"><object width=\"200\" height=\"200\">"
          + "<param name=\"movie\" value=\"http://youtube.com/v/" + youtubeMatch[1] + "&autoplay=1\"></param>"
          + "<param name=\"allowFullScreen\" value=\"true\"></param>"
          + "<embed type=\"application/x-shockwave-flash\" src=\"http://youtube.com/v/" + youtubeMatch[1] + "&autoplay=1\" quality=\"high\" allowscriptaccess=\"always\" allowNetworking=\"all\" allowfullscreen=\"true\" wmode=\"transparent\" height=\"200\" width=\"200\"></object></div>";
      }
      link.setAttribute("title", html);
    });
    return "test";
  },

  applyPlugins: function(){
    for (pluginTag in linkPlugins) {
      if ( pluginTag.indexOf("_plugin_") == 0 ) {
        linkPlugins.applyPlugin(linkPlugins[pluginTag]);
      }
    }
  },

  applyPlugin: function(plugin) {
    $("a[href*=" + plugin.domain+ "/]:not(.tuna-set)")
      .each(function(){plugin.apply(this); $(this).addClass("tuna-set");})
      .tipsy({gravity: 's', delayIn: 1000, live: true, html: true, fallback: 'Fetching...', title: "title"});
  }
};

  setInterval(function(){linkPlugins.applyPlugins();}, 1000);

})();
