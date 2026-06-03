import { create } from 'zustand';

interface WalletState {
  balance: number;
  setBalance: (balance: number) => void;
  deduct: (amount: number) => void;
  add: (amount: number) => void;
}

export const useWallet = create<WalletState>((set) => ({
  balance: 0,
  setBalance: (balance) => set({ balance }),
  deduct: (amount) => set((s) => ({ balance: +(s.balance - amount).toFixed(2) })),
  add: (amount) => set((s) => ({ balance: +(s.balance + amount).toFixed(2) })),
}));
