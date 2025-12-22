// Module aliases
const Engine = Matter.Engine,
    Render = Matter.Render,
    Runner = Matter.Runner,
    Bodies = Matter.Bodies,
    Composite = Matter.Composite,
    Composites = Matter.Composites,
    Constraint = Matter.Constraint,
    Events = Matter.Events,
    Body = Matter.Body;

// Simulation Config
const WIDTH = 800; // Will adjust to container
const HEIGHT = 600;
const WALL_THICKNESS = 60;

class StarchChain {
    constructor(x, y, cols) {
        this.group = Body.nextGroup(true);
        // Hexagon radius approx 15
        this.stack = Composites.stack(x, y, cols, 1, 10, 10, (bx, by) => {
            return Bodies.polygon(bx, by, 6, 15, {
                collisionFilter: { group: this.group },
                render: { fillStyle: '#8CC63F' }, // Greenish for starch
                label: 'starch'
            });
        });

        // Add chain constraints
        Composites.chain(this.stack, 0.5, 0, -0.5, 0, {
            stiffness: 0.8,
            length: 2,
            render: { type: 'line' }
        });
    }

    addToWorld(world) {
        Composite.add(world, this.stack);
    }
}

class Amylase {
    constructor(x, y) {
        // Sensor property means it triggers collision events but doesn't physically react for us
        // However, user asked for it to bounce off walls but pass through starch.
        // We can use collision categories for this.
        
        const defaultCategory = 0x0001,
              amylaseCategory = 0x0002,
              starchCategory = 0x0004,
              wallCategory = 0x0001; // Walls are usually default

        this.body = Bodies.circle(x, y, 30, {
            restitution: 1, // Bouncy
            friction: 0,
            frictionAir: 0,
            render: { fillStyle: '#FFD700' }, // Gold/Yellow
            label: 'amylase',
            collisionFilter: {
                category: amylaseCategory,
                mask: wallCategory // Only collide with walls physically
            }
        });
        
        // Give it initial velocity
        Body.setVelocity(this.body, { x: 5, y: 4 });
    }

    addToWorld(world) {
        Composite.add(world, this.body);
    }
}

// Main Setup
const container = document.getElementById('canvas-container');
const engine = Engine.create();
const world = engine.world;
// Disable gravity for a "floating" molecular feel or keep it? 
// User didn't specify, but molecules usually float. Let's keep gravity low or zero.
engine.gravity.y = 0; 
engine.gravity.x = 0;

const render = Render.create({
    element: container,
    engine: engine,
    options: {
        width: container.clientWidth,
        height: HEIGHT,
        background: '#fcfcfc',
        wireframes: false
    }
});

// Walls
const walls = [
    Bodies.rectangle(container.clientWidth / 2, -WALL_THICKNESS/2, container.clientWidth, WALL_THICKNESS, { isStatic: true }), // Top
    Bodies.rectangle(container.clientWidth / 2, HEIGHT + WALL_THICKNESS/2, container.clientWidth, WALL_THICKNESS, { isStatic: true }), // Bottom
    Bodies.rectangle(container.clientWidth + WALL_THICKNESS/2, HEIGHT/2, WALL_THICKNESS, HEIGHT, { isStatic: true }), // Right
    Bodies.rectangle(-WALL_THICKNESS/2, HEIGHT/2, WALL_THICKNESS, HEIGHT, { isStatic: true }) // Left
];

Composite.add(world, walls);

// Starch
// Make sure starches have a category that Amylase's mask DOES NOT include, but detector can still see?
// Matter.js collision events fire even if physical response is disabled? 
// Actually, if mask doesn't match, 'collisionStart' might not fire.
// To get "sensor" behavior (overlap allowed but event fired), we can use `isSensor: true` on the Amylase 
// OR carefully manage masks. 
// If `amylase` has NO mask for `starch`, they pass through.
// But we need the event. Matter.js `Detector` or checking bounds manually in `beforeUpdate` is robust.
// Let's rely on manual check or broadphase if filters exclude each other. 
// Easier approach: Give Amylase `isSensor: true`. It will pass through EVERYTHING.
// BUT user wants it to bounce off walls. 
// Solution: Compound body? Or just check collisions manually for starch.
// Let's use the Category/Mask approach.
// Amylase Mask = Walls. (Collides with walls).
// Starch Category = StarchCat.
// Amylase Category = AmylaseCat.
// By default simpler: Starch bodies are normal. Amylase collides with walls. Amylase does NOT collide with starch physically.
// We can simply check for overlaps manually every frame for the "cutting". 
// Or use `Matter.Query.point` or `Matter.Detector`.

const starch = new StarchChain(200, 300, 20);
starch.addToWorld(world);

const amylase = new Amylase(100, 100);
amylase.addToWorld(world);

// Input handling
const phSlider = document.getElementById('ph-slider');
const phDisplay = document.getElementById('ph-display');
const phStatus = document.getElementById('ph-status');

let currentPH = 7.0;

function updatePHUI() {
    currentPH = parseFloat(phSlider.value);
    phDisplay.textContent = currentPH.toFixed(1);
    
    if (currentPH >= 6 && currentPH <= 8) {
        phStatus.textContent = "Aktivt (Optimalt)";
        phStatus.style.color = "green";
    } else {
        phStatus.textContent = "Inaktivt (Denatureret/Hæmmet)";
        phStatus.style.color = "red";
    }
}

phSlider.addEventListener('input', updatePHUI);


// Cutting Logic
Events.on(engine, 'beforeUpdate', function() {
    // Keep amylase moving at constant speed
    const speed = 6;
    Body.setSpeed(amylase.body, speed);
    
    // Cutting
    if (currentPH >= 6 && currentPH <= 8) {
        const bodies = Composite.allBodies(starch.stack);
        
        // Simple bounding box check first, then distance
        for (let i = 0; i < bodies.length; i++) {
            const body = bodies[i];
            if (Matter.Bounds.overlaps(amylase.body.bounds, body.bounds)) {
                // Detailed check
                if (Matter.Collision.collides(amylase.body, body)) {
                    // Find constraints attached to this body
                    const allConstraints = Composite.allConstraints(starch.stack);
                    const attachedConstraints = allConstraints.filter(c => c.bodyA === body || c.bodyB === body);
                    
                    attachedConstraints.forEach(c => {
                        Composite.remove(starch.stack, c);
                    });
                }
            }
        }
    }
});

Render.run(render);
const runner = Runner.create();
Runner.run(runner, engine);

// Update render config on resize
window.addEventListener('resize', () => {
    render.canvas.width = container.clientWidth;
});
