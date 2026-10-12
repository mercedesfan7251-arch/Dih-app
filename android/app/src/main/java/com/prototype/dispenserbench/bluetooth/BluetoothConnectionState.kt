package com.prototype.dispenserbench.bluetooth

enum class BluetoothErrorType {
    BLUETOOTH_DISABLED,
    PERMISSION_DENIED,
    DEVICE_NOT_PAIRED,
    CONNECTION_TIMEOUT,
    CONNECTION_LOST,
    SOCKET_ERROR,
    UNSUPPORTED
}

sealed class BluetoothConnectionState {
    data class Disconnected(val message: String? = null) : BluetoothConnectionState()

    data class Connecting(val deviceName: String, val deviceAddress: String) : BluetoothConnectionState()

    data class Connected(val deviceName: String, val deviceAddress: String) : BluetoothConnectionState()

    data class Error(val errorType: BluetoothErrorType, val userFriendlyMessage: String) : BluetoothConnectionState()

    val isConnected: Boolean
        get() = this is Connected

    val isConnecting: Boolean
        get() = this is Connecting
}
