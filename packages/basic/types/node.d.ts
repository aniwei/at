export declare abstract class AbstractNode<T extends AbstractNode<T>, U extends unknown = unknown> {
    get attached(): boolean;
    depth: number;
    owner: U | null;
    parent: AbstractNode<T> | null;
    /**
     *
     * @param {AbstractNode<T>} child
     */
    redepthChild(child: AbstractNode<T>): void;
    redepthChildren(): void;
    /**
     *
     * @param {U} owner
     */
    attach(owner: U): void;
    detach(): void;
    /**
     *
     * @param AbstractNode<T> child
     */
    adoptChild(child: AbstractNode<T>): void;
    /**
     *
     * @param {AbstractNode<T>} child
     */
    dropChild(child: AbstractNode<T>): void;
}
