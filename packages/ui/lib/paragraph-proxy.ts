import { invariant } from '@at/utils'
import { InlineSpan } from '@at/painting'
import { 
  TextRange, 
  TextSelection 
} from '@at/engine'
import { Subscribable } from '@at/basic'


//// => ParagraphProxy
// 文本代理
export interface ParagraphProxyOptions {
  text: InlineSpan
  selection?: TextSelection
  composing?: TextRange
}

export class ParagraphProxy extends Subscribable {
  /**
   * 创建 ParagraphProxy 对象
   * @param {ParagraphProxyOptions} options 
   * @returns 
   */
  static create (options: ParagraphProxyOptions) {
    return new ParagraphProxy(
      options.text,
      options.selection,
      options.composing
    )
  }
  
  // => text
  protected _text: InlineSpan | null = null
  public get text () {
    invariant(this._text, 'The "ParagraphProxy.text" cannot be null.')
    return this._text
  }
  public set text (text: InlineSpan) {
    if (
      this._text === null || 
      this._text !== text
    ) {
      this._text = text
      this.publish('text', text)
    }
  }

  // => selection
  // 选择区间
  protected _selection: TextSelection  | null = null
  public get selection (): TextSelection {
    invariant(this._selection, 'The "ParagraphProxy.selection" cannot be null.')
    return this._selection
  }
  public set selection (selection: TextSelection) {
    if (this._selection === null || this._selection.notEqual(selection)) {
      this._selection = selection
      this.publish('selection', selection)
    }
  }

  // => composing
  protected _composing: TextRange | null = null 
  public get composing (): TextRange {
    invariant(this._composing !== null, 'The "ParagraphProxy.composigin" cannot be null.')
    return this._composing
  }
  public set composing (composing: TextRange) {
    if (this._composing === null || this._composing.notEqual(composing)) {
      this._composing = composing
      this.publish('composing', composing)
    }
  }

  constructor (
    text: InlineSpan,
    selection: TextSelection = TextSelection.collapsed(-1),
    composing: TextRange = TextRange.empty()
  ) {
    super()

    this.text = text
    this.selection = selection
    this.composing = composing
  }
}