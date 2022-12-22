import { ethers } from 'ethers';
import { getInfuraProvider } from './sweepNFT';

export class ERC721Oper {
  static async ownerOf(NFTAddress: string, tokenId: string) {
    const ABI = ['function ownerOf(uint256 _tokenId) external view returns (address)'];

    const infuraProvider = getInfuraProvider();

    const NFTContract = new ethers.Contract(NFTAddress, ABI, infuraProvider);

    const result = (await NFTContract.ownerOf(tokenId)) as string;

    return result;
  }
}

export class ERC1155Oper {
  static async balanceOf(NFTAddress: string, addr: string, tokenId: string) {
    const ABI = ['function balanceOf(address _owner, uint256 _id) external view returns (uint256)'];

    const infuraProvider = getInfuraProvider();

    const NFTContract = new ethers.Contract(NFTAddress, ABI, infuraProvider);

    const result = (await NFTContract.balanceOf(addr, tokenId)) as number;

    return result;
  }
}

export class NFTOper {
  /**
   *
   * @param NFTType erc721 erc1155
   * @param NFTAddress the address of contract
   * @param addr the address of owner
   * @param tokenId
   */
  static async balanceOf(
    NFTType: string,
    NFTAddress: string,
    addr: string,
    tokenId: string,
  ): Promise<number> {
    if (NFTType == 'erc721') {
      const o = await ERC721Oper.ownerOf(NFTAddress, tokenId);
      console.log(
        `await ERC721Oper.ownerOf(NFTAddress, tokenId) ${o.toLowerCase()} == ${addr.toLowerCase()}`,
      );
      if (o.toLowerCase() == addr.toLowerCase()) {
        return 1;
      } else {
        return 0;
      }
    } else if (NFTType == 'erc1155') {
      const n = await ERC1155Oper.balanceOf(NFTAddress, addr, tokenId);
      return n;
    }
    return 0;
  }
}
