import { Gesture } from "."

class Vector {
  static fromVOL (values: number[], offset: number, length: number) {
    const v = new Vector(length)
    v.offset = offset
    v.elements = values

    return v
  }

  public offset: number
  public length: number
  public elements: number[]

  constructor (size: number) {
    this.offset = 0
    this.length = size
    this.elements = new Array(size)
  }

  multiply (a: Vector) {
    let result = 0.0

    for (let i = 0; i < this.length; i += 1) {
      result += this.elements[i] * a.elements[i]
    }

    return result
  }

  set (index: number, value: number) {
    this.elements[index] = value
  }

  norm () {
    return Math.sqrt(this.multiply(this))
  }
}

class Matrix {
  public columns: number
  public elements: number[]

  constructor (rows: number, cols: number) {
    this.columns = cols
    this.elements = new Array(rows * cols)
  }

  get (row: number, col: number) {
    return this.elements[row * this.columns + col]
  }

  set (row: number, col: number, value: number) {
    this.elements[row * this.columns + col] = value
  }

  row (row: number): Vector {
    return Vector.fromVOL(
      this.elements,
      row * this.columns,
      this.columns,
    )
  }
}


export class PolynomialFit {
  static create (degree: number) {
    return new PolynomialFit(degree)
  }

  public coefficients: number[]
  public confidence: number | null = null
  
  constructor (degree: number) {
    this.coefficients = new Array(degree + 1)
  }
}

//// => LeastSquaresSolver
// 最小二乘法
export class LeastSquaresSolver {
  static create (
    x: number[], 
    y: number[], 
    w: number[]
  ) {
    return new LeastSquaresSolver(x, y, w)
  }

  public x: number[]
  public y: number[]
  public w: number[]

  constructor (
    x: number[], 
    y: number[], 
    w: number[]
  ) {
    this.x = x
    this.y = y
    this.w = w
  }
    
  solve (degree: number): PolynomialFit | null {
    if (degree > this.x.length) {
      return null
    }

    const result = PolynomialFit.create(degree)
    const m = this.x.length
    const n = degree + 1

    const a = new Matrix(n, m)

    for (let h = 0; h < m; h += 1) {
      a.set(0, h, this.w[h])
      for (let i = 1; i < n; i += 1) {
        a.set(i, h, a.get(i - 1, h) * this.x[h])
      }
    }

    const q = new Matrix(n, m)
    const r = new Matrix(n, n)

    for (let j = 0; j < n; j += 1) {
      for (let h = 0; h < m; h += 1) {
        q.set(j, h, a.get(j, h))
      }
      for (let i = 0; i < j; i += 1) {
        const dot = q.row(j).multiply(q.row(i))
        for (let h = 0; h < m; h += 1) {
          q.set(j, h, q.get(j, h) - dot * q.get(i, h));
        }
      }

      const norm = q.row(j).norm()
      if (norm < Gesture.env<number>('ATKIT_PRECISION_ERROR_TOLERANCE', 1e-10)) {
        return null
      }

      const inverseNorm = 1.0 / norm
      for (let h = 0; h < m; h += 1) {
        q.set(j, h, q.get(j, h) * inverseNorm)
      }
      for (let i = 0; i < n; i += 1) {
        r.set(j, i, i < j ? 0.0 : q.row(j).multiply(a.row(i)))
      }
    }

    const wy = new Vector(m)
    for (let h = 0; h < m; h += 1) {
      wy.set(h, this.y[h] * this.w[h])
    }
    for (let i = n - 1; i >= 0; i -= 1) {
      result.coefficients[i] = q.row(i).multiply(wy)
      for (let j = n - 1; j > i; j -= 1) {
        result.coefficients[i] -= r.get(i, j) * result.coefficients[j]
      }
      result.coefficients[i] /= r.get(i, i)
    }

    
    let yMean = 0.0
    for (let h = 0; h < m; h += 1) {
      yMean += this.y[h]
    }

    yMean /= m

    let sumSquaredError = 0.0
    let sumSquaredTotal = 0.0

    for (let h = 0; h < m; h += 1) {
      let term = 1.0
      let err = this.y[h] - result.coefficients[0]
      for (let i = 1; i < n; i += 1) {
        term *= this.x[h]
        err -= term * result.coefficients[i]
      }
      sumSquaredError += this.w[h] * this.w[h] * err * err
      const v = this.y[h] - yMean
      sumSquaredTotal += this.w[h] * this.w[h] * v * v;
    }

    result.confidence = sumSquaredTotal <= Gesture.env<number>('ATKIT_PRECISION_ERROR_TOLERANCE', 1e-10)
      ? 1.0 
      : 1.0 - (sumSquaredError / sumSquaredTotal)

    return result
  }
}
