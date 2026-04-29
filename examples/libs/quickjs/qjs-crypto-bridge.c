/*
 * qjs-crypto-bridge.c — QuickJS-NG bridge to libcrypto.
 *
 * Exposes a `qjs:crypto-bridge` module providing primitives that the
 * Node.js `crypto` shim in node-compat/bootstrap.js wraps:
 *
 *   createHash(alg)   → Hash { update(buf), digest(enc?) }
 *   createHmac(alg, key) → Hmac { update(buf), digest(enc?) }
 *   randomBytes(n)    → ArrayBuffer of n CSPRNG bytes (RAND_bytes)
 *
 * `alg` is the canonical OpenSSL digest name: "sha256", "sha512",
 * "sha1", "md5", etc. Unknown names throw TypeError.
 *
 * `enc` is "hex" or "base64" or undefined (returns ArrayBuffer).
 *
 * Links against libcrypto.a from examples/libs/openssl/. No libssl
 * dependency — that comes in Phase C (qjs-tls.c).
 *
 * Note on random: RAND_bytes() returns 0 on hard failure (entropy
 * exhausted, /dev/urandom missing). We treat that as throwable.
 * OpenSSL's RAND seeds itself off /dev/urandom on first use, which our
 * kernel exposes via virtual device — see crates/kernel/src/syscalls.rs.
 */

#include "quickjs.h"
#include "quickjs-libc.h"
#include <openssl/evp.h>
#include <openssl/hmac.h>
#include <openssl/rand.h>
#include <string.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>

/* -------- Hash -------- */

static JSClassID hash_class_id;

typedef struct {
    EVP_MD_CTX *ctx;
    int finalized;
} HashState;

static void hash_finalizer(JSRuntime *rt, JSValue val) {
    HashState *h = JS_GetOpaque(val, hash_class_id);
    if (!h) return;
    if (h->ctx) EVP_MD_CTX_free(h->ctx);
    js_free_rt(rt, h);
}

static JSClassDef hash_class = {
    "QjsHash",
    .finalizer = hash_finalizer,
};

static JSValue js_create_hash(JSContext *ctx, JSValueConst this_val,
                              int argc, JSValueConst *argv) {
    if (argc < 1) return JS_ThrowTypeError(ctx, "createHash: missing algorithm");
    const char *alg = JS_ToCString(ctx, argv[0]);
    if (!alg) return JS_EXCEPTION;
    const EVP_MD *md = EVP_get_digestbyname(alg);
    JS_FreeCString(ctx, alg);
    if (!md) return JS_ThrowTypeError(ctx, "createHash: unknown digest");

    HashState *h = js_mallocz(ctx, sizeof *h);
    if (!h) return JS_EXCEPTION;
    h->ctx = EVP_MD_CTX_new();
    if (!h->ctx) {
        js_free(ctx, h);
        return JS_ThrowInternalError(ctx, "EVP_MD_CTX_new failed");
    }
    if (EVP_DigestInit_ex(h->ctx, md, NULL) != 1) {
        EVP_MD_CTX_free(h->ctx);
        js_free(ctx, h);
        return JS_ThrowInternalError(ctx, "EVP_DigestInit_ex failed");
    }

    JSValue obj = JS_NewObjectClass(ctx, hash_class_id);
    if (JS_IsException(obj)) {
        EVP_MD_CTX_free(h->ctx);
        js_free(ctx, h);
        return obj;
    }
    JS_SetOpaque(obj, h);
    return obj;
}

static int update_evp_with_jsvalue(JSContext *ctx, EVP_MD_CTX *md_ctx,
                                   HMAC_CTX *hmac_ctx, JSValueConst data) {
    /* Accepts string, ArrayBuffer, TypedArray view. */
    size_t len = 0;
    if (JS_IsString(data)) {
        const char *s = JS_ToCStringLen(ctx, &len, data);
        if (!s) return -1;
        int rc;
        if (md_ctx) rc = EVP_DigestUpdate(md_ctx, s, len);
        else        rc = HMAC_Update(hmac_ctx, (const uint8_t *)s, len);
        JS_FreeCString(ctx, s);
        return rc == 1 ? 0 : -1;
    }
    /* ArrayBuffer */
    size_t ab_len; uint8_t *ab = JS_GetArrayBuffer(ctx, &ab_len, data);
    if (ab) {
        int rc;
        if (md_ctx) rc = EVP_DigestUpdate(md_ctx, ab, ab_len);
        else        rc = HMAC_Update(hmac_ctx, ab, ab_len);
        return rc == 1 ? 0 : -1;
    }
    /* TypedArray / DataView — extract underlying buffer */
    size_t off, byte_len;
    JSValue buf = JS_GetTypedArrayBuffer(ctx, data, &off, &byte_len, NULL);
    if (!JS_IsException(buf)) {
        size_t blen; uint8_t *base = JS_GetArrayBuffer(ctx, &blen, buf);
        JS_FreeValue(ctx, buf);
        if (base) {
            int rc;
            if (md_ctx) rc = EVP_DigestUpdate(md_ctx, base + off, byte_len);
            else        rc = HMAC_Update(hmac_ctx, base + off, byte_len);
            return rc == 1 ? 0 : -1;
        }
    }
    JS_ThrowTypeError(ctx, "update: data must be string, ArrayBuffer, or TypedArray");
    return -1;
}

