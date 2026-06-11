package com.lumossdk.db

import androidx.room.*

@Dao
interface EventDao {
    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insert(event: PendingEvent)

    @Query("SELECT * FROM pending_events ORDER BY createdAt ASC LIMIT :limit")
    suspend fun nextBatch(limit: Int = 50): List<PendingEvent>

    @Query("DELETE FROM pending_events WHERE eventId IN (:ids)")
    suspend fun deleteByIds(ids: List<String>)

    @Query("DELETE FROM pending_events WHERE createdAt < :cutoffMs")
    suspend fun trimOlderThan(cutoffMs: Long)

    @Query("SELECT COUNT(*) FROM pending_events")
    suspend fun count(): Int
}
