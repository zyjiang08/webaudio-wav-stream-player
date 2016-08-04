
import wavify from './wavify';
import concat from './concat';

const Player = () => {
    let hasCanceled_ = false;

    const play = url => {

        let nextTime = 0;

        const audioStack = [];

        hasCanceled_ = false;

        const context = new AudioContext();

        return fetch(url)
            .then((response) => {
                const reader = response.body.getReader();

                // This variable holds a possibly dangling byte.
                var rest = null;

                const read = () => reader.read()
                    .then(({ value, done }) => {
                        if (hasCanceled_) {
                          reader.cancel();
                          context.close();
                          return;
                        }
                        if (value && value.buffer) {
                            let buffer;

                            if (rest !== null) {
                                buffer = concat(rest, value.buffer);
                            } else {
                                buffer = value.buffer;
                            }

                            if (buffer.byteLength % 2 !== 0) {
                                rest = buffer.slice(-2, -1);
                                buffer = buffer.slice(0, -1);
                            } else {
                                rest = null;
                            }

                            context.decodeAudioData(wavify(buffer))
                                .then((audioBuffer) => {
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

                read();
            });

        const scheduleBuffers = () => {
            while (audioStack.length) {
                const source = context.createBufferSource();

                source.buffer = audioStack.shift();

                source.connect(context.destination);

                if (nextTime == 0) {
                    nextTime = context.currentTime + 0.3;  /// add 50ms latency to work well across systems - tune this if you like
                }

                source.start(nextTime);
                source.stop(nextTime + source.buffer.duration);

                nextTime += source.buffer.duration; // Make the next buffer wait the length of the last buffer before being played
            }
        }
        
    }

    return {
      play: url => play(url),
      stop: () => hasCanceled_ = true
    }
}

export default Player;

