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
    try {
      final res = await _dio.post('/rider/login', data: {
        'work_email': email,
        'password': password,
      });

      final data = res.data as Map<String, dynamic>;
      final token = data['access_token'] as String;
      await _client.setToken(token);

      // Rider login returns 'rider' object, not 'user'
      // We'll create a User object from rider data
      final riderData = data['rider'] as Map<String, dynamic>;
      final rider = Rider.fromJson(riderData);
      
      // Create a minimal User object for rider (since rider IS the user)
      final user = User(
        id: riderData['id'] as int,
        name: riderData['name'] as String,
        email: riderData['work_email'] as String,
        role: 'rider',
      );

      return AuthResult(
        accessToken: token,
        user: user,
        rider: rider,
      );
    } on DioException catch (e) {
      // Parse backend error messages
      String message = 'Login failed. Please try again.';

      if (e.response != null) {
        final statusCode = e.response!.statusCode;
        final data = e.response!.data;

        // Handle different status codes
        if (statusCode == 422) {
          // Validation error - extract message from errors object
          if (data is Map && data['errors'] != null) {
            final errors = data['errors'] as Map;
            final firstError = errors.values.first;
            message = firstError is List && firstError.isNotEmpty
                ? firstError[0].toString()
                : 'Invalid credentials';
          } else if (data is Map && data['message'] != null) {
            message = data['message'].toString();
          }
        } else if (statusCode == 403) {
          // Account status issue
          message = data is Map && data['message'] != null
              ? data['message'].toString()
              : 'Account not active. Contact administrator.';
        } else if (statusCode == 429) {
          // Account locked
          message = data is Map && data['message'] != null
              ? data['message'].toString()
              : 'Too many failed attempts. Try again later.';
        } else if (statusCode == 500) {
          message = 'Server error. Please contact support.';
        } else {
          message = data is Map && data['message'] != null
              ? data['message'].toString()
              : 'Login failed (Status: $statusCode)';
        }
      } else if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.receiveTimeout) {
        message = 'Connection timeout. Check your internet.';
      } else if (e.type == DioExceptionType.connectionError) {
        message = 'Cannot connect to server. Check backend is running.';
      }

      throw Exception(message);
    } catch (e) {
      throw Exception('Unexpected error: ${e.toString()}');
    }
  }

  Future<void> logout() async {
    try {
      await _dio.post('/rider/logout');
    } catch (_) {
      // Ignore network errors on logout
    }
    await _client.clearToken();
  }

  Future<Map<String, dynamic>> me() async {
    final res = await _dio.get('/rider/me');
    return res.data as Map<String, dynamic>;
  }

  Future<bool> hasSession() async {
    return _client.hasToken();
  }
}
