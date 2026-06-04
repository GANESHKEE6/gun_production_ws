// A.R.M.S. Weapon Platform Application Logic

// 1. WEAPON OPTIONS DATABASE
const weaponOptions = {
    rifle: {
        calibers: ["5.56x45mm NATO", ".300 AAC Blackout", "7.62x51mm NATO", "12 Gauge Buckshot"],
        barrels: ["Short Barrel (10.5 in)", "Standard Barrel (14.5 in)", "Long Barrel (18.0 in)"],
        stocks: ["Tactical Stock", "Folding Stock", "Heavy Stock"],
        optics: ["Iron Sights", "Red Dot Sight", "ACOG Scope (4x)"],
        ammo: ["5.56mm FMJ", "5.56mm Armor Piercing", ".300 Blackout Subsonic"]
    },
    sniper: {
        calibers: [".338 Lapua Magnum", "7.62x51mm NATO", "5.56x45mm NATO", "12 Gauge Slug"],
        barrels: ["Short Precision Barrel (20.0 in)", "Standard Precision Barrel (24.0 in)", "Heavy Match Barrel (27.0 in)"],
        stocks: ["Heavy Sniper Stock", "Tactical Folding Stock", "Classic Wood Stock"],
        optics: ["ACOG Scope (4x)", "Sniper Scope (12x-24x)", "Thermal Sniper Scope"],
        ammo: [".338 Lapua FMJ", ".338 Lapua Armor Piercing", "7.62mm Match Load"]
    },
    shotgun: {
        calibers: ["12 Gauge Buckshot", "12 Gauge Slug", "5.56x45mm NATO"],
        barrels: ["Short Breacher Barrel (14.0 in)", "Standard Tactical Barrel (18.5 in)", "Long Hunting Barrel (28.0 in)"],
        stocks: ["Tactical Stock", "Folding Stock", "Classic Wood Stock"],
        optics: ["Bead Sight", "Red Dot Sight", "ACOG Scope (4x)"],
        ammo: ["12 Gauge 00 Buckshot", "12 Gauge Sabot Slug", "12 Gauge Dragon's Breath"]
    },
    machine_gun: {
        calibers: ["7.62x51mm NATO", "5.56x45mm NATO", ".338 Lapua Magnum"],
        barrels: ["Short Para Barrel (16.0 in)", "Standard LMG Barrel (20.0 in)", "Heavy Fluted Barrel (24.0 in)"],
        stocks: ["Heavy Tactical Stock", "Para Folding Stock", "Mounted Spade Grips"],
        optics: ["Iron Sights", "Red Dot Sight", "ACOG Scope (4x)"],
        ammo: ["7.62mm FMJ Belt", "7.62mm AP Belt", "7.62mm Tracer Belt"]
    },
    gatling_gun: {
        calibers: ["7.62x51mm NATO", "12 Gauge Buckshot", "20mm Vulcan Cannon"],
        barrels: ["Short Micro-Barrels (18.0 in)", "Standard Rotary Barrels (22.0 in)", "Heavy Enclosed Barrels (26.0 in)"],
        stocks: ["Dual Spade Grips", "Heavy Turret Mount", "Tactical Carrying Harness"],
        optics: ["Ring Sights", "Holographic Sight", "No Sights (Tracer Guided)"],
        ammo: ["7.62mm Linkless Chute", "7.62mm AP Belt", "7.62mm Tracer Stream"]
    }
};

// State Variables
let currentGunType = null;
let currentSpecs = null;
let assemblyData = null;
let ballisticsData = null;
let audioContext = null;

// Web Audio API Sound Synthesizer
function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
}

function playSound(type) {
    initAudio();
    if (!audioContext) return;

    const now = audioContext.currentTime;

    if (type === 'click') {
        // High frequency click + decay
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);

        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.05);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.start(now);
        osc.stop(now + 0.06);
    } 
    else if (type === 'lock') {
        // Metallic double lock click
        const osc1 = audioContext.createOscillator();
        const osc2 = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(audioContext.destination);

        osc1.frequency.setValueAtTime(800, now);
        osc1.frequency.exponentialRampToValueAtTime(200, now + 0.1);
        osc2.frequency.setValueAtTime(400, now);
        osc2.frequency.exponentialRampToValueAtTime(100, now + 0.1);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.setValueAtTime(0.2, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.12);
        osc2.stop(now + 0.12);
    } 
    else if (type === 'fire_rifle') {
        // White noise blast + oscillator thump
        const bufferSize = audioContext.sampleRate * 0.15;
        const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noiseNode = audioContext.createBufferSource();
        noiseNode.buffer = buffer;

        const filter = audioContext.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(600, now);
        filter.frequency.exponentialRampToValueAtTime(100, now + 0.1);

        const gainNode = audioContext.createGain();
        gainNode.gain.setValueAtTime(0.8, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        noiseNode.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Low frequency thump
        const osc = audioContext.createOscillator();
        const oscGain = audioContext.createGain();
        osc.connect(oscGain);
        oscGain.connect(audioContext.destination);

        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);
        oscGain.gain.setValueAtTime(0.5, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        noiseNode.start(now);
        osc.start(now);
        noiseNode.stop(now + 0.15);
        osc.stop(now + 0.15);
    }
    else if (type === 'fire_sniper') {
        // Deep low frequency punch + long noise reverb tail
        const bufferSize = audioContext.sampleRate * 0.4;
        const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noiseNode = audioContext.createBufferSource();
        noiseNode.buffer = buffer;

        const filter = audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(500, now);
        filter.frequency.exponentialRampToValueAtTime(80, now + 0.2);

        const gainNode = audioContext.createGain();
        gainNode.gain.setValueAtTime(1.0, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        noiseNode.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioContext.destination);

        const osc = audioContext.createOscillator();
        const oscGain = audioContext.createGain();
        osc.connect(oscGain);
        oscGain.connect(audioContext.destination);

        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.15);
        oscGain.gain.setValueAtTime(0.8, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        noiseNode.start(now);
        osc.start(now);
        noiseNode.stop(now + 0.4);
        osc.stop(now + 0.2);
    }
    else if (type === 'fire_shotgun') {
        // Double punch representing buckshot blast
        const bufferSize = audioContext.sampleRate * 0.25;
        const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noiseNode = audioContext.createBufferSource();
        noiseNode.buffer = buffer;

        const filter = audioContext.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(400, now);
        filter.frequency.exponentialRampToValueAtTime(80, now + 0.15);

        const gainNode = audioContext.createGain();
        gainNode.gain.setValueAtTime(0.9, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        noiseNode.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioContext.destination);

        const osc = audioContext.createOscillator();
        const oscGain = audioContext.createGain();
        osc.connect(oscGain);
        oscGain.connect(audioContext.destination);

        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.12);
        oscGain.gain.setValueAtTime(0.7, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        noiseNode.start(now);
        osc.start(now);
        noiseNode.stop(now + 0.25);
        osc.stop(now + 0.15);
    }
    else if (type === 'fire_gatling') {
        // Fast, punchy thump with metallic motor feedback
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);

        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.05);

        gain.gain.setValueAtTime(0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

        osc.start(now);
        osc.stop(now + 0.07);
    }
}

