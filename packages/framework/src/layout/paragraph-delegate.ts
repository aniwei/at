import { AtInlineSpan } from '../painting/inline-span'
import { Rect } from '../basic/geometry'
import { 
  AtTextRange, 
  AtTextSelection 
} from '../engine/text'
import { Subscribable } from '../basic/subscribable'

export type AtLayoutParagraphDelegateOptions = {
  text: AtInlineSpan
  selection?: AtTextSelection
  composing?: AtTextRange
}

export class AtLayoutParagraphDelegate extends Subscribable {
  static create (options: AtLayoutParagraphDelegateOptions) {
    return new AtLayoutParagraphDelegate(
      options.text,
      options.selection,
      options.composing
    )
  }
  
  // => text
  private _text: AtInlineSpan 
  public get text () {
    return this._text
  }
  public set text (text: AtInlineSpan) {
    if (this._text !== text) {
      this._text = text
      this.publish('text', text)
    }
  }

  // => selection
  private _selection: AtTextSelection 
  public get selection (): AtTextSelection {
    return this._selection
  }
  public set selection (selection: AtTextSelection) {
    if (this._selection.notEqual(selection)) {
      this._selection = selection
      this.publish('selection', selection)
    }
  }

  // => composing
  private _composing: AtTextRange 
  public get composing (): AtTextRange {
    return this._composing
  }
  public set composing (composing: AtTextRange) {
    if (composing.notEqual(composing)) {
      this._composing = composing
      this.publish('composing', composing)
    }
  }

  constructor (
    text: AtInlineSpan,
    selection: AtTextSelection = AtTextSelection.collapsed(-1),
    composing: AtTextRange = AtTextRange.empty
  ) {
    super()

    this._text = text
    this._selection = selection
    this._composing = composing
  }
}