static JSValue js_hash_update(JSContext *ctx, JSValueConst this_val,
                              int argc, JSValueConst *argv) {
    HashState *h = JS_GetOpaque(this_val, hash_class_id);
    if (!h || !h->ctx || h->finalized)
        return JS_ThrowTypeError(ctx, "Hash already finalized");
    if (argc < 1) return JS_ThrowTypeError(ctx, "update: missing data");
    if (update_evp_with_jsvalue(ctx, h->ctx, NULL, argv[0]) < 0)
        return JS_EXCEPTION;
    return JS_DupValue(ctx, this_val);  /* chainable */
}

static JSValue digest_to_jsvalue(JSContext *ctx, const uint8_t *out,
                                 unsigned outlen, JSValueConst enc_arg) {
    if (JS_IsUndefined(enc_arg) || JS_IsNull(enc_arg)) {
        return JS_NewArrayBufferCopy(ctx, out, outlen);
    }
    const char *enc = JS_ToCString(ctx, enc_arg);
    if (!enc) return JS_EXCEPTION;

    JSValue ret;
    if (!strcmp(enc, "hex")) {
        char *hex = js_malloc(ctx, outlen * 2 + 1);
        if (!hex) { JS_FreeCString(ctx, enc); return JS_EXCEPTION; }
        for (unsigned i = 0; i < outlen; i++) {
            static const char H[] = "0123456789abcdef";
            hex[2*i]   = H[(out[i] >> 4) & 0xF];
            hex[2*i+1] = H[out[i] & 0xF];
        }
        hex[2 * outlen] = 0;
        ret = JS_NewStringLen(ctx, hex, outlen * 2);
        js_free(ctx, hex);
    } else if (!strcmp(enc, "base64")) {
        /* base64-encode out → up to 4*ceil(outlen/3) chars */
        int blen = 4 * ((outlen + 2) / 3);
        char *b64 = js_malloc(ctx, blen + 1);
        if (!b64) { JS_FreeCString(ctx, enc); return JS_EXCEPTION; }
        int n = EVP_EncodeBlock((uint8_t *)b64, out, outlen);
        ret = JS_NewStringLen(ctx, b64, n);
        js_free(ctx, b64);
    } else if (!strcmp(enc, "base64url")) {
        int blen = 4 * ((outlen + 2) / 3);
        char *b64 = js_malloc(ctx, blen + 1);
        if (!b64) { JS_FreeCString(ctx, enc); return JS_EXCEPTION; }
        int n = EVP_EncodeBlock((uint8_t *)b64, out, outlen);
        /* '+' → '-', '/' → '_', strip '=' */
        int outn = 0;
        for (int i = 0; i < n; i++) {
            char c = b64[i];
            if (c == '=') break;
            if (c == '+') c = '-';
            else if (c == '/') c = '_';
            b64[outn++] = c;
        }
        ret = JS_NewStringLen(ctx, b64, outn);
        js_free(ctx, b64);
    } else if (!strcmp(enc, "utf8") || !strcmp(enc, "utf-8") ||
               !strcmp(enc, "binary") || !strcmp(enc, "latin1")) {
        ret = JS_NewStringLen(ctx, (const char *)out, outlen);
    } else {
        ret = JS_ThrowTypeError(ctx, "unsupported encoding");
    }
    JS_FreeCString(ctx, enc);
    return ret;
}

static JSValue js_hash_digest(JSContext *ctx, JSValueConst this_val,
                              int argc, JSValueConst *argv) {
    HashState *h = JS_GetOpaque(this_val, hash_class_id);
    if (!h || !h->ctx || h->finalized)
        return JS_ThrowTypeError(ctx, "Hash already finalized");
    uint8_t out[EVP_MAX_MD_SIZE];
    unsigned outlen = 0;
    if (EVP_DigestFinal_ex(h->ctx, out, &outlen) != 1)
        return JS_ThrowInternalError(ctx, "EVP_DigestFinal_ex failed");
    h->finalized = 1;
    EVP_MD_CTX_free(h->ctx);
    h->ctx = NULL;
    return digest_to_jsvalue(ctx, out, outlen, argc > 0 ? argv[0] : JS_UNDEFINED);
}