// 2. VIEW NAVIGATION
function switchTab(tabId) {
    playSound('click');
    document.querySelectorAll('.hud-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    document.getElementById(`tab-${tabId}`).classList.add('active');
    document.getElementById(`content-${tabId}`).classList.add('active');

    // Trigger canvas size adjustment or reload when moving to Shooting Range
    if (tabId === 'range') {
        setTimeout(initShootingRange, 100);
    }
}

// 3. GUN TYPE SELECTION
function selectGunType(type) {
    playSound('click');
    currentGunType = type;
    
    // Select styling
    document.querySelectorAll('.gun-card').forEach(c => c.classList.remove('selected'));
    document.getElementById(`card-${type}`).classList.add('selected');

    // Unlock specifications panel
    const customPanel = document.getElementById('customization-panel');
    customPanel.classList.remove('locked');

    // Populate dropdowns
    populateDropdowns(type);
    
    // Render initial blueprint
    updateBlueprint();

    // Log action to control center
    logAgentTransmission("System", `Loaded design schema modules for: ${type.toUpperCase()}. Select specs and validate build.`, "info");
    updateBriefingText(`Architect Agent loaded. Ready to parse structural RAG manuals for ${type.replace('_',' ')}. Make your component selections and trigger the blueprint validation.`);
}

function populateDropdowns(type) {
    const specs = weaponOptions[type];
    
    populateSelect("spec-caliber", specs.calibers);
    populateSelect("spec-barrel", specs.barrels);
    populateSelect("spec-stock", specs.stocks);
    populateSelect("spec-optics", specs.optics);
}

function populateSelect(id, items) {
    const selectEl = document.getElementById(id);
    selectEl.innerHTML = "";
    items.forEach(item => {
        const opt = document.createElement("option");
        opt.value = item;
        opt.textContent = item;
        selectEl.appendChild(opt);
    });
}

// 4. VECTOR SVG WEAPON COMPONENT RENDERER
// Generates stylized blueprint outlines in SVG
function getWeaponSVGPaths(type, caliber, barrel, stock, optics, isExploded = false) {
    let barrelOffset = isExploded ? 60 : 0;
    let stockOffset = isExploded ? -60 : 0;
    let opticsOffset = isExploded ? -40 : 0;
    let magOffset = isExploded ? 40 : 0;
    let handguardOffset = isExploded ? 50 : 0;
    let accessoryOffset = isExploded ? 70 : 0;

    let strokeColor = "url(#blueprint-neon-glow)";
    let strokeWidth = "2";
    
    let barrelLen = 140; // Default
    if (barrel.includes("Short")) barrelLen = 90;
    if (barrel.includes("Long") || barrel.includes("Precision") || barrel.includes("Match") || barrel.includes("Enclosed")) barrelLen = 190;

    let paths = [];

    // --- RECEIVER (Base component, at center X: 350, Y: 150) ---
    let receiverColor = "#4a5568";
    let receiverPath = "";
    if (type === 'rifle') {
        receiverPath = `<path d="M 280,130 L 400,130 L 400,170 L 320,170 L 310,190 L 290,190 L 290,160 L 280,160 Z" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" />
                        <path d="M 320,170 L 350,170 L 350,185 L 340,185 Z" fill="none" stroke="${strokeColor}" stroke-width="1.5" />`; // Trigger guard
    } else if (type === 'sniper') {
        receiverPath = `<path d="M 270,130 L 410,130 L 410,165 L 290,165 L 290,190 L 270,190 Z" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" />
                        <path d="M 330,130 L 330,115 L 355,115" fill="none" stroke="${strokeColor}" stroke-width="2" />
                        <circle cx="355" cy="115" r="4" fill="none" stroke="${strokeColor}" stroke-width="1.5" />`; // Bolt action lever
    } else if (type === 'shotgun') {
        receiverPath = `<path d="M 280,130 L 390,130 L 390,170 L 290,170 L 290,190 L 280,190 Z" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" />`;
    } else if (type === 'machine_gun') {
        receiverPath = `<path d="M 270,120 L 410,120 L 410,175 L 310,175 L 300,195 L 280,195 L 280,160 L 270,160 Z" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" />
                        <rect x="360" y="110" width="30" height="10" fill="none" stroke="${strokeColor}" stroke-width="1.5" />`; // Feed cover box
    } else if (type === 'gatling_gun') {
        receiverPath = `<path d="M 270,110 L 390,110 L 390,190 L 270,190 Z" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" />
                        <rect x="320" y="90" width="50" height="20" fill="none" stroke="${strokeColor}" stroke-width="1.5" />
                        <circle cx="330" cy="150" r="15" fill="none" stroke="${strokeColor}" stroke-width="1.5" />`; // Rotor circles
    }

    paths.push({ id: "receiver", svg: receiverPath, label: "Receiver Core" });

    // --- BARREL (Attaches to front of receiver, extends right) ---
    let barrelPath = "";
    let bStartX = 400;
    if (type === 'gatling_gun') bStartX = 390;
    else if (type === 'shotgun') bStartX = 390;
    else if (type === 'sniper') bStartX = 410;

    let bStartY = 140;
    if (type === 'gatling_gun') {
        // Six barrel lines
        barrelPath = `<line x1="${bStartX + barrelOffset}" y1="120" x2="${bStartX + barrelLen + barrelOffset}" y2="120" stroke="${strokeColor}" stroke-width="1.5" />
                      <line x1="${bStartX + barrelOffset}" y1="130" x2="${bStartX + barrelLen + barrelOffset}" y2="130" stroke="${strokeColor}" stroke-width="1.5" />
                      <line x1="${bStartX + barrelOffset}" y1="140" x2="${bStartX + barrelLen + barrelOffset}" y2="140" stroke="${strokeColor}" stroke-width="2" />
                      <line x1="${bStartX + barrelOffset}" y1="150" x2="${bStartX + barrelLen + barrelOffset}" y2="150" stroke="${strokeColor}" stroke-width="2" />
                      <line x1="${bStartX + barrelOffset}" y1="160" x2="${bStartX + barrelLen + barrelOffset}" y2="160" stroke="${strokeColor}" stroke-width="1.5" />
                      <line x1="${bStartX + barrelOffset}" y1="170" x2="${bStartX + barrelLen + barrelOffset}" y2="170" stroke="${strokeColor}" stroke-width="1.5" />
                      <!-- Clamp plates -->
                      <rect x="${bStartX + barrelLen/2 + barrelOffset - 3}" y="115" width="6" height="60" fill="none" stroke="${strokeColor}" stroke-width="1.5" />
                      <rect x="${bStartX + barrelLen + barrelOffset - 6}" y="115" width="6" height="60" fill="none" stroke="${strokeColor}" stroke-width="1.5" />`;
    } else {
        barrelPath = `<rect x="${bStartX + barrelOffset}" y="${bStartY - 5}" width="${barrelLen}" height="10" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" />
                      <rect x="${bStartX + barrelLen + barrelOffset}" y="${bStartY - 7}" width="12" height="14" fill="none" stroke="${strokeColor}" stroke-width="1.5" />`; // Muzzle brake
    }

    paths.push({ id: "barrel", svg: barrelPath, label: "Precision Barrel" });

    // --- STOCK (Attaches to rear of receiver, extends left) ---
    let stockPath = "";
    let stockType = stock.toLowerCase();
    if (stockType.includes("tactical")) {
        stockPath = `<path d="M 280,140 L 220,140 L 220,135 L 160,135 L 150,150 L 150,195 L 170,195 L 195,155 L 280,155 Z" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" transform="translate(${stockOffset}, 0)" />`;
    } else if (stockType.includes("folding")) {
        stockPath = `<path d="M 280,140 Q 200,140 180,150 Q 170,170 170,190 M 230,140 L 230,170" fill="none" stroke="${strokeColor}" stroke-width="1.5" transform="translate(${stockOffset}, 0)" />
                     <rect x="${280 + stockOffset - 10}" y="135" width="10" height="25" fill="none" stroke="${strokeColor}" stroke-width="2" />`; // folding hinge
    } else if (stockType.includes("heavy") || stockType.includes("wood")) {
        stockPath = `<path d="M 280,130 L 210,130 L 140,110 L 120,110 L 120,200 L 155,200 L 205,165 L 280,165 Z" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" transform="translate(${stockOffset}, 0)" />
                     <line x1="${130 + stockOffset}" y1="113" x2="${130 + stockOffset}" y2="197" stroke="${strokeColor}" stroke-dasharray="3,3" />`; // buttpad
    } else if (stockType.includes("spade")) {
        // Dual spade grips (Gatling)
        stockPath = `<path d="M 270,120 L 240,120 L 240,180 L 270,180 M 240,135 L 220,135 L 220,165 L 240,165" fill="none" stroke="${strokeColor}" stroke-width="2" transform="translate(${stockOffset}, 0)" />`;
    } else if (stockType.includes("harness")) {
        // Tactical Carrying Harness handles
        stockPath = `<path d="M 270,120 Q 230,100 200,120 Q 180,140 210,160" fill="none" stroke="${strokeColor}" stroke-width="2" transform="translate(${stockOffset}, 0)" />`;
    }

    paths.push({ id: "stock", svg: stockPath, label: "Tactical Stock" });

    // --- HANDGUARD & FOREND (Sits on barrel, in front of receiver) ---
    let handguardPath = "";
    if (type === 'rifle') {
        handguardPath = `<rect x="${400 + handguardOffset}" y="132" width="100" height="24" rx="4" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" />
                         <line x1="${410 + handguardOffset}" y1="140" x2="${490 + handguardOffset}" y2="140" stroke="${strokeColor}" stroke-width="1" stroke-dasharray="5,3" />
                         <line x1="${410 + handguardOffset}" y1="148" x2="${490 + handguardOffset}" y2="148" stroke="${strokeColor}" stroke-width="1" stroke-dasharray="5,3" />`;
    } else if (type === 'sniper') {
        handguardPath = `<rect x="${410 + handguardOffset}" y="131" width="120" height="26" fill="none" stroke="${strokeColor}" stroke-width="1.5" />
                         <!-- Accessory Bipod -->
                         <path d="M ${490 + accessoryOffset},157 L ${480 + accessoryOffset},210 M ${490 + accessoryOffset},157 L ${500 + accessoryOffset},210" fill="none" stroke="${strokeColor}" stroke-width="2" />
                         <circle cx="${490 + accessoryOffset}" cy="157" r="3" fill="none" stroke="${strokeColor}" stroke-width="2" />`;
    } else if (type === 'shotgun') {
        // Pump slide forend
        handguardPath = `<rect x="${405 + handguardOffset}" y="148" width="80" height="18" rx="2" fill="none" stroke="${strokeColor}" stroke-width="2" />
                         <!-- Shell tube -->
                         <rect x="390" y="152" width="110" height="8" fill="none" stroke="${strokeColor}" stroke-width="1.5" />`;
    } else if (type === 'machine_gun') {
        handguardPath = `<rect x="${410 + handguardOffset}" y="125" width="110" height="36" fill="none" stroke="${strokeColor}" stroke-width="1.5" />
                         <!-- LMG Bipod -->
                         <path d="M ${460 + accessoryOffset},161 L ${450 + accessoryOffset},220 M ${460 + accessoryOffset},161 L ${470 + accessoryOffset},220" fill="none" stroke="${strokeColor}" stroke-width="1.5" />`;
    }

    if (handguardPath) {
        paths.push({ id: "handguard", svg: handguardPath, label: "Handguard Shroud" });
    }

    // --- MAGAZINE / FEED (Under receiver slot) ---
    let magPath = "";
    if (type === 'rifle') {
        // Curved magazine
        magPath = `<path d="M 320,170 Q 330,200 345,230 L 375,225 Q 360,195 350,170 Z" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" transform="translate(0, ${magOffset})" />`;
    } else if (type === 'sniper') {
        // Box precision mag
        magPath = `<rect x="310" y="165" width="35" height="30" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" transform="translate(0, ${magOffset})" />`;
    } else if (type === 'machine_gun') {
        // Ammo box container
        magPath = `<rect x="320" y="175" width="55" height="50" rx="3" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" transform="translate(0, ${magOffset})" />
                   <path d="M 300,160 L 320,180" fill="none" stroke="${strokeColor}" stroke-dasharray="3,3" transform="translate(0, ${magOffset})" />`; // feed belt link
    } else if (type === 'gatling_gun') {
        // Flexible feed chute
        magPath = `<path d="M 310,180 C 310,210 260,210 240,250 C 220,290 280,310 320,300" fill="none" stroke="${strokeColor}" stroke-width="6" stroke-dasharray="4,2" transform="translate(0, ${magOffset})" />
                   <rect x="320" y="275" width="60" height="40" fill="none" stroke="${strokeColor}" stroke-width="1.5" />`; // battery / ammo drum box
    }

    if (magPath) {
        paths.push({ id: "magazine", svg: magPath, label: "Magazine Feed" });
    }

    // --- OPTICS (Sits on top rail, Y: 130) ---
    let opticsPath = "";
    let opticsType = optics.toLowerCase();
    if (opticsType.includes("red dot") || opticsType.includes("holographic")) {
        opticsPath = `<rect x="${315 + opticsOffset}" y="112" width="35" height="18" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" />
                      <circle cx="${340 + opticsOffset}" cy="120" r="4" fill="none" stroke="${strokeColor}" stroke-width="1" />
                      <line x1="${310 + opticsOffset}" y1="125" x2="${355 + opticsOffset}" y2="125" stroke="${strokeColor}" stroke-width="1.5" />`; // optic riser
    } else if (opticsType.includes("acog")) {
        opticsPath = `<path d="M 310,122 L 315,108 L 350,108 L 360,114 L 360,122 Z" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" transform="translate(0, ${opticsOffset})" />
                      <line x1="${315 + opticsOffset}" y1="125" x2="${355 + opticsOffset}" y2="125" stroke="${strokeColor}" stroke-width="1.5" />
                      <path d="M 320,108 L 345,105" fill="none" stroke="${strokeColor}" stroke-width="1" />`; // light fiber rod
    } else if (opticsType.includes("scope") || opticsType.includes("sniper")) {
        opticsPath = `<rect x="${290 + opticsOffset}" y="105" width="110" height="15" rx="2" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" />
                      <path d="M 280,100 L 290,105 L 290,120 L 275,120 Z" fill="none" stroke="${strokeColor}" stroke-width="1.5" transform="translate(${opticsOffset}, 0)" /> // ocular lens
                      <path d="M 400,105 L 415,100 L 415,120 L 400,120 Z" fill="none" stroke="${strokeColor}" stroke-width="1.5" transform="translate(${opticsOffset}, 0)" /> // objective lens
                      <rect x="${335 + opticsOffset}" y="98" width="15" height="8" fill="none" stroke="${strokeColor}" stroke-width="1" /> // turret
                      <!-- Scope mounts -->
                      <line x1="${310 + opticsOffset}" y1="120" x2="${310 + opticsOffset}" y2="130" stroke="${strokeColor}" stroke-width="2.5" />
                      <line x1="${370 + opticsOffset}" y1="120" x2="${370 + opticsOffset}" y2="130" stroke="${strokeColor}" stroke-width="2.5" />`;
    } else if (opticsType.includes("ring")) {
        // Aircraft style ring sights
        opticsPath = `<circle cx="${290 + opticsOffset}" cy="110" r="10" fill="none" stroke="${strokeColor}" stroke-width="1.5" />
                      <line x1="${290 + opticsOffset}" y1="100" x2="${290 + opticsOffset}" y2="120" stroke="${strokeColor}" stroke-width="1" />
                      <line x1="${280 + opticsOffset}" y1="110" x2="${300 + opticsOffset}" y2="110" stroke="${strokeColor}" stroke-width="1" />
                      <line x1="${290 + opticsOffset}" y1="120" x2="${290 + opticsOffset}" y2="130" stroke="${strokeColor}" stroke-width="2" />`;
    } else if (opticsType.includes("bead") || opticsType.includes("iron")) {
        // Basic front post sight
        opticsPath = `<path d="M 390,129 L 390,124 L 387,122 L 387,129 Z" fill="none" stroke="${strokeColor}" stroke-width="1.5" />
                      <path d="M ${bStartX + barrelLen - 10 + barrelOffset},135 L ${bStartX + barrelLen - 10 + barrelOffset},124 L ${bStartX + barrelLen - 7 + barrelOffset},128" fill="none" stroke="${strokeColor}" stroke-width="1.5" />`;
    }

    if (opticsPath) {
        paths.push({ id: "optics", svg: opticsPath, label: "Optics Attachment" });
    }

    // --- SPECIAL MOTOR / TURRET MODULE (for Gatling) ---
    if (type === 'gatling_gun') {
        let motorPath = `<rect x="${240 + stockOffset}" y="130" width="30" height="35" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" />
                         <path d="M 230,135 L 210,135 M 230,160 L 210,160" fill="none" stroke="${strokeColor}" stroke-width="1" />`; // motor wires
        paths.push({ id: "bolt", svg: motorPath, label: "Electric Drive Motor" });
    }

    return paths;
}

// 5. UPDATE BLUEPRINT SCREEN
function updateBlueprint() {
    if (!currentGunType) return;
    
    const caliber = document.getElementById("spec-caliber").value;
    const barrel = document.getElementById("spec-barrel").value;
    const stock = document.getElementById("spec-stock").value;
    const optics = document.getElementById("spec-optics").value;

    const svgEl = document.getElementById("blueprint-svg");
    
    // Create blueprint style glow filter definition
    let defs = `
        <defs>
            <filter id="glow-orange" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <linearGradient id="blueprint-neon-glow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#ff9b6a" />
                <stop offset="100%" stop-color="#ff6b1a" />
            </linearGradient>
        </defs>
    `;

    const parts = getWeaponSVGPaths(currentGunType, caliber, barrel, stock, optics, false);
    
    let svgContent = defs;
    parts.forEach(p => {
        svgContent += p.svg;
    });

    svgEl.innerHTML = svgContent;

    // Update blueprint footer text
    document.getElementById("blueprint-footer").textContent = 
        `CALIBER: ${caliber} // BARREL: ${barrel.split(" ")[0].toUpperCase()} // OPTICS: ${optics.split(" ")[0].toUpperCase()}`;
}

// 6. MULTI-AGENT DESIGN VALIDATION (POST /api/design)
async function validateDesign() {
    playSound('click');
    if (!currentGunType) return;

    const caliber = document.getElementById("spec-caliber").value;
    const barrel = document.getElementById("spec-barrel").value;
    const stock = document.getElementById("spec-stock").value;
    const optics = document.getElementById("spec-optics").value;

    // Set badge status to busy
    setAgentBadgeStatus("design", "working", "ANALYZING...");
    logAgentTransmission("Design Architect", "Chamber and stress-load checks initialized. Checking local RAG manuals...", "info");

    try {
        const response = await fetch("/api/design", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                gun_type: currentGunType,
                caliber: caliber,
                barrel: barrel,
                stock: stock,
                optics: optics
            })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Print orchestrator logs
        if (data.logs) {
            data.logs.forEach(log => {
                logAgentTransmission(log.sender, log.message, log.status);
            });
        }

        // Fill persona commentary
        updateBriefingText(data.commentary);

        if (data.success) {
            playSound('lock');
            setAgentBadgeStatus("design", "active", "APPROVED");
            document.getElementById("tab-assembly").removeAttribute("disabled");
            
            // Store variables globally for next step
            currentSpecs = data.specs;
            
            // Update RAG source UI
            updateRAGIndicator(`SUCCESS - RAG SCHEMATICS LOADED (${data.retrieved_sources.length} SOURCES)`);

            // Suggest next steps to user
            logAgentTransmission("System", "Weapon design APPROVED. Workspace Step 02: ASSEMBLY BAY unlocked.", "success");
        } else {
            setAgentBadgeStatus("design", "active", "REJECTED");
            document.getElementById("tab-assembly").setAttribute("disabled", "true");
            document.getElementById("tab-range").setAttribute("disabled", "true");
            updateRAGIndicator("BLOCKED - INCORRECT DESIGN PART-MATCHING");
        }
        
    } catch (e) {
        logAgentTransmission("System", `Validation failure: ${e.message}`, "danger");
        setAgentBadgeStatus("design", "active", "OFFLINE");
    }
}

