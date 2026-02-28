import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../providers/auth_provider.dart';
import '../screens/auth/login_screen.dart';
import '../screens/home/home_screen.dart';
import '../screens/parcels/parcels_screen.dart';
import '../screens/parcels/parcel_detail_screen.dart';
import '../screens/scanner/scanner_screen.dart';
import '../screens/pod/pod_screen.dart';
import '../screens/route/route_screen.dart';
import 'shell_scaffold.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final auth = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/home',
    redirect: (context, state) {
      final isAuth = auth.isAuthenticated;
      final isLoading = auth.loading;
      final isLoginRoute = state.matchedLocation == '/login';

      if (isLoading) return null;
      if (!isAuth && !isLoginRoute) return '/login';
      if (isAuth && isLoginRoute) return '/home';
      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        builder: (_, __) => const LoginScreen(),
      ),
      ShellRoute(
        builder: (_, __, child) => ShellScaffold(child: child),
        routes: [
          GoRoute(
            path: '/home',
            builder: (_, __) => const HomeScreen(),
          ),
          GoRoute(
            path: '/parcels',
            builder: (_, __) => const ParcelsScreen(),
          ),
          GoRoute(
            path: '/parcels/:id',
            builder: (_, state) {
              return ParcelDetailScreen(parcelId: state.pathParameters['id']!);
            },
          ),
          GoRoute(
            path: '/scanner',
            builder: (_, __) => const ScannerScreen(),
          ),
          GoRoute(
            path: '/pod/:id',
            builder: (_, state) {
              return PodScreen(parcelId: state.pathParameters['id']!);
            },
          ),
          GoRoute(
            path: '/route',
            builder: (_, __) => const RouteScreen(),
          ),
        ],
      ),
    ],
  );
});
