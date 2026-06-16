package com.lumos.demo

import android.app.Application
import com.lumos.Lumos

class DemoApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        Lumos.init(this) {
            apiKey = BuildConfig.LUMOS_API_KEY
            serverUrl = "http://YOUR_VPS_IP:8080"
        }
    }
}
