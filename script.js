$(document).ready(function() {
let isPlaying = false;
    let bpm = 120;
    let beatsPerMeasure = 4;
    let currentBeat = 0;
    let timerId = null;
    let audioContext = null;
    let tapTimes = [];
    
    updateBeatCounter();
    
    loadSettings();
    
    function initAudio() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
    }
    
    function playClick(accent = false) {
        if (!audioContext) return;
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = 'square';
        oscillator.frequency.value = accent ? 800 : 600;
        
        gainNode.gain.value = accent ? 0.3 : 0.2;
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.05);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.05);
    }
    
    function updateBeatCounter() {
        $('#beatCounter').empty();
        
        for (let i = 0; i < beatsPerMeasure; i++) {
            $('<div>')
                .addClass('beat-dot')
                .appendTo('#beatCounter');
        }
    }
    
    function tick() {
        const isAccent = currentBeat === 0;
        
        playClick(isAccent);
        
        $('#visualIndicator')
            .stop()
            .css('opacity', 1)
            .fadeTo(100, 0);
        
        $('.beat-dot').removeClass('active');
        $('.beat-dot').eq(currentBeat).addClass('active');
        
        currentBeat = (currentBeat + 1) % beatsPerMeasure;
    }
    
    function start() {
        if (isPlaying) return;
        
        initAudio();
        
        isPlaying = true;
        currentBeat = 0;
        
        const interval = 60000 / bpm;
        
        timerId = setInterval(tick, interval);
        
        $('#startStopBtn').text('Стоп');
    }
    
    function stop() {
        if (!isPlaying) return;
        
        clearInterval(timerId);
        isPlaying = false;
        currentBeat = 0;
        
        $('#startStopBtn').text('Start');
        
        $('.beat-dot').removeClass('active');
    }

    function toggle() {
        if (isPlaying) {
            stop();
        } else {
            start();
        }
    }
    
    function updateBPM(newBPM) {
        bpm = Math.max(40, Math.min(200, newBPM));
        
        $('#bpmValue').text(bpm);
        $('#bpmSlider').val(bpm);
        
        if (isPlaying) {
            clearInterval(timerId);
            const interval = 60000 / bpm;
            timerId = setInterval(tick, interval);
        }
        
        saveSettings();
    }

    function handleTapTempo() {
        const now = Date.now();
        
        tapTimes = tapTimes.filter(time => now - time < 2000);
        tapTimes.push(now);

        if (tapTimes.length >= 2) {
            let totalInterval = 0;
            for (let i = 1; i < tapTimes.length; i++) {
                totalInterval += tapTimes[i] - tapTimes[i-1];
            }
            const avgInterval = totalInterval / (tapTimes.length - 1);
            
            const calculatedBPM = Math.round(60000 / avgInterval);
        
            updateBPM(calculatedBPM);
        }
        
        $('#tapTempo').css('background-color', '#3e8e41');
        setTimeout(() => {
            $('#tapTempo').css('background-color', '');
        }, 100);
    }
    
    function saveSettings() {
        const settings = {
            bpm: bpm,
            beatsPerMeasure: beatsPerMeasure
        };
        localStorage.setItem('metronomeSettings', JSON.stringify(settings));
    }
    
    function loadSettings() {
        const saved = localStorage.getItem('metronomeSettings');
        if (saved) {
            try {
                const settings = JSON.parse(saved);
                
                if (settings.bpm) {
                    updateBPM(settings.bpm);
                }
                
                if (settings.beatsPerMeasure) {
                    beatsPerMeasure = settings.beatsPerMeasure;
                    $(`.time-btn[data-beats="${beatsPerMeasure}"]`).click();
                }
            } catch (e) {
                console.log('Could not load saved settings');
            }
        }
    }

    $('#startStopBtn').click(toggle);
    
    $('#bpmSlider').on('input', function() {
        updateBPM(parseInt($(this).val()));
    });
    
    $('#bpmMinus').click(() => updateBPM(bpm - 5));
    $('#bpmMinus1').click(() => updateBPM(bpm - 1));
    $('#bpmPlus1').click(() => updateBPM(bpm + 1));
    $('#bpmPlus').click(() => updateBPM(bpm + 5));

    $('.time-btn').click(function() {
        $('.time-btn').removeClass('active');
        $(this).addClass('active');
        
        beatsPerMeasure = parseInt($(this).data('beats'));
        updateBeatCounter();
        
        if (isPlaying) {
            clearInterval(timerId);
            const interval = 60000 / bpm;
            timerId = setInterval(tick, interval);
        }
        
        saveSettings();
    });
    
    $('#tapTempo').click(handleTapTempo);
    
    $(document).keydown(function(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        switch(e.code) {
            case 'Space':
                e.preventDefault();
                toggle();
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                if (e.shiftKey) {
                    updateBPM(bpm + 1);
                } else {
                    updateBPM(bpm + 5);
                }
                break;
                
            case 'ArrowDown':
                e.preventDefault();
                if (e.shiftKey) {
                    updateBPM(bpm - 1);
                } else {
                    updateBPM(bpm - 5);
                }
                break;
                
            case 'KeyT':
                e.preventDefault();
                handleTapTempo();
                break;
        }
    });
});