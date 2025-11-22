const inputText = document.getElementById('inputText');
const fileInput = document.getElementById('fileInput');
const summarizeBtn = document.getElementById('summarizeBtn');
const summaryContainer = document.getElementById('summaryContainer');
const fileStatus = document.getElementById('fileStatus');

// -------------------- Toast --------------------
function showToast(msg){
    const toast=document.createElement('div');
    toast.className='toast';
    toast.textContent=msg;
    document.body.appendChild(toast);
    setTimeout(()=>toast.remove(),1500);
}

// -------------------- Summary Box --------------------
function createSummaryBox(text){
    const div = document.createElement('div');
    div.classList.add('text-box');
    div.innerHTML = `
        <h3>Summary</h3>
        <div class="summary-text">${text}</div>
        <div class="text-actions">
            <button class="copy-btn">📋 Copy</button>
            <button class="listen-btn">🔊 Listen</button>
        </div>
    `;
    summaryContainer.appendChild(div);

    const copyBtn = div.querySelector('.copy-btn');
    const listenBtn = div.querySelector('.listen-btn');
    const textDiv = div.querySelector('.summary-text');

    copyBtn.onclick = () => {
        navigator.clipboard.writeText(textDiv.textContent).then(()=>showToast('Copied!'));
    };
    listenBtn.onclick = () => {
        const utter = new SpeechSynthesisUtterance(textDiv.textContent);
        speechSynthesis.speak(utter);
        showToast('Speaking...');
    };
}

// -------------------- Better Extractive Summarizer --------------------
function extractiveSummarize(text, wordLimit=80){
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const freq = {};
    const stopwords = ["the","and","of","to","in","a","is","it","for","on","with","as","by","at","this","that","from","or","an","be","are","but"];
    text.toLowerCase().replace(/[^a-z\s]/g,'').split(/\s+/).forEach(word=>{
        if(!stopwords.includes(word) && word.length>2) freq[word]=(freq[word]||0)+1;
    });

    const scored = sentences.map(s=>{
        let score=0;
        s.toLowerCase().split(/\s+/).forEach(w=>{ if(freq[w]) score+=freq[w]; });
        return {sentence:s, score};
    });

    scored.sort((a,b)=>b.score-a.score);

    // Take top sentences until word limit
    const summarySentences=[];
    let totalWords=0;
    for(const s of scored){
        const words = s.sentence.split(/\s+/).length;
        if(totalWords + words <= wordLimit){ summarySentences.push(s.sentence.trim()); totalWords+=words; }
        if(totalWords >= wordLimit) break;
    }

    return summarySentences.join(' ') || text;
}

// -------------------- Summarize Button --------------------
summarizeBtn.onclick = () => {
    const text = inputText.value.trim();
    if(!text){ showToast('Enter text or upload file first'); return; }
    let wordCount = prompt("How many words should the summary be?", "80");
    if(!wordCount || isNaN(wordCount)) wordCount=80; else wordCount=parseInt(wordCount);
    const summary = extractiveSummarize(text, wordCount);
    createSummaryBox(summary);
};

// -------------------- File Upload --------------------
fileInput.addEventListener('change', async (e)=>{
    const file = e.target.files[0];
    if(!file) return;
    fileStatus.textContent='Loading...';
    const ext = file.name.split('.').pop().toLowerCase();
    try{
        if(ext==='pdf'){
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({data: arrayBuffer}).promise;
            let fullText='';
            for(let i=1;i<=pdf.numPages;i++){
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                fullText += textContent.items.map(item=>item.str).join(' ')+' ';
            }
            inputText.value = fullText;
        } else if(ext==='docx' || ext==='doc'){
            const reader = new FileReader();
            reader.onload = function(event){
                const arrayBuffer = event.target.result;
                mammoth.extractRawText({arrayBuffer}).then(result=>{
                    inputText.value=result.value;
                });
            }
            reader.readAsArrayBuffer(file);
        } else { showToast('Unsupported file'); }
        fileStatus.textContent='File loaded';
    } catch(err){
        console.error(err);
        showToast('Failed to read file');
        fileStatus.textContent='';
    }
});

// -------------------- Thunder Background --------------------
// const canvas=document.getElementById('background');
// const ctx=canvas.getContext('2d');
// canvas.width=window.innerWidth; canvas.height=window.innerHeight;
// const particles=[], streaks=[];
// class Particle{constructor(){this.reset();}reset(){this.x=Math.random()*canvas.width;this.y=Math.random()*canvas.height;this.vx=(Math.random()-0.5)*1.5;this.vy=(Math.random()-0.5)*1.5;this.size=Math.random()*2+1;this.alpha=Math.random()*0.7+0.3;}update(){this.x+=this.vx; this.y+=this.vy;if(this.x<0||this.x>canvas.width||this.y<0||this.y>canvas.height)this.reset();}draw(){ctx.fillStyle=`rgba(0,255,255,${this.alpha})`;ctx.beginPath();ctx.arc(this.x,this.y,this.size,0,Math.PI*2);ctx.fill();}}
// class Streak{constructor(){this.reset();}reset(){this.x=Math.random()*canvas.width;this.y=Math.random()*canvas.height;this.length=Math.random()*100+50;this.vx=(Math.random()-0.5)*10;this.vy=Math.random()*8+4;this.alpha=Math.random()*0.5+0.5;this.color=`rgba(0,${Math.random()*255},255,${this.alpha})`; }update(){this.x+=this.vx; this.y+=this.vy; if(this.y>canvas.height) this.reset(); }draw(){ctx.strokeStyle=this.color;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(this.x,this.y);ctx.lineTo(this.x+this.vx*3,this.y-this.length);ctx.stroke();} }
// for(let i=0;i<250;i++)particles.push(new Particle());
// for(let i=0;i<60;i++)streaks.push(new Streak());
// function drawThunder(){ctx.fillStyle='rgba(11,12,16,0.2)';ctx.fillRect(0,0,canvas.width,canvas.height);particles.forEach(p=>{p.update();p.draw();});streaks.forEach(s=>{s.update();s.draw();});if(Math.random()<0.015){ctx.fillStyle='rgba(255,255,255,0.15)';ctx.fillRect(0,0,canvas.width,canvas.height);}requestAnimationFrame(drawThunder);}
// drawThunder();
// window.addEventListener('resize',()=>{canvas.width=window.innerWidth;canvas.height=window.innerHeight;});
