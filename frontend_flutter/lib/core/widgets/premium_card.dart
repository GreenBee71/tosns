import 'package:flutter/material.dart';

class PremiumCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final double? width;
  final double? height;
  final VoidCallback? onTap;
  final bool isSelected;
  final List<BoxShadow>? boxShadow;
  final Color? borderColor;

  const PremiumCard({
    super.key,
    required this.child,
    this.padding,
    this.width,
    this.height,
    this.onTap,
    this.isSelected = false,
    this.boxShadow,
    this.borderColor,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(24),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        width: width,
        height: height,
        padding: padding ?? const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: isSelected 
              ? colorScheme.primary.withValues(alpha: 0.08) 
              : colorScheme.surface.withValues(alpha: 0.8),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: isSelected 
                ? colorScheme.primary 
                : (borderColor ?? Colors.white.withValues(alpha: 0.05)),
            width: isSelected ? 2 : 1,
          ),
          boxShadow: boxShadow ?? (isSelected ? [
            BoxShadow(
              color: colorScheme.primary.withValues(alpha: 0.15),
              blurRadius: 15,
              offset: const Offset(0, 8),
            )
          ] : [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.2),
              blurRadius: 10,
              offset: const Offset(0, 4),
            )
          ]),
        ),
        child: child,
      ),
    );
  }
}
