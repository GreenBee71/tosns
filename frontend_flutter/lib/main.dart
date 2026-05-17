import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

// Providers
import 'package:sns_uploader/features/account/services/account_provider.dart';
import 'package:sns_uploader/features/upload/services/upload_provider.dart';
import 'package:sns_uploader/features/monitor/services/job_provider.dart';
import 'package:sns_uploader/features/media_library/services/media_library_provider.dart';

// Screens
import 'package:sns_uploader/features/account/screens/account_screen.dart';
import 'package:sns_uploader/features/upload/screens/upload_screen.dart';
import 'package:sns_uploader/features/monitor/screens/job_list_screen.dart';
import 'package:sns_uploader/features/scheduler/screens/media_scheduler_screen.dart';
import 'package:sns_uploader/features/analytics/screens/insights_dashboard_screen.dart';
import 'package:sns_uploader/features/chat/screens/greenbee_chat_screen.dart';
import 'package:sns_uploader/features/media_library/screens/media_library_screen.dart';

// Global Widgets
import 'package:sns_uploader/core/widgets/premium_card.dart';

class GlobalScrollBehavior extends MaterialScrollBehavior {
  @override
  Set<PointerDeviceKind> get dragDevices => {
        PointerDeviceKind.touch,
        PointerDeviceKind.mouse,
        PointerDeviceKind.trackpad,
      };
}

void main() {
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AccountProvider()),
        ChangeNotifierProvider(create: (_) => UploadProvider()),
        ChangeNotifierProvider(create: (_) => JobProvider()),
        ChangeNotifierProvider(create: (_) => MediaLibraryProvider()),
      ],
      child: const SNSUploaderApp(),
    ),
  );
}

class SNSUploaderApp extends StatelessWidget {
  const SNSUploaderApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'GreenBee SNS Uploader',
      scrollBehavior: GlobalScrollBehavior(),
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        scaffoldBackgroundColor: const Color(0xFF0B192C),
        colorScheme: const ColorScheme(
          brightness: Brightness.dark,
          primary: Color(0xFF64FFDA),
          onPrimary: Color(0xFF0B192C),
          secondary: Color(0xFF1A365D),
          onSecondary: Colors.white,
          error: Colors.redAccent,
          onError: Colors.white,
          surface: Color(0xFF112240),
          onSurface: Colors.white,
          outline: Colors.white10,
        ),
        fontFamily: 'Paperlogy',
        textTheme: const TextTheme(
          displayLarge: TextStyle(fontSize: 48, fontWeight: FontWeight.w500),
          headlineLarge: TextStyle(fontSize: 40, fontWeight: FontWeight.w500),
          headlineMedium: TextStyle(fontSize: 32, fontWeight: FontWeight.w500),
          titleLarge: TextStyle(fontSize: 20, fontWeight: FontWeight.w500),
          titleMedium: TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
          bodyLarge: TextStyle(fontSize: 16, fontWeight: FontWeight.w400),
          bodyMedium: TextStyle(fontSize: 14, fontWeight: FontWeight.w400),
          bodySmall: TextStyle(fontSize: 12, fontWeight: FontWeight.w300),
          labelSmall: TextStyle(fontSize: 10, fontWeight: FontWeight.w400),
        ),
      ),
      home: const MainNavigation(),
    );
  }
}

class MainNavigation extends StatefulWidget {
  const MainNavigation({super.key});

  @override
  State<MainNavigation> createState() => _MainNavigationState();
}

class _MainNavigationState extends State<MainNavigation> {
  int _selectedIndex = 7; // 어카운트 허브를 기본으로 설정

  Widget _getScreen(int index) {
    switch (index) {
      case 0: return const MediaLibraryScreen(); 
      case 1: return const MediaSchedulerScreen();
      case 2: return const InsightsDashboardScreen();
      case 3: return const GreenbeeChatScreen();
      case 4: return UploadScreen();
      case 5: return const JobListScreen();
      case 6: return const AccountScreen();
      default: return const AccountScreen();
    }
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.fromLTRB(32, 24, 32, 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'GreenBee SNS Uploader',
                        style: textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.w500,
                          color: colorScheme.primary,
                          letterSpacing: 1.2,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                        decoration: BoxDecoration(
                          color: colorScheme.primary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          'v1.6 Premium',
                          style: textTheme.labelSmall?.copyWith(color: colorScheme.primary),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  LayoutBuilder(
                    builder: (context, constraints) {
                      int crossAxisCount = constraints.maxWidth > 1400 ? 4 : (constraints.maxWidth > 800 ? 2 : 1);
                      return GridView.count(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        crossAxisCount: crossAxisCount,
                        crossAxisSpacing: 16,
                        mainAxisSpacing: 16,
                        childAspectRatio: constraints.maxWidth > 1400 ? 3.5 : 4.5,
                        children: [
                          _buildNavTile(0, Icons.folder_special, '미디어 라이브러리', '프로젝트 및 자산 관리'),
                          _buildNavTile(1, Icons.calendar_month, '미디어 스케줄러', '콘텐츠 발행 계획'),
                          _buildNavTile(2, Icons.insights, 'AI 인사이트', '성과 및 트렌드 분석'),
                          _buildNavTile(3, Icons.chat_bubble_outline, '그린비 챗', 'AI와 대화하며 작업'),
                          _buildNavTile(4, Icons.rocket_launch, '업로드 런처', 'SNS 통합 업데이트'),
                          _buildNavTile(5, Icons.assignment, '작업 모니터', '진행 상황 실시간 추적'),
                          _buildNavTile(6, Icons.account_circle, '어카운트 허브', '플랫폼 연동 관리'),
                        ],
                      );
                    },
                  ),
                ],
              ),
            ),
            const Divider(height: 1, color: Colors.white10),
            Expanded(
              child: Container(
                color: const Color(0xFF0B192C),
                child: KeyedSubtree(
                  key: ValueKey(_selectedIndex),
                  child: _getScreen(_selectedIndex),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNavTile(int index, IconData icon, String title, String subtitle) {
    final isSelected = _selectedIndex == index;
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return PremiumCard(
      isSelected: isSelected,
      onTap: () => setState(() => _selectedIndex = index),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: isSelected ? colorScheme.primary : Colors.white.withValues(alpha: 0.05),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(
              icon,
              size: 20,
              color: isSelected ? colorScheme.onPrimary : Colors.white70,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  title,
                  style: textTheme.titleMedium?.copyWith(
                    fontWeight: isSelected ? FontWeight.w500 : FontWeight.w400,
                    color: isSelected ? colorScheme.primary : Colors.white,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: textTheme.labelSmall?.copyWith(
                    color: Colors.white38,
                    letterSpacing: 0,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
