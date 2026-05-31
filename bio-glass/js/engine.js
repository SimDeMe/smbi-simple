// bio-glass/js/engine.js

const Engine = Matter.Engine,
      Render = Matter.Render,
      Runner = Matter.Runner,
      Bodies = Matter.Bodies,
      Composite = Matter.Composite,
      Composites = Matter.Composites,
      Constraint = Matter.Constraint,
      Events = Matter.Events,
      Body = Matter.Body,
      Vector = Matter.Vector;

class BioEngine {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.width  = this.container.clientWidth  || 800;
        this.height = this.container.clientHeight || 560;

        this.engine = Engine.create();
        this.world  = this.engine.world;
        this.engine.gravity.y = 0;
        this.engine.gravity.x = 0;

        this.render = Render.create({
            element: this.container,
            engine: this.engine,
            options: {
                width: this.width,
                height: this.height,
                background: 'transparent',
                wireframes: false,
                showAngleIndicator: false
            }
        });

        this.runner = Runner.create();

        // Glow rendering after each frame
        Events.on(this.render, 'afterRender', () => this._drawGlows());
    }

    start() {
        Render.run(this.render);
        Runner.run(this.runner, this.engine);
        this.createWalls();
    }

    // Call before loading a module so canvas matches current container size
    resize() {
        const w = this.container.clientWidth;
        const h = this.container.clientHeight;
        if (w < 50 || h < 50) return;
        this.width  = w;
        this.height = h;
        this.render.options.width  = w;
        this.render.options.height = h;
        this.render.canvas.width   = w;
        this.render.canvas.height  = h;
    }

    stop() {
        Render.stop(this.render);
        Runner.stop(this.runner);
    }

    clearWorld() {
        Composite.clear(this.world);
        this.engine.events = {};
        this.createWalls();
    }

    createWalls() {
        const t = 60;
        const w = this.width, h = this.height;
        Composite.add(this.world, [
            Bodies.rectangle(w/2,    -t/2,     w, t, { isStatic: true, label: 'Wall', render: { fillStyle: 'transparent' } }),
            Bodies.rectangle(w/2,  h+t/2,      w, t, { isStatic: true, label: 'Wall', render: { fillStyle: 'transparent' } }),
            Bodies.rectangle(w+t/2,  h/2,      t, h, { isStatic: true, label: 'Wall', render: { fillStyle: 'transparent' } }),
            Bodies.rectangle(-t/2,   h/2,      t, h, { isStatic: true, label: 'Wall', render: { fillStyle: 'transparent' } })
        ]);
    }

    setFluidViscosity(airFriction) {
        Events.on(this.engine, 'beforeUpdate', () => {
            for (let body of Composite.allBodies(this.world)) {
                if (!body.isStatic) body.frictionAir = airFriction;
            }
        });
    }

    // Draw additive glow halos for any body with a glowColor property
    _drawGlows() {
        const ctx = this.render.context;
        const bodies = Composite.allBodies(this.world);

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        for (let body of bodies) {
            if (!body.glowColor) continue;
            const r = body.circleRadius;
            if (!r) continue;

            const { x, y } = body.position;
            const grad = ctx.createRadialGradient(x, y, r * 0.6, x, y, r * 3.2);
            grad.addColorStop(0, body.glowColor + 'bb');
            grad.addColorStop(1, body.glowColor + '00');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(x, y, r * 3.2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

window.BioEngine = BioEngine;
