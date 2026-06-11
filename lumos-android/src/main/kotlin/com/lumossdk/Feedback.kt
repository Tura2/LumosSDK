package com.lumossdk

sealed class Feedback {
    object ThumbsUp : Feedback()
    object ThumbsDown : Feedback()
}
