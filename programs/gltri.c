/*
 * Hello triangle for the wasm-posix-kernel WebGL2/GLES2 bridge.
 *
 * Minimal scope: open the EGL session against /dev/dri/renderD128, set
 * up a window surface, compile a constant-color fragment shader, upload
 * three vertices, glDrawArrays, eglSwapBuffers. No iv / InfoLog
 * pollers — if a shader fails the Playwright pixel-readback assertion
 * catches it.
 *
 * Driven from the gldemo browser page (examples/browser/pages/gldemo/);
 * the host attaches an OffscreenCanvas to this process so the cmdbuf
 * GLIO_PRESENT calls actually render against a real WebGL2 context.
 */

#include <EGL/egl.h>
#include <GLES2/gl2.h>
#include <stdint.h>

static const char vs_src[] =
    "attribute vec2 a_pos;\n"
    "void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }\n";

static const char fs_src[] =
    "precision mediump float;\n"
    "void main() { gl_FragColor = vec4(1.0, 0.5, 0.2, 1.0); }\n";

static const float vertices[6] = {
    /* Centred upward-pointing triangle in clip space. The Playwright
     * assertion samples the centre 64x64 quadrant; widen the base if
     * that ever shrinks under the 5% threshold. */
     0.0f,  0.6f,
    -0.6f, -0.6f,
     0.6f, -0.6f,
};

int main(void) {
    EGLDisplay dpy = eglGetDisplay(EGL_DEFAULT_DISPLAY);
    EGLint maj = 0, min = 0;
    if (!eglInitialize(dpy, &maj, &min)) return 1;

    EGLint cfg_attribs[] = {
        EGL_RENDERABLE_TYPE, EGL_OPENGL_ES2_BIT,
        EGL_RED_SIZE, 8, EGL_GREEN_SIZE, 8, EGL_BLUE_SIZE, 8,
        EGL_ALPHA_SIZE, 8, EGL_DEPTH_SIZE, 24,
        EGL_SURFACE_TYPE, EGL_WINDOW_BIT,
        EGL_NONE,
    };
    EGLConfig cfg;
    EGLint num_cfg = 0;
    if (!eglChooseConfig(dpy, cfg_attribs, &cfg, 1, &num_cfg) || num_cfg < 1) return 2;

    if (!eglBindAPI(EGL_OPENGL_ES_API)) return 3;

    EGLint ctx_attribs[] = { EGL_CONTEXT_CLIENT_VERSION, 2, EGL_NONE };
    EGLContext ctx = eglCreateContext(dpy, cfg, EGL_NO_CONTEXT, ctx_attribs);
    if (ctx == EGL_NO_CONTEXT) return 4;

    EGLSurface surf = eglCreateWindowSurface(dpy, cfg, 0, 0);
    if (surf == EGL_NO_SURFACE) return 5;

    if (!eglMakeCurrent(dpy, surf, surf, ctx)) return 6;

    GLuint vs = glCreateShader(GL_VERTEX_SHADER);
    const char *vs_p = vs_src; glShaderSource(vs, 1, &vs_p, 0); glCompileShader(vs);

    GLuint fs = glCreateShader(GL_FRAGMENT_SHADER);
    const char *fs_p = fs_src; glShaderSource(fs, 1, &fs_p, 0); glCompileShader(fs);

    GLuint prog = glCreateProgram();
    glAttachShader(prog, vs);
    glAttachShader(prog, fs);
    glBindAttribLocation(prog, 0, "a_pos");
    glLinkProgram(prog);
    glUseProgram(prog);

    GLuint vbo;
    glGenBuffers(1, &vbo);
    glBindBuffer(GL_ARRAY_BUFFER, vbo);
    glBufferData(GL_ARRAY_BUFFER, sizeof vertices, vertices, GL_STATIC_DRAW);

    glEnableVertexAttribArray(0);
    glVertexAttribPointer(0, 2, GL_FLOAT, GL_FALSE, 0, (const void *)0);

    glViewport(0, 0, 512, 512);
    glClearColor(0.05f, 0.05f, 0.10f, 1.0f);
    glClear(GL_COLOR_BUFFER_BIT);
    glDrawArrays(GL_TRIANGLES, 0, 3);

    eglSwapBuffers(dpy, surf);

    glDeleteShader(vs);
    glDeleteShader(fs);
    glDeleteProgram(prog);
    eglDestroySurface(dpy, surf);
    eglDestroyContext(dpy, ctx);
    eglTerminate(dpy);
    return 0;
}
