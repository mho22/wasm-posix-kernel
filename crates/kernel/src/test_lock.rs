//! The kernel's globals (`PIPE_TABLE`, `IPC_TABLE`, etc.) are wrapped
//! in `UnsafeCell + unsafe impl Sync` because in production the kernel
//! services one syscall at a time. `cargo test`'s default thread pool
//! violates that invariant. Tests that touch a global — directly via
//! `unsafe { global_*_table() }` or indirectly via any `sys_*` call —
//! take this lock at the top of their body.

use std::sync::{Mutex, MutexGuard};

static KERNEL_TEST_LOCK: Mutex<()> = Mutex::new(());

/// Poison-tolerant: a panicking test poisons the mutex but doesn't
/// necessarily corrupt the globals — most tests reset what they need —
/// so we ignore poison rather than cascade one panic across the suite.
pub(crate) fn lock() -> MutexGuard<'static, ()> {
    KERNEL_TEST_LOCK.lock().unwrap_or_else(|p| p.into_inner())
}
