(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.WavPlayer = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _wavify = require('./wavify');

var _wavify2 = _interopRequireDefault(_wavify);

var _concat = require('./concat');

var _concat2 = _interopRequireDefault(_concat);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var WavPlayer = function WavPlayer() {
    var hasCanceled_ = false;

    var _play = function _play(url) {

        var nextTime = 0;

        var audioStack = [];

        hasCanceled_ = false;

        var context = new AudioContext();

        return fetch(url).then(function (response) {
            var reader = response.body.getReader();

            // This variable holds a possibly dangling byte.
            var rest = null;

            var read = function read() {
                return reader.read().then(function (_ref) {
                    var value = _ref.value;
                    var done = _ref.done;

                    if (hasCanceled_) {
                        reader.cancel();
                        context.close();
                        return;
                    }
                    if (value && value.buffer) {
                        var buffer = void 0;

                        if (rest !== null) {
                            buffer = (0, _concat2.default)(rest, value.buffer);
                        } else {
                            buffer = value.buffer;
                        }

                        if (buffer.byteLength % 2 !== 0) {
                            rest = buffer.slice(-2, -1);
                            buffer = buffer.slice(0, -1);
                        } else {
                            rest = null;
                        }

                        context.decodeAudioData((0, _wavify2.default)(buffer)).then(function (audioBuffer) {
                            audioStack.push(audioBuffer);

                            if (audioStack.length) {
                                scheduleBuffers();
                            }
                        });
                    }

                    if (done) {
                        return;
                    }

                    read();
                });
            };

            read();
        });

        var scheduleBuffers = function scheduleBuffers() {
            while (audioStack.length) {
                var source = context.createBufferSource();

                source.buffer = audioStack.shift();

                source.connect(context.destination);

                if (nextTime == 0) {
                    nextTime = context.currentTime + 0.3; /// add 50ms latency to work well across systems - tune this if you like
                }

                source.start(nextTime);
                source.stop(nextTime + source.buffer.duration);

                nextTime += source.buffer.duration; // Make the next buffer wait the length of the last buffer before being played
            }
        };
    };

    return {
        play: function play(url) {
            return _play(url);
        },
        stop: function stop() {
            return hasCanceled_ = true;
        }
    };
};

exports.default = WavPlayer;

},{"./concat":2,"./wavify":4}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});


// Concat two ArrayBuffers
var concat = function concat(buffer1, buffer2) {
    var tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);

    tmp.set(new Uint8Array(buffer1), 0);
    tmp.set(new Uint8Array(buffer2), buffer1.byteLength);

    return tmp.buffer;
};

exports.default = concat;

},{}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _WavPlayer = require('./WavPlayer');

var _WavPlayer2 = _interopRequireDefault(_WavPlayer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = _WavPlayer2.default;

module.exports = _WavPlayer2.default;

},{"./WavPlayer":1}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _concat = require('./concat');

var _concat2 = _interopRequireDefault(_concat);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Write a proper WAVE header for the given buffer.
var wavify = function wavify(data) {
    var header = new ArrayBuffer(44);

    var d = new DataView(header);

    d.setUint8(0, 'R'.charCodeAt(0));
    d.setUint8(1, 'I'.charCodeAt(0));
    d.setUint8(2, 'F'.charCodeAt(0));
    d.setUint8(3, 'F'.charCodeAt(0));

    d.setUint32(4, data.byteLength / 2 + 44, true);

    d.setUint8(8, 'W'.charCodeAt(0));
    d.setUint8(9, 'A'.charCodeAt(0));
    d.setUint8(10, 'V'.charCodeAt(0));
    d.setUint8(11, 'E'.charCodeAt(0));
    d.setUint8(12, 'f'.charCodeAt(0));
    d.setUint8(13, 'm'.charCodeAt(0));
    d.setUint8(14, 't'.charCodeAt(0));
    d.setUint8(15, ' '.charCodeAt(0));

    d.setUint32(16, 16, true);
    d.setUint16(20, 1, true);
    d.setUint16(22, 1, true);
    d.setUint32(24, 11025, true);
    d.setUint32(28, 11025 * 1 * 2);
    d.setUint16(32, 1 * 2);
    d.setUint16(34, 16, true);

    d.setUint8(36, 'd'.charCodeAt(0));
    d.setUint8(37, 'a'.charCodeAt(0));
    d.setUint8(38, 't'.charCodeAt(0));
    d.setUint8(39, 'a'.charCodeAt(0));
    d.setUint32(40, data.byteLength, true);

    return (0, _concat2.default)(header, data);
};

