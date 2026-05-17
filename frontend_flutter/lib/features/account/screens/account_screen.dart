import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:sns_uploader/core/widgets/premium_header.dart';
import 'package:sns_uploader/core/widgets/sort_chip.dart';
import 'package:sns_uploader/features/account/services/account_provider.dart';
import 'package:sns_uploader/features/account/widgets/account_tile.dart';

class AccountScreen extends StatelessWidget {
  const AccountScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AccountProvider>();
    final scrollController = ScrollController();

    return Scrollbar(
      controller: scrollController,
      thumbVisibility: true,
      trackVisibility: true,
      thickness: 10,
      radius: const Radius.circular(5),
      child: SingleChildScrollView(
        controller: scrollController,
        padding: const EdgeInsets.all(32.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Expanded(
                  child: PremiumHeader(
                    icon: Icons.manage_accounts_rounded,
                    title: '어카운트 허브 (Account Hub)',
                    subtitle: '플랫폼별 소셜 계정 연결 상태를 관리하고 새로운 계정을 연동합니다.',
                  ),
                ),
                const SizedBox(width: 32),
                Row(
                  children: [
                    SortChip(
                      label: '인기순', 
                      value: 'usage', 
                      groupValue: provider.sortMode, 
                      onSelected: provider.setSortMode
                    ),
                    const SizedBox(width: 8),
                    SortChip(
                      label: '이름순', 
                      value: 'name', 
                      groupValue: provider.sortMode, 
                      onSelected: provider.setSortMode
                    ),
                    const SizedBox(width: 8),
                    SortChip(
                      label: '상태순', 
                      value: 'status', 
                      groupValue: provider.sortMode, 
                      onSelected: provider.setSortMode
                    ),
                    const SizedBox(width: 16),
                    IconButton(
                      icon: const Icon(Icons.refresh),
                      onPressed: provider.fetchAccounts,
                      tooltip: '계정 정보 새로고침',
                      style: IconButton.styleFrom(
                        backgroundColor: Colors.white.withOpacity(0.05),
                        padding: const EdgeInsets.all(8),
                      ),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text('연동된 소셜 미디어 계정을 관리하고 상태를 점검하세요.', style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.white60)),
            const SizedBox(height: 16),
            if (provider.isLoading)
              const Center(child: Padding(padding: EdgeInsets.all(64.0), child: CircularProgressIndicator()))
            else
              LayoutBuilder(
                builder: (context, constraints) {
                  int crossAxisCount = constraints.maxWidth > 1400 ? 7 : (constraints.maxWidth > 1000 ? 5 : (constraints.maxWidth > 600 ? 3 : 2));
                  final sortedPlatforms = provider.getSortedPlatforms();
                  
                  return GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: crossAxisCount,
                      childAspectRatio: 1.25,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 6,
                    ),
                    itemCount: sortedPlatforms.length,
                    itemBuilder: (context, index) {
                      final platform = sortedPlatforms[index];
                      final connectedAcc = provider.getConnectedAccount(platform['id']);
                      
                      return AccountTile(
                        platformId: platform['id'],
                        platformName: platform['name'],
                        icon: platform['icon'],
                        isConnected: connectedAcc != null,
                        accountName: connectedAcc?['account_name'],
                      );
                    },
                  );
                },
              ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }
}
