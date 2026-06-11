package com.lumossdk.upload

import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import okio.GzipSink
import okio.buffer

class TransportClient(
    private val serverUrl: String,
    private val apiKey: String,
) {
    private val client = OkHttpClient.Builder().build()
    private val json = "application/json".toMediaType()

    fun postEvents(jsonBody: String): Boolean {
        val gzipped = gzip(jsonBody)
        val request = Request.Builder()
            .url("$serverUrl/v0/events")
            .header("X-Lumos-Key", apiKey)
            .header("Content-Encoding", "gzip")
            .post(gzipped.toRequestBody(json))
            .build()
        return try {
            client.newCall(request).execute().use { it.isSuccessful }
        } catch (e: Exception) {
            false
        }
    }

    private fun gzip(input: String): ByteArray {
        val sink = okio.Buffer()
        GzipSink(sink).buffer().use { it.writeUtf8(input) }
        return sink.readByteArray()
    }
}
