import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/home_provider.dart';
import '../../providers/location_provider.dart';
import '../../providers/sync_provider.dart';
import '../../widgets/kpi_card.dart';
import '../../widgets/sync_indicator.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      ref.read(homeProvider.notifier).load();
      ref.read(syncProvider.notifier).refresh();
    });
  }

  @override
  Widget build(BuildContext context) {
    final home = ref.watch(homeProvider);
    final auth = ref.watch(authProvider);
    final location = ref.watch(locationProvider);

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Operations'),
        actions: [
          const SyncIndicator(),
          const SizedBox(width: 8),
          PopupMenuButton<String>(
            onSelected: (v) {
              if (v == 'logout') ref.read(authProvider.notifier).logout();
            },
            itemBuilder: (_) => [
              PopupMenuItem(
                enabled: false,
                child: Text(
                  auth.user?.name ?? '',
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    color: AppTheme.textPrimary,
                  ),
                ),
              ),
              const PopupMenuDivider(),
              const PopupMenuItem(
                value: 'logout',
                child: Text('Sign Out'),
              ),
            ],
            child: const Padding(
              padding: EdgeInsets.symmetric(horizontal: 12),
              child: Icon(Icons.account_circle_outlined, size: 24),
            ),
          ),
        ],
      ),
      body: home.loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: () => ref.read(homeProvider.notifier).load(),
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Shift toggle
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: home.shiftActive
                          ? AppTheme.primary.withValues(alpha: 0.05)
                          : AppTheme.surface,
                      border: Border.all(
                        color: home.shiftActive
                            ? AppTheme.primary.withValues(alpha: 0.3)
                            : AppTheme.border,
                      ),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          home.shiftActive
                              ? Icons.play_circle_filled
                              : Icons.pause_circle_outline,
                          color: home.shiftActive
                              ? AppTheme.primary
                              : AppTheme.textSecondary,
                          size: 28,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                home.shiftActive
                                    ? 'Shift Active'
                                    : 'Shift Inactive',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                  color: home.shiftActive
                                      ? AppTheme.primary
                                      : AppTheme.textPrimary,
                                ),
                              ),
                              Text(
                                home.shiftActive
                                    ? 'Location tracking enabled'
                                    : 'Tap to start your shift',
                                style: const TextStyle(
                                  fontSize: 11,
                                  color: AppTheme.textSecondary,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Switch(
                          value: home.shiftActive,
                          activeColor: AppTheme.primary,
                          onChanged: (_) async {
                            await ref
                                .read(homeProvider.notifier)
                                .toggleShift();
                            final active =
                                ref.read(homeProvider).shiftActive;
                            if (active) {
                              ref
                                  .read(locationProvider.notifier)
                                  .startTracking();
                            } else {
                              ref
                                  .read(locationProvider.notifier)
                                  .stopTracking();
                            }
                          },
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // GPS indicator
                  if (location.tracking)
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: AppTheme.success.withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.gps_fixed,
                              size: 14, color: AppTheme.success),
                          SizedBox(width: 6),
                          Text(
                            'GPS tracking active',
                            style: TextStyle(
                                fontSize: 11, color: AppTheme.success),
                          ),
                        ],
                      ),
                    ),
                  if (location.tracking) const SizedBox(height: 16),

                  // KPI cards
                  const Text(
                    'TODAY\'S SUMMARY',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.textSecondary,
                      letterSpacing: 1,
                    ),
                  ),
                  const SizedBox(height: 8),
                  GridView.count(
                    crossAxisCount: 2,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    mainAxisSpacing: 8,
                    crossAxisSpacing: 8,
                    childAspectRatio: 1.6,
                    children: [
                      KpiCard(
                        label: 'Assigned',
                        value: '${home.summary?.assigned ?? 0}',
                        icon: Icons.inventory_2_outlined,
                      ),
                      KpiCard(
                        label: 'In Transit',
                        value: '${home.summary?.inTransit ?? 0}',
                        icon: Icons.local_shipping_outlined,
                        valueColor: AppTheme.warning,
                      ),
                      KpiCard(
                        label: 'Delivered',
                        value: '${home.summary?.delivered ?? 0}',
                        icon: Icons.check_circle_outline,
                        valueColor: AppTheme.success,
                      ),
                      KpiCard(
                        label: 'Failed',
                        value: '${home.summary?.failed ?? 0}',
                        icon: Icons.cancel_outlined,
                        valueColor: AppTheme.error,
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Quick actions
                  const Text(
                    'QUICK ACTIONS',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.textSecondary,
                      letterSpacing: 1,
                    ),
                  ),
                  const SizedBox(height: 8),
                  _ActionTile(
                    icon: Icons.qr_code_scanner,
                    label: 'Scan Barcode',
                    subtitle: 'Claim or process a parcel',
                    onTap: () => context.push('/scanner'),
                  ),
                  _ActionTile(
                    icon: Icons.route,
                    label: 'Route Optimization',
                    subtitle: 'Generate optimized delivery route',
                    onTap: () => context.push('/route'),
                  ),
                  _ActionTile(
                    icon: Icons.inventory_2_outlined,
                    label: 'View Parcels',
                    subtitle: 'Manage assigned deliveries',
                    onTap: () => context.go('/parcels'),
                  ),
                ],
              ),
            ),
    );
  }
}

class _ActionTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String subtitle;
  final VoidCallback onTap;

  const _ActionTile({
    required this.icon,
    required this.label,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppTheme.surface,
            border: Border.all(color: AppTheme.border),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AppTheme.primary.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, size: 20, color: AppTheme.primary),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      label,
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                    Text(
                      subtitle,
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right,
                  size: 18, color: AppTheme.textSecondary),
            ],
          ),
        ),
      ),
    );
  }
}
