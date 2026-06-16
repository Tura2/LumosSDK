package com.lumos

sealed class Feedback {
    object ThumbsUp : Feedback()
    object ThumbsDown : Feedback()
}
