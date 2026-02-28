import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import '../../config/theme.dart';
import '../../providers/parcel_provider.dart';
import '../../providers/location_provider.dart';
import '../../providers/sync_provider.dart';

class PodScreen extends ConsumerStatefulWidget {
  final String parcelId;
  const PodScreen({super.key, required this.parcelId});

  @override
  ConsumerState<PodScreen> createState() => _PodScreenState();
}

class _PodScreenState extends ConsumerState<PodScreen> {
  File? _photo;
  final _noteCtrl = TextEditingController();
  bool _uploading = false;
  String? _error;

  @override
  void dispose() {
    _noteCtrl.dispose();
    super.dispose();
  }

  Future<void> _capturePhoto() async {
    final picker = ImagePicker();
    final xfile = await picker.pickImage(
      source: ImageSource.camera,
      maxWidth: 1280,
      maxHeight: 1280,
      imageQuality: 80,
    );
    if (xfile != null) {
      setState(() {
        _photo = File(xfile.path);
        _error = null;
      });
    }
  }

  Future<void> _upload() async {
    if (_photo == null) {
      setState(() => _error = 'Please capture a photo first.');
      return;
    }

    setState(() {
      _uploading = true;
      _error = null;
    });

    try {
      // Get current GPS
      final loc = await ref
          .read(locationProvider.notifier)
          .fetchCurrent();

      final id = int.parse(widget.parcelId);
      await ref.read(parcelsProvider.notifier).uploadPod(
            id,
            _photo!.path,
            notes: _noteCtrl.text.trim().isEmpty
                ? null
                : _noteCtrl.text.trim(),
            lat: loc?.latitude,
            lng: loc?.longitude,
          );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Proof of delivery uploaded')),
        );
        context.pop();
      }
    } catch (e) {
      // Queue for offline sync
      ref.read(syncProvider.notifier).enqueue(
        action: '/rider/parcels/${widget.parcelId}/pod',
        method: 'POST',
        body: {
          'parcel_id': widget.parcelId,
          'photo_path': _photo!.path,
          'notes': _noteCtrl.text.trim(),
        },
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Queued for upload when online'),
            backgroundColor: AppTheme.warning,
          ),
        );
        context.pop();
      }
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
        title: const Text('Proof of Delivery'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Photo capture area
          GestureDetector(
            onTap: _capturePhoto,
            child: Container(
              height: 240,
              decoration: BoxDecoration(
                color: AppTheme.surface,
                border: Border.all(
                  color: _error != null ? AppTheme.error : AppTheme.border,
                ),
                borderRadius: BorderRadius.circular(8),
              ),
              child: _photo != null
                  ? ClipRRect(
                      borderRadius: BorderRadius.circular(7),
                      child: Image.file(_photo!, fit: BoxFit.cover,
                          width: double.infinity),
                    )
                  : Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.camera_alt_outlined,
                            size: 40, color: Colors.grey.shade400),
                        const SizedBox(height: 8),
                        const Text(
                          'Tap to capture photo',
                          style: TextStyle(
                            fontSize: 13,
                            color: AppTheme.textSecondary,
                          ),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'Photo of package at delivery point',
                          style: TextStyle(
                            fontSize: 10,
                            color: AppTheme.textSecondary,
                          ),
                        ),
                      ],
                    ),
            ),
          ),
          if (_photo != null)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Align(
                alignment: Alignment.centerRight,
                child: TextButton.icon(
                  onPressed: _capturePhoto,
                  icon: const Icon(Icons.refresh, size: 14),
                  label: const Text('Retake', style: TextStyle(fontSize: 12)),
                ),
              ),
            ),
          if (_error != null)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(
                _error!,
                style: TextStyle(fontSize: 11, color: Colors.red.shade700),
              ),
            ),
          const SizedBox(height: 16),

          // Notes
          const Text(
            'NOTES (OPTIONAL)',
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w600,
              color: AppTheme.textSecondary,
              letterSpacing: 1,
            ),
          ),
          const SizedBox(height: 6),
          TextField(
            controller: _noteCtrl,
            maxLines: 3,
            decoration: const InputDecoration(
              hintText: 'Left at front door, handed to security...',
            ),
          ),
          const SizedBox(height: 8),

          // GPS notice
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppTheme.surface,
              border: Border.all(color: AppTheme.border),
              borderRadius: BorderRadius.circular(6),
            ),
            child: const Row(
              children: [
                Icon(Icons.gps_fixed, size: 14, color: AppTheme.textSecondary),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'GPS coordinates will be captured automatically',
                    style: TextStyle(
                        fontSize: 11, color: AppTheme.textSecondary),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Upload button
          SizedBox(
            height: 48,
            child: ElevatedButton(
              onPressed: _uploading ? null : _upload,
              child: _uploading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Text('Upload Proof of Delivery'),
            ),
          ),
        ],
      ),
    );
  }
}