// 7. WEAPON ASSEMBLY BAY (POST /api/assemble)
async function fetchAssemblySequence() {
    if (!currentGunType || !currentSpecs) return null;
    
    setAgentBadgeStatus("assembly", "working", "ASSEMBLING...");
    logAgentTransmission("Lead Assembly Engineer", "Synchronizing build parameters with standard operating procedures...", "info");

    try {
        const response = await fetch("/api/assemble", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                gun_type: currentGunType,
                specs: currentSpecs
            })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`);
        }

        const data = await response.json();
        assemblyData = data;
        return data;
    } catch (e) {
        logAgentTransmission("System", `Assembly data error: ${e.message}`, "danger");
        setAgentBadgeStatus("assembly", "active", "OFFLINE");
        return null;
    }
}

// Dynamic assembly drawing
function renderAssemblySVG(activePartId = null, visibleParts = []) {
    if (!currentGunType || !currentSpecs) return;

    const svgEl = document.getElementById("assembly-svg");
    
    // Neon Cyan glow definition
    let defs = `
        <defs>
            <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <linearGradient id="blueprint-neon-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#00f0ff" />
                <stop offset="100%" stop-color="#0077aa" />
            </linearGradient>
            <linearGradient id="blueprint-neon-green" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#39ff14" stop-opacity="0.9" />
                <stop offset="100%" stop-color="#11aa00" stop-opacity="0.9" />
            </linearGradient>
        </defs>
    `;

    // Fetch exploded configuration
    const parts = getWeaponSVGPaths(
        currentGunType, 
        currentSpecs.caliber, 
        currentSpecs.barrel, 
        currentSpecs.stock, 
        currentSpecs.optics, 
        true
    );

    let svgContent = defs;
    
    parts.forEach(p => {
        const isVisible = visibleParts.includes(p.id);
        const isActive = activePartId === p.id;
        
        if (!isVisible && !isActive) return; // Hide parts not yet fitted
        
        let pathStr = p.svg;
        
        if (isActive) {
            // Apply neon cyan highlight filter and glow stroke
            pathStr = pathStr.replace(/stroke="url\(#blueprint-neon-glow\)"/g, 'stroke="url(#blueprint-neon-green)" filter="url(#glow-cyan)"');
        } else {
            // Normal cyan assembly outline
            pathStr = pathStr.replace(/stroke="url\(#blueprint-neon-glow\)"/g, 'stroke="url(#blueprint-neon-cyan)"');
        }
        
        svgContent += pathStr;
    });

    svgEl.innerHTML = svgContent;
}

// Visual step triggers
async function startAssemblySequence() {
    playSound('click');
    const data = await fetchAssemblySequence();
    if (!data) return;

    // Reset controls
    document.getElementById("btn-start-assembly").setAttribute("disabled", "true");
    const stepsListEl = document.getElementById("assembly-steps-list");
    stepsListEl.innerHTML = "";

    // Load steps into list UI
    data.steps.forEach(step => {
        const stepEl = document.createElement("div");
        stepEl.className = "step-item";
        stepEl.id = `step-card-${step.step_number}`;
        stepEl.innerHTML = `<span class="step-num">STEP 0${step.step_number}:</span> <strong>${step.title}</strong> - ${step.description}`;
        stepsListEl.appendChild(stepEl);
    });

    updateBriefingText(data.commentary);

    let currentStepIndex = 0;
    const visibleParts = [];
    const stepDuration = 1200; // ms per assembly part slot

    document.getElementById("assembly-bay-status").textContent = "CYCELING ASSEMBLY";

    // Play step timing sequence
    const interval = setInterval(() => {
        if (currentStepIndex >= data.steps.length) {
            clearInterval(interval);
            finalizeAssembly();
            return;
        }

        const step = data.steps[currentStepIndex];
        
        // Update steps scrollbar
        document.querySelectorAll(".step-item").forEach(el => el.classList.remove("active"));
        const activeCard = document.getElementById(`step-card-${step.step_number}`);
        if (activeCard) {
            activeCard.classList.add("active");
            activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        // Animate graphic part fitment
        playSound('lock');
        renderAssemblySVG(step.part_id, visibleParts);
        
        // Push part to visible list so it stays on next drawing
        if (!visibleParts.includes(step.part_id)) {
            visibleParts.push(step.part_id);
        }

        // Log assembly telemetry
        logAgentTransmission(
            "Lead Assembly Engineer", 
            `Fitting: [${step.title.toUpperCase()}] -> lock confirmed. Specs integrated.`, 
            "info"
        );

        // Update progress text
        const percent = Math.round(((currentStepIndex + 1) / data.steps.length) * 100);
        document.getElementById("assembly-percent").textContent = `${percent}%`;

        currentStepIndex++;
    }, stepDuration);
}

function finalizeAssembly() {
    playSound('lock');
    document.getElementById("assembly-percent").textContent = "100%";
    document.getElementById("assembly-bay-status").textContent = "LOCKED // READY";
    setAgentBadgeStatus("assembly", "active", "FINALIZED");
    
    // Complete steps lists
    document.querySelectorAll(".step-item").forEach(el => {
        el.classList.remove("active");
        el.classList.add("completed");
    });

    document.getElementById("tab-range").removeAttribute("disabled");
    logAgentTransmission("System", "Weapon assembly complete. Weapon chamber lock test: PASS. Firing range lane UNLOCKED.", "success");
}

// 8. TACTICAL BALLISTICS SHOOTING RANGE (POST /api/test-fire)
async function fetchBallisticsData(ammoType) {
    if (!currentGunType || !currentSpecs) return;
    
    setAgentBadgeStatus("ballistics", "working", "CALCULATING...");
    logAgentTransmission("Ballistics Expert", "Receiving test weapon blueprints. Synchronizing range targeting systems...", "info");

    try {
        const response = await fetch("/api/test-fire", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                gun_type: currentGunType,
                specs: currentSpecs,
                ammo_type: ammoType
            })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`);
        }

        const data = await response.json();
        ballisticsData = data;

        // Apply RAG calculated specs to UI telemetry
        updateTelemetryStats(data.stats);
        
        // Print agent logs
        if (data.logs) {
            data.logs.forEach(log => {
                logAgentTransmission(log.sender, log.message, log.status);
            });
        }
        
        // Fill persona commentary
        updateBriefingText(data.commentary);
        setAgentBadgeStatus("ballistics", "active", "READY");
    } catch (e) {
        logAgentTransmission("System", `Ballistics query failed: ${e.message}`, "danger");
        setAgentBadgeStatus("ballistics", "active", "OFFLINE");
    }
}

