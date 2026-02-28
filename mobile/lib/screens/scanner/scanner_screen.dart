import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../../config/theme.dart';
import '../../providers/parcel_provider.dart';

class ScannerScreen extends ConsumerStatefulWidget {
  const ScannerScreen({super.key});

  @override
  ConsumerState<ScannerScreen> createState() => _ScannerScreenState();
}

class _ScannerScreenState extends ConsumerState<ScannerScreen> {
  final MobileScannerController _camCtrl = MobileScannerController(
    detectionSpeed: DetectionSpeed.normal,
    facing: CameraFacing.back,
    torchEnabled: false,
  );

  bool _processing = false;
  String? _lastBarcode;
  Timer? _debounce;

  @override
  void dispose() {
    _debounce?.cancel();
    _camCtrl.dispose();
    super.dispose();
  }

  void _onDetect(BarcodeCapture capture) {
    if (_processing) return;
    final codes = capture.barcodes;
    if (codes.isEmpty) return;
    final raw = codes.first.rawValue;
    if (raw == null || raw.isEmpty) return;
    if (raw == _lastBarcode) return;

    _lastBarcode = raw;
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 500), () {
      _processBarcode(raw);
    });
  }

  Future<void> _processBarcode(String barcode) async {
    setState(() => _processing = true);
    _camCtrl.stop();

    try {
      await ref.read(parcelsProvider.notifier).claim(barcode);
      if (mounted) {
        _showResultSheet(
          success: true,
          title: 'Parcel Claimed',
          message: 'Barcode: $barcode\nParcel assigned to you.',
        );
      }
    } catch (e) {
      final msg = e.toString();
      if (mounted) {
        _showResultSheet(
          success: false,
          title: msg.contains('409') ? 'Already Assigned' : 'Error',
          message: msg.contains('409')
              ? 'This parcel is assigned to another rider.'
              : msg.replaceFirst('Exception: ', ''),
        );
      }
    }
  }

  void _showResultSheet({
    required bool success,
    required String title,
    required String message,
  }) {
    showModalBottomSheet(
      context: context,
      isDismissible: false,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(12)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                success ? Icons.check_circle : Icons.error,
                size: 48,
                color: success ? AppTheme.success : AppTheme.error,
              ),
              const SizedBox(height: 12),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.textPrimary,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                message,
                textAlign: TextAlign.center,
                style: const TextStyle(
                    fontSize: 12, color: AppTheme.textSecondary),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () {
                        Navigator.pop(ctx);
                        setState(() {
                          _processing = false;
                          _lastBarcode = null;
                        });
                        _camCtrl.start();
                      },
                      child: const Text('Scan Again'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.pop(ctx);
                        context.pop();
                      },
                      child: const Text('Done'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
        title: const Text('Scan Barcode',
            style: TextStyle(color: Colors.white)),
        actions: [
          IconButton(
            icon: ValueListenableBuilder(
              valueListenable: _camCtrl,
              builder: (_, state, __) => Icon(
                state.torchState == TorchState.on
                    ? Icons.flash_on
                    : Icons.flash_off,
                color: Colors.white,
              ),
            ),
            onPressed: () => _camCtrl.toggleTorch(),
          ),
        ],
      ),
      body: Stack(
        children: [
          MobileScanner(
            controller: _camCtrl,
            onDetect: _onDetect,
          ),
          // Scan overlay
          Center(
            child: Container(
              width: 260,
              height: 260,
              decoration: BoxDecoration(
                border: Border.all(color: AppTheme.primary, width: 2),
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
          // Bottom instruction
          Positioned(
            bottom: 60,
            left: 0,
            right: 0,
            child: Center(
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.black54,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  _processing
                      ? 'Processing...'
                      : 'Align barcode within the frame',
                  style: const TextStyle(
                      color: Colors.white, fontSize: 12),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
