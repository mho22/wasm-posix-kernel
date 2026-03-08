//! Wasm export layer -- FFI boundary that the TypeScript host calls.
//!
//! This module declares:
//! 1. Host function imports (functions the host must provide).
//! 2. A `WasmHostIO` struct implementing the `HostIO` trait via those imports.
//! 3. Global kernel state (`PROCESS`).
//! 4. Export functions for each syscall.

extern crate alloc;

use core::slice;

use wasm_posix_shared::{Errno, WasmStat};

use crate::process::{HostIO, Process};
use crate::syscalls;

// ---------------------------------------------------------------------------
// 1. Host function imports
// ---------------------------------------------------------------------------

#[link(wasm_import_module = "env")]
unsafe extern "C" {
    fn host_open(path_ptr: *const u8, path_len: u32, flags: u32, mode: u32) -> i64;
    fn host_close(handle: i64) -> i32;
    fn host_read(handle: i64, buf_ptr: *mut u8, buf_len: u32) -> i32;
    fn host_write(handle: i64, buf_ptr: *const u8, buf_len: u32) -> i32;
    fn host_seek(handle: i64, offset_lo: u32, offset_hi: i32, whence: u32) -> i64;
    fn host_fstat(handle: i64, stat_ptr: *mut u8) -> i32;
}

// ---------------------------------------------------------------------------
// 2. WasmHostIO -- bridges HostIO trait to the imported host functions
// ---------------------------------------------------------------------------

struct WasmHostIO;

/// Map a negative i32 return value from the host to an `Errno`.
/// Negative means error; the absolute value is the errno code.
fn i32_to_result(val: i32) -> Result<(), Errno> {
    if val < 0 {
        match Errno::from_u32((-val) as u32) {
            Some(e) => Err(e),
            None => Err(Errno::EIO),
        }
    } else {
        Ok(())
    }
}

impl HostIO for WasmHostIO {
    fn host_open(&mut self, path: &[u8], flags: u32, mode: u32) -> Result<i64, Errno> {
        let result = unsafe { host_open(path.as_ptr(), path.len() as u32, flags, mode) };
        if result < 0 {
            match Errno::from_u32((-result) as u32) {
                Some(e) => Err(e),
                None => Err(Errno::EIO),
            }
        } else {
            Ok(result)
        }
    }

    fn host_close(&mut self, handle: i64) -> Result<(), Errno> {
        let result = unsafe { host_close(handle) };
        i32_to_result(result)
    }

    fn host_read(&mut self, handle: i64, buf: &mut [u8]) -> Result<usize, Errno> {
        let result = unsafe { host_read(handle, buf.as_mut_ptr(), buf.len() as u32) };
        if result < 0 {
            match Errno::from_u32((-result) as u32) {
                Some(e) => Err(e),
                None => Err(Errno::EIO),
            }
        } else {
            Ok(result as usize)
        }
    }

    fn host_write(&mut self, handle: i64, buf: &[u8]) -> Result<usize, Errno> {
        let result = unsafe { host_write(handle, buf.as_ptr(), buf.len() as u32) };
        if result < 0 {
            match Errno::from_u32((-result) as u32) {
                Some(e) => Err(e),
                None => Err(Errno::EIO),
            }
        } else {
            Ok(result as usize)
        }
    }

    fn host_seek(&mut self, handle: i64, offset: i64, whence: u32) -> Result<i64, Errno> {
        let offset_lo = offset as u32;
        let offset_hi = (offset >> 32) as i32;
        let result = unsafe { host_seek(handle, offset_lo, offset_hi, whence) };
        if result < 0 {
            match Errno::from_u32((-result) as u32) {
                Some(e) => Err(e),
                None => Err(Errno::EIO),
            }
        } else {
            Ok(result)
        }
    }

    fn host_fstat(&mut self, handle: i64) -> Result<WasmStat, Errno> {
        let mut stat = WasmStat {
            st_dev: 0,
            st_ino: 0,
            st_mode: 0,
            st_nlink: 0,
            st_uid: 0,
            st_gid: 0,
            st_size: 0,
            st_atime_sec: 0,
            st_atime_nsec: 0,
            st_mtime_sec: 0,
            st_mtime_nsec: 0,
            st_ctime_sec: 0,
            st_ctime_nsec: 0,
            _pad: 0,
        };
        let stat_ptr = &mut stat as *mut WasmStat as *mut u8;
        let result = unsafe { host_fstat(handle, stat_ptr) };
        i32_to_result(result)?;
        Ok(stat)
    }
}

// ---------------------------------------------------------------------------
// 3. Global kernel state
// ---------------------------------------------------------------------------

use core::cell::UnsafeCell;

/// Wrapper to allow `UnsafeCell<Option<Process>>` in a `static`.
/// Sound because Wasm is single-threaded within an instance.
struct GlobalProcess(UnsafeCell<Option<Process>>);

/// SAFETY: Wasm instances are single-threaded; no concurrent access occurs.
unsafe impl Sync for GlobalProcess {}

static PROCESS: GlobalProcess = GlobalProcess(UnsafeCell::new(None));

/// Helper to get a mutable reference to the global process, trapping if
/// `kernel_init` has not been called.
///
/// SAFETY: Caller must ensure no aliasing references exist. This is
/// guaranteed by Wasm's single-threaded execution model and the fact that
/// each exported function borrows the process for its own duration only.
#[inline]
unsafe fn get_process() -> &'static mut Process {
    let ptr = PROCESS.0.get();
    match unsafe { &mut *ptr } {
        Some(p) => p,
        None => core::arch::wasm32::unreachable(),
    }
}

// ---------------------------------------------------------------------------
// 4. Exported kernel functions
// ---------------------------------------------------------------------------

