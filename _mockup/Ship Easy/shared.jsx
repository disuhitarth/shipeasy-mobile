// shared.jsx — primitives, icon set, phone shell. Exports to window.
const { useState, useRef, useEffect, createElement: h } = React;

/* ---------- Icons (simple stroke set, Lucide-ish) ---------- */
const ICON_PATHS = {
  home: 'M3 10.5 12 3l9 7.5M5 9.5V20a1 1 0 0 0 1 1h3v-6h6v6h3a1 1 0 0 0 1-1V9.5',
  box: 'M21 8 12 3 3 8m18 0-9 5m9-5v8l-9 5m0-8L3 8m9 5v8M3 8v8l9 5',
  wallet: 'M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2H5a2 2 0 0 0-2 2m0-2v10a2 2 0 0 0 2 2h13a1 1 0 0 0 1-1v-3m0-6v6m0-6a1 1 0 0 0-1-1h-3a2 2 0 1 0 0 6h3a1 1 0 0 0 1-1',
  user: 'M20 21a8 8 0 1 0-16 0M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
  bell: 'M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
  plus: 'M12 5v14M5 12h14',
  chevronRight: 'm9 6 6 6-6 6',
  chevronLeft: 'm15 6-6 6 6 6',
  chevronDown: 'm6 9 6 6 6-6',
  arrowUp: 'M12 19V5M5 12l7-7 7 7',
  arrowRight: 'M5 12h14M12 5l7 7-7 7',
  search: 'M21 21l-4.3-4.3M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z',
  pin: 'M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0ZM15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  check: 'M20 6 9 17l-5-5',
  checkCircle: 'M22 11.1V12a10 10 0 1 1-5.9-9.1M22 4 12 14.01l-3-3',
  scan: 'M4 7V5a1 1 0 0 1 1-1h2M17 4h2a1 1 0 0 1 1 1v2M20 17v2a1 1 0 0 1-1 1h-2M7 20H5a1 1 0 0 1-1-1v-2M4 12h16',
  truck: 'M1 3h15v13H1zM16 8h4l3 3v5h-7M5.5 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM18.5 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
  share: 'M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13',
  copy: 'M9 9h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2V11a2 2 0 0 1 2-2ZM5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 6v6l4 2',
  x: 'M18 6 6 18M6 6l12 12',
  edit: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z',
  globe: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20Z',
  weight: 'M6.5 7h11l2.5 13H4L6.5 7ZM9 7a3 3 0 1 1 6 0',
  ruler: 'M3 9 9 3l12 12-6 6L3 9ZM7 7l2 2M10 10l2 2M13 13l2 2',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  gift: 'M20 12v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7ZM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7Z',
  filePdf: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6ZM14 2v6h6',
  refresh: 'M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5',
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 16v-4M12 8h.01',
  star: 'M12 2l3 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.9 21l1.2-6.8-5-4.9 6.9-1L12 2Z',
  sliders: 'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6',
};

function Icon({ name, size = 22, stroke = 2, color = 'currentColor', style, fill = 'none' }) {
  const d = ICON_PATHS[name];
  return h('svg', {
    width: size, height: size, viewBox: '0 0 24 24', fill,
    stroke: color, strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round',
    style: { flexShrink: 0, ...style },
  }, h('path', { d }));
}

/* ---------- Status bar ---------- */
function StatusBar({ dark }) {
  const col = dark ? '#fff' : '#0A0A0F';
  return h('div', { className: 'statusbar' },
    h('span', { className: 'sb-time', style: { color: col } }, '9:41'),
    h('div', { className: 'sb-right' },
      // signal
      h('svg', { width: 18, height: 12, viewBox: '0 0 18 12', fill: col },
        h('rect', { x: 0, y: 7, width: 3, height: 5, rx: 1 }),
        h('rect', { x: 5, y: 4.5, width: 3, height: 7.5, rx: 1 }),
        h('rect', { x: 10, y: 2, width: 3, height: 10, rx: 1 }),
        h('rect', { x: 15, y: 0, width: 3, height: 12, rx: 1 }),
      ),
      // wifi
      h('svg', { width: 17, height: 12, viewBox: '0 0 17 12', fill: col },
        h('path', { d: 'M8.5 2.2c2.6 0 5 1 6.8 2.6l1.2-1.4A12 12 0 0 0 8.5.2 12 12 0 0 0 .5 3.4l1.2 1.4A10 10 0 0 1 8.5 2.2Zm0 4c1.5 0 2.9.5 4 1.5l1.2-1.4a8 8 0 0 0-10.4 0L4.5 7.7a6 6 0 0 1 4-1.5Zm0 4 2-2.3a3 3 0 0 0-4 0l2 2.3Z' }),
      ),
      // battery
      h('svg', { width: 26, height: 13, viewBox: '0 0 26 13', fill: 'none' },
        h('rect', { x: 0.5, y: 0.5, width: 22, height: 12, rx: 3.5, stroke: col, opacity: 0.4 }),
        h('rect', { x: 2, y: 2, width: 17, height: 9, rx: 2, fill: col }),
        h('rect', { x: 24, y: 4, width: 2, height: 5, rx: 1, fill: col, opacity: 0.4 }),
      ),
    ),
  );
}

/* ---------- Phone shell ---------- */
function Phone({ children, dark }) {
  return h('div', { className: 'phone' + (dark ? ' dark' : ''), id: 'phone' },
    h(StatusBar, { dark }),
    h('div', { className: 'screen-scroll', id: 'screenScroll' }, children),
    h('div', { className: 'phone-foot-slot', id: 'phoneFootSlot' }),
    h('div', { className: 'home-indicator' }),
  );
}

/* PhoneFooter — portals a pinned, non-overlapping footer below the scroll area */
function PhoneFooter({ children }) {
  const [slot, setSlot] = useState(null);
  useEffect(() => { setSlot(document.getElementById('phoneFootSlot')); }, []);
  if (!slot) return null;
  return ReactDOM.createPortal(h('div', { className: 'wizard-foot' }, children), slot);
}

/* ---------- Buttons ---------- */
function Button({ children, onClick, variant = 'primary', icon, full, style, disabled }) {
  return h('button', {
    className: `btn btn-${variant}${full ? ' full' : ''}`, onClick, disabled, style,
  }, icon && h(Icon, { name: icon, size: 19, stroke: 2.2 }), children && h('span', null, children));
}

/* ---------- Pressable row (Apple list cell) ---------- */
function Cell({ children, onClick, style, className = '' }) {
  return h('div', { className: 'cell ' + className, onClick, style }, children);
}

/* ---------- Status badge ---------- */
function Badge({ status }) {
  const map = {
    'On the way': { c: 'var(--accent)', bg: 'var(--accent-soft)' },
    'In transit': { c: 'var(--accent)', bg: 'var(--accent-soft)' },
    'Delivered': { c: 'var(--green)', bg: 'var(--green-soft)' },
    'Completed': { c: 'var(--green)', bg: 'var(--green-soft)' },
    'Pending': { c: 'var(--amber)', bg: 'var(--amber-soft)' },
    'Voided': { c: 'var(--muted)', bg: 'var(--hairline-2)' },
    'Label ready': { c: 'var(--accent)', bg: 'var(--accent-soft)' },
  };
  const s = map[status] || map['Pending'];
  return h('span', { className: 'badge', style: { color: s.c, background: s.bg } },
    h('span', { className: 'badge-dot', style: { background: s.c } }), status);
}

Object.assign(window, { Icon, StatusBar, Phone, PhoneFooter, Button, Cell, Badge, h_se: h });