function updateTelemetryStats(stats) {
    document.getElementById("stat-accuracy").textContent = `${stats.accuracy}%`;
    document.getElementById("fill-accuracy").style.width = `${stats.accuracy}%`;

    document.getElementById("stat-recoil").textContent = `${stats.recoil}%`;
    document.getElementById("fill-recoil").style.width = `${stats.recoil}%`;

    document.getElementById("stat-damage").textContent = `${stats.damage} HP`;
    document.getElementById("fill-damage").style.width = `${Math.min(100, (stats.damage / 150) * 100)}%`;

    document.getElementById("stat-range").textContent = `${stats.range}m`;
    document.getElementById("stat-rofire").textContent = `${stats.fire_rate} RPM`;
}

// 2D CANVAS GAME SIMULATION ENGINE
let canvas = null;
let ctx = null;
let rangeGameLoop = null;

// Game State
let mouse = { x: 0, y: 0 };
let weaponOrigin = { x: 100, y: 350 };
let currentAmmunitionType = "Standard FMJ";
let magazineSize = 30;
let ammoLoaded = 30;
let isReloading = false;
let reloadTimer = 0;
let recoilKick = 0;
let crosshairSize = 15;
let shotCooldown = 0;

let tracers = []; // { x1, y1, x2, y2, alpha }
let casings = []; // { x, y, vx, vy, rot, rotVel, alpha }
let targets = []; // { x, y, r, speed, direction, distance, health, maxHealth }
let particles = []; // impact sparks { x, y, vx, vy, alpha, size }
let scores = { spawned: 0, shots: 0, hits: 0, score: 0 };

