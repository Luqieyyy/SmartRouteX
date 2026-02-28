/// API configuration constants.
class ApiConfig {
  ApiConfig._();

  // Change this to your backend URL.
  // Android emulator: 10.0.2.2 maps to host localhost.
  // Physical device: use your machine LAN IP.
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://192.168.0.155:8000/api',
  );

  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);

  // Location tracking interval in seconds
  static const int locationIntervalSec = 15;

  // Sync queue retry
  static const int maxRetries = 5;
  static const Duration retryBaseDelay = Duration(seconds: 2);
}
