#include "node-native.h"
#include "cutils.h"

#include "hash.h"

static const JSCFunctionListEntry node_native_funcs[] = {
    JS_CFUNC_DEF("createHash", 1, js_node_native_create_hash),
};

static int node_native_module_init(JSContext *ctx, JSModuleDef *m)
{
    if (node_native_hash_init(ctx) < 0)
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
