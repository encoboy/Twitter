export default function showShortAddress(address: string | undefined) {
  if (!address) return '-';

  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
