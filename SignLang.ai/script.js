// Cursor glow
const cursorGlow = document.createElement('div');
cursorGlow.classList.add('cursor-glow');
document.body.appendChild(cursorGlow);
document.addEventListener('mousemove', e => {
  cursorGlow.style.left = `${e.clientX}px`;
  cursorGlow.style.top = `${e.clientY}px`;
});

// UI Elements
const stopButton = document.getElementById('stop-button');
const videoDisplay = document.getElementById('video-display');
const loopButton = document.getElementById('loop-button');
const textInput = document.getElementById('text-input');
const translateButton = document.getElementById('translate-button');
const voiceToggleButton = document.getElementById('voice-toggle-button');
const voiceStatus = document.getElementById('voice-status');

let recognition;
let isListening = false;
let isTranslating = false;
let isPaused = false;
let currentIndex = 0;
let sequence = [];
let isLooping = false;

const videoElement = videoDisplay.querySelector('video');
const placeholderText = videoDisplay.querySelector('p');

// ------------------------
// Textarea expand on focus
// ------------------------
textInput.addEventListener('focus', () => {
  textInput.classList.add('expanded');
  textInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

textInput.addEventListener('blur', () => {
  textInput.classList.remove('expanded');
});
async function ensureMicPermission() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    voiceStatus.textContent = 'Mic not supported in this browser.';
    console.error('navigator.mediaDevices.getUserMedia not available');
    return false;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // we don't actually need the audio stream, just the permission
    stream.getTracks().forEach(t => t.stop());
    console.log('Microphone permission granted');
    return true;
  } catch (err) {
    console.error('Microphone permission error:', err);
    voiceStatus.textContent = `Mic blocked or denied: ${err.name}`;
    return false;
  }
}

// ------------------------
// Loop toggle
// ------------------------
// loopButton.addEventListener('click', () => {
//   isLooping = !isLooping;
//   loopButton.textContent = isLooping ? 'Stop Loop' : 'Loop Avatar';
// });

// ------------------------
// Stop translation
// ------------------------
stopButton.addEventListener('click', () => {
  if (!isTranslating) return;
  videoElement.pause();
  videoElement.src = '';
  isPaused = false;
  isTranslating = false;
  currentIndex = 0;
  isLooping = false;
  sequence = [];
  placeholderText.style.display = 'flex';
  translateButton.textContent = 'Translate';
  translateButton.disabled = false;
  loopButton.textContent = 'Loop Avatar';
});

// ------------------------
// Speech recognition (English only)
// ------------------------
if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.continuous = false;
  recognition.interimResults = true;

  recognition.onstart = () => {
    isListening = true;
    voiceToggleButton.innerText = '🛑';
    voiceToggleButton.classList.add('listening');
    voiceStatus.textContent = 'Listening...';
    textInput.readOnly = true;
    translateButton.disabled = true;
  };

  recognition.onresult = event => {
    let transcript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    textInput.value = transcript.trim();
    startTranslation();
    stopListening();
  };

  recognition.onerror = e => {
    voiceStatus.textContent = `Error: ${e.error}`;
    stopListening();
  };

  recognition.onend = () => {
    stopListening();
  };

  voiceToggleButton.addEventListener('click', async () => {
    // If already listening → stop
    if (isListening) {
      recognition.stop();
      return;
    }

    // First, ask for mic permission using getUserMedia
    const ok = await ensureMicPermission();
    if (!ok) {
      voiceStatus.textContent =
        'Mic blocked. Click the lock icon in the address bar → Site settings → Microphone → Allow for this site.';
      return;
    }

    // If permission granted → start recognition
    try {
      recognition.start();
    } catch (err) {
      console.error('SpeechRecognition start error:', err);
      voiceStatus.textContent = `Speech recognition error: ${err.name}`;
    }
  });

} else {
  voiceStatus.textContent = 'Voice recognition not supported.';
  voiceToggleButton.disabled = true;
}

// ------------------------
// Stop listening
// ------------------------
function stopListening() {
  isListening = false;
  voiceToggleButton.innerText = '🎤';
  voiceToggleButton.classList.remove('listening');
  voiceStatus.textContent = 'Stopped listening. You can edit text and translate.';
  textInput.readOnly = false;
  translateButton.disabled = false;
}

// ------------------------
// Translate button
// ------------------------
translateButton.addEventListener('click', () => startTranslation());

// ------------------------
// Start translation / playback
// ------------------------
async function startTranslation() {
  let text = textInput.value.trim();
  if (!text) {
    placeholderText.textContent = 'Please enter some text first.';
    placeholderText.style.display = 'flex';
    return;
  }

  isTranslating = true;
  isPaused = false;
  currentIndex = 0;
  translateButton.disabled = true;
  translateButton.textContent = 'Translating...';

  sequence = await prepareSequence(text);
  if (!sequence.length) {
    placeholderText.textContent = 'No matching videos found.';
    placeholderText.style.display = 'flex';
    translateButton.disabled = false;
    translateButton.textContent = 'Translate';
    isTranslating = false;
    return;
  }

  await playSequence(0);
}

// ------------------------
// Check if video file exists
// ------------------------
function checkVideoExists(path) {
  return new Promise(resolve => {
    const xhr = new XMLHttpRequest();
    xhr.open('HEAD', path, true);
    xhr.onload = () => resolve(xhr.status !== 404);
    xhr.onerror = () => resolve(false);
    xhr.send();
  });
}

// ------------------------
// Get video path for word or letter
// ------------------------
async function getVideoPath(name) {
  if (!name) return null;
  const formats = ['.mp4', '.webm'];
  for (const ext of formats) {
    const path = `videos/${name.toLowerCase()}${ext}`;
    if (await checkVideoExists(path)) return path;
  }
  return null;
}

// ------------------------
// Prepare video sequence
// ------------------------
async function prepareSequence(text) {
  const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
  const seq = [];
  for (const word of words) {
    if (!word) continue;
    const path = await getVideoPath(word);
    if (path) seq.push(path);
    else {
      for (const letter of word.toUpperCase()) {
        const letterPath = await getVideoPath(letter);
        if (letterPath) seq.push(letterPath);
      }
    }
  }
  return seq;
}

// ------------------------
// Play video sequence
// ------------------------
async function playSequence(startIndex = 0) {
  placeholderText.style.display = 'none';
  translateButton.disabled = true;

  for (let i = startIndex; i < sequence.length; i++) {
    if (isPaused) {
      currentIndex = i;
      translateButton.disabled = false;
      translateButton.textContent = 'Resume';
      return;
    }
    currentIndex = i;
    videoElement.src = sequence[i];
    videoElement.loop = isLooping;
    try { await videoElement.play(); } catch (e) { console.error(e); continue; }
    await new Promise(resolve => {
      const onEnd = () => {
        videoElement.removeEventListener('ended', onEnd);
        if (!isLooping) resolve(true);
      };
      if (!isLooping) videoElement.addEventListener('ended', onEnd);
      if (isLooping) resolve(true);
    });
  }

  videoElement.pause();
  videoElement.src = '';
  placeholderText.style.display = 'flex';
  isTranslating = false;
  sequence = [];
  currentIndex = 0;
  translateButton.textContent = 'Translate';
  translateButton.disabled = false;
}

// ------------------------
// Ctrl+Enter triggers translation
// ------------------------
textInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    startTranslation();
  }
});


textInput.addEventListener("focus", () => {
  setTimeout(() => {
    window.scrollTo({
      top: textInput.getBoundingClientRect().top + window.scrollY - 280,
      behavior: "smooth"
    });
  }, 200);
});

