import { safeParse } from "@valibot/valibot";
import {
  type ChainAddress,
  type ChainAddressKey,
  getChainAddressKey,
} from "./chain-address.ts";
import { tokenListSchema } from "./token-list-validation.ts";
import { isHttpsUrl } from "./url.ts";

/**
 * Metadata that describes a token list.
 */
export interface TokenListMetadata {
  /**
   * The name of the token list
   * @example "Uniswap Labs Default"
   */
  name: string;
  /**
   * The timestamp of this list version; i.e. when this immutable version of the list was created
   * @example "2024-12-12T18:01:30.180Z"
   */
  timestamp: string;
  /** The href of the URL to this token list */
  href: string;
  /** The version of the list, used in change detection */
  version: {
    /** The major version of the list. Must be incremented when tokens are removed from the list or token addresses are changed. */
    major: number;
    /** The minor version of the list. Must be incremented when tokens are added to the list. */
    minor: number;
    /** The patch version of the list. Must be incremented for any changes to the list. */
    patch: number;
  };
}

/**
 * Metadata for a token.
 */
export interface TokenMetadata {
  /** Array of image logo for the token */
  logoImages: ReadonlyArray<{
    /** An image source. */
    src: string;
  }>;
}

/**
 * Stores token metadata and provides methods for fetching and retrieving it.
 */
export class TokenMetadataStore {
  /** Map of href to token lists that were loaded. */
  #tokenLists = new Map<string, TokenListMetadata>();
  /** Map of address to token metadata. */
  #tokensByAddress = new Map<ChainAddressKey, TokenMetadata>();

  /**
   * Fetch, parse, and store the contents of a [token list](https://tokenlists.org/).
   *
   * @param tokenListUrl The URL of the token list to fetch and parse.
   * @param options.fetch The fetch function to use. Defaults to the global fetch function.
   * @throws If the token list cannot be fetched or parsed.
   * @returns A promise that resolves when the token list has been fetched and parsed.
   *
   * @see The {@link https://tokenlists.org/ | Token Lists website} for more information on token lists.
   */
  async fetchTokensFromList(
    tokenListUrl: URL,
    options?: { fetch?: typeof fetch },
  ): Promise<void> {
    const response = await (options?.fetch ?? fetch)(tokenListUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch token list: ${response.statusText}`);
    }

    const parseResult = safeParse(tokenListSchema, await response.json());

    if (!parseResult.success) {
      console.error(parseResult.issues);
      throw new Error("Unable to parse token list.");
    }

    for (const token of parseResult.output.tokens) {
      if (token.logoURI && isHttpsUrl(token.logoURI)) {
        const tokenMetadata = this.addTokenLogoImageSources(
          token,
          token.logoURI,
        );

        if (token.extensions?.bridgeInfo) {
          for (
            const [chainIdString, bridgeInfo] of Object.entries(
              token.extensions.bridgeInfo,
            )
          ) {
            const chainId = Number(chainIdString);

            // Link the token to the bridged token
            const key = getChainAddressKey({
              chainId,
              address: bridgeInfo.tokenAddress,
            });
            if (!this.#tokensByAddress.has(key)) {
              this.#tokensByAddress.set(key, tokenMetadata);
            }

            this.addTokenLogoImageSources(
              { chainId, address: bridgeInfo.tokenAddress },
              token.logoURI,
            );
          }
        }
      }
    }

    // On success, store the token list
    this.#tokenLists.set(tokenListUrl.href, {
      name: parseResult.output.name,
      timestamp: parseResult.output.timestamp,
      version: parseResult.output.version,
      href: tokenListUrl.href,
    });
  }

  /**
   * Add new image sources to a token's metadata, if they are not already present.
   *
   * @param chainAddress The chain ID and address of the token to add image sources to.
   * @param newSources The new image sources to add.
   * @returns The updated token metadata.
   */
  addTokenLogoImageSources(
    chainAddress: ChainAddress,
    ...newSources: ReadonlyArray<string>
  ): TokenMetadata {
    const key = getChainAddressKey(chainAddress);
    let tokenMetadata = this.#tokensByAddress.get(
      key,
    );
    if (!tokenMetadata) {
      tokenMetadata = { logoImages: [] };
      this.#tokensByAddress.set(key, tokenMetadata);
    }

    const newLogoImages = tokenMetadata.logoImages.slice();
    for (const src of newSources) {
      if (tokenMetadata.logoImages.every((image) => image.src !== src)) {
        newLogoImages.push({ src });
      }
    }
    tokenMetadata.logoImages = newLogoImages;
    return tokenMetadata;
  }

  /**
   * Retrieve a token by its address and return its metadata.
   *
   * @param chainAddress The chain ID and address of the token to retrieve.
   * @returns The token metadata, or `null` if the token is not found.
   */
  getTokenFromAddress(chainAddress: ChainAddress): TokenMetadata | null {
    return this.#tokensByAddress.get(
      getChainAddressKey(chainAddress),
    ) ?? null;
  }

  /**
   * An array of metadata of token lists that were loaded.
   */
  get tokenLists(): Array<TokenListMetadata> {
    return Array.from(this.#tokenLists.values());
  }

  /**
   * From a given URL or href, return the token list metadata if it was loaded.
   */
  getTokenListMetadata(tokenListUrl: URL | string): TokenListMetadata | null {
    if (typeof tokenListUrl === "string") {
      tokenListUrl = new URL(tokenListUrl);
    }
    return this.#tokenLists.get(tokenListUrl.href) ?? null;
  }
}
