package com.lumos

interface LumosListener {
    fun onFlushSuccess(eventCount: Int) {}
    fun onFlushError(error: Throwable) {}
}
