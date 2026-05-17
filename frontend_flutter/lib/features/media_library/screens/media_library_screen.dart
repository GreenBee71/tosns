import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:sns_uploader/core/widgets/premium_header.dart';
import 'package:sns_uploader/features/media_library/services/media_library_provider.dart';
import 'package:sns_uploader/features/media_library/widgets/media_card.dart';
import 'package:sns_uploader/features/media_library/screens/project_detail_screen.dart';

class MediaLibraryScreen extends StatefulWidget {
  const MediaLibraryScreen({super.key});

  @override
  State<MediaLibraryScreen> createState() => _MediaLibraryScreenState();
}

class _MediaLibraryScreenState extends State<MediaLibraryScreen> {
  final TextEditingController _titleController = TextEditingController();
  final TextEditingController _descController = TextEditingController();

  @override
  void initState() {
    super.initState();
    Future.microtask(() => context.read<MediaLibraryProvider>().fetchProjects());
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descController.dispose();
    super.dispose();
  }

  void _showCreateProjectDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF112240),
        title: const Text('신규 프로젝트 생성'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: _titleController,
              decoration: const InputDecoration(labelText: '프로젝트 제목', hintText: '예: 2024 상반기 틱톡 캠페인'),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _descController,
              decoration: const InputDecoration(labelText: '설명 (선택 사항)'),
              maxLines: 2,
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('취소')),
          ElevatedButton(
            onPressed: () async {
              if (_titleController.text.isNotEmpty) {
                await context.read<MediaLibraryProvider>().createProject(
                  _titleController.text,
                  _descController.text,
                );
                if (mounted) Navigator.pop(context);
                _titleController.clear();
                _descController.clear();
              }
            },
            child: const Text('생성'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<MediaLibraryProvider>();

    return Padding(
      padding: const EdgeInsets.all(32.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Expanded(
                child: PremiumHeader(
                  icon: Icons.folder_special,
                  title: '미디어 라이브러리 (Media Library)',
                  subtitle: '프로젝트별로 미디어 자산을 체계적으로 관리하고 공유합니다.',
                ),
              ),
              ElevatedButton.icon(
                onPressed: _showCreateProjectDialog,
                icon: const Icon(Icons.create_new_folder),
                label: const Text('신규 프로젝트'),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 48),
          if (provider.isLoading && provider.projects.isEmpty)
            const Expanded(child: Center(child: CircularProgressIndicator()))
          else if (provider.projects.isEmpty)
            Expanded(
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.folder_open, size: 64, color: Colors.white10),
                    const SizedBox(height: 16),
                    const Text('아직 생성된 프로젝트가 없습니다.', style: TextStyle(color: Colors.white38)),
                  ],
                ),
              ),
            )
          else
            Expanded(
              child: LayoutBuilder(
                builder: (context, constraints) {
                  int crossAxisCount = constraints.maxWidth > 1200 ? 5 : (constraints.maxWidth > 800 ? 3 : 2);
                  return GridView.builder(
                    gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: crossAxisCount,
                      crossAxisSpacing: 24,
                      mainAxisSpacing: 24,
                      childAspectRatio: 0.9,
                    ),
                    itemCount: provider.projects.length,
                    itemBuilder: (context, index) {
                      final project = provider.projects[index];
                      return MediaCard(
                        title: project.title,
                        subtitle: '${project.assetCount}개의 자산',
                        icon: Icons.folder,
                        isFolder: true,
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => ProjectDetailScreen(project: project),
                            ),
                          ).then((_) => provider.fetchProjects());
                        },
                        onDelete: () => provider.deleteProject(project.id),
                      );
                    },
                  );
                },
              ),
            ),
        ],
      ),
    );
  }
}
