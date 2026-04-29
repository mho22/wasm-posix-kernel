/*
 * Minimal <sys/soundcard.h> for wasm-posix-kernel.
 *
 * SDL2's src/audio/dsp/SDL_dspaudio.c uses these constants and the
 * audio_buf_info struct against /dev/dsp. The actual /dev/dsp device
 * is delivered by a separate audio task; this header is the
 * compile-time contract that lets SDL2 link without that device
 * present.
 *
 * The SNDCTL_DSP_* numeric encodings follow Linux OSS — _IOWR / _IOR
 * with magic byte 'P' (0x50) and the relevant per-arg sizes. SDL2
 * cares about a small subset; the rest are kept for source
 * compatibility but the kernel-side audio device only has to honour
 * the ones SDL2 actually issues.
 */
#ifndef _SYS_SOUNDCARD_H
#define _SYS_SOUNDCARD_H 1

#include <sys/ioctl.h>

/* PCM sample formats. */
#define AFMT_QUERY     0x00000000
#define AFMT_MU_LAW    0x00000001
#define AFMT_A_LAW     0x00000002
#define AFMT_IMA_ADPCM 0x00000004
#define AFMT_U8        0x00000008
#define AFMT_S16_LE    0x00000010
#define AFMT_S16_BE    0x00000020
#define AFMT_S8        0x00000040
#define AFMT_U16_LE    0x00000080
#define AFMT_U16_BE    0x00000100
#define AFMT_MPEG      0x00000200
#define AFMT_AC3       0x00000400

#if defined(__BIG_ENDIAN__)
#  define AFMT_S16_NE  AFMT_S16_BE
#  define AFMT_U16_NE  AFMT_U16_BE
#else
#  define AFMT_S16_NE  AFMT_S16_LE
#  define AFMT_U16_NE  AFMT_U16_LE
#endif

/* Status info passed back from SNDCTL_DSP_GETOSPACE / GETISPACE. */
typedef struct audio_buf_info {
    int fragments;     /* free fragments (output) / pending (input) */
    int fragstotal;    /* total fragments allocated */
    int fragsize;      /* bytes per fragment */
    int bytes;         /* free space in bytes (output) / pending (input) */
} audio_buf_info;

/* SNDCTL_DSP_* — Linux OSS encoding. SDL2's dsp driver issues these:
 *   RESET, SETFMT, CHANNELS, SPEED, GETOSPACE, GETBLKSIZE, SETFRAGMENT.
 */
#define SNDCTL_DSP_RESET        _IO('P', 0)
#define SNDCTL_DSP_SYNC         _IO('P', 1)
#define SNDCTL_DSP_SPEED        _IOWR('P', 2, int)
#define SNDCTL_DSP_STEREO       _IOWR('P', 3, int)
#define SNDCTL_DSP_GETBLKSIZE   _IOWR('P', 4, int)
#define SNDCTL_DSP_SETFMT       _IOWR('P', 5, int)
#define SNDCTL_DSP_CHANNELS     _IOWR('P', 6, int)
#define SNDCTL_DSP_POST         _IO('P', 8)
#define SNDCTL_DSP_SUBDIVIDE    _IOWR('P', 9, int)
#define SNDCTL_DSP_SETFRAGMENT  _IOWR('P', 10, int)
#define SNDCTL_DSP_GETFMTS      _IOR('P', 11, int)
#define SNDCTL_DSP_GETOSPACE    _IOR('P', 12, audio_buf_info)
#define SNDCTL_DSP_GETISPACE    _IOR('P', 13, audio_buf_info)
#define SNDCTL_DSP_NONBLOCK     _IO('P', 14)
#define SNDCTL_DSP_GETCAPS      _IOR('P', 15, int)
#define SNDCTL_DSP_GETTRIGGER   _IOR('P', 16, int)
#define SNDCTL_DSP_SETTRIGGER   _IOW('P', 16, int)
#define SNDCTL_DSP_GETIPTR      _IOR('P', 17, int)
#define SNDCTL_DSP_GETOPTR      _IOR('P', 18, int)

/* Capability bits (SNDCTL_DSP_GETCAPS). */
#define DSP_CAP_REVISION  0x000000ff
#define DSP_CAP_DUPLEX    0x00000100
#define DSP_CAP_REALTIME  0x00000200
#define DSP_CAP_BATCH     0x00000400
#define DSP_CAP_COPROC    0x00000800
#define DSP_CAP_TRIGGER   0x00001000
#define DSP_CAP_MMAP      0x00002000

/* Trigger bits. */
#define PCM_ENABLE_INPUT   0x00000001
#define PCM_ENABLE_OUTPUT  0x00000002

#endif /* _SYS_SOUNDCARD_H */