function initShootingRange() {
    canvas = document.getElementById("range-canvas");
    if (!canvas) return;
    
    ctx = canvas.getContext("2d");
    
    // Fit canvas resolution properly
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;

    // Load initial ballistics
    const ammoSelector = document.getElementById("range-ammo-selector");
    currentAmmunitionType = ammoSelector.value;
    fetchBallisticsData(currentAmmunitionType);

    // Event listeners for game
    canvas.removeEventListener("mousemove", onRangeMouseMove);
    canvas.removeEventListener("mousedown", onRangeMouseDown);
    canvas.addEventListener("mousemove", onRangeMouseMove);
    canvas.addEventListener("mousedown", onRangeMouseDown);

    // Set mag sizing
    if (currentGunType === 'sniper') magazineSize = 5;
    else if (currentGunType === 'shotgun') magazineSize = 8;
    else if (currentGunType === 'machine_gun') magazineSize = 100;
    else if (currentGunType === 'gatling_gun') magazineSize = 500;
    else magazineSize = 30;
    
    ammoLoaded = magazineSize;
    isReloading = false;
    scores = { spawned: 0, shots: 0, hits: 0, score: 0 };
    updateScoreUI();

    // Spawn first target
    targets = [];
    spawnTarget();

    // Start game animation loop
    if (rangeGameLoop) cancelAnimationFrame(rangeGameLoop);
    tickShootingRange();
}

