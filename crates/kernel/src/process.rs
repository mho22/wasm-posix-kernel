extern crate alloc;

use alloc::vec::Vec;
use wasm_posix_shared::{Errno, WasmStat};

use crate::fd::FdTable;
use crate::ofd::OfdTable;
use crate::pipe::PipeBuffer;

/// Trait for host I/O operations that the kernel delegates to the runtime.
pub trait HostIO {
    fn host_open(&mut self, path: &[u8], flags: u32, mode: u32) -> Result<i64, Errno>;
    fn host_close(&mut self, handle: i64) -> Result<(), Errno>;
    fn host_read(&mut self, handle: i64, buf: &mut [u8]) -> Result<usize, Errno>;
    fn host_write(&mut self, handle: i64, buf: &[u8]) -> Result<usize, Errno>;
    fn host_seek(&mut self, handle: i64, offset: i64, whence: u32) -> Result<i64, Errno>;
    fn host_fstat(&mut self, handle: i64) -> Result<WasmStat, Errno>;
}

/// Per-process kernel state: file descriptor table, OFD table, and pipes.
pub struct Process {
    pub pid: u32,
    pub fd_table: FdTable,
    pub ofd_table: OfdTable,
    pub pipes: Vec<Option<PipeBuffer>>,
}

impl Process {
    /// Create a new process with stdio pre-opened (fds 0, 1, 2).
    ///
    /// - OFD 0 = stdin  (CharDevice, O_RDONLY, host_handle=0)
    /// - OFD 1 = stdout (CharDevice, O_WRONLY, host_handle=1)
    /// - OFD 2 = stderr (CharDevice, O_WRONLY, host_handle=2)
    pub fn new(pid: u32) -> Self {
        use crate::ofd::FileType;
        use wasm_posix_shared::flags::{O_RDONLY, O_WRONLY};

        let mut ofd_table = OfdTable::new();
        ofd_table.create(FileType::CharDevice, O_RDONLY, 0); // OFD 0 = stdin
        ofd_table.create(FileType::CharDevice, O_WRONLY, 1); // OFD 1 = stdout
        ofd_table.create(FileType::CharDevice, O_WRONLY, 2); // OFD 2 = stderr

        let mut fd_table = FdTable::new();
        fd_table.preopen_stdio(); // fds 0,1,2 → OFD refs 0,1,2

        Process {
            pid,
            fd_table,
            ofd_table,
            pipes: Vec::new(),
        }
    }
}
