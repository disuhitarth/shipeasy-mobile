// wizard.jsx — multi-step shipping flow
const { Icon: WIcon, Button: WBtn, fmt: wfmt } = window;
const _w = React.createElement;

const RATES = [
  { id: 'eco', name: 'Stallion Economy', svc: 'No tracking', days: '5–8 business days', post: 9.85, badge: null, ic: 'box' },
  { id: 'trk', name: 'Stallion Tracked', svc: 'Full tracking', days: '3–5 business days', post: 14.20, badge: 'Popular', ic: 'pin' },
  { id: 'exp', name: 'Stallion Express', svc: 'Tracked · Priority', days: '2–3 business days', post: 18.94, badge: 'Fastest', ic: 'truck' },
  { id: 'pri', name: 'Stallion Priority', svc: 'Tracked · Insured', days: '1–2 business days', post: 26.40, badge: null, ic: 'shield' },
];

function StepHeader({ step, total, title, sub, onBack, onClose }) {
  return _w('div', null,
    _w('div', { className: 'navbar' },
      _w('button', { className: 'navbtn', onClick: onBack }, _w(WIcon, { name: 'chevronLeft', size: 20 })),
      _w('div', { className: 'nav-title' }, 'New shipment'),
      _w('button', { className: 'navbtn', onClick: onClose }, _w(WIcon, { name: 'x', size: 18 }))),
    _w('div', { className: 'steps' }, Array.from({ length: total }).map((_, i) =>
      _w('div', { key: i, className: 'seg' + (i < step ? ' done' : i === step ? ' cur' : '') }, _w('i')))),
    _w('div', { className: 'row between', style: { marginBottom: 4 } },
      _w('div', { className: 'eyebrow' }, 'Step ' + (step + 1) + ' of ' + total)),
    _w('div', { className: 'largetitle', style: { fontSize: 27 } }, title),
    sub && _w('div', { className: 'muted', style: { fontSize: 14.5, marginTop: 4 } }, sub));
}

