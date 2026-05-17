import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:dio/dio.dart';
import 'package:sns_uploader/core/network/api_client.dart';
import 'package:sns_uploader/core/external/file_service.dart';
import 'package:sns_uploader/features/media_library/models/media_models.dart';
import 'package:sns_uploader/features/media_library/services/media_library_provider.dart';
import 'package:sns_uploader/features/media_library/widgets/media_card.dart';

class ProjectDetailScreen extends StatefulWidget {
  final MediaProject project;

  const ProjectDetailScreen({super.key, required this.project});

  @override
  State<ProjectDetailScreen> createState() => _ProjectDetailScreenState();
}

class _ProjectDetailScreenState extends State<ProjectDetailScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => context.read<MediaLibraryProvider>().fetchAssetsForProject(widget.project.id));
  }

  Future<void> _handleUpload() async {
    final provider = context.read<MediaLibraryProvider>();
    try {
      final file = await FileService().pickMediaFile();
      if (file != null) {
        // Show loading indicator
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('업로드 중...'), duration: Duration(seconds: 1)),
        );

        final formData = FormData.fromMap({
          'project_id': widget.project.id,
          'asset_type': file.name.endsWith('.mp4') ? 'video' : 'image',
          'file': MultipartFile.fromBytes(file.bytes!, filename: file.name),
        });

        await ApiClient().dio.post('/api/v1/media/assets', data: formData);
        await provider.fetchAssetsForProject(widget.project.id);
        
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('성공적으로 업로드되었습니다.'), backgroundColor: Colors.green),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('업로드 실패: $e'), backgroundColor: Colors.red),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<MediaLibraryProvider>();
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.project.title),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.add_photo_alternate),
            onPressed: _handleUpload,
            tooltip: '자산 추가',
          ),
          const SizedBox(width: 16),
        ],
      ),
      body: Column(
        children: [
          if (widget.project.description.isNotEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 8),
              child: Text(
                widget.project.description,
                style: const TextStyle(color: Colors.white38),
              ),
            ),
          const Divider(height: 1, color: Colors.white10),
          if (provider.isLoading)
            const Expanded(child: Center(child: CircularProgressIndicator()))
          else if (provider.currentAssets.isEmpty)
            Expanded(
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.photo_library_outlined, size: 64, color: Colors.white10),
                    const SizedBox(height: 16),
                    const Text('게시된 자산이 없습니다.', style: TextStyle(color: Colors.white38)),
                    const SizedBox(height: 16),
                    ElevatedButton(onPressed: _handleUpload, child: const Text('첫 번째 파일 업로드')),
                  ],
                ),
              ),
            )
          else
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: LayoutBuilder(
                  builder: (context, constraints) {
                    int crossAxisCount = constraints.maxWidth > 1200 ? 5 : (constraints.maxWidth > 800 ? 3 : 2);
                    return GridView.builder(
                      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: crossAxisCount,
                        crossAxisSpacing: 16,
                        mainAxisSpacing: 16,
                        childAspectRatio: 1,
                      ),
                      itemCount: provider.currentAssets.length,
                      itemBuilder: (context, index) {
                        final asset = provider.currentAssets[index];
                        return MediaCard(
                          title: 'Asset #${asset.id}',
                          subtitle: asset.assetType.toUpperCase(),
                          icon: asset.assetType == 'video' ? Icons.play_circle_outline : Icons.image_outlined,
                          imageUrl: asset.fullUrl,
                          onTap: () {
                            // TODO: Show Full Screen Preview
                          },
                          onDelete: () => provider.deleteAsset(asset.id, widget.project.id),
                        );
                      },
                    );
                  },
                ),
              ),
            ),
        ],
      ),
    );
  }
}
