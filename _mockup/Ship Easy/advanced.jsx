// advanced.jsx — SKU Manager, Magic Batch, SKU picker sheet, Quick Quote
const { Icon: XIcon, Button: XBtn, fmt: xfmt } = window;
const _x = React.createElement;

/* ---------- SKU pill / row ---------- */
function SkuAvatar({ sku, size = 44 }) {
  return _x('div', { style: { width: size, height: size, borderRadius: size * 0.3, display: 'grid', placeItems: 'center', fontSize: size * 0.46, flexShrink: 0, background: 'color-mix(in srgb,' + sku.color + ' 14%, transparent)' } }, sku.emoji);
}

/* ---------- Bottom-sheet SKU picker (reused in Wizard) ---------- */
function SkuSheet({ open, onClose, onPick }) {
  const D = window.SE_DATA;
  if (!open) return null;
  return _x('div', { className: 'sheet-scrim', onClick: onClose },
    _x('div', { className: 'sheet', onClick: e => e.stopPropagation() },
      _x('div', { className: 'sheet-grab' }),
      _x('div', { className: 'row between', style: { marginBottom: 4 } },
        _x('div', { className: 'title2' }, 'Quick add SKU'),
        _x('button', { className: 'mini-x', onClick: onClose }, _x(XIcon, { name: 'x', size: 16 }))),
      _x('div', { className: 'muted', style: { fontSize: 13.5, marginBottom: 14 } }, 'Auto-fills weight, dimensions & customs.'),
      _x('div', { className: 'col gap10' }, D.skus.map(s =>
        _x('div', { key: s.id, className: 'sku-pick', onClick: () => { onPick(s); onClose(); } },
          _x(SkuAvatar, { sku: s }),
          _x('div', { style: { flex: 1, minWidth: 0 } },
            _x('div', { style: { fontSize: 15, fontWeight: 640 } }, s.name),
            _x('div', { className: 'faint tnum', style: { fontSize: 12.5, marginTop: 2 } }, s.code + ' · ' + s.w + ' ' + s.wUnit + ' · ' + s.dims)),
          _x('div', { className: 'tnum', style: { fontSize: 13.5, fontWeight: 640 } }, '$' + s.value)))),
    ));
}

/* ---------- SKU MANAGER ---------- */
function SkuManagerScreen({ go }) {
  const D = window.SE_DATA;
  const [adding, setAdding] = React.useState(false);
  if (adding) return _x(AddSkuScreen, { back: () => setAdding(false) });
  return _x('div', { className: 'screen' },
    _x('div', { className: 'navbar' },
      _x('button', { className: 'navbtn', onClick: () => go('home') }, _x(XIcon, { name: 'chevronLeft', size: 20 })),
      _x('div', { className: 'nav-title' }, 'SKU Manager'),
      _x('button', { className: 'navbtn', onClick: () => setAdding(true) }, _x(XIcon, { name: 'plus', size: 20 }))),
    _x('div', { style: { padding: '2px 0 4px' } }, _x('div', { className: 'largetitle' }, 'Saved products'),
      _x('div', { className: 'muted', style: { fontSize: 14.5, marginTop: 4 } }, 'Reusable presets for instant package + customs fill.')),
    _x('div', { className: 'col gap12 mt16 stagger' }, D.skus.map(s =>
      _x('div', { key: s.id, className: 'card', style: { padding: 16 } },
        _x('div', { className: 'row gap14' },
          _x(SkuAvatar, { sku: s, size: 50 }),
          _x('div', { style: { flex: 1, minWidth: 0 } },
            _x('div', { className: 'row between' },
              _x('span', { style: { fontSize: 15.5, fontWeight: 660 } }, s.name),
              _x('span', { className: 'tnum', style: { fontSize: 14, fontWeight: 660 } }, '$' + s.value)),
            _x('div', { className: 'sku-code mt8' }, s.code)),
        ),
        _x('div', { className: 'sku-meta mt16' },
          [['weight', s.w + ' ' + s.wUnit], ['ruler', s.dims], ['globe', s.origin], ['filePdf', 'HS ' + s.hs]].map(([ic, v], i) =>
            _x('div', { key: i, className: 'sku-meta-item' }, _x(XIcon, { name: ic, size: 14, color: 'var(--faint)' }), _x('span', null, v)))))),
    ),
    _x('button', { className: 'add-row mt16', onClick: () => setAdding(true) }, _x(XIcon, { name: 'plus', size: 17 }), 'Add new SKU'),
  );
}

