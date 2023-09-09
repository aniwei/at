import { EventEmitter } from './events';
import { MessageContent, MessageOwner, MessageTransport, MessageTransportCommands, MessageTransportPort } from './transport';
export type MessagePort = {
    onmessage: null | ((data: MessageEvent<unknown>) => void);
    onmessageerror?: null | ((error: any) => void);
    onerror?: null | ((error: any) => void);
    onopen?: null | (() => void);
    postMessage?: (data: string | ArrayBufferLike | ArrayBufferView | Blob | unknown) => void;
    send?: (data: string | ArrayBufferLike | ArrayBufferView | Blob | unknown) => void;
    close: () => void;
};
export declare class WorkPort<T extends string = string> extends EventEmitter<'open' | 'message' | 'error' | 'close' | 'connected' | T> implements MessageTransportPort {
    protected port: MessagePort;
    constructor(port: MessagePort);
    handleMessage: (...args: unknown[]) => boolean;
    handleError: (error: unknown) => boolean;
    handleOpen: (...args: unknown[]) => boolean;
    send(message: unknown): void | null;
    close(): void;
}
export declare class MessageConv {
    static conv: MessageConv;
    static decode(data: unknown): Promise<string>;
    static encode(data: string): Promise<Uint8Array>;
    decoder: TextDecoder;
    encoder: TextEncoder;
    decode(data: unknown): Promise<string>;
    encode(data: string): Promise<Uint8Array>;
}
export declare class MessageData {
    static LIMIT: number;
    static ID_LENGTH: number;
    static MESSAGE_ID_LENGTH: number;
    static INDEX_LENGTH: number;
    static COUNT_LENGTH: number;
    static HEADER_LENGTH: number;
    static encode(id: string, index: number, count: number, chunk: Uint8Array): Promise<Uint8Array>;
    static decode(content: Uint8Array): Promise<[string, string, string, Uint8Array]>;
}
export declare class WorkTransport<T extends string = string> extends MessageTransport<WorkPort<T>> {
    _index: number;
    get index(): string;
    /**
     * 连接
     * @param {string} uri
     * @param {WorkPort} port
     */
    connect(uri: unknown): void;
    /**
     * 发送数据
     * @param {MessageContent} content
     * @returns {Promise<unknown>}
     */
    send(content: MessageContent<string | {
        [key: string]: unknown;
    }, MessageTransportCommands>): Promise<MessageOwner>;
}
export interface MessageChunk {
    index: number;
    data: Uint8Array;
}
export declare class MessageReceiver extends EventEmitter<'finished' | 'progress'> {
    id: string;
    count: number;
    byteLength: number;
    chunks: MessageChunk[];
    constructor(id: string, count: number);
    receive(index: number, chunk: Uint8Array): void;
}
export declare class MessageReceivers {
    static receivers: Map<string, MessageReceiver>;
    static get(id: string): MessageReceiver | undefined;
    static set(id: string, receiver: MessageReceiver): Map<string, MessageReceiver>;
    static has(id: string): boolean;
    static delete(id: string): boolean;
    static receive(event: MessageEvent, OnEndHandle: (data: MessageContent<unknown>) => void): Promise<MessageReceiver>;
}
export declare class MessageSender extends EventEmitter<string> {
    id: string;
    transport: WorkPort;
    constructor(id: string, transport: WorkPort);
    createFibers(content: Uint8Array): Uint8Array[];
    send(content: unknown): Promise<(void | null)[]>;
}
