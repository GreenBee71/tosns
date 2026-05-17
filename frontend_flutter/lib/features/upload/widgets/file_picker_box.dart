import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:sns_uploader/core/widgets/premium_card.dart';
import 'package:sns_uploader/features/upload/services/upload_provider.dart';

class FilePickerBox extends StatelessWidget {
  const FilePickerBox({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<UploadProvider>();
    final selectedFile = provider.selectedFile;
    final isUploading = provider.isUploading;

    return PremiumCard(
      onTap: isUploading ? null : provider.pickFile,
      height: 300,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            selectedFile != null ? Icons.file_present_rounded : Icons.cloud_upload_rounded,
            size: 64,
            color: selectedFile != null ? Theme.of(context).colorScheme.primary : Colors.white24,
          ),
          const SizedBox(height: 24),
          Text(
            selectedFile != null ? selectedFile.name : '미디어 파일 업로드 (MP4, PNG, JPG)',
            style: TextStyle(
              color: selectedFile != null ? Colors.white : Colors.white54,
              fontSize: 16,
              fontWeight: FontWeight.w400,
            ),
            textAlign: TextAlign.center,
          ),
          if (selectedFile != null) ...[
            const SizedBox(height: 12),
            Text(
              '${(selectedFile.size / (1024 * 1024)).toStringAsFixed(2)} MB',
              style: TextStyle(color: Theme.of(context).colorScheme.primary, fontWeight: FontWeight.w500),
            ),
          ],
        ],
      ),
    );
  }
}