function AddSkuScreen({ back }) {
  const [f, setF] = React.useState({ name: '', code: '', value: '', hs: '', origin: 'Canada', w: '', dims: '' });
  const set = (k, v) => setF(s => ({ ...s, [k]: v }));
  const [aiBusy, setAiBusy] = React.useState(false);
  const suggestHs = () => { setAiBusy(true); setTimeout(() => { set('hs', '6109.10'); setAiBusy(false); }, 1100); };
  return _x(React.Fragment, null,
   _x('div', { className: 'screen', style: { paddingBottom: 28 } },
    _x('div', { className: 'navbar' },
      _x('button', { className: 'navbtn', onClick: back }, _x(XIcon, { name: 'chevronLeft', size: 20 })),
      _x('div', { className: 'nav-title' }, 'New SKU'), _x('div', { style: { width: 40 } })),
    _x('div', { style: { padding: '2px 0 6px' } }, _x('div', { className: 'largetitle', style: { fontSize: 27 } }, 'Add product')),
    _x('div', { className: 'card mt16', style: { padding: 16, display: 'flex', flexDirection: 'column', gap: 13 } },
      _x('div', { className: 'field' }, _x('label', null, 'Product name'), _x('input', { className: 'input', placeholder: 'Bolo heavyweight hoodie', value: f.name, onChange: e => set('name', e.target.value) })),
      _x('div', { className: 'row gap12' },
        _x('div', { className: 'field', style: { flex: 1.4 } }, _x('label', null, 'SKU code'), _x('input', { className: 'input', placeholder: 'BOLOHOODIE', value: f.code, onChange: e => set('code', e.target.value.toUpperCase()) })),
        _x('div', { className: 'field', style: { flex: 1 } }, _x('label', null, 'Value (CAD)'), _x('input', { className: 'input tnum', inputMode: 'decimal', placeholder: '0.00', value: f.value, onChange: e => set('value', e.target.value) }))),
      _x('div', { className: 'row gap12' },
        _x('div', { className: 'field', style: { flex: 1 } }, _x('label', null, 'Weight (lb)'), _x('input', { className: 'input tnum', inputMode: 'decimal', placeholder: '1.6', value: f.w, onChange: e => set('w', e.target.value) })),
        _x('div', { className: 'field', style: { flex: 1.6 } }, _x('label', null, 'Dimensions'), _x('input', { className: 'input', placeholder: '12 × 10 × 4 in', value: f.dims, onChange: e => set('dims', e.target.value) }))),
      _x('div', { className: 'field' }, _x('label', null, 'Country of origin'), _x('div', { className: 'select-fake' }, f.origin, _x(XIcon, { name: 'chevronDown', size: 16, color: 'var(--faint)' }))),
      _x('div', { className: 'field' },
        _x('div', { className: 'row between', style: { alignItems: 'flex-end' } }, _x('label', { style: { marginBottom: 0 } }, 'HS code'),
          _x('button', { className: 'ai-mini', onClick: suggestHs, disabled: aiBusy }, aiBusy ? _x('div', { className: 'spin', style: { width: 13, height: 13, borderColor: 'var(--accent-soft)', borderTopColor: 'var(--accent)' } }) : _x(XIcon, { name: 'star', size: 13, color: 'var(--accent)' }), aiBusy ? 'Classifying…' : 'AI suggest')),
        _x('input', { className: 'input tnum', placeholder: '6110.20', value: f.hs, onChange: e => set('hs', e.target.value) })))),
    _x(window.PhoneFooter, null,
      _x(XBtn, { variant: 'primary', full: true, onClick: back, style: { flex: 1 } }, 'Save SKU')),
  );
}

Object.assign(window, { SkuSheet, SkuManagerScreen, SkuAvatar });
