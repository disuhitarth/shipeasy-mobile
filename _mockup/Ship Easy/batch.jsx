// batch.jsx — Magic Batch: paste/AI Vision → parse → apply SKU → rates → bulk pay
const { Icon: BIcon, Button: BBtn, fmt: bfmt, SkuAvatar: BSkuAvatar, SkuSheet: BSkuSheet } = window;
const _b = React.createElement;

const PARSED = [
  { name: 'Priya Sharma', line: '1450 Howe St, Vancouver BC V6Z 1R8', flag: '🇨🇦', rate: 14.20 },
  { name: 'Léa Tremblay', line: '4200 Rue Saint-Denis, Montréal QC H2J 2L1', flag: '🇨🇦', rate: 11.85 },
  { name: 'Tom Becker', line: '815 1 St SW, Calgary AB T2P 1N3', flag: '🇨🇦', rate: 13.40 },
  { name: 'Grace Liu', line: '1741 Lower Water St, Halifax NS B3J 1S5', flag: '🇨🇦', rate: 16.10 },
  { name: "Daniel O'Connor", line: '90 Eglinton Ave E, Toronto ON M4P 2Y3', flag: '🇨🇦', rate: 9.95 },
];

function MagicBatch({ balance, onClose, onComplete }) {
  const D = window.SE_DATA;
  const [phase, setPhase] = React.useState('input'); // input | parsing | parsed | rated | buying | done
  const [text, setText] = React.useState('');
  const [vision, setVision] = React.useState(false);
  const [rows, setRows] = React.useState([]);
  const [sku, setSku] = React.useState(null);
  const [sheet, setSheet] = React.useState(false);
  const [reveal, setReveal] = React.useState(0);

  const parse = () => {
    setPhase('parsing'); setReveal(0);
    PARSED.forEach((_, i) => setTimeout(() => setReveal(i + 1), 350 + i * 320));
    setTimeout(() => { setRows(PARSED.map(p => ({ ...p }))); setPhase('parsed'); }, 350 + PARSED.length * 320 + 250);
  };
  const useVision = () => {
    setVision(true);
    setTimeout(() => { setText(D.batchSample); }, 900);
    setTimeout(() => parse(), 1100);
  };
  const getRates = () => { setPhase('rated'); const el = document.getElementById('screenScroll'); if (el) el.scrollTo({ top: 0, behavior: 'smooth' }); };
  const total = rows.reduce((s, r) => s + r.rate * 1.13, 0);
  const canAfford = balance - total >= 0;
  const pay = () => {
    setPhase('buying');
    setTimeout(() => {
      const ships = rows.map(r => ({ id: 'SE' + Math.random().toString(36).slice(2, 7).toUpperCase() + 'B', item: sku ? sku.name : 'Parcel', status: 'Pending', to: r.line.split(',').slice(-1)[0].trim().split(' ').slice(0, 1).join(' ') || 'CA', toName: r.name, price: +(r.rate * 1.13).toFixed(2), carrier: 'Stallion · Tracked', date: 'Today', eta: 'Label ready', weight: sku ? sku.w + ' lb' : '1.0 lb' }));
      setPhase('done'); setTimeout(() => onComplete(ships.length, +total.toFixed(2), ships), 1500);
    }, 1700);
  };

  // ---- DONE ----
  if (phase === 'done') return _b('div', { className: 'screen', style: { display: 'flex', flexDirection: 'column', minHeight: '100%', justifyContent: 'center' } },
    _b('div', { className: 'pop', style: { margin: '0 auto' } },
      _b('div', { className: 'success-ring' }, _b('svg', { width: 96, height: 96, viewBox: '0 0 96 96' },
        _b('circle', { cx: 48, cy: 48, r: 46, fill: 'none', stroke: 'var(--green)', strokeWidth: 3, opacity: .25 }),
        _b('path', { className: 'draw', d: 'M30 49 43 62 67 36', fill: 'none', stroke: 'var(--green)', strokeWidth: 5, strokeLinecap: 'round', strokeLinejoin: 'round' })))),
    _b('div', { className: 'fade-up', style: { textAlign: 'center', marginTop: 22, animationDelay: '.3s' } },
      _b('div', { className: 'largetitle', style: { fontSize: 26 } }, rows.length + ' labels generated'),
      _b('div', { className: 'muted', style: { fontSize: 15, marginTop: 6, padding: '0 24px' } }, 'Charged ' + bfmt(total) + ' from your wallet. All PDFs are ready in your shipments.')));

  return _b(React.Fragment, null,
   _b('div', { className: 'screen', style: { paddingBottom: 28 } },
    _b('div', { className: 'navbar' },
      _b('button', { className: 'navbtn', onClick: onClose }, _b(BIcon, { name: 'chevronLeft', size: 20 })),
      _b('div', { className: 'nav-title row gap8', style: { gap: 7 } }, _b(BIcon, { name: 'star', size: 16, color: 'var(--accent)' }), 'Magic Batch'),
      _b('div', { style: { width: 40 } })),

    phase === 'input' && _b(React.Fragment, null,
      _b('div', { style: { padding: '2px 0 4px' } },
        _b('div', { className: 'largetitle', style: { fontSize: 27 } }, 'Paste & go'),
        _b('div', { className: 'muted', style: { fontSize: 14.5, marginTop: 4 } }, 'Drop in messy text or a screenshot — AI sorts every address into ready-to-ship rows.')),
      vision
        ? _b('div', { className: 'vision-box mt16' }, _b('div', { className: 'vision-scan' }), _b(BIcon, { name: 'scan', size: 30, color: 'var(--accent)' }), _b('div', { style: { fontSize: 14, fontWeight: 620, marginTop: 10 } }, 'AI Vision reading image…'), _b('div', { className: 'faint', style: { fontSize: 12.5, marginTop: 3 } }, 'Extracting recipients with Gemini'))
        : _b('textarea', { className: 'batch-area mt16', placeholder: 'e.g.\nPriya — 1450 Howe St, Vancouver BC\nTom / 815 1 St SW, Calgary AB …', value: text, onChange: e => setText(e.target.value) }),
      !vision && _b('div', { className: 'row between mt12' },
        _b('button', { className: 'ghost-link', onClick: () => setText(D.batchSample) }, _b(BIcon, { name: 'copy', size: 15 }), 'Paste sample'),
        _b('button', { className: 'vision-btn', onClick: useVision }, _b(BIcon, { name: 'scan', size: 17 }), 'AI Vision')),
      _b('div', { className: 'hint-row mt16' }, _b(BIcon, { name: 'star', size: 15, color: 'var(--accent)' }), 'AI Vision reads photos of labels, WhatsApp screenshots, or spreadsheets.')),

    phase === 'parsing' && _b(React.Fragment, null,
      _b('div', { className: 'parsing-head mt16' }, _b('div', { className: 'spin', style: { width: 18, height: 18, borderColor: 'var(--accent-soft)', borderTopColor: 'var(--accent)' } }),
        _b('span', { style: { fontSize: 14.5, fontWeight: 600 } }, 'AI parsing ' + PARSED.length + ' recipients…')),
      _b('div', { className: 'col gap10 mt16' }, PARSED.map((p, i) => i < reveal
        ? _b('div', { key: i, className: 'batch-row fade-up' }, _b('div', { className: 'batch-num' }, i + 1),
            _b('div', { style: { flex: 1, minWidth: 0 } }, _b('div', { style: { fontSize: 14.5, fontWeight: 620 } }, p.name),
              _b('div', { className: 'faint', style: { fontSize: 12.5, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, p.line)),
            _b(BIcon, { name: 'checkCircle', size: 18, color: 'var(--green)' }))
        : _b('div', { key: i, className: 'batch-row' }, _b('div', { className: 'skel', style: { width: 26, height: 26, borderRadius: 8 } }),
            _b('div', { style: { flex: 1 } }, _b('div', { className: 'skel', style: { height: 12, width: '50%', marginBottom: 7 } }), _b('div', { className: 'skel', style: { height: 10, width: '78%' } })))))),

    (phase === 'parsed' || phase === 'rated') && _b(React.Fragment, null,
      _b('div', { className: 'row between', style: { padding: '4px 2px 0' } },
        _b('div', null, _b('div', { className: 'title2' }, rows.length + ' shipments'),
          _b('div', { className: 'faint', style: { fontSize: 12.5, marginTop: 2 } }, phase === 'rated' ? 'Rated · tax included' : 'Parsed & verified')),
        _b('span', { className: 'parsed-pill' }, _b(BIcon, { name: 'checkCircle', size: 13, color: 'var(--green)' }), 'AI verified')),

      // apply-SKU bar
      _b('div', { className: 'sku-apply mt16', onClick: () => setSheet(true) },
        sku
          ? _b(React.Fragment, null, _b(BSkuAvatar, { sku, size: 40 }),
              _b('div', { style: { flex: 1, minWidth: 0 } }, _b('div', { style: { fontSize: 14, fontWeight: 640 } }, 'Applied to all ' + rows.length),
                _b('div', { className: 'faint tnum', style: { fontSize: 12.5, marginTop: 1 } }, sku.code + ' · ' + sku.w + ' lb · ' + sku.dims)),
              _b('span', { className: 'sku-change' }, 'Change'))
          : _b(React.Fragment, null, _b('div', { className: 'cell-icon', style: { background: 'var(--accent-soft)' } }, _b(BIcon, { name: 'star', size: 18, color: 'var(--accent)' })),
              _b('div', { style: { flex: 1 } }, _b('div', { style: { fontSize: 14, fontWeight: 640 } }, 'Apply a SKU to all'),
                _b('div', { className: 'faint', style: { fontSize: 12.5, marginTop: 1 } }, 'Auto-fill weight, dims & customs')),
              _b(BIcon, { name: 'chevronRight', size: 18, color: 'var(--faint)' }))),

      _b('div', { className: 'col gap10 mt16 stagger' }, rows.map((r, i) =>
        _b('div', { key: i, className: 'batch-row' },
          _b('div', { className: 'batch-num' }, _b('span', null, r.flag)),
          _b('div', { style: { flex: 1, minWidth: 0 } },
            _b('div', { style: { fontSize: 14.5, fontWeight: 640 } }, r.name),
            _b('div', { className: 'faint', style: { fontSize: 12.5, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, r.line)),
          phase === 'rated'
            ? _b('div', { className: 'tnum fade-up', style: { fontSize: 14.5, fontWeight: 680 } }, bfmt(r.rate * 1.13))
            : _b(BIcon, { name: 'checkCircle', size: 18, color: 'var(--green)' })))),
      phase === 'rated' && _b('div', { className: 'hint-row mt12' }, _b(BIcon, { name: 'shield', size: 15, color: 'var(--faint)' }), 'Each price includes 20% service rate + 13% HST. One tap buys them all.'))),

    // ---- footer (portal slot, never overlaps content) ----
    _b(window.PhoneFooter, null,
      phase === 'input' && _b('button', { className: 'btn btn-primary full', disabled: !text && !vision, onClick: parse, style: { flex: 1 } }, _b(BIcon, { name: 'star', size: 18 }), 'Parse with AI'),
      phase === 'parsed' && _b('button', { className: 'btn btn-primary full', onClick: getRates, style: { flex: 1 } }, 'Get rates for all ' + rows.length),
      phase === 'rated' && _b(React.Fragment, null,
        _b('div', { className: 'foot-total' }, _b('span', { className: 'faint', style: { fontSize: 12.5, fontWeight: 600 } }, rows.length + ' labels · incl. tax'),
          _b('span', { className: 'tnum', style: { fontSize: 22, fontWeight: 730, letterSpacing: '-.5px' } }, bfmt(total))),
        _b('button', { className: 'btn btn-primary', disabled: !canAfford, onClick: pay, style: { flex: 1, minWidth: 0 } }, canAfford ? 'Pay & generate' : 'Add funds')),
      phase === 'buying' && _b('button', { className: 'btn btn-primary full', disabled: true, style: { flex: 1 } }, _b('div', { className: 'spin' }), 'Generating ' + rows.length + ' labels…')),

    _b(BSkuSheet, { open: sheet, onClose: () => setSheet(false), onPick: s => setSku(s) }),
  );
}

Object.assign(window, { MagicBatch });
