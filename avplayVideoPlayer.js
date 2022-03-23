/*function getMediaStreamAudioTracks(mediaSource) {
    return mediaSource.MediaStreams.filter(function (s) {
        return s.Type === 'Audio';
    });
}*/

function getMediaStreamTextTracks(mediaSource) {
    return mediaSource.MediaStreams.filter(function (s) {
        return s.Type === 'Subtitle';
    });
}

function _AvplayVideoPlayer(modules) {
    console.debug('AVPlay Video Player');

    window['AvplayVideoPlayer'] = this;

    this.appRouter = modules.appRouter;
    this.Events = modules.events;
    this.loading = modules.loading;

    // playbackManager needs this
    this.name = "AVPlay Video Player";
    this.type = 'mediaplayer';
    this.id = 'avplay-video';
    this.isLocalPlayer = true;
    //this.lastPlayerData = {}; // FIXME: need?

    this._currentPlayOptions = {};

    this.canPlayMediaType = function (mediaType) {
        return (mediaType || '').toLowerCase() === 'video';
    };

    this.supportsPlayMethod = function (playMethod, item) {
        return true;
    };

    this.getDeviceProfile = function (item, options) {
        var profile = {
            Name: this.name + ' Profile',

            MaxStreamingBitrate: 120000000,
            MaxStaticBitrate: 100000000,
            MusicStreamingTranscodingBitrate: 384000,

            CodecProfiles: [
                {
                    Codec: 'h264',
                    Conditions: [
                        {
                            Condition: 'NotEquals',
                            IsRequired: false,
                            Property: 'IsAnamorphic',
                            Value: 'true'
                        },
                        {
                            Condition: 'EqualsAny',
                            IsRequired: false,
                            Property: 'VideoProfile',
                            Value: 'high|main|baseline|constrained baseline|high 10'
                        },
                        {
                            Condition: 'LessThanEqual',
                            IsRequired: false,
                            Property: 'VideoLevel',
                            Value: '51'
                        }
                    ],
                    Type: 'Video'
                },
                {
                    Codec: 'hevc',
                    Conditions: [
                        {
                            Condition: 'NotEquals',
                            IsRequired: false,
                            Property: 'IsAnamorphic',
                            Value: 'true'
                        },
                        {
                            Condition: 'EqualsAny',
                            IsRequired: false,
                            Property: 'VideoProfile',
                            Value: 'main|main 10'
                        },
                        {
                            Condition: 'LessThanEqual',
                            IsRequired: false,
                            Property: 'VideoLevel',
                            Value: '183'
                        }
                    ],
                    Type: 'Video'
                }
            ],

            DirectPlayProfiles: [
                {
                    Container: 'webm',
                    AudioCodec: 'vorbis,opus',
                    VideoCodec: 'vp8,vp9',
                    Type: 'Video'
                },
                {
                    Container: 'mp4,m4v',
                    AudioCodec: 'aac,mp3,ac3,eac3,mp2,pcm_s16le,pcm_s24le,aac_latm,opus,flac,vorbis',
                    VideoCodec: 'h264,hevc,mpeg2video,vc1,msmpeg4v2,vp8,vp9',
                    Type: 'Video'
                },
                {
                    Container: 'mkv',
                    AudioCodec: 'aac,mp3,ac3,eac3,mp2,pcm_s16le,pcm_s24le,aac_latm,opus,flac,vorbis',
                    VideoCodec: 'h264,hevc,mpeg2video,vc1,msmpeg4v2,vp8,vp9',
                    Type: 'Video'
                },
                {
                    Container: 'm2ts',
                    AudioCodec: 'aac,mp3,ac3,eac3,mp2,pcm_s16le,pcm_s24le,aac_latm,opus,flac,vorbis',
                    VideoCodec: 'h264,vc1,mpeg2video',
                    Type: 'Video'
                },
                {
                    Container: 'wmv',
                    Type: 'Video'
                },
                {
                    Container: 'ts,mpegts',
                    AudioCodec: 'aac,mp3,ac3,eac3,mp2,pcm_s16le,pcm_s24le,aac_latm,opus,flac,vorbis',
                    VideoCodec: 'h264,hevc,vc1,mpeg2video',
                    Type: 'Video'
                },
                {
                    Container: 'asf',
                    Type: 'Video'
                },
                {
                    Container: 'avi',
                    AudioCodec: 'aac,mp3,ac3,eac3,mp2,pcm_s16le,pcm_s24le,aac_latm,opus,flac,vorbis',
                    VideoCodec: 'h264,hevc',
                    Type: 'Video'
                },
                {
                    Container: 'mpg,mpeg,flv,3gp,mts,trp,vob,vro',
                    AudioCodec: 'aac,mp3,ac3,eac3,mp2,pcm_s16le,pcm_s24le,aac_latm,opus,flac,vorbis',
                    Type: 'Video'
                },
                {
                    Container: 'mov',
                    AudioCodec: 'aac,mp3,ac3,eac3,mp2,pcm_s16le,pcm_s24le,aac_latm,opus,flac,vorbis',
                    VideoCodec: 'h264',
                    Type: 'Video'
                },
                {
                    Container: 'opus,mp3,aac,m4a,m4b,flac,webma,wma,wav,ogg',
                    Type: 'Audio'
                },
                {
                    Container: 'webm',
                    AudioCodec: 'opus,webma',
                    Type: 'Audio'
                },
            ],

            ResponseProfiles: [
                {
                    Container: 'm4v',
                    MimeType: 'video/mp4',
                    Type: 'Video'
                }
            ],

            SubtitleProfiles: [
                {
                    Format: 'vtt',
                    Method: 'External'
                },
                {
                    Format: 'ass',
                    Method: 'External'
                },
                {
                    Format: 'ssa',
                    Method: 'External'
                }
            ],

            TranscodingProfiles: [
            ]
        };

        return Promise.resolve(profile);
    }

    this.play = function (options) {
        var self = this;

        return self.createMediaElement(options)
            .then(function (elem) {
                self._videoElement = elem;
                return self.setCurrentSrc(elem, options);
            })
            .then(function () {
                if (options.fullscreen) {
                    self.appRouter.showVideoOsd().then(function () {
                        self._videoElement.classList.remove('avplayVideoPlayerOnTop');
                    });
                } else {
                    self.appRouter.setTransparency('backdrop');
                    self._videoElement.classList.remove('avplayVideoPlayerOnTop');
                }

                webapis.avplay.play();

                self.loading.hide();
            });
    }

    this.stop = function (destroyPlayer) {
        var elem = document.querySelector('.avplayVideoPlayer');

        if (elem) {
            webapis.avplay.stop();

            this.onEnded();

            if (destroyPlayer) {
                this.destroy();
            }
        }

        this._currentPlayOptions = {};

        return Promise.resolve();
    }

    this.destroy = function () {
        this.appRouter.setTransparency('none');
        document.body.classList.remove('hide-scroll');

        var elem = document.querySelector('.avplayVideoPlayer');

        if (elem) {
            webapis.avplay.close();
            elem.parentNode.removeChild(elem);
        }

        this._videoElement = null;
    }

    this.volume = function (val) {
        // Volume is controlled physically
        return 1.0;
    }

    this.isMuted = function () {
        // Volume is controlled physically
        return false;
    }

    this.currentSrc = function () {
        return this._currentPlayOptions.url;
    }

    this.currentTime = function (val) {
        if (val != null) {
            var successCallback = function () {
                console.debug('Media seek successful');
            };

            var errorCallback = function () {
                console.debug('Media seek failed');
            };

            return webapis.avplay.seekTo(val, successCallback, errorCallback);
        }

        return webapis.avplay.getCurrentTime();
    }

    this.duration = function () {
        return webapis.avplay.getDuration();
    }

    this.seekable = function () {
        return this._videoElement && webapis.avplay.getDuration() > 0;
    }

    this.paused = function () {
        return webapis.avplay.getState() === 'PAUSED';
    }

    this.pause = function () {
        webapis.avplay.pause();
        this.Events.trigger(this, 'pause');
    }

    this.unpause = function () {
        webapis.avplay.play();
        this.Events.trigger(this, 'unpause');
    }

    this.createMediaElement = function (options) {
        var elem = document.querySelector('.avplayVideoPlayer');

        if (!elem) {
            elem = document.createElement('object');
            elem.type = 'application/avplayer';
            elem.classList.add('avplayVideoPlayer');
            elem.classList.toggle('avplayVideoPlayerOnTop', options.fullscreen);
            document.body.insertBefore(elem, document.body.children[0]);
        }

        if (options.fullscreen) {
            document.body.classList.add('hide-scroll');
        }

        return Promise.resolve(elem);
    }

    this.setCurrentSrc = function (elem, options) {
        var self = this;

        return new Promise(function (resolve, reject) {
            var listener = {
                /*onbufferingstart: function () {
                    console.debug("Buffering start.");
                },
 
                onbufferingprogress: function (percent) {
                    console.debug("Buffering progress data : " + percent);
                },

                onbufferingcomplete: function () {
                    console.debug("Buffering complete.");
                },*/
 
                onstreamcompleted: function () {
                    self.onEnded();
                },

                oncurrentplaytime: function ()  {
                    self.Events.trigger(self, 'timeupdate');
                },

                onerror: function (eventType) {
                    console.debug("event type error : " + eventType);
                    reject(eventType);
                },

                onevent: function (eventType, eventData) {
                    console.debug("event type: " + eventType + ", data: " + eventData);
                },

                onsubtitlechange: function (duration, text, data3, data4) {
                    console.debug("subtitleText: " + text);
                },

                ondrmevent: function (drmEvent, drmData) {
                    console.debug("DRM callback: " + drmEvent + ", data: " + drmData);
                }
            };

            self._currentPlayOptions = options;

            webapis.avplay.open(options.url);

            webapis.avplay.setListener(listener);

            // FIXME: need size
            webapis.avplay.setDisplayRect(0, 0, 1920, 1080);

            webapis.avplay.prepareAsync(resolve, reject);
        });
    }

    this.canSetAudioStreamIndex = function () {
        return true;
    }

    this.setAudioStreamIndex = function (streamIndex) {
        console.debug('setting new audio track index to: ' + streamIndex);

        webapis.avplay.setSelectTrack('AUDIO', streamIndex);
    }

    this.setSubtitleStreamIndex = function (streamIndex) {
        console.debug('setting new text track index to: ' + streamIndex);

        var track = null;

        if (streamIndex !== -1) {
            var mediaStreamTextTracks = getMediaStreamTextTracks(this._currentPlayOptions.mediaSource);

            track = mediaStreamTextTracks.filter(function (t) {
                return t.Index === streamIndex;
            })[0];

            console.debug(mediaStreamTextTracks);
            console.debug(webapis.avplay.getTotalTrackInfo());

            webapis.avplay.setSelectTrack('TEXT', streamIndex);
        }
    }

    this.setSubtitleOffset = function (offset) {
        var offsetValue = parseFloat(offset) * 1000;
        // FIXME: Cannot be called if no subtitles
        //webapis.avplay.setSubtitlePosition(offsetValue);
    }

    this.onEnded = function () {
        var stopInfo = {
            src: this.currentSrc()
        };

        this.Events.trigger(this, 'stopped', [stopInfo]);
    }
};

window['AvplayVideoPlayer'] = function () { return _AvplayVideoPlayer; };
