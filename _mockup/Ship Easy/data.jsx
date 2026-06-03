// data.jsx — sample content
window.SE_DATA = {
  user: { name: 'Alex Morgan', city: 'Toronto, ON', initials: 'AM' },
  balance: 248.60,
  shipments: [
    { id: 'SE7K42HYJ8', item: 'Vintage camera lens', status: 'On the way', to: 'Vancouver, BC', toName: 'Priya Sharma', price: 18.94, carrier: 'Stallion · Tracked', date: 'Jan 17', eta: 'Jan 21', weight: '1.4 lb' },
    { id: 'SE1A53KOJ2', item: 'Hardcover books (x3)', status: 'Delivered', to: 'Montréal, QC', toName: 'Léa Tremblay', price: 12.40, carrier: 'Stallion · Tracked', date: 'Jan 12', eta: 'Delivered', weight: '3.1 lb' },
    { id: 'SE9F21MQ7L', item: 'Knitted sweater', status: 'Delivered', to: 'Calgary, AB', toName: 'Tom Becker', price: 9.85, carrier: 'Stallion · Economy', date: 'Jan 08', eta: 'Delivered', weight: '0.9 lb' },
    { id: 'SE4D88OTT3', item: 'Ceramic mug set', status: 'Pending', to: 'Halifax, NS', toName: 'Grace Liu', price: 21.10, carrier: 'Stallion · Tracked', date: 'Jan 18', eta: 'Label ready', weight: '2.6 lb' },
  ],
  txns: [
    { kind: 'topup', label: 'Wallet top-up', sub: 'Visa ···· 4242', amount: 100.00, date: 'Jan 17' },
    { kind: 'label', label: 'Label · SE7K42HYJ8', sub: 'Vancouver, BC', amount: -18.94, date: 'Jan 17' },
    { kind: 'refund', label: 'Void refund · SE2X91PLM', sub: 'Unused label', amount: 14.20, date: 'Jan 15' },
    { kind: 'label', label: 'Label · SE1A53KOJ2', sub: 'Montréal, QC', amount: -12.40, date: 'Jan 12' },
    { kind: 'topup', label: 'Wallet top-up', sub: 'Interac e-Transfer', amount: 60.00, date: 'Jan 10' },
    { kind: 'label', label: 'Label · SE9F21MQ7L', sub: 'Calgary, AB', amount: -9.85, date: 'Jan 08' },
  ],
  addresses: [
    { id: 'a1', label: 'Home', name: 'Alex Morgan', line: '221 Spadina Ave, Toronto, ON M5T 2C9', tag: 'sender' },
    { id: 'a2', label: 'Studio', name: 'Alex Morgan', line: '90 Ossington Ave, Toronto, ON M6J 2Z1', tag: 'sender' },
  ],
  skus: [
    { id: 's1', code: 'BOLOHOODIE', name: 'Bolo heavyweight hoodie', value: '64.00', hs: '6110.20', origin: 'Canada', w: '1.6', wUnit: 'lb', dims: '12 × 10 × 4 in', emoji: '🧥', color: '#635BFF' },
    { id: 's2', code: 'CAMLENS50', name: 'Vintage 50mm camera lens', value: '120.00', hs: '9002.11', origin: 'Japan', w: '1.4', wUnit: 'lb', dims: '10 × 8 × 4 in', emoji: '📷', color: '#1E9E6A' },
    { id: 's3', code: 'MUGSET4', name: 'Ceramic mug set (×4)', value: '38.00', hs: '6912.00', origin: 'Canada', w: '2.6', wUnit: 'lb', dims: '11 × 9 × 7 in', emoji: '☕️', color: '#C8860B' },
    { id: 's4', code: 'BOOKHC', name: 'Hardcover book', value: '24.00', hs: '4901.99', origin: 'United States', w: '1.1', wUnit: 'lb', dims: '9 × 6 × 2 in', emoji: '📚', color: '#0A84FF' },
  ],
  batchSample: `Priya Sharma — 1450 Howe St, Vancouver BC V6Z 1R8
Léa Tremblay, 4200 Rue Saint-Denis, Montréal QC H2J 2L1
Tom Becker / 815 1 St SW, Calgary AB T2P 1N3 🇨🇦
Grace Liu, 1741 Lower Water St, Halifax NS B3J 1S5
Daniel O'Connor — 90 Eglinton Ave E, Toronto ON M4P 2Y3`,
};
