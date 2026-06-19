package com.lumos.upload

import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody

class TransportClient(
    private val serverUrl: String,
    private val apiKey: String,
) {
    private val client = OkHttpClient.Builder().build()
    private val json = "application/json".toMediaType()

    fun postEvents(jsonBody: String): Boolean {
        val request = Request.Builder()
            .url("$serverUrl/v0/events")
            .header("X-Lumos-Key", apiKey)
            .post(jsonBody.toRequestBody(json))
            .build()
        return try {
            client.newCall(request).execute().use { it.isSuccessful }
        } catch (e: Exception) {
            false
        }
    }
}
