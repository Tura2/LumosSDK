package com.lumos.server

import com.lumos.server.db.DatabaseFactory
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import io.ktor.server.testing.*
import org.junit.BeforeClass
import org.junit.Test
import kotlin.test.assertEquals

class EventRoutesTest {
    companion object {
        @BeforeClass @JvmStatic fun setup() {
            DatabaseFactory.init("jdbc:sqlite::memory:")
        }
    }

    @Test fun `POST v0events with invalid key returns 401`() = testApplication {
        application { module() }
        val resp = client.post("/v0/events") {
            header("X-Lumos-Key", "invalid")
            setBody("[]")
            contentType(ContentType.Application.Json)
        }
        assertEquals(HttpStatusCode.Unauthorized, resp.status)
    }
}
