/// API configuration with multi-environment support.
///
/// Usage:
///   flutter run                          → uses defaultValue (physical device)
///   flutter run --dart-define=ENV=emu    → Android emulator
///   flutter run --dart-define=ENV=ngrok --dart-define=NGROK_URL=https://xxxx.ngrok-free.app/api
class ApiConfig {
  ApiConfig._();

  // ── Environment flag ──────────────────────────────────────────────────────
  static const String _env = String.fromEnvironment('ENV', defaultValue: 'device');

  // ── ngrok URL (set via --dart-define=NGROK_URL=https://xxx.ngrok-free.app/api)
  static const String _ngrokUrl = String.fromEnvironment(
    'NGROK_URL',
    defaultValue: '',
  );

  // ── Base URL resolution ────────────────────────────────────────────────────
  static String get baseUrl {
    if (_ngrokUrl.isNotEmpty) return _ngrokUrl;

    switch (_env) {
      case 'emu':
        // Android emulator: 10.0.2.2 → host machine localhost
        return 'http://10.0.2.2:8000/api';
      case 'ios':
        // iOS Simulator: localhost works directly
        return 'http://127.0.0.1:8000/api';
      case 'prod':
        return 'https://api.smartroutex.com/api';
      case 'device':
      default:
        // Physical device on same WiFi — uses host machine LAN IP
        // Run: ipconfig (Windows) | grep IPv4
        return 'http://192.168.1.2:8000/api';
    }
  }

  // ── Timeouts ──────────────────────────────────────────────────────────────
  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);

  // ── Location tracking interval (seconds) ──────────────────────────────────
  static const int locationIntervalSec = 15;

  // ── Sync queue retry ──────────────────────────────────────────────────────
  static const int maxRetries = 5;
  static const Duration retryBaseDelay = Duration(seconds: 2);

  // ── Debug helper ──────────────────────────────────────────────────────────
  static void printConfig() {
    // ignore: avoid_print
    print('[ApiConfig] ENV=$_env  baseUrl=$baseUrl');
  }
}
