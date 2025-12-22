// bio-glass/js/kinetics.js

const KineticsModule = {
    engineRef: null,
    updateLoop: null,
    chart: null,

    // Simulation state
    temp: 37, // Celsius
    ph: 7.0,
    productCount: 0,
    startTime: 0,

    init: function (bioEngine) {
        this.engineRef = bioEngine;
        this.setupControls();
        this.setupChart();
        this.startTime = Date.now();
        this.productCount = 0;

        // Spawn many small substrates + Limited enzymes
        this.spawnSystem();

        bioEngine.setFluidViscosity(0.01);

        this.updateLoop = () => this.simLoop();
        Events.on(bioEngine.engine, 'beforeUpdate', this.updateLoop);

        // Periodically update graph (every 1s)
        this.graphInterval = setInterval(() => this.updateGraph(), 1000);
    },

    teardown: function () {
        if (this.engineRef && this.updateLoop) {
            Events.off(this.engineRef.engine, 'beforeUpdate', this.updateLoop);
        }
        clearInterval(this.graphInterval);
        if (this.chart) this.chart.destroy();
        this.engineRef = null;
    },

    setupControls: function () {
        const panel = document.getElementById('controls-panel');
        panel.innerHTML = `
            <h3>Kinetik Parametre</h3>
            <div class="control-group">
                <label>Temperatur: <span id="temp-val">37</span>°C</label>
                <input type="range" id="temp-input" min="0" max="80" step="1" value="37">
            </div>
            <div class="control-group">
                <label>pH: <span id="ph-val">7.0</span></label>
                <input type="range" id="ph-input" min="1" max="14" step="0.1" value="7.0">
            </div>
            <div class="control-group">
                <button onclick="KineticsModule.reset()">Start Forfra</button>
            </div>
            <p style="font-size:0.8rem">Optimal temp: 37-40°C. <br>Denaturerer ved >50°C.<br>Optimal pH: 7.0</p>
        `;

        document.getElementById('temp-input').addEventListener('input', (e) => {
            this.temp = parseInt(e.target.value);
            document.getElementById('temp-val').textContent = this.temp;
            this.updateEnzymeVisuals();
        });
        document.getElementById('ph-input').addEventListener('input', (e) => {
            this.ph = parseFloat(e.target.value);
            document.getElementById('ph-val').textContent = this.ph.toFixed(1);
        });

        // Show graph container
        document.getElementById('chart-container').style.display = 'block';
    },

    setupChart: function () {
        const ctx = document.getElementById('data-chart').getContext('2d');
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [], // Time
                datasets: [{
                    label: 'Produkt',
                    borderColor: '#4CAF50',
                    data: [],
                    fill: false,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                scales: {
                    x: { title: { display: true, text: 'Tid (s)' } },
                    y: { title: { display: true, text: 'Koncentration' }, beginAtZero: true }
                }
            }
        });
    },

    reset: function () {
        this.engineRef.clearWorld();
        this.teardown(); // clear intervals
        this.init(this.engineRef); // restart
    },

    spawnSystem: function () {
        const world = this.engineRef.world;

        // 5 Enzymes
        for (let i = 0; i < 5; i++) {
            const enzyme = Bodies.circle(Math.random() * 600 + 100, Math.random() * 400 + 100, 25, {
                label: 'enzyme',
                render: { fillStyle: '#FF9800' }, // Orange
                restitution: 1
            });
            Body.setVelocity(enzyme, { x: (Math.random() - 0.5) * 5, y: (Math.random() - 0.5) * 5 });
            Composite.add(world, enzyme);
        }

        // 50 Substrates
        for (let i = 0; i < 50; i++) {
            const sub = Bodies.circle(Math.random() * 600 + 100, Math.random() * 400 + 100, 8, {
                label: 'substrate',
                render: { fillStyle: '#2196F3' }, // Blue
                restitution: 1,
                frictionAir: 0
            });
            Composite.add(world, sub);
        }
    },

    simLoop: function () {
        // Temp affects Speed (Kinetic Energy)
        // But extremely high temp = denaturation (stop)
        // We model denaturation as a probability Factor, not just speed.

        const enzymes = Composite.allBodies(this.engineRef.world).filter(b => b.label === 'enzyme');
        const substrates = Composite.allBodies(this.engineRef.world).filter(b => b.label === 'substrate');

        // Speed regulation
        const speedFactor = Math.max(0.5, this.temp / 20); // Higher temp = faster move

        enzymes.forEach(e => {
            // Keep them moving
            if (e.speed < speedFactor) {
                const currentVel = e.velocity;
                const scale = speedFactor / (e.speed || 1);
                Body.setVelocity(e, { x: currentVel.x * scale, y: currentVel.y * scale });
            }
        });

        // Collision/Reaction Logic
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
        if (this.isDenatured()) return; // Heat dead

        // pH Probability (Gaussian)
        // Activity = e^(-(pH - opt)^2 / (2*sigma^2))
        const optPH = 7.0;
        const sigma = 1.5;
        const phActivity = Math.exp(-Math.pow(this.ph - optPH, 2) / (2 * sigma * sigma));

        // Temp Activation (Chemistry speeds up with temp until denaturation)
        // Simple multiplier: (Temp/37)
        const tempActivity = Math.min(2.0, this.temp / 37.0);

        const totalProb = phActivity * tempActivity * 0.1; // Base chance

        if (Math.random() < totalProb) {
            // Reaction!
            // Convert substrate to product
            sub.label = 'product';
            sub.render.fillStyle = '#4CAF50'; // Green
            this.productCount++;
        }
    },

    isDenatured: function () {
        return this.temp > 55;
    },

    updateEnzymeVisuals: function () {
        const enzymes = Composite.allBodies(this.engineRef.world).filter(b => b.label === 'enzyme');
        enzymes.forEach(e => {
            if (this.isDenatured()) {
                e.render.fillStyle = '#9E9E9E'; // Gray/Dead
            } else {
                e.render.fillStyle = '#FF9800'; // Alive
            }
        });
    },

    updateGraph: function () {
        if (!this.chart) return;

        const time = Math.floor((Date.now() - this.startTime) / 1000);

        this.chart.data.labels.push(time);
        this.chart.data.datasets[0].data.push(this.productCount);

        // Keep only last 20 points
        if (this.chart.data.labels.length > 20) {
            this.chart.data.labels.shift();
            this.chart.data.datasets[0].data.shift();
        }

        this.chart.update();
    }
};

window.KineticsModule = KineticsModule;
