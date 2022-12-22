export class Utils {
  static prefix0x(str: string): string {
    if (!str.startsWith('0x')) {
      return '0x' + str;
    }
    return str;
  }
}
