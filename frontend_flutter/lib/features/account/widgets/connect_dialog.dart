import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import 'dart:convert';
import 'package:sns_uploader/features/account/services/account_provider.dart';

class ConnectDialog extends StatefulWidget {
  final String platformId;
  final String platformName;
  final Widget platformIcon;

  const ConnectDialog({
    super.key,
    required this.platformId,
    required this.platformName,
    required this.platformIcon,
  });

  @override
  State<ConnectDialog> createState() => _ConnectDialogState();
}

class _ConnectDialogState extends State<ConnectDialog> {
  late TextEditingController _nameController;
  late List<Map<String, dynamic>> _fields;
  bool _isSaving = false;
  Map<String, dynamic>? _connectedAcc;

  @override
  void initState() {
    super.initState();
    final provider = context.read<AccountProvider>();
    _connectedAcc = provider.getConnectedAccount(widget.platformId);
    
    _nameController = TextEditingController(text: _connectedAcc?['account_name'] ?? '');
    
    Map<String, dynamic>? existingTokens;
    if (_connectedAcc != null && _connectedAcc?['token'] != null) {
      try {
        existingTokens = jsonDecode(_connectedAcc?['token']);
      } catch (e) {
        debugPrint('Error decoding tokens: $e');
      }
    }

    _fields = _getFieldsForPlatform(widget.platformId, existingTokens);
  }

