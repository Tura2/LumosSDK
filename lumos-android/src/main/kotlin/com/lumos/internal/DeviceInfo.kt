package com.lumos.internal

import android.content.Context
import android.os.Build

object DeviceInfo {
    fun model(): String = "${Build.MANUFACTURER} ${Build.MODEL}"
    fun androidVersion(): Int = Build.VERSION.SDK_INT

    fun appVersion(context: Context): String = try {
        context.packageManager.getPackageInfo(context.packageName, 0).versionName ?: "unknown"
    } catch (e: Exception) { "unknown" }
}
