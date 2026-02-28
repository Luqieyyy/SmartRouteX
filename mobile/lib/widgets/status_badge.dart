import 'package:flutter/material.dart';
import '../config/theme.dart';

/// Compact status badge.
class StatusBadge extends StatelessWidget {
  final String status;
  const StatusBadge({super.key, required this.status});

  Color get _bg {
    switch (status) {
      case 'CREATED':
        return Colors.grey.shade100;
      case 'ASSIGNED':
        return Colors.blue.shade50;
      case 'IN_TRANSIT':
        return Colors.orange.shade50;
      case 'DELIVERED':
        return Colors.green.shade50;
      case 'FAILED':
        return Colors.red.shade50;
      default:
        return Colors.grey.shade100;
    }
  }

  Color get _fg {
    switch (status) {
      case 'CREATED':
        return Colors.grey.shade700;
      case 'ASSIGNED':
        return Colors.blue.shade700;
      case 'IN_TRANSIT':
        return AppTheme.warning;
      case 'DELIVERED':
        return AppTheme.success;
      case 'FAILED':
        return AppTheme.error;
      default:
        return Colors.grey.shade700;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: _bg,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        status.replaceAll('_', ' '),
        style: TextStyle(
          fontSize: 9,
          fontWeight: FontWeight.w600,
          color: _fg,
          letterSpacing: 0.3,
        ),
      ),
    );
  }
}
