import { defaultIpfsProvider } from "./defaults.ts";

/**
 * The `href` of a URL with the protocol set to `https:`.
 */
export type HttpsUrlString = `https://${string}`;
/**
 * The `href` of a URL with the protocol set to `ipfs:`.
 */
export type IpfsUrlString = `ipfs://${string}`;
/**
 * The `href` of a URL with the protocol set to `ipns:`.
 */
export type IpnsUrlString = `ipns://${string}`;
/**
 * A Web3-native URL, using the HTTP or IPFS protocols.
 */
export type Web3URL = HttpsUrlString | IpfsUrlString | IpnsUrlString;

function buildIpfsHttpsUrl(
  cid: string,
  ipfsProvider?: HttpsUrlString,
): `https://${string}/ipfs/${string}` {
  return `${ipfsProvider ?? defaultIpfsProvider}/ipfs/${cid}`;
}

function buildIpnsHttpUrl(
  cid: string,
  ipfsProvider?: HttpsUrlString,
): `https://${string}/ipns/${string}` {
  return `${ipfsProvider ?? defaultIpfsProvider}/ipns/${cid}`;
}

/**
 * Given the href of a Web3 URL, returns a URL object with the protocol set to `https:`.
 *
 * @param href The Web3 URL to convert to an HTTPS URL.
 * @param ipfsProvider The IPFS gateway provider to use if the href is on the IPFS protocol.
 * @throws If the URL protocol is not supported.
 */
export function toHttpsUrl(
  href: Web3URL,
  ipfsProvider: HttpsUrlString = defaultIpfsProvider,
): URL {
  const url = new URL(href);
  switch (url.protocol) {
    case "https:":
      return url;
    case "ipfs:":
      return new URL(
        `${url.pathname}${url.search}${url.hash}`,
        buildIpfsHttpsUrl(url.hostname, ipfsProvider),
      );
    case "ipns:":
      return new URL(
        `${url.pathname}${url.search}${url.hash}`,
        buildIpnsHttpUrl(url.hostname, ipfsProvider),
      );
    default:
      throw new Error(`Unsupported URL protocol: ${url.protocol}`);
  }
}

/**
 * Return `true` if a URL's href is an HTTPS URL.
 *
 * @param href The href of the URL to check.
 */
export function isHttpsUrl(href: string): href is HttpsUrlString {
  return href.startsWith("https://");
}
