// bio-glass/js/glycolysis.js

const GlycolysisModule = {
    engineRef: null,
    updateLoop: null,
    renderLoop: null,
    glucoseTimer: null,
    path: [],
    atp: 2,
    stepsCompleted: 0,

    // ATP effect per station: negative = cost, positive = gain
    STATION_ATP: [-1, 0, -1, 0, 0, 0, 2, 0, 0, 2],

    init: function (bioEngine) {
        this.engineRef = bioEngine;
        this.atp = 2;
        this.stepsCompleted = 0;

        this.setupControls();
        this.setupPath();
        this.setupStations();
        this.setupOverlay();
        this.setupPathRenderer();

        bioEngine.setFluidViscosity(0.08);

        this.glucoseTimer = setInterval(() => this.spawnGlucose(), 2200);

        this.updateLoop = () => this.simLoop();
        Events.on(bioEngine.engine, 'beforeUpdate', this.updateLoop);

        // Spawn initial glucose immediately
        setTimeout(() => this.spawnGlucose(), 300);
    },

    teardown: function () {
        if (this.engineRef && this.updateLoop) {
            Events.off(this.engineRef.engine, 'beforeUpdate', this.updateLoop);
        }
        if (this.engineRef && this.renderLoop) {
            Events.off(this.engineRef.render, 'afterRender', this.renderLoop);
        }
        clearInterval(this.glucoseTimer);
        this.engineRef = null;
    },

    setupControls: function () {
        document.getElementById('controls-panel').innerHTML = `
            <h3>Glykolyse</h3>

            <div class="control-group">
                <button class="btn-reset" onclick="GlycolysisModule.reset()">↺ Genstart</button>
            </div>

            <div class="info-card">
                <div class="info-row">
                    <span class="info-dot" style="background:#f472b6; color:#f472b6;"></span>
                    <span><strong>Glukose</strong> → Pyruvat (10 trin)</span>
                </div>
                <div class="info-row">
                    <span class="info-dot" style="background:#f87171; color:#f87171;"></span>
                    <span><strong>Trin 1 &amp; 3</strong> — koster 1 ATP</span>
                </div>
                <div class="info-row">
                    <span class="info-dot" style="background:#34d399; color:#34d399;"></span>
                    <span><strong>Trin 7 &amp; 10</strong> — giver 2 ATP</span>
                </div>
                <div class="info-row">
                    <span class="info-dot" style="background:#fbbf24; color:#fbbf24;"></span>
                    <span><strong>PFK-1 (trin 3)</strong> — hæmmes ved højt ATP</span>
                </div>
                <div style="margin-top:8px; font-size:0.72rem; color: var(--text-muted);">
                    Nettoudbytte: 2 ATP pr. glukose
                </div>
            </div>
        `;
    },

    setupPath: function () {
        const w = this.engineRef.width;
        const h = this.engineRef.height;

        // Snake layout: row 1 left→right, row 2 right→left, row 3 left→right
        const labels = [
            'Hexokinase', 'Isomerase', 'PFK-1', 'Aldolase',
            'Triose-P-isomerase', 'GAPDH', 'PGK', 'Mutase',
            'Enolase', 'Pyruvate Kinase'
        ];

        const xs1 = [0.14, 0.34, 0.54, 0.74];
        const xs2 = [0.74, 0.54, 0.34, 0.14];
        const xs3 = [0.14, 0.34];

        this.path = [
            ...xs1.map((x, i) => ({ x: w*x, y: h*0.18, label: labels[i] })),
            ...xs2.map((x, i) => ({ x: w*x, y: h*0.50, label: labels[4+i] })),
            ...xs3.map((x, i) => ({ x: w*x, y: h*0.82, label: labels[8+i] }))
        ];
    },

    setupStations: function () {
        this.path.forEach((p, i) => {
            const atpEffect = this.STATION_ATP[i];
            let color;
            if (atpEffect < 0)      color = 'rgba(248, 113, 113, 0.15)';
            else if (atpEffect > 0) color = 'rgba(52, 211, 153, 0.15)';
            else                    color = 'rgba(148, 163, 184, 0.08)';

            let strokeColor;
            if (atpEffect < 0)      strokeColor = 'rgba(248, 113, 113, 0.5)';
            else if (atpEffect > 0) strokeColor = 'rgba(52, 211, 153, 0.5)';
            else                    strokeColor = 'rgba(148, 163, 184, 0.25)';

            const station = Bodies.circle(p.x, p.y, 38, {
                isStatic: true,
                isSensor: true,
                label: 'station_' + i,
                render: { fillStyle: color, strokeStyle: strokeColor, lineWidth: 2 }
            });
            Composite.add(this.engineRef.world, station);
        });
    },

    setupOverlay: function () {
        const overlay = document.getElementById('canvas-overlay');
        overlay.innerHTML = `
            <div class="atp-display">
                <div class="atp-label">ATP Balance</div>
                <div class="atp-value" id="atp-counter">2</div>
                <div class="atp-status" id="atp-status">Investering fase</div>
            </div>
        `;

        // Station labels — smart horizontal alignment to avoid clipping
        const w = this.engineRef.width;
        this.path.forEach((station, i) => {
            const atpEffect = this.STATION_ATP[i];
            const atpStr = atpEffect < 0 ? ` <span style="color:#f87171">−${Math.abs(atpEffect)} ATP</span>`
                         : atpEffect > 0 ? ` <span style="color:#34d399">+${atpEffect} ATP</span>`
                         : '';

            const label = document.createElement('div');
            label.className = 'station-label';
            label.id = 'station-label-' + i;
            label.innerHTML = `<span class="step-num">${i+1}</span> ${station.label}${atpStr}`;
            label.style.top = (station.y + 46) + 'px';

            const pct = station.x / w;
            if (pct < 0.25) {
                label.style.left = station.x + 'px';
                label.style.transform = 'translateX(0)';
            } else if (pct > 0.65) {
                label.style.left = station.x + 'px';
                label.style.transform = 'translateX(-100%)';
            } else {
                label.style.left = station.x + 'px';
                label.style.transform = 'translateX(-50%)';
            }

            overlay.appendChild(label);
        });

        this.updateATPUI();
    },

    setupPathRenderer: function () {
        this.renderLoop = () => {
            const ctx = this.engineRef.render.context;
            ctx.save();

            // Dashed path lines connecting stations
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
            ctx.lineWidth   = 2;
            ctx.setLineDash([6, 12]);
            ctx.lineCap = 'round';
            ctx.beginPath();
            this.path.forEach((p, i) => {
                if (i === 0) ctx.moveTo(p.x, p.y);
                else         ctx.lineTo(p.x, p.y);
            });
            ctx.stroke();
            ctx.setLineDash([]);

            // Arrow dots at station centers (subtle)
            this.path.forEach((p, i) => {
                const atpEffect = this.STATION_ATP[i];
                let c = 'rgba(148, 163, 184, 0.3)';
                if (atpEffect < 0) c = 'rgba(248, 113, 113, 0.5)';
                if (atpEffect > 0) c = 'rgba(52, 211, 153, 0.5)';

                ctx.beginPath();
                ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
                ctx.fillStyle = c;
                ctx.fill();
            });

            ctx.restore();
        };
        Events.on(this.engineRef.render, 'afterRender', this.renderLoop);
    },

    reset: function () {
        this.teardown();
        document.getElementById('canvas-overlay').innerHTML = '';
        this.engineRef = window.bioEngine;
        this.engineRef.clearWorld();
        this.init(this.engineRef);
    },

    spawnGlucose: function () {
        const g = Bodies.polygon(
            this.path[0].x + (Math.random() - 0.5) * 20,
            this.path[0].y + (Math.random() - 0.5) * 20,
            6, 11, {
            label: 'metabolite',
            render: { fillStyle: '#f472b6', strokeStyle: '#ec4899', lineWidth: 2 },
            frictionAir: 0.06
        });
        g.stepIndex   = 0;
        g.glowColor   = '#f472b6';
        g._processing = false;
        Composite.add(this.engineRef.world, g);
    },

    simLoop: function () {
        const metabolites = Composite.allBodies(this.engineRef.world)
            .filter(b => b.label === 'metabolite');

        const pfkInhibited = this.atp > 10;

        // Update PFK station visual
        const pfkBody = Composite.allBodies(this.engineRef.world)
            .find(b => b.label === 'station_2');
        if (pfkBody) {
            pfkBody.render.fillStyle  = pfkInhibited
                ? 'rgba(239, 68, 68, 0.25)' : 'rgba(248, 113, 113, 0.15)';
            pfkBody.render.strokeStyle = pfkInhibited
                ? 'rgba(239, 68, 68, 0.8)'  : 'rgba(248, 113, 113, 0.5)';
        }

        metabolites.forEach(m => {
            if (m.stepIndex >= this.path.length) {
                Composite.remove(this.engineRef.world, m);
                return;
            }

            const target = this.path[m.stepIndex];
            const dx = target.x - m.position.x;
            const dy = target.y - m.position.y;
            const dist = Math.sqrt(dx*dx + dy*dy);

            if (dist > 8) {
                Body.applyForce(m, m.position, { x: dx * 0.00025, y: dy * 0.00025 });
            } else if (!m._processing) {
                m._processing = true;
                this.processStation(m, m.stepIndex, pfkInhibited);
            }
        });
    },

    processStation: function (molecule, stepIdx, pfkInhibited) {
        // PFK-1 feedback inhibition
        if (stepIdx === 2 && pfkInhibited) {
            molecule.render.fillStyle = '#6b7280';
            molecule.glowColor = null;
            Body.setVelocity(molecule, { x: -1.5, y: 0 });
            setTimeout(() => {
                molecule._processing = false;
                molecule.render.fillStyle = this.getColorForStep(stepIdx);
                molecule.glowColor = '#f472b6';
            }, 1200);
            return;
        }

        const atpEffect = this.STATION_ATP[stepIdx];

        if (atpEffect < 0) {
            if (this.atp <= 0) {
                // Stalled - no ATP
                molecule.render.fillStyle = '#374151';
                molecule.glowColor = null;
                setTimeout(() => { molecule._processing = false; }, 800);
                return;
            }
            this.atp += atpEffect;
            this.updateATPUI();
        } else if (atpEffect > 0) {
            this.atp += atpEffect;
            this.stepsCompleted++;
            this.updateATPUI();
        }

        this.advance(molecule, stepIdx);
    },

    advance: function (molecule, fromStep) {
        molecule.stepIndex++;
        molecule.render.fillStyle  = this.getColorForStep(molecule.stepIndex);
        molecule.render.strokeStyle = molecule.render.fillStyle;
        molecule.glowColor = '#f472b6';

        // Small push towards next station to avoid oscillation
        if (molecule.stepIndex < this.path.length) {
            const next = this.path[molecule.stepIndex];
            const dx = next.x - molecule.position.x;
            const dy = next.y - molecule.position.y;
            const len = Math.sqrt(dx*dx + dy*dy) || 1;
            Body.setVelocity(molecule, { x: dx/len * 2.5, y: dy/len * 2.5 });
        }

        setTimeout(() => { molecule._processing = false; }, 80);
    },

    getColorForStep: function (step) {
        // Pink → indigo gradient across 10 steps
        const colors = [
            '#f472b6', '#e879a6', '#db7099', '#ce678c',
            '#c05e80', '#aa5573', '#944c67', '#7e435a',
            '#68394e', '#5a3166'
        ];
        return colors[Math.min(step, colors.length - 1)] || '#5a3166';
    },

    updateATPUI: function () {
        const counter = document.getElementById('atp-counter');
        const status  = document.getElementById('atp-status');
        if (counter) {
            counter.textContent = this.atp;
            counter.style.textShadow = this.atp > 8
                ? '0 0 30px rgba(251, 191, 36, 0.8)'
                : '0 0 16px rgba(251, 191, 36, 0.45)';
        }
        if (status) {
            if (this.atp > 10) status.textContent = '⚠ PFK-1 hæmmet';
            else if (this.atp > 4) status.textContent = 'Payoff fase';
            else status.textContent = 'Investering fase';
        }
    }
};

window.GlycolysisModule = GlycolysisModule;
