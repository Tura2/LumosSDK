package com.lumos.db

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

@Database(entities = [PendingEvent::class], version = 1, exportSchema = false)
abstract class LumosDatabase : RoomDatabase() {
    abstract fun eventDao(): EventDao

    companion object {
        @Volatile private var instance: LumosDatabase? = null

        fun get(context: Context): LumosDatabase = instance ?: synchronized(this) {
            instance ?: Room.databaseBuilder(
                context.applicationContext,
                LumosDatabase::class.java,
                "lumos_events.db"
            ).build().also { instance = it }
        }
    }
}
