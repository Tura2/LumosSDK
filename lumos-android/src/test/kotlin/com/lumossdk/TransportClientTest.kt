package com.lumossdk

import com.lumossdk.upload.TransportClient
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.junit.After
import org.junit.Before
import org.junit.Test
import kotlin.test.assertTrue
import kotlin.test.assertFalse

class TransportClientTest {
    private lateinit var server: MockWebServer
    private lateinit var client: TransportClient

    @Before fun setup() {
        server = MockWebServer()
        server.start()
        client = TransportClient(server.url("/").toString().trimEnd('/'), "test_key")
    }

    @After fun teardown() { server.shutdown() }

    @Test fun `postEvents returns true on 200`() {
        server.enqueue(MockResponse().setResponseCode(200))
        assertTrue(client.postEvents("""[{"type":"TRACE"}]"""))
    }

    @Test fun `postEvents returns false on 401`() {
        server.enqueue(MockResponse().setResponseCode(401))
        assertFalse(client.postEvents("""[{"type":"TRACE"}]"""))
    }

    @Test fun `request includes X-Lumos-Key header`() {
        server.enqueue(MockResponse().setResponseCode(200))
        client.postEvents("{}")
        val recorded = server.takeRequest()
        assert(recorded.getHeader("X-Lumos-Key") == "test_key")
    }
}
