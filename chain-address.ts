/**
 * This module provides types and utilities for working with EVM addresses.
 *
 * It acts as a replacement for the utilities provided by `jsr:@wevm/viem`.
 *
 * @module
 */

import { LruCache } from "@std/cache";

/** Represents an EVM address. */
export type Address = `0x${string}`;

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

/** A key that uniquely identifies a chain address. */
export type ChainAddressKey = string & { __chainAddressKey: true };

/**
 * Given a chain ID and an address, returns a string that uniquely identifies the address
 * across chains.
 *
 * @param chainAddress The chain ID and address to get the key for.
 * @returns The key for the chain address. Consider this opaque and do not rely on its format.
 */
export function getChainAddressKey(
  chainAddress: ChainAddress<number, Address>,
): ChainAddressKey {
  return `${chainAddress.chainId}_${
    chainAddress.address.slice(2)
  }` as ChainAddressKey;
}

/** A Regex that matches a _lowercase_ EVM address. */
const addressRegex = /^0x[a-f0-9]{40}$/;
/** A cache that {@link isAddress} will use to cache computation results. */
const isAddressCache = /*#__PURE__*/ new LruCache<string, boolean>(8192);

/** Returns true if the given string is a valid EVM address. */
export function isAddress(address: string): address is Address {
  address = address.toLocaleLowerCase();

  let result = isAddressCache.get(address) ?? null;

  if (result === null) {
    result = addressRegex.test(address);
    isAddressCache.set(address, result);
  }

  return result;
}
