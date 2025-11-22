Visora

Break the language barrier through sign language and multilingual communication.

🚀 Overview

Visora is an assistive communication solution designed to make digital interaction inclusive for individuals with hearing or speech disabilities, or for those facing language constraints. The system combines sign language, speech processing, translation, and content summarization to enable seamless multi-modal communication.

🧩 Core Modules
Module	Description
Text → Sign	Converts written text into sign language animations (GIF/video-based).
Sign → Text	Interprets sign language from video input and outputs readable text.
Vernacular Translation	Real-time speech translation across multiple Indian and global languages.
Sign-Based Video Conferencing	Live video calling with sign language support and speech transcription.
Text Summarizer	Compresses lengthy content into concise summaries or structured notes.
🔗 Tech Stack (Adjust if wrong)

Frontend: HTML, CSS, JavaScript (Tailwind optional)

Backend: Node.js, Express.js, Python (for ML/NLP if used)

Realtime: Socket.IO / WebRTC

Extras: Any models, middleware, or sign language asset libraries (GIFs/videos)

📦 Installation & Setup
# 1. Clone repository
git clone <repo-url>
cd visora

# 2. Install server dependencies
npm install                     # (Node dependencies)
pip install -r requirements.txt # (Python dependencies, if applicable)

# 3. Start backend services
npm start            # or node server.js / nodemon
# If multiple servers, start each separately as per module

# 4. Verify ports (important)
# Example:
# 5500 – Live Server (HTML)
# 3000 – Node backend / signaling
# 5000 – Python API (if used)

▶️ Run the Interface

Simply open:

public/LandingPage.html


(Or wherever it's placed. Ensure your servers are running before launching.)

If using VS Code Live Server or similar, make sure it's pointing to the correct folder and no other service already occupies the port.

⚠️ Common Issues

Microphone/Camera permissions blocked: Update browser and Windows privacy settings.

Live server conflict (port in use): Kill conflicting task or switch port.

Sign video not displaying: Check filename format (case-sensitive) and file path accuracy.

Slow detection/playback: Set playback speed (e.g., 2x/4x) and optimize video handling logic.

📚 Future Upgrades

AI-powered sign generation (instead of static GIFs).

Real-time gesture recognition using CV models.

Cross-browser permission handling.

Improved model inference speed.

📝 Contribution

Fork → Feature branch → Pull request. Don’t break existing modules.

📄 License

Add a license. If you don’t, legally nobody can use it.
