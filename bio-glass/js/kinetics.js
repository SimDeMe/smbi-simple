// bio-glass/js/kinetics.js

const KineticsModule = {
    engineRef: null,
    updateLoop: null,
    graphInterval: null,
    chart: null,
    temp: 37,
    ph: 7.0,
    productCount: 0,
    lastProductCount: 0,
    startTime: 0,

    init: function (bioEngine) {
        this.engineRef   = bioEngine;
        this.productCount = 0;
        this.lastProductCount = 0;
        this.startTime   = Date.now();

        this.setupControls();
        this.setupOverlay();
        this.setupChart();
        this.spawnSystem();

        bioEngine.setFluidViscosity(0.01);

        this.updateLoop = () => this.simLoop();
        Events.on(bioEngine.engine, 'beforeUpdate', this.updateLoop);

        this.graphInterval = setInterval(() => this.updateGraph(), 1000);
    },

    teardown: function () {
        if (this.engineRef && this.updateLoop) {
            Events.off(this.engineRef.engine, 'beforeUpdate', this.updateLoop);
        }
        clearInterval(this.graphInterval);
        if (this.chart) { this.chart.destroy(); this.chart = null; }
        this.engineRef = null;
    },

    setupControls: function () {
        document.getElementById('controls-panel').innerHTML = `
            <h3>Parametre</h3>

            <div class="control-group">
                <div class="control-label">
                    <span>Temperatur</span>
                    <span class="control-value" id="temp-val">37°C</span>
                </div>
                <input type="range" id="temp-input" min="0" max="80" step="1" value="37">
            </div>

            <div class="control-group">
                <div class="control-label">
                    <span>pH Værdi</span>
                    <span class="control-value" id="ph-val">7.0</span>
                </div>
                <input type="range" id="ph-input" min="1" max="14" step="0.1" value="7.0">
            </div>

            <div class="control-group">
                <button class="btn-reset" onclick="KineticsModule.reset()">↺ Start Forfra</button>
            </div>

            <div class="info-card">
                <div class="info-row">
                    <span class="info-dot" style="background:#fb923c; color:#fb923c;"></span>
                    <span><strong>Enzym</strong> — bevæger sig hurtigere ved høj temp</span>
                </div>
                <div class="info-row">
                    <span class="info-dot" style="background:#60a5fa; color:#60a5fa;"></span>
                    <span><strong>Substrat</strong> → omdannes til produkt</span>
                </div>
                <div class="info-row">
                    <span class="info-dot" style="background:#34d399; color:#34d399;"></span>
                    <span><strong>Produkt</strong> — viser reaktionshastighed</span>
                </div>
                <div style="margin-top:8px; font-size:0.72rem; color: var(--text-muted);">
                    Optimal temp: 37–40°C<br>
                    Denatureres ved &gt;55°C<br>
                    Optimal pH: 7.0
                </div>
            </div>
        `;

        document.getElementById('temp-input').addEventListener('input', (e) => {
            this.temp = parseInt(e.target.value);
            document.getElementById('temp-val').textContent = this.temp + '°C';
            this.updateTempOverlay();
            this.updateEnzymeVisuals();
        });

        document.getElementById('ph-input').addEventListener('input', (e) => {
            this.ph = parseFloat(e.target.value);
            document.getElementById('ph-val').textContent = this.ph.toFixed(1);
            this.updatePhOverlay();
        });

        document.getElementById('chart-container').style.display = 'block';
    },

    setupOverlay: function () {
        document.getElementById('canvas-overlay').innerHTML = `
            <div class="temp-gauge">
                <div class="overlay-label">Temperatur</div>
                <div class="temp-bar">
                    <div class="temp-marker" id="temp-marker" style="left: 46%;"></div>
                </div>
                <div class="temp-readout">
                    <span>0°C</span>
                    <span id="temp-readout-val">37°C</span>
                    <span>80°C</span>
                </div>
            </div>

            <div class="ph-indicator" style="top: 14px; right: 14px;">
                <div class="overlay-label">pH Indikator</div>
                <div class="ph-strip">
                    <div class="ph-marker" id="ph-marker" style="left: 43%;"></div>
                </div>
                <div class="ph-readout">
                    <span>Surt (1)</span>
                    <span id="ph-readout-val">7.0</span>
                    <span>Basisk (14)</span>
                </div>
            </div>

            <div class="rate-chip" id="rate-chip">
                Reaktionsrate: <span class="rate-val" id="rate-val">0</span> produkter/s
            </div>

            <div class="denatured-alert" id="denatured-alert">
                <h3>⚠ Enzym Denatureret</h3>
                <p>Temperaturen overstiger 55°C — enzymet er inaktivt</p>
            </div>
        `;

        // Position pH indicator below temp gauge
        const phEl = document.querySelector('#canvas-overlay .ph-indicator');
        if (phEl) phEl.style.top = '110px';

        this.updateTempOverlay();
        this.updatePhOverlay();
    },

    updateTempOverlay: function () {
        const pct = (this.temp / 80) * 100;
        const marker = document.getElementById('temp-marker');
        const readout = document.getElementById('temp-readout-val');
        if (marker)  marker.style.left = pct + '%';
        if (readout) readout.textContent = this.temp + '°C';

        const alert = document.getElementById('denatured-alert');
        if (alert) alert.classList.toggle('show', this.isDenatured());
    },

    updatePhOverlay: function () {
        const pct = ((this.ph - 1) / 13) * 100;
        const marker = document.getElementById('ph-marker');
        const readout = document.getElementById('ph-readout-val');
        if (marker)  marker.style.left = pct + '%';
        if (readout) readout.textContent = this.ph.toFixed(1);
    },

    setupChart: function () {
        const ctx = document.getElementById('data-chart').getContext('2d');
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Produkter',
                    borderColor: '#34d399',
                    backgroundColor: 'rgba(52, 211, 153, 0.08)',
                    data: [],
                    fill: true,
                    tension: 0.4,
                    pointRadius: 2,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                plugins: {
                    legend: { labels: { color: '#94a3b8', font: { size: 11 } } }
                },
                scales: {
                    x: {
                        title: { display: true, text: 'Tid (s)', color: '#64748b' },
                        ticks: { color: '#64748b', font: { size: 10 } },
                        grid: { color: 'rgba(255,255,255,0.05)' }
                    },
                    y: {
                        title: { display: true, text: 'Antal produkter', color: '#64748b' },
                        ticks: { color: '#64748b', font: { size: 10 } },
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        beginAtZero: true
                    }
                }
            }
        });
    },

    reset: function () {
        const engine = this.engineRef;
        this.teardown();
        document.getElementById('canvas-overlay').innerHTML = '';
        engine.clearWorld();
        this.init(engine);
    },

    spawnSystem: function () {
        const world = this.engineRef.world;
        const w = this.engineRef.width;
        const h = this.engineRef.height;

        for (let i = 0; i < 5; i++) {
            const enzyme = Bodies.circle(
                Math.random() * (w - 100) + 50,
                Math.random() * (h - 100) + 50,
                24, {
                label: 'enzyme',
                render: { fillStyle: '#fb923c', strokeStyle: '#ea580c', lineWidth: 2 },
                restitution: 1
            });
            enzyme.glowColor = '#fb923c';
            Body.setVelocity(enzyme, {
                x: (Math.random() - 0.5) * 6,
                y: (Math.random() - 0.5) * 6
            });
            Composite.add(world, enzyme);
        }

        for (let i = 0; i < 55; i++) {
            const sub = Bodies.circle(
                Math.random() * (w - 80) + 40,
                Math.random() * (h - 80) + 40,
                7, {
                label: 'substrate',
                render: { fillStyle: '#60a5fa', strokeStyle: '#3b82f6', lineWidth: 1 },
                restitution: 1,
                frictionAir: 0
            });
            Composite.add(world, sub);
        }
    },

    simLoop: function () {
        const all      = Composite.allBodies(this.engineRef.world);
        const enzymes  = all.filter(b => b.label === 'enzyme');
        const substrates = all.filter(b => b.label === 'substrate');
        const denatured = this.isDenatured();

        const speedFactor = denatured ? 0.5 : Math.max(0.8, this.temp / 20);

        enzymes.forEach(e => {
            e.glowColor = denatured ? '#6b7280' : '#fb923c';
            if (e.speed < speedFactor) {
                const s = speedFactor / (e.speed || 1);
                Body.setVelocity(e, { x: e.velocity.x * s, y: e.velocity.y * s });
            }
        });

        for (let enzyme of enzymes) {
            for (let sub of substrates) {
                if (Matter.Bounds.overlaps(enzyme.bounds, sub.bounds)) {
                    if (Matter.Collision.collides(enzyme, sub)) {
                        this.tryReaction(enzyme, sub);
                    }
                }
            }
        }
    },

    tryReaction: function (enzyme, sub) {
        if (this.isDenatured()) return;

        const optPH   = 7.0, sigma = 1.5;
        const phAct   = Math.exp(-Math.pow(this.ph - optPH, 2) / (2 * sigma * sigma));
        const tempAct = Math.min(2.0, this.temp / 37.0);
        const prob    = phAct * tempAct * 0.12;

        if (Math.random() < prob) {
            sub.label = 'product';
            sub.render.fillStyle  = '#34d399';
            sub.render.strokeStyle = '#059669';
            this.productCount++;
        }
    },

    isDenatured: function () { return this.temp > 55; },

    updateEnzymeVisuals: function () {
        const enzymes = Composite.allBodies(this.engineRef.world).filter(b => b.label === 'enzyme');
        const dead = this.isDenatured();
        enzymes.forEach(e => {
            e.render.fillStyle = dead ? '#6b7280' : '#fb923c';
            e.glowColor        = dead ? null       : '#fb923c';
        });
    },

    updateGraph: function () {
        if (!this.chart) return;
        const t    = Math.floor((Date.now() - this.startTime) / 1000);
        const rate = this.productCount - this.lastProductCount;
        this.lastProductCount = this.productCount;

        const el = document.getElementById('rate-val');
        if (el) el.textContent = rate;

        this.chart.data.labels.push(t);
        this.chart.data.datasets[0].data.push(this.productCount);
        if (this.chart.data.labels.length > 22) {
            this.chart.data.labels.shift();
            this.chart.data.datasets[0].data.shift();
        }
        this.chart.update();
    }
};

window.KineticsModule = KineticsModule;
