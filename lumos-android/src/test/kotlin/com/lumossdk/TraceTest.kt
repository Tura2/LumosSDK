package com.lumossdk

import org.junit.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

class TraceTest {
    @Test fun `trace captures prompt and response`() {
        val trace = Trace(feature = "chat")
        trace.logPrompt("Hello")
        trace.logResponse("Hi there", model = "gpt-4o-mini", tokensIn = 10, tokensOut = 5, latencyMs = 200)
        trace.end()
        assertEquals("Hello", trace.input)
        assertEquals("Hi there", trace.output)
        assertEquals(TraceStatus.OK, trace.status)
        assertTrue(trace.ended)
    }

    @Test fun `logError sets ERROR status`() {
        val trace = Trace(feature = "chat")
        trace.logError(RuntimeException("boom"))
        trace.end()
        assertEquals(TraceStatus.ERROR, trace.status)
    }

    @Test fun `span records duration`() {
        val trace = Trace(feature = "chat")
        val span = trace.startSpan("search_orders")
        Thread.sleep(10)
        span.end()
        assertEquals(1, trace.spans.size)
        assertTrue(span.durationMs >= 10)
    }
}
