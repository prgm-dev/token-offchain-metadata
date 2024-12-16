import * as v from "@valibot/valibot";
import { isAddress } from "@wevm/viem/utils";
import type { Address } from "@wevm/viem";

/** A Valibot schema that validates an Address using viem's {@link isAddress}. */
export const addressSchema: v.CustomSchema<Address, undefined> = v.custom(
  (s) => typeof s === "string" && isAddress(s, { strict: false }),
);

const tokenInfoSchema = v.object({
  chainId: v.pipe(v.number(), v.safeInteger(), v.minValue(1)),
  /** The check-summed address of the token on the specified chain ID */
  address: addressSchema,
  /** The name of the token */
  name: v.pipe(v.string(), v.maxLength(60)),
  /** The symbol of the token */
  symbol: v.pipe(v.string(), v.maxLength(20)),
  /** The number of decimals the token uses */
  decimals: v.pipe(v.number(), v.safeInteger(), v.minValue(0), v.maxValue(255)),
  /** The logo of the token */
  logoURI: v.optional(v.pipe(v.string(), v.url())),
  /** An object containing any arbitrary or vendor-specific token metadata */
  extensions: v.optional(
    v.object({
      bridgeInfo: v.optional(
        v.record(
          /** Chain ID */
          v.pipe(
            v.string(),
            v.decimal(),
            v.transform(Number),
            v.safeInteger(),
            v.minValue(1),
          ),
          v.object({ tokenAddress: addressSchema }),
        ),
      ),
    }),
  ),
});

export const tokenListSchema = v.object({
  name: v.string(),
  timestamp: v.pipe(v.string(), v.isoTimestamp()),
  version: v.object({
    major: v.pipe(v.number(), v.minValue(0), v.safeInteger()),
    minor: v.pipe(v.number(), v.minValue(0), v.safeInteger()),
    patch: v.pipe(v.number(), v.minValue(0), v.safeInteger()),
  }),
  /** The list of tokens */
  tokens: v.pipe(v.array(tokenInfoSchema), v.minLength(1), v.maxLength(10_000)),
});
