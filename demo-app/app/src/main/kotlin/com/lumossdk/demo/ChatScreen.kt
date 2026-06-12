package com.lumossdk.demo

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun ChatScreen(vm: ChatViewModel) {
    val messages by vm.messages.collectAsState()
    val loading by vm.loading.collectAsState()
    var input by remember { mutableStateOf("") }
    val listState = rememberLazyListState()

    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) listState.animateScrollToItem(messages.lastIndex)
    }

    Column(Modifier.fillMaxSize().padding(16.dp)) {
        LazyColumn(Modifier.weight(1f), state = listState) {
            items(messages) { msg ->
                Column(Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
                    val align = if (msg.role == "user") Alignment.End else Alignment.Start
                    Box(Modifier.align(align)) {
                        Card { Text(msg.text, Modifier.padding(12.dp)) }
                    }
                    if (msg.role == "ai" && msg.traceId != null) {
                        Row(Modifier.align(Alignment.Start)) {
                            TextButton(onClick = { vm.thumbsUp(msg.traceId) }) { Text("👍") }
                            TextButton(onClick = { vm.thumbsDown(msg.traceId) }) { Text("👎") }
                        }
                    }
                }
            }
        }
        if (loading) LinearProgressIndicator(Modifier.fillMaxWidth())
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            OutlinedTextField(
                value = input, onValueChange = { input = it },
                modifier = Modifier.weight(1f), placeholder = { Text("Ask anything...") }
            )
            Spacer(Modifier.width(8.dp))
            Button(
                onClick = { if (input.isNotBlank()) { vm.send(input); input = "" } },
                enabled = !loading
            ) {
                Text("Send")
            }
        }
    }
}
