'use client';
import React, { useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { VscEye, VscEyeClosed } from 'react-icons/vsc';
import { Button } from './ui/button';
import { Copy, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';

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

export const WalletDisplay = () => {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [mnemonic, setMnemonic] = useState<string>();
  const [walletIndex, setWalletIndex] = useState(0);
  const [visiblePrivateKeys, setVisiblePrivateKeys] = useState<boolean[]>([]);
  const [visiblePhrases, setVisiblePhrases] = useState<boolean[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedMnemonic = localStorage.getItem('mnemonic');
    const storedWallets = localStorage.getItem('wallets');

    if (storedMnemonic && storedWallets) {
      setMnemonic(JSON.parse(storedMnemonic));
      const parsedWallets = JSON.parse(storedWallets);
      setWallets(parsedWallets);
      setVisiblePrivateKeys(new Array(parsedWallets.length).fill(false));
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
    console.log('clicked', index);
  };

  if (isLoading) return;

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.3,
          ease: 'easeInOut',
        }}
      >
        {wallets.map(
          (wallet, i) =>
            mnemonic && (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  duration: 0.3 + i * 0.1,
                  ease: 'easeInOut',
                }}
                className="bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-xl p-5 mb-5 transition-all duration-300 hover:bg-zinc-900/70 animate-fade-in"
              >
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl p-1 font-semibold">Wallet {i + 1}</h1>
                  <Button
                    onClick={() => handleDeleteWallet(i)}
                    size="icon"
                    variant="ghost"
                    className="hover:cursor-pointer"
                  >
                    <Trash2 />
                  </Button>
                </div>
                <div className="mt-4">
                  <p className="uppercase text-xs text-muted-foreground  p-1 py-2">Public key</p>
                  <div className="bg-zinc-950 border border-white/5 rounded-lg p-3 mb-4 flex items-center justify-between">
                    <p className="text-xs font-mono tracking-widest">{wallet.publicKey}</p>

                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(wallet.publicKey);
                        toast.success('Copied to clipboard!');
                      }}
                      className="text-muted-foreground hover:text-white hover:cursor-pointer transition-all duration-200 p-2 -m-2"
                    >
                      <Copy className="size-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <div className="flex items-center text-muted-foreground">
                    <p className="uppercase text-xs p-1 py-2">Private key</p>
                    <button
                      className="ml-1 hover:text-white hover:cursor-pointer"
                      onClick={() => togglePrivateKeyVisibility(i)}
                    >
                      {visiblePrivateKeys[i] ? (
                        <VscEyeClosed className="size-4" />
                      ) : (
                        <VscEye className="size-4" />
                      )}
                    </button>
                  </div>
                  <div className="bg-zinc-950 border border-white/5 rounded-lg p-3 mb-2 flex items-center justify-between">
                    <p className="text-xs">
                      {visiblePrivateKeys[i]
                        ? wallet.privateKey
                        : '•'.repeat(wallet.privateKey.length)}
                    </p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(wallet.privateKey);
                        toast.success('Copied to clipboard!');
                      }}
                      className="text-muted-foreground hover:text-white hover:cursor-pointer transition-all duration-200 p-2 -m-2"
                    >
                      <Copy className="size-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )
        )}
      </motion.div>
    </div>
  );
};
