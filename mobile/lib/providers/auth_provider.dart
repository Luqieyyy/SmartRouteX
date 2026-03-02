import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/user.dart';
import '../models/rider.dart';
import '../services/auth_service.dart';
import '../services/api_client.dart';

/// Auth state — null means not authenticated.
class AuthState {
  final User? user;
  final Rider? rider;
  final bool loading;
  final String? error;

  const AuthState({this.user, this.rider, this.loading = false, this.error});

  AuthState copyWith({User? user, Rider? rider, bool? loading, String? error}) {
    return AuthState(
      user: user ?? this.user,
      rider: rider ?? this.rider,
      loading: loading ?? this.loading,
      error: error,
    );
  }

  bool get isAuthenticated => user != null;
}

class AuthNotifier extends StateNotifier<AuthState> {
  final AuthService _authService;

  AuthNotifier(this._authService) : super(const AuthState(loading: true)) {
    _restoreSession();
  }

  Future<void> _restoreSession() async {
    try {
      final hasToken = await _authService.hasSession();
      if (!hasToken) {
        state = const AuthState();
        return;
      }

      final data = await _authService.me();
      
      // me() endpoint returns rider data directly (not nested)
      final rider = Rider.fromJson(data);
      
      // Create User object from rider data
      final user = User(
        id: data['id'] as int,
        name: data['name'] as String,
        email: data['work_email'] as String,
        role: 'rider',
      );
      
      state = AuthState(user: user, rider: rider);
    } catch (_) {
      await ApiClient().clearToken();
      state = const AuthState();
    }
  }

  Future<void> login(String email, String password) async {
    state = state.copyWith(loading: true, error: null);
    try {
      final result = await _authService.login(email, password);
      state = AuthState(user: result.user, rider: result.rider);
    } catch (e) {
      String msg = e.toString();
      // Remove 'Exception: ' prefix if present
      if (msg.startsWith('Exception: ')) {
        msg = msg.substring('Exception: '.length);
      }
      state = state.copyWith(loading: false, error: msg);
    }
  }

  Future<void> logout() async {
    await _authService.logout();
    state = const AuthState();
  }

  void updateRider(Rider rider) {
    state = state.copyWith(rider: rider);
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(AuthService());
});
