package com.lumossdk.db

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "pending_events")
data class PendingEvent(
    @PrimaryKey val eventId: String,
    val createdAt: Long = System.currentTimeMillis(),
    val payloadJson: String,
)
