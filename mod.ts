/**
 * # Token Offchain Metadata
 *
 * This library provides a way to retrieve a token image from a token address.
 *
 * It relies on the parsing of [token lists](https://tokenlists.org/) to retrieve
 * the metadata of tokens.
 *
 * ## Usage
 *
 * ### Loading token metadata from a token list
 *
 * Instantiate a {@link TokenMetadataStore}, and then call
 * {@link TokenMetadataStore.prototype.fetchTokensFromList | `fetchTokensFromList`}
 * with the URL of a token list to fetch and parse the token metadata:
 *
 * ```typescript
 * import { TokenMetadataStore, toHttpsUrl } from "@prgm/token-offchain-metadata";
 *
 * const metadataStore = new TokenMetadataStore();
 * await metadataStore.fetchTokensFromList(toHttpsUrl("ipns://tokens.uniswap.org"));
 * ```
 *
 * ### Retrieving token metadata
 *
 * You can retrieve the metadata of a token that was added by calling
 * {@link TokenMetadataStore.prototype.getTokenFromAddress | `getTokenFromAddress`}
 * with the chain ID and address of the token:
 *
 * ```typescript
 * const metadata = metadataStore.getTokenFromAddress({
 *   chainId: 1,
 *   address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
 * });
 * ```
 *
 * ### Manually adding token image sources
 *
 * If you have image sources for a token that are not included in the token list,
 * you can add them manually by calling
 * {@link TokenMetadataStore.prototype.addTokenLogoImageSources | `addTokenLogoImageSources`}.
 *
 * For example, if you have custom image for the DAI token, add a token image source for DAI:
 *
 * ```typescript
 * metadataStore.addTokenLogoImageSources(
 *   { chainId: 1, address: "0x6B175474E89094C44Da98b954EedeAC495271d0F" },
 *   "/static/images/dai.png",
 * );
 * ```
 *
 * Note that if it was "bridged" by one of the token lists, it will be added
 * to the metadata of _all_ associated tokens across chains.
 *
 * @module
 */

export {
  type ChainAddress,
  type TokenMetadata,
  TokenMetadataStore,
} from "./tokens.ts";
export {
  type HttpsUrlString,
  type IpfsUrlString,
  type IpnsUrlString,
  isHttpsUrl,
  toHttpsUrl,
  type Web3URL,
} from "./url.ts";