function dismissInstructions() {
    const card = document.getElementById("range-instruction-card");
    if (card) card.style.opacity = "0";
    setTimeout(() => { if (card) card.style.display = "none"; }, 300);
}

function onRangeMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
}

function changeRangeAmmunition() {
    const ammoSelector = document.getElementById("range-ammo-selector");
    currentAmmunitionType = ammoSelector.value;
    fetchBallisticsData(currentAmmunitionType);
}

function spawnTarget() {
    const r = 25;
    const distance = Math.round(50 + Math.random() * 250); // meters
    
    // Draw target size proportional to distance
    const scaledRadius = Math.max(8, r * (1 - (distance / 350)));
    
    targets.push({
        x: canvas.width - 120 - Math.random() * 100,
        y: 80 + Math.random() * 200,
        r: scaledRadius,
        speed: 1 + Math.random() * 2.5,
        direction: Math.random() > 0.5 ? 1 : -1,
        distance: distance,
        health: currentGunType === 'sniper' ? 100 : 40,
        maxHealth: currentGunType === 'sniper' ? 100 : 40
    });
    scores.spawned++;
    updateScoreUI();
}

function triggerReload() {
    if (isReloading) return;
    isReloading = true;
    reloadTimer = currentGunType === 'machine_gun' ? 180 : currentGunType === 'gatling_gun' ? 240 : 90;
    playSound('click');
    logAgentTransmission("Range Master", "Weapon empty. Commencing mechanical feed reload.", "info");
}

function onRangeMouseDown(e) {
    if (isReloading || shotCooldown > 0) return;
    if (ammoLoaded <= 0) {
        triggerReload();
        return;
    }

    if (!ballisticsData) return;

    // Fire!
    ammoLoaded--;
    scores.shots++;
    playSound(
        currentGunType === 'sniper' ? 'fire_sniper' :
        currentGunType === 'shotgun' ? 'fire_shotgun' :
        currentGunType === 'gatling_gun' ? 'fire_gatling' : 'fire_rifle'
    );

    // Calculate barrel tip nozzle coordinate
    const dx = mouse.x - weaponOrigin.x;
    const dy = mouse.y - weaponOrigin.y;
    const angle = Math.atan2(dy, dx);
    
    // SVG standard barrel length coordinate estimation
    let barrelLen = currentSpecs.barrel.includes("Short") ? 90 : currentSpecs.barrel.includes("Long") ? 190 : 140;
    const muzzleX = weaponOrigin.x + Math.cos(angle) * barrelLen;
    const muzzleY = weaponOrigin.y + Math.sin(angle) * barrelLen;

    // Bullet Spread (Accuracy rating impact)
    // Low accuracy = higher spread deviation angle
    const accuracy = ballisticsData.stats.accuracy;
    const spreadLimit = (100 - accuracy) / 300; // spread coefficient
    const spreadAngle = angle + (Math.random() * 2 - 1) * spreadLimit;

    // Recoil Kick (bloom)
    const recoil = ballisticsData.stats.recoil;
    recoilKick += (recoil / 10);
    crosshairSize = 15 + recoilKick;

    // Cooldown base rate
    if (currentGunType === 'gatling_gun') shotCooldown = 2; // rapid RPM
    else if (currentGunType === 'machine_gun') shotCooldown = 5;
    else if (currentGunType === 'rifle') shotCooldown = 8;
    else if (currentGunType === 'shotgun') shotCooldown = 60; // slow pump action
    else if (currentGunType === 'sniper') shotCooldown = 90; // manual bolt lock cyclic

    // Find Target hit
    let didHit = false;
    let hitX = muzzleX + Math.cos(spreadAngle) * 800;
    let hitY = muzzleY + Math.sin(spreadAngle) * 800;

    // Trace bullet line collision intersections with active targets
    targets.forEach((target, index) => {
        // Bullet ray check
        const dist = pointToLineDistance(target.x, target.y, muzzleX, muzzleY, hitX, hitY);
        
        // If bullet ray passes inside target bounds AND matches distance bounds
        if (dist <= target.r) {
            didHit = true;
            hitX = target.x;
            hitY = target.y;

            // Damage impact application
            target.health -= ballisticsData.stats.damage;

            // Metallic clang sound
            setTimeout(() => { playSound('click'); }, (target.distance / 340) * 200); // sound speed delay mock!

            // Create target hit sparks particles
            for (let k = 0; k < 12; k++) {
                particles.push({
                    x: target.x,
                    y: target.y,
                    vx: (Math.random() * 2 - 1) * 3,
                    vy: (Math.random() * 2 - 1) * 3,
                    alpha: 1.0,
                    size: 1 + Math.random() * 3
                });
            }

            if (target.health <= 0) {
                targets.splice(index, 1);
                scores.hits++;
                
                // Add points proportional to target distance and accuracy multiplier
                const basePoints = 100;
                const distanceBonus = target.distance;
                scores.score += Math.round((basePoints + distanceBonus) * (accuracy / 100));

                logAgentTransmission(
                    "Ballistics Expert", 
                    `HIT: Target neutralized at ${target.distance}m. Impact score: +${Math.round((basePoints + distanceBonus) * (accuracy/100))}`, 
                    "success"
                );

                // Spawn a replacement target
                setTimeout(spawnTarget, 800);
            } else {
                logAgentTransmission("Range Master", `HIT: Target hit at ${target.distance}m. Target health: ${Math.round((target.health/target.maxHealth)*100)}%`, "info");
            }
        }
    });

    // Tracers addition
    tracers.push({
        x1: muzzleX,
        y1: muzzleY,
        x2: hitX,
        y2: hitY,
        alpha: 1.0,
        color: currentAmmunitionType.includes("Tracer") ? "rgba(57, 255, 20, 0.85)" : "rgba(255, 220, 100, 0.75)"
    });

    // Shell Casings popping out
    const ejectAngle = angle - Math.PI / 2 + (Math.random() * 0.4 - 0.2);
    casings.push({
        x: weaponOrigin.x + 20,
        y: weaponOrigin.y,
        vx: Math.cos(ejectAngle) * 3,
        vy: Math.sin(ejectAngle) * 3 - 2, // gravity lift
        rot: Math.random() * Math.PI,
        rotVel: 0.1 + Math.random() * 0.2,
        alpha: 1.0
    });

    updateScoreUI();
}

