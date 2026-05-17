import 'package:flutter/material.dart';

class JobCard extends StatelessWidget {
  final String title;
  final String platform;
  final String progress;
  final IconData icon;
  final Color accentColor;

  const JobCard({
    super.key,
    required this.title,
    required this.platform,
    required this.progress,
    required this.icon,
    required this.accentColor,
  });

  @override
  Widget build(BuildContext context) {
    double progressValue = double.tryParse(progress.replaceAll('%', '')) ?? 0.0;
    progressValue /= 100.0;

    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.03),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white10),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: accentColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Icon(icon, color: accentColor, size: 24),
              ),
              const SizedBox(width: 24),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
                    const SizedBox(height: 4),
                    Text(platform, style: const TextStyle(fontSize: 12, color: Colors.white38)),
                  ],
                ),
              ),
              Text(progress, style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: accentColor)),
            ],
          ),
          const SizedBox(height: 24),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: progressValue,
              minHeight: 8,
              backgroundColor: Colors.white.withOpacity(0.05),
              valueColor: AlwaysStoppedAnimation<Color>(accentColor),
            ),
          ),
        ],
      ),
    );
  }
}
