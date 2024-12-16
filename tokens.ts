import { safeParse } from "@valibot/valibot";
import type { Address } from "@wevm/viem";
import { getAddress } from "@wevm/viem/utils";
import { isHttpsUrl } from "./url.ts";
import { tokenListSchema } from "./token-list-validation.ts";

/**
 * An address on a specific chain.
 */
export interface ChainAddress<
  C extends number = number,
  A extends Address = Address,
> {
  /** The chain ID of the address */
  chainId: C;
  /** The address on the specified chain */
  address: A;
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
  #tokensByAddress = new Map<Address, TokenMetadata>();

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
          { chainId: token.chainId, address: token.address },
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
            const address = getAddress(bridgeInfo.tokenAddress, chainId);
            if (!this.#tokensByAddress.has(address)) {
              this.#tokensByAddress.set(address, tokenMetadata);
            }

            this.addTokenLogoImageSources(
              { chainId, address: bridgeInfo.tokenAddress },
              token.logoURI,
            );
          }
        }
      }
    }
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
    const address = getAddress(chainAddress.address, chainAddress.chainId);
    let tokenMetadata = this.#tokensByAddress.get(
      address,
    );
    if (!tokenMetadata) {
      tokenMetadata = { logoImages: [] };
      this.#tokensByAddress.set(address, tokenMetadata);
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
      getAddress(chainAddress.address, chainAddress.chainId),
    ) ?? null;
  }
}
