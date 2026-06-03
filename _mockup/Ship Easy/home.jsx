// home.jsx — Home, Shipments, Wallet, Top-up, Detail
const { Icon, Phone, Button, Cell, Badge } = window;
const _h = React.createElement;
const fmt = (n) => (n < 0 ? '-$' : '$') + Math.abs(n).toFixed(2);
const fmtS = (n) => (n < 0 ? '−' : '+') + '$' + Math.abs(n).toFixed(2);

/* ---------- shared package glyph ---------- */
function PkgIcon({ status, size = 44 }) {
  const c = status === 'Delivered' || status === 'Completed' ? 'var(--green)'
    : status === 'Pending' ? 'var(--amber)' : 'var(--accent)';
  const soft = status === 'Delivered' || status === 'Completed' ? 'var(--green-soft)'
    : status === 'Pending' ? 'var(--amber-soft)' : 'var(--accent-soft)';
  return _h('div', { style: { width: size, height: size, borderRadius: size * 0.3, background: soft, display: 'grid', placeItems: 'center', flexShrink: 0 } },
    _h(Icon, { name: 'box', size: size * 0.5, color: c, stroke: 2 }));
}

/* ---------- Wallet balance card (Stripe gradient) ---------- */
function BalanceCard({ balance, onTopUp, compact }) {
  return _h('div', { className: 'balance-card', style: { padding: compact ? '20px' : '22px 22px 20px' } },
    _h('div', { className: 'bc-glow' }),
    _h('div', { className: 'row between', style: { position: 'relative', zIndex: 2 } },
      _h('div', null,
        _h('div', { style: { fontSize: 13, fontWeight: 600, opacity: .82, letterSpacing: '.2px' } }, 'Wallet balance'),
        _h('div', { className: 'tnum', style: { fontSize: 38, fontWeight: 740, letterSpacing: '-1.2px', marginTop: 4, lineHeight: 1 } }, fmt(balance)),
        _h('div', { style: { fontSize: 12.5, opacity: .72, marginTop: 7, display: 'flex', alignItems: 'center', gap: 6 } },
          _h(Icon, { name: 'shield', size: 13, stroke: 2.2 }), 'CAD · Prepaid · Secured'),
      ),
      _h('button', { className: 'bc-add', onClick: onTopUp },
        _h(Icon, { name: 'plus', size: 22, stroke: 2.4 })),
    ),
  );
}

