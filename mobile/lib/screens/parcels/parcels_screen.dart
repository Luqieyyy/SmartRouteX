import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';
import '../../providers/parcel_provider.dart';
import '../../widgets/parcel_tile.dart';

class ParcelsScreen extends ConsumerStatefulWidget {
  const ParcelsScreen({super.key});

  @override
  ConsumerState<ParcelsScreen> createState() => _ParcelsScreenState();
}

class _ParcelsScreenState extends ConsumerState<ParcelsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabCtrl;
  final _searchCtrl = TextEditingController();

  static const _tabs = ['ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'FAILED'];
  static const _tabLabels = ['Assigned', 'In Transit', 'Delivered', 'Failed'];

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: _tabs.length, vsync: this);
    _tabCtrl.addListener(() {
      if (!_tabCtrl.indexIsChanging) {
        ref.read(parcelsProvider.notifier).setTab(_tabs[_tabCtrl.index]);
      }
    });
    Future.microtask(() {
      ref.read(parcelsProvider.notifier).load(status: _tabs[0]);
    });
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(parcelsProvider);

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Parcels'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(96),
          child: Column(
            children: [
              // Search
              Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                child: SizedBox(
                  height: 36,
                  child: TextField(
                    controller: _searchCtrl,
                    style: const TextStyle(fontSize: 13),
                    decoration: InputDecoration(
                      hintText: 'Search barcode, name, address...',
                      hintStyle: const TextStyle(fontSize: 12),
                      prefixIcon: const Icon(Icons.search, size: 18),
                      suffixIcon: _searchCtrl.text.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.close, size: 16),
                              onPressed: () {
                                _searchCtrl.clear();
                                ref
                                    .read(parcelsProvider.notifier)
                                    .load(status: _tabs[_tabCtrl.index]);
                              },
                            )
                          : null,
                      contentPadding: const EdgeInsets.symmetric(vertical: 0),
                      isDense: true,
                    ),
                    onSubmitted: (q) {
                      ref.read(parcelsProvider.notifier).load(
                            status: _tabs[_tabCtrl.index],
                            query: q.isEmpty ? null : q,
                          );
                    },
                  ),
                ),
              ),
              // Tabs
              TabBar(
                controller: _tabCtrl,
                isScrollable: false,
                indicatorColor: AppTheme.primary,
                labelColor: AppTheme.primary,
                unselectedLabelColor: AppTheme.textSecondary,
                labelStyle: const TextStyle(
                    fontSize: 11, fontWeight: FontWeight.w600),
                unselectedLabelStyle: const TextStyle(fontSize: 11),
                tabs: _tabLabels.map((l) => Tab(text: l)).toList(),
              ),
            ],
          ),
        ),
      ),
      body: state.loading
          ? const Center(child: CircularProgressIndicator())
          : state.parcels.isEmpty
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.inventory_2_outlined,
                          size: 48, color: Colors.grey.shade300),
                      const SizedBox(height: 8),
                      const Text(
                        'No parcels found',
                        style: TextStyle(
                          fontSize: 13,
                          color: AppTheme.textSecondary,
                        ),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: () => ref
                      .read(parcelsProvider.notifier)
                      .load(status: _tabs[_tabCtrl.index]),
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: state.parcels.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 6),
                    itemBuilder: (_, i) {
                      final parcel = state.parcels[i];
                      return ParcelTile(
                        parcel: parcel,
                        onTap: () => context.push('/parcels/${parcel.id}'),
                      );
                    },
                  ),
                ),
    );
  }
}
