import { Size } from '@at/geometry'

export enum BoxFit {
  Fill,
  Contain,
  Cover,
  FitWidth,
  FitHeight,
  None,
  ScaleDown,
}

//// => FittedSizes
export class FittedSizes {
  public source: Size
  public destination: Size

  constructor (
    source: Size,
    destination: Size
  ) {
    this.source = source
    this.destination = destination
  }
}

/**
 * 
 * @param fit 
 * @param inputSize 
 * @param outputSize 
 * @returns 
 */
export function applyBoxFit (
  fit: BoxFit, 
  inputSize: Size, 
  outputSize: Size
): FittedSizes {
  if (
    inputSize.height <= 0.0 || 
    inputSize.width <= 0.0 || 
    outputSize.height <= 0.0 || 
    outputSize.width <= 0.0
  ) {
    return new FittedSizes(Size.ZERO, Size.ZERO)
  }

  let sourceSize: Size
  let destinationSize: Size

  switch (fit) {
    case BoxFit.Fill: {
      sourceSize = inputSize
      destinationSize = outputSize
      break
    }

    case BoxFit.Contain: {
      sourceSize = inputSize
      if (
        outputSize.width / outputSize.height > 
        sourceSize.width / sourceSize.height
      ) {
        destinationSize = new Size(
          sourceSize.width * outputSize.height / sourceSize.height, 
          outputSize.height
        )
      } else {
        destinationSize = new Size(
          outputSize.width, 
          sourceSize.height * outputSize.width / sourceSize.width
        )
      }
      break
    }

    case BoxFit.Cover: {
      if (
        outputSize.width / outputSize.height > 
        inputSize.width / inputSize.height
      ) {
        sourceSize = new Size(
          inputSize.width, 
          inputSize.width * outputSize.height / outputSize.width
        )
      } else {
        sourceSize = new Size(
          inputSize.height * outputSize.width / outputSize.height, 
          inputSize.height
        )
      }
      destinationSize = outputSize;
      break
    }
    case BoxFit.FitWidth: {
      sourceSize = new Size(
        inputSize.width, 
        inputSize.width * outputSize.height / outputSize.width
      )
      destinationSize = new Size(
        outputSize.width, 
        sourceSize.height * outputSize.width / sourceSize.width
      )
      break
    }
    case BoxFit.FitHeight: {
      sourceSize = new Size(
        inputSize.height * outputSize.width / outputSize.height, 
        inputSize.height
      )
      destinationSize = new Size(
        sourceSize.width * outputSize.height / sourceSize.height, 
        outputSize.height
      )
      break
    }
    case BoxFit.None: {
      sourceSize = new Size(
        Math.min(inputSize.width, outputSize.width), 
        Math.min(inputSize.height, outputSize.height)
      )
      destinationSize = sourceSize
      break
    }
    case BoxFit.ScaleDown: {
      sourceSize = inputSize
      destinationSize = inputSize
      const aspectRatio = inputSize.width / inputSize.height

      if (destinationSize.height > outputSize.height) {
        destinationSize = new Size(
          outputSize.height * aspectRatio, 
          outputSize.height
        )
      }
      if (destinationSize.width > outputSize.width) {
        destinationSize = new Size(
          outputSize.width, 
          outputSize.width / aspectRatio
        )
      }
      break
    }
  }

  return new FittedSizes(
    sourceSize, 
    destinationSize
  )
}
