package com.lumossdk.upload

import android.content.Context
import androidx.work.*
import com.lumossdk.db.LumosDatabase
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class UploadWorker(ctx: Context, params: WorkerParameters) : CoroutineWorker(ctx, params) {

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        val serverUrl = inputData.getString(KEY_SERVER_URL) ?: return@withContext Result.failure()
        val apiKey = inputData.getString(KEY_API_KEY) ?: return@withContext Result.failure()
        val dao = LumosDatabase.get(applicationContext).eventDao()
        val transport = TransportClient(serverUrl, apiKey)

        val batch = dao.nextBatch(50)
        if (batch.isEmpty()) return@withContext Result.success()

        val json = "[${batch.joinToString(",") { it.payloadJson }}]"
        return@withContext if (transport.postEvents(json)) {
            dao.deleteByIds(batch.map { it.eventId })
            if (dao.count() > 0) Result.retry() else Result.success()
        } else {
            Result.retry()
        }
    }

    companion object {
        const val KEY_SERVER_URL = "server_url"
        const val KEY_API_KEY = "api_key"

        fun enqueue(context: Context, serverUrl: String, apiKey: String) {
            val data = workDataOf(KEY_SERVER_URL to serverUrl, KEY_API_KEY to apiKey)
            val request = OneTimeWorkRequestBuilder<UploadWorker>()
                .setInputData(data)
                .setConstraints(Constraints(NetworkType.CONNECTED))
                .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 10, java.util.concurrent.TimeUnit.SECONDS)
                .build()
            WorkManager.getInstance(context)
                .enqueueUniqueWork("lumos_upload", ExistingWorkPolicy.KEEP, request)
        }
    }
}
