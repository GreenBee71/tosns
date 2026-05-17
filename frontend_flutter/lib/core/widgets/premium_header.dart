import 'package:flutter/material.dart';

class PremiumHeader extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Color? iconColor;

  const PremiumHeader({
    super.key,
    required this.icon,
    required this.title,
    required this.subtitle,
    this.iconColor,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(
              icon,
              size: 32,
              color: iconColor ?? colorScheme.primary,
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Text(
                title,
                style: textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.w500, // 최대 500 준수
                  letterSpacing: -0.5,
                  color: Colors.white,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Padding(
          padding: const EdgeInsets.only(left: 48.0), // 아이콘 너비 + 간격만큼 소폭 들여쓰기
          child: Text(
            subtitle,
            style: textTheme.bodySmall?.copyWith(
              color: Colors.white60,
              fontWeight: FontWeight.w300,
            ),
          ),
        ),
      ],
    );
  }
}
