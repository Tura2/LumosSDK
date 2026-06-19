package com.lumos.demo

import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

private val BgDark      = Color(0xFF0C0E16)
private val Surface1    = Color(0xFF13161F)
private val Surface2    = Color(0xFF1A1E2C)
private val Border      = Color(0xFF1E2438)
private val Purple      = Color(0xFF7B5FFF)
private val PurpleLight = Color(0xFF9B82FF)
private val Cyan        = Color(0xFF00D4FF)
private val TextPri     = Color(0xFFE8F2FF)
private val TextMuted   = Color(0xFF5A6A84)
private val Green       = Color(0xFF00E887)

private val gradientBrush = Brush.linearGradient(listOf(Purple, Color(0xFF5B4FE8)))
private val headerGradient = Brush.linearGradient(listOf(Purple, Cyan))

@Composable
fun ChatScreen(vm: ChatViewModel) {
    val messages by vm.messages.collectAsState()
    val loading  by vm.loading.collectAsState()
    var input    by remember { mutableStateOf("") }
    val listState = rememberLazyListState()

    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) listState.animateScrollToItem(messages.lastIndex)
    }

    Column(
        Modifier
            .fillMaxSize()
            .background(BgDark)
            .windowInsetsPadding(WindowInsets.systemBars)
    ) {
        ChatHeader()

        LazyColumn(
            Modifier
                .weight(1f)
                .fillMaxWidth(),
            state = listState,
            contentPadding = PaddingValues(horizontal = 16.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            if (messages.isEmpty()) {
                item { EmptyState() }
            }
            items(messages, key = { it.id }) { msg ->
                MessageBubble(
                    msg = msg,
                    onThumbsUp = { vm.thumbsUp(it) },
                    onThumbsDown = { vm.thumbsDown(it) },
                )
            }
            if (loading) {
                item { TypingIndicator() }
            }
        }

        InputBar(
            value = input,
            onValueChange = { input = it },
            onSend = { if (input.isNotBlank() && !loading) { vm.send(input); input = "" } },
            enabled = !loading,
        )
    }
}

@Composable
private fun ChatHeader() {
    Column {
        Row(
            Modifier
                .fillMaxWidth()
                .background(Surface1)
                .padding(horizontal = 20.dp, vertical = 14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Image(
                    painter = painterResource(R.drawable.ic_lumos),
                    contentDescription = "Lumos",
                    modifier = Modifier.size(36.dp).clip(RoundedCornerShape(10.dp)),
                )
                Column {
                    Text(
                        "Lumos Demo",
                        color = TextPri,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = (-0.3).sp,
                    )
                    Text(
                        "AI chat · SDK tracing active",
                        color = TextMuted,
                        fontSize = 11.sp,
                    )
                }
            }
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(5.dp),
            ) {
                Box(
                    Modifier
                        .size(7.dp)
                        .clip(CircleShape)
                        .background(Green)
                )
                Text("Live", color = Green, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
            }
        }
        HorizontalDivider(color = Border, thickness = 1.dp)
    }
}

@Composable
private fun EmptyState() {
    Column(
        Modifier
            .fillMaxWidth()
            .padding(top = 60.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Image(
            painter = painterResource(R.drawable.ic_lumos),
            contentDescription = "Lumos",
            modifier = Modifier.size(64.dp).clip(RoundedCornerShape(18.dp)),
        )
        Text(
            "Lumos AI",
            color = TextPri,
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
        )
        Text(
            "Every message is traced and sent\nto your Lumos portal in real time.",
            color = TextMuted,
            fontSize = 13.sp,
            lineHeight = 19.sp,
            textAlign = androidx.compose.ui.text.style.TextAlign.Center,
        )
    }
}

@Composable
private fun MessageBubble(
    msg: ChatMessage,
    onThumbsUp: (String) -> Unit,
    onThumbsDown: (String) -> Unit,
) {
    val isUser = msg.role == "user"
    val isError = msg.text.startsWith("Error:")

    Column(
        Modifier.fillMaxWidth(),
        horizontalAlignment = if (isUser) Alignment.End else Alignment.Start,
    ) {
        if (!isUser) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                modifier = Modifier.padding(bottom = 5.dp, start = 2.dp),
            ) {
                Image(
                    painter = painterResource(R.drawable.ic_lumos),
                    contentDescription = null,
                    modifier = Modifier.size(20.dp).clip(CircleShape),
                )
                Text(
                    "Lumos AI",
                    color = PurpleLight,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold,
                )
            }
        }

        Box(
            Modifier
                .widthIn(max = 300.dp)
                .clip(
                    RoundedCornerShape(
                        topStart = 16.dp, topEnd = 16.dp,
                        bottomStart = if (isUser) 16.dp else 4.dp,
                        bottomEnd   = if (isUser) 4.dp  else 16.dp,
                    )
                )
                .then(
                    when {
                        isUser  -> Modifier.background(gradientBrush)
                        isError -> Modifier.background(Color(0xFF2A1520)).border(1.dp, Color(0xFF3D1A24), RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp, bottomStart = 4.dp, bottomEnd = 16.dp))
                        else    -> Modifier.background(Surface2).border(1.dp, Border, RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp, bottomStart = 4.dp, bottomEnd = 16.dp))
                    }
                )
                .padding(horizontal = 14.dp, vertical = 11.dp)
        ) {
            Text(
                msg.text,
                color = when {
                    isUser  -> Color.White
                    isError -> Color(0xFFFF6B8A)
                    else    -> TextPri
                },
                fontSize = 14.sp,
                lineHeight = 21.sp,
            )
        }

        if (!isUser && msg.traceId != null && !isError) {
            Row(
                Modifier.padding(top = 6.dp, start = 2.dp),
                horizontalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                FeedbackChip("👍") { onThumbsUp(msg.traceId) }
                FeedbackChip("👎") { onThumbsDown(msg.traceId) }
            }
        }
    }
}

