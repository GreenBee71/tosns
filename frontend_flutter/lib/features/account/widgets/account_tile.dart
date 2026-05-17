import 'package:flutter/material.dart';
import 'package:sns_uploader/features/account/widgets/connect_dialog.dart';

class AccountTile extends StatelessWidget {
  final String platformId;
  final String platformName;
  final Widget icon;
  final bool isConnected;
  final String? accountName;

  const AccountTile({
    super.key,
    required this.platformId,
    required this.platformName,
    required this.icon,
    required this.isConnected,
    this.accountName,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: isConnected ? 4 : 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      clipBehavior: Clip.antiAlias,
      color: isConnected 
          ? Theme.of(context).colorScheme.surface 
          : Theme.of(context).colorScheme.surface.withOpacity(0.5),
      child: InkWell(
        onTap: () {
          showDialog(
            context: context,
            builder: (context) => ConnectDialog(
              platformId: platformId,
              platformName: platformName,
              platformIcon: icon,
            ),
          );
        },
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: isConnected 
                      ? Theme.of(context).colorScheme.primary.withValues(alpha: 0.1) 
                      : Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.05),
                  shape: BoxShape.circle,
                ),
                child: icon,
              ),
              const SizedBox(height: 12),
              Text(platformName, style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 6),
              Text(
                isConnected ? '연동됨: $accountName' : '연동되지 않음', 
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: isConnected ? Colors.green : Colors.redAccent.withOpacity(0.7),
                  fontWeight: FontWeight.w500,
                ),
                textAlign: TextAlign.center,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
