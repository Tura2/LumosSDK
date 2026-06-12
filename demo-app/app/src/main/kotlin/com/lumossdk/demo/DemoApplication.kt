package com.lumossdk.demo

import android.app.Application
import com.lumossdk.AgentLens

class DemoApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        AgentLens.init(this) {
            apiKey = BuildConfig.LUMOS_API_KEY
            serverUrl = "http://YOUR_VPS_IP:8080"
        }
    }
}
