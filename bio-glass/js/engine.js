// bio-glass/js/engine.js

// Expose Matter aliases globally for convenience in modules
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
        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;

        // Setup Matter JS
        this.engine = Engine.create();
        this.world = this.engine.world;

        // Zero gravity by default (suspended in fluid)
        this.engine.gravity.y = 0;
        this.engine.gravity.x = 0;

        this.render = Render.create({
            element: this.container,
            engine: this.engine,
            options: {
                width: this.width,
                height: this.height,
                background: 'transparent', // Let CSS glass effect show
                wireframes: false,
                showAngleIndicator: false
            }
        });

        this.runner = Runner.create();
    }

    start() {
        Render.run(this.render);
        Runner.run(this.runner, this.engine);
        this.createWalls();
    }

    stop() {
        Render.stop(this.render);
        Runner.stop(this.runner);
    }

    clearWorld() {
        Composite.clear(this.world);
        this.engine.events = {}; // Clear old events
        this.createWalls();
    }

    createWalls() {
        const thickness = 60;
        const walls = [
            Bodies.rectangle(this.width / 2, -thickness / 2, this.width, thickness, { isStatic: true, label: 'Wall' }),
            Bodies.rectangle(this.width / 2, this.height + thickness / 2, this.width, thickness, { isStatic: true, label: 'Wall' }),
            Bodies.rectangle(this.width + thickness / 2, this.height / 2, thickness, this.height, { isStatic: true, label: 'Wall' }),
            Bodies.rectangle(-thickness / 2, this.height / 2, thickness, this.height, { isStatic: true, label: 'Wall' })
        ];
        Composite.add(this.world, walls);
    }

    // Utility to set fluid resistance (drag)
    setFluidViscosity(airFriction) {
        Events.on(this.engine, 'beforeUpdate', () => {
            const bodies = Composite.allBodies(this.world);
            for (let body of bodies) {
                if (!body.isStatic) {
                    body.frictionAir = airFriction;
                }
            }
        });
    }
}

window.BioEngine = BioEngine;
