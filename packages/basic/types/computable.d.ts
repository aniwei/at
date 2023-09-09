import { Equalable } from './equalable';
export declare abstract class Computable<T extends Computable<T>> extends Equalable<Computable<T>> implements ArrayLike<number> {
    [n: number]: number;
    length: number;
    get isFinite(): false | undefined;
    get isInfinite(): boolean;
    constructor(...rests: number[]);
    isNaN(): boolean;
    add(object: T): T | unknown;
    subtract(object: T): T | unknown;
    multiply(operand: number): T | unknown;
    divide(operand: T | number): T | unknown;
    modulo(operand: T | unknown): T | unknown;
    inverse(): T | unknown;
}
