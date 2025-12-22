// bio-glass/js/glycolysis.js

const GlycolysisModule = {
    engineRef: null,
    updateLoop: null,
    glucoseTimer: null,

    // Game State
    atp: 2, // Start with investment money
    stepsCompleted: 0,

    init: function (bioEngine) {
        this.engineRef = bioEngine;
        this.setupControls();
        this.setupStations();

        bioEngine.setFluidViscosity(0.08); // High viscosity for cytoplasm

        // Spawn Glucose periodically
        this.glucoseTimer = setInterval(() => this.spawnGlucose(), 2000);

        this.updateLoop = () => this.simLoop();
        Events.on(bioEngine.engine, 'beforeUpdate', this.updateLoop);
    },

    teardown: function () {
        if (this.engineRef && this.updateLoop) {
            Events.off(this.engineRef.engine, 'beforeUpdate', this.updateLoop);
        }
        clearInterval(this.glucoseTimer);
        this.engineRef = null;
    },

    setupControls: function () {
        const panel = document.getElementById('controls-panel');
        panel.innerHTML = `
            <h3>Glykolyse Management</h3>
            <div style="background: #e3f2fd; padding:10px; border-radius:5px; text-align:center;">
                <h4>ATP Balance</h4>
                <div style="font-size: 2rem; font-weight:bold; color:#1565C0" id="atp-counter">2</div>
            </div>
            <div style="font-size: 0.9em; margin-top:15px; color:#555;">
                <p><strong>Step 1 & 3:</strong> Koster ATP (Investering).</p>
                <p><strong>Step 7 & 10:</strong> Giver ATP (Payoff).</p>
                <p><strong>PFK-1 (Step 3):</strong> Stopper hvis masser af ATP (Feedback hæmning).</p>
            </div>
            <button onclick="GlycolysisModule.reset()" style="margin-top:20px; width:100%;">Genstart</button>
        `;
    },

    reset: function () {
        this.atp = 2;
        this.engineRef.clearWorld();
        this.teardown();
        this.init(this.engineRef);
        this.updateATPUI();
    },

    setupStations: function () {
        // Create 10 static sensors representing the enzymes
        // Snake path down the screen
        const path = [
            { x: 100, y: 100, label: 'Hexokinase' },
            { x: 250, y: 100, label: 'Isomerase' },
            { x: 400, y: 100, label: 'PFK-1' },
            { x: 550, y: 150, label: 'Aldolase' },
            { x: 550, y: 300, label: 'Isomerase' },
            { x: 400, y: 350, label: 'GAPDH' },
            { x: 250, y: 350, label: 'PGK' },
            { x: 100, y: 350, label: 'Mutase' },
            { x: 100, y: 500, label: 'Enolase' },
            { x: 250, y: 500, label: 'Pyruvate Kinase' }
        ];

        path.forEach((p, idx) => {
            const station = Bodies.circle(p.x, p.y, 40, {
                isStatic: true,
                isSensor: true,
                label: 'station_' + idx,
                render: {
                    fillStyle: 'rgba(0,0,0,0.1)',
                    strokeStyle: '#333',
                    lineWidth: 1
                }
            });
            // Add Label Text (using custom render logic or CSS? 
            // Matter.js render is simple. We rely on the layout being obvious or module info).
            // Let's rely on flow.
            Composite.add(this.engineRef.world, station);
        });

        this.path = path; // Store for vector calc
    },

    spawnGlucose: function () {
        const g = Bodies.polygon(50, 50, 6, 12, {
            label: 'metabolite',
            stepIndex: 0, // Starts at step 0
            render: { fillStyle: '#E91E63' }, // Pink
            frictionAir: 0.05
        });
        Composite.add(this.engineRef.world, g);
    },

    simLoop: function () {
        const metabolites = Composite.allBodies(this.engineRef.world).filter(b => b.label === 'metabolite');
        const pfkInhibited = this.atp > 10; // Feedback inhibition threshold

        // Visualize PFK status
        const pfkBody = Composite.allBodies(this.engineRef.world).find(b => b.label === 'station_2'); // PFK is idx 2
        if (pfkBody) {
            pfkBody.render.fillStyle = pfkInhibited ? 'rgba(244, 67, 54, 0.3)' : 'rgba(76, 175, 80, 0.3)';
        }

        metabolites.forEach(m => {
            const currentCtx = m.stepIndex;
            if (currentCtx >= this.path.length) {
                // Done, remove
                Composite.remove(this.engineRef.world, m);
                return;
            }

            const target = this.path[currentCtx];

            // Move towards target
            const dx = target.x - m.position.x;
            const dy = target.y - m.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 5) {
                // Normalize and apply force
                Body.applyForce(m, m.position, { x: dx * 0.0002, y: dy * 0.0002 });
            } else {
                // Reached Station! Process logic
                this.processStation(m, currentCtx, pfkInhibited);
            }
        });
    },

    processStation: function (molecule, stepIdx, pfkInhibited) {
        // Regulation Logic

        // PFK-1 (Step 2->3)
        if (stepIdx === 2 && pfkInhibited) {
            // Blocked! Bounce away or just wait?
            // Let's just push it back slightly
            Body.setVelocity(molecule, { x: -2, y: 0 });
            return;
        }

        // Energy Investment (Step 0 & 2)
        if (stepIdx === 0 || stepIdx === 2) {
            if (this.atp > 0) {
                this.atp--;
                this.updateATPUI();
                this.advance(molecule);
            } else {
                // No energy to invest! Stuck.
                molecule.render.fillStyle = '#ccc'; // Grey
            }
        }
        // Energy Payoff (Step 6 & 9) (Indices 6 and 9 correspond to PGK and PK)
        else if (stepIdx === 6 || stepIdx === 9) {
            this.atp += 2; // Net gain logic simplified
            this.updateATPUI();
            this.advance(molecule);
        }
        else {
            // Normal step
            this.advance(molecule);
        }
    },

    advance: function (molecule) {
        molecule.stepIndex++;
        // Visual change
        molecule.render.fillStyle = this.getColorForStep(molecule.stepIndex);
        // Push it towards next
        Body.setPosition(molecule, this.path[Math.min(molecule.stepIndex, 9)]);
        // Teleport slightly to avoid double trig
    },

    getColorForStep: function (step) {
        // Gradient from Pink to Purple
        const colors = ['#F48FB1', '#F06292', '#EC407A', '#E91E63', '#D81B60', '#C2185B', '#AD1457', '#880E4F', '#4A148C', '#311B92'];
        return colors[step] || '#000';
    },

    updateATPUI: function () {
        const el = document.getElementById('atp-counter');
        if (el) el.textContent = this.atp;
    }
};

window.GlycolysisModule = GlycolysisModule;
