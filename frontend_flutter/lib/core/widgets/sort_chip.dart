import 'package:flutter/material.dart';

class SortChip extends StatelessWidget {
  final String label;
  final String value;
  final String groupValue;
  final ValueChanged<String> onSelected;

  const SortChip({
    super.key,
    required this.label,
    required this.value,
    required this.groupValue,
    required this.onSelected,
  });

  @override
  Widget build(BuildContext context) {
    final isSelected = groupValue == value;
    final colorScheme = Theme.of(context).colorScheme;
    
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      showCheckmark: false,
      onSelected: (_) => onSelected(value),
      selectedColor: colorScheme.primary.withValues(alpha: 0.15),
      backgroundColor: Colors.transparent,
      side: BorderSide(
        color: isSelected 
          ? colorScheme.primary.withValues(alpha: 0.5) 
          : Colors.white.withValues(alpha: 0.1)
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20)
      ),
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 0),
      labelStyle: TextStyle(
        color: isSelected ? colorScheme.primary : Colors.white60,
        fontSize: 13,
        fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
      ),
    );
  }
}
