import 'package:flutter/material.dart';

class MediaSchedulerScreen extends StatelessWidget {
  const MediaSchedulerScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(32.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.calendar_month, color: colorScheme.primary, size: 32),
                      const SizedBox(width: 16),
                      Text('Media Scheduler', style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.bold, color: Colors.white)),
                    ],
                  ),
                  Text('그린비의 활동 시간을 계획하세요.', style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.white60)),
                ],
              ),
              ElevatedButton.icon(
                onPressed: () {},
                icon: const Icon(Icons.add),
                label: const Text('새 예약 추가'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: colorScheme.primary,
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                ),
              ),
            ],
          ),
          const SizedBox(height: 32),
          
          Column(
            children: [
              _buildScheduleTile(context, '오늘 18:00', 'TIKTOK', '틱톡 트렌드 챌린지 - 1편', '대기 중'),
              _buildScheduleTile(context, '내일 10:00', 'INSTAGRAM', '인스타그램 릴스 - 봄 시즈널', '대기 중'),
              _buildScheduleTile(context, '26일 12:00', 'YOUTUBE', '유튜브 쇼츠 - 제품 리뷰', '게시 완료'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildScheduleTile(BuildContext context, String time, String platform, String title, String status) {
    final colorScheme = Theme.of(context).colorScheme;
    bool isPublished = status == '게시 완료';

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.03),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white10),
      ),
      child: Row(
        children: [
          Container(
            width: 80,
            padding: const EdgeInsets.symmetric(vertical: 12),
            decoration: BoxDecoration(
              color: colorScheme.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              children: [
                Text(time.split(' ')[0], style: const TextStyle(fontSize: 12, color: Colors.white54)),
                Text(time.split(' ')[1], style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: colorScheme.primary)),
              ],
            ),
          ),
          const SizedBox(width: 24),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(color: Colors.white10, borderRadius: BorderRadius.circular(12)),
                      child: Text(platform, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white60)),
                    ),
                    const SizedBox(width: 12),
                    Text(title, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 16)),
                  ],
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: (isPublished ? Colors.green : Colors.orange).withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(status, style: TextStyle(color: isPublished ? Colors.green : Colors.orange, fontSize: 12, fontWeight: FontWeight.bold)),
          ),
          const SizedBox(width: 16),
          IconButton(icon: const Icon(Icons.more_vert, color: Colors.white24), onPressed: () {}),
        ],
      ),
    );
  }
}
