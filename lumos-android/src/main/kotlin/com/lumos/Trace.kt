package com.lumos

import java.util.UUID

class Trace internal constructor(
    val id: String = UUID.randomUUID().toString(),
    val feature: String,
    internal val startMs: Long = System.currentTimeMillis(),
) {
    internal var input: String = ""
    internal var output: String? = null
    internal var model: String? = null
    internal var tokensIn: Int? = null
    internal var tokensOut: Int? = null
    internal var latencyMs: Long? = null
    internal var status: TraceStatus = TraceStatus.OK
    internal var error: Throwable? = null
    internal val spans: MutableList<Span> = mutableListOf()
    internal var ended: Boolean = false

    fun logPrompt(text: String) { input = text }

    fun logResponse(
        text: String,
        model: String? = null,
        tokensIn: Int? = null,
        tokensOut: Int? = null,
        latencyMs: Long? = null,
    ) {
        output = text
        this.model = model
        this.tokensIn = tokensIn
        this.tokensOut = tokensOut
        this.latencyMs = latencyMs ?: (System.currentTimeMillis() - startMs)
    }

    fun startSpan(name: String): Span = Span(name = name).also { spans.add(it) }

    fun logError(throwable: Throwable) {
        error = throwable
        status = TraceStatus.ERROR
    }

    fun end(status: TraceStatus = TraceStatus.OK) {
        if (!ended) {
            this.status = if (error != null) TraceStatus.ERROR else status
            ended = true
        }
    }
}
