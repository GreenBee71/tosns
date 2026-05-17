import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:sns_uploader/core/widgets/premium_header.dart';
import 'package:sns_uploader/core/widgets/responsive_layout.dart';
import 'package:sns_uploader/core/widgets/sns_platform_tile.dart';
import 'package:sns_uploader/core/widgets/sort_chip.dart';
import 'package:sns_uploader/features/account/services/account_provider.dart';
import 'package:sns_uploader/features/upload/services/upload_provider.dart';
import 'package:sns_uploader/features/upload/widgets/file_picker_box.dart';
import 'package:sns_uploader/features/upload/widgets/upload_form.dart';

class UploadScreen extends StatelessWidget {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();

  UploadScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final uploadProvider = context.watch<UploadProvider>();
    final accountProvider = context.watch<AccountProvider>();
    final scrollController = ScrollController();

    return Scrollbar(
      controller: scrollController,
      child: SingleChildScrollView(
        controller: scrollController,
        padding: const EdgeInsets.all(32.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 헤더 영역
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Expanded(
                    child: PremiumHeader(
                      icon: Icons.rocket_launch_rounded,
                      title: '업로드 런처 (Launch Pad)',
                      subtitle: '선택한 미디어 자산을 여러 SNS 플랫폼에 즉시 또는 예약 배포합니다.',
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.only(top: 8.0),
                    child: _buildSubmitButton(context, uploadProvider),
                  ),
                  const SizedBox(width: 32),
                  _buildGlobalActions(context, uploadProvider, accountProvider),
                ],
              ),
              const SizedBox(height: 48),

              // 파일 선택 및 입력 폼 영역 (반응형)
              ResponsiveLayout(
                desktop: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Expanded(flex: 2, child: FilePickerBox()),
                    const SizedBox(width: 32),
                    const Expanded(flex: 3, child: UploadForm()),
                  ],
                ),
                mobile: Column(
                  children: [
                    const FilePickerBox(),
                    const SizedBox(height: 32),
                    const UploadForm(),
                  ],
                ),
              ),
              const SizedBox(height: 48),

              // 플랫폼 선택 그리드 제목 및 정렬
              _buildSectionTitle(context, '배포 플랫폼 선택'),
              const SizedBox(height: 24),

              if (accountProvider.isLoading)
                const Center(child: Padding(padding: EdgeInsets.all(64.0), child: CircularProgressIndicator()))
              else
                LayoutBuilder(
                  builder: (context, constraints) {
                    int crossAxisCount = constraints.maxWidth > 1400 ? 7 : (constraints.maxWidth > 1000 ? 5 : (constraints.maxWidth > 600 ? 3 : 2));
                    final sortedPlatforms = accountProvider.getSortedPlatforms();
                    
                    return GridView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: crossAxisCount,
                        crossAxisSpacing: 16,
                        mainAxisSpacing: 16,
                        childAspectRatio: 1.15,
                      ),
                      itemCount: sortedPlatforms.length,
                      itemBuilder: (context, index) {
                        final platform = sortedPlatforms[index];
                        final id = platform['id'] as String;
                        return SNSPlatformTile(
                          platformId: id,
                          platformName: platform['name'],
                          icon: platform['icon'],
                          isSelected: uploadProvider.selectedPlatforms.contains(id),
                          isConnected: accountProvider.getConnectedAccount(id) != null,
                          onTap: () => uploadProvider.togglePlatform(id),
                        );
                      },
                    );
                  },
                ),
              
              const SizedBox(height: 64),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildGlobalActions(BuildContext context, UploadProvider uploadProvider, AccountProvider accountProvider) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Row(
          children: [
            SortChip(label: '인기순', value: 'usage', groupValue: accountProvider.sortMode, onSelected: accountProvider.setSortMode),
            const SizedBox(width: 8),
            SortChip(label: '이름순', value: 'name', groupValue: accountProvider.sortMode, onSelected: accountProvider.setSortMode),
            const SizedBox(width: 8),
            SortChip(label: '상태순', value: 'status', groupValue: accountProvider.sortMode, onSelected: accountProvider.setSortMode),
          ],
        ),
        const SizedBox(height: 12),
        TextButton.icon(
          onPressed: uploadProvider.toggleAll,
          icon: Icon(uploadProvider.isAllSelected ? Icons.check_box_rounded : Icons.check_box_outline_blank_rounded, size: 18),
          label: Text(uploadProvider.isAllSelected ? '전체 해제' : '플랫폼 전체 선택', style: const TextStyle(fontWeight: FontWeight.w500)),
        ),
      ],
    );
  }

  Widget _buildSectionTitle(BuildContext context, String title) {
    return Row(
      children: [
        Container(width: 4, height: 24, decoration: BoxDecoration(color: Theme.of(context).colorScheme.primary, borderRadius: BorderRadius.circular(2))),
        const SizedBox(width: 12),
        Text(title, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w500, color: Colors.white)),
      ],
    );
  }

  Widget _buildSubmitButton(BuildContext context, UploadProvider provider) {
    final colorScheme = Theme.of(context).colorScheme;
    return SizedBox(
      height: 52,
      child: ElevatedButton.icon(
        onPressed: provider.isUploading ? null : () async {
          if (!_formKey.currentState!.validate()) return;
          try {
            await provider.startUpload();
            if (context.mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('업로드 작업이 성공적으로 예약되었습니다!'), backgroundColor: Colors.green, behavior: SnackBarBehavior.floating),
              );
            }
          } catch (e) {
            if (context.mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('업로드 실패: $e'), backgroundColor: Colors.red, behavior: SnackBarBehavior.floating),
              );
            }
          }
        },
        icon: provider.isUploading 
            ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
            : const Icon(Icons.rocket_launch_rounded, size: 22),
        label: Text(provider.isUploading ? '업로드 진행 중...' : '업로드 (로켓 발사)', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        style: ElevatedButton.styleFrom(
          backgroundColor: colorScheme.primary,
          foregroundColor: colorScheme.onPrimary,
          padding: const EdgeInsets.symmetric(horizontal: 32),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          elevation: 8,
          shadowColor: colorScheme.primary.withOpacity(0.6),
        ),
      ),
    );
  }
}
