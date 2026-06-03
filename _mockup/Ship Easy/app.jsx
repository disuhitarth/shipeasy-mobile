// app.jsx — root navigation, tab bar, tweaks
const { Phone: AppPhone, Icon: AIcon, useTweaks, TweaksPanel, TweakSection, TweakColor, TweakToggle, TweakRadio, TweakSlider } = window;
const _a = React.createElement;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#635BFF",
  "dark": false,
  "radius": 22,
  "density": "regular"
}/*EDITMODE-END*/;

const ACCENTS = {
  '#635BFF': '#ECEBFF', // stripe indigo
  '#0A84FF': '#E5F1FF', // apple blue
  '#1E9E6A': '#E2F4EC', // green
  '#0B0B12': '#ECECEF', // ink (uber)
};

function softFor(hex) {
  // build a soft tint in css via color-mix at runtime
  return ACCENTS[hex] || 'color-mix(in srgb, ' + hex + ' 12%, #fff)';
}

function TabBar({ tab, go }) {
  const items = [['home', 'Home', 'home'], ['list', 'Shipments', 'shipments'], null, ['wallet', 'Wallet', 'wallet'], ['user', 'Profile', 'profile']];
  return _a('div', { className: 'tabbar' }, items.map((it, i) => {
    if (!it) return _a('div', { key: 'fab', className: 'fab', onClick: () => go('wizard') }, _a(AIcon, { name: 'plus', size: 26, stroke: 2.4 }));
    const [ic, lbl, dest] = it;
    return _a('div', { key: lbl, className: 'tab' + (tab === dest ? ' active' : ''), onClick: () => go(dest) },
      _a(AIcon, { name: ic, size: 23, stroke: tab === dest ? 2.4 : 2 }), _a('span', null, lbl));
  }));
}