/* -------- Hmac -------- */

static JSClassID hmac_class_id;

typedef struct {
    HMAC_CTX *ctx;
    int finalized;
    /* Stash the digest size at init time; HMAC_Final needs a buffer of
     * at least HMAC_size(ctx). EVP_MAX_MD_SIZE is the safe upper bound. */
} HmacState;

static void hmac_finalizer(JSRuntime *rt, JSValue val) {
    HmacState *h = JS_GetOpaque(val, hmac_class_id);
    if (!h) return;
    if (h->ctx) HMAC_CTX_free(h->ctx);
    js_free_rt(rt, h);
}

static JSClassDef hmac_class = {
    "QjsHmac",
    .finalizer = hmac_finalizer,
};

static JSValue js_create_hmac(JSContext *ctx, JSValueConst this_val,
                              int argc, JSValueConst *argv) {
    if (argc < 2) return JS_ThrowTypeError(ctx, "createHmac: missing algorithm or key");
    const char *alg = JS_ToCString(ctx, argv[0]);
    if (!alg) return JS_EXCEPTION;
    const EVP_MD *md = EVP_get_digestbyname(alg);
    JS_FreeCString(ctx, alg);
    if (!md) return JS_ThrowTypeError(ctx, "createHmac: unknown digest");

    /* Key may be string or ArrayBuffer / TypedArray. Reuse the update
     * helper's pattern but keep the bytes in a stack-extracted buffer
     * just long enough to call HMAC_Init_ex. */
    size_t key_len = 0;
    const uint8_t *key_ptr = NULL;
    const char *key_str = NULL;
    JSValue key_buf_val = JS_UNDEFINED;
    uint8_t *key_buf_base = NULL;
    size_t key_buf_off = 0;

    if (JS_IsString(argv[1])) {
        key_str = JS_ToCStringLen(ctx, &key_len, argv[1]);
        if (!key_str) return JS_EXCEPTION;
        key_ptr = (const uint8_t *)key_str;
    } else {
        size_t ab_len; uint8_t *ab = JS_GetArrayBuffer(ctx, &ab_len, argv[1]);
        if (ab) { key_ptr = ab; key_len = ab_len; }
        else {
            size_t off, byte_len;
            key_buf_val = JS_GetTypedArrayBuffer(ctx, argv[1], &off, &byte_len, NULL);
            if (JS_IsException(key_buf_val))
                return JS_ThrowTypeError(ctx, "createHmac: key must be string, ArrayBuffer, or TypedArray");
            size_t blen;
            key_buf_base = JS_GetArrayBuffer(ctx, &blen, key_buf_val);
            key_buf_off = off;
            key_ptr = key_buf_base + off;
            key_len = byte_len;
        }
    }

    HmacState *h = js_mallocz(ctx, sizeof *h);
    if (!h) goto fail_alloc;
    h->ctx = HMAC_CTX_new();
    if (!h->ctx) { js_free(ctx, h); goto fail_alloc; }
    if (HMAC_Init_ex(h->ctx, key_ptr, (int)key_len, md, NULL) != 1) {
        HMAC_CTX_free(h->ctx);
        js_free(ctx, h);
        if (key_str) JS_FreeCString(ctx, key_str);
        if (!JS_IsUndefined(key_buf_val)) JS_FreeValue(ctx, key_buf_val);
        return JS_ThrowInternalError(ctx, "HMAC_Init_ex failed");
    }
    if (key_str) JS_FreeCString(ctx, key_str);
    if (!JS_IsUndefined(key_buf_val)) JS_FreeValue(ctx, key_buf_val);

    JSValue obj = JS_NewObjectClass(ctx, hmac_class_id);
    if (JS_IsException(obj)) {
        HMAC_CTX_free(h->ctx);
        js_free(ctx, h);
        return obj;
    }
    JS_SetOpaque(obj, h);
    return obj;

fail_alloc:
    if (key_str) JS_FreeCString(ctx, key_str);
    if (!JS_IsUndefined(key_buf_val)) JS_FreeValue(ctx, key_buf_val);
    return JS_EXCEPTION;
}

static JSValue js_hmac_update(JSContext *ctx, JSValueConst this_val,
                              int argc, JSValueConst *argv) {
    HmacState *h = JS_GetOpaque(this_val, hmac_class_id);
    if (!h || !h->ctx || h->finalized)
        return JS_ThrowTypeError(ctx, "Hmac already finalized");
    if (argc < 1) return JS_ThrowTypeError(ctx, "update: missing data");
    if (update_evp_with_jsvalue(ctx, NULL, h->ctx, argv[0]) < 0)
        return JS_EXCEPTION;
    return JS_DupValue(ctx, this_val);
}

