import { W as WorkerAdapter, a as WorkerHandle } from './time-FU5qoDUW.js';
export { A as AlarmSetMessage, B as BrowserTimeProvider, C as CentralizedWorkerInitMessage, b as ChannelStatus, D as DeliverSignalMessage, c as DeviceFileSystem, d as DirEntry, E as ExecCompleteMessage, e as ExecReplyMessage, f as ExecRequestMessage, F as FileSystemBackend, H as HostToWorkerMessage, K as KernelCallbacks, g as KernelConfig, M as MemoryFileSystem, h as MountConfig, O as OPFS_CHANNEL_SIZE, i as OpfsChannel, j as OpfsChannelStatus, k as OpfsFileSystem, l as OpfsOpcode, P as PlatformIO, S as SharedPipeBuffer, m as StatResult, n as SyscallChannel, T as TimeProvider, V as VirtualPlatformIO, o as WasmPosixKernel, p as WorkerErrorMessage, q as WorkerExitMessage, r as WorkerMessagePort, s as WorkerReadyMessage, t as WorkerToHostMessage, u as centralizedWorkerMain } from './time-FU5qoDUW.js';

declare class BrowserWorkerAdapter implements WorkerAdapter {
    private entryUrl;
    constructor(entryUrl: string | URL);
    createWorker(workerData: unknown): WorkerHandle;
}

export { BrowserWorkerAdapter, WorkerAdapter, WorkerHandle };
