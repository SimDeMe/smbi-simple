// bio-glass/js/digestion.js

const DigestionModule = {
    engineRef: null,
    updateLoop: null,
    phValue: 7.0,
    amylaseCuts: 0,
    pepsinCuts: 0,

    init: function (bioEngine) {
        this.engineRef = bioEngine;
        this.amylaseCuts = 0;
        this.pepsinCuts  = 0;

        const w = bioEngine.width;
        const h = bioEngine.height;

        this.setupControls();
        this.setupOverlay();

        this.spawnStarch(w * 0.12, h * 0.25);
        this.spawnProtein(w * 0.12, h * 0.65);
        this.spawnEnzymes(w, h);

        bioEngine.setFluidViscosity(0.05);

        this.updateLoop = () => this.checkCollisions();
        Events.on(bioEngine.engine, 'beforeUpdate', this.updateLoop);
    },

    teardown: function () {
        if (this.engineRef && this.updateLoop) {
            Events.off(this.engineRef.engine, 'beforeUpdate', this.updateLoop);
        }
        this.engineRef = null;
    },

    setupControls: function () {
        document.getElementById('controls-panel').innerHTML = `
            <h3>Indstillinger</h3>

            <div class="control-group">
                <div class="control-label">
                    <span>pH Værdi</span>
                    <span class="control-value" id="ph-val">7.0</span>
                </div>
                <input type="range" id="ph-input" min="1" max="14" step="0.1" value="7.0">
            </div>

            <div class="control-group">
                <button class="btn-reset" onclick="DigestionModule.reset()">↺ Nulstil Simulation</button>
            </div>

            <div class="info-card">
                <div class="info-row">
                    <span class="info-dot" style="background:#fbbf24; color:#fbbf24;"></span>
                    <span><strong>Amylase</strong> — klipper stivelse ved pH 6–8</span>
                </div>
                <div class="info-row">
                    <span class="info-dot" style="background:#f87171; color:#f87171;"></span>
                    <span><strong>Pepsin</strong> — klipper protein ved pH 1–3</span>
                </div>
                <div class="info-row">
                    <span class="info-dot" style="background:#4ade80; color:#4ade80;"></span>
                    <span><strong>Stivelse</strong> — kæde af hexagoner</span>
                </div>
                <div class="info-row">
                    <span class="info-dot" style="background:#c084fc; color:#c084fc;"></span>
                    <span><strong>Protein</strong> — kæde af former</span>
                </div>
            </div>
        `;

        document.getElementById('ph-input').addEventListener('input', (e) => {
            this.phValue = parseFloat(e.target.value);
            document.getElementById('ph-val').textContent = this.phValue.toFixed(1);
            this.updatePhOverlay();
        });
    },

    setupOverlay: function () {
        const overlay = document.getElementById('canvas-overlay');

        // pH strip top-right
        overlay.innerHTML = `
            <div class="ph-indicator">
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

            <div class="reaction-counters">
                <div class="counter-chip">
                    <span class="counter-dot" style="background:#fbbf24; box-shadow: 0 0 6px #fbbf24;"></span>
                    Amylase cuts
                    <span class="counter-count" id="amylase-count">0</span>
                </div>
                <div class="counter-chip">
                    <span class="counter-dot" style="background:#f87171; box-shadow: 0 0 6px #f87171;"></span>
                    Pepsin cuts
                    <span class="counter-count" id="pepsin-count">0</span>
                </div>
            </div>
        `;

        this.updatePhOverlay();
    },

    updatePhOverlay: function () {
        const pct = ((this.phValue - 1) / 13) * 100;
        const marker = document.getElementById('ph-marker');
        const readout = document.getElementById('ph-readout-val');
        if (marker)  marker.style.left = pct + '%';
        if (readout) readout.textContent = this.phValue.toFixed(1);
    },

    reset: function () {
        this.engineRef.clearWorld();
        document.getElementById('canvas-overlay').innerHTML = '';
        this.init(this.engineRef);
    },

    spawnStarch: function (x, y) {
        const group = Body.nextGroup(true);
        const stack = Composites.stack(x, y, 14, 1, 6, 6, (bx, by) =>
            Bodies.polygon(bx, by, 6, 14, {
                collisionFilter: { group, category: 0x0002 },
                render: { fillStyle: '#4ade80', strokeStyle: '#16a34a', lineWidth: 2 },
                label: 'starch'
            })
        );
        Composites.chain(stack, 0.5, 0, -0.5, 0, { stiffness: 0.9, length: 2 });
        Composite.add(this.engineRef.world, stack);
    },

    spawnProtein: function (x, y) {
        const group = Body.nextGroup(true);
        const shapes = ['circle', 'rectangle', 'trapezoid'];
        const stack = Composites.stack(x, y, 14, 1, 6, 6, (bx, by, i) => {
            const t = shapes[i % 3];
            let b;
            if (t === 'circle')    b = Bodies.circle(bx, by, 11);
            else if (t === 'rectangle') b = Bodies.rectangle(bx, by, 22, 22);
            else                   b = Bodies.trapezoid(bx, by, 22, 22, 0.5);
            b.collisionFilter = { group, category: 0x0002 };
            b.render.fillStyle  = '#c084fc';
            b.render.strokeStyle = '#7c3aed';
            b.render.lineWidth  = 2;
            b.label = 'protein';
            return b;
        });
        Composites.chain(stack, 0.5, 0, -0.5, 0, { stiffness: 0.8, length: 5 });
        Composite.add(this.engineRef.world, stack);
    },

    spawnEnzymes: function (w, h) {
        const amylase = Bodies.circle(w * 0.7, h * 0.2, 28, {
            render: { fillStyle: '#fbbf24', strokeStyle: '#d97706', lineWidth: 3 },
            frictionAir: 0.02,
            restitution: 1,
            label: 'amylase',
            collisionFilter: { mask: 0x0001 | 0x0002 }
        });
        amylase.glowColor = '#fbbf24';
        Body.setVelocity(amylase, { x: -4, y: 3 });

        const pepsin = Bodies.circle(w * 0.7, h * 0.75, 28, {
            render: { fillStyle: '#f87171', strokeStyle: '#dc2626', lineWidth: 3 },
            frictionAir: 0.02,
            restitution: 1,
            label: 'pepsin',
            collisionFilter: { mask: 0x0001 | 0x0002 }
        });
        pepsin.glowColor = '#f87171';
        Body.setVelocity(pepsin, { x: -4, y: -3 });

        Composite.add(this.engineRef.world, [amylase, pepsin]);
    },

    checkCollisions: function () {
        const all = Composite.allBodies(this.engineRef.world);
        const enzymes    = all.filter(b => b.label === 'amylase' || b.label === 'pepsin');
        const substrates = all.filter(b => b.label === 'starch'  || b.label === 'protein');

        // Keep enzymes bouncing
        enzymes.forEach(e => {
            if (e.speed < 2.5) {
                const v = Vector.rotate({ x: 4, y: 0 }, Math.random() * Math.PI * 2);
                Body.setVelocity(e, v);
            }
        });

        for (let enzyme of enzymes) {
            for (let sub of substrates) {
                if (Matter.Bounds.overlaps(enzyme.bounds, sub.bounds)) {
                    if (Matter.Collision.collides(enzyme, sub)) {
                        this.processReaction(enzyme, sub);
                    }
                }
            }
        }
    },

    processReaction: function (enzyme, substrate) {
        if (enzyme.label === 'amylase' && substrate.label === 'starch') {
            if (this.phValue >= 6 && this.phValue <= 8) {
                this.cutConstraint(substrate, 'amylase');
            }
        }
        if (enzyme.label === 'pepsin' && substrate.label === 'protein') {
            if (this.phValue >= 1 && this.phValue <= 3) {
                this.cutConstraint(substrate, 'pepsin');
            }
        }
    },

    cutConstraint: function (body, enzyme) {
        const constraints = Composite.allConstraints(this.engineRef.world);
        const attached = constraints.filter(c => c.bodyA === body || c.bodyB === body);
        if (attached.length === 0) return;

        attached.forEach(c => {
            Composite.remove(this.engineRef.world, c);
        });

        // Flash white then restore color
        const orig = body.render.fillStyle;
        body.render.fillStyle = '#ffffff';
        setTimeout(() => { body.render.fillStyle = orig; }, 160);

        // Update counters
        if (enzyme === 'amylase') {
            this.amylaseCuts++;
            const el = document.getElementById('amylase-count');
            if (el) el.textContent = this.amylaseCuts;
        } else {
            this.pepsinCuts++;
            const el = document.getElementById('pepsin-count');
            if (el) el.textContent = this.pepsinCuts;
        }
    }
};

window.DigestionModule = DigestionModule;
