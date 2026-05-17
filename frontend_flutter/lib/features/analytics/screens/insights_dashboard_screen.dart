import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:sns_uploader/core/network/api_client.dart';

class InsightsDashboardScreen extends StatefulWidget {
  const InsightsDashboardScreen({super.key});

  @override
  State<InsightsDashboardScreen> createState() => _InsightsDashboardScreenState();
}

class _InsightsDashboardScreenState extends State<InsightsDashboardScreen> {
  Map<String, dynamic> _summary = {
    "total_views": 0,
    "total_likes": 0,
    "engagement_rate": "0%",
    "top_performing_emotion": "loading...",
    "fan_sentiment": "analyzing..."
  };
  bool _isLoading = true;
  final ScrollController _scrollController = ScrollController();
  final ScrollController _horizontalController = ScrollController();

  @override
  void initState() {
    super.initState();
    _fetchSummary();
  }

  Future<void> _fetchSummary() async {
    try {
      final dio = ApiClient().dio;
      final response = await dio.get('/api/v1/media/insights-summary');
      if (response.statusCode == 200) {
        setState(() {
          _summary = response.data;
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Insights fetch error: $e');
      setState(() => _isLoading = false);
    }
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _horizontalController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Scrollbar(
      controller: _scrollController,
      thumbVisibility: true,
      trackVisibility: true,
      thickness: 10,
      radius: const Radius.circular(5),
      child: SingleChildScrollView(
        controller: _scrollController,
        padding: const EdgeInsets.all(32.0),
        child: Scrollbar(
          controller: _horizontalController,
          thumbVisibility: true,
          trackVisibility: true,
          thickness: 10,
          radius: const Radius.circular(5),
          notificationPredicate: (notification) => notification.metrics.axis == Axis.horizontal,
          child: SingleChildScrollView(
            controller: _horizontalController,
            scrollDirection: Axis.horizontal,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildHeader(colorScheme),
                const SizedBox(height: 32),
                if (_isLoading)
                  const Center(child: CircularProgressIndicator())
                else
                  _buildContent(colorScheme),
                const SizedBox(height: 32),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(ColorScheme colorScheme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(Icons.insights, color: colorScheme.primary, size: 32),
            const SizedBox(width: 16),
            Text('AI Insights (성장 분석)', style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.bold)),
          ],
        ),
        Text('그린비가 팬들과 어떻게 소통하고 있는지 분석합니다.', style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.white60)),
      ],
    );
  }

  Widget _buildContent(ColorScheme colorScheme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: MediaQuery.of(context).size.width > 1200 ? 3 : 2,
          crossAxisSpacing: 24,
          mainAxisSpacing: 24,
          childAspectRatio: 1.5,
          children: [
            _buildStatCard('누적 조회수', _summary['total_views'].toString(), Icons.visibility, colorScheme.primary),
            _buildStatCard('누적 좋아요', _summary['total_likes'].toString(), Icons.favorite, Colors.pinkAccent),
            _buildStatCard('참여율', _summary['engagement_rate'], Icons.bolt, Colors.amber),
            _buildStatCard('최고 성과 감정', _summary['top_performing_emotion'].toUpperCase(), Icons.auto_awesome, Colors.purpleAccent),
            _buildStatCard('팬 심도 분석', _summary['fan_sentiment'], Icons.psychology, Colors.blueAccent),
            _buildStatCard('성장 예측', 'High Potential', Icons.trending_up, Colors.greenAccent),
          ],
        ),
        const SizedBox(height: 32),
        _buildAIReportCard(colorScheme),
      ],
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.03),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Row(
            children: [
              Icon(icon, color: color, size: 20),
              const SizedBox(width: 8),
              Text(title, style: Theme.of(context).textTheme.labelSmall?.copyWith(color: Colors.white54)),
            ],
          ),
          const SizedBox(height: 12),
          Text(value, style: Theme.of(context).textTheme.headlineMedium?.copyWith(letterSpacing: -1)),
        ],
      ),
    );
  }

  Widget _buildAIReportCard(ColorScheme colorScheme) {
    return Container(
      width: 760, // Fixed width for report stability
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [colorScheme.primary.withValues(alpha: 0.1), Colors.transparent],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: colorScheme.primary.withValues(alpha: 0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.auto_awesome, color: colorScheme.primary),
              const SizedBox(width: 12),
              Text('AI 어드바이저 그린비의 실시간 분석', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            '최근 "신남(Excited)" 감정 상태로 올린 파리 여행 콘텐츠가 다른 콘텐츠 대비 45% 높은 유입률을 보이고 있습니다. '
            '다음 주말에는 이 분위기를 이어가기 위해 에펠탑 야경 영상에 활기찬 보이스를 더해 업로드하는 것을 추천드려요! 🐝✨',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Colors.white70, height: 1.6),
          ),
        ],
      ),
    );
  }
}
