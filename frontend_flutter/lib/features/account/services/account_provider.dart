import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'dart:convert';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:sns_uploader/core/network/api_client.dart';

class AccountProvider with ChangeNotifier {
  bool _isLoading = true;
  bool get isLoading => _isLoading;

  List<dynamic> _accounts = [];
  List<dynamic> get accounts => _accounts;

  String _sortMode = 'usage'; // usage, name, status
  String get sortMode => _sortMode;

  final List<Map<String, dynamic>> platforms = [
    {'id': 'facebook', 'name': 'Facebook', 'icon': const FaIcon(FontAwesomeIcons.facebook, size: 32)},
    {'id': 'youtube', 'name': 'YouTube', 'icon': const FaIcon(FontAwesomeIcons.youtube, size: 32)},
    {'id': 'youtube_shorts', 'name': 'YouTube Shorts', 'icon': const FaIcon(FontAwesomeIcons.youtube, size: 32, color: Colors.redAccent)},
    {'id': 'instagram', 'name': 'Instagram', 'icon': const FaIcon(FontAwesomeIcons.instagram, size: 32)},
    {'id': 'tiktok', 'name': 'TikTok', 'icon': const FaIcon(FontAwesomeIcons.tiktok, size: 32)},
    {'id': 'telegram', 'name': 'Telegram', 'icon': const FaIcon(FontAwesomeIcons.telegram, size: 32)},
    {'id': 'x', 'name': 'X (Twitter)', 'icon': const FaIcon(FontAwesomeIcons.xTwitter, size: 32)},
    {'id': 'threads', 'name': 'Threads', 'icon': const FaIcon(FontAwesomeIcons.threads, size: 32)},
    {'id': 'linkedin', 'name': 'LinkedIn', 'icon': const FaIcon(FontAwesomeIcons.linkedin, size: 32)},
    {'id': 'pinterest', 'name': 'Pinterest', 'icon': const FaIcon(FontAwesomeIcons.pinterest, size: 32)},
    {'id': 'snapchat', 'name': 'Snapchat', 'icon': const FaIcon(FontAwesomeIcons.snapchat, size: 32)},
    {'id': 'discord', 'name': 'Discord', 'icon': const FaIcon(FontAwesomeIcons.discord, size: 32)},
    {'id': 'slack', 'name': 'Slack', 'icon': const FaIcon(FontAwesomeIcons.slack, size: 32)},
    {'id': 'line', 'name': 'LINE', 'icon': const FaIcon(FontAwesomeIcons.line, size: 32)},
    {'id': 'afreecatv', 'name': 'AfreecaTV', 'icon': const Icon(Icons.live_tv_rounded, size: 32, color: Color(0xFF0055FF))},
    {'id': 'reddit', 'name': 'Reddit', 'icon': const FaIcon(FontAwesomeIcons.redditAlien, size: 32)},
    {'id': 'vimeo', 'name': 'Vimeo', 'icon': const FaIcon(FontAwesomeIcons.vimeo, size: 32)},
    {'id': 'behance', 'name': 'Behance', 'icon': const FaIcon(FontAwesomeIcons.behance, size: 32)},
    {'id': 'dribbble', 'name': 'Dribbble', 'icon': const FaIcon(FontAwesomeIcons.dribbble, size: 32)},
    {'id': 'medium', 'name': 'Medium', 'icon': const FaIcon(FontAwesomeIcons.medium, size: 32)},
    {'id': 'wordpress', 'name': 'WordPress', 'icon': const FaIcon(FontAwesomeIcons.wordpress, size: 32)},
    {'id': 'naver_blog', 'name': 'Naver Blog', 'icon': const Icon(Icons.article, size: 32, color: Colors.green)},
    {'id': 'naver_cafe', 'name': 'Naver Cafe', 'icon': const Icon(Icons.coffee, size: 32, color: Colors.green)},
  ];

  AccountProvider() {
    fetchAccounts();
  }

  void setSortMode(String mode) {
    _sortMode = mode;
    notifyListeners();
  }

  Future<void> fetchAccounts() async {
    _isLoading = true;
    notifyListeners();

    try {
      final dio = ApiClient().dio;
      final response = await dio.get('/api/v1/accounts/');
      _accounts = response.data;
    } catch (e) {
      debugPrint('Failed to load accounts: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> deleteAccount(int accountId) async {
    try {
      final dio = ApiClient().dio;
      await dio.delete('/api/v1/accounts/$accountId');
      await fetchAccounts();
    } catch (e) {
      debugPrint('Failed to delete account: $e');
      rethrow;
    }
  }

  Future<void> saveAccount({
    required String platformId,
    required String accountName,
    required Map<String, String> tokenData,
    Map<String, dynamic>? existingAccount,
  }) async {
    try {
      final dio = ApiClient().dio;
      if (existingAccount != null) {
        await dio.put(
          '/api/v1/accounts/${existingAccount['id']}',
          data: {
            'platform': platformId,
            'account_name': accountName,
            'token': jsonEncode(tokenData)
          },
        );
      } else {
        await dio.post(
          '/api/v1/accounts/',
          data: {
            'platform': platformId,
            'account_name': accountName,
            'token': jsonEncode(tokenData)
          },
        );
      }
      await fetchAccounts();
    } catch (e) {
      debugPrint('Failed to save account: $e');
      rethrow;
    }
  }

  Map<String, dynamic>? getConnectedAccount(String platformId) {
    try {
      return _accounts.firstWhere((acc) {
        final platform = acc['platform'].toString().toLowerCase();
        final target = platformId.toLowerCase();
        
        if (platform == 'insta' && target == 'instagram') return true;
        if (platform == 'twitter' && target == 'x') return true;
        if (platform == 'youtube' && target == 'youtube_shorts') return true;
        
        return platform == target;
      });
    } catch (e) {
      return null;
    }
  }

  List<Map<String, dynamic>> getSortedPlatforms() {
    final List<Map<String, dynamic>> sorted = List.from(platforms);
    
    if (_sortMode == 'name') {
      sorted.sort((a, b) => (a['name'] as String).compareTo(b['name'] as String));
    } else if (_sortMode == 'status') {
      sorted.sort((a, b) {
        final aConn = getConnectedAccount(a['id']) != null ? 0 : 1;
        final bConn = getConnectedAccount(b['id']) != null ? 0 : 1;
        if (aConn != bConn) return aConn.compareTo(bConn);
        return (a['name'] as String).compareTo(b['name'] as String);
      });
    } else {
      final Map<String, int> usageWeight = {
        'facebook': 100,
        'youtube': 95,
        'youtube_shorts': 94,
        'instagram': 90,
        'tiktok': 85,
        'afreecatv': 82,
        'telegram': 80,
        'x': 75,
        'threads': 70,
        'linkedin': 60,
        'pinterest': 55,
      };
      
      sorted.sort((a, b) {
        final aWeight = usageWeight[a['id']] ?? 0;
        final bWeight = usageWeight[b['id']] ?? 0;
        final aBoost = getConnectedAccount(a['id']) != null ? 1000 : 0;
        final bBoost = getConnectedAccount(b['id']) != null ? 1000 : 0;
        return (bWeight + bBoost).compareTo(aWeight + aBoost);
      });
    }
    return sorted;
  }
}
