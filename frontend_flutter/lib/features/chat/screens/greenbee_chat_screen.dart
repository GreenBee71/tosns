import 'package:flutter/material.dart';
import 'package:sns_uploader/core/network/api_client.dart';

class GreenbeeChatScreen extends StatefulWidget {
  const GreenbeeChatScreen({super.key});

  @override
  State<GreenbeeChatScreen> createState() => _GreenbeeChatScreenState();
}

class _GreenbeeChatScreenState extends State<GreenbeeChatScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final List<Map<String, String>> _messages = [
    {'role': 'assistant', 'content': '안녕하세요! 저는 그린비예요. 오늘은 어떤 모험을 떠나볼까요? 🐝✨'}
  ];
  bool _isTyping = false;

  Future<void> _sendMessage() async {
    final text = _messageController.text.trim();
    if (text.isEmpty) return;

    setState(() {
      _messages.add({'role': 'user', 'content': text});
      _isTyping = true;
      _messageController.clear();
    });
    _scrollToBottom();

    try {
      final dio = ApiClient().dio;
      final response = await dio.post(
        '/api/v1/media/chat',
        data: {
          'message': text,
          'history': _messages.sublist(0, _messages.length - 1),
        },
      );

      if (response.statusCode == 200) {
        final data = response.data;
        setState(() {
          _messages.add({'role': 'assistant', 'content': data['answer']});
          _isTyping = false;
        });
      } else {
        throw Exception('채팅 응답 오류');
      }
    } catch (e) {
      debugPrint('Chat error: $e');
      setState(() {
        _messages.add({'role': 'assistant', 'content': '미안해요, 잠시 통신에 문제가 생겼나 봐요! 🌿'});
        _isTyping = false;
      });
    }
    _scrollToBottom();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Padding(
      padding: const EdgeInsets.all(32.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildHeader(colorScheme),
          const SizedBox(height: 32),
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                color: colorScheme.surface.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: Colors.white10),
              ),
              child: Column(
                children: [
                  Expanded(child: _buildMessageList()),
                  if (_isTyping) _buildTypingIndicator(colorScheme),
                  _buildInputArea(colorScheme),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader(ColorScheme colorScheme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(Icons.chat_bubble_outline_rounded, color: colorScheme.primary, size: 32),
            const SizedBox(width: 16),
            Text('GreenBee Chat (그린비 대화)', style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.bold)),
          ],
        ),
        const SizedBox(height: 8),
        Text('그린비 인플루언서와 실시간으로 대화하며 콘텐츠를 기획하세요.', style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.white60)),
      ],
    );
  }

  Widget _buildMessageList() {
    return Scrollbar(
      controller: _scrollController,
      thumbVisibility: true,
      trackVisibility: true,
      child: ListView.builder(
        controller: _scrollController,
        padding: const EdgeInsets.all(24),
        itemCount: _messages.length,
        itemBuilder: (context, index) {
          final msg = _messages[index];
          final isMe = msg['role'] == 'user';
          return Align(
            alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
            child: Container(
              margin: const EdgeInsets.only(bottom: 16),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.4),
              decoration: BoxDecoration(
                color: isMe ? Theme.of(context).colorScheme.primary : Colors.white10,
                borderRadius: BorderRadius.circular(16).copyWith(
                  bottomRight: isMe ? const Radius.circular(0) : const Radius.circular(16),
                  bottomLeft: isMe ? const Radius.circular(16) : const Radius.circular(0),
                ),
              ),
              child: Text(
                msg['content']!,
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: isMe ? Colors.black : Colors.white,
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildTypingIndicator(ColorScheme colorScheme) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
      child: Row(
        children: [
          Text('그린비가 생각 중...', style: Theme.of(context).textTheme.labelSmall?.copyWith(color: colorScheme.primary.withValues(alpha: 0.5))),
          const SizedBox(width: 8),
          const SizedBox(width: 12, height: 12, child: CircularProgressIndicator(strokeWidth: 2)),
        ],
      ),
    );
  }

  Widget _buildInputArea(ColorScheme colorScheme) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: const BoxDecoration(
        border: Border(top: BorderSide(color: Colors.white10)),
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: _messageController,
              onSubmitted: (_) => _sendMessage(),
              decoration: InputDecoration(
                hintText: '그린비에게 무엇이든 물어보세요...',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                filled: true,
                fillColor: Colors.white.withValues(alpha: 0.05),
              ),
            ),
          ),
          const SizedBox(width: 16),
          IconButton.filled(
            onPressed: _sendMessage,
            icon: const Icon(Icons.send),
            style: IconButton.styleFrom(backgroundColor: colorScheme.primary),
          ),
        ],
      ),
    );
  }
}
