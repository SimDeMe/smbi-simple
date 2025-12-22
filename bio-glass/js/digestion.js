// bio-glass/js/digestion.js

const DigestionModule = {
    engineRef: null,
    updateLoop: null,
    phValue: 7.0,

    init: function (bioEngine) {
        this.engineRef = bioEngine;
        this.setupControls();
        this.spawnStarch(200, 200);
        this.spawnProtein(200, 400);
        this.spawnEnzymes();

        // Fluid resistance for cellular feel
        bioEngine.setFluidViscosity(0.05);

        // Bind update loop for Collision Logic
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
        const panel = document.getElementById('controls-panel');
        panel.innerHTML = `
            <h3>Indstillinger</h3>
            <div class="control-group">
                <label>pH Værdi: <span id="ph-val">7.0</span></label>
                <input type="range" id="ph-input" min="1" max="14" step="0.1" value="7.0">
            </div>
            <div class="control-group">
               <button onclick="DigestionModule.reset()">Nulstil Simulation</button>
            </div>
            <div style="font-size: 0.9em; color: #666; margin-top: 10px;">
                <p><strong>Amylase</strong> (Gul): Virker ved pH 6-8.</p>
                <p><strong>Pepsin</strong> (Rød): Virker ved pH 1-3.</p>
            </div>
        `;

        const input = document.getElementById('ph-input');
        input.addEventListener('input', (e) => {
            this.phValue = parseFloat(e.target.value);
            document.getElementById('ph-val').textContent = this.phValue.toFixed(1);
        });
    },

    reset: function () {
        this.engineRef.clearWorld();
        this.init(this.engineRef);
    },

    spawnStarch: function (x, y) {
        // Starch: Chain of Hexagons
        const group = Body.nextGroup(true);
        const starchStack = Composites.stack(x, y, 15, 1, 5, 5, (bx, by) => {
            return Bodies.polygon(bx, by, 6, 15, {
                collisionFilter: { group: group, category: 0x0002 }, // Cat 2 = Substrate
                render: { fillStyle: '#8CC63F', strokeStyle: '#669900', lineWidth: 2 },
                label: 'starch'
            });
        });

        Composites.chain(starchStack, 0.5, 0, -0.5, 0, { stiffness: 0.9, length: 2 });
        Composite.add(this.engineRef.world, starchStack);
    },

    spawnProtein: function (x, y) {
        // Protein: Chain of diverse shapes
        const group = Body.nextGroup(true);
        const shapes = ['circle', 'rectangle', 'trapezoid'];
        const proteinStack = Composites.stack(x, y, 15, 1, 5, 5, (bx, by, i) => {
            const shapeType = shapes[i % shapes.length];
            let body;
            if (shapeType === 'circle') body = Bodies.circle(bx, by, 12);
            else if (shapeType === 'rectangle') body = Bodies.rectangle(bx, by, 25, 25);
            else body = Bodies.trapezoid(bx, by, 25, 25, 0.5);

            body.collisionFilter = { group: group, category: 0x0002 }; // Cat 2 = Substrate
            body.render.fillStyle = '#9C27B0';
            body.render.strokeStyle = '#7B1FA2';
            body.render.lineWidth = 2;
            body.label = 'protein';
            return body;
        });

        Composites.chain(proteinStack, 0.5, 0, -0.5, 0, { stiffness: 0.8, length: 5 });
        Composite.add(this.engineRef.world, proteinStack);
    },

    spawnEnzymes: function () {
        // Amylase (Digests Starch)
        const amylase = Bodies.circle(100, 100, 30, {
            render: { fillStyle: '#FFEB3B', strokeStyle: '#FBC02D', lineWidth: 3 },
            frictionAir: 0.02,
            restitution: 1,
            label: 'amylase',
            collisionFilter: { mask: 0x0001 | 0x0002 } // Walls | Substrates
        });
        Body.setVelocity(amylase, { x: 5, y: 3 });

        // Pepsin (Digests Protein)
        const pepsin = Bodies.circle(100, 500, 30, {
            render: { fillStyle: '#F44336', strokeStyle: '#D32F2F', lineWidth: 3 },
            frictionAir: 0.02,
            restitution: 1,
            label: 'pepsin',
            collisionFilter: { mask: 0x0001 | 0x0002 }
        });
        Body.setVelocity(pepsin, { x: 5, y: -3 });

        Composite.add(this.engineRef.world, [amylase, pepsin]);
    },

    checkCollisions: function () {
        // Broadphase manual check for "Sensor" behavior
        // We iterate enzymes and check overlaps
        const enzymes = Composite.allBodies(this.engineRef.world).filter(b => b.label === 'amylase' || b.label === 'pepsin');
        const substrates = Composite.allBodies(this.engineRef.world).filter(b => b.label === 'starch' || b.label === 'protein');

        // Keep enzymes moving
        enzymes.forEach(e => {
            if (e.speed < 2) {
                const vel = Vector.rotate({ x: 3, y: 0 }, Math.random() * Math.PI * 2);
                Body.setVelocity(e, vel);
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
        // 1. Amylase + Starch (pH 6-8)
        if (enzyme.label === 'amylase' && substrate.label === 'starch') {
            if (this.phValue >= 6 && this.phValue <= 8) {
                this.cutConstraint(substrate);
            }
        }

        // 2. Pepsin + Protein (pH 1-3)
        if (enzyme.label === 'pepsin' && substrate.label === 'protein') {
            if (this.phValue >= 1 && this.phValue <= 3) {
                this.cutConstraint(substrate);
            }
        }
    },

    cutConstraint: function (body) {
        // Find constraints attached to this body
        const constraints = Composite.allConstraints(this.engineRef.world);
        const attached = constraints.filter(c => c.bodyA === body || c.bodyB === body);

        attached.forEach(c => {
            Composite.remove(this.engineRef.world, c);
            // Visual feedback? maybe flash the body
            body.render.fillStyle = '#ffffff';
            setTimeout(() => {
                if (body.label === 'starch') body.render.fillStyle = '#8CC63F';
                if (body.label === 'protein') body.render.fillStyle = '#9C27B0';
            }, 200);
        });
    }
};

window.DigestionModule = DigestionModule;
