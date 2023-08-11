import { AtTextPosition, AtTextRange, AtTextSelection } from 'src/at';

export abstract class AtTextLayoutMetrics {
  static isWhitespace (codeUnit: number) {
    switch (codeUnit) {
      case 0x9: // horizontal tab
      case 0xA: // line feed
      case 0xB: // vertical tab
      case 0xC: // form feed
      case 0xD: // carriage return
      case 0x1C: // file separator
      case 0x1D: // group separator
      case 0x1E: // record separator
      case 0x1F: // unit separator
      case 0x20: // space
      case 0xA0: // no-break space
      case 0x1680: // ogham space mark
      case 0x2000: // en quad
      case 0x2001: // em quad
      case 0x2002: // en space
      case 0x2003: // em space
      case 0x2004: // three-per-em space
      case 0x2005: // four-er-em space
      case 0x2006: // six-per-em space
      case 0x2007: // figure space
      case 0x2008: // punctuation space
      case 0x2009: // thin space
      case 0x200A: // hair space
      case 0x202F: // narrow no-break space
      case 0x205F: // medium mathematical space
      case 0x3000: // ideographic space
        break
      default:
        return false
    }
    return true;
  }
 
  abstract getLineAtOffset(position: AtTextPosition): AtTextSelection
  abstract getWordBoundary(position: AtTextPosition): AtTextRange
  abstract getTextPositionAbove(position: AtTextPosition): AtTextPosition
  abstract getTextPositionBelow(position: AtTextPosition): AtTextPosition
}