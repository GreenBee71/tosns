import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:sns_uploader/features/monitor/services/job_provider.dart';
import 'package:sns_uploader/features/monitor/widgets/job_card.dart';

class JobListScreen extends StatelessWidget {
  const JobListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final provider = context.watch<JobProvider>();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(32.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Icon(Icons.list_alt_rounded, color: colorScheme.primary, size: 32),
                  const SizedBox(width: 16),
                  Text('Job Monitor', style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.bold, color: Colors.white)),
                ],
              ),
              IconButton(
                icon: const Icon(Icons.refresh),
                onPressed: provider.refreshJobs,
                tooltip: '새로고침',
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text('활성 작업의 진행 상태를 실시간으로 모니터링하세요.', style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.white60)),
          const SizedBox(height: 48),
          
          if (provider.jobs.isEmpty)
            const Center(child: Text('진행 중인 작업이 없습니다.', style: TextStyle(color: Colors.white38)))
          else
            ...provider.jobs.map((job) => JobCard(
              title: job.title,
              platform: job.platform,
              progress: job.progress,
              icon: job.icon,
              accentColor: job.accentColor,
            )).toList(),
        ],
      ),
    );
  }
}
