declare module 'bitcore-mnemonic' {
  class Mnemonic {
    constructor(data: string, wordlist?: Array<string>);
    toSeed(passphrase?: string)
  }

  namespace Mnemonic {}

  export = Mnemonic;
}