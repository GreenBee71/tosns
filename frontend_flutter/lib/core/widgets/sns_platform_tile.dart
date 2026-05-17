import 'package:flutter/material.dart';
import 'premium_card.dart';

class SNSPlatformTile extends StatelessWidget {
  final String platformId;
  final String platformName;
  final Widget icon;
  final bool isSelected;
  final bool isConnected;
  final VoidCallback onTap;

  const SNSPlatformTile({
    super.key,
    required this.platformId,
    required this.platformName,
    required this.icon,
    required this.isSelected,
    required this.isConnected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return PremiumCard(
      isSelected: isSelected,
      onTap: onTap,
      padding: const EdgeInsets.symmetric(horizontal: 4.0, vertical: 12.0),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: isConnected 
                  ? colorScheme.primary.withValues(alpha: 0.1) 
                  : Colors.white.withValues(alpha: 0.05),
              shape: BoxShape.circle,
            ),
            child: icon,
          ),
          const SizedBox(height: 12),
          Text(
            platformName,
            style: textTheme.titleMedium?.copyWith(
              fontWeight: isSelected ? FontWeight.w500 : FontWeight.w400,
              color: isSelected ? colorScheme.primary : Colors.white70,
            ),
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 6),
          Text(
            isConnected ? '연동됨' : '미연동',
            style: textTheme.bodySmall?.copyWith(
              color: isConnected ? Colors.green : Colors.redAccent.withValues(alpha: 0.7),
              fontWeight: FontWeight.w400,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
