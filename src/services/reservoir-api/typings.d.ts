// @ts-ignore
/* eslint-disable */

declare namespace API {
  type Token = {
    contract?: string;
    tokenId?: string;
  };
  type Ownership = {
    tokenCount?: string;
  };
  type OwnedToken = {
    token: Token;
    ownership: Ownership;
  };
  type OwnedTokens = {
    tokens: Array<OwnedToken>;
  };
}
