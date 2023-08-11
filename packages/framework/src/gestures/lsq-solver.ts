import { ArrayLike, At } from '../at'

export class Vector {
  public offset: number
  public length: number
  public elements: ArrayLike<number>

  constructor (size: number) {
    this.offset = 0
    this.length = size
    this.elements = new Float64Array(size)
  }

  static fromVOL (values: ArrayLike<number>, offset: number, length: number) {
    const v = new Vector(length)
    v.offset = offset
    v.elements = values

    return v
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

export class Matrix {
  constructor (rows: number, cols: number) {
    this.columns = cols
    this.elements = new Float64Array(rows * cols)
  }
    
  public columns: number
  public elements: ArrayLike<number>

  get (row: number, col: number) {
    return this.elements[row * this.columns + col]
  }

  set (row: number, col: number, value: number) {
    this.elements[row * this.columns + col] = value
  }

  getRow (row: number): Vector {
    return Vector.fromVOL(
      this.elements,
      row * this.columns,
      this.columns,
    )
  }
}


export class AtPolynomialFit {
  static create (degree: number) {
    return new AtPolynomialFit(degree)
  }

  public coefficients: ArrayLike<number>
  public confidence: number | null = null
  
  constructor (degree: number) {
    this.coefficients = new Float64Array(degree + 1)
  }
}

export class AtLeastSquaresSolver {
  static create (
    x: number[], 
    y: number[], 
    w: number[]
  ) {
    return new AtLeastSquaresSolver(x, y, w)
  }

  constructor (
    x: number[], 
    y: number[], 
    w: number[]
  ) {
    this.x = x
    this.y = y
    this.w = w
  }
    
  public x: number[]
  public y: number[]
  public w: number[]

  solve (degree: number): AtPolynomialFit | null {
    if (degree > this.x.length) {
      return null
    }

    const result = AtPolynomialFit.create(degree)
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
        const dot = q.getRow(j).multiply(q.getRow(i))
        for (let h = 0; h < m; h += 1) {
          q.set(j, h, q.get(j, h) - dot * q.get(i, h));
        }
      }

      const norm = q.getRow(j).norm()
      if (norm < At.kPrecisionErrorTolerance) {
        return null
      }

      const inverseNorm = 1.0 / norm
      for (let h = 0; h < m; h += 1) {
        q.set(j, h, q.get(j, h) * inverseNorm)
      }
      for (let i = 0; i < n; i += 1) {
        r.set(j, i, i < j ? 0.0 : q.getRow(j).multiply(a.getRow(i)))
      }
    }

    const wy = new Vector(m)
    for (let h = 0; h < m; h += 1) {
      wy.set(h, this.y[h] * this.w[h])
    }
    for (let i = n - 1; i >= 0; i -= 1) {
      result.coefficients[i] = q.getRow(i).multiply(wy)
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

    result.confidence = sumSquaredTotal <= At.kPrecisionErrorTolerance 
      ? 1.0 
      : 1.0 - (sumSquaredError / sumSquaredTotal)

    return result
  }
}