static JSValue js_hmac_digest(JSContext *ctx, JSValueConst this_val,
                              int argc, JSValueConst *argv) {
    HmacState *h = JS_GetOpaque(this_val, hmac_class_id);
    if (!h || !h->ctx || h->finalized)
        return JS_ThrowTypeError(ctx, "Hmac already finalized");
    uint8_t out[EVP_MAX_MD_SIZE];
    unsigned outlen = 0;
    if (HMAC_Final(h->ctx, out, &outlen) != 1)
        return JS_ThrowInternalError(ctx, "HMAC_Final failed");
    h->finalized = 1;
    HMAC_CTX_free(h->ctx);
    h->ctx = NULL;
    return digest_to_jsvalue(ctx, out, outlen, argc > 0 ? argv[0] : JS_UNDEFINED);
}

/* -------- Random -------- */

static JSValue js_random_bytes(JSContext *ctx, JSValueConst this_val,
                               int argc, JSValueConst *argv) {
    if (argc < 1) return JS_ThrowTypeError(ctx, "randomBytes: missing size");
    int32_t n;
    if (JS_ToInt32(ctx, &n, argv[0]) < 0) return JS_EXCEPTION;
    if (n < 0 || n > (1 << 24))  /* 16 MB cap; ample for any sane caller */
        return JS_ThrowRangeError(ctx, "randomBytes: size out of range");
    uint8_t *buf = js_malloc(ctx, n > 0 ? n : 1);
    if (!buf) return JS_EXCEPTION;
    if (n > 0 && RAND_bytes(buf, n) != 1) {
        js_free(ctx, buf);
        return JS_ThrowInternalError(ctx, "RAND_bytes failed (entropy exhausted?)");
    }
    JSValue ab = JS_NewArrayBufferCopy(ctx, buf, n);
    js_free(ctx, buf);
    return ab;
}

/* -------- Module init -------- */

static const JSCFunctionListEntry hash_proto[] = {
    JS_CFUNC_DEF("update", 1, js_hash_update),
    JS_CFUNC_DEF("digest", 1, js_hash_digest),
};

static const JSCFunctionListEntry hmac_proto[] = {
    JS_CFUNC_DEF("update", 1, js_hmac_update),
    JS_CFUNC_DEF("digest", 1, js_hmac_digest),
};

static const JSCFunctionListEntry crypto_funcs[] = {
    JS_CFUNC_DEF("createHash", 1, js_create_hash),
    JS_CFUNC_DEF("createHmac", 2, js_create_hmac),
    JS_CFUNC_DEF("randomBytes", 1, js_random_bytes),
};

static int crypto_init(JSContext *ctx, JSModuleDef *m) {
    JSRuntime *rt = JS_GetRuntime(ctx);
    if (hash_class_id == 0) {
        JS_NewClassID(rt, &hash_class_id);
        JS_NewClass(rt, hash_class_id, &hash_class);
    }
    if (hmac_class_id == 0) {
        JS_NewClassID(rt, &hmac_class_id);
        JS_NewClass(rt, hmac_class_id, &hmac_class);
    }
    /* Hash prototype */
    JSValue hash_proto_obj = JS_NewObject(ctx);
    JS_SetPropertyFunctionList(ctx, hash_proto_obj, hash_proto,
                               sizeof hash_proto / sizeof hash_proto[0]);
    JS_SetClassProto(ctx, hash_class_id, hash_proto_obj);
    /* Hmac prototype */
    JSValue hmac_proto_obj = JS_NewObject(ctx);
    JS_SetPropertyFunctionList(ctx, hmac_proto_obj, hmac_proto,
                               sizeof hmac_proto / sizeof hmac_proto[0]);
    JS_SetClassProto(ctx, hmac_class_id, hmac_proto_obj);

    JS_SetModuleExportList(ctx, m, crypto_funcs,
                           sizeof crypto_funcs / sizeof crypto_funcs[0]);
    return 0;
}

JSModuleDef *qjs_init_module_crypto_bridge(JSContext *ctx, const char *name) {
    /* Kick OpenSSL's algorithm registry once so digest names resolve.
     * OpenSSL 3.x autoloads default providers, but explicit init makes
     * the failure mode clearer if the link goes wrong. */
    static int inited = 0;
    if (!inited) {
        OpenSSL_add_all_digests();
        inited = 1;
    }
    JSModuleDef *m = JS_NewCModule(ctx, name, crypto_init);
    if (!m) return NULL;
    JS_AddModuleExportList(ctx, m, crypto_funcs,
                           sizeof crypto_funcs / sizeof crypto_funcs[0]);
    return m;
}
