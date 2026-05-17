import 'package:flutter/material.dart';

class Job {
  final String id;
  final String title;
  final String platform;
  final String progress;
  final IconData icon;
  final Color accentColor;

  Job({
    required this.id,
    required this.title,
    required this.platform,
    required this.progress,
    required this.icon,
    required this.accentColor,
  });
}

class JobProvider with ChangeNotifier {
  final List<Job> _jobs = [
    Job(
      id: '1',
      title: '릴스 자동 업로드',
      platform: '인스타그램',
      progress: '85%',
      icon: Icons.cloud_upload_outlined,
      accentColor: const Color(0xFF64FFDA),
    ),
    Job(
      id: '2',
      title: 'AI 썸네일 생성',
      platform: '유튜브 쇼츠',
      progress: '30%',
      icon: Icons.image_search_rounded,
      accentColor: Colors.blueAccent,
    ),
    Job(
      id: '3',
      title: '해시태그 최적화 분석',
      platform: '틱톡',
      progress: '100%',
      icon: Icons.analytics_outlined,
      accentColor: Colors.greenAccent,
    ),
  ];

  List<Job> get jobs => _jobs;

  void refreshJobs() {
    // In the future, this will call the API
    notifyListeners();
  }
}