/* ---- Step 1: Addresses ---- */
function StepAddresses({ state, set }) {
  const D = window.SE_DATA;
  return _w('div', { className: 'col gap12 mt20 stagger' },
    _w('div', { className: 'eyebrow', style: { marginBottom: -2 } }, 'Ship from'),
    D.addresses.map(a => _w('div', { key: a.id, className: 'addr-card' + (state.from === a.id ? ' sel' : ''), onClick: () => set({ from: a.id }) },
      _w('div', { className: 'cell-icon', style: { background: 'var(--accent-soft)' } }, _w(WIcon, { name: 'pin', size: 18, color: 'var(--accent)' })),
      _w('div', { style: { flex: 1, minWidth: 0 } },
        _w('div', { className: 'row gap8' }, _w('span', { style: { fontSize: 15, fontWeight: 650 } }, a.label), _w('span', { className: 'tag-pill' }, 'Sender')),
        _w('div', { className: 'faint', style: { fontSize: 13, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, a.line)),
      _w('div', { className: 'radio' + (state.from === a.id ? ' on' : '') })),
    ),
    _w('button', { className: 'add-row' }, _w(WIcon, { name: 'plus', size: 17 }), 'Add sender address'),

    _w('div', { className: 'eyebrow mt16', style: { marginBottom: -2 } }, 'Ship to'),
    _w('div', { className: 'card', style: { padding: 16, display: 'flex', flexDirection: 'column', gap: 13 } },
      _w('div', { className: 'field' }, _w('label', null, 'Recipient name'),
        _w('input', { className: 'input', placeholder: 'Priya Sharma', value: state.toName, onChange: e => set({ toName: e.target.value }) })),
      _w('div', { className: 'field' }, _w('label', null, 'Street address'),
        _w('input', { className: 'input', placeholder: '1450 Howe St', value: state.toLine, onChange: e => set({ toLine: e.target.value }) })),
      _w('div', { className: 'row gap12' },
        _w('div', { className: 'field', style: { flex: 1.4 } }, _w('label', null, 'City'),
          _w('input', { className: 'input', placeholder: 'Vancouver', value: state.toCity, onChange: e => set({ toCity: e.target.value }) })),
        _w('div', { className: 'field', style: { flex: 1 } }, _w('label', null, 'Province'),
          _w('input', { className: 'input', placeholder: 'BC', value: state.toProv, onChange: e => set({ toProv: e.target.value }) }))),
      _w('div', { className: 'field' }, _w('label', null, 'Postal code'),
        _w('input', { className: 'input', placeholder: 'V6Z 1R8', value: state.toPostal, onChange: e => set({ toPostal: e.target.value }) }))),
  );
}

/* ---- Step 2: Package ---- */
function UnitSeg({ value, opts, onChange }) {
  return _w('div', { className: 'segment', style: { width: 'auto', flexShrink: 0 } },
    opts.map(o => _w('button', { key: o, className: value === o ? 'on' : '', style: { padding: '0 14px', flex: 'none' }, onClick: () => onChange(o) }, o)));
}
function StepPackage({ state, set, onSku }) {
  const types = [['box', 'Box / Parcel'], ['gift', 'Soft pack'], ['filePdf', 'Envelope']];
  return _w('div', { className: 'col gap16 mt20 stagger' },
    state.appliedSku
      ? _w('div', { className: 'sku-applied', onClick: onSku },
          _w(window.SkuAvatar, { sku: state.appliedSku, size: 42 }),
          _w('div', { style: { flex: 1, minWidth: 0 } },
            _w('div', { className: 'row gap8' }, _w('span', { style: { fontSize: 14.5, fontWeight: 660 } }, state.appliedSku.name), _w('span', { className: 'tag-pill' }, 'SKU')),
            _w('div', { className: 'faint tnum', style: { fontSize: 12.5, marginTop: 2 } }, 'Auto-filled · ' + state.appliedSku.code)),
          _w('span', { className: 'sku-change' }, 'Change'))
      : _w('button', { className: 'quick-sku', onClick: onSku },
          _w('div', { className: 'cell-icon', style: { background: 'var(--accent)' } }, _w(WIcon, { name: 'star', size: 18, color: '#fff' })),
          _w('div', { style: { flex: 1, textAlign: 'left' } }, _w('div', { style: { fontSize: 14.5, fontWeight: 640 } }, 'Quick add SKU'),
            _w('div', { className: 'faint', style: { fontSize: 12.5, marginTop: 1 } }, 'Skip the form — fill from a saved product')),
          _w(WIcon, { name: 'chevronRight', size: 18, color: 'var(--faint)' })),
    _w('div', { className: 'or-divider' }, _w('span', null, state.appliedSku ? 'or edit manually' : 'or enter manually')),
    _w('div', null, _w('div', { className: 'eyebrow', style: { marginBottom: 10 } }, 'Package type'),
      _w('div', { className: 'type-grid' }, types.map(([ic, lbl]) =>
        _w('button', { key: lbl, className: 'type-card' + (state.pkgType === lbl ? ' sel' : ''), onClick: () => set({ pkgType: lbl }) },
          _w(WIcon, { name: ic, size: 24, stroke: 1.9, color: state.pkgType === lbl ? 'var(--accent)' : 'var(--muted)' }),
          _w('span', null, lbl))))),
    _w('div', { className: 'card', style: { padding: 16 } },
      _w('div', { className: 'row between', style: { marginBottom: 12 } },
        _w('label', { style: { fontSize: 14.5, fontWeight: 620 } }, 'Weight'),
        _w(UnitSeg, { value: state.wUnit, opts: ['lb', 'oz', 'kg', 'g'], onChange: v => set({ wUnit: v }) })),
      _w('div', { className: 'big-input' },
        _w('input', { className: 'bi-field tnum', type: 'text', inputMode: 'decimal', value: state.weight, onChange: e => set({ weight: e.target.value }), placeholder: '0.0' }),
        _w('span', { className: 'bi-unit' }, state.wUnit))),
    _w('div', { className: 'card', style: { padding: 16 } },
      _w('div', { className: 'row between', style: { marginBottom: 14 } },
        _w('label', { style: { fontSize: 14.5, fontWeight: 620 } }, 'Dimensions'),
        _w(UnitSeg, { value: state.dUnit, opts: ['in', 'cm'], onChange: v => set({ dUnit: v }) })),
      _w('div', { className: 'dims' }, [['l', 'Length'], ['w', 'Width'], ['h', 'Height']].map(([k, lbl]) =>
        _w('div', { key: k, className: 'dim' },
          _w('input', { className: 'dim-in tnum', inputMode: 'decimal', value: state.dims[k], onChange: e => set({ dims: { ...state.dims, [k]: e.target.value } }), placeholder: '0' }),
          _w('span', { className: 'faint', style: { fontSize: 12, fontWeight: 600 } }, lbl))))),
    _w('div', { className: 'hint-row' }, _w(WIcon, { name: 'info', size: 15, color: 'var(--faint)' }), 'Enter the packed weight. Rates are recalculated if the carrier re-measures.'),
  );
}

/* ---- Step 3: Customs ---- */
function StepCustoms({ state, set }) {
  const items = state.items;
  const [aiBusy, setAiBusy] = React.useState(false);
  const upd = (i, patch) => set({ items: items.map((it, idx) => idx === i ? { ...it, ...patch } : it) });
  const add = () => set({ items: [...items, { desc: '', qty: '1', value: '', origin: 'Canada', hs: '' }] });
  const total = items.reduce((s, it) => s + (parseFloat(it.value) || 0) * (parseInt(it.qty) || 0), 0);
  const HS_GUESS = { lens: '9002.11', camera: '9002.11', hoodie: '6110.20', shirt: '6109.10', book: '4901.99', mug: '6912.00' };
  const classifyAll = () => {
    setAiBusy(true);
    setTimeout(() => {
      set({ items: items.map(it => { if (it.hs) return it; const k = Object.keys(HS_GUESS).find(w => (it.desc || '').toLowerCase().includes(w)); return { ...it, hs: k ? HS_GUESS[k] : '6307.90' }; }) });
      setAiBusy(false);
    }, 1300);
  };
  return _w('div', { className: 'col gap14 mt20' },
    _w('div', { className: 'ai-customs' },
      _w('div', { className: 'row gap12', style: { alignItems: 'flex-start' } },
        _w('div', { className: 'ai-customs-ic' }, _w(WIcon, { name: 'star', size: 18, color: '#fff' })),
        _w('div', { style: { flex: 1 } },
          _w('div', { style: { fontSize: 14.5, fontWeight: 680 } }, 'AI customs broker'),
          _w('div', { style: { fontSize: 12.5, marginTop: 2, opacity: .82, lineHeight: 1.4 } }, 'Classifies each item and assigns the correct HS code to prevent border delays.'))),
      _w('button', { className: 'ai-customs-btn mt12', onClick: classifyAll, disabled: aiBusy },
        aiBusy ? _w(React.Fragment, null, _w('div', { className: 'spin', style: { width: 14, height: 14 } }), 'Classifying items…')
          : _w(React.Fragment, null, _w(WIcon, { name: 'star', size: 15 }), 'Auto-classify ' + items.length + ' item' + (items.length > 1 ? 's' : '')))),
    items.map((it, i) => _w('div', { key: i, className: 'card fade-up', style: { padding: 16 } },
      _w('div', { className: 'row between', style: { marginBottom: 12 } },
        _w('span', { style: { fontSize: 13.5, fontWeight: 660 } }, 'Item ' + (i + 1)),
        items.length > 1 && _w('button', { className: 'mini-x', onClick: () => set({ items: items.filter((_, x) => x !== i) }) }, _w(WIcon, { name: 'x', size: 14 }))),
      _w('div', { className: 'field', style: { marginBottom: 11 } }, _w('label', null, 'Description'),
        _w('input', { className: 'input', placeholder: 'Cotton t-shirt', value: it.desc, onChange: e => upd(i, { desc: e.target.value }) })),
      _w('div', { className: 'row gap12', style: { marginBottom: 11 } },
        _w('div', { className: 'field', style: { flex: 1 } }, _w('label', null, 'Qty'),
          _w('input', { className: 'input tnum', inputMode: 'numeric', value: it.qty, onChange: e => upd(i, { qty: e.target.value }) })),
        _w('div', { className: 'field', style: { flex: 1.6 } }, _w('label', null, 'Value (CAD)'),
          _w('input', { className: 'input tnum', inputMode: 'decimal', placeholder: '0.00', value: it.value, onChange: e => upd(i, { value: e.target.value }) }))),
      _w('div', { className: 'row gap12' },
        _w('div', { className: 'field', style: { flex: 1 } }, _w('label', null, 'Origin'),
          _w('div', { className: 'select-fake' }, it.origin, _w(WIcon, { name: 'chevronDown', size: 16, color: 'var(--faint)' }))),
        _w('div', { className: 'field', style: { flex: 1 } }, _w('label', null, 'HS code'),
          _w('input', { className: 'input tnum', placeholder: '6109.10', value: it.hs, onChange: e => upd(i, { hs: e.target.value }) }))))),
    _w('button', { className: 'add-row', onClick: add }, _w(WIcon, { name: 'plus', size: 17 }), 'Add another item'),
    _w('div', { className: 'row between', style: { padding: '4px 4px 0' } },
      _w('span', { className: 'muted', style: { fontSize: 14 } }, 'Declared value'),
      _w('span', { className: 'tnum', style: { fontSize: 15, fontWeight: 660 } }, wfmt(total))),
  );
}

/* ---- Step 4: Rates ---- */
function StepRates({ state, set, loading }) {
  if (loading) return _w('div', { className: 'col gap12 mt20' },
    _w('div', { className: 'rate-loading' }, _w('div', { className: 'spin', style: { borderColor: 'var(--hairline)', borderTopColor: 'var(--accent)', width: 22, height: 22 } }),
      _w('span', { className: 'muted', style: { fontSize: 14, fontWeight: 560 } }, 'Fetching live rates from Stallion…')),
    [0, 1, 2, 3].map(i => _w('div', { key: i, className: 'card', style: { padding: 16, display: 'flex', gap: 14, alignItems: 'center' } },
      _w('div', { className: 'skel', style: { width: 40, height: 40, borderRadius: 12 } }),
      _w('div', { style: { flex: 1 } }, _w('div', { className: 'skel', style: { height: 14, width: '55%', marginBottom: 8 } }), _w('div', { className: 'skel', style: { height: 11, width: '38%' } })),
      _w('div', { className: 'skel', style: { height: 22, width: 54, borderRadius: 8 } }))));
  return _w('div', { className: 'col gap12 mt20 stagger' },
    RATES.map(r => {
      const total = r.post * 1.13, sel = state.rate === r.id;
      return _w('div', { key: r.id, className: 'rate-card' + (sel ? ' sel' : ''), onClick: () => set({ rate: r.id }) },
        _w('div', { className: 'rate-ic', style: { background: sel ? 'var(--accent)' : 'var(--accent-soft)' } },
          _w(WIcon, { name: r.ic, size: 20, color: sel ? '#fff' : 'var(--accent)', stroke: 2 })),
        _w('div', { style: { flex: 1, minWidth: 0 } },
          _w('div', { className: 'row gap8' }, _w('span', { style: { fontSize: 15, fontWeight: 650, letterSpacing: '-.2px' } }, r.name),
            r.badge && _w('span', { className: 'rate-badge' + (r.badge === 'Fastest' ? ' hot' : '') }, r.badge)),
          _w('div', { className: 'faint', style: { fontSize: 12.5, marginTop: 3 } }, r.days + ' · ' + r.svc)),
        _w('div', { style: { textAlign: 'right' } },
          _w('div', { className: 'tnum', style: { fontSize: 17, fontWeight: 700, letterSpacing: '-.4px' } }, wfmt(total)),
          _w('div', { className: 'faint', style: { fontSize: 11, marginTop: 1 } }, 'incl. HST')));
    }),
    _w('div', { className: 'hint-row mt8' }, _w(WIcon, { name: 'info', size: 15, color: 'var(--faint)' }), 'Prices include carrier postage and 13% HST. No hidden fees.'),
  );
}

/* ---- Step 5: Review / Purchase ---- */
function StepReview({ state, balance }) {
  const r = RATES.find(x => x.id === state.rate) || RATES[1];
  const hst = r.post * 0.13, total = r.post * 1.13, after = balance - total, ok = after >= 0;
  return _w('div', { className: 'col gap16 mt20' },
    _w('div', { className: 'card', style: { padding: 18 } },
      _w('div', { className: 'row gap14' }, _w(window.PkgIcon, { status: 'Label ready', size: 48 }),
        _w('div', null, _w('div', { style: { fontSize: 16, fontWeight: 680 } }, r.name),
          _w('div', { className: 'faint', style: { fontSize: 13, marginTop: 2 } }, r.days))),
      _w('div', { className: 'review-route mt16' },
        _w('div', { className: 'rr', style: { textAlign: 'left' } }, _w('div', { className: 'faint route-lbl' }, 'FROM'), _w('div', { style: { fontSize: 13.5, fontWeight: 600, marginTop: 2 } }, 'Toronto, ON')),
        _w(WIcon, { name: 'arrowRight', size: 16, color: 'var(--faint)' }),
        _w('div', { className: 'rr', style: { textAlign: 'right' } }, _w('div', { className: 'faint route-lbl' }, 'TO'), _w('div', { style: { fontSize: 13.5, fontWeight: 600, marginTop: 2 } }, (state.toCity || 'Vancouver') + ', ' + (state.toProv || 'BC'))))),
    _w('div', { className: 'card', style: { padding: 18 } },
      [['Postage', r.post], ['HST (13%)', hst]].map(([l, v]) => _w('div', { key: l, className: 'row between', style: { marginBottom: 12 } },
        _w('span', { className: 'muted', style: { fontSize: 14.5 } }, l), _w('span', { className: 'tnum', style: { fontSize: 14.5, fontWeight: 560 } }, wfmt(v)))),
      _w('div', { className: 'row between', style: { paddingTop: 13, borderTop: '1px solid var(--hairline)' } },
        _w('span', { style: { fontSize: 16, fontWeight: 700 } }, 'Total'),
        _w('span', { className: 'tnum', style: { fontSize: 20, fontWeight: 730 } }, wfmt(total)))),
    _w('div', { className: 'wallet-check' + (ok ? '' : ' insufficient') },
      _w('div', { className: 'cell-icon', style: { background: ok ? 'var(--green-soft)' : 'var(--amber-soft)' } },
        _w(WIcon, { name: 'wallet', size: 18, color: ok ? 'var(--green)' : 'var(--amber)' })),
      _w('div', { style: { flex: 1 } },
        _w('div', { style: { fontSize: 14, fontWeight: 620 } }, ok ? 'Paid from wallet' : 'Insufficient balance'),
        _w('div', { className: 'faint tnum', style: { fontSize: 12.5, marginTop: 1 } }, ok ? ('Balance ' + wfmt(balance) + ' → ' + wfmt(after)) : ('Add ' + wfmt(-after) + ' to continue'))),
      _w('div', { className: 'tnum', style: { fontSize: 13, fontWeight: 640, color: ok ? 'var(--green)' : 'var(--amber)' } }, ok ? '✓' : '')),
  );
}

/* ---- Success ---- */
function SuccessScreen({ shipment, onDone, onTrack }) {
  return _w('div', { className: 'screen', style: { display: 'flex', flexDirection: 'column', minHeight: '100%', justifyContent: 'center', paddingBottom: 40 } },
    _w('div', { className: 'pop', style: { margin: '0 auto' } },
      _w('div', { className: 'success-ring' },
        _w('svg', { width: 96, height: 96, viewBox: '0 0 96 96' },
          _w('circle', { cx: 48, cy: 48, r: 46, fill: 'none', stroke: 'var(--green)', strokeWidth: 3, opacity: .25 }),
          _w('path', { className: 'draw', d: 'M30 49 43 62 67 36', fill: 'none', stroke: 'var(--green)', strokeWidth: 5, strokeLinecap: 'round', strokeLinejoin: 'round' })))),
    _w('div', { className: 'fade-up', style: { textAlign: 'center', marginTop: 22, animationDelay: '.3s' } },
      _w('div', { className: 'largetitle', style: { fontSize: 26 } }, 'Label purchased'),
      _w('div', { className: 'muted', style: { fontSize: 15, marginTop: 6, padding: '0 20px' } }, 'Your label is ready to print and your wallet was charged ' + wfmt(shipment.price) + '.')),
    _w('div', { className: 'card fade-up', style: { padding: 18, marginTop: 26, animationDelay: '.4s' } },
      _w('div', { className: 'row between' },
        _w('div', null, _w('div', { className: 'faint', style: { fontSize: 11.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.4px' } }, 'Tracking number'),
          _w('div', { className: 'tnum', style: { fontSize: 18, fontWeight: 700, marginTop: 4 } }, shipment.id)),
        _w('button', { className: 'navbtn' }, _w(WIcon, { name: 'copy', size: 17 }))),
      _w('div', { className: 'dl-row mt16' },
        _w('button', { className: 'dl-chip' }, _w(WIcon, { name: 'filePdf', size: 16, color: 'var(--accent)' }), 'PDF label'),
        _w('button', { className: 'dl-chip' }, _w(WIcon, { name: 'download', size: 16, color: 'var(--accent)' }), 'ZPL (4×6)'))),
    _w('div', { className: 'col gap12 fade-up', style: { marginTop: 22, animationDelay: '.5s' } },
      _w(WBtn, { variant: 'primary', full: true, icon: 'pin', onClick: onTrack }, 'Track shipment'),
      _w(WBtn, { variant: 'ghost', full: true, onClick: onDone }, 'Back to home')),
  );
}

/* ---- Wizard controller ---- */
function Wizard({ balance, onClose, onComplete }) {
  const [step, setStep] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [buying, setBuying] = React.useState(false);
  const [done, setDone] = React.useState(null);
  const [skuSheet, setSkuSheet] = React.useState(false);
  const [st, setSt] = React.useState({
    from: 'a1', toName: 'Priya Sharma', toLine: '1450 Howe St', toCity: 'Vancouver', toProv: 'BC', toPostal: 'V6Z 1R8',
    pkgType: 'Box / Parcel', wUnit: 'lb', weight: '1.4', dUnit: 'in', dims: { l: '10', w: '8', h: '4' },
    items: [{ desc: 'Vintage camera lens', qty: '1', value: '120', origin: 'Canada', hs: '9002.11' }],
    rate: 'exp', appliedSku: null,
  });
  const set = (p) => setSt(s => ({ ...s, ...p }));
  const applySku = (s) => {
    const m = s.dims.match(/(\d+)\D+(\d+)\D+(\d+)\s*(in|cm)/);
    set({ weight: s.w, wUnit: s.wUnit, dUnit: m ? m[4] : st.dUnit,
      dims: m ? { l: m[1], w: m[2], h: m[3] } : st.dims,
      items: [{ desc: s.name, qty: '1', value: s.value, origin: s.origin, hs: s.hs }],
      appliedSku: s });
  };
  const scroll = () => { const el = document.getElementById('screenScroll'); if (el) el.scrollTo({ top: 0, behavior: 'smooth' }); };
  const r = RATES.find(x => x.id === st.rate) || RATES[1];
  const total = r.post * 1.13;
  const canAfford = balance - total >= 0;

  const titles = [
    ['Where to?', 'Confirm sender and recipient.'],
    ['Package', 'Tell us about your parcel.'],
    ['Customs', 'Declare the contents.'],
    ['Choose a rate', 'Live prices, tax included.'],
    ['Review & pay', 'Charged from your wallet balance.'],
  ];

  const next = () => {
    if (step === 2) { setStep(3); setLoading(true); scroll(); setTimeout(() => setLoading(false), 1500); return; }
    if (step === 4) {
      setBuying(true);
      setTimeout(() => {
        const ship = { id: 'SE' + Math.random().toString(36).slice(2, 8).toUpperCase() + '4', item: st.items[0].desc || 'Parcel', status: 'Pending', to: st.toCity + ', ' + st.toProv, toName: st.toName, price: +total.toFixed(2), carrier: r.name, date: 'Today', eta: 'Label ready', weight: st.weight + ' ' + st.wUnit };
        setBuying(false); setDone(ship);
      }, 1600);
      return;
    }
    setStep(s => s + 1); scroll();
  };
  const back = () => { if (step === 0) onClose(); else { setStep(s => s - 1); scroll(); } };

  if (done) return _w(SuccessScreen, { shipment: done, onDone: () => onComplete(done, total), onTrack: () => onComplete(done, total, 'detail') });

  const ctaLabel = step < 4 ? 'Continue' : (canAfford ? 'Pay now' : 'Add funds');
  const ctaDisabled = (step === 3 && (loading || !st.rate)) || buying;

  return _w(React.Fragment, null,
    _w('div', { className: 'screen', style: { paddingBottom: 28 } },
      _w(StepHeader, { step, total: 5, title: titles[step][0], sub: titles[step][1], onBack: back, onClose }),
      step === 0 && _w(StepAddresses, { state: st, set }),
      step === 1 && _w(StepPackage, { state: st, set, onSku: () => setSkuSheet(true) }),
      step === 2 && _w(StepCustoms, { state: st, set }),
      step === 3 && _w(StepRates, { state: st, set, loading }),
      step === 4 && _w(StepReview, { state: st, balance })),
    _w(window.PhoneFooter, null,
      step === 4 && _w('div', { className: 'foot-total' },
        _w('span', { className: 'faint', style: { fontSize: 12.5, fontWeight: 600 } }, 'Total · incl. tax'),
        _w('span', { className: 'tnum', style: { fontSize: 22, fontWeight: 730, letterSpacing: '-.5px' } }, wfmt(total))),
      _w('button', { className: 'btn btn-primary' + (step === 4 ? '' : ' full'), disabled: ctaDisabled, onClick: next, style: { flex: step === 4 ? '1' : 1, minWidth: 0 } },
        buying ? _w('div', { className: 'spin' }) : ctaLabel)),
    _w(window.SkuSheet, { open: skuSheet, onClose: () => setSkuSheet(false), onPick: applySku }),
  );
}

Object.assign(window, { Wizard, SuccessScreen });
