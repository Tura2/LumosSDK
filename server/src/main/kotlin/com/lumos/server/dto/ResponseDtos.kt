package com.lumos.server.dto

import kotlinx.serialization.Serializable

@Serializable
data class AppDto(
    val id: String,
    val name: String,
    val packageName: String,
    val debug: Boolean?,
)

@Serializable
data class AccountDto(
    val id: String,
    val email: String,
    val name: String,
)

@Serializable
data class CreatedAppDto(val id: String)

@Serializable
data class CreatedKeyDto(val id: String, val secret: String)

@Serializable
data class IngestResponse(val accepted: Int)

@Serializable
data class ConfigResponse(val active: Boolean)

@Serializable
data class SessionTraceDto(
    val traceId: String,
    val feature: String,
    val status: String,
    val model: String,
    val latencyMs: String,
    val startedAt: String,
)