exports.default = wavify;

},{"./concat":2}]},{},[3])(3)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvV2F2UGxheWVyLmpzIiwic3JjL2NvbmNhdC5qcyIsInNyYy9pbmRleC5qcyIsInNyYy93YXZpZnkuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7QUNBQTs7OztBQUNBOzs7Ozs7QUFFQSxJQUFNLFlBQVksU0FBWixTQUFZLEdBQU07QUFDcEIsUUFBSSxlQUFlLEtBQW5COztBQUVBLFFBQU0sUUFBTyxTQUFQLEtBQU8sTUFBTzs7QUFFaEIsWUFBSSxXQUFXLENBQWY7O0FBRUEsWUFBTSxhQUFhLEVBQW5COztBQUVBLHVCQUFlLEtBQWY7O0FBRUEsWUFBTSxVQUFVLElBQUksWUFBSixFQUFoQjs7QUFFQSxlQUFPLE1BQU0sR0FBTixFQUNGLElBREUsQ0FDRyxVQUFDLFFBQUQsRUFBYztBQUNoQixnQkFBTSxTQUFTLFNBQVMsSUFBVCxDQUFjLFNBQWQsRUFBZjs7QUFFQTtBQUNBLGdCQUFJLE9BQU8sSUFBWDs7QUFFQSxnQkFBTSxPQUFPLFNBQVAsSUFBTztBQUFBLHVCQUFNLE9BQU8sSUFBUCxHQUNkLElBRGMsQ0FDVCxnQkFBcUI7QUFBQSx3QkFBbEIsS0FBa0IsUUFBbEIsS0FBa0I7QUFBQSx3QkFBWCxJQUFXLFFBQVgsSUFBVzs7QUFDdkIsd0JBQUksWUFBSixFQUFrQjtBQUNoQiwrQkFBTyxNQUFQO0FBQ0EsZ0NBQVEsS0FBUjtBQUNBO0FBQ0Q7QUFDRCx3QkFBSSxTQUFTLE1BQU0sTUFBbkIsRUFBMkI7QUFDdkIsNEJBQUksZUFBSjs7QUFFQSw0QkFBSSxTQUFTLElBQWIsRUFBbUI7QUFDZixxQ0FBUyxzQkFBTyxJQUFQLEVBQWEsTUFBTSxNQUFuQixDQUFUO0FBQ0gseUJBRkQsTUFFTztBQUNILHFDQUFTLE1BQU0sTUFBZjtBQUNIOztBQUVELDRCQUFJLE9BQU8sVUFBUCxHQUFvQixDQUFwQixLQUEwQixDQUE5QixFQUFpQztBQUM3QixtQ0FBTyxP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Z0IsS0FBSyxVQUFyQixFQUFpQyxJQUFqQzs7QUFFQSxXQUFPLHNCQUFPLE1BQVAsRUFBZSxJQUFmLENBQVA7QUFDSCxDQXBDRDs7a0JBc0NlLE0iLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiaW1wb3J0IHdhdmlmeSBmcm9tICcuL3dhdmlmeSc7XG5pbXBvcnQgY29uY2F0IGZyb20gJy4vY29uY2F0JztcblxuY29uc3QgV2F2UGxheWVyID0gKCkgPT4ge1xuICAgIGxldCBoYXNDYW5jZWxlZF8gPSBmYWxzZTtcblxuICAgIGNvbnN0IHBsYXkgPSB1cmwgPT4ge1xuXG4gICAgICAgIGxldCBuZXh0VGltZSA9IDA7XG5cbiAgICAgICAgY29uc3QgYXVkaW9TdGFjayA9IFtdO1xuXG4gICAgICAgIGhhc0NhbmNlbGVkXyA9IGZhbHNlO1xuXG4gICAgICAgIGNvbnN0IGNvbnRleHQgPSBuZXcgQXVkaW9Db250ZXh0KCk7XG5cbiAgICAgICAgcmV0dXJuIGZldGNoKHVybClcbiAgICAgICAgICAgIC50aGVuKChyZXNwb25zZSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlYWRlciA9IHJlc3BvbnNlLmJvZHkuZ2V0UmVhZGVyKCk7XG5cbiAgICAgICAgICAgICAgICAvLyBUaGlzIHZhcmlhYmxlIGhvbGRzIGEgcG9zc2libHkgZGFuZ2xpbmcgYnl0ZS5cbiAgICAgICAgICAgICAgICB2YXIgcmVzdCA9IG51bGw7XG5cbiAgICAgICAgICAgICAgICBjb25zdCByZWFkID0gKCkgPT4gcmVhZGVyLnJlYWQoKVxuICAgICAgICAgICAgICAgICAgICAudGhlbigoeyB2YWx1ZSwgZG9uZSB9KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaGFzQ2FuY2VsZWRfKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJlYWRlci5jYW5jZWwoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dC5jbG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUgJiYgdmFsdWUuYnVmZmVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGJ1ZmZlcjtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXN0ICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZmZlciA9IGNvbmNhdChyZXN0LCB2YWx1ZS5idWZmZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZmZlciA9IHZhbHVlLmJ1ZmZlcjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYnVmZmVyLmJ5dGVMZW5ndGggJSAyICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3QgPSBidWZmZXIuc2xpY2UoLTIsIC0xKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnVmZmVyID0gYnVmZmVyLnNsaWNlKDAsIC0xKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN0ID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0LmRlY29kZUF1ZGlvRGF0YSh3YXZpZnkoYnVmZmVyKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4oKGF1ZGlvQnVmZmVyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdWRpb1N0YWNrLnB1c2goYXVkaW9CdWZmZXIpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYXVkaW9TdGFjay5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY2hlZHVsZUJ1ZmZlcnMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkb25lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICByZWFkKCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgcmVhZCgpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3Qgc2NoZWR1bGVCdWZmZXJzID0gKCkgPT4ge1xuICAgICAgICAgICAgd2hpbGUgKGF1ZGlvU3RhY2subGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc291cmNlID0gY29udGV4dC5jcmVhdGVCdWZmZXJTb3VyY2UoKTtcblxuICAgICAgICAgICAgICAgIHNvdXJjZS5idWZmZXIgPSBhdWRpb1N0YWNrLnNoaWZ0KCk7XG5cbiAgICAgICAgICAgICAgICBzb3VyY2UuY29ubmVjdChjb250ZXh0LmRlc3RpbmF0aW9uKTtcblxuICAgICAgICAgICAgICAgIGlmIChuZXh0VGltZSA9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIG5leHRUaW1lID0gY29udGV4dC5jdXJyZW50VGltZSArIDAuMzsgIC8vLyBhZGQgNTBtcyBsYXRlbmN5IHRvIHdvcmsgd2VsbCBhY3Jvc3Mgc3lzdGVtcyAtIHR1bmUgdGhpcyBpZiB5b3UgbGlrZVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHNvdXJjZS5zdGFydChuZXh0VGltZSk7XG4gICAgICAgICAgICAgICAgc291cmNlLnN0b3AobmV4dFRpbWUgKyBzb3VyY2UuYnVmZmVyLmR1cmF0aW9uKTtcblxuICAgICAgICAgICAgICAgIG5leHRUaW1lICs9IHNvdXJjZS5idWZmZXIuZHVyYXRpb247IC8vIE1ha2UgdGhlIG5leHQgYnVmZmVyIHdhaXQgdGhlIGxlbmd0aCBvZiB0aGUgbGFzdCBidWZmZXIgYmVmb3JlIGJlaW5nIHBsYXllZFxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBwbGF5OiB1cmwgPT4gcGxheSh1cmwpLFxuICAgICAgc3RvcDogKCkgPT4gaGFzQ2FuY2VsZWRfID0gdHJ1ZVxuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgV2F2UGxheWVyOyIsIlxuXG4vLyBDb25jYXQgdHdvIEFycmF5QnVmZmVyc1xuY29uc3QgY29uY2F0ID0gKGJ1ZmZlcjEsIGJ1ZmZlcjIpID0+IHtcbiAgICBjb25zdCB0bXAgPSBuZXcgVWludDhBcnJheShidWZmZXIxLmJ5dGVMZW5ndGggKyBidWZmZXIyLmJ5dGVMZW5ndGgpO1xuXG4gICAgdG1wLnNldChuZXcgVWludDhBcnJheShidWZmZXIxKSwgMCk7XG4gICAgdG1wLnNldChuZXcgVWludDhBcnJheShidWZmZXIyKSwgYnVmZmVyMS5ieXRlTGVuZ3RoKTtcblxuICAgIHJldHVybiB0bXAuYnVmZmVyO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgY29uY2F0O1xuIiwiaW1wb3J0IFdhdlBsYXllciBmcm9tICcuL1dhdlBsYXllcic7XG5cbmV4cG9ydCBkZWZhdWx0IFdhdlBsYXllcjtcbm1vZHVsZS5leHBvcnRzID0gV2F2UGxheWVyOyIsImltcG9ydCBjb25jYXQgZnJvbSAnLi9jb25jYXQnO1xuXG4vLyBXcml0ZSBhIHByb3BlciBXQVZFIGhlYWRlciBmb3IgdGhlIGdpdmVuIGJ1ZmZlci5cbmNvbnN0IHdhdmlmeSA9IChkYXRhKSA9PiB7XG4gICAgY29uc3QgaGVhZGVyID0gbmV3IEFycmF5QnVmZmVyKDQ0KTtcblxuICAgIHZhciBkID0gbmV3ICBEYXRhVmlldyhoZWFkZXIpO1xuXG4gICAgZC5zZXRVaW50OCgwLCAnUicuY2hhckNvZGVBdCgwKSk7XG4gICAgZC5zZXRVaW50OCgxLCAnSScuY2hhckNvZGVBdCgwKSk7XG4gICAgZC5zZXRVaW50OCgyLCAnRicuY2hhckNvZGVBdCgwKSk7XG4gICAgZC5zZXRVaW50OCgzLCAnRicuY2hhckNvZGVBdCgwKSk7XG5cbiAgICBkLnNldFVpbnQzMig0LCBkYXRhLmJ5dGVMZW5ndGggLyAyICsgNDQsIHRydWUpO1xuXG4gICAgZC5zZXRVaW50OCg4LCAnVycuY2hhckNvZGVBdCgwKSk7XG4gICAgZC5zZXRVaW50OCg5LCAnQScuY2hhckNvZGVBdCgwKSk7XG4gICAgZC5zZXRVaW50OCgxMCwgJ1YnLmNoYXJDb2RlQXQoMCkpO1xuICAgIGQuc2V0VWludDgoMTEsICdFJy5jaGFyQ29kZUF0KDApKTtcbiAgICBkLnNldFVpbnQ4KDEyLCAnZicuY2hhckNvZGVBdCgwKSk7XG4gICAgZC5zZXRVaW50OCgxMywgJ20nLmNoYXJDb2RlQXQoMCkpO1xuICAgIGQuc2V0VWludDgoMTQsICd0Jy5jaGFyQ29kZUF0KDApKTtcbiAgICBkLnNldFVpbnQ4KDE1LCAnICcuY2hhckNvZGVBdCgwKSk7XG5cbiAgICBkLnNldFVpbnQzMigxNiwgMTYsIHRydWUpO1xuICAgIGQuc2V0VWludDE2KDIwLCAxLCB0cnVlKTtcbiAgICBkLnNldFVpbnQxNigyMiwgMSwgdHJ1ZSk7XG4gICAgZC5zZXRVaW50MzIoMjQsIDExMDI1LCB0cnVlKTtcbiAgICBkLnNldFVpbnQzMigyOCwgMTEwMjUgKiAxICogMik7XG4gICAgZC5zZXRVaW50MTYoMzIsIDEgKiAyKTtcbiAgICBkLnNldFVpbnQxNigzNCwgMTYsIHRydWUpO1xuXG4gICAgZC5zZXRVaW50OCgzNiwgJ2QnLmNoYXJDb2RlQXQoMCkpO1xuICAgIGQuc2V0VWludDgoMzcsICdhJy5jaGFyQ29kZUF0KDApKTtcbiAgICBkLnNldFVpbnQ4KDM4LCAndCcuY2hhckNvZGVBdCgwKSk7XG4gICAgZC5zZXRVaW50OCgzOSwgJ2EnLmNoYXJDb2RlQXQoMCkpO1xuICAgIGQuc2V0VWludDMyKDQwLCBkYXRhLmJ5dGVMZW5ndGgsIHRydWUpO1xuXG4gICAgcmV0dXJuIGNvbmNhdChoZWFkZXIsIGRhdGEpO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgd2F2aWZ5Il19
