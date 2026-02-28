import 'package:dio/dio.dart';
import '../models/rider.dart';
import '../models/user.dart';
import 'api_client.dart';

class AuthResult {
  final String accessToken;
  final User user;
  final Rider? rider;

  const AuthResult({
    required this.accessToken,
    required this.user,
    this.rider,
  });
}

/// Authentication service — login, logout, session restore.
class AuthService {
  final Dio _dio = ApiClient().dio;
  final ApiClient _client = ApiClient();

  Future<AuthResult> login(String email, String password) async {
    final res = await _dio.post('/auth/login', data: {
      'email': email,
      'password': password,
    });

    final data = res.data as Map<String, dynamic>;
    final token = data['access_token'] as String;
    await _client.setToken(token);

    return AuthResult(
      accessToken: token,
      user: User.fromJson(data['user']),
      rider: data['rider'] != null
          ? Rider.fromJson(data['rider'] as Map<String, dynamic>)
          : null,
    );
  }

  Future<void> logout() async {
    try {
      await _dio.post('/auth/logout');
    } catch (_) {
      // Ignore network errors on logout
    }
    await _client.clearToken();
  }

  Future<Map<String, dynamic>> me() async {
    final res = await _dio.get('/auth/me');
    return res.data as Map<String, dynamic>;
  }

  Future<bool> hasSession() async {
    return _client.hasToken();
  }
}
