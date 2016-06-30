// # ----- Script info:
// - Author: Michael Mammoliti
// - Name: jAudio.js
// - Version: 0.2
// - js dipendencies: jQuery
// - Release date: 25 November 2015
// - GitHub: https://github.com/MichaelMammoliti/jAudio.js

// # ----- Contact info
// - GitHub: https://github.com/MichaelMammoliti
// - Mail: mammoliti.michael@gmail.com
// - Twitter: @MichMammoliti

// # ----- License Info
// - Released under the GPL v3 license.

(function($){

  var pluginName = "jAudio",
      defaults = {
        playlist: [],

        defaultAlbum: undefined,
        defaultArtist: undefined,
        defaultTrack: 0,

        autoPlay: false,

        debug: false
      };

  function Plugin( $context, options )
  {
    this.settings         = $.extend( true, defaults, options );

    this.$context         = $context;

    this.domAudio         = this.$context.find("audio")[0];
    this.$domPlaylist     = this.$context.find(".jAudio--playlist");
    this.$domControls     = this.$context.find(".jAudio--controls");
    this.$domVolumeBar    = this.$context.find(".jAudio--volume");
    this.$domDetails      = this.$context.find(".jAudio--details");
    this.$domStatusBar    = this.$context.find(".jAudio--status-bar");
    this.$domProgressBar  = this.$context.find(".jAudio--progress-bar-wrapper");
    this.$domTime         = this.$context.find(".jAudio--time");
    this.$domElapsedTime  = this.$context.find(".jAudio--time-elapsed");
    this.$domTotalTime    = this.$context.find(".jAudio--time-total");
    this.$domThumb        = this.$context.find(".jAudio--thumb");

    this.currentState       = "pause";
    this.currentTrack       = this.settings.defaultTrack;
    this.currentElapsedTime = undefined;

    this.timer              = undefined;

    this.init();
  }

  Plugin.prototype = {

    init: function()
    {
      var self = this;

      self.renderPlaylist();
      self.preLoadTrack();
      self.highlightTrack();
      self.updateTotalTime();
      self.events();
      self.debug();
      self.domAudio.volume = 0.50
    },

    play: function()
    {
      var self        = this,
          playButton  = self.$domControls.find("#btn-play");

      self.domAudio.play();

      if(self.currentState === "play") return;

      clearInterval(self.timer);
      self.timer = setInterval( self.run.bind(self), 50 );

      self.currentState = "play";

      // change id
      playButton.data("action", "pause");
      playButton.attr("id", "btn-pause");

      // activate
      playButton.toggleClass('active');
    },

    pause: function()
    {
      var self        = this,
          playButton  = self.$domControls.find("#btn-pause");

      self.domAudio.pause();
      clearInterval(self.timer);

      self.currentState = "pause";

      // change id
      playButton.data("action", "play");
      playButton.attr("id", "btn-play");

      // activate
      playButton.toggleClass('active');

    },

    stop: function()
    {
      var self = this;

      self.domAudio.pause();
      self.domAudio.currentTime = 0;

      self.animateProgressBarPosition();
      clearInterval(self.timer);
      self.updateElapsedTime();

      self.currentState = "stop";
    },

    prev: function()
    {
      var self  = this,
          track;

      (self.currentTrack === 0)
        ? track = self.settings.playlist.length - 1
      : track = self.currentTrack - 1;

      self.changeTrack(track);
    },
    next: function()
    {
      var self = this,
          track;

      (self.currentTrack === self.settings.playlist.length - 1)
        ? track = 0
      : track = self.currentTrack + 1;

      self.changeTrack(track);
    },


    preLoadTrack: function()
    {
      var self      = this,
          defTrack  = self.settings.defaultTrack;

      self.changeTrack( defTrack );

      self.stop();
    },

    changeTrack: function(index)
    {
      var self = this;

      self.currentTrack  = index;
      self.domAudio.src  = self.settings.playlist[index].file;

      if(self.currentState === "play" || self.settings.autoPlay) self.play();

      self.highlightTrack();

      self.updateThumb();

      self.renderDetails();
    },

    events: function()
    {
      var self = this;

      // - controls events
      self.$domControls.on("click", "button", function()
                           {
        var action = $(this).data("action");

        switch( action )
        {
          case "prev": self.prev.call(self); break;
          case "next": self.next.call(self); break;
          case "pause": self.pause.call(self); break;
          case "stop": self.stop.call(self); break;
          case "play": self.play.call(self); break;
        };

      });

      // - playlist events
      self.$domPlaylist.on("click", ".jAudio--playlist-item", function(e)
                           {
        var item = $(this),
            track = item.data("track"),
            index = item.index();

        if(self.currentTrack === index) return;

        self.changeTrack(index);
      });

      // - volume's bar events
      // to do

      // - progress bar events
      self.$domProgressBar.on("click", function(e)
                              {
        self.updateProgressBar(e);
        self.updateElapsedTime();
      });

      $(self.domAudio).on("loadedmetadata", function()
                          {
        self.animateProgressBarPosition.call(self);
        self.updateElapsedTime.call(self);
        self.updateTotalTime.call(self);
      });
    },


    getAudioSeconds: function(string)
    {
      var self    = this,
          string  = string % 60;
      string  = self.addZero( Math.floor(string), 2 );

      (string < 60) ? string = string : string = "00";

      return string;
    },

    getAudioMinutes: function(string)
    {
      var self    = this,
          string  = string / 60;
      string  = self.addZero( Math.floor(string), 2 );

      (string < 60) ? string = string : string = "00";

      return string;
    },

    addZero: function(word, howManyZero)
    {
      var word = String(word);

      while(word.length < howManyZero) word = "0" + word;

      return word;
    },

    removeZero: function(word, howManyZero)
    {
      var word  = String(word),
          i     = 0;

      while(i < howManyZero)
      {
        if(word[0] === "0") { word = word.substr(1, word.length); } else { break; }

        i++;
      }

      return word;
    },


    highlightTrack: function()
    {
      var self      = this,
          tracks    = self.$domPlaylist.children(),
          className = "active";

      tracks.removeClass(className);
      tracks.eq(self.currentTrack).addClass(className);
    },

    renderDetails: function()
    {
      var self          = this,
          track         = self.settings.playlist[self.currentTrack],
          file          = track.file,
          thumb         = track.thumb,
          trackName     = track.trackName,
          trackArtist   = track.trackArtist,
          trackAlbum    = track.trackAlbum,
          template      =  "";

      template += "<p>";
      template += "<span>" + trackName + "</span>";
      // template += " - ";
      template += "<span>" + trackArtist + "</span>";
      // template += "<span>" + trackAlbum + "</span>";
      template += "</p>";


      $(".jAudio--details").html(template);

    },

    renderPlaylist: function()
    {
      var self = this,
          template = "";


      $.each(self.settings.playlist, function(i, a)
             {
        var file          = a["file"],
            thumb         = a["thumb"],
            trackName     = a["trackName"],
            trackArtist   = a["trackArtist"],
            trackAlbum    = a["trackAlbum"];
        trackDuration = "00:00";

        template += "<div class='jAudio--playlist-item' data-track='" + file + "'>";

        template += "<div class='jAudio--playlist-thumb'><img src='"+ thumb +"'></div>";

        template += "<div class='jAudio--playlist-meta-text'>";
        template += "<h4>" + trackName + "</h4>";
        template += "<p>" + trackArtist + "</p>";
        template += "</div>";
        // template += "<div class='jAudio--playlist-track-duration'>" + trackDuration + "</div>";
        template += "</div>";

        // });

      });

      self.$domPlaylist.html(template);

    },

    run: function()
    {
      var self = this;

      self.animateProgressBarPosition();
      self.updateElapsedTime();

      if(self.domAudio.ended) self.next();
    },

    animateProgressBarPosition: function()
    {
      var self        = this,
          percentage  = (self.domAudio.currentTime * 100 / self.domAudio.duration) + "%",
          styles      = { "width": percentage };

      self.$domProgressBar.children().eq(0).css(styles);
    },

    updateProgressBar: function(e)
    {
      var self = this,
          mouseX,
          percentage,
          newTime;

      if(e.offsetX) mouseX = e.offsetX;
      if(mouseX === undefined && e.layerX) mouseX = e.layerX;

      percentage  = mouseX / self.$domProgressBar.width();
      newTime     = self.domAudio.duration * percentage;

      self.domAudio.currentTime = newTime;
      self.animateProgressBarPosition();
    },

    updateElapsedTime: function()
    {
      var self      = this,
          time      = self.domAudio.currentTime,
          minutes   = self.getAudioMinutes(time),
          seconds   = self.getAudioSeconds(time),

          audioTime = minutes + ":" + seconds;

      self.$domElapsedTime.text( audioTime );
    },

    updateTotalTime: function()
    {
      var self      = this,
          time      = self.domAudio.duration,
          minutes   = self.getAudioMinutes(time),
          seconds   = self.getAudioSeconds(time),
          audioTime = minutes + ":" + seconds;

      self.$domTotalTime.text( audioTime );
    },


    updateThumb: function()
    {
      var self = this,
          thumb = self.settings.playlist[self.currentTrack].thumb,
          styles = {
            "background-image": "url(" + thumb + ")"
          };

      self.$domThumb.css(styles);
    },

    debug: function()
    {
      var self = this;

      if(self.settings.debug) console.log(self.settings);
    }

  }

  $.fn[pluginName] = function( options )
  {
    var instantiate = function()
    {
      return new Plugin( $(this), options );
    }

    $(this).each(instantiate);
  }

})(jQuery)

