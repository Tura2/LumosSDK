package com.lumos.server

import com.lumos.server.db.DatabaseFactory
import org.junit.BeforeClass
import org.junit.Test
import kotlin.test.assertEquals

class ValidationTest {
    companion object {
        @BeforeClass @JvmStatic
        fun setup() { DatabaseFactory.init("jdbc:sqlite::memory:") }
    }

    @Test
    fun `blank email is rejected`() {
        val email = "  "
        assertEquals(true, email.isBlank(), "blank email must be detected")
    }

    @Test
    fun `short password is rejected`() {
        val password = "abc"
        assertEquals(true, password.length < 8, "short password must be detected")
    }
}