function tickShootingRange() {
    if (!canvas || !ctx) return;

    // Draw background board
    ctx.fillStyle = "#040507";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw target lanes rails / walls perspective grid
    ctx.strokeStyle = "rgba(57, 255, 20, 0.05)";
    ctx.lineWidth = 1;
    for (let d = 0; d <= canvas.height; d += 40) {
        ctx.beginPath();
        ctx.moveTo(0, d);
        ctx.lineTo(canvas.width, d);
        ctx.stroke();
    }
    
    // Draw target wall background at 300m
    ctx.fillStyle = "rgba(10, 15, 22, 0.9)";
    ctx.fillRect(canvas.width - 80, 0, 80, canvas.height);
    
    ctx.strokeStyle = "rgba(57, 255, 20, 0.15)";
    ctx.beginPath();
    ctx.moveTo(canvas.width - 80, 0);
    ctx.lineTo(canvas.width - 80, canvas.height);
    ctx.stroke();

    // Text distance indicator
    ctx.fillStyle = "rgba(57, 255, 20, 0.3)";
    ctx.font = "10px 'Share Tech Mono'";
    ctx.fillText("300 METERS LANE WALL", canvas.width - 70, 20);

    // Update targets
    targets.forEach(target => {
        // Horizontal Target Movement bounce logic
        target.y += target.speed * target.direction;
        if (target.y - target.r < 40 || target.y + target.r > canvas.height - 40) {
            target.direction *= -1;
        }

        // Draw target stands
        ctx.strokeStyle = "rgba(255,255,255,0.06)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(target.x, target.y);
        ctx.lineTo(target.x, canvas.height);
        ctx.stroke();

        // Draw bullseye circles
        ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
        ctx.strokeStyle = "rgba(255, 50, 50, 0.8)";
        ctx.lineWidth = 1.5;
        
        ctx.beginPath();
        ctx.arc(target.x, target.y, target.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = "white";
        ctx.beginPath();
        ctx.arc(target.x, target.y, target.r * 0.6, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc(target.x, target.y, target.r * 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Target distance details labels
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.font = "8px 'Share Tech Mono'";
        ctx.fillText(`${target.distance}m`, target.x - 12, target.y - target.r - 4);
    });

    // Update tracers
    tracers.forEach((t, i) => {
        ctx.strokeStyle = t.color;
        ctx.lineWidth = 2.5 * t.alpha;
        ctx.beginPath();
        ctx.moveTo(t.x1, t.y1);
        ctx.lineTo(t.x2, t.y2);
        ctx.stroke();
        
        t.alpha -= 0.08;
        if (t.alpha <= 0) tracers.splice(i, 1);
    });

    // Update shells physical particles
    casings.forEach((c, i) => {
        ctx.fillStyle = "rgba(212, 175, 55, " + c.alpha + ")"; // brass color
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rot);
        ctx.fillRect(-3, -1, 6, 2.5); // draw tiny brass casing
        ctx.restore();

        // Gravity physics updates
        c.x += c.vx;
        c.y += c.vy;
        c.vy += 0.2; // gravity drop
        c.rot += c.rotVel;

        if (c.y > canvas.height) {
            c.alpha -= 0.05;
        }
        if (c.alpha <= 0) casings.splice(i, 1);
    });

    // Update Sparks
    particles.forEach((p, i) => {
        ctx.fillStyle = "rgba(255, 165, 0, " + p.alpha + ")";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.03;
        if (p.alpha <= 0) particles.splice(i, 1);
    });

    // Reload timers logic
    if (isReloading) {
        reloadTimer--;
        ctx.fillStyle = "rgba(0, 240, 255, 0.4)";
        ctx.font = "14px 'Share Tech Mono'";
        ctx.fillText("RELOADING AMMUNITION CHAMBER...", weaponOrigin.x, weaponOrigin.y - 40);
        
        if (reloadTimer <= 0) {
            ammoLoaded = magazineSize;
            isReloading = false;
            playSound('lock');
            logAgentTransmission("Range Master", "Reload cycle complete. Ready to fire.", "success");
        }
    }

    // Shot cooldown decay
    if (shotCooldown > 0) shotCooldown--;

    // Recoil center decay
    if (recoilKick > 0) recoilKick *= 0.85;

    // Draw Player Custom Gun sprite (facing cursor angle)
    const dx = mouse.x - weaponOrigin.x;
    const dy = mouse.y - weaponOrigin.y;
    const angle = Math.atan2(dy, dx);

    ctx.save();
    ctx.translate(weaponOrigin.x, weaponOrigin.y);
    ctx.rotate(angle);
    
    // Recoil shift kickback effect animation
    ctx.translate(-recoilKick, 0);

    // Draw stylized weapon outline directly onto canvas
    drawWeaponDirectToCanvas();

    ctx.restore();

    // Draw target crosshairs HUD
    ctx.strokeStyle = isReloading ? "rgba(255,50,50,0.5)" : "rgba(57, 255, 20, 0.6)";
    ctx.lineWidth = 1.5;
    
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, Math.max(10, 15 + recoilKick), 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(mouse.x, mouse.y - 5); ctx.lineTo(mouse.x, mouse.y - 12);
    ctx.moveTo(mouse.x, mouse.y + 5); ctx.lineTo(mouse.x, mouse.y + 12);
    ctx.moveTo(mouse.x - 5, mouse.y); ctx.lineTo(mouse.x - 12, mouse.y);
    ctx.moveTo(mouse.x + 5, mouse.y); ctx.lineTo(mouse.x + 12, mouse.y);
    ctx.stroke();

    // Draw Live Ammo counter HUD
    ctx.fillStyle = "white";
    ctx.font = "14px 'Share Tech Mono'";
    ctx.fillText(`AMMO: ${ammoLoaded} / ${magazineSize}`, 30, canvas.height - 30);

    rangeGameLoop = requestAnimationFrame(tickShootingRange);
}

// 2D Canvas lines vector drawing matching selected parts
function drawWeaponDirectToCanvas() {
    if (!currentSpecs) return;

    ctx.strokeStyle = "rgba(57, 255, 20, 0.85)"; // glowing green firing range outline
    ctx.lineWidth = 2.5;

    // Offset centers to make rotation look centered
    const baseOffset = -300; // coordinate translation matching SVG coordinate base 350
    const centerY = -150;

    // Draw Receiver
    ctx.beginPath();
    if (currentGunType === 'rifle') {
        ctx.strokeRect(280 + baseOffset, 130 + centerY, 120, 40);
        ctx.strokeRect(290 + baseOffset, 170 + centerY, 30, 20); // grip
    } else if (currentGunType === 'sniper') {
        ctx.strokeRect(270 + baseOffset, 130 + centerY, 140, 35);
        ctx.strokeRect(290 + baseOffset, 165 + centerY, 20, 25);
    } else if (currentGunType === 'shotgun') {
        ctx.strokeRect(280 + baseOffset, 130 + centerY, 110, 40);
        ctx.strokeRect(290 + baseOffset, 170 + centerY, 15, 20);
    } else if (currentGunType === 'machine_gun') {
        ctx.strokeRect(270 + baseOffset, 120 + centerY, 140, 55);
        ctx.strokeRect(280 + baseOffset, 175 + centerY, 30, 20);
    } else if (currentGunType === 'gatling_gun') {
        ctx.strokeRect(270 + baseOffset, 110 + centerY, 120, 80);
    }
    ctx.stroke();

    // Draw Stock
    ctx.beginPath();
    if (currentSpecs.stock.includes("Tactical") || currentSpecs.stock.includes("Para")) {
        ctx.moveTo(280 + baseOffset, 140 + centerY);
        ctx.lineTo(220 + baseOffset, 140 + centerY);
        ctx.lineTo(220 + baseOffset, 135 + centerY);
        ctx.lineTo(160 + baseOffset, 135 + centerY);
        ctx.lineTo(150 + baseOffset, 150 + centerY);
        ctx.lineTo(150 + baseOffset, 195 + centerY);
        ctx.lineTo(170 + baseOffset, 195 + centerY);
        ctx.lineTo(195 + baseOffset, 155 + centerY);
        ctx.closePath();
    } else if (currentSpecs.stock.includes("Folding")) {
        ctx.moveTo(280 + baseOffset, 140 + centerY);
        ctx.quadraticCurveTo(200 + baseOffset, 140 + centerY, 180 + baseOffset, 150 + centerY);
        ctx.quadraticCurveTo(170 + baseOffset, 170 + centerY, 170 + baseOffset, 190 + centerY);
    } else if (currentSpecs.stock.includes("Heavy") || currentSpecs.stock.includes("Wood")) {
        ctx.moveTo(280 + baseOffset, 130 + centerY);
        ctx.lineTo(210 + baseOffset, 130 + centerY);
        ctx.lineTo(140 + baseOffset, 110 + centerY);
        ctx.lineTo(120 + baseOffset, 110 + centerY);
        ctx.lineTo(120 + baseOffset, 200 + centerY);
        ctx.lineTo(155 + baseOffset, 200 + centerY);
        ctx.lineTo(205 + baseOffset, 165 + centerY);
        ctx.closePath();
    } else if (currentSpecs.stock.includes("Spade")) {
        ctx.moveTo(270 + baseOffset, 120 + centerY);
        ctx.lineTo(240 + baseOffset, 120 + centerY);
        ctx.lineTo(240 + baseOffset, 180 + centerY);
        ctx.lineTo(270 + baseOffset, 180 + centerY);
    }
    ctx.stroke();

    // Draw Barrel
    let bStartX = 400 + baseOffset;
    if (currentGunType === 'gatling_gun' || currentGunType === 'shotgun') bStartX = 390 + baseOffset;
    else if (currentGunType === 'sniper') bStartX = 410 + baseOffset;
    
    let barrelLen = currentSpecs.barrel.includes("Short") ? 90 : currentSpecs.barrel.includes("Long") || currentSpecs.barrel.includes("Precision") || currentSpecs.barrel.includes("Match") || currentSpecs.barrel.includes("Enclosed") ? 190 : 140;

    ctx.beginPath();
    if (currentGunType === 'gatling_gun') {
        ctx.strokeRect(bStartX, 125 + centerY, barrelLen, 8);
        ctx.strokeRect(bStartX, 140 + centerY, barrelLen, 8);
        ctx.strokeRect(bStartX, 155 + centerY, barrelLen, 8);
    } else {
        ctx.strokeRect(bStartX, 135 + centerY, barrelLen, 10);
    }
    ctx.stroke();

    // Draw Optics
    ctx.beginPath();
    if (currentSpecs.optics.includes("Red Dot") || currentSpecs.optics.includes("Holographic")) {
        ctx.strokeRect(315 + baseOffset, 112 + centerY, 35, 18);
    } else if (currentSpecs.optics.includes("ACOG")) {
        ctx.moveTo(310 + baseOffset, 122 + centerY);
        ctx.lineTo(315 + baseOffset, 108 + centerY);
        ctx.lineTo(350 + baseOffset, 108 + centerY);
        ctx.lineTo(360 + baseOffset, 114 + centerY);
        ctx.lineTo(360 + baseOffset, 122 + centerY);
        ctx.closePath();
    } else if (currentSpecs.optics.includes("Scope") || currentSpecs.optics.includes("Sniper")) {
        ctx.strokeRect(290 + baseOffset, 105 + centerY, 110, 15);
    } else if (currentSpecs.optics.includes("Ring")) {
        ctx.arc(290 + baseOffset, 110 + centerY, 10, 0, Math.PI * 2);
    }
    ctx.stroke();

    // Draw Magazine
    ctx.beginPath();
    if (currentGunType === 'rifle') {
        ctx.moveTo(320 + baseOffset, 170 + centerY);
        ctx.quadraticCurveTo(330 + baseOffset, 200 + centerY, 345 + baseOffset, 230 + centerY);
        ctx.lineTo(375 + baseOffset, 225 + centerY);
        ctx.quadraticCurveTo(360 + baseOffset, 195 + centerY, 350 + baseOffset, 170 + centerY);
    } else if (currentGunType === 'sniper') {
        ctx.strokeRect(310 + baseOffset, 165 + centerY, 35, 30);
    } else if (currentGunType === 'machine_gun') {
        ctx.strokeRect(320 + baseOffset, 175 + centerY, 55, 50);
    } else if (currentGunType === 'gatling_gun') {
        ctx.strokeRect(320 + baseOffset, 190 + centerY, 40, 30);
    }
    ctx.stroke();
}

function updateScoreUI() {
    document.getElementById("score-spawned").textContent = scores.spawned;
    document.getElementById("score-shots").textContent = scores.shots;
    document.getElementById("score-hits").textContent = scores.hits;
    
    const hitRate = scores.shots > 0 ? Math.round((scores.hits / scores.shots) * 100) : 0;
    document.getElementById("score-percent").textContent = `${hitRate}%`;

    const scoreStr = String(scores.score).padStart(4, '0');
    document.getElementById("score-total").textContent = scoreStr;
}

// Distance helper check
function pointToLineDistance(x, y, x1, y1, x2, y2) {
    const A = x - x1;
    const B = y - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
        xx = x1;
        yy = y1;
    } else if (param > 1) {
        xx = x2;
        yy = y2;
    } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }

    const dx = x - xx;
    const dy = y - yy;
    return Math.sqrt(dx * dx + dy * dy);
}

