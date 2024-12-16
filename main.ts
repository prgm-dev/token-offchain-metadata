import { defaultTokenLists } from "./defaults.ts";
import { TokenMetadataStore } from "./tokens.ts";
import { toHttpsUrl } from "./url.ts";

if (import.meta.main) {
  // Example usage

  const metadataStore = new TokenMetadataStore();

  for (const tokenListHref of defaultTokenLists) {
    console.log(`Fetching token list: ${tokenListHref}`);
    await metadataStore.fetchTokensFromList(toHttpsUrl(tokenListHref));
    console.log("Done.");
  }

  metadataStore.addTokenLogoImageSources(
    { chainId: 1, address: "0x6B175474E89094C44Da98b954EedeAC495271d0F" },
    "/static/images/dai.png",
  );

  console.log(
    metadataStore.getTokenFromAddress({
      chainId: 8453,
      address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
    }),
  );
}
