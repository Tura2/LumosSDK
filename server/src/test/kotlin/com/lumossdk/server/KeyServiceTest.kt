package com.lumossdk.server

import com.lumossdk.server.db.DatabaseFactory
import com.lumossdk.server.service.KeyService
import org.junit.BeforeClass
import org.junit.Test
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import kotlin.test.assertTrue

class KeyServiceTest {
    companion object {
        @BeforeClass @JvmStatic fun setup() {
            DatabaseFactory.init("jdbc:sqlite::memory:")
        }
    }

    @Test fun `create and verify key`() {
        val appId = "app-test-${System.currentTimeMillis()}"
        val (_, secret) = KeyService.create(appId, "test key")
        val resolvedAppId = KeyService.verify(secret)
        assertNotNull(resolvedAppId)
    }

    @Test fun `revoked key fails verification`() {
        val appId = "app-revoke-${System.currentTimeMillis()}"
        val (keyId, secret) = KeyService.create(appId, "revoke me")
        KeyService.revoke(keyId)
        assertNull(KeyService.verify(secret))
    }

    @Test fun `wrong key fails verification`() {
        assertNull(KeyService.verify("lms_wrongkey"))
    }
}