@Composable
private fun FeedbackChip(emoji: String, onClick: () -> Unit) {
    Box(
        Modifier
            .clip(RoundedCornerShape(8.dp))
            .background(Surface2)
            .border(1.dp, Border, RoundedCornerShape(8.dp))
            .clickable(onClick = onClick)
            .padding(horizontal = 10.dp, vertical = 5.dp),
    ) {
        Text(emoji, fontSize = 13.sp)
    }
}

@Composable
private fun TypingIndicator() {
    val transition = rememberInfiniteTransition(label = "typing")
    Row(
        Modifier
            .clip(RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp, bottomStart = 4.dp, bottomEnd = 16.dp))
            .background(Surface2)
            .border(1.dp, Border, RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp, bottomStart = 4.dp, bottomEnd = 16.dp))
            .padding(horizontal = 16.dp, vertical = 14.dp),
        horizontalArrangement = Arrangement.spacedBy(5.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        repeat(3) { i ->
            val alpha by transition.animateFloat(
                initialValue = 0.25f,
                targetValue  = 1f,
                animationSpec = infiniteRepeatable(
                    animation   = tween(450, delayMillis = i * 130, easing = EaseInOut),
                    repeatMode  = RepeatMode.Reverse,
                ),
                label = "dot$i",
            )
            Box(
                Modifier
                    .size(7.dp)
                    .clip(CircleShape)
                    .background(Purple.copy(alpha = alpha))
            )
        }
    }
}

@Composable
private fun InputBar(
    value: String,
    onValueChange: (String) -> Unit,
    onSend: () -> Unit,
    enabled: Boolean,
) {
    Column {
        HorizontalDivider(color = Border, thickness = 1.dp)
        Row(
            Modifier
                .fillMaxWidth()
                .background(Surface1)
                .padding(horizontal = 12.dp, vertical = 10.dp),
            verticalAlignment = Alignment.Bottom,
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            OutlinedTextField(
                value = value,
                onValueChange = onValueChange,
                modifier = Modifier.weight(1f),
                placeholder = {
                    Text("Ask anything…", color = TextMuted, fontSize = 14.sp)
                },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor   = Purple,
                    unfocusedBorderColor = Border,
                    focusedTextColor     = TextPri,
                    unfocusedTextColor   = TextPri,
                    cursorColor          = Purple,
                    focusedContainerColor   = BgDark,
                    unfocusedContainerColor = BgDark,
                ),
                shape = RoundedCornerShape(14.dp),
                maxLines = 5,
                textStyle = LocalTextStyle.current.copy(fontSize = 14.sp),
            )
            val canSend = value.isNotBlank() && enabled
            Box(
                Modifier
                    .size(48.dp)
                    .clip(RoundedCornerShape(14.dp))
                    .background(if (canSend) gradientBrush else Brush.linearGradient(listOf(Surface2, Surface2)))
                    .border(1.dp, if (canSend) Color.Transparent else Border, RoundedCornerShape(14.dp))
                    .clickable(enabled = canSend, onClick = onSend),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    "↑",
                    color = if (canSend) Color.White else TextMuted,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                )
            }
        }
    }
}