/// Initialize the kernel with a new process.
#[unsafe(no_mangle)]
pub extern "C" fn kernel_init(pid: u32) {
    unsafe {
        *PROCESS.0.get() = Some(Process::new(pid));
    }
}

/// Open a file. Returns fd (>= 0) on success, or negative errno on error.
#[unsafe(no_mangle)]
pub extern "C" fn kernel_open(
    path_ptr: *const u8,
    path_len: u32,
    flags: u32,
    mode: u32,
) -> i32 {
    let proc = unsafe { get_process() };
    let path = unsafe { slice::from_raw_parts(path_ptr, path_len as usize) };
    let mut host = WasmHostIO;
    match syscalls::sys_open(proc, &mut host, path, flags, mode) {
        Ok(fd) => fd,
        Err(e) => -(e as i32),
    }
}

/// Close a file descriptor. Returns 0 on success, or negative errno on error.
#[unsafe(no_mangle)]
pub extern "C" fn kernel_close(fd: i32) -> i32 {
    let proc = unsafe { get_process() };
    let mut host = WasmHostIO;
    match syscalls::sys_close(proc, &mut host, fd) {
        Ok(()) => 0,
        Err(e) => -(e as i32),
    }
}

/// Read from a file descriptor. Returns bytes read (>= 0) or negative errno.
#[unsafe(no_mangle)]
pub extern "C" fn kernel_read(fd: i32, buf_ptr: *mut u8, buf_len: u32) -> i32 {
    let proc = unsafe { get_process() };
    let buf = unsafe { slice::from_raw_parts_mut(buf_ptr, buf_len as usize) };
    let mut host = WasmHostIO;
    match syscalls::sys_read(proc, &mut host, fd, buf) {
        Ok(n) => n as i32,
        Err(e) => -(e as i32),
    }
}

/// Write to a file descriptor. Returns bytes written (>= 0) or negative errno.
#[unsafe(no_mangle)]
pub extern "C" fn kernel_write(fd: i32, buf_ptr: *const u8, buf_len: u32) -> i32 {
    let proc = unsafe { get_process() };
    let buf = unsafe { slice::from_raw_parts(buf_ptr, buf_len as usize) };
    let mut host = WasmHostIO;
    match syscalls::sys_write(proc, &mut host, fd, buf) {
        Ok(n) => n as i32,
        Err(e) => -(e as i32),
    }
}

/// Seek within a file. The 64-bit offset is passed as two 32-bit halves
/// because some Wasm host bindings lack native i64 support.
/// Returns the new offset (i64) or negative errno (i64).
#[unsafe(no_mangle)]
pub extern "C" fn kernel_lseek(fd: i32, offset_lo: u32, offset_hi: i32, whence: u32) -> i64 {
    let proc = unsafe { get_process() };
    let offset = ((offset_hi as i64) << 32) | (offset_lo as u64 as i64);
    match syscalls::sys_lseek(proc, fd, offset, whence) {
        Ok(pos) => pos,
        Err(e) => -(e as i64),
    }
}

/// Duplicate a file descriptor. Returns new fd (>= 0) or negative errno.
#[unsafe(no_mangle)]
pub extern "C" fn kernel_dup(fd: i32) -> i32 {
    let proc = unsafe { get_process() };
    match syscalls::sys_dup(proc, fd) {
        Ok(new_fd) => new_fd,
        Err(e) => -(e as i32),
    }
}

/// Duplicate a file descriptor to a specific target fd.
/// Returns newfd (>= 0) or negative errno.
#[unsafe(no_mangle)]
pub extern "C" fn kernel_dup2(oldfd: i32, newfd: i32) -> i32 {
    let proc = unsafe { get_process() };
    let mut host = WasmHostIO;
    match syscalls::sys_dup2(proc, &mut host, oldfd, newfd) {
        Ok(fd) => fd,
        Err(e) => -(e as i32),
    }
}

/// Create a pipe. Writes [read_fd, write_fd] to the pointer.
/// Returns 0 on success, or negative errno on error.
#[unsafe(no_mangle)]
pub extern "C" fn kernel_pipe(fildes_ptr: *mut i32) -> i32 {
    let proc = unsafe { get_process() };
    match syscalls::sys_pipe(proc) {
        Ok((read_fd, write_fd)) => {
            unsafe {
                *fildes_ptr = read_fd;
                *fildes_ptr.add(1) = write_fd;
            }
            0
        }
        Err(e) => -(e as i32),
    }
}

/// Get file status. Writes a `WasmStat` struct to the pointer.
/// Returns 0 on success, or negative errno on error.
#[unsafe(no_mangle)]
pub extern "C" fn kernel_fstat(fd: i32, stat_ptr: *mut u8) -> i32 {
    let proc = unsafe { get_process() };
    let mut host = WasmHostIO;
    match syscalls::sys_fstat(proc, &mut host, fd) {
        Ok(stat) => {
            let stat_bytes = unsafe {
                slice::from_raw_parts(
                    &stat as *const WasmStat as *const u8,
                    core::mem::size_of::<WasmStat>(),
                )
            };
            unsafe {
                core::ptr::copy_nonoverlapping(stat_bytes.as_ptr(), stat_ptr, stat_bytes.len());
            }
            0
        }
        Err(e) => -(e as i32),
    }
}

/// fcntl operations. Returns result (>= 0) or negative errno.
#[unsafe(no_mangle)]
pub extern "C" fn kernel_fcntl(fd: i32, cmd: u32, arg: u32) -> i32 {
    let proc = unsafe { get_process() };
    match syscalls::sys_fcntl(proc, fd, cmd, arg) {
        Ok(val) => val,
        Err(e) => -(e as i32),
    }
}
