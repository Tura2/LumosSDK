package com.lumos

import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import com.lumos.db.EventDao
import com.lumos.db.LumosDatabase
import com.lumos.db.PendingEvent
import kotlinx.coroutines.test.runTest
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import kotlin.test.assertEquals

@RunWith(RobolectricTestRunner::class)
class EventQueueTest {
    private lateinit var db: LumosDatabase
    private lateinit var dao: EventDao

    @Before fun setup() {
        db = Room.inMemoryDatabaseBuilder(
            ApplicationProvider.getApplicationContext(),
            LumosDatabase::class.java
        ).allowMainThreadQueries().build()
        dao = db.eventDao()
    }

    @After fun teardown() { db.close() }

    @Test fun `insert and retrieve batch`() = runTest {
        dao.insert(PendingEvent("id1", payloadJson = """{"type":"TRACE"}"""))
        dao.insert(PendingEvent("id2", payloadJson = """{"type":"SPAN"}"""))
        val batch = dao.nextBatch(50)
        assertEquals(2, batch.size)
        assertEquals("id1", batch[0].eventId)
    }

    @Test fun `delete by ids removes correct rows`() = runTest {
        dao.insert(PendingEvent("id1", payloadJson = "{}"))
        dao.insert(PendingEvent("id2", payloadJson = "{}"))
        dao.deleteByIds(listOf("id1"))
        assertEquals(1, dao.count())
    }
}
