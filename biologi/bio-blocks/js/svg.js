/* =====================================================================
   Små SVG-byggesten. Ingen viden om molekyler — kun elementer.
   ===================================================================== */

export const SVG_NS = "http://www.w3.org/2000/svg";

export function sub(parent) {
    const g = document.createElementNS(SVG_NS, 'g');
    parent.appendChild(g);
    return g;
}

export function text(str, x, y, cls) {
    const t = document.createElementNS(SVG_NS, 'text');
    t.textContent = str;
    t.setAttribute('x', x);
    t.setAttribute('y', y);
    if (cls) t.setAttribute('class', cls);
    return t;
}

export function line(x1, y1, x2, y2, cls) {
    const l = document.createElementNS(SVG_NS, 'line');
    l.setAttribute('x1', x1); l.setAttribute('y1', y1);
    l.setAttribute('x2', x2); l.setAttribute('y2', y2);
    l.setAttribute('class', cls);
    return l;
}

export function rect(x, y, w, h, fill) {
    const r = document.createElementNS(SVG_NS, 'rect');
    r.setAttribute('x', x); r.setAttribute('y', y);
    r.setAttribute('width', w); r.setAttribute('height', h);
    if (fill) r.setAttribute('fill', fill);
    return r;
}

export function badge(cx, cy, glyph, cls, action, tip) {
    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('class', `badge ${cls}`);
    g.dataset.action = action;

    const c = document.createElementNS(SVG_NS, 'circle');
    c.setAttribute('cx', cx); c.setAttribute('cy', cy); c.setAttribute('r', 15);
    g.appendChild(c);
    g.appendChild(text(glyph, cx, cy + 5, ''));

    const title = document.createElementNS(SVG_NS, 'title');
    title.textContent = tip;
    g.appendChild(title);
    return g;
}
