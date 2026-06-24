package com.lumos.server.routes

import com.lumos.server.db.Apps
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction

fun ownsApp(accountId: String, appId: String): Boolean = transaction {
    Apps.select { (Apps.id eq appId) and (Apps.accountId eq accountId) }.count() > 0
}
