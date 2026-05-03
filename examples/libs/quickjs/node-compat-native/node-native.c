#include "node-native.h"
#include "cutils.h"

#include "hash.h"
#include "hmac.h"
#include "zlib.h"

static const JSCFunctionListEntry node_native_funcs[] = {
    JS_CFUNC_DEF("createHash", 1, js_node_native_create_hash),
    JS_CFUNC_DEF("createHmac", 2, js_node_native_create_hmac),
    JS_CFUNC_DEF("createDeflate", 1, js_node_native_create_deflate),
    JS_CFUNC_DEF("createInflate", 0, js_node_native_create_inflate),
    JS_CFUNC_DEF("createGzip", 1, js_node_native_create_gzip),
    JS_CFUNC_DEF("createGunzip", 0, js_node_native_create_gunzip),
    JS_CFUNC_DEF("deflateSync", 2, js_node_native_deflate_sync),
    JS_CFUNC_DEF("inflateSync", 1, js_node_native_inflate_sync),
    JS_CFUNC_DEF("gzipSync", 2, js_node_native_gzip_sync),
    JS_CFUNC_DEF("gunzipSync", 1, js_node_native_gunzip_sync),
};

static int node_native_module_init(JSContext *ctx, JSModuleDef *m)
{
    if (node_native_hash_init(ctx) < 0)
        return -1;
    if (node_native_hmac_init(ctx) < 0)
        return -1;
    if (node_native_zlib_init(ctx) < 0)
        return -1;
    return JS_SetModuleExportList(ctx, m, node_native_funcs,
                                  countof(node_native_funcs));
}

JSModuleDef *js_init_module_node_native(JSContext *ctx, const char *module_name)
{
    JSModuleDef *m = JS_NewCModule(ctx, module_name, node_native_module_init);
    if (!m)
        return NULL;
    JS_AddModuleExportList(ctx, m, node_native_funcs,
                           countof(node_native_funcs));
    return m;
}
