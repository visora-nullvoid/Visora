const startBtn = document.getElementById('startBtn');
const originalText = document.getElementById('originalText');
const translatedText = document.getElementById('translatedText');
const sourceLangSelect = document.getElementById('source_lang');
const targetLangSelect = document.getElementById('target_lang');
const visualizerCanvas = document.getElementById('visualizer');
const vctx = visualizerCanvas.getContext('2d');
const summarizeContainer = document.getElementById('summarize-container');
const summaryBoxes = document.getElementById('summary-container');

let recognition, listening = false;
let audioCtx, analyser, dataArray;

// Toast message
function showToast(msg) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 1500);
}

// Copy + Speak setup with better accent voices
// Copy and Speak with soft voice
function setupActions(box){
    const copyBtn = box.querySelector('.copy-icon');
    const listenBtn = box.querySelector('.listen-icon');
    const textDiv = box.querySelector('div:last-child');

    // Copy
    copyBtn.onclick = () => {
        navigator.clipboard.writeText(textDiv.textContent);
        showToast('Copied!');
    };

    // Speak with regional accent & soft tone
    listenBtn.onclick = () => {
        const text = textDiv.textContent.trim();
        if(!text) return;

        const utter = new SpeechSynthesisUtterance(text);
        const voices = speechSynthesis.getVoices();

        let lang = "en";
        if(box.id === "original-box") lang = sourceLangSelect.value;
        else lang = targetLangSelect.value;

        // Select best accent-matched voice
        let voice = voices.find(v => v.lang.toLowerCase().startsWith(lang.toLowerCase()));
        if(voice) utter.voice = voice;

        utter.rate = 0.95;   // slightly slower = calmer
        utter.pitch = 0.85;  // deeper = softer tone
        utter.volume = 0.9;  // not too loud
        speechSynthesis.speak(utter);
        showToast("Speaking softly...");
    };
}


setupActions(document.getElementById('original-box'));
setupActions(document.getElementById('translated-box'));

// === Speech Recognition ===
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onresult = e => {
    let text = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      text += e.results[i][0].transcript + ' ';
    }

    if (text.trim() !== '') {
      originalText.textContent = text;
      fetch('/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          source_lang: sourceLangSelect.value,
          target_lang: targetLangSelect.value
        })
      })
        .then(res => res.json())
        .then(data => {
          translatedText.textContent = data.translated_text || "";
        })
        .catch(() => showToast("Translation failed"));
    }
  };

  recognition.onend = () => {
    listening = false;
    startBtn.classList.remove('listening');
    showSummarizeButton();
  };
} else {
  alert("Speech Recognition not supported");
}

// === Start / Stop Speech ===
startBtn.onclick = async () => {
  if (!recognition) return;
  if (!listening) {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    startVisualizer(stream);
    recognition.lang = sourceLangSelect.value;
    recognition.start();
    listening = true;
    startBtn.classList.add('listening');
    summarizeContainer.innerHTML = "";
  } else {
    recognition.stop();
    stopVisualizer();
  }
};

// === Summarization ===
function showSummarizeButton() {
  summarizeContainer.innerHTML = `<button id="summarizeBtn">📝 Summarize</button>`;
  const btn = document.getElementById('summarizeBtn');
  btn.onclick = () => {
    fetch('/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: translatedText.textContent })
    })
      .then(res => res.json())
      .then(data => {
        addSummaryBox(data.summary_text);
      });
    btn.disabled = true;
  };
}

function addSummaryBox(text) {
  const div = document.createElement('div');
  div.classList.add('text-box');
  div.innerHTML = `
        <div class="text-actions">
            <span class="icon copy-icon" title="Copy"></span>
            <span class="icon listen-icon" title="Listen"></span>
        </div>
        <h3>Summary</h3>
        <div>${text}</div>
    `;
  summaryBoxes.appendChild(div);
  setupActions(div);
}

// === Audio Visualizer ===
function startVisualizer(stream) {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioCtx.createAnalyser();
  const source = audioCtx.createMediaStreamSource(stream);
  source.connect(analyser);
  analyser.fftSize = 256;
  dataArray = new Uint8Array(analyser.frequencyBinCount);
  drawVisualizer();
}

function drawVisualizer() {
  if (!analyser) return;
  requestAnimationFrame(drawVisualizer);
  analyser.getByteFrequencyData(dataArray);
  vctx.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);
  let barWidth = (visualizerCanvas.width / dataArray.length) * 2.5;
  let x = 0;
  for (let i = 0; i < dataArray.length; i++) {
    let barHeight = dataArray[i] / 2;
    vctx.fillStyle = `rgb(${barHeight + 100}, 50, 255)`;
    vctx.fillRect(x, visualizerCanvas.height - barHeight, barWidth, barHeight);
    x += barWidth + 1;
  }
}

function stopVisualizer() {
  if (audioCtx) audioCtx.close();
  analyser = null;
  vctx.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);
}

// === Starfield Background ===
const bgCanvas = document.getElementById('background');
const bgCtx = bgCanvas.getContext('2d');
bgCanvas.width = window.innerWidth;
bgCanvas.height = window.innerHeight;

const stars = Array.from({ length: 150 }, () => ({
  x: Math.random() * bgCanvas.width,
  y: Math.random() * bgCanvas.height,
  r: Math.random() * 1.5 + 0.3,
  o: Math.random(),
  s: Math.random() * 0.02 + 0.005
}));

function drawStars() {
  bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
  stars.forEach(star => {
    star.o += star.s;
    bgCtx.beginPath();
    bgCtx.arc(star.x, star.y, star.r, 0, 2 * Math.PI);
    bgCtx.fillStyle = `rgba(255, 255, 255, ${0.5 + 0.5 * Math.sin(star.o)})`;
    bgCtx.fill();
  });
  requestAnimationFrame(drawStars);
}
drawStars();

window.addEventListener("resize", () => {
  bgCanvas.width = window.innerWidth;
  bgCanvas.height = window.innerHeight;
});
