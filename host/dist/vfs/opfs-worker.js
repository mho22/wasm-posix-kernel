// src/vfs/opfs-worker.ts
var Status = {
  Idle: 0,
  Pending: 1,
  Complete: 2,
  Error: 3
};
var Opcode = {
  OPEN: 1,
  CLOSE: 2,
  READ: 3,
  WRITE: 4,
  SEEK: 5,
  FSTAT: 6,
  FTRUNCATE: 7,
  FSYNC: 8,
  STAT: 9,
  LSTAT: 10,
  MKDIR: 11,
  RMDIR: 12,
  UNLINK: 13,
  RENAME: 14,
  ACCESS: 15,
  OPENDIR: 16,
  READDIR: 17,
  CLOSEDIR: 18
};
var ENOENT = -2;
var EBADF = -9;
var EEXIST = -17;
var EISDIR = -21;
var EINVAL = -22;
var ENOSPC = -28;
var ENOTEMPTY = -39;
var ENOTSUP = -95;
var O_CREAT = 64;
var O_TRUNC = 512;
var O_APPEND = 1024;
var O_DIRECTORY = 65536;
var S_IFREG = 32768;
var S_IFDIR = 16384;
var SEEK_SET = 0;
var SEEK_CUR = 1;
var SEEK_END = 2;
var DT_REG = 8;
var DT_DIR = 4;
var STATUS_OFFSET_I32 = 0;
var OPCODE_OFFSET = 4;
var ARGS_OFFSET = 8;
var RESULT_OFFSET = 56;
var RESULT2_OFFSET = 60;
var DATA_OFFSET = 64;
var WorkerChannel = class {
  i32;
  view;
  buffer;
  constructor(buffer) {
    this.buffer = buffer;
    this.i32 = new Int32Array(buffer);
    this.view = new DataView(buffer);
  }
  get opcode() {
    return this.view.getInt32(OPCODE_OFFSET, true);
  }
  getArg(index) {
    return this.view.getInt32(ARGS_OFFSET + index * 4, true);
  }
  set result(value) {
    this.view.setInt32(RESULT_OFFSET, value, true);
  }
  set result2(value) {
    this.view.setInt32(RESULT2_OFFSET, value, true);
  }
  get dataBuffer() {
    return new Uint8Array(this.buffer, DATA_OFFSET);
  }
  readString(length) {
    return new TextDecoder().decode(new Uint8Array(this.buffer, DATA_OFFSET, length));
  }
  readTwoStrings(totalLength) {
    const data = new Uint8Array(this.buffer, DATA_OFFSET, totalLength);
    const nullIdx = data.indexOf(0);
    const decoder = new TextDecoder();
    return [
      decoder.decode(data.subarray(0, nullIdx)),
      decoder.decode(data.subarray(nullIdx + 1))
    ];
  }
  writeString(str) {
    const bytes = new TextEncoder().encode(str);
    this.dataBuffer.set(bytes);
    return bytes.length;
  }
  writeStatResult(stat) {
    const f64 = new Float64Array(this.buffer, DATA_OFFSET, 10);
    f64[0] = stat.dev;
    f64[1] = stat.ino;
    f64[2] = stat.mode;
    f64[3] = stat.nlink;
    f64[4] = stat.uid;
    f64[5] = stat.gid;
    f64[6] = stat.size;
    f64[7] = stat.atimeMs;
    f64[8] = stat.mtimeMs;
    f64[9] = stat.ctimeMs;
  }
  notifyComplete() {
    Atomics.store(this.i32, STATUS_OFFSET_I32, Status.Complete);
    Atomics.notify(this.i32, STATUS_OFFSET_I32);
  }
  notifyError(errno) {
    this.result = errno;
    Atomics.store(this.i32, STATUS_OFFSET_I32, Status.Error);
    Atomics.notify(this.i32, STATUS_OFFSET_I32);
  }
};
var channel;
var opfsRoot;
var nextFileHandle = 1;
var nextDirHandle = 1;
var fileHandles = /* @__PURE__ */ new Map();
var dirHandles = /* @__PURE__ */ new Map();
function splitPath(path) {
  const normalized = path.replace(/^\/+|\/+$/g, "").replace(/\/+/g, "/");
  if (!normalized) return { dirParts: [], name: "" };
  const parts = normalized.split("/");
  const name = parts.pop();
  return { dirParts: parts, name };
}
async function resolveParentDir(dirParts) {
  let dir = opfsRoot;
  for (const part of dirParts) {
    dir = await dir.getDirectoryHandle(part);
  }
  return dir;
}
async function resolvePath(path) {
  const { dirParts, name } = splitPath(path);
  const dir = await resolveParentDir(dirParts);
  return { dir, name };
}
async function resolveDir(path) {
  const normalized = path.replace(/^\/+|\/+$/g, "").replace(/\/+/g, "/");
  if (!normalized) return opfsRoot;
  const parts = normalized.split("/");
  let dir = opfsRoot;
  for (const part of parts) {
    dir = await dir.getDirectoryHandle(part);
  }
  return dir;
}
function mapError(err) {
  if (err instanceof DOMException) {
    switch (err.name) {
      case "NotFoundError":
        return ENOENT;
      case "TypeMismatchError":
        return EISDIR;
      case "InvalidModificationError":
        return ENOTEMPTY;
      case "QuotaExceededError":
        return ENOSPC;
      case "NotAllowedError":
        return ENOENT;
      // OPFS: usually means file doesn't exist in this context
      default:
        return EINVAL;
    }
  }
  if (err instanceof TypeError) {
    return EINVAL;
  }
  return EINVAL;
}
async function handleOpen() {
  const flags = channel.getArg(0);
  const _mode = channel.getArg(1);
  const pathLen = channel.getArg(2);
  const path = channel.readString(pathLen);
  try {
    if (flags & O_DIRECTORY) {
      await resolveDir(path);
      const handle = nextFileHandle++;
      fileHandles.set(handle, {
        handle: null,
        position: 0,
        appendMode: false
      });
      channel.result = handle;
      channel.notifyComplete();
      return;
    }
    const { dir, name } = await resolvePath(path);
    const create = !!(flags & O_CREAT);
    const fileHandle = await dir.getFileHandle(name, { create });
    const syncHandle = await fileHandle.createSyncAccessHandle();
    if (flags & O_TRUNC) {
      syncHandle.truncate(0);
    }
    const id = nextFileHandle++;
    let position = 0;
    if (flags & O_APPEND) {
      position = syncHandle.getSize();
    }
    fileHandles.set(id, {
      handle: syncHandle,
      position,
      appendMode: !!(flags & O_APPEND)
    });
    channel.result = id;
    channel.notifyComplete();
  } catch (err) {
    channel.notifyError(mapError(err));
  }
}
async function handleClose() {
  const handle = channel.getArg(0);
  const entry = fileHandles.get(handle);
  if (!entry) {
    channel.notifyError(EBADF);
    return;
  }
  try {
    if (entry.handle) {
      entry.handle.close();
    }
    fileHandles.delete(handle);
    channel.result = 0;
    channel.notifyComplete();
  } catch (err) {
    channel.notifyError(mapError(err));
  }
}
async function handleRead() {
  const handle = channel.getArg(0);
  const length = channel.getArg(1);
  const offsetLo = channel.getArg(2);
  const offsetHi = channel.getArg(3);
  const hasOffset = channel.getArg(4);
  const entry = fileHandles.get(handle);
  if (!entry || !entry.handle) {
    channel.notifyError(EBADF);
    return;
  }
  try {
    const readAt = hasOffset ? offsetHi * 4294967296 + (offsetLo >>> 0) : entry.position;
    const data = channel.dataBuffer;
    const target = data.subarray(0, length);
    const bytesRead = entry.handle.read(target, { at: readAt });
    if (!hasOffset) {
      entry.position += bytesRead;
    }
    channel.result = bytesRead;
    channel.notifyComplete();
  } catch (err) {
    channel.notifyError(mapError(err));
  }
}
async function handleWrite() {
  const handle = channel.getArg(0);
  const length = channel.getArg(1);
  const offsetLo = channel.getArg(2);
  const offsetHi = channel.getArg(3);
  const hasOffset = channel.getArg(4);
  const entry = fileHandles.get(handle);
  if (!entry || !entry.handle) {
    channel.notifyError(EBADF);
    return;
  }
  try {
    let writeAt;
    if (hasOffset) {
      writeAt = offsetHi * 4294967296 + (offsetLo >>> 0);
    } else if (entry.appendMode) {
      writeAt = entry.handle.getSize();
    } else {
      writeAt = entry.position;
    }
    const data = channel.dataBuffer.slice(0, length);
    const bytesWritten = entry.handle.write(data, { at: writeAt });
    if (!hasOffset) {
      if (entry.appendMode) {
        entry.position = entry.handle.getSize();
      } else {
        entry.position += bytesWritten;
      }
    }
    channel.result = bytesWritten;
    channel.notifyComplete();
  } catch (err) {
    channel.notifyError(mapError(err));
  }
}
async function handleSeek() {
  const handle = channel.getArg(0);
  const offsetLo = channel.getArg(1);
  const offsetHi = channel.getArg(2);
  const whence = channel.getArg(3);
  const entry = fileHandles.get(handle);
  if (!entry || !entry.handle) {
    channel.notifyError(EBADF);
    return;
  }
  try {
    const offset = offsetHi * 4294967296 + (offsetLo >>> 0);
    let newPos;
    switch (whence) {
      case SEEK_SET:
        newPos = offset;
        break;
      case SEEK_CUR:
        newPos = entry.position + offset;
        break;
      case SEEK_END:
        newPos = entry.handle.getSize() + offset;
        break;
      default:
        channel.notifyError(EINVAL);
        return;
    }
    if (newPos < 0) {
      channel.notifyError(EINVAL);
      return;
    }
    entry.position = newPos;
    channel.result = newPos;
    channel.notifyComplete();
  } catch (err) {
    channel.notifyError(mapError(err));
  }
}
async function handleFstat() {
  const handle = channel.getArg(0);
  const entry = fileHandles.get(handle);
  if (!entry) {
    channel.notifyError(EBADF);
    return;
  }
  try {
    if (!entry.handle) {
      const now = Date.now();
      channel.writeStatResult({
        dev: 0,
        ino: 0,
        mode: S_IFDIR | 493,
        nlink: 1,
        uid: 0,
        gid: 0,
        size: 0,
        atimeMs: now,
        mtimeMs: now,
        ctimeMs: now
      });
    } else {
      const size = entry.handle.getSize();
      const now = Date.now();
      channel.writeStatResult({
        dev: 0,
        ino: 0,
        mode: S_IFREG | 420,
        nlink: 1,
        uid: 0,
        gid: 0,
        size,
        atimeMs: now,
        mtimeMs: now,
        ctimeMs: now
      });
    }
    channel.result = 0;
    channel.notifyComplete();
  } catch (err) {
    channel.notifyError(mapError(err));
  }
}
async function handleFtruncate() {
  const handle = channel.getArg(0);
  const lengthLo = channel.getArg(1);
  const lengthHi = channel.getArg(2);
  const length = lengthHi * 4294967296 + (lengthLo >>> 0);
  const entry = fileHandles.get(handle);
  if (!entry || !entry.handle) {
    channel.notifyError(EBADF);
    return;
  }
  try {
    entry.handle.truncate(length);
    channel.result = 0;
    channel.notifyComplete();
  } catch (err) {
    channel.notifyError(mapError(err));
  }
}
async function handleFsync() {
  const handle = channel.getArg(0);
  const entry = fileHandles.get(handle);
  if (!entry || !entry.handle) {
    channel.notifyError(EBADF);
    return;
  }
  try {
    entry.handle.flush();
    channel.result = 0;
    channel.notifyComplete();
  } catch (err) {
    channel.notifyError(mapError(err));
  }
}
async function handleStat(isLstat) {
  const pathLen = channel.getArg(0);
  const path = channel.readString(pathLen);
  try {
    const normalized = path.replace(/^\/+|\/+$/g, "").replace(/\/+/g, "/");
    if (!normalized) {
      const now2 = Date.now();
      channel.writeStatResult({
        dev: 0,
        ino: 0,
        mode: S_IFDIR | 493,
        nlink: 1,
        uid: 0,
        gid: 0,
        size: 0,
        atimeMs: now2,
        mtimeMs: now2,
        ctimeMs: now2
      });
      channel.result = 0;
      channel.notifyComplete();
      return;
    }
    const { dir, name } = await resolvePath(path);
    try {
      await dir.getDirectoryHandle(name);
      const now2 = Date.now();
      channel.writeStatResult({
        dev: 0,
        ino: 0,
        mode: S_IFDIR | 493,
        nlink: 1,
        uid: 0,
        gid: 0,
        size: 0,
        atimeMs: now2,
        mtimeMs: now2,
        ctimeMs: now2
      });
      channel.result = 0;
      channel.notifyComplete();
      return;
    } catch {
    }
    const fileHandle = await dir.getFileHandle(name);
    const syncHandle = await fileHandle.createSyncAccessHandle();
    const size = syncHandle.getSize();
    syncHandle.close();
    const now = Date.now();
    channel.writeStatResult({
      dev: 0,
      ino: 0,
      mode: S_IFREG | 420,
      nlink: 1,
      uid: 0,
      gid: 0,
      size,
      atimeMs: now,
      mtimeMs: now,
      ctimeMs: now
    });
    channel.result = 0;
    channel.notifyComplete();
  } catch (err) {
    channel.notifyError(mapError(err));
  }
}
async function handleMkdir() {
  const _mode = channel.getArg(0);
  const pathLen = channel.getArg(1);
  const path = channel.readString(pathLen);
  try {
    const { dir, name } = await resolvePath(path);
    try {
      await dir.getDirectoryHandle(name);
      channel.notifyError(EEXIST);
      return;
    } catch {
    }
    await dir.getDirectoryHandle(name, { create: true });
    channel.result = 0;
    channel.notifyComplete();
  } catch (err) {
    channel.notifyError(mapError(err));
  }
}
async function handleRmdir() {
  const pathLen = channel.getArg(0);
  const path = channel.readString(pathLen);
  try {
    const { dir, name } = await resolvePath(path);
    await dir.removeEntry(name);
    channel.result = 0;
    channel.notifyComplete();
  } catch (err) {
    channel.notifyError(mapError(err));
  }
}
async function handleUnlink() {
  const pathLen = channel.getArg(0);
  const path = channel.readString(pathLen);
  try {
    const { dir, name } = await resolvePath(path);
    await dir.removeEntry(name);
    channel.result = 0;
    channel.notifyComplete();
  } catch (err) {
    channel.notifyError(mapError(err));
  }
}
async function handleRename() {
  const totalLen = channel.getArg(0);
  const [oldPath, newPath] = channel.readTwoStrings(totalLen);
  try {
    const oldResolved = await resolvePath(oldPath);
    const newResolved = await resolvePath(newPath);
    let isFile = true;
    try {
      await oldResolved.dir.getFileHandle(oldResolved.name);
    } catch {
      isFile = false;
    }
    if (isFile) {
      const srcFileHandle = await oldResolved.dir.getFileHandle(oldResolved.name);
      const srcSync = await srcFileHandle.createSyncAccessHandle();
      const size = srcSync.getSize();
      const buf = new Uint8Array(size);
      srcSync.read(buf, { at: 0 });
      srcSync.close();
      const dstFileHandle = await newResolved.dir.getFileHandle(newResolved.name, { create: true });
      const dstSync = await dstFileHandle.createSyncAccessHandle();
      dstSync.truncate(0);
      dstSync.write(buf, { at: 0 });
      dstSync.flush();
      dstSync.close();
      await oldResolved.dir.removeEntry(oldResolved.name);
    } else {
      channel.notifyError(ENOTSUP);
      return;
    }
    channel.result = 0;
    channel.notifyComplete();
  } catch (err) {
    channel.notifyError(mapError(err));
  }
}
async function handleAccess() {
  const amode = channel.getArg(0);
  const pathLen = channel.getArg(1);
  const path = channel.readString(pathLen);
  try {
    const normalized = path.replace(/^\/+|\/+$/g, "").replace(/\/+/g, "/");
    if (!normalized) {
      channel.result = 0;
      channel.notifyComplete();
      return;
    }
    const { dir, name } = await resolvePath(path);
    try {
      await dir.getDirectoryHandle(name);
    } catch {
      await dir.getFileHandle(name);
    }
    channel.result = 0;
    channel.notifyComplete();
  } catch (err) {
    channel.notifyError(mapError(err));
  }
}
async function handleOpendir() {
  const pathLen = channel.getArg(0);
  const path = channel.readString(pathLen);
  try {
    const dirHandle = await resolveDir(path);
    const entries = [];
    for await (const [name, handle] of dirHandle.entries()) {
      entries.push({ name, kind: handle.kind });
    }
    const id = nextDirHandle++;
    dirHandles.set(id, { entries, index: 0 });
    channel.result = id;
    channel.notifyComplete();
  } catch (err) {
    channel.notifyError(mapError(err));
  }
}
async function handleReaddir() {
  const handle = channel.getArg(0);
  const iter = dirHandles.get(handle);
  if (!iter) {
    channel.notifyError(EBADF);
    return;
  }
  if (iter.index >= iter.entries.length) {
    channel.result = 1;
    channel.notifyComplete();
    return;
  }
  const entry = iter.entries[iter.index++];
  const nameBytes = new TextEncoder().encode(entry.name);
  const data = channel.dataBuffer;
  data.set(nameBytes);
  data[nameBytes.length] = entry.kind === "directory" ? DT_DIR : DT_REG;
  channel.result = 0;
  channel.result2 = nameBytes.length;
  channel.notifyComplete();
}
async function handleClosedir() {
  const handle = channel.getArg(0);
  if (!dirHandles.delete(handle)) {
    channel.notifyError(EBADF);
    return;
  }
  channel.result = 0;
  channel.notifyComplete();
}
async function dispatch() {
  const op = channel.opcode;
  switch (op) {
    case Opcode.OPEN:
      return handleOpen();
    case Opcode.CLOSE:
      return handleClose();
    case Opcode.READ:
      return handleRead();
    case Opcode.WRITE:
      return handleWrite();
    case Opcode.SEEK:
      return handleSeek();
    case Opcode.FSTAT:
      return handleFstat();
    case Opcode.FTRUNCATE:
      return handleFtruncate();
    case Opcode.FSYNC:
      return handleFsync();
    case Opcode.STAT:
      return handleStat(false);
    case Opcode.LSTAT:
      return handleStat(true);
    case Opcode.MKDIR:
      return handleMkdir();
    case Opcode.RMDIR:
      return handleRmdir();
    case Opcode.UNLINK:
      return handleUnlink();
    case Opcode.RENAME:
      return handleRename();
    case Opcode.ACCESS:
      return handleAccess();
    case Opcode.OPENDIR:
      return handleOpendir();
    case Opcode.READDIR:
      return handleReaddir();
    case Opcode.CLOSEDIR:
      return handleClosedir();
    default:
      channel.notifyError(ENOTSUP);
  }
}
async function pollLoop() {
  while (true) {
    const result = Atomics.waitAsync(
      channel.i32,
      STATUS_OFFSET_I32,
      Status.Idle
    );
    if (result.async) {
      await result.value;
    }
    const status = Atomics.load(channel.i32, STATUS_OFFSET_I32);
    if (status !== Status.Pending) {
      continue;
    }
    await dispatch();
  }
}
self.onmessage = async (event) => {
  const { type, buffer } = event.data;
  if (type !== "init") return;
  channel = new WorkerChannel(buffer);
  opfsRoot = await navigator.storage.getDirectory();
  self.postMessage({ type: "ready" });
  pollLoop();
};
//# sourceMappingURL=opfs-worker.js.map