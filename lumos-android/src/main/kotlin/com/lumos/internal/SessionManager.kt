package com.lumos.internal

import java.util.UUID
import java.util.concurrent.atomic.AtomicLong

object SessionManager {
    @Volatile private var sessionId: String = UUID.randomUUID().toString()
    private val lastActivityMs = AtomicLong(System.currentTimeMillis())
    private const val TIMEOUT_MS = 30 * 60 * 1000L

    @Synchronized
    fun currentSessionId(): String {
        val now = System.currentTimeMillis()
        if (now - lastActivityMs.get() > TIMEOUT_MS) {
            sessionId = UUID.randomUUID().toString()
        }
        lastActivityMs.set(now)
        return sessionId
    }
}
