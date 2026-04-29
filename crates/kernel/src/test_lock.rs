//! Cross-test serialization lock for kernel global tables.
//!
//! The kernel's global tables (`PIPE_TABLE`, `IPC_TABLE`, `MQUEUE_TABLE`,
//! `PSHARED_TABLE`, `PTY_TABLE`, `WAKEUP_BUFFER`, `HOST_HANDLE_REFS`,
//! `UNIX_SOCKET_REGISTRY`, `PROCESS_TABLE`, ...) are wrapped in
//! `UnsafeCell + unsafe impl Sync`. The production safety contract is that
//! the kernel runs single-threaded, servicing one syscall at a time — see
//! e.g. the comment at `pipe.rs:297`. `cargo test`'s default thread pool
//! violates that invariant: two threads concurrently calling `sys_socketpair`
//! race on `PIPE_TABLE`'s `BTreeMap`, surfacing as bizarre EOFs in `recv`,
//! corrupted readiness counters, or the `MsgPeek` flake.
//!
//! Every kernel test that touches a global table — directly via
//! `unsafe { global_*_table() }`, or indirectly via any `sys_*` syscall —
//! takes this lock at the top of its test body. The lock has nothing to do
//! with what the kernel does in production; it only enforces the existing
//! single-threaded invariant inside the test harness.

use std::sync::{Mutex, MutexGuard};

static KERNEL_TEST_LOCK: Mutex<()> = Mutex::new(());

/// Acquire the global kernel-test lock for the duration of the returned guard.
///
/// Poison-tolerant: a previous test that panicked while holding the lock
/// leaves the kernel globals in whatever state it left them in. Subsequent
/// tests reset what they need (most tests construct a fresh `Process` and
/// don't depend on prior global state), so we ignore poison rather than
/// cascading the failure across the rest of the suite.
pub fn lock() -> MutexGuard<'static, ()> {
    KERNEL_TEST_LOCK
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner())
}