// 9. LOGS PANEL WRITERS
function logAgentTransmission(sender, message, status = "info") {
    const logFeed = document.getElementById("agent-logs-feed");
    if (!logFeed) return;

    const timestamp = new Date().toLocaleTimeString();
    const logItem = document.createElement("div");
    logItem.className = `log-message ${status}`;
    logItem.innerHTML = `
        <span class="timestamp">[${timestamp}]</span>
        <span class="sender">${sender.toUpperCase()}:</span>
        <span class="text">${message}</span>
    `;

    logFeed.appendChild(logItem);
    
    // Auto scroll bottom
    logFeed.scrollTop = logFeed.scrollHeight;
}

function updateBriefingText(text) {
    const briefingEl = document.getElementById("agent-briefing-text");
    if (briefingEl) briefingEl.textContent = text;
}

function setAgentBadgeStatus(agentId, className, statusText) {
    const badge = document.getElementById(`agent-badge-${agentId}`);
    if (!badge) return;

    badge.className = `agent-badge ${className}`;
    badge.querySelector(".status").textContent = statusText;
    
    if (className === 'active' && (statusText === 'APPROVED' || statusText === 'READY' || statusText === 'FINALIZED')) {
        badge.querySelector(".status").classList.add("pulse");
    } else {
        badge.querySelector(".status").classList.remove("pulse");
    }
}

function updateRAGIndicator(text) {
    const indicatorText = document.querySelector("#rag-indicator .text");
    if (indicatorText) indicatorText.textContent = text;
}
