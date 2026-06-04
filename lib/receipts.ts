import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';
import api from './api';
import { bytesToBase64 } from './base64';
import { toast } from './toast';
import * as Haptics from './haptics';

export type ReceiptKind = 'topup' | 'shipment' | 'shipment_charge' | 'refund';

export interface ReceiptRequest {
  kind: ReceiptKind;
  id: string;
  filename?: string;
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
}

async function saveAndShare(bytes: Uint8Array, filename: string, mimeType: string): Promise<boolean> {
  try {
    const base64 = bytesToBase64(bytes);
    const dir = FileSystem.documentDirectory || '';
    const uri = dir + filename;
    await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });
    if (Platform.OS === 'web') {
      toast.success('Receipt saved');
      return true;
    }
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { mimeType, dialogTitle: 'Share receipt' });
      Haptics.success();
      return true;
    }
    toast.success('Receipt saved to app storage');
    return true;
  } catch (err) {
    toast.error('Could not share receipt');
    return false;
  }
}

export async function downloadReceipt({ kind, id, filename }: ReceiptRequest): Promise<boolean> {
  const safeName = sanitizeFilename(filename || `receipt-${kind}-${id}.pdf`);
  try {
    const res = await api.get(`/receipts/${kind}/${id}`, {
      responseType: 'arraybuffer',
      timeout: 20000,
    });
    const data = res.data;
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    return saveAndShare(bytes, safeName, 'application/pdf');
  } catch (err: any) {
    if (err?.response?.status === 404 || err?.response?.status === 501) {
      return generateFallbackReceipt({ kind, id, filename: safeName });
    }
    Alert.alert('Receipt unavailable', 'We could not generate the receipt right now.');
    return false;
  }
}

function generateFallbackReceipt(req: ReceiptRequest): Promise<boolean> {
  const svg = buildReceiptSvg(req);
  if (Platform.OS === 'web') {
    toast.info('Receipt is a text preview on web');
    return Promise.resolve(true);
  }
  const dir = FileSystem.documentDirectory || '';
  const uri = dir + req.filename || `receipt-${req.kind}-${req.id}.txt`;
  return FileSystem.writeAsStringAsync(uri, svg, { encoding: 'utf8' })
    .then(async () => {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'text/plain', dialogTitle: 'Receipt' });
        Haptics.success();
        return true;
      }
      toast.success('Receipt saved to app storage');
      return true;
    })
    .catch(() => {
      toast.error('Could not save receipt');
      return false;
    });
}

function buildReceiptSvg(req: ReceiptRequest): string {
  const date = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const title = req.kind === 'topup' ? 'Wallet Top-Up' : 'ShipEasy Receipt';
  return [
    'ShipEasy Receipt',
    '-----------------',
    `Type: ${title}`,
    `Reference: ${req.id}`,
    `Date: ${date}`,
    '',
    'Thank you for using ShipEasy.',
  ].join('\n');
}

export function quickShareReceipt(req: ReceiptRequest): void {
  Haptics.light();
  void downloadReceipt(req);
}
