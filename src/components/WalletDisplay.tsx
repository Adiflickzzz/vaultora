'use client';
import React, { useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';

import { generateMnemonic, mnemonicToSeedSync } from 'bip39';
import { derivePath } from 'ed25519-hd-key';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import nacl from 'tweetnacl';


interface Wallet {
  publicKey: string;
  privateKey: string;
}
[];

export const WalletGenerate = () => {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [mnemonic, setMnemonic] = useState<string>();
  const [walletIndex, setWalletIndex] = useState(0);
  const [visiblePrivateKeys, setVisiblePrivateKeys] = useState<boolean[]>([]);
  const [visiblePhrases, setVisiblePhrases] = useState<boolean[]>([]);

  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedMnemonic = localStorage.getItem('mnemonic');
    const storedWallets = localStorage.getItem('wallets');

    if (storedMnemonic && storedWallets) {
      setMnemonic(JSON.parse(storedMnemonic));
      setWallets(JSON.parse(storedWallets));
    }
    setIsLoading(false);
  }, []);

  const copyToClipboard = () => {
    if (mnemonic) {
      navigator.clipboard.writeText(mnemonic);
      toast.success('Copied to clipboard!');
    }
  };

  const generateWallet = (mnemonic: string, walletIndex: number, accountType: number) => {
    try {
      const seed = mnemonicToSeedSync(mnemonic);
      const path = `m/44'/${accountType}'/${walletIndex}'/0'`;

      const derivedPath = derivePath(path, seed.toString('hex')).key;

      let publicKeyEncoded: string;
      let privateKeyEncoded: string;

      if (accountType === 501) {
        const { secretKey } = nacl.sign.keyPair.fromSeed(derivedPath);
        const keyPair = Keypair.fromSecretKey(secretKey);

        privateKeyEncoded = bs58.encode(secretKey);
        publicKeyEncoded = keyPair.publicKey.toBase58();
      } else {
        toast.error('We do not support such wallet id');
        return null;
      }
      return {
        publicKey: publicKeyEncoded,
        privateKey: privateKeyEncoded,
      };
    } catch (err) {
      toast.error('Something went wrong.Try again!');
      return null;
    }
  };

  const handleClearAllWallets = () => {
    setWallets([]);
    setVisiblePrivateKeys([]);
    setWalletIndex(0);
    localStorage.removeItem('wallets');
  };

  const handleDeleteWallet = (index: number) => {
    const updatedWallets = wallets.filter((_, i) => i !== index);
    setWallets(updatedWallets);
    setVisiblePrivateKeys(visiblePrivateKeys.filter((_, i) => i !== index));
    localStorage.setItem('wallets', JSON.stringify(updatedWallets));
  };

  const handleGenerateWallet = () => {
    const newMnemonic = generateMnemonic(128);
    setMnemonic(newMnemonic);
    const wallet = generateWallet(newMnemonic, walletIndex, 501);
    if (wallet) {
      const updatedWallets = [...wallets, wallet];
      setWallets(updatedWallets);
      setWalletIndex(walletIndex + 1);
      setVisiblePrivateKeys([...visiblePrivateKeys, false]);
      localStorage.setItem('wallets', JSON.stringify(updatedWallets));
      localStorage.setItem('mnemonic', JSON.stringify(newMnemonic));
      localStorage.setItem('index', JSON.stringify(walletIndex));
    }
  };

  const handleAddWallet = () => {
    console.log(mnemonic);
    if (mnemonic) {
      const wallet = generateWallet(mnemonic, walletIndex, 501);
      if (wallet) {
        const updatedWallets = [...wallets, wallet];
        setWallets(updatedWallets);
        setWalletIndex(walletIndex + 1);
        setVisiblePrivateKeys([...visiblePrivateKeys, false]);
        localStorage.setItem('wallets', JSON.stringify(updatedWallets));
        localStorage.setItem('index', JSON.stringify(walletIndex));
      }
    } else {
      toast.error('Something went wrong. Try again !');
      return;
    }
  };

  const togglePrivateKeyVisibility = (index: number) => {
    setVisiblePrivateKeys(
      visiblePrivateKeys.map((visible, i) => (i === index ? !visible : visible))
    );
  };

  if (isLoading) return;

  return <div></div>;
};
