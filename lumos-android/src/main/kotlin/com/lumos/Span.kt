package com.lumos

import java.util.UUID

class Span internal constructor(
    val spanId: String = UUID.randomUUID().toString(),
    val name: String,
    internal val startMs: Long = System.currentTimeMillis(),
    internal var durationMs: Long = 0,
    internal var ended: Boolean = false,
) {
    fun end() {
        if (!ended) {
            durationMs = System.currentTimeMillis() - startMs
            ended = true
        }
    }
}