var t = {
  playlist: [
    {
      file: "https://archive.org/download/DramaAlertRemix/DramaAlertRemix.mp3",
      thumb: "https://scontent.cdninstagram.com/t51.2885-15/e35/12445874_650755555062197_200380136_n.jpg?ig_cache_key=MTIzMDA2NTkyMzg2Mzc2MzI3NQ%3D%3D.2",
      trackName: "Drama Alert Remix",
      trackArtist: "CoolSongs",
      trackAlbum: "Single",
    },
    {
      file: "https://archive.org/download/HeyNowYoureAKeemstar_idubbbztv2/Hey%20Now,%20You're%20A%20Keemstar.mp3",
      thumb: "https://scontent.cdninstagram.com/t51.2885-15/e35/12445874_650755555062197_200380136_n.jpg?ig_cache_key=MTIzMDA2NTkyMzg2Mzc2MzI3NQ%3D%3D.2",
      trackName: "Hey Now, You're A Keemstar",
      trackArtist: "iDubbbzTV2",
      trackAlbum: "Single",
    },
    {
      file: "https://archive.org/download/YoutubeRemixAssonFurryFeat.KeemstarDramaAlert/[Youtube%20Remix]%20Asson%20-%20Furry%20Feat.%20Keemstar%20(DramaAlert).mp3",
      thumb: "https://scontent.cdninstagram.com/t51.2885-15/e35/12445874_650755555062197_200380136_n.jpg?ig_cache_key=MTIzMDA2NTkyMzg2Mzc2MzI3NQ%3D%3D.2",
      trackName: "Asson - Furry Feat. Keemstar",
      trackArtist: "BumbleJoD",
      trackAlbum: "Single",
    },
    {
      file: "https://archive.org/download/KEEMSTARREMIXMLGALERTDramaAlert/KEEMSTAR%20REMIX%21%20%28MLG%20ALERT%29%20%23DramaAlert.mp3",
      thumb: "https://scontent.cdninstagram.com/t51.2885-15/e35/12445874_650755555062197_200380136_n.jpg?ig_cache_key=MTIzMDA2NTkyMzg2Mzc2MzI3NQ%3D%3D.2",
      trackName: "KEEMSTAR (MLGALERT)",
      trackArtist: "Potatofarm71",
      trackAlbum: "Single",
    },
    {
      file: "https://archive.org/download/KeemstarRustStreamRapRemix/Keemstar%20Rust%20Stream%20Rap%20Remix.mp3",
      thumb: "https://scontent.cdninstagram.com/t51.2885-15/e35/12445874_650755555062197_200380136_n.jpg?ig_cache_key=MTIzMDA2NTkyMzg2Mzc2MzI3NQ%3D%3D.2",
      trackName: "Keemstar Stream Rap Remix",
      trackArtist: "Kenuard",
      trackAlbum: "Single",
    },
    {
      file: "https://archive.org/download/MACKEEMTOSHPLUS/MACKEEMTOSH%20PLUS.mp3",
      thumb: "https://scontent.cdninstagram.com/t51.2885-15/e35/12445874_650755555062197_200380136_n.jpg?ig_cache_key=MTIzMDA2NTkyMzg2Mzc2MzI3NQ%3D%3D.2",
      trackName: "MACKEEMTOSH PLUS",
      trackArtist: "Dr. Rab",
      trackAlbum: "Single",
    },
    {
      file: "https://archive.org/download/KeemstarTheTankEngine/keemstar%20the%20tank%20engine.mp3",
      thumb: "https://scontent.cdninstagram.com/t51.2885-15/e35/12445874_650755555062197_200380136_n.jpg?ig_cache_key=MTIzMDA2NTkyMzg2Mzc2MzI3NQ%3D%3D.2",
      trackName: "Keemstar The Tank Engine",
      trackArtist: "Flater",
      trackAlbum: "Single",
    },
    {
      file: "https://archive.org/download/TheKeemstarRemix/The%20Keemstar%20Remix.mp3",
      thumb: "https://scontent.cdninstagram.com/t51.2885-15/e35/12445874_650755555062197_200380136_n.jpg?ig_cache_key=MTIzMDA2NTkyMzg2Mzc2MzI3NQ%3D%3D.2",
      trackName: "The Keemstar Remix",
      trackArtist: "Dull Reviews",
      trackAlbum: "Single",
    },
    {
      file: "https://archive.org/download/DontBeAHypocriteKeemstarRemix/Don't%20Be%20A%20Hypocrite%20Keemstar%20(Remix).mp3",
      thumb: "https://scontent.cdninstagram.com/t51.2885-15/e35/12445874_650755555062197_200380136_n.jpg?ig_cache_key=MTIzMDA2NTkyMzg2Mzc2MzI3NQ%3D%3D.2",
      trackName: "Don't Be A Hypocrite",
      trackArtist: "Theory - Marlin",
      trackAlbum: "Single",
    },
    {
      file: "https://archive.org/download/FM360KeemstarRemix/FM360%20-%20Keemstar%20Remix.mp3",
      thumb: "https://scontent.cdninstagram.com/t51.2885-15/e35/12445874_650755555062197_200380136_n.jpg?ig_cache_key=MTIzMDA2NTkyMzg2Mzc2MzI3NQ%3D%3D.2",
      trackName: "Keemstar Remix",
      trackArtist: "FM360",
      trackAlbum: "Single",
    },
  ]
}


$(".jAudio--player").jAudio(t);
