package com.lumossdk

interface AgentLensListener {
    fun onFlushSuccess(eventCount: Int) {}
    fun onFlushError(error: Throwable) {}
}
