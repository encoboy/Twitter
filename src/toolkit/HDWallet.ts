import Wallet from 'ethereumjs-wallet';
import HDKey, { EthereumHDKey } from 'ethereumjs-wallet/hdkey';
import Mnemonic from 'bitcore-mnemonic';

export class HDWalletItem {
  wallet: Wallet;

  /**
   *
   * @param {Wallet} wallet
   */
  constructor(wallet: Wallet) {
    this.wallet = wallet;
  }

  // methods

  getAddress() {
    return this.wallet.getAddressString();
  }

  /**
   * @returns {Buffer}
   */
  getPrivateKey() {
    return this.wallet.getPrivateKey();
  }
}

export class HDWallet {
  seed: any;
  hdPath: string;
  hdKey: EthereumHDKey | null;

  constructor() {
    this.seed = null;
    this.hdPath = "m/44'/60'/0'/0";
    this.hdKey = null;
  }

  // methods

  /**
   *
   * @param {string} m
   */
  initByMnemonic(m: string) {
    let mnemonic = new Mnemonic(m);
    this.seed = mnemonic.toSeed();
    this.hdKey = HDKey.fromMasterSeed(this.seed).derivePath(this.hdPath);
  }

  getDefaultWallet() {
    return this.getWallet(0);
  }

  /**
   *
   * @param {number} index
   */
  getWallet(index: number) {
    if (this.hdKey) {
      return new HDWalletItem(this.hdKey.deriveChild(index).getWallet());
    }

    throw new Error('hdKey null');
  }
}
