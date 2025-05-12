'use client';
import React, { useEffect, useState } from 'react';

import { generateMnemonic, mnemonicToSeedSync } from 'bip39';
import { derivePath } from 'ed25519-hd-key';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import nacl from 'tweetnacl';
import { ethers } from "ethers"

import { IoIosArrowDown } from 'react-icons/io';
import { motion } from 'motion/react';
import { HiOutlineCube } from 'react-icons/hi';
import { VscEye, VscEyeClosed } from 'react-icons/vsc';
import { CirclePlus, Copy, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { toast } from 'sonner';
import { Badge } from './ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';

interface Wallet {
  publicKey: string;
  privateKey: string;
}

export const WalletDisplay = () => {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [walletType,setWalletType] = useState(501);
  const [mnemonic, setMnemonic] = useState<string>();
  const [walletIndex, setWalletIndex] = useState(0);
  const [visiblePrivateKeys, setVisiblePrivateKeys] = useState<boolean[]>([]);
  const [visiblePhrases, setVisiblePhrases] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState(true);

  const isMobile = useIsMobile();

  useEffect(() => {
    const storedMnemonic = localStorage.getItem('mnemonic');
    const storedWallets = localStorage.getItem('wallets');
    setWalletType(501)

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

  const generateWallet = (mnemonic: string, walletIndex: number, walletType: number) => {
    try {
      const seed = mnemonicToSeedSync(mnemonic);

      let path = ''; // Declare in outer scope
      
      if (walletType === 501) {
        path = `m/44'/${walletType}'/${walletIndex}'/0'`;
      } else {
        path = `m/44'/${walletType}'/0'/${walletIndex}'`;
      }
      
      const derivedSeed = derivePath(path, seed.toString('hex')).key;
      

      let publicKeyEncoded: string;
      let privateKeyEncoded: string;

      if (walletType === 501) {
        const { secretKey } = nacl.sign.keyPair.fromSeed(derivedSeed);
        const keyPair = Keypair.fromSecretKey(secretKey);

        privateKeyEncoded = bs58.encode(secretKey);
        publicKeyEncoded = keyPair.publicKey.toBase58();
      }else if(walletType === 60){
        const privateKey = Buffer.from(derivedSeed).toString("hex");
        privateKeyEncoded = privateKey;

        const wallet = new ethers.Wallet(privateKey);
        publicKeyEncoded = wallet.address;
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
      console.log(err);
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
    toast.success('Wallet deleted !');
  };

  const handleGenerateWallet = () => {
    const newMnemonic = generateMnemonic(128);
    setMnemonic(newMnemonic);
    const wallet = generateWallet(newMnemonic, walletIndex, walletType);
    if (wallet) {
      const updatedWallets = [...wallets, wallet];
      setWallets(updatedWallets);
      setWalletIndex(walletIndex + 1);
      setVisiblePrivateKeys([...visiblePrivateKeys, false]);
      localStorage.setItem('wallets', JSON.stringify(updatedWallets));
      localStorage.setItem('mnemonic', JSON.stringify(newMnemonic));
      localStorage.setItem('index', JSON.stringify(walletIndex));
      toast.success('Wallet added !');
    }
  };

  const handleAddWallet = () => {
    console.log(mnemonic);
    if (mnemonic) {
      const wallet = generateWallet(mnemonic, walletIndex, walletType);
      if (wallet) {
        const updatedWallets = [...wallets, wallet];
        setWallets(updatedWallets);
        setWalletIndex(walletIndex + 1);
        setVisiblePrivateKeys([...visiblePrivateKeys, false]);
        localStorage.setItem('wallets', JSON.stringify(updatedWallets));
        localStorage.setItem('index', JSON.stringify(walletIndex));
        toast.success('Wallet added !');
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
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-4xl font-bold flex items-center gap-1.5 ">
            <HiOutlineCube className="rotate-180" />
            {`Vaultora`}
          </h1>
          <Badge className="mt-2 bg-zinc-900/40 border border-white/10 text-xs text-white">
            v1.0
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground ml-1 mt-2">Your Solana wallet, simplified.</p>
      </div>
      {mnemonic && (
        <Card className="p-0 gap-0 bg-zinc-900/50 hover:cursor-pointer">
          <CardTitle
            onClick={() => setVisiblePhrases(!visiblePhrases)}
            className="flex items-center justify-between p-6 hover:bg-zinc-900/60 hover:rounded-lg transition-all duration-300 animate-fade-in"
          >
            <p>Your Secret Phrase</p>

            {visiblePhrases ? (
              <IoIosArrowDown className="rotate-180 transition-all" />
            ) : (
              <IoIosArrowDown className="rotate-0 transition-all" />
            )}
          </CardTitle>
          {visiblePhrases && mnemonic && (
            <>
              <Separator />
              <div className=" pt-4 hover:bg-zinc-900/50 transition-all animate-fade-in">
                <p className="px-6 mb-2 my-0 text-xs text-muted-foreground font-semibold uppercase font-mono">
                  Remember keep your secret phrase safe. Never share it with anyone
                </p>
                <CardContent
                  className="gap-0 p-4 bg-black/60 mx-4 mb-4 rounded-lg"
                  onClick={() => copyToClipboard()}
                >
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 line-clamp-1 ">
                    {mnemonic.split(' ').map((phrase, index) => (
                      <p
                        key={index}
                        className=" font-mono tracking-tighter md:tracking-normal p-2 px-3 bg-zinc-900/30 rounded-lg "
                      >
                        {index + 1}. {phrase}
                      </p>
                    ))}
                  </div>
                  <p className="flex justify-end text-xs font-semibolds text-muted-foreground font-mono px-2 pt-4">
                    Click anywhere to copy.
                  </p>
                </CardContent>
              </div>
            </>
          )}
        </Card>
      )}
      {wallets.length < 1 ? (
       <div>
          {!mnemonic && (
            <>
            <h1 className='mb-4 text-2xl font-semibold'>Select a wallet to continue ~</h1>
            <div className='flex items-center gap-2'>
              <Button onClick={() => {
                setWalletType(60)
                handleGenerateWallet()
              }}>
                Solana
              </Button>
              <Button onClick={() => {
                setWalletType(501)
                handleGenerateWallet()
              }}>
                Ethereum
              </Button>
            </div>
            </>
          )}
          <h1 className="items-center text-center mt-72 font-mono text-sm text-muted-foreground">
            You have no wallets. <br />
            Active wallets will be visible here.
          </h1>
        </div>
      ):(
        <div className="flex items-center justify-between my-4 mt-8">
        <h1 className="text-lg line-clamp-1">Solana Wallet</h1>
        <div className="flex items-center gap-2">
          {wallets.length > 0 && (
            <Button
              onClick={() => handleClearAllWallets()}
              className="bg-red-500/80 hover:bg-red-500 hover:cursor-pointer backdrop-blur-md text-white text-xs"
            >
              <Trash2 className="size-4" />
              Clear all
            </Button>
          )}
          <Button
            onClick={() => (!mnemonic ? handleGenerateWallet() : handleAddWallet())}
            className="bg-zinc-900/50 hover:bg-zinc-900/90 hover:cursor-pointer backdrop-blur-md border border-white/5 text-white"
          >
            {!isMobile && (mnemonic ? 'Add wallet' : 'Generate Wallet')}
            <CirclePlus />
          </Button>
        </div>
      </div>
      )}
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
                className="bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-xl p-5 mb-5 transition-all duration-300 animate-fade-in"
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
                    <p className="text-xs font-mono tracking-widest truncate mr-2">
                      {wallet.publicKey}
                    </p>

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
                    <p className="text-xs truncate mr-2">
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
