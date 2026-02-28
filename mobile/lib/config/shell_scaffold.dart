import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

/// Bottom navigation shell for authenticated screens.
class ShellScaffold extends StatelessWidget {
  final Widget child;
  const ShellScaffold({super.key, required this.child});

  static const _tabs = [
    {'icon': Icons.home_outlined, 'activeIcon': Icons.home, 'label': 'Home', 'path': '/home'},
    {'icon': Icons.inventory_2_outlined, 'activeIcon': Icons.inventory_2, 'label': 'Parcels', 'path': '/parcels'},
    {'icon': Icons.qr_code_scanner_outlined, 'activeIcon': Icons.qr_code_scanner, 'label': 'Scan', 'path': '/scanner'},
    {'icon': Icons.route_outlined, 'activeIcon': Icons.route, 'label': 'Route', 'path': '/route'},
  ];

  int _currentIndex(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    for (int i = 0; i < _tabs.length; i++) {
      if (location.startsWith(_tabs[i]['path'] as String)) return i;
    }
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    final idx = _currentIndex(context);

    return Scaffold(
      body: child,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: idx,
        onTap: (i) {
          final path = _tabs[i]['path'] as String;
          if (i != idx) context.go(path);
        },
        items: _tabs
            .map((t) => BottomNavigationBarItem(
                  icon: Icon(t['icon'] as IconData),
                  activeIcon: Icon(t['activeIcon'] as IconData),
                  label: t['label'] as String,
                ))
            .toList(),
      ),
    );
  }
}
