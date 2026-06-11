package com.lumossdk.internal

import java.util.UUID

object SessionManager {
    private var sessionId: String = UUID.randomUUID().toString()
    private var lastActivityMs: Long = System.currentTimeMillis()
    private const val TIMEOUT_MS = 30 * 60 * 1000L

    fun currentSessionId(): String {
        val now = System.currentTimeMillis()
        if (now - lastActivityMs > TIMEOUT_MS) {
            sessionId = UUID.randomUUID().toString()
        }
        lastActivityMs = now
        return sessionId
    }
}