/* ---------- HOME ---------- */
function HomeScreen({ go, balance }) {
  const D = window.SE_DATA;
  return _h('div', { className: 'screen' },
    _h('div', { className: 'row between', style: { padding: '4px 0 16px' } },
      _h('div', { className: 'row gap12' },
        _h('div', { className: 'avatar' }, D.user.initials),
        _h('div', null,
          _h('div', { className: 'faint', style: { fontSize: 12.5, fontWeight: 600 } }, 'Good morning'),
          _h('div', { style: { fontSize: 16.5, fontWeight: 680, letterSpacing: '-0.3px' } }, D.user.name)),
      ),
      _h('button', { className: 'navbtn', style: { position: 'relative' } },
        _h(Icon, { name: 'bell', size: 19 }),
        _h('span', { className: 'dot-badge' })),
    ),
    _h('div', { className: 'fade-up' }, _h(BalanceCard, { balance, onTopUp: () => go('topup') })),

    // quick actions
    _h('div', { className: 'qa-grid mt16' },
      [['box', 'Ship now', 'wizard', true], ['star', 'Magic Batch', 'batch'], ['list', 'SKUs', 'skus'], ['wallet', 'Wallet', 'wallet']]
        .map(([ic, lbl, dest, primary]) =>
          _h('button', { key: lbl, className: 'qa' + (primary ? ' qa-primary' : ''), onClick: () => go(dest) },
            _h('div', { className: 'qa-ic' }, _h(Icon, { name: ic, size: 21, stroke: 2.1 })),
            _h('span', null, lbl)))),

    // Magic Batch promo
    _h('button', { className: 'batch-promo mt16', onClick: () => go('batch') },
      _h('div', { className: 'bp-ic' }, _h(Icon, { name: 'star', size: 20, color: '#fff' })),
      _h('div', { style: { flex: 1, textAlign: 'left' } },
        _h('div', { style: { fontSize: 15, fontWeight: 680, letterSpacing: '-.2px' } }, 'Ship in bulk with Magic Batch'),
        _h('div', { style: { fontSize: 12.5, marginTop: 2, opacity: .8 } }, 'Paste a list or scan a photo — AI does the rest')),
      _h(Icon, { name: 'arrowRight', size: 18 })),

    // recent
    _h('div', { className: 'row between mt28', style: { marginBottom: 12 } },
      _h('div', { className: 'title2' }, 'Recent shipments'),
      _h('button', { className: 'link-btn', onClick: () => go('shipments') }, 'See all')),
    _h('div', { className: 'group stagger' },
      D.shipments.slice(0, 3).map((s) =>
        _h(Cell, { key: s.id, onClick: () => go('detail', s) },
          _h(PkgIcon, { status: s.status }),
          _h('div', { style: { flex: 1, minWidth: 0 } },
            _h('div', { style: { fontSize: 15.5, fontWeight: 620, letterSpacing: '-0.2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, s.item),
            _h('div', { className: 'faint tnum', style: { fontSize: 12.5, marginTop: 2 } }, 'N° ' + s.id)),
          _h('div', { style: { textAlign: 'right' } },
            _h(Badge, { status: s.status }),
            _h('div', { className: 'muted', style: { fontSize: 12, marginTop: 5 } }, s.eta)))),
    ),
  );
}

/* ---------- SHIPMENTS LIST ---------- */
function ShipmentsScreen({ go }) {
  const D = window.SE_DATA;
  const [q, setQ] = React.useState('');
  const [tab, setTab] = React.useState('All');
  let list = D.shipments.filter(s => tab === 'All' || (tab === 'Active' ? (s.status === 'On the way' || s.status === 'Pending') : s.status === 'Delivered'));
  if (q) list = list.filter(s => (s.item + s.id).toLowerCase().includes(q.toLowerCase()));
  return _h('div', { className: 'screen' },
    _h('div', { style: { padding: '6px 0 6px' } }, _h('div', { className: 'largetitle' }, 'Shipments')),
    _h('div', { className: 'searchbar mt12' },
      _h(Icon, { name: 'search', size: 18 }),
      _h('input', { value: q, onChange: e => setQ(e.target.value), placeholder: 'Search by item or tracking N°', style: { border: 'none', background: 'transparent', outline: 'none', font: 'inherit', flex: 1, color: 'var(--ink)' } })),
    _h('div', { className: 'segment mt16' }, ['All', 'Active', 'Delivered'].map(t =>
      _h('button', { key: t, className: tab === t ? 'on' : '', onClick: () => setTab(t) }, t))),
    _h('div', { className: 'col gap12 mt16' },
      list.map(s => _h('div', { key: s.id, className: 'card fade-up', onClick: () => go('detail', s), style: { padding: 16, cursor: 'pointer' } },
        _h('div', { className: 'row between' },
          _h('div', { className: 'row gap12', style: { minWidth: 0 } },
            _h(PkgIcon, { status: s.status }),
            _h('div', { style: { minWidth: 0 } },
              _h('div', { style: { fontSize: 15.5, fontWeight: 640, letterSpacing: '-0.2px' } }, s.item),
              _h('div', { className: 'faint tnum', style: { fontSize: 12.5, marginTop: 2 } }, 'N° ' + s.id))),
          _h(Badge, { status: s.status })),
        _h('div', { className: 'row between mt16', style: { paddingTop: 14, borderTop: '1px solid var(--hairline)' } },
          _h('div', null, _h('div', { className: 'faint', style: { fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.4px' } }, 'To'),
            _h('div', { style: { fontSize: 13.5, fontWeight: 560, marginTop: 2 } }, s.to)),
          _h('div', { style: { textAlign: 'right' } }, _h('div', { className: 'faint', style: { fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.4px' } }, 'Paid'),
            _h('div', { className: 'tnum', style: { fontSize: 13.5, fontWeight: 660, marginTop: 2 } }, fmt(s.price))))))),
  );
}

/* ---------- WALLET ---------- */
function WalletScreen({ go, balance }) {
  const D = window.SE_DATA;
  const txIcon = { topup: ['arrowUp', 'var(--green)', 'var(--green-soft)'], label: ['box', 'var(--accent)', 'var(--accent-soft)'], refund: ['refresh', 'var(--amber)', 'var(--amber-soft)'] };
  return _h('div', { className: 'screen' },
    _h('div', { style: { padding: '6px 0 14px' } }, _h('div', { className: 'largetitle' }, 'Wallet')),
    _h(BalanceCard, { balance, onTopUp: () => go('topup') }),
    _h('div', { className: 'row gap12 mt16' },
      _h(Button, { variant: 'primary', icon: 'plus', full: true, onClick: () => go('topup') }, 'Add funds'),
      _h(Button, { variant: 'secondary', icon: 'arrowUp', full: true, onClick: () => go('wizard') }, 'Ship')),
    _h('div', { className: 'mt16', style: { display: 'flex', gap: 10 } },
      _h('div', { className: 'card', style: { flex: 1, padding: 15 } },
        _h('div', { className: 'faint', style: { fontSize: 12, fontWeight: 600 } }, 'Spent this month'),
        _h('div', { className: 'tnum', style: { fontSize: 21, fontWeight: 700, marginTop: 5, letterSpacing: '-.5px' } }, '$41.19')),
      _h('div', { className: 'card', style: { flex: 1, padding: 15 } },
        _h('div', { className: 'faint', style: { fontSize: 12, fontWeight: 600 } }, 'Labels bought'),
        _h('div', { className: 'tnum', style: { fontSize: 21, fontWeight: 700, marginTop: 5, letterSpacing: '-.5px' } }, '3'))),
    _h('div', { className: 'title2 mt28', style: { marginBottom: 12 } }, 'Transactions'),
    _h('div', { className: 'group' }, D.txns.map((t, i) => {
      const [ic, c, soft] = txIcon[t.kind];
      return _h('div', { key: i, className: 'cell', style: { cursor: 'default' } },
        _h('div', { className: 'cell-icon', style: { background: soft } }, _h(Icon, { name: ic, size: 18, color: c, stroke: 2.2 })),
        _h('div', { style: { flex: 1 } },
          _h('div', { style: { fontSize: 14.5, fontWeight: 600 } }, t.label),
          _h('div', { className: 'faint', style: { fontSize: 12.5, marginTop: 2 } }, t.sub + ' · ' + t.date)),
        _h('div', { className: 'tnum', style: { fontSize: 15, fontWeight: 660, color: t.amount > 0 ? 'var(--green)' : 'var(--ink)' } }, fmtS(t.amount)));
    })),
  );
}

/* ---------- TOP-UP ---------- */
function TopUpScreen({ back, onAdd }) {
  const [amt, setAmt] = React.useState(50);
  const [method, setMethod] = React.useState('apple');
  const [loading, setLoading] = React.useState(false);
  const presets = [25, 50, 100, 200];
  const submit = () => { setLoading(true); setTimeout(() => onAdd(amt), 1300); };
  return _h(React.Fragment, null,
   _h('div', { className: 'screen', style: { paddingBottom: 28 } },
    _h('div', { className: 'navbar' },
      _h('button', { className: 'navbtn', onClick: back }, _h(Icon, { name: 'chevronLeft', size: 20 })),
      _h('div', { className: 'nav-title' }, 'Add funds'), _h('div', { style: { width: 40 } })),
    _h('div', { className: 'topup-display' },
      _h('span', { style: { fontSize: 30, fontWeight: 600, opacity: .5, alignSelf: 'flex-start', marginTop: 14 } }, '$'),
      _h('span', { className: 'tnum', style: { fontSize: 72, fontWeight: 740, letterSpacing: '-3px', lineHeight: 1 } }, amt),
      _h('span', { style: { fontSize: 20, fontWeight: 600, opacity: .5, alignSelf: 'flex-end', marginBottom: 16 } }, '.00')),
    _h('div', { className: 'faint', style: { textAlign: 'center', fontSize: 13, marginTop: -4 } }, 'CAD added to wallet'),
    _h('div', { className: 'qa-grid mt20', style: { gridTemplateColumns: 'repeat(4,1fr)' } },
      presets.map(p => _h('button', { key: p, className: 'chip' + (amt === p ? ' chip-on' : ''), onClick: () => setAmt(p) }, '$' + p))),
    _h('div', { className: 'eyebrow mt24', style: { marginBottom: 10 } }, 'Pay with'),
    _h('div', { className: 'group' },
      [['apple', 'Apple Pay', 'Touch ID'], ['visa', 'Visa ···· 4242', 'Default card'], ['interac', 'Interac e-Transfer', 'Manual · ~1 hr']].map(([id, lbl, sub]) =>
        _h('div', { key: id, className: 'cell', onClick: () => setMethod(id) },
          _h('div', { className: 'cell-icon', style: { background: 'var(--surface-2)' } }, _h(Icon, { name: id === 'interac' ? 'arrowUp' : 'wallet', size: 18, color: 'var(--ink)' })),
          _h('div', { style: { flex: 1 } }, _h('div', { style: { fontSize: 14.5, fontWeight: 600 } }, lbl), _h('div', { className: 'faint', style: { fontSize: 12.5, marginTop: 1 } }, sub)),
          _h('div', { className: 'radio' + (method === id ? ' on' : '') }))))),
    _h(window.PhoneFooter, null,
      _h(Button, { variant: 'primary', full: true, onClick: submit, disabled: loading, style: { flex: 1 } },
        loading ? _h('div', { className: 'spin' }) : ('Add $' + amt + '.00'))),
  );
}

/* ---------- DETAIL + TRACKING ---------- */
function DetailScreen({ back, shipment, onVoid }) {
  const s = shipment || window.SE_DATA.shipments[0];
  const delivered = s.status === 'Delivered';
  const steps = [
    { t: 'Label created', loc: 'Toronto, ON', date: 'Jan 17, 9:02 AM', done: true },
    { t: 'Picked up', loc: 'Toronto sorting hub', date: 'Jan 17, 4:40 PM', done: true },
    { t: 'In transit', loc: 'Mississauga, ON', date: 'Jan 18, 7:15 AM', done: true, cur: !delivered },
    { t: 'Out for delivery', loc: 'Vancouver, BC', date: delivered ? 'Jan 21, 8:30 AM' : 'Est. Jan 21', done: delivered },
    { t: 'Delivered', loc: s.to, date: delivered ? 'Jan 21, 2:14 PM' : 'Est. Jan 21', done: delivered, cur: delivered },
  ];
  const subtotal = s.price / 1.13;
  return _h('div', { className: 'screen' },
    _h('div', { className: 'navbar' },
      _h('button', { className: 'navbtn', onClick: back }, _h(Icon, { name: 'chevronLeft', size: 20 })),
      _h('div', { className: 'nav-title tnum' }, 'N° ' + s.id),
      _h('button', { className: 'navbtn' }, _h(Icon, { name: 'share', size: 18 }))),

    // hero
    _h('div', { className: 'card fade-up', style: { padding: 18, marginTop: 4 } },
      _h('div', { className: 'row between' },
        _h('div', { className: 'row gap14', style: { minWidth: 0 } },
          _h(PkgIcon, { status: s.status, size: 50 }),
          _h('div', { style: { minWidth: 0 } },
            _h('div', { style: { fontSize: 17, fontWeight: 680, letterSpacing: '-.3px' } }, s.item),
            _h('div', { className: 'faint', style: { fontSize: 13, marginTop: 2 } }, s.carrier + ' · ' + s.weight))),
        _h(Badge, { status: s.status })),
      _h('div', { className: 'route mt16' },
        _h('div', { className: 'route-end' }, _h('div', { className: 'faint route-lbl' }, 'FROM'), _h('div', { className: 'route-city' }, 'Toronto')),
        _h('div', { className: 'route-line' }, _h('div', { className: 'route-truck' }, _h(Icon, { name: 'truck', size: 14, color: 'var(--accent)' }))),
        _h('div', { className: 'route-end', style: { textAlign: 'right' } }, _h('div', { className: 'faint route-lbl' }, 'TO'), _h('div', { className: 'route-city' }, s.to.split(',')[0])))),

    // ETA banner
    !delivered && _h('div', { className: 'eta-banner mt12' },
      _h(Icon, { name: 'clock', size: 17, color: 'var(--accent)' }),
      _h('div', { style: { flex: 1 } }, _h('span', { style: { fontWeight: 640 } }, 'Arriving ' + s.eta), _h('span', { className: 'faint' }, ' · on schedule'))),

    // timeline
    _h('div', { className: 'title2 mt24', style: { marginBottom: 14 } }, 'Tracking'),
    _h('div', { className: 'card', style: { padding: '20px 18px' } },
      _h('div', { className: 'timeline' }, steps.map((st, i) =>
        _h('div', { key: i, className: 'tl-row' },
          _h('div', { className: 'tl-rail' },
            _h('div', { className: 'tl-node', style: { background: st.done ? 'var(--accent)' : 'var(--surface-2)', border: st.done ? 'none' : '2px solid var(--hairline)' } },
              st.done ? _h(Icon, { name: 'check', size: 15, color: '#fff', stroke: 3 }) : _h('div', { style: { width: 7, height: 7, borderRadius: 4, background: 'var(--faint)' } })),
            i < steps.length - 1 && _h('div', { className: 'tl-line' + (steps[i + 1].done ? ' filled' : '') })),
          _h('div', { className: 'tl-body' },
            _h('div', { style: { display: 'flex', justifyContent: 'space-between', gap: 8 } },
              _h('span', { style: { fontSize: 14.5, fontWeight: st.cur ? 700 : 600, color: st.done ? 'var(--ink)' : 'var(--faint)' } }, st.t),
              _h('span', { className: 'faint tnum', style: { fontSize: 12, whiteSpace: 'nowrap' } }, st.date)),
            _h('div', { className: 'faint', style: { fontSize: 12.5, marginTop: 2 } }, st.loc),
            st.cur && !delivered && _h('span', { className: 'pulse-tag' }, 'Live'))))),
    ),

    // payment breakdown
    _h('div', { className: 'title2 mt24', style: { marginBottom: 12 } }, 'Receipt'),
    _h('div', { className: 'card', style: { padding: 18 } },
      [['Shipment cost', subtotal], ['HST (13%)', s.price - subtotal]].map(([l, v]) =>
        _h('div', { key: l, className: 'row between', style: { marginBottom: 12 } },
          _h('span', { className: 'muted', style: { fontSize: 14.5 } }, l),
          _h('span', { className: 'tnum', style: { fontSize: 14.5, fontWeight: 560 } }, fmt(v)))),
      _h('div', { className: 'row between', style: { paddingTop: 13, borderTop: '1px solid var(--hairline)' } },
        _h('span', { style: { fontSize: 15.5, fontWeight: 680 } }, 'Total paid'),
        _h('span', { className: 'tnum', style: { fontSize: 18, fontWeight: 720 } }, fmt(s.price)))),

    _h('div', { className: 'row gap12 mt20' },
      _h(Button, { variant: 'primary', icon: 'download', full: true }, 'Label'),
      _h(Button, { variant: 'secondary', icon: 'copy', full: true }, 'Tracking N°')),
    (s.status === 'On the way' || s.status === 'Pending') &&
      _h('button', { className: 'void-btn mt12', onClick: onVoid }, _h(Icon, { name: 'x', size: 16 }), 'Void label & refund wallet'),
  );
}

Object.assign(window, { HomeScreen, ShipmentsScreen, WalletScreen, TopUpScreen, DetailScreen, fmt, BalanceCard, PkgIcon });