  List<Map<String, dynamic>> _getFieldsForPlatform(String platformId, Map<String, dynamic>? existingTokens) {
    if (platformId == 'youtube') {
      return [
        {'key': 'client_id', 'label': 'Client ID', 'controller': TextEditingController(text: existingTokens?['client_id'] ?? ''), 'obscure': false},
        {'key': 'client_secret', 'label': 'Client Secret', 'controller': TextEditingController(text: existingTokens?['client_secret'] ?? ''), 'obscure': true},
        {'key': 'refresh_token', 'label': 'Refresh Token', 'controller': TextEditingController(text: existingTokens?['refresh_token'] ?? ''), 'obscure': true},
      ];
    } else if (platformId == 'x') {
      return [
        {'key': 'api_key', 'label': 'API Key', 'controller': TextEditingController(text: existingTokens?['api_key'] ?? ''), 'obscure': false},
        {'key': 'api_secret', 'label': 'API Secret', 'controller': TextEditingController(text: existingTokens?['api_secret'] ?? ''), 'obscure': true},
        {'key': 'access_token', 'label': 'Access Token', 'controller': TextEditingController(text: existingTokens?['access_token'] ?? ''), 'obscure': false},
        {'key': 'access_token_secret', 'label': 'Access Token Secret', 'controller': TextEditingController(text: existingTokens?['access_token_secret'] ?? ''), 'obscure': true},
      ];
    } else if (platformId == 'instagram' || platformId == 'facebook') {
      return [
        {'key': 'access_token', 'label': 'Long-Lived Access Token', 'controller': TextEditingController(text: existingTokens?['access_token'] ?? ''), 'obscure': true},
      ];
    } else if (platformId == 'tiktok') {
      return [
        {'key': 'access_token', 'label': 'Access Token', 'controller': TextEditingController(text: existingTokens?['access_token'] ?? ''), 'obscure': true},
        {'key': 'refresh_token', 'label': 'Refresh Token', 'controller': TextEditingController(text: existingTokens?['refresh_token'] ?? ''), 'obscure': true},
        {'key': 'open_id', 'label': 'Open ID', 'controller': TextEditingController(text: existingTokens?['open_id'] ?? ''), 'obscure': false},
      ];
    } else if (platformId == 'telegram') {
      return [
        {'key': 'bot_token', 'label': 'Bot Token (from @BotFather)', 'controller': TextEditingController(text: existingTokens?['bot_token'] ?? ''), 'obscure': true},
        {'key': 'chat_id', 'label': 'Chat ID (e.g. -100...)', 'controller': TextEditingController(text: existingTokens?['chat_id'] ?? ''), 'obscure': false},
      ];
    } else if (platformId == 'discord') {
      return [
        {'key': 'webhook_url', 'label': 'Webhook URL', 'controller': TextEditingController(text: existingTokens?['webhook_url'] ?? ''), 'obscure': true},
      ];
    } else if (platformId == 'slack') {
      return [
        {'key': 'bot_token', 'label': 'Bot Token (xoxb-...)', 'controller': TextEditingController(text: existingTokens?['bot_token'] ?? ''), 'obscure': true},
        {'key': 'channel_id', 'label': 'Channel ID (e.g. C12345)', 'controller': TextEditingController(text: existingTokens?['channel_id'] ?? ''), 'obscure': false},
      ];
    } else if (platformId == 'pinterest') {
      return [
        {'key': 'access_token', 'label': 'Access Token', 'controller': TextEditingController(text: existingTokens?['access_token'] ?? ''), 'obscure': true},
        {'key': 'board_id', 'label': 'Board ID', 'controller': TextEditingController(text: existingTokens?['board_id'] ?? ''), 'obscure': false},
      ];
    } else if (platformId == 'linkedin') {
      return [
        {'key': 'access_token', 'label': 'Access Token', 'controller': TextEditingController(text: existingTokens?['access_token'] ?? ''), 'obscure': true},
        {'key': 'author_urn', 'label': 'Author URN (urn:li:person/organization:...)', 'controller': TextEditingController(text: existingTokens?['author_urn'] ?? ''), 'obscure': false},
      ];
    } else {
      return [
        {'key': 'access_token', 'label': 'Access Token / API Key', 'controller': TextEditingController(text: existingTokens?['access_token'] ?? ''), 'obscure': true},
      ];
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    for (var field in _fields) {
      (field['controller'] as TextEditingController).dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AccountProvider>();

    return AlertDialog(
      backgroundColor: const Color(0xFF0D1117),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24), side: BorderSide(color: Colors.white.withValues(alpha: 0.1))),
      insetPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
      title: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.05),
              shape: BoxShape.circle,
            ),
            child: widget.platformIcon,
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Text(
              '${_connectedAcc != null ? '계정 정보 수정' : '계정 연동'} - ${widget.platformName}', 
              style: Theme.of(context).textTheme.titleLarge?.copyWith(color: Colors.white)
            ),
          ),
          if (_connectedAcc != null)
            IconButton(
              icon: const Icon(Icons.delete_outline, color: Colors.redAccent),
              onPressed: () async {
                final messenger = ScaffoldMessenger.of(context);
                await provider.deleteAccount(_connectedAcc!['id']);
                if (mounted) Navigator.pop(context);
              },
              tooltip: '계정 연동 해제',
            ),
        ],
      ),
      content: SizedBox(
        width: 800,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (widget.platformId == 'youtube' || widget.platformId == 'youtube_shorts' || widget.platformId == 'tiktok' || widget.platformId == 'instagram' || widget.platformId == 'facebook' || widget.platformId == 'x' || widget.platformId == 'twitter') ...[
                const SizedBox(height: 8),
                _buildOAuthShortcut(),
                const SizedBox(height: 32),
                _buildDivider(),
                const SizedBox(height: 24),
              ],
              
              const SizedBox(height: 8),
              _buildNameField(),
              const SizedBox(height: 24),
              _buildDynamicFields(),
              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
      actionsPadding: const EdgeInsets.only(right: 24, bottom: 24),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          style: TextButton.styleFrom(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          ),
          child: Text('취소', style: Theme.of(context).textTheme.titleMedium?.copyWith(color: Colors.white70)),
        ),
        const SizedBox(width: 8),
        _buildSaveButton(provider),
      ],
    );
  }

  Widget _buildOAuthShortcut() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.03),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
      ),
      child: Column(
        children: [
          const Text('💡 추천: 간편 로그인으로 연동', style: TextStyle(color: Colors.white70, fontWeight: FontWeight.w500)),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () async {
                final targetPlatform = (widget.platformId == 'instagram' || widget.platformId == 'facebook') ? 'insta' : widget.platformId;
                final baseUrl = Uri.base;
                final loginUrl = Uri(
                  scheme: baseUrl.scheme,
                  host: baseUrl.host,
                  port: baseUrl.port == 80 || baseUrl.port == 443 ? null : baseUrl.port,
                  path: '/api/v1/oauth/$targetPlatform/login',
                  queryParameters: {'platform': widget.platformId == 'facebook' ? 'facebook' : 'instagram'},
                );
                
                if (await canLaunchUrl(loginUrl)) {
                  await launchUrl(loginUrl, mode: LaunchMode.platformDefault);
                } else {
                  await launchUrl(loginUrl, mode: LaunchMode.externalApplication);
                }
              },
              icon: Icon(_getOAuthIcon()),
              label: Text(_getOAuthLabel(), style: Theme.of(context).textTheme.titleMedium),
              style: ElevatedButton.styleFrom(
                backgroundColor: _getOAuthColor(),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 20),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),
        ],
      ),
    );
  }

  IconData _getOAuthIcon() {
    if (widget.platformId == 'youtube' || widget.platformId == 'youtube_shorts') return FontAwesomeIcons.google;
    if (widget.platformId == 'tiktok') return FontAwesomeIcons.tiktok;
    return FontAwesomeIcons.facebook;
  }

  String _getOAuthLabel() {
    if (widget.platformId == 'youtube' || widget.platformId == 'youtube_shorts') return 'Google 계정으로 로그인';
    if (widget.platformId == 'tiktok') return 'TikTok 계정으로 연결';
    return 'Meta(Facebook) 계정으로 연결';
  }

  Color _getOAuthColor() {
    if (widget.platformId == 'youtube' || widget.platformId == 'youtube_shorts') return const Color(0xFF4285F4);
    if (widget.platformId == 'tiktok') return Colors.black;
    return const Color(0xFF1877F2);
  }

  Widget _buildDivider() {
    return Row(
      children: [
        const Expanded(child: Divider(color: Colors.white10)),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Text('직접 입력 (고급)', style: Theme.of(context).textTheme.labelSmall?.copyWith(color: Colors.white24, letterSpacing: 1.2)),
        ),
        const Expanded(child: Divider(color: Colors.white10)),
      ],
    );
  }

  Widget _buildNameField() {
    return TextField(
      controller: _nameController,
      style: Theme.of(context).textTheme.titleMedium?.copyWith(color: Colors.white),
      decoration: InputDecoration(
        labelText: '계정 이름 (예: 나의 공식 채널)',
        labelStyle: const TextStyle(color: Colors.white70),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Colors.white24)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Theme.of(context).colorScheme.primary)),
        filled: true,
        fillColor: Colors.white.withValues(alpha: 0.05),
      ),
    );
  }

  Widget _buildDynamicFields() {
    return Wrap(
      spacing: 20,
      runSpacing: 20,
      children: _fields.map((field) {
        final bool isSingleField = _fields.length == 1;
        return SizedBox(
          width: isSingleField ? 776 : 378,
          child: TextField(
            controller: field['controller'] as TextEditingController,
            obscureText: field['obscure'] as bool,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Colors.white),
            decoration: InputDecoration(
              labelText: field['label'] as String,
              labelStyle: const TextStyle(color: Colors.white70),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Colors.white24)),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Theme.of(context).colorScheme.primary)),
              filled: true,
              fillColor: Colors.white.withOpacity(0.05),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildSaveButton(AccountProvider provider) {
    return ElevatedButton(
      onPressed: _isSaving ? null : () async {
        if (_nameController.text.isEmpty || _fields.any((f) => (f['controller'] as TextEditingController).text.isEmpty)) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('모든 필드를 입력해 주세요')));
          return;
        }
        
        setState(() => _isSaving = true);
        
        Map<String, String> tokenData = {};
        for (var field in _fields) {
          tokenData[field['key'] as String] = (field['controller'] as TextEditingController).text;
        }
        
        try {
          await provider.saveAccount(
            platformId: widget.platformId,
            accountName: _nameController.text,
            tokenData: tokenData,
            existingAccount: _connectedAcc,
          );
          if (mounted) Navigator.pop(context);
        } catch (e) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to save: $e'), backgroundColor: Colors.red));
          }
        } finally {
          if (mounted) setState(() => _isSaving = false);
        }
      },
      style: ElevatedButton.styleFrom(
        padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Theme.of(context).colorScheme.onPrimary,
        elevation: 0,
      ),
      child: _isSaving 
          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) 
          : Text(_connectedAcc != null ? '정보 수정' : '연동하기', style: Theme.of(context).textTheme.titleMedium),
    );
  }
}
