import 'package:flutter/material.dart';
import 'package:sns_uploader/core/widgets/premium_card.dart';

class MediaCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final String? imageUrl;
  final VoidCallback onTap;
  final VoidCallback? onDelete;
  final bool isFolder;

  const MediaCard({
    super.key,
    required this.title,
    required this.subtitle,
    required this.icon,
    this.imageUrl,
    required this.onTap,
    this.onDelete,
    this.isFolder = false,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return PremiumCard(
      onTap: onTap,
      padding: EdgeInsets.zero,
      child: Stack(
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Image or Icon Area
              Expanded(
                flex: 3,
                child: Container(
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: colorScheme.secondary.withOpacity(0.3),
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                  ),
                  child: imageUrl != null
                      ? ClipRRect(
                          borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                          child: Image.network(
                            imageUrl!,
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) => Icon(icon, size: 48, color: colorScheme.primary.withOpacity(0.5)),
                          ),
                        )
                      : Center(
                          child: Icon(
                            icon,
                            size: 48,
                            color: isFolder ? Colors.amber.withOpacity(0.8) : colorScheme.primary.withOpacity(0.5),
                          ),
                        ),
                ),
              ),
              // Info Area
              Expanded(
                flex: 2,
                child: Padding(
                  padding: const EdgeInsets.all(12.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        subtitle,
                        style: textTheme.labelSmall?.copyWith(color: Colors.white38),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          if (onDelete != null)
            Positioned(
              top: 8,
              right: 8,
              child: IconButton(
                icon: const Icon(Icons.delete_outline, color: Colors.white54, size: 20),
                onPressed: () {
                  showDialog(
                    context: context,
                    builder: (context) => AlertDialog(
                      backgroundColor: colorScheme.surface,
                      title: const Text('삭제 확인'),
                      content: const Text('정말로 삭제하시겠습니까? 관련 데이터가 모두 삭제됩니다.'),
                      actions: [
                        TextButton(onPressed: () => Navigator.pop(context), child: const Text('취소')),
                        TextButton(
                          onPressed: () {
                            Navigator.pop(context);
                            onDelete!();
                          },
                          child: const Text('삭제', style: TextStyle(color: Colors.redAccent)),
                        ),
                      ],
                    ),
                  );
                },
                style: IconButton.styleFrom(
                  backgroundColor: Colors.black26,
                  padding: EdgeInsets.zero,
                  minimumSize: const Size(32, 32),
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
              ),
            ),
        ],
      ),
    );
  }
}
