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
export declare class WorkTransport<T extends string = string> extends MessageTransport<WorkPort<T>> {
    index: number;
    count: number;
    decoder: TextDecoder;
    encoder: TextEncoder;
    /**
     *
     * @param port
     */
    connect(uri: unknown): void;
    /**
     *
     * @param content
     * @returns
     */
    send(content: MessageContent<string | {
        [key: string]: unknown;
    }, MessageTransportCommands>): Promise<MessageOwner>;
}