function ProfileScreen() {
  const D = window.SE_DATA;
  const rows = [['user', 'Personal details'], ['pin', 'Address book'], ['wallet', 'Payment methods'], ['shield', 'Security'], ['bell', 'Notifications'], ['info', 'Help & support']];
  return _a('div', { className: 'screen' },
    _a('div', { style: { padding: '6px 0 18px' } }, _a('div', { className: 'largetitle' }, 'Profile')),
    _a('div', { className: 'card', style: { padding: 20, display: 'flex', alignItems: 'center', gap: 16 } },
      _a('div', { className: 'avatar', style: { width: 58, height: 58, fontSize: 22 } }, D.user.initials),
      _a('div', null, _a('div', { style: { fontSize: 19, fontWeight: 700, letterSpacing: '-.4px' } }, D.user.name),
        _a('div', { className: 'faint', style: { fontSize: 13.5, marginTop: 2 } }, D.user.city + ' · Member since 2024'))),
    _a('div', { className: 'group mt16' }, rows.map(([ic, lbl]) =>
      _a('div', { key: lbl, className: 'cell' },
        _a('div', { className: 'cell-icon', style: { background: 'var(--surface-2)' } }, _a(AIcon, { name: ic, size: 18, color: 'var(--ink)' })),
        _a('span', { style: { flex: 1, fontSize: 15, fontWeight: 560 } }, lbl),
        _a(AIcon, { name: 'chevronRight', size: 18, color: 'var(--faint)' })))),
    _a('button', { className: 'void-btn mt20', style: { width: '100%' } }, _a(AIcon, { name: 'arrowUp', size: 16, style: { transform: 'rotate(90deg)' } }), 'Log out'),
    _a('div', { className: 'faint', style: { textAlign: 'center', fontSize: 12, marginTop: 18 } }, 'ShipEasy Canada · v2.4.0'),
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [nav, setNav] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('se_nav')) || { tab: 'home', screen: 'home' }; } catch (e) { return { tab: 'home', screen: 'home' }; }
  });
  const [sel, setSel] = React.useState(null);
  const [balance, setBalance] = React.useState(window.SE_DATA.balance);

  React.useEffect(() => { try { localStorage.setItem('se_nav', JSON.stringify(nav)); } catch (e) {} }, [nav]);

  const go = (screen, payload) => {
    if (screen === 'detail') setSel(payload);
    const tabFor = ['home', 'shipments', 'wallet', 'profile'];
    setNav(n => ({ tab: tabFor.includes(screen) ? screen : n.tab, screen }));
    const el = document.getElementById('screenScroll'); if (el) el.scrollTo({ top: 0 });
  };

  // apply tweak tokens
  React.useEffect(() => {
    const ph = document.getElementById('phone');
    if (!ph) return;
    ph.style.setProperty('--accent', t.accent);
    ph.style.setProperty('--accent-soft', softFor(t.accent));
    ph.style.setProperty('--accent-press', t.accent);
    ph.style.setProperty('--radius', t.radius + 'px');
  }, [t.accent, t.radius, t.dark]);

  const screen = nav.screen;
  const showTabs = !['wizard', 'topup', 'detail', 'batch', 'skus'].includes(screen);

  React.useEffect(() => {
    const el = document.getElementById('screenScroll');
    if (el) el.classList.toggle('with-tabs', showTabs);
  }, [showTabs, screen]);

  let content;
  if (screen === 'wizard') content = _a(window.Wizard, { balance, onClose: () => go('home'), onComplete: (ship, cost, dest) => { setBalance(b => +(b - cost).toFixed(2)); window.SE_DATA.shipments.unshift(ship); window.SE_DATA.txns.unshift({ kind: 'label', label: 'Label · ' + ship.id, sub: ship.to, amount: -cost, date: 'Today' }); if (dest === 'detail') { setSel(ship); go('detail', ship); } else go('home'); } });
  else if (screen === 'batch') content = _a(window.MagicBatch, { balance, onClose: () => go('home'), onComplete: (count, cost, ships) => { setBalance(b => +(b - cost).toFixed(2)); ships.forEach(s => window.SE_DATA.shipments.unshift(s)); window.SE_DATA.txns.unshift({ kind: 'label', label: count + ' labels · Magic Batch', sub: 'Bulk purchase', amount: -cost, date: 'Today' }); go('shipments'); } });
  else if (screen === 'skus') content = _a(window.SkuManagerScreen, { go });
  else if (screen === 'topup') content = _a(window.TopUpScreen, { back: () => go('wallet'), onAdd: (amt) => { setBalance(b => +(b + amt).toFixed(2)); window.SE_DATA.txns.unshift({ kind: 'topup', label: 'Wallet top-up', sub: 'Visa ···· 4242', amount: amt, date: 'Today' }); go('wallet'); } });
  else if (screen === 'detail') content = _a(window.DetailScreen, { back: () => go(nav.tab), shipment: sel, onVoid: () => { if (sel) { sel.status = 'Voided'; setBalance(b => +(b + sel.price).toFixed(2)); window.SE_DATA.txns.unshift({ kind: 'refund', label: 'Void refund · ' + sel.id, sub: 'Unused label', amount: sel.price, date: 'Today' }); } go(nav.tab); } });
  else if (screen === 'shipments') content = _a(window.ShipmentsScreen, { go });
  else if (screen === 'wallet') content = _a(window.WalletScreen, { go, balance });
  else if (screen === 'profile') content = _a(ProfileScreen, null);
  else content = _a(window.HomeScreen, { go, balance });

  return _a(React.Fragment, null,
    _a(AppPhone, { dark: t.dark },
      _a(React.Fragment, { key: screen }, content),
      showTabs && _a(TabBar, { tab: nav.tab, go })),
    _a(TweaksPanel, null,
      _a(TweakSection, { label: 'Brand' }),
      _a(TweakColor, { label: 'Accent', value: t.accent, options: ['#635BFF', '#0A84FF', '#1E9E6A', '#0B0B12'], onChange: v => setTweak('accent', v) }),
      _a(TweakToggle, { label: 'Dark mode', value: t.dark, onChange: v => setTweak('dark', v) }),
      _a(TweakSection, { label: 'Shape' }),
      _a(TweakSlider, { label: 'Corner radius', value: t.radius, min: 10, max: 30, step: 2, unit: 'px', onChange: v => setTweak('radius', v) }),
    ),
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(_a(App, null));
