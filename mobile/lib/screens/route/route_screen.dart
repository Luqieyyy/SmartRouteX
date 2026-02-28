import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';
import '../../models/route_suggestion.dart';
import '../../providers/route_provider.dart';
import '../../providers/location_provider.dart';
import '../../providers/parcel_provider.dart';

class RouteScreen extends ConsumerStatefulWidget {
  const RouteScreen({super.key});

  @override
  ConsumerState<RouteScreen> createState() => _RouteScreenState();
}

class _RouteScreenState extends ConsumerState<RouteScreen> {
  @override
  Widget build(BuildContext context) {
    final route = ref.watch(routeProvider);
    final parcels = ref.watch(parcelsProvider);

    // Only ASSIGNED + IN_TRANSIT parcels for route optimization
    final activeParcels = parcels.parcels
        .where((p) => p.status == 'ASSIGNED' || p.status == 'IN_TRANSIT')
        .toList();

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
        title: const Text('Route Optimization'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Strategy selector
          const Text(
            'STRATEGY',
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w600,
              color: AppTheme.textSecondary,
              letterSpacing: 1,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              _StrategyChip(
                label: 'Shortest',
                selected: route.strategy == 'shortest',
                onTap: () =>
                    ref.read(routeProvider.notifier).setStrategy('shortest'),
              ),
              const SizedBox(width: 8),
              _StrategyChip(
                label: 'Priority',
                selected: route.strategy == 'priority',
                onTap: () =>
                    ref.read(routeProvider.notifier).setStrategy('priority'),
              ),
              const SizedBox(width: 8),
              _StrategyChip(
                label: 'Balanced',
                selected: route.strategy == 'balanced',
                onTap: () =>
                    ref.read(routeProvider.notifier).setStrategy('balanced'),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // View Map button
          SizedBox(
            height: 44,
            child: OutlinedButton.icon(
              icon: const Icon(Icons.map, size: 18),
              label: const Text('View Route Map'),
              onPressed: () => context.push('/route-map'),
            ),
          ),

          const SizedBox(height: 12),

          // Optimize button
          SizedBox(
            height: 44,
            child: ElevatedButton.icon(
              icon: route.loading
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Icon(Icons.route, size: 18),
              label: Text(route.loading
                  ? 'Calculating...'
                  : 'Optimize Route (${activeParcels.length} stops)'),
              onPressed: route.loading || activeParcels.isEmpty
                  ? null
                  : () async {
                      final loc = await ref
                          .read(locationProvider.notifier)
                          .fetchCurrent();
                      if (loc == null && context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text(
                                'Unable to get GPS. Using default location.'),
                            backgroundColor: AppTheme.warning,
                          ),
                        );
                      }
                      ref.read(routeProvider.notifier).suggest(
                            parcelIds:
                                activeParcels.map((p) => p.id).toList(),
                            startLat: loc?.latitude ?? 0,
                            startLng: loc?.longitude ?? 0,
                          );
                    },
            ),
          ),

          if (route.error != null) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.red.shade50,
                border: Border.all(color: Colors.red.shade200),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                route.error!,
                style:
                    TextStyle(fontSize: 11, color: Colors.red.shade700),
              ),
            ),
          ],

          // Results
          if (route.suggestion != null) ...[
            const SizedBox(height: 20),

            // Summary
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppTheme.surface,
                border: Border.all(color: AppTheme.border),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  _RouteStat(
                    label: 'Stops',
                    value: '${route.suggestion!.stops.length}',
                  ),
                  _divider(),
                  _RouteStat(
                    label: 'Distance',
                    value:
                        '${route.suggestion!.distanceKm.toStringAsFixed(1)} km',
                  ),
                  _divider(),
                  _RouteStat(
                    label: 'ETA',
                    value:
                        '${route.suggestion!.etaMin} min',
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            const Text(
              'OPTIMIZED ORDER',
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w600,
                color: AppTheme.textSecondary,
                letterSpacing: 1,
              ),
            ),
            const SizedBox(height: 8),

            // Stop list
            ...List.generate(route.suggestion!.stops.length, (i) {
              final stop = route.suggestion!.stops[i];
              return _StopTile(index: i + 1, stop: stop);
            }),
          ]
          else if (!route.loading && activeParcels.isEmpty) ...[
            const SizedBox(height: 40),
            Center(
              child: Column(
                children: [
                  Icon(Icons.route, size: 48, color: Colors.grey.shade300),
                  const SizedBox(height: 8),
                  const Text(
                    'No active parcels to optimize',
                    style: TextStyle(
                        fontSize: 13, color: AppTheme.textSecondary),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Claim parcels first via barcode scan',
                    style: TextStyle(
                        fontSize: 11, color: AppTheme.textSecondary),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _divider() => Container(
        width: 1,
        height: 32,
        margin: const EdgeInsets.symmetric(horizontal: 12),
        color: AppTheme.border,
      );
}

class _StrategyChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _StrategyChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: selected
              ? AppTheme.primary.withValues(alpha: 0.08)
              : AppTheme.surface,
          border: Border.all(
            color: selected ? AppTheme.primary : AppTheme.border,
          ),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
            color: selected ? AppTheme.primary : AppTheme.textSecondary,
          ),
        ),
      ),
    );
  }
}

class _RouteStat extends StatelessWidget {
  final String label;
  final String value;

  const _RouteStat({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        children: [
          Text(
            value,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: const TextStyle(
                fontSize: 10, color: AppTheme.textSecondary),
          ),
        ],
      ),
    );
  }
}

class _StopTile extends StatelessWidget {
  final int index;
  final RouteStop stop;

  const _StopTile({required this.index, required this.stop});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppTheme.surface,
          border: Border.all(color: AppTheme.border),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          children: [
            // Index badge
            Container(
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                color: AppTheme.primary,
                borderRadius: BorderRadius.circular(14),
              ),
              alignment: Alignment.center,
              child: Text(
                '$index',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    stop.barcode,
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      fontFamily: 'monospace',
                      color: AppTheme.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    stop.address ?? 'N/A',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                        fontSize: 11, color: AppTheme.textSecondary),
                  ),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  '${(stop.distanceKm ?? 0).toStringAsFixed(1)} km',
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                    color: AppTheme.textPrimary,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
